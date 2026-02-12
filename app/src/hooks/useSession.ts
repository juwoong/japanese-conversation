/**
 * Hook for managing learning sessions
 */

import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { schedule, createCard, getRatingFromAccuracy, type Rating } from "../lib/fsrs";
import { compareText, type DiffSegment } from "../lib/textDiff";
import type { Line, Situation, SRSCard } from "../types";

interface SessionState {
  loading: boolean;
  lines: Line[];
  currentIndex: number;
  situation: Situation | null;
  completed: boolean;
  error: string | null;
}

interface UseSessionReturn extends SessionState {
  moveNext: () => void;
  submitAttempt: (userInput: string, expectedText: string) => Promise<{
    accuracy: number;
    rating: Rating;
    feedback: string;
    diffSegments: DiffSegment[];
  }>;
  reset: () => void;
}

export function useSession(situationId: number): UseSessionReturn {
  const [state, setState] = useState<SessionState>({
    loading: true,
    lines: [],
    currentIndex: 0,
    situation: null,
    completed: false,
    error: null,
  });

  useEffect(() => {
    loadSession();
  }, [situationId]);

  const loadSession = async () => {
    try {
      setState((s) => ({ ...s, loading: true, error: null }));

      // Load situation
      const { data: situation, error: situationError } = await supabase
        .from("situations")
        .select("*")
        .eq("id", situationId)
        .single();

      if (situationError) throw situationError;

      // Load lines
      const { data: lines, error: linesError } = await supabase
        .from("lines")
        .select("*")
        .eq("situation_id", situationId)
        .order("line_order");

      if (linesError) throw linesError;

      setState({
        loading: false,
        lines: lines || [],
        currentIndex: 0,
        situation,
        completed: false,
        error: null,
      });
    } catch (error) {
      console.error("Failed to load session:", error);
      setState((s) => ({
        ...s,
        loading: false,
        error: "세션을 불러오는데 실패했습니다.",
      }));
    }
  };

  const moveNext = useCallback(() => {
    setState((s) => {
      if (s.currentIndex >= s.lines.length - 1) {
        return { ...s, completed: true };
      }
      return { ...s, currentIndex: s.currentIndex + 1 };
    });
  }, []);

  const submitAttempt = useCallback(
    async (
      userInput: string,
      expectedText: string
    ): Promise<{ accuracy: number; rating: Rating; feedback: string; diffSegments: DiffSegment[] }> => {
      const currentLine = state.lines[state.currentIndex];
      if (!currentLine) {
        throw new Error("No current line");
      }

      // Calculate accuracy using Myers diff with Japanese normalization
      const diffResult = compareText(expectedText, userInput);
      const accuracy = diffResult.score / 100;
      const diffSegments = diffResult.segments;
      const rating = getRatingFromAccuracy(accuracy);

      // Get user
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("Not authenticated");
      }

      // Get or create SRS card
      let { data: existingCard } = await supabase
        .from("srs_cards")
        .select("*")
        .eq("user_id", user.id)
        .eq("line_id", currentLine.id)
        .single();

      let card = existingCard
        ? {
            due: new Date(existingCard.due_date || new Date()),
            stability: existingCard.stability,
            difficulty: existingCard.difficulty,
            elapsedDays: existingCard.elapsed_days,
            scheduledDays: existingCard.scheduled_days,
            reps: existingCard.reps,
            lapses: existingCard.lapses,
            state: existingCard.state as any,
            lastReview: existingCard.last_review
              ? new Date(existingCard.last_review)
              : null,
          }
        : createCard();

      // Schedule next review
      const { card: newCard } = schedule(card, rating);

      // Upsert SRS card
      await supabase.from("srs_cards").upsert({
        id: existingCard?.id,
        user_id: user.id,
        line_id: currentLine.id,
        stability: newCard.stability,
        difficulty: newCard.difficulty,
        elapsed_days: newCard.elapsedDays,
        scheduled_days: newCard.scheduledDays,
        reps: newCard.reps,
        lapses: newCard.lapses,
        state: newCard.state,
        due_date: newCard.due.toISOString().split("T")[0],
        last_review: newCard.lastReview?.toISOString() || null,
      });

      // Record attempt
      await supabase.from("user_attempts").insert({
        user_id: user.id,
        line_id: currentLine.id,
        user_input: userInput,
        is_correct: accuracy >= 0.8,
        accuracy,
        rating,
      });

      // Generate feedback
      let feedback = "";
      if (accuracy >= 0.95) {
        feedback = "완벽해요!";
      } else if (accuracy >= 0.8) {
        feedback = "잘했어요!";
      } else if (accuracy >= 0.5) {
        feedback = "조금 더 연습해보세요.";
      } else {
        feedback = "다시 시도해보세요.";
      }

      return { accuracy, rating, feedback, diffSegments };
    },
    [state.lines, state.currentIndex]
  );

  const reset = useCallback(() => {
    setState((s) => ({ ...s, currentIndex: 0, completed: false }));
  }, []);

  return {
    ...state,
    moveNext,
    submitAttempt,
    reset,
  };
}

