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
import type { RootStackParamList, Persona, SituationWithProgress } from "../types";
import { colors } from "../constants/theme";
import OfflineBanner from "../components/OfflineBanner";
import TravelMap, { MapNode, NodeStatus } from "../components/TravelMap";
import AbilityStatement from "../components/AbilityStatement";
import { countVariationsForSituation, getAvailableVariations, VARIATION_LABELS, VARIATION_MIN_VISITS } from "../lib/variationEngine";
import ToolkitView from "../components/ToolkitView";

type Props = NativeStackScreenProps<RootStackParamList, "Home">;

// MVP 8 map situations — order defines the travel route
const MAP_SITUATIONS = [
  { slug: "airport_pickup", label: "공항", emoji: "\u2708\uFE0F", color: "#87CEEB" },
  { slug: "train_station", label: "전철", emoji: "\uD83D\uDE83", color: "#4CAF50" },
  { slug: "hotel_checkin", label: "호텔", emoji: "\uD83C\uDFE8", color: "#D2B48C" },
  { slug: "convenience_store", label: "편의점", emoji: "\uD83C\uDFEA", color: "#FF9800" },
  { slug: "restaurant", label: "식당", emoji: "\uD83C\uDF5C", color: "#FF5722" },
  { slug: "ask_directions", label: "관광지", emoji: "\u26E9\uFE0F", color: "#E53935" },
  { slug: "shopping_market", label: "쇼핑", emoji: "\uD83D\uDECD\uFE0F", color: "#E91E63" },
  { slug: "taxi", label: "긴급상황", emoji: "\uD83C\uDD98", color: "#1976D2" },
];

// Zigzag layout positions: alternating left/right, evenly spaced vertically
function buildNodePositions(): { x: number; y: number }[] {
  const rowHeight = 120;
  return MAP_SITUATIONS.map((_, i) => ({
    x: i % 2 === 0 ? 0.15 : 0.65,
    y: i * rowHeight + 10,
  }));
}

// Connections: each node connects to the next
function buildConnections(): string[][] {
  return MAP_SITUATIONS.map((_, i) =>
    i < MAP_SITUATIONS.length - 1 ? [MAP_SITUATIONS[i + 1].slug] : []
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

  const loadData = useCallback(async () => {
    try {
      setError(null);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

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

  // Build map nodes from DB situations + map config
  const situationBySlug = new Map(situations.map((s) => [s.slug, s]));

  // Pre-compute completed slugs so variation counts are accurate
  const completedSlugs: string[] = MAP_SITUATIONS
    .filter((config) => situationBySlug.get(config.slug)?.progress?.status === "completed")
    .map((config) => config.slug);

  const positions = buildNodePositions();
  const connections = buildConnections();

  const mapNodes: MapNode[] = MAP_SITUATIONS.map((config, i) => {
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
      variationCount: countVariationsForSituation(config.slug, completedSlugs),
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
                ? `도쿄 여행 ${streakCount}일차!`
                : "도쿄 여행을 시작해요"}
            </Text>
            <Text style={styles.personaLabel}>
              {persona?.icon} {persona?.name_ko}
            </Text>
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
  personaLabel: {
    fontSize: 15,
    color: colors.textMuted,
    marginTop: 4,
  },
  settingsButton: {
    padding: 8,
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
