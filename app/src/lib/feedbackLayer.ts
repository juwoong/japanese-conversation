/**
 * Feedback classification for NPC conversation engine.
 *
 * Classifies user input into one of four feedback types:
 * - none: correct or close enough, no feedback needed
 * - recast: meaning OK but form differs — NPC restates correctly
 * - clarification: meaning unclear — NPC asks user to repeat
 * - meta_hint: same error type 2+ times — provide a Korean hint
 *
 * Uses japaneseNormalize for text comparison.
 */

import { normalizeJapanese } from "./japaneseNormalize";

export type FeedbackType = "none" | "recast" | "clarification" | "meta_hint";

export interface FeedbackResult {
  type: FeedbackType;
  /** The corrected form to highlight in a recast response */
  recastHighlight?: string;
  /** Korean meta-linguistic hint for repeated errors */
  metaHint?: string;
}

/**
 * Normalize Japanese text for comparison.
 * Strips punctuation, whitespace, converts katakana to hiragana.
 */
function norm(text: string): string {
  return normalizeJapanese(text);
}

/**
 * Check if two Japanese strings convey the same meaning.
 * Uses character overlap ratio — if 60%+ characters match, meaning is likely OK.
 */
function meaningMatches(userNorm: string, expectedNorm: string): boolean {
  if (userNorm === expectedNorm) return true;
  if (userNorm.length === 0 || expectedNorm.length === 0) return false;

  // Check if one contains the other (common with polite/casual form differences)
  if (userNorm.includes(expectedNorm) || expectedNorm.includes(userNorm)) {
    return true;
  }

  // Character overlap ratio
  let matchCount = 0;
  const expectedChars = [...expectedNorm];
  const userChars = [...userNorm];
  const used = new Set<number>();

  for (const uc of userChars) {
    for (let j = 0; j < expectedChars.length; j++) {
      if (!used.has(j) && expectedChars[j] === uc) {
        matchCount++;
        used.add(j);
        break;
      }
    }
  }

  const ratio = matchCount / Math.max(expectedChars.length, userChars.length);
  return ratio >= 0.6;
}

/**
 * Check if the form exactly matches (after normalization).
 */
function formMatches(userNorm: string, expectedNorm: string): boolean {
  return userNorm === expectedNorm;
}

/**
 * Detect which part of the expected text the user got wrong (for recast highlight).
 * Returns the portion of expected text that differs.
 */
function findDifference(userNorm: string, expectedNorm: string): string {
  // Find the longest common prefix
  let prefixLen = 0;
  while (
    prefixLen < userNorm.length &&
    prefixLen < expectedNorm.length &&
    userNorm[prefixLen] === expectedNorm[prefixLen]
  ) {
    prefixLen++;
  }

  // Find the longest common suffix
  let suffixLen = 0;
  while (
    suffixLen < userNorm.length - prefixLen &&
    suffixLen < expectedNorm.length - prefixLen &&
    userNorm[userNorm.length - 1 - suffixLen] ===
      expectedNorm[expectedNorm.length - 1 - suffixLen]
  ) {
    suffixLen++;
  }

  // The different part in the expected text
  const diffStart = prefixLen;
  const diffEnd = expectedNorm.length - suffixLen;
  return diffStart < diffEnd ? expectedNorm.slice(diffStart, diffEnd) : expectedNorm;
}

/**
 * Determine the error type for error history tracking.
 */
export function classifyErrorType(userText: string, expectedText: string): string {
  const userN = norm(userText);
  const expectedN = norm(expectedText);

  if (userN === expectedN) return "none";

  // Check for common Japanese error patterns
  // Particle error: で/に/を/は/が/と/も/から/まで misuse
  const particles = ["で", "に", "を", "は", "が", "と", "も", "から", "まで", "へ"];
  for (const p of particles) {
    const userHas = userN.includes(p);
    const expectedHas = expectedN.includes(p);
    if (userHas !== expectedHas) return "particle";
  }

  // Conjugation error: verb ending differences
  const verbEndings = ["ます", "ません", "ました", "ください", "たい", "ている", "てください"];
  for (const ending of verbEndings) {
    if (userN.endsWith(ending) !== expectedN.endsWith(ending)) return "conjugation";
  }

  // Politeness level: です/ます vs casual
  if (
    (userN.includes("です") !== expectedN.includes("です")) ||
    (userN.includes("ます") !== expectedN.includes("ます"))
  ) {
    return "politeness";
  }

  return "other";
}

/**
 * Classify the feedback type based on user input vs expected text.
 */
export function classifyFeedback(params: {
  userText: string;
  expectedText: string;
  errorHistory: { text: string; type: string }[];
}): FeedbackResult {
  const { userText, expectedText, errorHistory } = params;
  const userNorm = norm(userText);
  const expectedNorm = norm(expectedText);

  // Exact match — no feedback needed
  if (formMatches(userNorm, expectedNorm)) {
    return { type: "none" };
  }

  // Check error history for repeated error types
  const currentErrorType = classifyErrorType(userText, expectedText);
  const sameTypeCount = errorHistory.filter((e) => e.type === currentErrorType).length;

  if (sameTypeCount >= 2) {
    const hints: Record<string, string> = {
      particle: "で, に, を 같은 작은 단어를 모델과 비교해보세요",
      conjugation: "문장 끝부분을 모델 대화와 비교해보세요",
      politeness: "정중한 표현을 써보세요",
      other: "모델 대화를 다시 들어보세요",
    };
    return {
      type: "meta_hint",
      metaHint: hints[currentErrorType] ?? hints.other,
      recastHighlight: findDifference(userNorm, expectedNorm),
    };
  }

  // Meaning matches but form is wrong — recast
  if (meaningMatches(userNorm, expectedNorm)) {
    return {
      type: "recast",
      recastHighlight: findDifference(userNorm, expectedNorm),
    };
  }

  // Meaning doesn't match — clarification
  return { type: "clarification" };
}
