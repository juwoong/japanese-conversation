import React, { useEffect, useRef } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Animated } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import type { Line, FuriganaSegment } from "../types";
import { colors } from "../constants/theme";
import FuriganaText from "./FuriganaText";

interface Props {
  displayText: string;
  line: Line;
  lineIndex: number;
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
        <View style={styles.japaneseRow}>
          <View style={styles.japaneseContent}>
            {line.furigana && line.furigana.length > 0 ? (
              <FuriganaText
                segments={line.furigana}
                fontSize={18}
                color={colors.textDark}
                highlightColor={colors.primary}
                readingColor="#E8636F80"
                speakOnTap
              />
            ) : (
              <Text style={styles.japanese}>{displayText}</Text>
            )}
          </View>
          <TouchableOpacity onPress={() => onSpeak(displayText)}>
            <MaterialIcons
              name="volume-up"
              size={22}
              color={isSpeaking ? colors.primary : colors.textLight}
            />
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
            <View style={styles.grammarToggleRow}>
              <MaterialIcons name="lightbulb-outline" size={16} color={colors.warning} />
              <Text style={styles.grammarToggleText}>왜 이렇게 말할까?</Text>
            </View>
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
    backgroundColor: colors.npcBubble,
    borderRadius: 16,
    borderTopLeftRadius: 4,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  japaneseRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  japaneseContent: {
    flex: 1,
  },
  japanese: {
    fontSize: 18,
    fontWeight: "500",
    color: colors.textDark,
    flex: 1,
    lineHeight: 26,
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
  grammarToggleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  grammarToggleText: {
    fontSize: 13,
    color: colors.warning,
    fontWeight: "500",
  },
  grammarContent: {
    fontSize: 13,
    color: colors.textMedium,
    lineHeight: 18,
    marginTop: 4,
    backgroundColor: colors.warningLight,
    borderRadius: 8,
    padding: 10,
  },
});
