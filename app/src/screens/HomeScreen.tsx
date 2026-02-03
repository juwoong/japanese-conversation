import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useFocusEffect } from "@react-navigation/native";
import { supabase } from "../lib/supabase";
import type { RootStackParamList, Persona, UserSituationProgress, Situation } from "../types";

type Props = NativeStackScreenProps<RootStackParamList, "Home">;

interface SituationWithProgress extends Situation {
  progress?: UserSituationProgress;
}

export default function HomeScreen({ navigation }: Props) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [persona, setPersona] = useState<Persona | null>(null);
  const [situations, setSituations] = useState<SituationWithProgress[]>([]);
  const [completedToday, setCompletedToday] = useState(0);
  const [dailyGoal, setDailyGoal] = useState(3);
  const [reviewSituations, setReviewSituations] = useState<SituationWithProgress[]>([]);

  const loadData = useCallback(async () => {
    try {
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
    } catch (error) {
      console.error("Error loading data:", error);
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
    return (
      <SafeAreaView style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#6366f1" />
      </SafeAreaView>
    );
  }

  const nextSituation = getNextAvailableSituation();

  return (
    <SafeAreaView style={styles.container}>
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
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={() => navigation.navigate("Settings")}
          >
            <Text style={styles.settingsIcon}>⚙️</Text>
          </TouchableOpacity>
        </View>

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
            onPress={() => navigation.navigate("History")}
          >
            <Text style={styles.quickActionIcon}>📊</Text>
            <Text style={styles.quickActionLabel}>학습 기록</Text>
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
    backgroundColor: "#f8fafc",
  },
  centered: {
    justifyContent: "center",
    alignItems: "center",
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
    color: "#1e293b",
  },
  personaLabel: {
    fontSize: 16,
    color: "#64748b",
    marginTop: 4,
  },
  settingsButton: {
    padding: 8,
  },
  settingsIcon: {
    fontSize: 24,
  },
  progressCard: {
    backgroundColor: "#fff",
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  progressTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#64748b",
    marginBottom: 12,
  },
  progressBar: {
    height: 8,
    backgroundColor: "#e2e8f0",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#6366f1",
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: "#64748b",
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
    color: "#1e293b",
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
    backgroundColor: "#6366f1",
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
  },
  startButtonText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
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
    color: "#1e293b",
  },
  seeAll: {
    fontSize: 14,
    color: "#6366f1",
    fontWeight: "500",
  },
  situationCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
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
    color: "#1e293b",
  },
  completedText: {
    color: "#16a34a",
  },
  situationMeta: {
    fontSize: 13,
    color: "#94a3b8",
    marginTop: 4,
  },
  statusBadge: {
    marginLeft: 12,
  },
  checkmark: {
    fontSize: 20,
    color: "#16a34a",
  },
  lock: {
    fontSize: 18,
  },
  arrow: {
    fontSize: 20,
    color: "#6366f1",
  },
  quickActions: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 24,
    gap: 12,
  },
  quickAction: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  quickActionIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  quickActionLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#64748b",
  },
});
