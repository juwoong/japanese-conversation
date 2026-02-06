import React, { useEffect, useRef } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Animated } from "react-native";
import type { Line } from "../types";
import { colors } from "../constants/theme";

interface Props {
  displayText: string;
  line: Line;
  lineIndex: number;
  showPronunciation: boolean;
  isSpeaking: boolean;
  isRevealed: boolean;
  isGrammarOpen: boolean;
  onSpeak: (text: string) => void;
  onToggleTranslation: (lineIndex: number) => void;
  onToggleGrammar: (lineIndex: number) => void;
}

export default function NpcBubble({
  displayText,
  line,
  lineIndex,
  showPronunciation,
  isSpeaking,
  isRevealed,
  isGrammarOpen,
  onSpeak,
  onToggleTranslation,
  onToggleGrammar,
}: Props) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateAnim = useRef(new Animated.Value(15)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(translateAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.wrapper,
        {
          opacity: fadeAnim,
          transform: [{ translateY: translateAnim }],
        },
      ]}
    >
      <View style={styles.bubble}>
        {showPronunciation && line.pronunciation_ko && (
          <Text style={styles.pronunciation}>{line.pronunciation_ko}</Text>
        )}
        <View style={styles.japaneseRow}>
          <Text style={styles.japanese}>{displayText}</Text>
          <TouchableOpacity onPress={() => onSpeak(displayText)}>
            <Text style={styles.speaker}>{isSpeaking ? "🔊" : "🔈"}</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.translationArea}
          onPress={() => onToggleTranslation(lineIndex)}
          activeOpacity={0.7}
        >
          {isRevealed ? (
            <Text style={styles.translation}>{line.text_ko}</Text>
          ) : (
            <View style={styles.blurredTranslation}>
              <Text style={styles.blurredText}>터치하여 번역</Text>
            </View>
          )}
        </TouchableOpacity>

        {line.grammar_hint && (
          <TouchableOpacity
            onPress={() => onToggleGrammar(lineIndex)}
            style={styles.grammarToggle}
          >
            <Text style={styles.grammarToggleText}>💡 문법 팁</Text>
            {isGrammarOpen && (
              <Text style={styles.grammarContent}>{line.grammar_hint}</Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: "flex-start",
    marginBottom: 12,
  },
  bubble: {
    minWidth: "60%",
    maxWidth: "80%",
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderTopLeftRadius: 4,
    padding: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  pronunciation: {
    fontSize: 13,
    color: colors.primary,
    marginBottom: 4,
  },
  japaneseRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  japanese: {
    fontSize: 18,
    fontWeight: "500",
    color: colors.textDark,
    flex: 1,
    lineHeight: 26,
  },
  speaker: {
    fontSize: 18,
  },
  translationArea: {
    marginTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    paddingTop: 10,
  },
  translation: {
    fontSize: 14,
    color: colors.textMuted,
    lineHeight: 20,
  },
  blurredTranslation: {
    backgroundColor: colors.borderLight,
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  blurredText: {
    fontSize: 13,
    color: colors.textLight,
    textAlign: "center",
  },
  grammarToggle: {
    marginTop: 8,
  },
  grammarToggleText: {
    fontSize: 13,
    color: "#92400e",
    fontWeight: "500",
  },
  grammarContent: {
    fontSize: 13,
    color: "#78350f",
    lineHeight: 18,
    marginTop: 4,
    backgroundColor: "#fef3c7",
    borderRadius: 8,
    padding: 10,
  },
});
