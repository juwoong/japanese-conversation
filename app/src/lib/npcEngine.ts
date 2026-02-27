/**
 * NPC response engine for the Engage phase.
 *
 * Claude API를 Supabase Edge Function으로 호출하여 NPC 응답 생성.
 * Edge Function 실패 시 로컬 MVP 로직으로 폴백.
 */

import {
  classifyFeedback,
  classifyErrorType,
  type FeedbackType,
  type FeedbackResult,
} from "./feedbackLayer";
import { supabase } from "./supabase";

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
 */
function buildRecastResponse(
  expectedUserText: string,
  nextNpcLine: string | null,
  recastHighlight: string,
): string {
  if (nextNpcLine) {
    return `「${expectedUserText}」ですね。${nextNpcLine}`;
  }
  return `「${expectedUserText}」ですね。`;
}

function pickClarification(): string {
  const idx = Math.floor(Math.random() * CLARIFICATION_PHRASES.length);
  return CLARIFICATION_PHRASES[idx];
}

/**
 * 로컬 MVP 폴백 로직 — Edge Function 실패 시 사용
 */
function generateLocalResponse(params: {
  userMessage: string;
  expectedResponse: string;
  errorHistory: { text: string; type: string }[];
  nextNpcLine?: string;
  shouldEnd: boolean;
}): NpcResponse {
  const { userMessage, expectedResponse, errorHistory, nextNpcLine, shouldEnd } = params;

  const feedback: FeedbackResult = classifyFeedback({
    userText: userMessage,
    expectedText: expectedResponse,
    errorHistory,
  });

  switch (feedback.type) {
    case "none":
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
        shouldEnd: false,
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
 * Edge Function을 호출하여 Claude API NPC 응답 생성.
 * 실패 시 null 반환 → 호출부에서 폴백 처리.
 */
async function callNpcEdgeFunction(params: {
  userText: string;
  expectedText: string;
  situation: string;
  nextNpcLine?: string;
  errorHistory: { text: string; type: string }[];
  personaSlug?: string;
}): Promise<{
  npcText: string;
  feedbackType: FeedbackType;
  recastHighlight?: string;
  metaHint?: string;
} | null> {
  try {
    const { data, error } = await supabase.functions.invoke("npc-respond", {
      body: {
        userText: params.userText,
        expectedText: params.expectedText,
        situation: params.situation,
        nextNpcLine: params.nextNpcLine,
        errorHistory: params.errorHistory,
        personaSlug: params.personaSlug,
      },
    });

    if (error) {
      console.warn("npc-respond Edge Function error:", error);
      return null;
    }

    // 응답 검증
    if (!data?.npcText || !data?.feedbackType) {
      console.warn("npc-respond: invalid response shape", data);
      return null;
    }

    return {
      npcText: data.npcText,
      feedbackType: data.feedbackType,
      recastHighlight: data.recastHighlight,
      metaHint: data.metaHint,
    };
  } catch (err) {
    console.warn("npc-respond call failed:", err);
    return null;
  }
}

/**
 * NPC 응답 생성 — Claude API 우선, 실패 시 로컬 폴백.
 * 인터페이스는 기존과 동일 (EngagePhase 변경 불필요).
 */
export async function generateNpcResponse(params: {
  situation: string;
  userMessage: string;
  expectedResponse?: string;
  errorHistory: { text: string; type: string }[];
  turnNumber: number;
  nextNpcLine?: string;
  totalTurns?: number;
  personaSlug?: string;
}): Promise<NpcResponse> {
  const {
    situation,
    userMessage,
    expectedResponse,
    errorHistory,
    turnNumber,
    nextNpcLine,
    totalTurns = 10,
    personaSlug,
  } = params;

  const shouldEnd = turnNumber >= Math.min(totalTurns - 1, 7);

  // expectedResponse 없으면 다음 NPC 대사 반환
  if (!expectedResponse) {
    return {
      text: nextNpcLine ?? "はい。",
      feedbackType: "none",
      shouldEnd,
    };
  }

  // Claude API 호출 시도
  const apiResult = await callNpcEdgeFunction({
    userText: userMessage,
    expectedText: expectedResponse,
    situation,
    nextNpcLine,
    errorHistory,
    personaSlug,
  });

  if (apiResult) {
    return {
      text: apiResult.npcText,
      feedbackType: apiResult.feedbackType,
      recastHighlight: apiResult.recastHighlight,
      metaHint: apiResult.metaHint,
      shouldEnd: apiResult.feedbackType === "clarification" ? false : shouldEnd,
    };
  }

  // 폴백: 로컬 MVP 로직
  return generateLocalResponse({
    userMessage,
    expectedResponse,
    errorHistory,
    nextNpcLine,
    shouldEnd,
  });
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
