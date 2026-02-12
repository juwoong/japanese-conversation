/**
 * Static reference pitch data for test phrases.
 * Hand-authored H/L patterns based on standard Tokyo accent.
 */

import type { ReferencePitchData } from "../types/pitch";

export const TEST_REFERENCES: ReferencePitchData[] = [
  {
    lineId: "test_ame_rain",
    textJa: "雨",
    readingHiragana: "あめ",
    totalMoras: 2,
    accentPhrases: [
      {
        surface: "雨",
        reading: "あめ",
        moras: [
          { mora: "あ", index: 0, pitch: "L", type: "regular" },
          { mora: "め", index: 1, pitch: "H", type: "regular" },
        ],
        accentType: "heiban",
        accentNucleus: null,
      },
    ],
    pitchPattern: "LH",
  },
  {
    lineId: "test_ame_candy",
    textJa: "飴",
    readingHiragana: "あめ",
    totalMoras: 2,
    accentPhrases: [
      {
        surface: "飴",
        reading: "あめ",
        moras: [
          { mora: "あ", index: 0, pitch: "H", type: "regular" },
          { mora: "め", index: 1, pitch: "L", type: "regular" },
        ],
        accentType: "atamadaka",
        accentNucleus: 0,
      },
    ],
    pitchPattern: "HL",
  },
  {
    lineId: "test_tamago",
    textJa: "卵",
    readingHiragana: "たまご",
    totalMoras: 3,
    accentPhrases: [
      {
        surface: "卵",
        reading: "たまご",
        moras: [
          { mora: "た", index: 0, pitch: "L", type: "regular" },
          { mora: "ま", index: 1, pitch: "H", type: "regular" },
          { mora: "ご", index: 2, pitch: "L", type: "regular" },
        ],
        accentType: "nakadaka",
        accentNucleus: 1,
      },
    ],
    pitchPattern: "LHL",
  },
  {
    lineId: "test_inochi",
    textJa: "命",
    readingHiragana: "いのち",
    totalMoras: 3,
    accentPhrases: [
      {
        surface: "命",
        reading: "いのち",
        moras: [
          { mora: "い", index: 0, pitch: "L", type: "regular" },
          { mora: "の", index: 1, pitch: "H", type: "regular" },
          { mora: "ち", index: 2, pitch: "L", type: "regular" },
        ],
        accentType: "nakadaka",
        accentNucleus: 1,
      },
    ],
    pitchPattern: "LHL",
  },
  {
    lineId: "test_sakura",
    textJa: "桜",
    readingHiragana: "さくら",
    totalMoras: 3,
    accentPhrases: [
      {
        surface: "桜",
        reading: "さくら",
        moras: [
          { mora: "さ", index: 0, pitch: "L", type: "regular" },
          { mora: "く", index: 1, pitch: "H", type: "regular" },
          { mora: "ら", index: 2, pitch: "H", type: "regular" },
        ],
        accentType: "heiban",
        accentNucleus: null,
      },
    ],
    pitchPattern: "LHH",
  },
  {
    lineId: "test_irasshaimase",
    textJa: "いらっしゃいませ",
    readingHiragana: "いらっしゃいませ",
    totalMoras: 7,
    accentPhrases: [
      {
        surface: "いらっしゃいませ",
        reading: "いらっしゃいませ",
        moras: [
          { mora: "い", index: 0, pitch: "L", type: "regular" },
          { mora: "ら", index: 1, pitch: "H", type: "regular" },
          { mora: "っ", index: 2, pitch: null, type: "geminate" },
          { mora: "しゃ", index: 3, pitch: "H", type: "contracted" },
          { mora: "い", index: 4, pitch: "H", type: "regular" },
          { mora: "ま", index: 5, pitch: "H", type: "regular" },
          { mora: "せ", index: 6, pitch: "H", type: "regular" },
        ],
        accentType: "heiban",
        accentNucleus: null,
      },
    ],
    pitchPattern: "LH_HHHH",
  },
  {
    lineId: "test_arigatou",
    textJa: "ありがとうございます",
    readingHiragana: "ありがとうございます",
    totalMoras: 11,
    accentPhrases: [
      {
        surface: "ありがとうございます",
        reading: "ありがとうございます",
        moras: [
          { mora: "あ", index: 0, pitch: "L", type: "regular" },
          { mora: "り", index: 1, pitch: "H", type: "regular" },
          { mora: "が", index: 2, pitch: "H", type: "regular" },
          { mora: "と", index: 3, pitch: "H", type: "regular" },
          { mora: "う", index: 4, pitch: "L", type: "long_vowel" },
          { mora: "ご", index: 5, pitch: "L", type: "regular" },
          { mora: "ざ", index: 6, pitch: "L", type: "regular" },
          { mora: "い", index: 7, pitch: "L", type: "regular" },
          { mora: "ま", index: 8, pitch: "L", type: "regular" },
          { mora: "す", index: 9, pitch: "L", type: "regular" },
        ],
        accentType: "nakadaka",
        accentNucleus: 3,
      },
    ],
    pitchPattern: "LHHHLLLLL",
  },
];

/** Lookup reference by lineId */
export function getReference(lineId: string): ReferencePitchData | undefined {
  return TEST_REFERENCES.find((r) => r.lineId === lineId);
}
