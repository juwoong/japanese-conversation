import {
  compareText,
  accuracyScore,
  normalize,
  type DiffSegment,
  type TextDiffResult,
} from "../lib/textDiff";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Extract just statuses from segments for easy assertion. */
function statuses(result: TextDiffResult): string[] {
  return result.segments.map((s) => s.status);
}

/** Extract just text from segments for easy assertion. */
function texts(result: TextDiffResult): string[] {
  return result.segments.map((s) => s.text);
}

// ---------------------------------------------------------------------------
// normalize()
// ---------------------------------------------------------------------------

describe("normalize", () => {
  it("strips Japanese punctuation", () => {
    expect(normalize("いらっしゃいませ。")).toBe("いらっしゃいませ");
  });

  it("strips question marks and exclamation marks", () => {
    expect(normalize("ご注文は？")).toBe("ご注文は");
  });

  it("strips all common Japanese punctuation", () => {
    expect(normalize("「こんにちは」、元気？")).toBe("こんにちは元気");
  });

  it("strips whitespace and fullwidth spaces", () => {
    expect(normalize("こんにちは　世界")).toBe("こんにちは世界");
    expect(normalize("こんにちは 世界")).toBe("こんにちは世界");
  });

  it("lowercases romaji", () => {
    expect(normalize("OK")).toBe("ok");
  });

  it("preserves kana and kanji", () => {
    expect(normalize("漢字ひらがなカタカナ")).toBe("漢字ひらがなカタカナ");
  });

  it("handles empty string", () => {
    expect(normalize("")).toBe("");
  });

  it("handles string of only punctuation", () => {
    expect(normalize("。、？！")).toBe("");
  });
});

// ---------------------------------------------------------------------------
// compareText() — identical strings
// ---------------------------------------------------------------------------

describe("compareText — identical strings", () => {
  it("returns 100% for identical text", () => {
    const result = compareText("こんにちは", "こんにちは");
    expect(result.score).toBe(100);
    expect(result.correctCount).toBe(5);
    expect(result.totalCount).toBe(5);
    expect(result.segments).toEqual([
      { text: "こんにちは", status: "correct" },
    ]);
  });

  it("returns 100% when only punctuation differs", () => {
    const result = compareText(
      "いらっしゃいませ。ご注文は？",
      "いらっしゃいませご注文は",
    );
    expect(result.score).toBe(100);
  });

  it("returns 100% for empty vs empty", () => {
    const result = compareText("", "");
    expect(result.score).toBe(100);
    expect(result.segments).toEqual([]);
  });

  it("returns 100% when both are only punctuation", () => {
    const result = compareText("。？！", "、。");
    // After normalization both become "", which is equal
    expect(result.score).toBe(100);
  });
});

// ---------------------------------------------------------------------------
// compareText() — the っ example from the requirements
// ---------------------------------------------------------------------------

describe("compareText — missing っ (requirements example)", () => {
  it("detects missing っ in いらっしゃいませ", () => {
    const result = compareText(
      "いらっしゃいませ。ご注文は？",
      "いらしゃいませ。ご注文は？",
    );

    // Expected normalized: いらっしゃいませご注文は (12 chars)
    // Actual normalized:   いらしゃいませご注文は  (11 chars)
    // 11 correct out of 12 = ~92%
    expect(result.score).toBeGreaterThanOrEqual(85);
    expect(result.score).toBeLessThanOrEqual(95);
    expect(result.correctCount).toBe(11);
    expect(result.totalCount).toBe(12);

    // The "missing" segment should contain っ
    const missingSegments = result.segments.filter(
      (s) => s.status === "missing",
    );
    expect(missingSegments).toHaveLength(1);
    expect(missingSegments[0].text).toBe("っ");
  });
});

// ---------------------------------------------------------------------------
// compareText() — missing characters
// ---------------------------------------------------------------------------

describe("compareText — missing characters", () => {
  it("detects single missing character at start", () => {
    const result = compareText("あいうえお", "いうえお");
    expect(result.correctCount).toBe(4);
    expect(result.totalCount).toBe(5);
    const missing = result.segments.filter((s) => s.status === "missing");
    expect(missing[0].text).toBe("あ");
  });

  it("detects single missing character at end", () => {
    const result = compareText("あいうえお", "あいうえ");
    expect(result.correctCount).toBe(4);
    expect(result.totalCount).toBe(5);
    const missing = result.segments.filter((s) => s.status === "missing");
    expect(missing[0].text).toBe("お");
  });

  it("detects multiple missing characters", () => {
    const result = compareText("あいうえお", "あえお");
    expect(result.correctCount).toBe(3);
    expect(result.totalCount).toBe(5);
    expect(result.score).toBe(60);
  });

  it("handles completely missing text (said nothing)", () => {
    const result = compareText("こんにちは", "");
    expect(result.score).toBe(0);
    expect(result.correctCount).toBe(0);
    expect(result.totalCount).toBe(5);
    expect(result.segments).toEqual([
      { text: "こんにちは", status: "missing" },
    ]);
  });
});

// ---------------------------------------------------------------------------
// compareText() — extra characters
// ---------------------------------------------------------------------------

describe("compareText — extra characters", () => {
  it("detects extra characters inserted", () => {
    const result = compareText("あいう", "あいいう");
    expect(result.correctCount).toBe(3);
    // Extra chars should reduce score below 100
    expect(result.score).toBeLessThan(100);
    const extra = result.segments.filter((s) => s.status === "extra");
    expect(extra.length).toBeGreaterThanOrEqual(1);
  });

  it("penalizes extra characters but not too harshly", () => {
    const result = compareText("あいう", "あいうえお");
    // All 3 expected chars are correct, but 2 extra
    expect(result.correctCount).toBe(3);
    expect(result.score).toBeGreaterThan(50);
    expect(result.score).toBeLessThan(100);
  });

  it("handles actual text when expected is empty", () => {
    const result = compareText("", "こんにちは");
    expect(result.score).toBe(0);
    expect(result.segments).toEqual([
      { text: "こんにちは", status: "extra" },
    ]);
  });
});

// ---------------------------------------------------------------------------
// compareText() — substitutions (wrong characters)
// ---------------------------------------------------------------------------

describe("compareText — wrong characters", () => {
  it("detects substituted characters", () => {
    // さようなら vs さよおなら (う → お)
    // Myers diff sees this as: さよ correct, う missing, お extra, なら correct
    // 4 correct out of 5 expected, plus extra penalty
    const result = compareText("さようなら", "さよおなら");
    expect(result.correctCount).toBe(4);
    expect(result.totalCount).toBe(5);
    // Score should reflect the substitution
    expect(result.score).toBeLessThan(100);
    expect(result.score).toBeGreaterThan(50);
  });

  it("handles completely different text", () => {
    const result = compareText("あいうえお", "かきくけこ");
    expect(result.score).toBe(0);
    expect(result.correctCount).toBe(0);
  });

  it("handles similar but not identical text", () => {
    // ありがとうございます vs ありがとございます (missing う)
    // Normalized: ありがとうございます = 10 chars, ありがとございます = 9 chars
    const result = compareText("ありがとうございます", "ありがとございます");
    expect(result.correctCount).toBe(9);
    expect(result.totalCount).toBe(10);
  });
});

// ---------------------------------------------------------------------------
// compareText() — segments structure
// ---------------------------------------------------------------------------

describe("compareText — segment merging", () => {
  it("merges consecutive correct characters", () => {
    const result = compareText("あいうえお", "あいうえお");
    expect(result.segments).toHaveLength(1);
    expect(result.segments[0]).toEqual({
      text: "あいうえお",
      status: "correct",
    });
  });

  it("produces correct segment order", () => {
    const result = compareText("あいう", "あう");
    // あ correct, い missing, う correct
    expect(texts(result)).toEqual(["あ", "い", "う"]);
    expect(statuses(result)).toEqual(["correct", "missing", "correct"]);
  });

  it("handles alternating correct/wrong", () => {
    // あXう vs あYう — X is missing, Y is extra
    const result = compareText("あかう", "あきう");
    // あ correct, か missing, き extra, う correct
    expect(result.correctCount).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// compareText() — punctuation handling
// ---------------------------------------------------------------------------

describe("compareText — punctuation", () => {
  it("ignores punctuation by default", () => {
    const result = compareText("こんにちは。", "こんにちは");
    expect(result.score).toBe(100);
  });

  it("respects punctuation when ignorePunctuation=false", () => {
    const result = compareText("こんにちは。", "こんにちは", {
      ignorePunctuation: false,
    });
    // The period is now part of comparison, so not 100%
    expect(result.score).toBeLessThan(100);
  });

  it("handles mixed punctuation consistently", () => {
    const a = "「すみません」、お願いします。";
    const b = "すみませんお願いします";
    expect(compareText(a, b).score).toBe(100);
  });
});

// ---------------------------------------------------------------------------
// compareText() — kanji and mixed scripts
// ---------------------------------------------------------------------------

describe("compareText — kanji and mixed scripts", () => {
  it("treats kanji and hiragana as different characters", () => {
    // 注文 vs ちゅうもん — these are different characters
    const result = compareText("注文", "ちゅうもん");
    expect(result.correctCount).toBe(0);
    expect(result.score).toBe(0);
  });

  it("handles katakana correctly", () => {
    const result = compareText("コーヒー", "コーヒー");
    expect(result.score).toBe(100);
  });

  it("detects katakana vs hiragana difference", () => {
    // コーヒー vs こーひー — different scripts
    const result = compareText("コーヒー", "こーひー");
    // ー matches but コ/こ and ヒ/ひ don't
    expect(result.correctCount).toBe(2); // the two ー
    expect(result.score).toBeLessThan(100);
  });
});

// ---------------------------------------------------------------------------
// compareText() — realistic STT scenarios
// ---------------------------------------------------------------------------

describe("compareText — realistic STT scenarios", () => {
  it("handles typical Whisper output for greetings", () => {
    const result = compareText(
      "おはようございます",
      "おはようございます",
    );
    expect(result.score).toBe(100);
  });

  it("handles dropped long vowel", () => {
    // ありがとうございます → ありがとございます (dropped う)
    const result = compareText("ありがとうございます", "ありがとございます");
    expect(result.score).toBeGreaterThanOrEqual(85);
  });

  it("handles extra particles from STT noise", () => {
    // Expected: すみません, STT adds trailing noise
    const result = compareText("すみません", "すみませんね");
    expect(result.correctCount).toBe(5);
    expect(result.score).toBeGreaterThan(80);
  });

  it("handles real conversation line", () => {
    const result = compareText(
      "電車の切符はどこで買えますか",
      "電車の切符はどこで買えますか",
    );
    expect(result.score).toBe(100);
  });

  it("handles partial match for long sentence", () => {
    const expected = "すみません、駅はどこですか";
    const actual = "すみません駅はどこですか"; // identical after punctuation strip
    expect(compareText(expected, actual).score).toBe(100);
  });
});

// ---------------------------------------------------------------------------
// accuracyScore() convenience function
// ---------------------------------------------------------------------------

describe("accuracyScore", () => {
  it("returns the same score as compareText", () => {
    const expected = "こんにちは";
    const actual = "こんにちわ";
    expect(accuracyScore(expected, actual)).toBe(
      compareText(expected, actual).score,
    );
  });

  it("returns 100 for identical text", () => {
    expect(accuracyScore("テスト", "テスト")).toBe(100);
  });

  it("returns 0 for completely different text", () => {
    expect(accuracyScore("あいう", "かきく")).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Edge cases
// ---------------------------------------------------------------------------

describe("compareText — edge cases", () => {
  it("handles single character match", () => {
    const result = compareText("あ", "あ");
    expect(result.score).toBe(100);
    expect(result.segments).toEqual([{ text: "あ", status: "correct" }]);
  });

  it("handles single character mismatch", () => {
    const result = compareText("あ", "い");
    expect(result.score).toBe(0);
  });

  it("handles repeated characters", () => {
    const result = compareText("ああああ", "あああ");
    expect(result.correctCount).toBe(3);
    expect(result.totalCount).toBe(4);
  });

  it("handles long identical strings efficiently", () => {
    const text = "あ".repeat(500);
    const start = Date.now();
    const result = compareText(text, text);
    const elapsed = Date.now() - start;
    expect(result.score).toBe(100);
    expect(elapsed).toBeLessThan(100); // should be instant
  });

  it("handles long different strings within reasonable time", () => {
    const expected = "あいうえおかきくけこ".repeat(10); // 100 chars
    const actual = "かきくけこあいうえお".repeat(10); // 100 chars, shuffled
    const start = Date.now();
    const result = compareText(expected, actual);
    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(1000);
    expect(result.score).toBeDefined();
  });

  it("score never exceeds 100", () => {
    const result = compareText("あ", "あ");
    expect(result.score).toBeLessThanOrEqual(100);
  });

  it("score never goes below 0", () => {
    const result = compareText("あ", "かきくけこさしすせそたちつてと");
    expect(result.score).toBeGreaterThanOrEqual(0);
  });
});
