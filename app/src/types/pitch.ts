/**
 * Reference pitch accent data types for Japanese pronunciation comparison.
 * Layer 1: Static H/L pattern per mora (linguistic ground truth).
 */

export interface MoraInfo {
  /** Mora text in hiragana (e.g., "い", "しゃ", "っ") */
  mora: string;
  /** 0-indexed position in the mora sequence */
  index: number;
  /** Pitch level: H (high) or L (low). null for geminate (っ) */
  pitch: "H" | "L" | null;
  /** Mora type for special handling */
  type: "regular" | "long_vowel" | "geminate" | "moraic_nasal" | "contracted";
}

export interface AccentPhrase {
  /** Original script text (kanji/kana mix) */
  surface: string;
  /** Full hiragana reading */
  reading: string;
  /** Mora breakdown with pitch assignments */
  moras: MoraInfo[];
  /** Accent type classification */
  accentType: "heiban" | "atamadaka" | "nakadaka" | "odaka";
  /**
   * Accent nucleus: 0-indexed mora where pitch drops.
   * 0 = atamadaka, null = heiban.
   */
  accentNucleus: number | null;
}

export interface ReferencePitchData {
  /** Unique ID for lookup */
  lineId: string;
  /** Full Japanese text */
  textJa: string;
  /** Full hiragana reading */
  readingHiragana: string;
  /** Total mora count */
  totalMoras: number;
  /** Accent phrases (bunsetsu-level) */
  accentPhrases: AccentPhrase[];
  /**
   * Flattened H/L pattern. '_' for geminate, '|' separates accent phrases.
   * e.g., "LH_HHHH|LHHHHL"
   */
  pitchPattern: string;
}

export interface MoraComparisonResult {
  /** Mora text */
  mora: string;
  /** Expected pitch level */
  expected: "H" | "L" | null;
  /** Detected pitch level from user */
  detected: "H" | "L" | null;
  /** Whether this mora's pitch was correct */
  correct: boolean;
  /** User's average semitone for this mora region */
  userSemitone: number | null;
}

export interface ComparisonResult {
  /** Overall score 0-100 */
  score: number;
  /** Per-mora comparison details */
  moraResults: MoraComparisonResult[];
  /** Number of correct moras */
  correctCount: number;
  /** Total scorable moras (excluding geminate) */
  totalScorable: number;
  /** Whether the accent nucleus position was correct */
  accentNucleusCorrect: boolean;
  /** Textual feedback for the user */
  feedback: string;
}

export type PitchRating = "excellent" | "good" | "fair" | "needs_work";
