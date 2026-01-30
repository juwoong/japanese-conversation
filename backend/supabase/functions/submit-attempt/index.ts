// submit-attempt/index.ts
// Scores user attempt and updates FSRS card

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SubmitAttemptRequest {
  lineId: number;
  userInput: string;
  expectedText: string;
}

interface SubmitAttemptResponse {
  isCorrect: boolean;
  accuracy: number;
  rating: number; // FSRS rating 1-4
  feedback: string;
  nextReviewDate: string | null;
}

// Simple text similarity using Levenshtein distance
function calculateSimilarity(a: string, b: string): number {
  // Normalize Japanese text (remove spaces, convert to lowercase for romaji)
  const normalize = (s: string) =>
    s.replace(/\s/g, "").replace(/[　]/g, "").toLowerCase();

  const s1 = normalize(a);
  const s2 = normalize(b);

  if (s1 === s2) return 1;
  if (s1.length === 0 || s2.length === 0) return 0;

  const len1 = s1.length;
  const len2 = s2.length;
  const matrix: number[][] = [];

  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }

  const distance = matrix[len1][len2];
  const maxLen = Math.max(len1, len2);
  return 1 - distance / maxLen;
}

// Convert accuracy to FSRS rating
function getrating(accuracy: number): number {
  if (accuracy >= 0.95) return 4; // Easy
  if (accuracy >= 0.8) return 3; // Good
  if (accuracy >= 0.5) return 2; // Hard
  return 1; // Again
}

// Simple FSRS-like scheduling
function calculateNextReview(rating: number, reps: number, stability: number): {
  nextDate: Date;
  newStability: number;
  newDifficulty: number;
} {
  const now = new Date();
  let interval: number;
  let newStability = stability;
  let newDifficulty = 0.3; // Default difficulty

  if (rating === 1) {
    // Again - reset
    interval = 1;
    newStability = Math.max(1, stability * 0.5);
  } else if (rating === 2) {
    // Hard
    interval = Math.max(1, Math.floor(stability * 0.8));
    newStability = stability * 1.2;
    newDifficulty = 0.5;
  } else if (rating === 3) {
    // Good
    interval = Math.floor(stability * 2);
    newStability = stability * 2.5;
    newDifficulty = 0.3;
  } else {
    // Easy
    interval = Math.floor(stability * 3);
    newStability = stability * 3;
    newDifficulty = 0.1;
  }

  // First review bonuses
  if (reps === 0) {
    interval = rating >= 3 ? 1 : 0;
    newStability = rating >= 3 ? 4 : 1;
  } else if (reps === 1) {
    interval = rating >= 3 ? 3 : 1;
    newStability = rating >= 3 ? 8 : 2;
  }

  const nextDate = new Date(now);
  nextDate.setDate(nextDate.getDate() + interval);

  return { nextDate, newStability, newDifficulty };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { lineId, userInput, expectedText }: SubmitAttemptRequest = await req.json();

    // Calculate accuracy
    const accuracy = calculateSimilarity(userInput, expectedText);
    const rating = getRating(accuracy);
    const isCorrect = accuracy >= 0.8;

    // Get or create SRS card
    let { data: card } = await supabase
      .from("srs_cards")
      .select("*")
      .eq("user_id", user.id)
      .eq("line_id", lineId)
      .single();

    if (!card) {
      // Create new card
      const { data: newCard } = await supabase
        .from("srs_cards")
        .insert({
          user_id: user.id,
          line_id: lineId,
          stability: 1,
          difficulty: 0.3,
          reps: 0,
          lapses: 0,
          state: "new",
        })
        .select()
        .single();

      card = newCard;
    }

    // Calculate next review
    const { nextDate, newStability, newDifficulty } = calculateNextReview(
      rating,
      card?.reps || 0,
      card?.stability || 1
    );

    // Update SRS card
    const newState = rating === 1 ? "relearning" : rating >= 3 ? "review" : "learning";
    const newReps = (card?.reps || 0) + 1;
    const newLapses = rating === 1 ? (card?.lapses || 0) + 1 : (card?.lapses || 0);

    await supabase
      .from("srs_cards")
      .update({
        stability: newStability,
        difficulty: newDifficulty,
        reps: newReps,
        lapses: newLapses,
        state: newState,
        due_date: nextDate.toISOString().split("T")[0],
        last_review: new Date().toISOString(),
      })
      .eq("id", card?.id);

    // Record attempt
    await supabase.from("user_attempts").insert({
      user_id: user.id,
      line_id: lineId,
      srs_card_id: card?.id,
      user_input: userInput,
      is_correct: isCorrect,
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

    const response: SubmitAttemptResponse = {
      isCorrect,
      accuracy,
      rating,
      feedback,
      nextReviewDate: nextDate.toISOString().split("T")[0],
    };

    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in submit-attempt:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
