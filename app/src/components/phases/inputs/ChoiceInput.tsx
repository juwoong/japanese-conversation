/**
 * ChoiceInput — 3-choice selection for first-time learners (visitCount <= 2).
 *
 * Shows NPC question + 3 hiragana choices with speaker icons.
 * Tapping a choice plays its TTS preview.
 * Selecting the correct answer triggers onAnswer(true), wrong => onAnswer(false).
 * No Korean text shown in choices — only hiragana + speaker icon.
 */

import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import * as Speech from "expo-speech";
import * as Haptics from "expo-haptics";
import { colors, borderRadius } from "../../../constants/theme";
import type { FuriganaSegment } from "../../../types";
import FuriganaText from "../../FuriganaText";

interface Choice {
  textJa: string;
  isCorrect: boolean;
  furigana?: FuriganaSegment[];
}

interface ChoiceInputProps {
  npcQuestion: string;
  choices: Choice[];
  onAnswer: (correct: boolean, chosenText: string) => void;
  isBranch?: boolean;
}

export default function ChoiceInput({
  npcQuestion,
  choices,
  onAnswer,
  isBranch = false,
}: ChoiceInputProps) {
  const [selected, setSelected] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState<number | null>(null);

  const handlePreview = (index: number, text: string) => {
    if (revealed) return;
    setIsSpeaking(index);
    Speech.speak(text, {
      language: "ja-JP",
      rate: 0.8,
      onDone: () => setIsSpeaking(null),
      onError: () => setIsSpeaking(null),
    });
  };

  const handleSelect = (index: number) => {
    if (revealed) return;
    const choice = choices[index];
    setSelected(index);
    setRevealed(true);

    if (isBranch) {
      // Branch mode: all choices are valid, light success feedback
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setTimeout(() => {
        onAnswer(true, choice.textJa);
      }, 500);
      return;
    }

    if (choice.isCorrect) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }

    // Brief delay to show result before calling onAnswer
    setTimeout(() => {
      onAnswer(choice.isCorrect, choice.textJa);
    }, 800);
  };

  const getChoiceStyle = (index: number) => {
    if (!revealed) return styles.choice;
    if (isBranch) {
      // Branch mode: selected gets highlight, others fade
      return index === selected
        ? [styles.choice, styles.choiceBranchSelected]
        : [styles.choice, styles.choiceFaded];
    }
    const choice = choices[index];
    if (index === selected) {
      return [
        styles.choice,
        choice.isCorrect ? styles.choiceCorrect : styles.choiceWrong,
      ];
    }
    if (choice.isCorrect) {
      return [styles.choice, styles.choiceCorrectHint];
    }
    return [styles.choice, styles.choiceFaded];
  };

  return (
    <View style={styles.container}>
      {choices.map((choice, i) => (
        <TouchableOpacity
          key={i}
          style={getChoiceStyle(i)}
          onPress={() => handleSelect(i)}
          activeOpacity={0.7}
          disabled={revealed}
        >
          <View style={{ flex: 1 }}>
            {choice.furigana && choice.furigana.length > 0 ? (
              <FuriganaText
                segments={choice.furigana}
                fontSize={18}
                color={colors.textDark}
                highlightColor={colors.primary}
                readingColor="#E8636F80"
                speakOnTap
              />
            ) : (
              <Text style={styles.choiceText}>{choice.textJa}</Text>
            )}
          </View>
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation();
              handlePreview(i, choice.textJa);
            }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <MaterialIcons
              name="volume-up"
              size={20}
              color={isSpeaking === i ? colors.primary : colors.textLight}
            />
          </TouchableOpacity>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 10,
    paddingHorizontal: 16,
  },
  choice: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  choiceCorrect: {
    borderColor: colors.success,
    backgroundColor: colors.successLight,
  },
  choiceWrong: {
    borderColor: colors.border,
    opacity: 0.5,
  },
  choiceBranchSelected: {
    borderColor: colors.primary,
    backgroundColor: `${colors.primary}15`,
  },
  choiceCorrectHint: {
    borderColor: colors.success,
    borderStyle: "dashed" as any,
  },
  choiceFaded: {
    opacity: 0.4,
  },
  choiceText: {
    fontSize: 18,
    fontWeight: "500",
    color: colors.textDark,
  },
});
