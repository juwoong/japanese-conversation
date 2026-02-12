/**
 * Japanese text diff for comparing STT output against expected text.
 *
 * Uses character-level Myers diff (the algorithm behind `git diff`).
 * Character-level is the right granularity for Japanese because:
 *   - STT errors are typically per-character (missing っ, wrong kana)
 *   - No tokenizer dependency needed (kuromoji.js is 20MB+)
 *   - Each Japanese character carries semantic meaning
 *
 * Pure TypeScript, zero dependencies, Hermes-compatible.
 */

import { normalizeJapanese } from "./japaneseNormalize";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type DiffStatus = "correct" | "wrong" | "missing" | "extra";

/** A contiguous segment of text with the same diff status. */
export interface DiffSegment {
  /** The text content of this segment. */
  text: string;
  /** How this segment relates to the expected text. */
  status: DiffStatus;
}

/** Full result of comparing STT output against expected text. */
export interface TextDiffResult {
  /** 0–100 accuracy score. */
  score: number;
  /** Diff segments for rendering colored text. */
  segments: DiffSegment[];
  /** How many characters in the expected text were matched correctly. */
  correctCount: number;
  /** Total comparable characters in the expected text (after normalization). */
  totalCount: number;
}

// ---------------------------------------------------------------------------
// Normalization (delegated to japaneseNormalize.ts)
// ---------------------------------------------------------------------------

/**
 * Re-export for backwards compatibility.
 * Full pipeline: katakana→hiragana, fullwidth→halfwidth, strip punctuation,
 * strip fillers, lowercase.
 */
export function normalize(text: string, expectedText?: string): string {
  return normalizeJapanese(text, expectedText);
}

// ---------------------------------------------------------------------------
// Myers Diff (character-level)
// ---------------------------------------------------------------------------

/**
 * Operation in the edit script produced by Myers diff.
 * - "equal":  character exists in both strings (match)
 * - "insert": character exists only in `actual` (extra)
 * - "delete": character exists only in `expected` (missing)
 */
type EditOp = "equal" | "insert" | "delete";

interface EditEntry {
  op: EditOp;
  /** Character from expected (for equal/delete) or actual (for insert). */
  char: string;
}

/**
 * Myers diff algorithm — finds the shortest edit script (SES) between
 * two strings. This is the same algorithm used by GNU diff and git.
 *
 * Time: O((N+M)*D) where D = edit distance. For similar strings (our
 * common case), D is small, making this very fast.
 * Space: O((N+M)*D) for the trace.
 *
 * Reference: Eugene W. Myers, "An O(ND) Difference Algorithm and Its
 * Variations", Algorithmica 1(2), 1986.
 */
function myersDiff(expected: string, actual: string): EditEntry[] {
  const n = expected.length;
  const m = actual.length;
  const max = n + m;

  // Edge cases
  if (n === 0 && m === 0) return [];
  if (n === 0) {
    return Array.from(actual, (c) => ({ op: "insert" as EditOp, char: c }));
  }
  if (m === 0) {
    return Array.from(expected, (c) => ({ op: "delete" as EditOp, char: c }));
  }

  // Trace stores the V array at each step d, for backtracking.
  // V[k] = furthest-reaching x on diagonal k.
  // Diagonal k = x - y.
  const trace: Map<number, number>[] = [];

  // V array indexed by diagonal k. We use a Map for sparse access
  // since k ranges from -d to d.
  let v = new Map<number, number>();
  v.set(1, 0);

  outer: for (let d = 0; d <= max; d++) {
    trace.push(new Map(v));
    const next = new Map(v);

    for (let k = -d; k <= d; k += 2) {
      // Decide whether to go down (insert) or right (delete)
      let x: number;
      if (k === -d || (k !== d && (v.get(k - 1) ?? 0) < (v.get(k + 1) ?? 0))) {
        x = v.get(k + 1) ?? 0; // move down: insert from actual
      } else {
        x = (v.get(k - 1) ?? 0) + 1; // move right: delete from expected
      }

      let y = x - k;

      // Follow the diagonal (matching characters)
      while (x < n && y < m && expected[x] === actual[y]) {
        x++;
        y++;
      }

      next.set(k, x);

      if (x >= n && y >= m) {
        trace.push(next);
        break outer;
      }
    }

    v = next;
  }

  // Backtrack through the trace to build the edit script
  const edits: EditEntry[] = [];
  let x = n;
  let y = m;

  for (let d = trace.length - 2; d >= 0; d--) {
    const vPrev = trace[d];
    const k = x - y;

    let prevK: number;
    if (k === -d || (k !== d && (vPrev.get(k - 1) ?? 0) < (vPrev.get(k + 1) ?? 0))) {
      prevK = k + 1;
    } else {
      prevK = k - 1;
    }

    const prevX = vPrev.get(prevK) ?? 0;
    const prevY = prevX - prevK;

    // Diagonal moves (matches) from (prevX, prevY) extended to (x before the insert/delete)
    while (x > prevX && y > prevY) {
      x--;
      y--;
      edits.push({ op: "equal", char: expected[x] });
    }

    if (d > 0) {
      if (x === prevX) {
        // y changed: insert (character from actual)
        y--;
        edits.push({ op: "insert", char: actual[y] });
      } else {
        // x changed: delete (character from expected)
        x--;
        edits.push({ op: "delete", char: expected[x] });
      }
    }
  }

  edits.reverse();
  return edits;
}

// ---------------------------------------------------------------------------
// Diff-to-segments conversion
// ---------------------------------------------------------------------------

/** Map Myers edit ops to our DiffStatus. */
function editOpToStatus(op: EditOp): DiffStatus {
  switch (op) {
    case "equal":
      return "correct";
    case "delete":
      return "missing";
    case "insert":
      return "extra";
  }
}

/**
 * Merge consecutive edit entries with the same status into segments.
 * This produces the minimal number of segments for rendering.
 */
function mergeToSegments(edits: EditEntry[]): DiffSegment[] {
  if (edits.length === 0) return [];

  const segments: DiffSegment[] = [];
  let current: DiffSegment = {
    text: edits[0].char,
    status: editOpToStatus(edits[0].op),
  };

  for (let i = 1; i < edits.length; i++) {
    const status = editOpToStatus(edits[i].op);
    if (status === current.status) {
      current.text += edits[i].char;
    } else {
      segments.push(current);
      current = { text: edits[i].char, status };
    }
  }
  segments.push(current);

  return segments;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface DiffOptions {
  /**
   * Whether to strip punctuation before comparison.
   * Default: true. Set false to also test punctuation accuracy.
   */
  ignorePunctuation?: boolean;
}

/**
 * Compare STT output against expected Japanese text.
 *
 * @param expected - The target text the learner should have said.
 * @param actual - The STT transcription of what they actually said.
 * @param options - Comparison options.
 * @returns TextDiffResult with score, segments, and counts.
 *
 * @example
 * ```ts
 * const result = compareText(
 *   "いらっしゃいませ。ご注文は？",
 *   "いらしゃいませ。ご注文は？"
 * );
 * // result.score => 90 (missing っ)
 * // result.segments => [
 * //   { text: "いら", status: "correct" },
 * //   { text: "っ", status: "missing" },
 * //   { text: "しゃいませご注文は", status: "correct" }
 * // ]
 * ```
 */
export function compareText(
  expected: string,
  actual: string,
  options?: DiffOptions,
): TextDiffResult {
  const ignorePunctuation = options?.ignorePunctuation ?? true;

  const normExpected = ignorePunctuation ? normalize(expected) : expected;
  const normActual = ignorePunctuation ? normalize(actual, expected) : actual;

  // Edge case: both empty
  if (normExpected.length === 0 && normActual.length === 0) {
    return { score: 100, segments: [], correctCount: 0, totalCount: 0 };
  }

  // Edge case: expected empty but actual has content
  if (normExpected.length === 0) {
    return {
      score: 0,
      segments: [{ text: normActual, status: "extra" }],
      correctCount: 0,
      totalCount: 0,
    };
  }

  // Edge case: actual empty (said nothing)
  if (normActual.length === 0) {
    return {
      score: 0,
      segments: [{ text: normExpected, status: "missing" }],
      correctCount: 0,
      totalCount: normExpected.length,
    };
  }

  const edits = myersDiff(normExpected, normActual);
  const segments = mergeToSegments(edits);

  // Count correct characters (matched against expected)
  let correctCount = 0;
  for (const edit of edits) {
    if (edit.op === "equal") correctCount++;
  }

  // Total = expected length (what the learner was aiming for)
  const totalCount = normExpected.length;

  // Score: correct / total * 100, clamped to [0, 100]
  // Penalty for extra characters: each extra char reduces score slightly
  const extraCount = edits.filter((e) => e.op === "insert").length;
  const extraPenalty = Math.min(extraCount * (100 / totalCount) * 0.5, 50);
  const rawScore = (correctCount / totalCount) * 100 - extraPenalty;
  const score = Math.round(Math.max(0, Math.min(100, rawScore)));

  return { score, segments, correctCount, totalCount };
}

/**
 * Quick accuracy check — returns just the 0–100 score.
 * Use this when you don't need the diff segments (e.g., for SRS grading).
 */
export function accuracyScore(
  expected: string,
  actual: string,
  options?: DiffOptions,
): number {
  return compareText(expected, actual, options).score;
}
