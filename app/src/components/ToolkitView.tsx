/**
 * ToolkitView — "나의 도구 세트" view showing mastered cross-situation
 * expressions. Grouped by category, each expression shows TTS button,
 * Japanese text, and situation badges.
 */

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
} from "react-native";
import * as Speech from "expo-speech";
import { MaterialIcons } from "@expo/vector-icons";
import {
  getToolkitExpressions,
  type CrossSituationEntry,
} from "../lib/crossSituationTracker";
import { colors, borderRadius, shadows } from "../constants/theme";

interface ToolkitViewProps {
  onClose: () => void;
}

// Category mapping for toolkit expressions
type Category = "greeting" | "number" | "question" | "request" | "confirm";

const CATEGORY_CONFIG: Record<Category, { label: string; icon: string }> = {
  greeting: { label: "인사", icon: "waving-hand" },
  number: { label: "숫자", icon: "pin" },
  question: { label: "질문", icon: "help-outline" },
  request: { label: "요청", icon: "front-hand" },
  confirm: { label: "확인", icon: "check-circle-outline" },
};

// Expression-to-category mapping (MVP hardcoded)
const EXPRESSION_CATEGORIES: Record<string, Category> = {
  "すみません": "greeting",
  "ありがとうございます": "greeting",
  "おねがいします": "request",
  "いくらですか": "question",
  "これください": "request",
  "だいじょうぶです": "confirm",
  "はい": "confirm",
  "いいえ": "confirm",
};

function categorize(expression: string): Category {
  return EXPRESSION_CATEGORIES[expression] ?? "greeting";
}

// Expression meaning lookup for the [?] tooltip (inline 3s fade)
const EXPRESSION_MEANINGS: Record<string, string> = {
  "すみません": "저기요 / 죄송합니다",
  "ありがとうございます": "감사합니다",
  "おねがいします": "부탁합니다",
  "いくらですか": "얼마예요?",
  "これください": "이거 주세요",
  "だいじょうぶです": "괜찮습니다",
  "はい": "네",
  "いいえ": "아니요",
};

function InlineMeaningHint({ expression }: { expression: string }) {
  const [visible, setVisible] = useState(false);
  const opacity = React.useRef(new Animated.Value(0)).current;

  const handleTap = () => {
    if (visible) return;
    setVisible(true);
    opacity.setValue(1);
    setTimeout(() => {
      Animated.timing(opacity, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start(() => setVisible(false));
    }, 3000);
  };

  const meaning = EXPRESSION_MEANINGS[expression] ?? "";

  return (
    <View style={styles.hintWrapper}>
      <TouchableOpacity onPress={handleTap} style={styles.hintButton}>
        <Text style={styles.hintButtonText}>?</Text>
      </TouchableOpacity>
      {visible && (
        <Animated.View style={[styles.hintTooltip, { opacity }]}>
          <Text style={styles.hintText}>{meaning}</Text>
        </Animated.View>
      )}
    </View>
  );
}

function SituationBadge({ emoji, slug }: { emoji: string; slug: string }) {
  return (
    <View style={styles.badge}>
      <Text style={styles.badgeEmoji}>{emoji}</Text>
    </View>
  );
}

function ExpressionRow({ entry }: { entry: CrossSituationEntry }) {
  const handleTTS = () => {
    Speech.speak(entry.expression, { language: "ja-JP", rate: 0.8 });
  };

  return (
    <View style={styles.expressionRow}>
      <TouchableOpacity onPress={handleTTS} style={styles.ttsButton}>
        <MaterialIcons name="volume-up" size={20} color={colors.primary} />
      </TouchableOpacity>
      <Text style={styles.japaneseText}>{entry.expression}</Text>
      <View style={styles.badges}>
        {entry.situations.map((s) => (
          <SituationBadge key={s.slug} emoji={s.emoji} slug={s.slug} />
        ))}
      </View>
      <InlineMeaningHint expression={entry.expression} />
    </View>
  );
}

export default function ToolkitView({ onClose }: ToolkitViewProps) {
  const [entries, setEntries] = useState<CrossSituationEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadToolkit();
  }, []);

  const loadToolkit = async () => {
    const toolkit = await getToolkitExpressions();
    setEntries(toolkit);
    setLoading(false);
  };

  // Group by category
  const grouped = new Map<Category, CrossSituationEntry[]>();
  for (const entry of entries) {
    const cat = categorize(entry.expression);
    const list = grouped.get(cat) ?? [];
    list.push(entry);
    grouped.set(cat, list);
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>나의 도구 세트</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <MaterialIcons name="close" size={24} color={colors.textMuted} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {loading ? (
          <Text style={styles.loadingText}>불러오는 중...</Text>
        ) : entries.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>아직 도구가 없어요</Text>
            <Text style={styles.emptyDesc}>
              여러 상황에서 같은 표현을 만나면 여기에 추가돼요
            </Text>
          </View>
        ) : (
          Array.from(grouped.entries()).map(([category, categoryEntries]) => (
            <View key={category} style={styles.categorySection}>
              <View style={styles.categoryHeader}>
                <MaterialIcons
                  name={CATEGORY_CONFIG[category].icon as any}
                  size={18}
                  color={colors.textMuted}
                />
                <Text style={styles.categoryLabel}>
                  {CATEGORY_CONFIG[category].label}
                </Text>
              </View>
              {categoryEntries.map((entry) => (
                <ExpressionRow key={entry.expression} entry={entry} />
              ))}
            </View>
          ))
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.textDark,
  },
  closeButton: {
    padding: 4,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  loadingText: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: "center",
    marginTop: 40,
  },
  emptyState: {
    alignItems: "center",
    paddingTop: 60,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textDark,
  },
  emptyDesc: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: "center",
    lineHeight: 20,
  },
  categorySection: {
    marginTop: 20,
  },
  categoryHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 10,
  },
  categoryLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  expressionRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 10,
  },
  ttsButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  japaneseText: {
    flex: 1,
    fontSize: 18,
    fontWeight: "500",
    color: colors.textDark,
  },
  badges: {
    flexDirection: "row",
    gap: 4,
  },
  badge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.backgroundAlt,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeEmoji: {
    fontSize: 14,
  },
  hintWrapper: {
    position: "relative",
  },
  hintButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.borderLight,
    alignItems: "center",
    justifyContent: "center",
  },
  hintButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textMuted,
  },
  hintTooltip: {
    position: "absolute",
    top: 32,
    right: 0,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    minWidth: 80,
    ...shadows.md,
    zIndex: 10,
  },
  hintText: {
    fontSize: 14,
    color: colors.textMuted,
  },
});
