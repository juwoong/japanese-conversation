import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { supabase } from "../lib/supabase";
import type { RootStackParamList } from "../types";
import { colors } from "../constants/theme";
import LoadingScreen from "../components/LoadingScreen";
import BackHeader from "../components/BackHeader";

type Props = NativeStackScreenProps<RootStackParamList, "History">;

interface DailyStats {
  date: string;
  situationsCompleted: number;
  accuracy: number;
}

export default function HistoryScreen({ navigation }: Props) {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DailyStats[]>([]);
  const [totalStats, setTotalStats] = useState({
    totalSituations: 0,
    totalAttempts: 0,
    averageAccuracy: 0,
  });

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load completed situations
      const { data: progress } = await supabase
        .from("user_situation_progress")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "completed");

      // Load attempts
      const { data: attempts } = await supabase
        .from("user_attempts")
        .select("*")
        .eq("user_id", user.id);

      // Calculate daily stats
      const dailyMap = new Map<string, { count: number; accuracy: number[] }>();

      progress?.forEach((p) => {
        if (p.completed_at) {
          const date = p.completed_at.split("T")[0];
          const existing = dailyMap.get(date) || { count: 0, accuracy: [] };
          existing.count++;
          if (p.best_accuracy) {
            existing.accuracy.push(p.best_accuracy);
          }
          dailyMap.set(date, existing);
        }
      });

      // Convert to array and sort by date
      const dailyStats: DailyStats[] = Array.from(dailyMap.entries())
        .map(([date, data]) => ({
          date,
          situationsCompleted: data.count,
          accuracy:
            data.accuracy.length > 0
              ? data.accuracy.reduce((a, b) => a + b, 0) / data.accuracy.length
              : 0,
        }))
        .sort((a, b) => b.date.localeCompare(a.date))
        .slice(0, 30); // Last 30 days

      setStats(dailyStats);

      // Calculate total stats
      const totalSituations = progress?.length || 0;
      const totalAttempts = attempts?.length || 0;
      const accuracies =
        attempts?.filter((a) => a.accuracy !== null).map((a) => a.accuracy) || [];
      const averageAccuracy =
        accuracies.length > 0
          ? accuracies.reduce((a, b) => a + b, 0) / accuracies.length
          : 0;

      setTotalStats({
        totalSituations,
        totalAttempts,
        averageAccuracy,
      });
    } catch (error) {
      console.error("Error loading history:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const weekday = ["일", "월", "화", "수", "목", "금", "토"][date.getDay()];
    return `${month}/${day} (${weekday})`;
  };

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <BackHeader title="학습 기록" onBack={() => navigation.goBack()} />

      <ScrollView style={styles.scrollView}>
        {/* Summary Card */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{totalStats.totalSituations}</Text>
            <Text style={styles.summaryLabel}>완료한 상황</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{totalStats.totalAttempts}</Text>
            <Text style={styles.summaryLabel}>총 연습 횟수</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>
              {Math.round(totalStats.averageAccuracy * 100)}%
            </Text>
            <Text style={styles.summaryLabel}>평균 정확도</Text>
          </View>
        </View>

        {/* Daily History */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>일별 기록</Text>

          {stats.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>아직 학습 기록이 없습니다.</Text>
              <Text style={styles.emptySubtext}>첫 번째 상황을 시작해보세요!</Text>
            </View>
          ) : (
            stats.map((day) => (
              <View key={day.date} style={styles.dayCard}>
                <View style={styles.dayInfo}>
                  <Text style={styles.dayDate}>{formatDate(day.date)}</Text>
                  <Text style={styles.dayStats}>
                    {day.situationsCompleted}개 상황 완료
                  </Text>
                </View>
                <View style={styles.accuracyBadge}>
                  <Text style={styles.accuracyText}>
                    {Math.round(day.accuracy * 100)}%
                  </Text>
                </View>
              </View>
            ))
          )}
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
  summaryCard: {
    flexDirection: "row",
    backgroundColor: colors.primary,
    margin: 16,
    borderRadius: 16,
    padding: 20,
  },
  summaryItem: {
    flex: 1,
    alignItems: "center",
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: colors.surface,
  },
  summaryLabel: {
    fontSize: 12,
    color: "rgba(255,255,255,0.7)",
    marginTop: 4,
  },
  summaryDivider: {
    width: 1,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  section: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.textDark,
    marginBottom: 12,
  },
  emptyState: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 32,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textMuted,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textLight,
    marginTop: 4,
  },
  dayCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: colors.border,
  },
  dayInfo: {
    flex: 1,
  },
  dayDate: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textDark,
  },
  dayStats: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 2,
  },
  accuracyBadge: {
    backgroundColor: colors.successLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  accuracyText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.success,
  },
});
