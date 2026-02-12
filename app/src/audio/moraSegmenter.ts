/**
 * Japanese mora segmentation utilities.
 * Handles 拗音 (contracted), 促音 (geminate), 撥音 (nasal), 長音 (long vowel).
 */

import type { MoraInfo } from "../types/pitch";

const SMALL_KANA = new Set([
  "ゃ", "ゅ", "ょ", "ぁ", "ぃ", "ぅ", "ぇ", "ぉ",
  "ャ", "ュ", "ョ", "ァ", "ィ", "ゥ", "ェ", "ォ",
]);

/**
 * Split a hiragana/katakana string into individual moras.
 * e.g., "いらっしゃいませ" → ["い", "ら", "っ", "しゃ", "い", "ま", "せ"]
 */
export function splitIntoMoras(reading: string): string[] {
  const moras: string[] = [];
  let i = 0;

  while (i < reading.length) {
    const char = reading[i];
    const next = reading[i + 1];

    if (next && SMALL_KANA.has(next)) {
      // Contracted sound: きゃ, しょ, etc.
      moras.push(char + next);
      i += 2;
    } else {
      moras.push(char);
      i += 1;
    }
  }

  return moras;
}

/**
 * Classify mora type from its text.
 */
export function getMoraType(mora: string): MoraInfo["type"] {
  if (mora === "っ" || mora === "ッ") return "geminate";
  if (mora === "ん" || mora === "ン") return "moraic_nasal";
  if (mora === "ー") return "long_vowel";
  if (mora.length === 2 && SMALL_KANA.has(mora[1])) return "contracted";
  return "regular";
}

/**
 * Build MoraInfo[] from a hiragana reading and H/L pattern string.
 * Pattern chars: 'H', 'L', '_' (geminate/unvoiced).
 */
export function buildMoraInfos(reading: string, pattern: string): MoraInfo[] {
  const moraTexts = splitIntoMoras(reading);
  const patternChars = pattern.split("");

  if (moraTexts.length !== patternChars.length) {
    throw new Error(
      `Mora count (${moraTexts.length}) !== pattern length (${patternChars.length}) ` +
      `for "${reading}" / "${pattern}"`
    );
  }

  return moraTexts.map((mora, i) => ({
    mora,
    index: i,
    pitch: patternChars[i] === "H" ? "H" : patternChars[i] === "L" ? "L" : null,
    type: getMoraType(mora),
  }));
}

/**
 * Divide an array of values into N roughly-equal segments.
 * Used to split pitch points into mora-aligned regions.
 */
export function divideIntoSegments<T>(items: T[], segmentCount: number): T[][] {
  if (segmentCount <= 0 || items.length === 0) return [];

  const segments: T[][] = [];
  const baseSize = Math.floor(items.length / segmentCount);
  const remainder = items.length % segmentCount;
  let start = 0;

  for (let i = 0; i < segmentCount; i++) {
    const size = baseSize + (i < remainder ? 1 : 0);
    segments.push(items.slice(start, start + size));
    start += size;
  }

  return segments;
}
