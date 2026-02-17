/**
 * NPC response engine for the Engage phase.
 *
 * MVP implementation: uses situation model dialogue lines as NPC responses
 * rather than calling Claude API. Applies feedbackLayer to classify user
 * input and generate contextually appropriate feedback.
 *
 * When the Edge Function is ready, this can be swapped to call the real API.
 */

import {
  classifyFeedback,
  classifyErrorType,
  type FeedbackType,
  type FeedbackResult,
} from "./feedbackLayer";

export interface NpcResponse {
  text: string;
  feedbackType: FeedbackType;
  recastHighlight?: string;
  metaHint?: string;
  shouldEnd: boolean;
}

/**
 * Clarification phrases the NPC uses (stays in character).
 */
const CLARIFICATION_PHRASES = [
  "すみません、もういちどおねがいします。",
  "もう一度おっしゃっていただけますか？",
  "ちょっと聞き取れませんでした。もう一度お願いします。",
];

/**
 * Build a recast NPC response that naturally includes the corrected form.
 * The NPC restates what the user meant to say in correct Japanese.
 */
function buildRecastResponse(
  expectedUserText: string,
  nextNpcLine: string | null,
  recastHighlight: string,
): string {
  // If there's a next NPC line, prefix it with a natural acknowledgment
  // that includes the correct form
  if (nextNpcLine) {
    return `「${expectedUserText}」ですね。${nextNpcLine}`;
  }
  return `「${expectedUserText}」ですね。`;
}

/**
 * Pick a random clarification phrase.
 */
function pickClarification(): string {
  const idx = Math.floor(Math.random() * CLARIFICATION_PHRASES.length);
  return CLARIFICATION_PHRASES[idx];
}

/**
 * Generate an NPC response for the conversation.
 *
 * For MVP, this uses the model dialogue lines as a script:
 * - NPC lines are returned in order
 * - User input is classified via feedbackLayer
 * - Recasts and clarifications are generated without API calls
 */
export async function generateNpcResponse(params: {
  situation: string;
  userMessage: string;
  conversationHistory: { role: "npc" | "user"; text: string }[];
  expectedResponse?: string;
  errorHistory: { text: string; type: string }[];
  turnNumber: number;
  /** The next NPC line from the model dialogue (if available) */
  nextNpcLine?: string;
  /** Total dialogue turns in this situation */
  totalTurns?: number;
}): Promise<NpcResponse> {
  const {
    userMessage,
    expectedResponse,
    errorHistory,
    turnNumber,
    nextNpcLine,
    totalTurns = 10,
  } = params;

  // Determine if conversation should end (5-7 turns)
  const shouldEnd = turnNumber >= Math.min(totalTurns - 1, 7);

  // If no expected response, just return the next NPC line
  if (!expectedResponse) {
    return {
      text: nextNpcLine ?? "はい。",
      feedbackType: "none",
      shouldEnd,
    };
  }

  // Classify user input
  const feedback: FeedbackResult = classifyFeedback({
    userText: userMessage,
    expectedText: expectedResponse,
    errorHistory,
  });

  switch (feedback.type) {
    case "none":
      // User got it right — continue with next NPC line
      return {
        text: nextNpcLine ?? "はい、ありがとうございます。",
        feedbackType: "none",
        shouldEnd,
      };

    case "recast":
      return {
        text: buildRecastResponse(
          expectedResponse,
          nextNpcLine ?? null,
          feedback.recastHighlight ?? "",
        ),
        feedbackType: "recast",
        recastHighlight: feedback.recastHighlight,
        shouldEnd,
      };

    case "clarification":
      return {
        text: pickClarification(),
        feedbackType: "clarification",
        shouldEnd: false, // Don't end on clarification — give user another chance
      };

    case "meta_hint":
      return {
        text: nextNpcLine
          ? `「${expectedResponse}」ですね。${nextNpcLine}`
          : `「${expectedResponse}」ですね。`,
        feedbackType: "meta_hint",
        recastHighlight: feedback.recastHighlight,
        metaHint: feedback.metaHint,
        shouldEnd,
      };
  }
}

/**
 * Build an updated error history entry for tracking repeated errors.
 */
export function buildErrorEntry(
  userText: string,
  expectedText: string,
): { text: string; type: string } {
  return {
    text: userText,
    type: classifyErrorType(userText, expectedText),
  };
}
