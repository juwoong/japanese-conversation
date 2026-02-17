/**
 * FillBlankInput — Fill-in-the-blank for intermediate learners (visitCount 3~4).
 *
 * Shows a sentence with a blank: "_____ にんです"
 * Below: selectable word chips. Correct choice fills the blank.
 */

import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import * as Haptics from "expo-haptics";
import { colors, borderRadius } from "../../../constants/theme";

interface FillBlankInputProps {
  /** Full correct answer text, e.g. "ふたりにんです" */
  fullText: string;
  /** The blank portion, e.g. "ふたり" */
  blankWord: string;
  /** Choices including the correct one */
  wordChoices: string[];
  onAnswer: (correct: boolean, chosenText: string) => void;
}

export default function FillBlankInput({
  fullText,
  blankWord,
  wordChoices,
  onAnswer,
}: FillBlankInputProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);

  // Build display with blank
  const blankIndex = fullText.indexOf(blankWord);
  const prefix = blankIndex >= 0 ? fullText.slice(0, blankIndex) : "";
  const suffix =
    blankIndex >= 0 ? fullText.slice(blankIndex + blankWord.length) : fullText;

  const handleSelect = (word: string) => {
    if (revealed) return;
    setSelected(word);
    setRevealed(true);

    const correct = word === blankWord;
    if (correct) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }

    setTimeout(() => {
      onAnswer(correct, correct ? fullText : prefix + word + suffix);
    }, 600);
  };

  const getChipStyle = (word: string) => {
    if (!revealed) return styles.chip;
    if (word === selected) {
      return [
        styles.chip,
        word === blankWord ? styles.chipCorrect : styles.chipWrong,
      ];
    }
    if (word === blankWord) return [styles.chip, styles.chipCorrectHint];
    return [styles.chip, styles.chipFaded];
  };

  return (
    <View style={styles.container}>
      {/* Sentence with blank */}
      <View style={styles.sentenceRow}>
        {prefix ? <Text style={styles.sentenceText}>{prefix}</Text> : null}
        <View style={styles.blank}>
          <Text style={styles.blankText}>
            {revealed && selected ? selected : "______"}
          </Text>
        </View>
        {suffix ? <Text style={styles.sentenceText}>{suffix}</Text> : null}
      </View>

      {/* Word choices */}
      <View style={styles.chips}>
        {wordChoices.map((word, i) => (
          <TouchableOpacity
            key={i}
            style={getChipStyle(word)}
            onPress={() => handleSelect(word)}
            disabled={revealed}
            activeOpacity={0.7}
          >
            <Text style={styles.chipText}>{word}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    gap: 20,
  },
  sentenceRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "center",
  },
  sentenceText: {
    fontSize: 20,
    fontWeight: "500",
    color: colors.textDark,
  },
  blank: {
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
    paddingHorizontal: 8,
    paddingBottom: 2,
    marginHorizontal: 4,
    minWidth: 60,
    alignItems: "center",
  },
  blankText: {
    fontSize: 20,
    fontWeight: "500",
    color: colors.primary,
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 10,
  },
  chip: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingVertical: 10,
    paddingHorizontal: 18,
  },
  chipCorrect: {
    borderColor: colors.success,
    backgroundColor: colors.successLight,
  },
  chipWrong: {
    borderColor: colors.danger,
    backgroundColor: colors.dangerLight,
  },
  chipCorrectHint: {
    borderColor: colors.success,
    borderStyle: "dashed" as any,
  },
  chipFaded: {
    opacity: 0.4,
  },
  chipText: {
    fontSize: 18,
    fontWeight: "500",
    color: colors.textDark,
  },
});
