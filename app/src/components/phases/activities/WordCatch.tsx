import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import * as Speech from "expo-speech";
import { colors, borderRadius } from "../../../constants/theme";
import type { KeyExpression } from "../../../types";

interface Choice {
  emoji: string;
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

  const handleMeaningPeek = useCallback(() => {
    setShowMeaning(true);
    setTimeout(() => setShowMeaning(false), 3000);
  }, []);

  return (
    <View style={styles.container}>
      {/* TTS play */}
      <TouchableOpacity style={styles.playButton} onPress={playTTS}>
        <Text style={styles.playIcon}>{isSpeaking ? "🔊" : "🔈"}</Text>
        <Text style={styles.playLabel}>단어 듣기</Text>
      </TouchableOpacity>

      {/* Emoji choices */}
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
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Sound→Meaning direct link (no Korean) */}
      {selected !== null && choices[selected]?.isCorrect && (
        <View style={styles.resultRow}>
          <Text style={styles.resultSound}>🔊</Text>
          <Text style={styles.resultArrow}>→</Text>
          <TouchableOpacity onPress={handleMeaningPeek}>
            <Text style={styles.resultMeaning}>
              {showMeaning ? expression.emoji || "✓" : "[?]"}
            </Text>
          </TouchableOpacity>
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
  playButton: {
    alignItems: "center",
    marginBottom: 40,
  },
  playIcon: {
    fontSize: 48,
  },
  playLabel: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 8,
  },
  choicesRow: {
    flexDirection: "row",
    gap: 16,
  },
  choiceCard: {
    width: 80,
    height: 80,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
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
    fontSize: 36,
  },
  resultRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 32,
    gap: 12,
  },
  resultSound: {
    fontSize: 28,
  },
  resultArrow: {
    fontSize: 20,
    color: colors.textMuted,
  },
  resultMeaning: {
    fontSize: 28,
    color: colors.primary,
  },
});
