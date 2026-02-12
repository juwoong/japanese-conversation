/**
 * Japanese text normalization for STT comparison.
 *
 * Pipeline:
 * 1. Katakana → Hiragana
 * 2. Fullwidth alphanumeric → halfwidth
 * 3. Strip punctuation (preserve ー for long vowels)
 * 4. Strip common STT fillers (えーと, あのー, etc.)
 * 5. Dedup hallucinated repetitions (Whisper artifact)
 * 6. Trim whitespace
 *
 * Pure TypeScript, zero dependencies.
 */

// Katakana → Hiragana: offset 0x60 (ア=0x30A1, あ=0x3041)
function katakanaToHiragana(text: string): string {
  let result = "";
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    // Katakana range: ァ(0x30A1) to ヶ(0x30F6), exclude ー(0x30FC)
    if (code >= 0x30a1 && code <= 0x30f6) {
      result += String.fromCharCode(code - 0x60);
    } else {
      result += text[i];
    }
  }
  return result;
}

// Fullwidth A-Z, a-z, 0-9 → halfwidth
function fullwidthToHalfwidth(text: string): string {
  let result = "";
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    // Fullwidth range: ！(0xFF01) to ～(0xFF5E) → !(0x21) to ~(0x7E)
    if (code >= 0xff01 && code <= 0xff5e) {
      result += String.fromCharCode(code - 0xfee0);
    } else if (code === 0x3000) {
      // Ideographic space → regular space
      result += " ";
    } else {
      result += text[i];
    }
  }
  return result;
}

// Japanese punctuation to strip. Preserve ー (long vowel mark).
const PUNCTUATION_RE =
  /[。、？！．，・「」『』（）【】〈〉《》〔〕｛｝\[\]{}()\s　.,:;!?""''…─―~～]/g;

// Common STT fillers that Whisper sometimes transcribes
const FILLER_PATTERNS = [
  /^えーと/,
  /^あのー?/,
  /^えー?と?/,
  /^うーん/,
  /^まあ/,
  /^そのー?/,
  /^ああ/,
];

function stripFillers(text: string): string {
  let result = text;
  for (const pattern of FILLER_PATTERNS) {
    result = result.replace(pattern, "");
  }
  return result;
}

/**
 * Whisper sometimes hallucinates by repeating the entire phrase.
 * e.g., "いらっしゃいませいらっしゃいませ" when user said it once.
 * Detect and remove exact duplications.
 */
function dedupHallucination(text: string, expected: string): string {
  if (!expected || text.length <= expected.length) return text;

  // Check if the text is roughly 2x the expected length and contains a repeat
  const halfLen = Math.floor(text.length / 2);
  const firstHalf = text.slice(0, halfLen);
  const secondHalf = text.slice(halfLen);

  if (firstHalf === secondHalf) {
    return firstHalf;
  }

  // Also check if the expected text appears at the start and repeats
  const normExpected = expected.replace(PUNCTUATION_RE, "");
  if (
    text.startsWith(normExpected) &&
    text.length > normExpected.length * 1.5
  ) {
    return text.slice(0, normExpected.length);
  }

  return text;
}

/**
 * Full normalization pipeline for Japanese STT comparison.
 *
 * @param text - Raw STT output or expected text
 * @param expectedText - Optional expected text for dedup detection
 */
export function normalizeJapanese(
  text: string,
  expectedText?: string,
): string {
  let result = text;
  result = katakanaToHiragana(result);
  result = fullwidthToHalfwidth(result);
  result = result.replace(PUNCTUATION_RE, "");
  result = stripFillers(result);
  if (expectedText) {
    const normExpected = katakanaToHiragana(
      fullwidthToHalfwidth(expectedText),
    ).replace(PUNCTUATION_RE, "");
    result = dedupHallucination(result, normExpected);
  }
  result = result.toLowerCase();
  return result;
}
