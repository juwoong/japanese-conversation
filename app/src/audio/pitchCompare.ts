/**
 * H/L binary pattern comparison for Japanese pitch accent.
 * Compares user's pitch contour against reference H/L pattern at mora level.
 */

import type { PitchPoint } from "./pitchConfig";
import type {
  ReferencePitchData,
  MoraComparisonResult,
  ComparisonResult,
  PitchRating,
} from "../types/pitch";
import { meanCenter, averageSemitone } from "./pitchMath";
import { divideIntoSegments } from "./moraSegmenter";

/** Threshold in semitones: if mora avg > utterance mean → H, else → L */
const HL_THRESHOLD_SEMITONES = 0.5;

/** Score thresholds */
const SCORE_EXCELLENT = 85;
const SCORE_GOOD = 65;
const SCORE_FAIR = 40;

/** Accent nucleus bonus weight (getting the drop right matters most) */
const ACCENT_NUCLEUS_WEIGHT = 1.5;

/**
 * Compare user's pitch points against a reference H/L pattern.
 *
 * Algorithm:
 * 1. Extract voiced semitone values from PitchPoints
 * 2. Divide into N mora-sized segments (N = totalMoras from reference)
 * 3. Compute average semitone per segment
 * 4. Mean-center the averages
 * 5. Classify each as H (> threshold) or L (<= threshold)
 * 6. Compare against reference pattern
 */
export function comparePitch(
  userPoints: PitchPoint[],
  reference: ReferencePitchData,
): ComparisonResult {
  // Extract semitone values (keep nulls for unvoiced frames)
  const semitones = userPoints.map((p) => p.semitone);

  // Strip leading/trailing silence (null values)
  const trimmed = trimSilence(semitones);
  if (trimmed.length < 3) {
    return emptyResult(reference, "음성이 너무 짧습니다. 다시 시도해주세요.");
  }

  // Flatten all moras from all accent phrases
  const allMoras = reference.accentPhrases.flatMap((ap) => ap.moras);
  const scorableMoras = allMoras.filter((m) => m.pitch !== null);

  if (scorableMoras.length === 0) {
    return emptyResult(reference, "비교할 수 있는 모라가 없습니다.");
  }

  // Divide user pitch into mora-sized segments
  const segments = divideIntoSegments(trimmed, allMoras.length);

  // Compute average semitone per segment
  const moraAverages = segments.map((seg) => averageSemitone(seg));

  // Mean-center the averages (speaker normalization)
  const centered = meanCenter(moraAverages);

  // Classify each mora as H or L
  const moraResults: MoraComparisonResult[] = allMoras.map((mora, i) => {
    const userSemitone = centered[i] ?? null;
    let detected: "H" | "L" | null = null;

    if (userSemitone !== null) {
      detected = userSemitone > HL_THRESHOLD_SEMITONES ? "H" : "L";
    }

    const correct =
      mora.pitch === null || // geminate — always "correct"
      detected === mora.pitch;

    return {
      mora: mora.mora,
      expected: mora.pitch,
      detected,
      correct,
      userSemitone,
    };
  });

  // Calculate score with accent nucleus weighting
  let weightedCorrect = 0;
  let totalWeight = 0;

  // Find accent nucleus indices
  const nucleusIndices = new Set<number>();
  let moraOffset = 0;
  for (const ap of reference.accentPhrases) {
    if (ap.accentNucleus !== null) {
      nucleusIndices.add(moraOffset + ap.accentNucleus);
      // Also weight the mora right after the nucleus (the L after the drop)
      if (moraOffset + ap.accentNucleus + 1 < allMoras.length) {
        nucleusIndices.add(moraOffset + ap.accentNucleus + 1);
      }
    }
    moraOffset += ap.moras.length;
  }

  moraResults.forEach((result, i) => {
    if (result.expected === null) return; // skip geminate

    const weight = nucleusIndices.has(i) ? ACCENT_NUCLEUS_WEIGHT : 1.0;
    totalWeight += weight;
    if (result.correct) {
      weightedCorrect += weight;
    }
  });

  const score = totalWeight > 0 ? Math.round((weightedCorrect / totalWeight) * 100) : 0;
  const correctCount = moraResults.filter((r) => r.correct && r.expected !== null).length;
  const totalScorable = scorableMoras.length;

  // Check accent nucleus correctness
  const accentNucleusCorrect = checkAccentNucleus(moraResults, reference);

  // Generate feedback
  const feedback = generateFeedback(score, moraResults, reference, accentNucleusCorrect);

  return {
    score,
    moraResults,
    correctCount,
    totalScorable,
    accentNucleusCorrect,
    feedback,
  };
}

export function scoreToRating(score: number): PitchRating {
  if (score >= SCORE_EXCELLENT) return "excellent";
  if (score >= SCORE_GOOD) return "good";
  if (score >= SCORE_FAIR) return "fair";
  return "needs_work";
}

// --- Internal helpers ---

function trimSilence(semitones: (number | null)[]): (number | null)[] {
  let start = 0;
  while (start < semitones.length && semitones[start] === null) start++;

  let end = semitones.length - 1;
  while (end > start && semitones[end] === null) end--;

  return semitones.slice(start, end + 1);
}

function checkAccentNucleus(
  moraResults: MoraComparisonResult[],
  reference: ReferencePitchData,
): boolean {
  let moraOffset = 0;
  for (const ap of reference.accentPhrases) {
    if (ap.accentNucleus !== null) {
      const nucleusIdx = moraOffset + ap.accentNucleus;
      const afterIdx = nucleusIdx + 1;

      // The nucleus mora should be H and the next should be L
      if (nucleusIdx < moraResults.length && afterIdx < moraResults.length) {
        const nucleusMora = moraResults[nucleusIdx];
        const afterMora = moraResults[afterIdx];
        if (nucleusMora.detected !== "H" || afterMora.detected !== "L") {
          return false;
        }
      }
    }
    moraOffset += ap.moras.length;
  }
  return true;
}

function generateFeedback(
  score: number,
  moraResults: MoraComparisonResult[],
  reference: ReferencePitchData,
  accentNucleusCorrect: boolean,
): string {
  const rating = scoreToRating(score);

  if (rating === "excellent") {
    return "아주 좋아요! 억양이 정확합니다.";
  }

  if (rating === "good") {
    if (!accentNucleusCorrect) {
      return "전체적으로 좋지만, 악센트 핵(피치가 떨어지는 위치)을 확인해보세요.";
    }
    return "좋아요! 약간의 미세한 차이만 있습니다.";
  }

  // Find wrong moras for specific feedback
  const wrongMoras = moraResults
    .filter((r) => !r.correct && r.expected !== null)
    .map((r) => `「${r.mora}」`);

  if (rating === "fair") {
    if (wrongMoras.length <= 3) {
      return `${wrongMoras.join(", ")}의 높낮이를 확인해보세요.`;
    }
    return "전체적인 억양 패턴을 다시 들어보세요.";
  }

  // needs_work
  if (!accentNucleusCorrect) {
    return "악센트 위치가 다릅니다. 기준 패턴을 잘 들어보고 다시 시도해보세요.";
  }
  return "억양 패턴이 많이 다릅니다. 천천히 따라해보세요.";
}

function emptyResult(reference: ReferencePitchData, feedback: string): ComparisonResult {
  const allMoras = reference.accentPhrases.flatMap((ap) => ap.moras);
  return {
    score: 0,
    moraResults: allMoras.map((m) => ({
      mora: m.mora,
      expected: m.pitch,
      detected: null,
      correct: false,
      userSemitone: null,
    })),
    correctCount: 0,
    totalScorable: allMoras.filter((m) => m.pitch !== null).length,
    accentNucleusCorrect: false,
    feedback,
  };
}
