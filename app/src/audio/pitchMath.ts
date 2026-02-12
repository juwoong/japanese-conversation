/**
 * Shared pitch math utilities.
 * Single source of truth for Hz↔Semitone conversion and normalization.
 */

import { SEMITONE_CONFIG } from "./pitchConfig";

/** Convert Hz to semitones relative to refHz (default A3=220Hz). */
export function hzToSemitone(hz: number, refHz = SEMITONE_CONFIG.refHz): number {
  return 12 * Math.log2(hz / refHz);
}

/** Convert semitones back to Hz. */
export function semitoneToHz(semitone: number, refHz = SEMITONE_CONFIG.refHz): number {
  return refHz * Math.pow(2, semitone / 12);
}

/**
 * Mean-center an array of semitone values (speaker normalization).
 * Null values are skipped in mean calculation and preserved in output.
 */
export function meanCenter(semitones: (number | null)[]): (number | null)[] {
  let sum = 0;
  let count = 0;
  for (const s of semitones) {
    if (s !== null) {
      sum += s;
      count++;
    }
  }
  if (count === 0) return semitones;

  const mean = sum / count;
  return semitones.map((s) => (s !== null ? s - mean : null));
}

/**
 * Compute average of non-null values in a semitone array.
 * Returns null if all values are null.
 */
export function averageSemitone(semitones: (number | null)[]): number | null {
  let sum = 0;
  let count = 0;
  for (const s of semitones) {
    if (s !== null) {
      sum += s;
      count++;
    }
  }
  return count > 0 ? sum / count : null;
}
