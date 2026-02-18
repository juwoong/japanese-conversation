import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from "react-native";
import * as Speech from "expo-speech";
import { colors, borderRadius } from "../../../constants/theme";
import FuriganaText from "../../FuriganaText";
import type { KeyExpression } from "../../../types";

interface Choice {
  emoji: string;
  label: string;
  isCorrect: boolean;
}

interface Props {
  expression: KeyExpression;
  choices: Choice[];
  onComplete: () => void;
}

export default function ChunkCatch({ expression, choices, onComplete }: Props) {
  const [selected, setSelected] = useState<number | null>(null);
  const [isWrong, setIsWrong] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const playTTS = useCallback(() => {
    setIsSpeaking(true);
    Speech.speak(expression.textJa, {
      language: "ja-JP",
      onDone: () => setIsSpeaking(false),
      onError: () => setIsSpeaking(false),
    });
  }, [expression.textJa]);

  const handleSelect = useCallback(
    (index: number) => {
      setSelected(index);
      const choice = choices[index];

      if (choice.isCorrect) {
        // Correct — move on after brief delay
        setTimeout(onComplete, 600);
      } else {
        // Wrong — replay TTS and allow retry
        setIsWrong(true);
        Speech.speak(expression.textJa, {
          language: "ja-JP",
          onDone: () => {
            setSelected(null);
            setIsWrong(false);
          },
          onError: () => {
            setSelected(null);
            setIsWrong(false);
          },
        });
      }
    },
    [choices, expression.textJa, onComplete],
  );

  return (
    <View style={styles.container}>
      {/* Japanese text with furigana */}
      <View style={styles.japaneseRow}>
        {expression.furigana ? (
          <FuriganaText segments={expression.furigana} fontSize={22} color={colors.textDark} />
        ) : (
          <Text style={styles.japaneseText}>{expression.textJa}</Text>
        )}
      </View>

      {/* TTS play button */}
      <TouchableOpacity style={styles.playButton} onPress={playTTS}>
        <Text style={styles.playIcon}>{isSpeaking ? "🔊" : "🔈"}</Text>
        <Text style={styles.playLabel}>소리 듣기</Text>
      </TouchableOpacity>

      {/* Question */}
      <Text style={styles.question}>이 표현은 어떤 뜻일까요?</Text>

      {/* Choices */}
      <View style={styles.choicesRow}>
        {choices.map((choice, i) => {
          const isSelected = selected === i;
          const showCorrect = isSelected && choice.isCorrect;
          const showWrong = isSelected && !choice.isCorrect;

          return (
            <TouchableOpacity
              key={i}
              style={[
                styles.choiceCard,
                showCorrect && styles.choiceCorrect,
                showWrong && styles.choiceWrong,
              ]}
              onPress={() => handleSelect(i)}
              disabled={selected !== null && choices[selected]?.isCorrect}
              activeOpacity={0.7}
            >
              <Text style={styles.choiceEmoji}>{choice.emoji}</Text>
              <Text style={styles.choiceLabel}>{choice.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {isWrong && (
        <Text style={styles.retryHint}>한번 더 들어볼게요...</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  japaneseRow: {
    alignItems: "center",
    marginBottom: 16,
  },
  japaneseText: {
    fontSize: 22,
    fontWeight: "600",
    color: colors.textDark,
  },
  playButton: {
    alignItems: "center",
    marginBottom: 32,
  },
  playIcon: {
    fontSize: 48,
  },
  playLabel: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 8,
  },
  question: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.textDark,
    marginBottom: 24,
    textAlign: "center",
  },
  choicesRow: {
    flexDirection: "row",
    gap: 12,
  },
  choiceCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: colors.border,
    paddingVertical: 20,
    alignItems: "center",
  },
  choiceCorrect: {
    borderColor: colors.success,
    backgroundColor: colors.successLight,
  },
  choiceWrong: {
    borderColor: colors.danger,
    backgroundColor: colors.dangerLight,
  },
  choiceEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  choiceLabel: {
    fontSize: 13,
    color: colors.textMedium,
    textAlign: "center",
  },
  retryHint: {
    marginTop: 16,
    fontSize: 14,
    color: colors.textMuted,
  },
});
