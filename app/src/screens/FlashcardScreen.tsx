import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from "react-native";
import * as Speech from "expo-speech";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { supabase } from "../lib/supabase";
import type { RootStackParamList } from "../types";
import { colors } from "../constants/theme";
import LoadingScreen from "../components/LoadingScreen";
import BackHeader from "../components/BackHeader";

type Props = NativeStackScreenProps<RootStackParamList, "Flashcard">;

interface FlashcardItem {
  id: number;
  text_ja: string;
  text_ko: string;
  pronunciation_ko: string | null;
  accuracy: number;
}

export default function FlashcardScreen({ navigation }: Props) {
  const [cards, setCards] = useState<FlashcardItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    loadWeakCards();
  }, []);

  const loadWeakCards = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Get SRS cards
    const { data: srsCards } = await supabase
      .from("srs_cards")
      .select(`
        id,
        line_id,
        lines!inner (
          id,
          text_ja,
          text_ko,
          pronunciation_ko,
          speaker
        )
      `)
      .eq("user_id", user.id)
      .gt("reps", 0);

    // Get accuracy
    const { data: attempts } = await supabase
      .from("user_attempts")
      .select("line_id, accuracy")
      .eq("user_id", user.id)
      .order("attempted_at", { ascending: false });

    const accuracyMap: Record<number, number> = {};
    attempts?.forEach((a) => {
      if (!(a.line_id in accuracyMap)) {
        accuracyMap[a.line_id] = a.accuracy;
      }
    });

    const weak = (srsCards || [])
      .filter((c: any) => {
        const acc = accuracyMap[c.line_id];
        return c.lines?.speaker === "user" && acc !== undefined && acc < 0.7;
      })
      .map((c: any) => ({
        id: c.id,
        text_ja: c.lines.text_ja,
        text_ko: c.lines.text_ko,
        pronunciation_ko: c.lines.pronunciation_ko,
        accuracy: accuracyMap[c.line_id],
      }))
      // Shuffle
      .sort(() => Math.random() - 0.5);

    setCards(weak);
    setLoading(false);
  };

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

  const handleNext = () => {
    setShowAnswer(false);
    if (currentIndex < cards.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrev = () => {
    setShowAnswer(false);
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  if (loading) return <LoadingScreen />;

  if (cards.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <BackHeader title="플래시카드" onBack={() => navigation.goBack()} />
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>🎉</Text>
          <Text style={styles.emptyText}>
            약한 표현이 없습니다!{"\n"}잘하고 계세요.
          </Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>돌아가기</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const card = cards[currentIndex];

  return (
    <SafeAreaView style={styles.container}>
      <BackHeader title="플래시카드" onBack={() => navigation.goBack()} />

      {/* Progress */}
      <View style={styles.progressRow}>
        <Text style={styles.progressText}>
          {currentIndex + 1} / {cards.length}
        </Text>
        <Text style={styles.accuracyLabel}>
          정확도: {Math.round(card.accuracy * 100)}%
        </Text>
      </View>

      {/* Card */}
      <TouchableOpacity
        style={styles.card}
        onPress={() => setShowAnswer(!showAnswer)}
        activeOpacity={0.9}
      >
        {!showAnswer ? (
          <>
            <Text style={styles.cardKorean}>{card.text_ko}</Text>
            <Text style={styles.cardHint}>터치하여 답 보기</Text>
          </>
        ) : (
          <>
            <Text style={styles.cardJapanese}>{card.text_ja}</Text>
            {card.pronunciation_ko && (
              <Text style={styles.cardPronunciation}>{card.pronunciation_ko}</Text>
            )}
            <Text style={styles.cardKoreanSmall}>{card.text_ko}</Text>
            <TouchableOpacity
              style={styles.speakButton}
              onPress={() => speakText(card.text_ja)}
            >
              <Text style={styles.speakButtonText}>
                {isSpeaking ? "🔊 재생 중..." : "🔈 발음 듣기"}
              </Text>
            </TouchableOpacity>
          </>
        )}
      </TouchableOpacity>

      {/* Navigation */}
      <View style={styles.navRow}>
        <TouchableOpacity
          style={[styles.navButton, currentIndex === 0 && styles.navButtonDisabled]}
          onPress={handlePrev}
          disabled={currentIndex === 0}
        >
          <Text style={[styles.navButtonText, currentIndex === 0 && styles.navButtonTextDisabled]}>
            ← 이전
          </Text>
        </TouchableOpacity>

        {currentIndex < cards.length - 1 ? (
          <TouchableOpacity style={styles.navButtonPrimary} onPress={handleNext}>
            <Text style={styles.navButtonPrimaryText}>다음 →</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.navButtonPrimary}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.navButtonPrimaryText}>완료</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  progressRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  progressText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textMuted,
  },
  accuracyLabel: {
    fontSize: 14,
    color: colors.danger,
    fontWeight: "500",
  },
  card: {
    flex: 1,
    backgroundColor: colors.surface,
    marginHorizontal: 20,
    marginVertical: 12,
    borderRadius: 20,
    padding: 32,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  cardKorean: {
    fontSize: 22,
    fontWeight: "600",
    color: colors.textDark,
    textAlign: "center",
    lineHeight: 32,
  },
  cardHint: {
    fontSize: 14,
    color: colors.textLight,
    marginTop: 20,
  },
  cardJapanese: {
    fontSize: 28,
    fontWeight: "bold",
    color: colors.textDark,
    textAlign: "center",
    lineHeight: 40,
  },
  cardPronunciation: {
    fontSize: 16,
    color: colors.primary,
    marginTop: 8,
  },
  cardKoreanSmall: {
    fontSize: 16,
    color: colors.textMuted,
    marginTop: 16,
    textAlign: "center",
  },
  speakButton: {
    marginTop: 24,
    backgroundColor: colors.primary + "15",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  speakButtonText: {
    fontSize: 15,
    color: colors.primary,
    fontWeight: "500",
  },
  navRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingBottom: 24,
    gap: 12,
  },
  navButton: {
    flex: 1,
    backgroundColor: colors.border,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
  },
  navButtonDisabled: {
    opacity: 0.4,
  },
  navButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textMuted,
  },
  navButtonTextDisabled: {
    color: colors.textLight,
  },
  navButtonPrimary: {
    flex: 1,
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
  },
  navButtonPrimaryText: {
    fontSize: 16,
    fontWeight: "bold",
    color: colors.surface,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    color: colors.textMuted,
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: colors.surface,
  },
});
