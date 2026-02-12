import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Speech from "expo-speech";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { supabase } from "../lib/supabase";
import { gradeFlashcard } from "../lib/flashcardGrading";
import type { RootStackParamList } from "../types";
import type { Rating } from "../lib/fsrs";
import { colors } from "../constants/theme";
import { MaterialIcons } from "@expo/vector-icons";
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
  const [isGrading, setIsGrading] = useState(false);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;

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

  const animateCardTransition = (direction: "left" | "right", callback: () => void) => {
    const targetX = direction === "left" ? -300 : 300;
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: targetX,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      callback();
      slideAnim.setValue(direction === "left" ? 300 : -300);
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

  const handleGrade = async (rating: Rating) => {
    if (isGrading) return;
    setIsGrading(true);
    try {
      await gradeFlashcard(cards[currentIndex].id, rating);
      // Animate and move to next card
      if (currentIndex < cards.length - 1) {
        animateCardTransition("left", () => {
          setShowAnswer(false);
          setCurrentIndex(currentIndex + 1);
        });
      } else {
        navigation.goBack();
      }
    } catch (error) {
      console.error("Grading error:", error);
      Alert.alert("오류", "평가 저장에 실패했습니다.");
    } finally {
      setIsGrading(false);
    }
  };

  const handleNext = () => {
    if (currentIndex < cards.length - 1) {
      animateCardTransition("left", () => {
        setShowAnswer(false);
        setCurrentIndex(currentIndex + 1);
      });
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      animateCardTransition("right", () => {
        setShowAnswer(false);
        setCurrentIndex(currentIndex - 1);
      });
    }
  };

  if (loading) return <LoadingScreen />;

  if (cards.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <BackHeader title="플래시카드" onBack={() => navigation.goBack()} />
        <View style={styles.emptyContainer}>
          <MaterialIcons name="check-circle" size={64} color={colors.success} style={{ marginBottom: 16 }} />
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
      <Animated.View
        style={[
          styles.cardWrapper,
          {
            opacity: fadeAnim,
            transform: [{ translateX: slideAnim }],
          },
        ]}
      >
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
              <View style={styles.speakButtonInner}>
                <MaterialIcons name="volume-up" size={18} color={colors.primary} />
                <Text style={styles.speakButtonText}>
                  {isSpeaking ? "재생 중..." : "발음 듣기"}
                </Text>
              </View>
            </TouchableOpacity>

            {/* Self-grading buttons */}
            <Text style={styles.gradeLabel}>얼마나 잘 기억했나요?</Text>
            <View style={styles.gradeButtons}>
              <TouchableOpacity
                style={[styles.gradeButton, styles.gradeAgain]}
                onPress={() => handleGrade(1)}
                disabled={isGrading}
              >
                <Text style={styles.gradeButtonText}>다시</Text>
                <Text style={styles.gradeButtonSub}>Again</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.gradeButton, styles.gradeHard]}
                onPress={() => handleGrade(2)}
                disabled={isGrading}
              >
                <Text style={styles.gradeButtonText}>어려움</Text>
                <Text style={styles.gradeButtonSub}>Hard</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.gradeButton, styles.gradeGood]}
                onPress={() => handleGrade(3)}
                disabled={isGrading}
              >
                <Text style={styles.gradeButtonText}>좋음</Text>
                <Text style={styles.gradeButtonSub}>Good</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.gradeButton, styles.gradeEasy]}
                onPress={() => handleGrade(4)}
                disabled={isGrading}
              >
                <Text style={styles.gradeButtonText}>쉬움</Text>
                <Text style={styles.gradeButtonSub}>Easy</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
        </TouchableOpacity>
      </Animated.View>

      {/* Navigation - only show when answer is hidden */}
      {!showAnswer && (
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
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  cardWrapper: {
    flex: 1,
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
    borderWidth: 1,
    borderColor: colors.border,
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
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  speakButtonInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  speakButtonText: {
    fontSize: 15,
    color: colors.primary,
    fontWeight: "500",
  },
  gradeLabel: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 24,
    marginBottom: 12,
  },
  gradeButtons: {
    flexDirection: "row",
    gap: 8,
  },
  gradeButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  gradeAgain: {
    backgroundColor: colors.dangerLight,
  },
  gradeHard: {
    backgroundColor: colors.warningLight,
  },
  gradeGood: {
    backgroundColor: colors.successLight,
  },
  gradeEasy: {
    backgroundColor: colors.primaryLight,
  },
  gradeButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textDark,
  },
  gradeButtonSub: {
    fontSize: 10,
    color: colors.textLight,
    marginTop: 2,
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
