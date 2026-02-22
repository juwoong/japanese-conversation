/**
 * Hook for managing the 4-phase learning session:
 * Watch -> Catch -> Engage -> Review
 *
 * Wraps useSession and adds phase management on top.
 */

import { useState, useCallback, useMemo } from "react";
import { useSession } from "./useSession";
import { getVariationData } from "../lib/variationEngine";
import type { SessionPhase, SessionMode, ModelLine, KeyExpression, Line } from "../types";

interface FourPhaseState {
  phase: SessionPhase;
  inputMode: SessionMode;
  visitCount: number;
}

export interface VariationInfo {
  slug: string;
  newExpressions: string[];
  reusedFromBase: string[];
}

interface UseFourPhaseSessionReturn {
  // Underlying session data
  loading: boolean;
  error: string | null;
  situation: ReturnType<typeof useSession>["situation"];
  lines: Line[];

  // Phase state
  phase: SessionPhase;
  inputMode: SessionMode;
  visitCount: number;

  // Variation
  variationInfo: VariationInfo | null;

  // Derived data
  modelDialogue: ModelLine[];
  keyExpressions: KeyExpression[];

  // Actions
  setInputMode: (mode: SessionMode) => void;
  advancePhase: () => void;

  // Pass-through from useSession for Engage phase
  session: ReturnType<typeof useSession>;
}

export function useFourPhaseSession(
  situationId: number,
  variationSlug?: string,
): UseFourPhaseSessionReturn {
  const session = useSession(situationId);

  // 변주 시나리오 메타데이터
  const variationInfo = useMemo<VariationInfo | null>(() => {
    if (!variationSlug) return null;
    const data = getVariationData(variationSlug);
    if (!data) return null;
    return {
      slug: variationSlug,
      newExpressions: data.newExpressions,
      reusedFromBase: data.reusedFromBase,
    };
  }, [variationSlug]);

  const [state, setState] = useState<FourPhaseState>({
    phase: "watch",
    inputMode: "voice",
    visitCount: 1,
  });

  // Convert DB lines to ModelLine format for Watch phase
  const modelDialogue = useMemo<ModelLine[]>(() => {
    return session.lines.map((line, index) => ({
      lineIndex: index,
      speaker: line.speaker,
      textJa: line.text_ja,
      textKo: line.text_ko,
      furigana: line.furigana,
      isKeyExpression: line.speaker === "user",
      audioPlayed: false,
    }));
  }, [session.lines]);

  // Extract key expressions (user lines are the ones to practice)
  const keyExpressions = useMemo<KeyExpression[]>(() => {
    return session.lines
      .filter((line) => line.speaker === "user")
      .map((line) => {
        // Find the preceding NPC line for PictureSpeak prompt
        const idx = session.lines.indexOf(line);
        let npcPrompt = "";
        for (let j = idx - 1; j >= 0; j--) {
          if (session.lines[j].speaker === "npc") {
            npcPrompt = session.lines[j].text_ja;
            break;
          }
        }
        return {
          textJa: line.text_ja,
          textKo: line.text_ko,
          furigana: line.furigana,
          npcPrompt,
        };
      });
  }, [session.lines]);

  const setInputMode = useCallback((mode: SessionMode) => {
    setState((s) => ({ ...s, inputMode: mode }));
  }, []);

  const advancePhase = useCallback(() => {
    setState((s) => {
      const order: SessionPhase[] = ["watch", "catch", "engage", "review"];
      const currentIdx = order.indexOf(s.phase);
      if (currentIdx < order.length - 1) {
        return { ...s, phase: order[currentIdx + 1] };
      }
      // After review, cycle back to watch with incremented visit
      return { ...s, phase: "watch", visitCount: s.visitCount + 1 };
    });
  }, []);

  return {
    loading: session.loading,
    error: session.error,
    situation: session.situation,
    lines: session.lines,
    phase: state.phase,
    inputMode: state.inputMode,
    visitCount: state.visitCount,
    variationInfo,
    modelDialogue,
    keyExpressions,
    setInputMode,
    advancePhase,
    session,
  };
}
