import React, { useState, useCallback, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  RefreshControl,
  Animated,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useFocusEffect } from "@react-navigation/native";
import { supabase } from "../lib/supabase";
import type { RootStackParamList, Persona, SituationWithProgress } from "../types";
import { colors, shadows } from "../constants/theme";
import LoadingScreen from "../components/LoadingScreen";
import OfflineBanner from "../components/OfflineBanner";
import { useNetworkStatus } from "../hooks/useNetworkStatus";

type Props = NativeStackScreenProps<RootStackParamList, "Home">;

// Skeleton component for loading state
function SkeletonHomeScreen() {
  const pulseAnim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.4,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, []);

  const SkeletonBox = ({ style }: { style?: any }) => (
    <Animated.View
      style={[
        {
          backgroundColor: colors.border,
          borderRadius: 8,
          opacity: pulseAnim,
        },
        style,
      ]}
    />
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header skeleton */}
        <View style={styles.header}>
          <View>
            <SkeletonBox style={{ width: 100, height: 24, marginBottom: 8 }} />
            <SkeletonBox style={{ width: 80, height: 16 }} />
          </View>
          <SkeletonBox style={{ width: 40, height: 40, borderRadius: 20 }} />
        </View>

        {/* Progress card skeleton */}
        <View style={[styles.progressCard, { padding: 20 }]}>
          <SkeletonBox style={{ width: 80, height: 14, marginBottom: 12 }} />
          <SkeletonBox style={{ width: "100%", height: 8, marginBottom: 8 }} />
          <SkeletonBox style={{ width: 120, height: 14, alignSelf: "center" }} />
        </View>

        {/* Start button skeleton */}
        <View style={{ marginHorizontal: 20, marginTop: 20 }}>
          <SkeletonBox style={{ width: "100%", height: 72, borderRadius: 16 }} />
        </View>

        {/* Situation list skeleton */}
        <View style={styles.section}>
          <SkeletonBox style={{ width: 80, height: 18, marginBottom: 12 }} />
          {[1, 2, 3].map((i) => (
            <View key={i} style={[styles.situationCard, { marginBottom: 12 }]}>
              <View style={{ flex: 1 }}>
                <SkeletonBox style={{ width: 140, height: 16, marginBottom: 6 }} />
                <SkeletonBox style={{ width: 100, height: 13 }} />
              </View>
              <SkeletonBox style={{ width: 24, height: 24, borderRadius: 12 }} />
            </View>
          ))}
        </View>

        {/* Quick actions skeleton */}
        <View style={styles.quickActions}>
          {[1, 2, 3, 4].map((i) => (
            <SkeletonBox key={i} style={{ flex: 1, height: 80, borderRadius: 12 }} />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

export default function HomeScreen({ navigation }: Props) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [persona, setPersona] = useState<Persona | null>(null);
  const [situations, setSituations] = useState<SituationWithProgress[]>([]);
  const [completedToday, setCompletedToday] = useState(0);
  const [dailyGoal, setDailyGoal] = useState(3);
  const [reviewSituations, setReviewSituations] = useState<SituationWithProgress[]>([]);
  const [streakCount, setStreakCount] = useState(0);

  const loadData = useCallback(async () => {
    try {
      setError(null);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("daily_goal")
        .eq("id", user.id)
        .single();

      if (profile) {
        setDailyGoal(profile.daily_goal);
      }

      // Load primary persona
      const { data: userPersona } = await supabase
        .from("user_personas")
        .select("persona_id, personas(*)")
        .eq("user_id", user.id)
        .eq("is_primary", true)
        .single();

      if (userPersona?.personas) {
        setPersona(userPersona.personas as unknown as Persona);

        // Load situations for this persona
        const { data: situationsData } = await supabase
          .from("situations")
          .select("*")
          .eq("persona_id", (userPersona.personas as unknown as Persona).id)
          .order("sort_order");

        if (situationsData) {
          // Load progress for each situation
          const { data: progressData } = await supabase
            .from("user_situation_progress")
            .select("*")
            .eq("user_id", user.id);

          const progressMap = new Map(
            progressData?.map((p) => [p.situation_id, p]) || []
          );

          const withProgress = situationsData.map((s) => ({
            ...s,
            progress: progressMap.get(s.id),
          }));

          setSituations(withProgress);

          // Count completed today
          const today = new Date().toISOString().split("T")[0];
          const todayCompleted = progressData?.filter(
            (p) => p.completed_at?.startsWith(today)
          ).length || 0;
          setCompletedToday(todayCompleted);

          // Calculate streak
          const completedDates = new Set(
            progressData
              ?.filter((p) => p.completed_at)
              .map((p) => p.completed_at!.split("T")[0]) || []
          );
          let streak = 0;
          const d = new Date();
          // Check today first
          const todayStr = d.toISOString().split("T")[0];
          if (completedDates.has(todayStr)) {
            streak = 1;
            d.setDate(d.getDate() - 1);
          }
          // Count consecutive past days
          while (true) {
            const dateStr = d.toISOString().split("T")[0];
            if (completedDates.has(dateStr)) {
              streak++;
              d.setDate(d.getDate() - 1);
            } else {
              break;
            }
          }
          setStreakCount(streak);

          // Load due SRS cards for review
          const { data: dueCards } = await supabase
            .from("srs_cards")
            .select("id, line_id, lines(situation_id)")
            .eq("user_id", user.id)
            .neq("state", "new")
            .lte("due_date", today);

          const reviewMap = new Map<number, number>();
          dueCards?.forEach((card: any) => {
            const sitId = card.lines?.situation_id;
            if (sitId) reviewMap.set(sitId, (reviewMap.get(sitId) || 0) + 1);
          });

          setReviewSituations(
            withProgress.filter((s) => reviewMap.has(s.id))
          );
        }
      }
    } catch (err) {
      console.error("Error loading data:", err);
      setError("데이터를 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, [loadData]);

  const handleStartSession = (situation: SituationWithProgress) => {
    navigation.navigate("Session", { situationId: situation.id });
  };

  const handleStartReview = (situation: SituationWithProgress) => {
    navigation.navigate("Session", { situationId: situation.id, isReview: true });
  };

  const getNextAvailableSituation = (): SituationWithProgress | null => {
    // Find first available or in_progress situation
    return situations.find(
      (s) => s.progress?.status === "available" || s.progress?.status === "in_progress"
    ) || null;
  };

  const getDifficultyStars = (difficulty: number) => {
    return "★".repeat(difficulty) + "☆".repeat(3 - difficulty);
  };

  if (loading) {
    return <SkeletonHomeScreen />;
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => {
              setLoading(true);
              loadData();
            }}
          >
            <Text style={styles.retryButtonText}>다시 시도</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const nextSituation = getNextAvailableSituation();

  return (
    <SafeAreaView style={styles.container}>
      <OfflineBanner />
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>오늘의 학습</Text>
            <Text style={styles.personaLabel}>
              {persona?.icon} {persona?.name_ko}
            </Text>
          </View>
          <View style={styles.headerRight}>
            {streakCount > 0 && (
              <View style={styles.streakBadge}>
                <Text style={styles.streakText}>🔥 {streakCount}일</Text>
              </View>
            )}
            <TouchableOpacity
              style={styles.settingsButton}
              onPress={() => navigation.navigate("Settings")}
            >
              <Text style={styles.settingsIcon}>⚙️</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Review Nudge */}
        {reviewSituations.length > 0 && (
          <View style={styles.reviewNudge}>
            <Text style={styles.reviewNudgeIcon}>📖</Text>
            <Text style={styles.reviewNudgeText}>
              복습할 상황이 {reviewSituations.length}개 있어요!
            </Text>
          </View>
        )}

        {/* Progress Card */}
        <View style={styles.progressCard}>
          <Text style={styles.progressTitle}>오늘의 진행</Text>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${Math.min((completedToday / dailyGoal) * 100, 100)}%` },
              ]}
            />
          </View>
          <Text style={styles.progressText}>
            {completedToday} / {dailyGoal} 상황 완료
          </Text>
        </View>

        {/* Review Section */}
        {reviewSituations.length > 0 && (
          <View style={styles.reviewSection}>
            <Text style={styles.reviewTitle}>복습할 상황</Text>
            {reviewSituations.map((situation) => (
              <TouchableOpacity
                key={situation.id}
                style={styles.reviewCard}
                onPress={() => handleStartReview(situation)}
              >
                <View style={styles.situationInfo}>
                  <Text style={styles.reviewName}>{situation.name_ko}</Text>
                  <Text style={styles.situationMeta}>
                    {situation.location_ko}
                  </Text>
                </View>
                <Text style={styles.reviewArrow}>→</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Start Session Button */}
        {nextSituation && (
          <TouchableOpacity
            style={styles.startButton}
            onPress={() => handleStartSession(nextSituation)}
          >
            <Text style={styles.startButtonText}>학습 시작</Text>
            <Text style={styles.startButtonSubtext}>
              {nextSituation.name_ko}
            </Text>
          </TouchableOpacity>
        )}

        {/* Situation List */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>상황 목록</Text>
            <TouchableOpacity onPress={() => navigation.navigate("SituationList")}>
              <Text style={styles.seeAll}>전체 보기</Text>
            </TouchableOpacity>
          </View>

          {situations.slice(0, 5).map((situation) => (
            <TouchableOpacity
              key={situation.id}
              style={[
                styles.situationCard,
                situation.progress?.status === "completed" && styles.completedCard,
                !situation.progress || situation.progress.status === "locked"
                  ? styles.lockedCard
                  : null,
              ]}
              onPress={() => handleStartSession(situation)}
              disabled={!situation.progress || situation.progress.status === "locked"}
            >
              <View style={styles.situationInfo}>
                <Text
                  style={[
                    styles.situationName,
                    situation.progress?.status === "completed" && styles.completedText,
                  ]}
                >
                  {situation.name_ko}
                </Text>
                <Text style={styles.situationMeta}>
                  {situation.location_ko} · {getDifficultyStars(situation.difficulty)}
                </Text>
              </View>
              <View style={styles.statusBadge}>
                {situation.progress?.status === "completed" ? (
                  <Text style={styles.checkmark}>✓</Text>
                ) : situation.progress?.status === "locked" || !situation.progress ? (
                  <Text style={styles.lock}>🔒</Text>
                ) : (
                  <Text style={styles.arrow}>→</Text>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.quickAction}
            onPress={() => navigation.navigate("Flashcard")}
          >
            <Text style={styles.quickActionIcon}>🃏</Text>
            <Text style={styles.quickActionLabel}>플래시카드</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickAction}
            onPress={() => navigation.navigate("Vocabulary")}
          >
            <Text style={styles.quickActionIcon}>📝</Text>
            <Text style={styles.quickActionLabel}>단어장</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickAction}
            onPress={() => navigation.navigate("History")}
          >
            <Text style={styles.quickActionIcon}>📊</Text>
            <Text style={styles.quickActionLabel}>학습 기록</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickAction}
            onPress={() => navigation.navigate("SituationList")}
          >
            <Text style={styles.quickActionIcon}>📚</Text>
            <Text style={styles.quickActionLabel}>전체 상황</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    paddingTop: 10,
  },
  greeting: {
    fontSize: 24,
    fontWeight: "bold",
    color: colors.textDark,
  },
  personaLabel: {
    fontSize: 16,
    color: colors.textMuted,
    marginTop: 4,
  },
  settingsButton: {
    padding: 8,
  },
  settingsIcon: {
    fontSize: 24,
  },
  progressCard: {
    backgroundColor: colors.surface,
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 20,
    ...shadows.md,
  },
  progressTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textMuted,
    marginBottom: 12,
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.border,
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 8,
    textAlign: "center",
  },
  reviewSection: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  reviewTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: colors.textDark,
    marginBottom: 12,
  },
  reviewCard: {
    backgroundColor: "#fef3c7",
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  reviewName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#92400e",
  },
  reviewArrow: {
    fontSize: 20,
    color: "#92400e",
  },
  startButton: {
    backgroundColor: colors.primary,
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
  },
  startButtonText: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.surface,
  },
  startButtonSubtext: {
    fontSize: 14,
    color: "#c7d2fe",
    marginTop: 4,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.textDark,
  },
  seeAll: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: "500",
  },
  situationCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    ...shadows.sm,
  },
  completedCard: {
    backgroundColor: "#f0fdf4",
  },
  lockedCard: {
    opacity: 0.5,
  },
  situationInfo: {
    flex: 1,
  },
  situationName: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textDark,
  },
  completedText: {
    color: colors.success,
  },
  situationMeta: {
    fontSize: 13,
    color: colors.textLight,
    marginTop: 4,
  },
  statusBadge: {
    marginLeft: 12,
  },
  checkmark: {
    fontSize: 20,
    color: colors.success,
  },
  lock: {
    fontSize: 18,
  },
  arrow: {
    fontSize: 20,
    color: colors.primary,
  },
  quickActions: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 24,
    gap: 12,
  },
  quickAction: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    ...shadows.sm,
  },
  quickActionIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  quickActionLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.textMuted,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  streakBadge: {
    backgroundColor: "#fef3c7",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  streakText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#92400e",
  },
  reviewNudge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#eff6ff",
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 12,
    borderRadius: 12,
    gap: 8,
  },
  reviewNudgeIcon: {
    fontSize: 20,
  },
  reviewNudgeText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#1e40af",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 16,
    color: colors.textMuted,
    textAlign: "center",
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: colors.surface,
  },
});
