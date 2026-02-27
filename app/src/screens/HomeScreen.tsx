import React, { useState, useCallback, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Animated,
  ToastAndroid,
  Platform,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useFocusEffect } from "@react-navigation/native";
import { supabase } from "../lib/supabase";
import { getLocalDateString } from "../lib/sessionProgress";
import type { RootStackParamList, Persona, SituationWithProgress, Destination } from "../types";
import { DESTINATION_LABELS } from "../types";
import { colors } from "../constants/theme";
import OfflineBanner from "../components/OfflineBanner";
import TravelMap, { MapNode, NodeStatus } from "../components/TravelMap";
import AbilityStatement from "../components/AbilityStatement";
import { countVariationsForSituation, getAvailableVariations, VARIATION_LABELS, VARIATION_MIN_VISITS } from "../lib/variationEngine";
import { getMapSituations, getDailyPace, type MapSituationConfig } from "../lib/situationPriority";
import ToolkitView from "../components/ToolkitView";

type Props = NativeStackScreenProps<RootStackParamList, "Home">;

// Zigzag layout positions: alternating left/right, evenly spaced vertically
function buildNodePositions(count: number): { x: number; y: number }[] {
  const rowHeight = 120;
  return Array.from({ length: count }, (_, i) => ({
    x: i % 2 === 0 ? 0.15 : 0.65,
    y: i * rowHeight + 10,
  }));
}

// Connections: each node connects to the next
function buildConnections(configs: MapSituationConfig[]): string[][] {
  return configs.map((_, i) =>
    i < configs.length - 1 ? [configs[i + 1].slug] : []
  );
}

// Skeleton loading screen
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
          backgroundColor: colors.borderLight,
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
        <View style={styles.header}>
          <SkeletonBox style={{ width: 160, height: 24 }} />
          <SkeletonBox style={{ width: 40, height: 40, borderRadius: 20 }} />
        </View>
        <View style={{ paddingHorizontal: 20, gap: 16 }}>
          <SkeletonBox style={{ width: "100%", height: 200, borderRadius: 16 }} />
          <SkeletonBox style={{ width: "100%", height: 60, borderRadius: 12 }} />
          <SkeletonBox style={{ width: "100%", height: 60, borderRadius: 12 }} />
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
  const [streakCount, setStreakCount] = useState(0);
  const [reviewSlugs, setReviewSlugs] = useState<Set<string>>(new Set());
  const [recommendedSituation, setRecommendedSituation] = useState<SituationWithProgress | null>(null);
  const [showToolkit, setShowToolkit] = useState(false);
  const [destination, setDestination] = useState<Destination | null>(null);
  const [departureDate, setDepartureDate] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setError(null);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load profile (destination, departure_date)
      const { data: profileData } = await supabase
        .from("profiles")
        .select("destination, departure_date")
        .eq("id", user.id)
        .single();

      if (profileData) {
        setDestination(profileData.destination as Destination | null);
        setDepartureDate(profileData.departure_date as string | null);
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

          // Calculate streak (use local dates)
          const today = getLocalDateString();
          const toLocalDate = (iso: string) => getLocalDateString(new Date(iso));
          const completedDates = new Set(
            progressData
              ?.filter((p) => p.completed_at)
              .map((p) => toLocalDate(p.completed_at!)) || []
          );
          let streak = 0;
          const d = new Date();
          const todayStr = getLocalDateString(d);
          if (completedDates.has(todayStr)) {
            streak = 1;
            d.setDate(d.getDate() - 1);
          }
          while (true) {
            const dateStr = getLocalDateString(d);
            if (completedDates.has(dateStr)) {
              streak++;
              d.setDate(d.getDate() - 1);
            } else {
              break;
            }
          }
          setStreakCount(streak);

          // Load due SRS cards for review recommendations
          const { data: dueCards } = await supabase
            .from("srs_cards")
            .select("id, line_id, lines(situation_id)")
            .eq("user_id", user.id)
            .neq("state", "new")
            .lte("due_date", today);

          const reviewSitIds = new Set<number>();
          dueCards?.forEach((card: any) => {
            const sitId = card.lines?.situation_id;
            if (sitId) reviewSitIds.add(sitId);
          });

          // Map situation ids to slugs for review
          const slugsForReview = new Set<string>();
          withProgress.forEach((s) => {
            if (reviewSitIds.has(s.id)) slugsForReview.add(s.slug);
          });
          setReviewSlugs(slugsForReview);

          // Find recommended situation: first review due, else first available/in_progress
          const reviewSit = withProgress.find((s) => reviewSitIds.has(s.id));
          if (reviewSit) {
            setRecommendedSituation(reviewSit);
          } else {
            const nextSit = withProgress.find(
              (s) => s.progress?.status === "available" || s.progress?.status === "in_progress"
            );
            setRecommendedSituation(nextSit || null);
          }
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

  // Build map nodes from DB situations + persona-specific map config
  const mapSituations = persona ? getMapSituations(persona.slug) : getMapSituations("tourist");
  const situationBySlug = new Map(situations.map((s) => [s.slug, s]));

  // Pre-compute completed slugs so variation counts are accurate
  const completedSlugs: string[] = mapSituations
    .filter((config) => situationBySlug.get(config.slug)?.progress?.status === "completed")
    .map((config) => config.slug);

  const positions = buildNodePositions(mapSituations.length);
  const connections = buildConnections(mapSituations);

  // D-Day pace
  const dailyPace = getDailyPace(departureDate, mapSituations.length, completedSlugs.length);

  const mapNodes: MapNode[] = mapSituations.map((config, i) => {
    const sit = situationBySlug.get(config.slug);
    const progress = sit?.progress;

    let status: NodeStatus = "available";
    if (progress?.status === "completed") {
      status = "completed";
    } else if (reviewSlugs.has(config.slug)) {
      status = "recommended";
    } else if (progress?.status === "available" || progress?.status === "in_progress") {
      status = "available";
    } else if (progress?.status === "locked" || !progress) {
      // Check if it should be "advanced" (locked but we show it softer)
      status = "advanced";
    }

    return {
      situationSlug: config.slug,
      label: config.label,
      emoji: config.emoji,
      color: config.color,
      position: positions[i],
      status,
      connections: connections[i],
      situationId: sit?.id ?? null,
      variationCount: (sit?.progress?.attempt_count ?? 0) >= VARIATION_MIN_VISITS
        ? countVariationsForSituation(config.slug, completedSlugs)
        : 0,
    };
  });

  const handleNodePress = (node: MapNode) => {
    if (!node.situationId) {
      showToast("이 상황은 아직 준비 중이에요");
      return;
    }

    if (node.status === "advanced") {
      // Soft gate: suggest prerequisites but allow entry
      const firstIncomplete = mapNodes.find(
        (n) => n.status !== "completed" && n.situationSlug !== node.situationSlug
      );
      const suggestion = firstIncomplete
        ? `${firstIncomplete.label}을(를) 먼저 해보는 걸 추천해요`
        : "";

      if (suggestion) {
        showToast(suggestion);
      }
      navigation.navigate("Session", { situationId: node.situationId });
    } else if (node.status === "recommended") {
      navigation.navigate("Session", { situationId: node.situationId, isReview: true });
    } else if (node.status === "completed" && (node.variationCount ?? 0) > 0) {
      // 완료된 상황 + 변주가 있으면 선택지 제공
      const sitId = node.situationId!;
      const variations = getAvailableVariations(completedSlugs)
        .filter((v) => v.baseSituation === node.situationSlug);

      const buttons = [
        {
          text: "기본 복습",
          onPress: () => navigation.navigate("Session", { situationId: sitId }),
        },
        ...variations.map((v) => ({
          text: VARIATION_LABELS[v.variationSlug] ?? v.variationSlug,
          onPress: () => navigation.navigate("Session", {
            situationId: sitId,
            variationSlug: v.variationSlug,
          }),
        })),
        { text: "취소", style: "cancel" as const },
      ];

      Alert.alert("어떤 상황으로 연습할까요?", undefined, buttons);
    } else {
      navigation.navigate("Session", { situationId: node.situationId });
    }
  };

  const showToast = (message: string) => {
    if (Platform.OS === "android") {
      ToastAndroid.show(message, ToastAndroid.SHORT);
    } else {
      Alert.alert("", message);
    }
  };

  if (loading) {
    return <SkeletonHomeScreen />;
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <MaterialIcons name="error-outline" size={48} color={colors.textLight} />
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
            <Text style={styles.greeting}>
              {streakCount > 0
                ? `${destination ? DESTINATION_LABELS[destination] : "도쿄"} 여행 ${streakCount}일차!`
                : `${destination ? DESTINATION_LABELS[destination] : "도쿄"} 여행을 시작해요`}
            </Text>
            <View style={styles.headerSub}>
              <Text style={styles.personaLabel}>
                {persona?.icon} {persona?.name_ko}
              </Text>
              {departureDate && (() => {
                const now = new Date();
                const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                const dep = new Date(departureDate);
                const depMidnight = new Date(dep.getFullYear(), dep.getMonth(), dep.getDate());
                const daysLeft = Math.round((depMidnight.getTime() - todayMidnight.getTime()) / (1000 * 60 * 60 * 24));
                if (daysLeft < 0) return null;
                return (
                  <View style={styles.ddayBadge}>
                    <Text style={styles.ddayText}>D-{daysLeft}</Text>
                  </View>
                );
              })()}
            </View>
          </View>
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={() => navigation.navigate("Settings")}
          >
            <MaterialIcons name="settings" size={24} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Travel Map */}
        <TravelMap nodes={mapNodes} onNodePress={handleNodePress} />

        {/* Ability Statement */}
        <AbilityStatement completedSlugs={completedSlugs} />

        {/* D-Day Pace */}
        {dailyPace !== null && dailyPace > 0 && (
          <View style={styles.paceCard}>
            <MaterialIcons name="schedule" size={18} color={colors.primary} />
            <Text style={styles.paceText}>
              출발까지 하루 {dailyPace}곳 페이스로 준비하면 딱이에요
            </Text>
          </View>
        )}

        {/* Today's Recommendation */}
        {recommendedSituation && (
          <TouchableOpacity
            style={styles.recommendCard}
            onPress={() => {
              const isReview = reviewSlugs.has(recommendedSituation.slug);
              navigation.navigate("Session", {
                situationId: recommendedSituation.id,
                isReview,
              });
            }}
          >
            <View style={styles.recommendLeft}>
              <Text style={styles.recommendTitle}>오늘의 추천</Text>
              <Text style={styles.recommendName}>
                {recommendedSituation.name_ko}
              </Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color={colors.primary} />
          </TouchableOpacity>
        )}

        {/* Quick Actions (compressed) */}
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.quickAction}
            onPress={() => navigation.navigate("Flashcard")}
          >
            <MaterialIcons name="style" size={22} color={colors.primary} />
            <Text style={styles.quickActionLabel}>플래시카드</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickAction}
            onPress={() => navigation.navigate("Vocabulary")}
          >
            <MaterialIcons name="book" size={22} color={colors.primary} />
            <Text style={styles.quickActionLabel}>표현 모음</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickAction}
            onPress={() => navigation.navigate("History")}
          >
            <MaterialIcons name="bar-chart" size={22} color={colors.primary} />
            <Text style={styles.quickActionLabel}>학습 기록</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickAction}
            onPress={() => setShowToolkit(true)}
          >
            <MaterialIcons name="build" size={22} color={colors.primary} />
            <Text style={styles.quickActionLabel}>도구 세트</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Toolkit overlay */}
      {showToolkit && (
        <View style={styles.toolkitOverlay}>
          <ToolkitView onClose={() => setShowToolkit(false)} />
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
    fontSize: 22,
    fontWeight: "700",
    color: colors.textDark,
    letterSpacing: -0.3,
  },
  headerSub: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
  },
  personaLabel: {
    fontSize: 15,
    color: colors.textMuted,
  },
  ddayBadge: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 2,
  },
  ddayText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#fff",
  },
  settingsButton: {
    padding: 8,
  },
  paceCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: 20,
    marginTop: 12,
    padding: 12,
    backgroundColor: colors.primaryLight,
    borderRadius: 10,
  },
  paceText: {
    fontSize: 13,
    fontWeight: "500",
    color: colors.primary,
    flex: 1,
  },
  recommendCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginHorizontal: 20,
    marginTop: 16,
    padding: 16,
    backgroundColor: colors.primaryLight,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  recommendLeft: {
    flex: 1,
  },
  recommendTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.primary,
    marginBottom: 4,
  },
  recommendName: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textDark,
  },
  quickActions: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 20,
    gap: 10,
  },
  quickAction: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  quickActionLabel: {
    fontSize: 12,
    fontWeight: "500",
    color: colors.textMuted,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
    gap: 16,
  },
  errorText: {
    fontSize: 16,
    color: colors.textMuted,
    textAlign: "center",
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.surface,
  },
  toolkitOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.background,
    zIndex: 100,
  },
});
