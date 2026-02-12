/**
 * DTW pitch comparison configuration.
 * Parameters validated by TTS/STT Expert for Japanese speech.
 *
 * Phase 2 of pronunciation feedback system.
 * Depends on: pitchConfig.ts (Phase 1)
 *
 * Reference: docs/phase2-dtw-parameter-sheet.md
 */

import type { PitchPoint } from "./pitchConfig";

// ─── Preprocessing: Edge Stripping ──────────────────────────────

export const EDGE_STRIP_CONFIG = {
  /** Minimum consecutive voiced frames to mark speech onset (~96ms) */
  minOnsetFrames: 3,
  /** Minimum consecutive voiced frames to mark speech offset (~64ms) */
  minOffsetFrames: 2,
} as const;

// ─── Preprocessing: Null Gap Interpolation ──────────────────────

export const INTERPOLATION_CONFIG = {
  /** Max consecutive null frames to linearly interpolate (~128ms, covers unvoiced consonants) */
  maxGapFrames: 4,
  /** Gaps longer than this are segment boundaries (~256ms, actual phrase pause) */
  segmentBreakFrames: 8,
} as const;

// ─── Preprocessing: Smoothing ───────────────────────────────────

export const SMOOTHING_CONFIG = {
  /**
   * Median filter window size (must be odd).
   * Median preserves H->L accent edges while removing pitch tracker jitter.
   * Moving average would blur the accent transition — avoid.
   */
  windowSize: 3,
} as const;

// ─── Preprocessing: Normalization ───────────────────────────────

export const NORMALIZATION_CONFIG = {
  /**
   * Per-utterance mean subtraction.
   * Removes speaker baseline (male ~120Hz vs female ~250Hz).
   * Japanese pitch accent is relative pattern (H/L), not absolute pitch.
   *
   * Alternatives rejected:
   *   z-score: too aggressive, flattens dynamic range for short utterances
   *   min-max: sensitive to outliers
   *   median-subtract: marginally more robust but mean is fine after median smoothing
   */
  method: "mean-subtract" as const,
} as const;

// ─── DTW Algorithm ──────────────────────────────────────────────

export const DTW_CONFIG = {
  /**
   * Manhattan (L1) distance: |a - b|
   *
   * Why not Euclidean (L2):
   *   L1 is more robust to occasional outlier spikes at consonant-vowel transitions.
   *   For 1D signals L1 = L2 = |a - b| in magnitude, but L1 avoids sqrt overhead
   *   and does not over-penalize large single-frame deviations.
   */
  distanceMetric: "manhattan" as const,

  /**
   * symmetric2 (Sakoe-Chiba P=0):
   *   (i-1,j-1) → (i,j): cost d(i,j)
   *   (i-1,j)   → (i,j): cost d(i,j)
   *   (i,j-1)   → (i,j): cost d(i,j)
   *
   * All three steps are equally weighted.
   * symmetric1 would add 2*d for diagonal, biasing toward axis moves — bad for speech.
   */
  stepPattern: "symmetric2" as const,

  /**
   * Sakoe-Chiba band width as fraction of shorter sequence length.
   * Prevents pathological warping (one mora stretching to half the reference).
   *
   * Adaptive: computed per comparison pair via computeBandWidth().
   */
  bandFraction: 0.2,

  /** Minimum absolute band width (frames). Ensures flexibility for short words. */
  minBandWidth: 3,

  /** Maximum absolute band width (frames). Caps cost for long sentences. */
  maxBandWidth: 30,
} as const;

// ─── Scoring ────────────────────────────────────────────────────

export const SCORING_CONFIG = {
  /**
   * Mean step distance thresholds (semitones).
   *
   * Japanese pitch accent has ~4-6 semitone H-L difference typically.
   * A "good" learner matches within ~1 semitone mean deviation.
   * A "struggling" learner deviates 2-3+ semitones on average.
   */

  /** Mean step distance for perfect score (100) — nearly identical contour */
  perfectThreshold: 0.3,

  /** Mean step distance for zero score (0) — completely different contour */
  failThreshold: 4.0,
} as const;

export const RATING_THRESHOLDS = {
  /** 85-100: Nearly native pitch pattern */
  excellent: 85,
  /** 65-84: Recognizable accent pattern, minor deviations */
  good: 65,
  /** 40-64: General shape correct, significant deviations */
  fair: 40,
  /** 0-39: Pitch pattern not matching */
  needs_work: 0,
} as const;

export const FEEDBACK_CONFIG = {
  /** Only show per-mora feedback for scores below this */
  feedbackThreshold: 65,
  /** Minimum absolute semitone diff to mention pitch direction ("too high"/"too low") */
  directionThreshold: 0.8,
} as const;

// ─── Japanese Accent Weighting ──────────────────────────────────

export const ACCENT_WEIGHT_CONFIG = {
  /**
   * Weight multiplier for the accent nucleus mora and its immediate neighbor.
   *
   * The accent nucleus is where the H→L pitch drop occurs — the single most
   * perceptually salient feature of Japanese pitch accent. A learner who nails
   * the accent drop but wobbles elsewhere sounds far more natural than one who
   * has a smooth contour but misses the drop entirely.
   *
   * Applied during per-mora scoring: the accent nucleus mora's DTW cost
   * is multiplied by this weight before averaging into the overall score.
   *
   * 1.5x chosen empirically:
   *   - 1.0 = no special treatment (baseline)
   *   - 2.0 = too aggressive, a single bad nucleus tanks the whole score
   *   - 1.5 = noticeable impact without dominating
   */
  nucleusWeight: 1.5,

  /** Weight for the mora immediately after the accent nucleus (the L mora in H→L) */
  postNucleusWeight: 1.3,

  /** Weight for all other moras */
  defaultWeight: 1.0,
} as const;

// ─── Reference Expansion (VOICEVOX → frame-level) ───────────────

export const REFERENCE_EXPANSION_CONFIG = {
  /** Frame hop in seconds — must match user pipeline (512 / 16000) */
  frameHopSec: 0.032,

  /**
   * Interpolation between adjacent mora pitch values.
   *   'hold':   step function (each mora's pitch held constant)
   *   'linear': smooth transitions between moras
   *
   * 'linear' preferred because real speech has gradual pitch transitions
   * even within a single accent phrase.
   */
  interpolation: "linear" as const,
} as const;

// ─── VOICEVOX Reference Generation ──────────────────────────────

export const VOICEVOX_CONFIG = {
  /** ずんだもん (ノーマル) — clear, standard pitch */
  defaultSpeakerId: 3,
  /** VOICEVOX Engine URL (local Docker) */
  engineUrl: "http://localhost:50021",
  speedScale: 1.0,
  pitchScale: 0.0,
  /** Keep default intonation for accurate reference */
  intonationScale: 1.0,
} as const;

// ─── Types ──────────────────────────────────────────────────────

export type PitchRating = "excellent" | "good" | "fair" | "needs_work";

/** Output of the preprocessing pipeline — DTW-ready contour */
export interface ProcessedContour {
  /** Mean-normalized semitone values (no nulls after interpolation) */
  values: number[];
  /** Time in ms for each value (original timing preserved) */
  times: number[];
  /** Indices where pauses were detected (segment boundaries) */
  segmentBreaks: number[];
  /** Statistics for denormalization / display */
  stats: {
    meanSemitone: number;
    stdSemitone: number;
    durationMs: number;
    voicedFrameCount: number;
  };
}

/** Per-mora scoring result */
export interface MoraScore {
  moraIndex: number;
  moraText: string;
  /** Local DTW score for this mora (0-100) */
  score: number;
  rating: PitchRating;
  /** Signed mean pitch diff: positive = user too high, negative = user too low */
  meanDiffSemitones: number;
  /** Frame range in the DTW path */
  pathStartIdx: number;
  pathEndIdx: number;
}

/** Complete DTW comparison result */
export interface DTWResult {
  overallScore: number;
  overallRating: PitchRating;
  moraScores: MoraScore[];
  totalCost: number;
  /** Warping path: array of [userIdx, refIdx] pairs */
  path: [number, number][];
  meanStepDistance: number;
}

/** Pre-computed reference pitch data — one per Line record */
export interface ReferencePitch {
  lineId: number;
  textJa: string;
  speakerId: number;
  durationMs: number;
  contour: {
    values: number[];
    times: number[];
  };
  moras: ReferenceMora[];
  stats: {
    meanSemitone: number;
    rawMeanHz: number;
  };
  /** Schema version for future migrations */
  version: 1;
}

/** Mora boundary in reference data */
export interface ReferenceMora {
  text: string;
  /** Start frame index in contour.values (inclusive) */
  startFrame: number;
  /** End frame index in contour.values (exclusive) */
  endFrame: number;
  durationMs: number;
  /** Original VOICEVOX pitch (ln(Hz), for debugging) */
  rawPitch: number;
  /** True if this mora is the accent nucleus (H→L drop point) */
  isAccentNucleus: boolean;
}

/** Per-mora directional feedback for UI */
export interface MoraFeedback {
  moraText: string;
  /** e.g., "ちは の音が低すぎます" or "良いです！" */
  message: string;
}

// ─── Pure Helper Functions ──────────────────────────────────────

/**
 * Compute Sakoe-Chiba band width for a given pair of sequences.
 *
 * Word-level  (5-15 pts):  band = 3 frames (~96ms tolerance)
 * Phrase-level (15-50 pts): band = 3-10 frames
 * Sentence-level (50-200 pts): band = 10-30 frames
 */
export function computeBandWidth(seqLenA: number, seqLenB: number): number {
  const shorter = Math.min(seqLenA, seqLenB);
  const raw = Math.round(shorter * DTW_CONFIG.bandFraction);
  return Math.max(DTW_CONFIG.minBandWidth, Math.min(raw, DTW_CONFIG.maxBandWidth));
}

/**
 * Convert DTW total cost + path length to a 0-100 similarity score.
 * Linear interpolation between perfectThreshold and failThreshold, clamped.
 */
export function dtwDistanceToScore(totalCost: number, pathLength: number): number {
  const meanDist = totalCost / pathLength;
  const { perfectThreshold, failThreshold } = SCORING_CONFIG;

  if (meanDist <= perfectThreshold) return 100;
  if (meanDist >= failThreshold) return 0;

  const normalized = (meanDist - perfectThreshold) / (failThreshold - perfectThreshold);
  return Math.round(100 * (1 - normalized));
}

/** Map a numeric score to a human-readable rating. */
export function scoreToRating(score: number): PitchRating {
  if (score >= RATING_THRESHOLDS.excellent) return "excellent";
  if (score >= RATING_THRESHOLDS.good) return "good";
  if (score >= RATING_THRESHOLDS.fair) return "fair";
  return "needs_work";
}

/**
 * Manhattan distance for 1D semitone comparison.
 * Exported for use by the DTW algorithm module.
 */
export function pitchDistance(a: number, b: number): number {
  return Math.abs(a - b);
}

/**
 * Convert VOICEVOX log-F0 pitch to Hz.
 * VOICEVOX stores pitch as ln(Hz). A value of 0 means unvoiced.
 */
export function voicevoxPitchToHz(logF0: number): number {
  if (logF0 === 0) return 0;
  return Math.exp(logF0);
}

/**
 * Convert VOICEVOX log-F0 pitch to our semitone scale (relative to A3=220Hz).
 * Returns null for unvoiced (logF0 === 0).
 */
export function voicevoxPitchToSemitone(logF0: number): number | null {
  if (logF0 === 0) return null;
  const hz = Math.exp(logF0);
  return 12 * Math.log2(hz / 220);
}

/**
 * Compute the accent weight for a given mora based on its nucleus status.
 * Used during per-mora scoring to emphasize the accent drop.
 */
export function getMoraWeight(
  moraIndex: number,
  accentNucleusIndex: number | null,
): number {
  if (accentNucleusIndex === null) return ACCENT_WEIGHT_CONFIG.defaultWeight;
  if (moraIndex === accentNucleusIndex) return ACCENT_WEIGHT_CONFIG.nucleusWeight;
  if (moraIndex === accentNucleusIndex + 1) return ACCENT_WEIGHT_CONFIG.postNucleusWeight;
  return ACCENT_WEIGHT_CONFIG.defaultWeight;
}
