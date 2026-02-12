import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { supabase } from "../lib/supabase";
import type { RootStackParamList, Persona, SituationWithProgress, UserSituationProgress } from "../types";
import { colors } from "../constants/theme";
import { MaterialIcons } from "@expo/vector-icons";
import LoadingScreen from "../components/LoadingScreen";
import BackHeader from "../components/BackHeader";

type Props = NativeStackScreenProps<RootStackParamList, "SituationList">;

interface PersonaWithSituations extends Persona {
  situations: SituationWithProgress[];
}

export default function SituationListScreen({ navigation }: Props) {
  const [loading, setLoading] = useState(true);
  const [personas, setPersonas] = useState<PersonaWithSituations[]>([]);
  const [expandedPersona, setExpandedPersona] = useState<number | null>(null);

  const loadData = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      // Load all personas
      const { data: personasData } = await supabase
        .from("personas")
        .select("*")
        .order("sort_order");

      if (!personasData) return;

      // Load all situations
      const { data: situationsData } = await supabase
        .from("situations")
        .select("*")
        .order("sort_order");

      // Load user progress
      let progressMap = new Map<number, UserSituationProgress>();
      if (user) {
        const { data: progressData } = await supabase
          .from("user_situation_progress")
          .select("*")
          .eq("user_id", user.id);

        progressMap = new Map(progressData?.map((p) => [p.situation_id, p]) || []);
      }

      // Combine data
      const combined = personasData.map((persona) => ({
        ...persona,
        situations: (situationsData || [])
          .filter((s) => s.persona_id === persona.id)
          .map((s) => ({
            ...s,
            progress: progressMap.get(s.id),
          })),
      }));

      setPersonas(combined);

      // Expand first persona by default
      if (combined.length > 0) {
        setExpandedPersona(combined[0].id);
      }
    } catch (error) {
      console.error("Error loading situations:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const getDifficultyStars = (difficulty: number) => {
    return "★".repeat(difficulty) + "☆".repeat(3 - difficulty);
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "completed":
        return colors.success;
      case "in_progress":
        return colors.warning;
      case "available":
        return colors.primary;
      default:
        return colors.textLight;
    }
  };

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <BackHeader title="전체 상황" onBack={() => navigation.goBack()} />

      <ScrollView style={styles.scrollView}>
        {personas.map((persona) => (
          <View key={persona.id} style={styles.personaSection}>
            <TouchableOpacity
              style={styles.personaHeader}
              onPress={() =>
                setExpandedPersona(
                  expandedPersona === persona.id ? null : persona.id
                )
              }
            >
              <Text style={styles.personaIcon}>{persona.icon}</Text>
              <Text style={styles.personaName}>{persona.name_ko}</Text>
              <Text style={styles.situationCount}>
                {persona.situations.filter((s) => s.progress?.status === "completed").length}
                /{persona.situations.length}
              </Text>
              <MaterialIcons
                name={expandedPersona === persona.id ? "expand-more" : "chevron-right"}
                size={22}
                color={colors.textLight}
              />
            </TouchableOpacity>

            {expandedPersona === persona.id && (
              <View style={styles.situationsList}>
                {persona.situations.map((situation) => (
                  <TouchableOpacity
                    key={situation.id}
                    style={[
                      styles.situationItem,
                      !situation.progress || situation.progress.status === "locked"
                        ? styles.lockedItem
                        : null,
                    ]}
                    onPress={() =>
                      situation.progress && situation.progress.status !== "locked"
                        ? navigation.navigate("Session", { situationId: situation.id })
                        : null
                    }
                    disabled={!situation.progress || situation.progress.status === "locked"}
                  >
                    <View
                      style={[
                        styles.statusDot,
                        { backgroundColor: getStatusColor(situation.progress?.status) },
                      ]}
                    />
                    <View style={styles.situationInfo}>
                      <Text style={styles.situationName}>{situation.name_ko}</Text>
                      <Text style={styles.situationMeta}>
                        {situation.location_ko} · {getDifficultyStars(situation.difficulty)}
                      </Text>
                      {situation.progress?.status === "completed" && situation.progress.best_accuracy != null && (
                        <Text style={styles.bestAccuracy}>
                          최고 기록: {Math.round(situation.progress.best_accuracy * 100)}%
                          {situation.progress.attempt_count > 1 && ` · ${situation.progress.attempt_count}회 도전`}
                        </Text>
                      )}
                      {situation.progress?.status === "in_progress" && (
                        <Text style={styles.inProgressLabel}>학습 중</Text>
                      )}
                      {situation.progress?.status === "available" && (
                        <Text style={styles.availableLabel}>시작 가능</Text>
                      )}
                    </View>
                    {situation.progress?.status === "completed" ? (
                      <View style={styles.completedBadge}>
                        <MaterialIcons name="check-circle" size={20} color={colors.success} />
                        <Text style={styles.retryHint}>재도전</Text>
                      </View>
                    ) : !situation.progress || situation.progress.status === "locked" ? (
                      <MaterialIcons name="lock" size={18} color={colors.textLight} />
                    ) : null}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        ))}
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
  personaSection: {
    marginTop: 16,
    marginHorizontal: 16,
    backgroundColor: colors.surface,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
  },
  personaHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: colors.background,
  },
  personaIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  personaName: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    color: colors.textDark,
  },
  situationCount: {
    fontSize: 14,
    color: colors.textMuted,
    marginRight: 8,
  },
  situationsList: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  situationItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  lockedItem: {
    opacity: 0.5,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 12,
  },
  situationInfo: {
    flex: 1,
  },
  situationName: {
    fontSize: 15,
    fontWeight: "500",
    color: colors.textDark,
  },
  situationMeta: {
    fontSize: 13,
    color: colors.textLight,
    marginTop: 2,
  },
  completedBadge: {
    alignItems: "center",
  },
  retryHint: {
    fontSize: 10,
    color: colors.textLight,
    marginTop: 2,
  },
  bestAccuracy: {
    fontSize: 12,
    color: colors.success,
    marginTop: 2,
  },
  inProgressLabel: {
    fontSize: 12,
    color: colors.warning,
    marginTop: 2,
  },
  availableLabel: {
    fontSize: 12,
    color: colors.primary,
    marginTop: 2,
  },
});
