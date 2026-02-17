import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import * as Speech from "expo-speech";
import { colors, borderRadius } from "../../../constants/theme";

interface MinimalPair {
  wordA: string;
  wordB: string;
  emojiA: string;
  emojiB: string;
  isSame: boolean; // whether the played pair is actually the same word
}

interface Props {
  pair: MinimalPair;
  onComplete: () => void;
}

export default function SoundDistinction({ pair, onComplete }: Props) {
  const [answered, setAnswered] = useState(false);
  const [correct, setCorrect] = useState(false);
  const [playingA, setPlayingA] = useState(false);
  const [playingB, setPlayingB] = useState(false);

  const playA = useCallback(() => {
    setPlayingA(true);
    Speech.speak(pair.wordA, {
      language: "ja-JP",
      rate: 0.7,
      onDone: () => setPlayingA(false),
      onError: () => setPlayingA(false),
    });
  }, [pair.wordA]);

  const playB = useCallback(() => {
    setPlayingB(true);
    Speech.speak(pair.isSame ? pair.wordA : pair.wordB, {
      language: "ja-JP",
      rate: 0.7,
      onDone: () => setPlayingB(false),
      onError: () => setPlayingB(false),
    });
  }, [pair]);

  const handleAnswer = useCallback(
    (userSaysSame: boolean) => {
      const isCorrect = userSaysSame === pair.isSame;
      setAnswered(true);
      setCorrect(isCorrect);
      setTimeout(onComplete, 1200);
    },
    [pair.isSame, onComplete],
  );

  return (
    <View style={styles.container}>
      {/* Two sounds side by side */}
      <View style={styles.soundRow}>
        <TouchableOpacity style={styles.soundButton} onPress={playA}>
          <Text style={styles.soundLabel}>A</Text>
          <Text style={styles.soundIcon}>{playingA ? "🔊" : "🔈"}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.soundButton} onPress={playB}>
          <Text style={styles.soundLabel}>B</Text>
          <Text style={styles.soundIcon}>{playingB ? "🔊" : "🔈"}</Text>
        </TouchableOpacity>
      </View>

      {/* Question */}
      <Text style={styles.question}>같은 말일까요?</Text>

      {/* Answer buttons */}
      {!answered ? (
        <View style={styles.answerRow}>
          <TouchableOpacity
            style={styles.answerButton}
            onPress={() => handleAnswer(true)}
          >
            <Text style={styles.answerText}>같다</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.answerButton}
            onPress={() => handleAnswer(false)}
          >
            <Text style={styles.answerText}>다르다</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.resultArea}>
          <Text
            style={[styles.resultText, correct ? styles.correctText : styles.wrongText]}
          >
            {correct ? "맞아요!" : "다시 들어볼까요?"}
          </Text>
          <View style={styles.meaningRow}>
            <View style={styles.meaningItem}>
              <Text style={styles.meaningEmoji}>{pair.emojiA}</Text>
            </View>
            {!pair.isSame && (
              <>
                <Text style={styles.meaningDivider}>≠</Text>
                <View style={styles.meaningItem}>
                  <Text style={styles.meaningEmoji}>{pair.emojiB}</Text>
                </View>
              </>
            )}
          </View>
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
  soundRow: {
    flexDirection: "row",
    gap: 24,
    marginBottom: 32,
  },
  soundButton: {
    width: 80,
    height: 80,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  soundLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textMuted,
    marginBottom: 4,
  },
  soundIcon: {
    fontSize: 28,
  },
  question: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.textDark,
    marginBottom: 24,
  },
  answerRow: {
    flexDirection: "row",
    gap: 16,
  },
  answerButton: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderColor: colors.border,
    paddingVertical: 14,
    paddingHorizontal: 32,
  },
  answerText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textDark,
  },
  resultArea: {
    alignItems: "center",
  },
  resultText: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 16,
  },
  correctText: {
    color: colors.success,
  },
  wrongText: {
    color: colors.danger,
  },
  meaningRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  meaningItem: {
    alignItems: "center",
  },
  meaningEmoji: {
    fontSize: 36,
  },
  meaningDivider: {
    fontSize: 24,
    color: colors.textMuted,
  },
});
