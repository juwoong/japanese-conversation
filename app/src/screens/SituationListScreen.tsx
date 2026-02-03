import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { supabase } from "../lib/supabase";
import type { RootStackParamList, Persona, Situation, UserSituationProgress } from "../types";

type Props = NativeStackScreenProps<RootStackParamList, "SituationList">;

interface SituationWithProgress extends Situation {
  progress?: UserSituationProgress;
}

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
        return "#16a34a";
      case "in_progress":
        return "#f59e0b";
      case "available":
        return "#6366f1";
      default:
        return "#94a3b8";
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
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
        <Text style={styles.title}>전체 상황</Text>
        <View style={{ width: 50 }} />
      </View>

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
              <Text style={styles.expandIcon}>
                {expandedPersona === persona.id ? "▼" : "▶"}
              </Text>
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
                    </View>
                    {situation.progress?.status === "completed" ? (
                      <Text style={styles.checkmark}>✓</Text>
                    ) : !situation.progress || situation.progress.status === "locked" ? (
                      <Text style={styles.lock}>🔒</Text>
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
  personaSection: {
    marginTop: 16,
    marginHorizontal: 16,
    backgroundColor: "#fff",
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  personaHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#f8fafc",
  },
  personaIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  personaName: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    color: "#1e293b",
  },
  situationCount: {
    fontSize: 14,
    color: "#64748b",
    marginRight: 8,
  },
  expandIcon: {
    fontSize: 12,
    color: "#94a3b8",
  },
  situationsList: {
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
  },
  situationItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
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
    color: "#1e293b",
  },
  situationMeta: {
    fontSize: 13,
    color: "#94a3b8",
    marginTop: 2,
  },
  checkmark: {
    fontSize: 18,
    color: "#16a34a",
  },
  lock: {
    fontSize: 16,
  },
});
