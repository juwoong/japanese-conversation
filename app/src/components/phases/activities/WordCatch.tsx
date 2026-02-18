import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
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

export default function WordCatch({ expression, choices, onComplete }: Props) {
  const [selected, setSelected] = useState<number | null>(null);
  const [showMeaning, setShowMeaning] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const playTTS = useCallback(() => {
    setIsSpeaking(true);
    Speech.speak(expression.textJa, {
      language: "ja-JP",
      rate: 0.8,
      onDone: () => setIsSpeaking(false),
      onError: () => setIsSpeaking(false),
    });
  }, [expression.textJa]);

  const handleSelect = useCallback(
    (index: number) => {
      if (selected !== null && choices[selected]?.isCorrect) return;

      setSelected(index);
      const choice = choices[index];

      if (choice.isCorrect) {
        setShowMeaning(true);
        setTimeout(onComplete, 1000);
      } else {
        // Wrong — replay and reset
        Speech.speak(expression.textJa, {
          language: "ja-JP",
          rate: 0.8,
          onDone: () => setSelected(null),
          onError: () => setSelected(null),
        });
      }
    },
    [choices, expression.textJa, onComplete, selected],
  );

  return (
    <View style={styles.container}>
      {/* Japanese text with furigana */}
      <View style={styles.japaneseRow}>
        {expression.furigana ? (
          <FuriganaText segments={expression.furigana} fontSize={24} color={colors.textDark} />
        ) : (
          <Text style={styles.japaneseText}>{expression.textJa}</Text>
        )}
      </View>

      {/* TTS play */}
      <TouchableOpacity style={styles.playButton} onPress={playTTS}>
        <Text style={styles.playIcon}>{isSpeaking ? "🔊" : "🔈"}</Text>
        <Text style={styles.playLabel}>발음 듣기</Text>
      </TouchableOpacity>

      {/* Guide text */}
      <Text style={styles.question}>이 단어의 뜻은?</Text>

      {/* Choices with emoji + Korean label */}
      <View style={styles.choicesRow}>
        {choices.map((choice, i) => {
          const isSelected = selected === i;
          const correct = isSelected && choice.isCorrect;
          const wrong = isSelected && !choice.isCorrect;

          return (
            <TouchableOpacity
              key={i}
              style={[
                styles.choiceCard,
                correct && styles.choiceCorrect,
                wrong && styles.choiceWrong,
              ]}
              onPress={() => handleSelect(i)}
              activeOpacity={0.7}
            >
              <Text style={styles.choiceEmoji}>{choice.emoji}</Text>
              <Text style={styles.choiceLabel}>{choice.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Correct feedback */}
      {selected !== null && choices[selected]?.isCorrect && (
        <View style={styles.resultRow}>
          <Text style={styles.resultText}>{expression.textKo}</Text>
        </View>
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
    marginBottom: 12,
  },
  japaneseText: {
    fontSize: 24,
    fontWeight: "600",
    color: colors.textDark,
  },
  playButton: {
    alignItems: "center",
    marginBottom: 24,
  },
  playIcon: {
    fontSize: 36,
  },
  playLabel: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 4,
  },
  question: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textMedium,
    marginBottom: 20,
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
    paddingVertical: 16,
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
    marginBottom: 6,
  },
  choiceLabel: {
    fontSize: 12,
    color: colors.textMedium,
    textAlign: "center",
  },
  resultRow: {
    marginTop: 24,
  },
  resultText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.success,
  },
});
