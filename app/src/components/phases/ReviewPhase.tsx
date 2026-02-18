/**
 * ReviewPhase — Phase 4: Key expression review.
 *
 * Shows:
 *   - Completion message (no score/percentage)
 *   - Each key expression with TTS, [?] for meaning, collapsible grammar
 *   - "지도로 돌아가기" button
 *
 * Rules:
 *   - No scores, levels, XP
 *   - No Korean pronunciation
 *   - No grammar terminology
 *   - [?] shows Korean meaning for 3 seconds then fades
 */

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import * as Speech from "expo-speech";
import { MaterialIcons } from "@expo/vector-icons";
import { colors, borderRadius } from "../../constants/theme";
import FuriganaText from "../FuriganaText";
import SafetyNetTooltip from "../SafetyNetTooltip";
import { recordExposure } from "../../lib/exposureTracker";
import type {
  KeyExpression,
  EngagePerformance,
  SessionMode,
} from "../../types";

interface ReviewPhaseProps {
  keyExpressions: KeyExpression[];
  performance?: EngagePerformance;
  situationName?: string;
  inputMode: SessionMode;
  onComplete: () => void;
}

/**
 * Hardcoded grammar explanations for MVP.
 * No grammar terminology — plain-language Korean explanations.
 */
const grammarExplanations: Record<
  string,
  {
    explanation: string;
    examples: { ja: string; ko: string }[];
    hint: string;
  }
> = {
  にします: {
    explanation:
      "메뉴를 골랐을 때, に는 \"이걸로!\"라는 선택의 느낌이에요. します를 붙이면 정중해져요.",
    examples: [
      { ja: "ラーメンにします", ko: "라면으로 할게요" },
      { ja: "ビールにします", ko: "맥주로 할게요" },
      { ja: "これにします", ko: "이걸로 할게요" },
    ],
    hint: "に 뒤에 뭘 넣어도 같은 패턴이에요.",
  },
  ください: {
    explanation:
      "뭔가를 부탁할 때 쓰는 표현이에요. 가장 기본적인 정중한 부탁 방법이에요.",
    examples: [
      { ja: "水をください", ko: "물 주세요" },
      { ja: "メニューをください", ko: "메뉴 주세요" },
      { ja: "これをください", ko: "이거 주세요" },
    ],
    hint: "を 앞에 원하는 것을 넣으면 돼요.",
  },
  おねがいします: {
    explanation:
      "\"부탁합니다\"라는 뜻으로, 뭔가를 요청할 때 정중하게 쓰는 표현이에요.",
    examples: [
      { ja: "チェックインおねがいします", ko: "체크인 부탁합니다" },
      { ja: "会計おねがいします", ko: "계산 부탁합니다" },
      { ja: "予約おねがいします", ko: "예약 부탁합니다" },
    ],
    hint: "하고 싶은 것 뒤에 붙이면 돼요.",
  },
  ありますか: {
    explanation:
      "\"있나요?\"라고 물어볼 때 쓰는 표현이에요. 물건이나 방이 있는지 확인할 때 쓰면 돼요.",
    examples: [
      { ja: "空きはありますか", ko: "빈 것 있나요?" },
      { ja: "Wi-Fiはありますか", ko: "와이파이 있나요?" },
      { ja: "日本語メニューはありますか", ko: "일본어 메뉴 있나요?" },
    ],
    hint: "は 앞에 찾는 것을 넣으면 돼요.",
  },
  です: {
    explanation:
      "\"~입니다\"라는 뜻으로, 자기 소개나 설명할 때 문장 끝에 붙여요.",
    examples: [
      { ja: "ふたりです", ko: "두 명입니다" },
      { ja: "予約のキムです", ko: "예약한 김입니다" },
      { ja: "日本語学生です", ko: "일본어 학생입니다" },
    ],
    hint: "뭐든 뒤에 붙이면 정중한 문장이 돼요.",
  },
};

/**
 * Try to find a grammar explanation by matching substrings.
 */
function findGrammarExplanation(textJa: string) {
  for (const key of Object.keys(grammarExplanations)) {
    if (textJa.includes(key)) {
      return grammarExplanations[key];
    }
  }
  return null;
}

export default function ReviewPhase({
  keyExpressions,
  performance,
  situationName,
  inputMode,
  onComplete,
}: ReviewPhaseProps) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [expandedGrammar, setExpandedGrammar] = useState<Set<number>>(
    new Set()
  );

  // Record exposure for each key expression when shown
  useEffect(() => {
    keyExpressions.forEach((expr) => {
      recordExposure(expr.textJa);
    });
  }, [keyExpressions]);

  const speakText = (text: string) => {
    if (isSpeaking) return;
    setIsSpeaking(true);
    Speech.speak(text, {
      language: "ja-JP",
      rate: 0.8,
      onDone: () => setIsSpeaking(false),
      onError: () => setIsSpeaking(false),
    });
  };

  const toggleGrammar = (index: number) => {
    setExpandedGrammar((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  // Determine ability statement based on performance (never show scores/percentages)
  const getAbilityStatement = (): string => {
    if (!performance || performance.userTurns === 0) {
      return "이 상황을 혼자 해결할 수 있어요";
    }
    const correctRatio = performance.correctCount / performance.userTurns;
    if (correctRatio >= 0.7) {
      return "이 상황을 혼자 해결할 수 있어요";
    }
    return "조금 더 연습하면 혼자 할 수 있어요";
  };

  const headerTitle = situationName
    ? `${situationName}에서 대화 완료!`
    : "대화 완료!";

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      {/* Completion header */}
      <View style={styles.completionHeader}>
        <MaterialIcons name="check-circle" size={40} color={colors.success} />
        <Text style={styles.completionTitle}>{headerTitle}</Text>
        <Text style={styles.completionSubtitle}>
          {getAbilityStatement()}
        </Text>
      </View>

      {/* Key expressions list */}
      <View style={styles.expressionList}>
        <Text style={styles.sectionTitle}>이번에 배운 표현</Text>

        {keyExpressions.map((expr, i) => {
          const grammar = findGrammarExplanation(expr.textJa);
          const isGrammarOpen = expandedGrammar.has(i);

          return (
            <View key={i} style={styles.expressionCard}>
              {/* Japanese text + speaker */}
              <View style={styles.expressionRow}>
                <TouchableOpacity
                  onPress={() => speakText(expr.textJa)}
                  style={styles.speakerButton}
                >
                  <MaterialIcons
                    name="volume-up"
                    size={22}
                    color={isSpeaking ? colors.primary : colors.textLight}
                  />
                </TouchableOpacity>
                <View style={styles.expressionTextArea}>
                  {expr.furigana && expr.furigana.length > 0 ? (
                    <FuriganaText
                      segments={expr.furigana}
                      fontSize={18}
                      color={colors.textDark}
                      highlightColor={colors.primary}
                      readingColor="#E8636F80"
                      speakOnTap
                    />
                  ) : (
                    <Text style={styles.expressionJa}>{expr.textJa}</Text>
                  )}
                </View>
                {/* [?] safety net tooltip */}
                <SafetyNetTooltip
                  word={expr.textJa}
                  meaning={expr.textKo}
                  emoji={expr.emoji}
                />
              </View>

              {/* Grammar explanation toggle */}
              {grammar && (
                <TouchableOpacity
                  onPress={() => toggleGrammar(i)}
                  style={styles.grammarToggle}
                >
                  <Text style={styles.grammarToggleText}>
                    왜 이렇게 말할까?{" "}
                    {isGrammarOpen ? "▴" : "▾"}
                  </Text>
                </TouchableOpacity>
              )}

              {/* Grammar content */}
              {grammar && isGrammarOpen && (
                <View style={styles.grammarContent}>
                  <Text style={styles.grammarExplanation}>
                    {grammar.explanation}
                  </Text>
                  <View style={styles.grammarExamples}>
                    {grammar.examples.map((ex, j) => (
                      <View key={j} style={styles.grammarExample}>
                        <Text style={styles.grammarExampleJa}>{ex.ja}</Text>
                        <Text style={styles.grammarExampleKo}>{ex.ko}</Text>
                      </View>
                    ))}
                  </View>
                  <Text style={styles.grammarHint}>{grammar.hint}</Text>
                </View>
              )}
            </View>
          );
        })}
      </View>

      {/* Navigation button */}
      <TouchableOpacity style={styles.completeButton} onPress={onComplete}>
        <Text style={styles.completeButtonText}>지도로 돌아가기</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 24,
    paddingBottom: 48,
  },
  // Completion header
  completionHeader: {
    alignItems: "center",
    marginBottom: 32,
    gap: 8,
  },
  completionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.textDark,
    textAlign: "center",
    marginTop: 8,
  },
  completionSubtitle: {
    fontSize: 15,
    color: colors.textMuted,
    textAlign: "center",
  },
  // Section
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textMuted,
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  expressionList: {
    marginBottom: 32,
  },
  // Expression card
  expressionCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    marginBottom: 12,
  },
  expressionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  speakerButton: {
    padding: 4,
  },
  expressionTextArea: {
    flex: 1,
  },
  expressionJa: {
    fontSize: 18,
    fontWeight: "500",
    color: colors.textDark,
    lineHeight: 26,
  },
  // Grammar
  grammarToggle: {
    marginTop: 10,
    marginLeft: 36,
  },
  grammarToggleText: {
    fontSize: 13,
    color: colors.secondary,
    fontWeight: "500",
  },
  grammarContent: {
    marginTop: 8,
    marginLeft: 36,
    backgroundColor: colors.secondaryLight,
    borderRadius: borderRadius.sm,
    padding: 14,
  },
  grammarExplanation: {
    fontSize: 14,
    color: colors.textMedium,
    lineHeight: 22,
    marginBottom: 12,
  },
  grammarExamples: {
    gap: 6,
    marginBottom: 10,
  },
  grammarExample: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  grammarExampleJa: {
    fontSize: 15,
    fontWeight: "500",
    color: colors.textDark,
  },
  grammarExampleKo: {
    fontSize: 13,
    color: colors.textMuted,
  },
  grammarHint: {
    fontSize: 13,
    color: colors.secondary,
    fontWeight: "500",
    fontStyle: "italic",
  },
  // Complete button
  completeButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    paddingVertical: 16,
    alignItems: "center",
  },
  completeButtonText: {
    fontSize: 17,
    fontWeight: "bold",
    color: colors.surface,
  },
});
