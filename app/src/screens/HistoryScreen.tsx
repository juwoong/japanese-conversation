import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { supabase } from "../lib/supabase";
import type { RootStackParamList } from "../types";

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
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#6366f1" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← 뒤로</Text>
        </TouchableOpacity>
        <Text style={styles.title}>학습 기록</Text>
        <View style={{ width: 50 }} />
      </View>

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
    backgroundColor: "#f8fafc",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  backButton: {
    fontSize: 16,
    color: "#6366f1",
    fontWeight: "500",
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1e293b",
  },
  scrollView: {
    flex: 1,
  },
  summaryCard: {
    flexDirection: "row",
    backgroundColor: "#6366f1",
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
    color: "#fff",
  },
  summaryLabel: {
    fontSize: 12,
    color: "#c7d2fe",
    marginTop: 4,
  },
  summaryDivider: {
    width: 1,
    backgroundColor: "#818cf8",
  },
  section: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1e293b",
    marginBottom: 12,
  },
  emptyState: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 32,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#64748b",
  },
  emptySubtext: {
    fontSize: 14,
    color: "#94a3b8",
    marginTop: 4,
  },
  dayCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  dayInfo: {
    flex: 1,
  },
  dayDate: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1e293b",
  },
  dayStats: {
    fontSize: 14,
    color: "#64748b",
    marginTop: 2,
  },
  accuracyBadge: {
    backgroundColor: "#f0fdf4",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  accuracyText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#16a34a",
  },
});
