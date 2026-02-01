import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { supabase } from "../lib/supabase";
import type { RootStackParamList, Persona, Profile } from "../types";

type Props = NativeStackScreenProps<RootStackParamList, "Settings">;

export default function SettingsScreen({ navigation }: Props) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [currentPersona, setCurrentPersona] = useState<Persona | null>(null);
  const [allPersonas, setAllPersonas] = useState<Persona[]>([]);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Load profile
    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (profileData) {
      setProfile(profileData);
    }

    // Load current persona
    const { data: userPersona } = await supabase
      .from("user_personas")
      .select("persona_id, personas(*)")
      .eq("user_id", user.id)
      .eq("is_primary", true)
      .single();

    if (userPersona?.personas) {
      setCurrentPersona(userPersona.personas as unknown as Persona);
    }

    // Load all personas
    const { data: personas } = await supabase
      .from("personas")
      .select("*")
      .order("sort_order");

    if (personas) {
      setAllPersonas(personas);
    }
  };

  const handleDailyGoalChange = async (goal: number) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from("profiles")
      .update({ daily_goal: goal })
      .eq("id", user.id);

    setProfile((prev) => prev ? { ...prev, daily_goal: goal } : null);
  };

  const handlePersonaChange = async (persona: Persona) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Reset all to non-primary
    await supabase
      .from("user_personas")
      .update({ is_primary: false })
      .eq("user_id", user.id);

    // Set new primary
    await supabase.from("user_personas").upsert({
      user_id: user.id,
      persona_id: persona.id,
      is_primary: true,
    });

    setCurrentPersona(persona);
    Alert.alert("변경 완료", `${persona.name_ko} 페르소나로 변경되었습니다.`);
  };

  const handleSignOut = async () => {
    Alert.alert(
      "로그아웃",
      "정말 로그아웃하시겠습니까?",
      [
        { text: "취소", style: "cancel" },
        {
          text: "로그아웃",
          style: "destructive",
          onPress: async () => {
            await supabase.auth.signOut();
            navigation.reset({
              index: 0,
              routes: [{ name: "Auth" }],
            });
          },
        },
      ]
    );
  };

  const genderLabel = {
    male: "남성",
    female: "여성",
    neutral: "상관없음",
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← 뒤로</Text>
        </TouchableOpacity>
        <Text style={styles.title}>설정</Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Profile Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>프로필</Text>
          <View style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.label}>성별</Text>
              <Text style={styles.value}>
                {profile?.gender ? genderLabel[profile.gender as keyof typeof genderLabel] : "-"}
              </Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>현재 레벨</Text>
              <Text style={styles.value}>Lv.{profile?.current_level || 1}</Text>
            </View>
          </View>
        </View>

        {/* Daily Goal Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>일일 목표</Text>
          <View style={styles.card}>
            <View style={styles.goalButtons}>
              {[1, 3, 5].map((goal) => (
                <TouchableOpacity
                  key={goal}
                  style={[
                    styles.goalButton,
                    profile?.daily_goal === goal && styles.goalButtonActive,
                  ]}
                  onPress={() => handleDailyGoalChange(goal)}
                >
                  <Text
                    style={[
                      styles.goalButtonText,
                      profile?.daily_goal === goal && styles.goalButtonTextActive,
                    ]}
                  >
                    {goal}개
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Persona Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>학습 페르소나</Text>
          <View style={styles.card}>
            {allPersonas.map((persona) => (
              <TouchableOpacity
                key={persona.id}
                style={[
                  styles.personaRow,
                  currentPersona?.id === persona.id && styles.personaRowActive,
                ]}
                onPress={() => handlePersonaChange(persona)}
              >
                <Text style={styles.personaIcon}>{persona.icon}</Text>
                <View style={styles.personaInfo}>
                  <Text style={styles.personaName}>{persona.name_ko}</Text>
                  <Text style={styles.personaDesc}>{persona.description}</Text>
                </View>
                {currentPersona?.id === persona.id && (
                  <Text style={styles.checkmark}>✓</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Sign Out */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
            <Text style={styles.signOutText}>로그아웃</Text>
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
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#64748b",
    marginBottom: 12,
    marginLeft: 4,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  label: {
    fontSize: 16,
    color: "#1e293b",
  },
  value: {
    fontSize: 16,
    color: "#64748b",
  },
  goalButtons: {
    flexDirection: "row",
    padding: 12,
    gap: 12,
  },
  goalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#f1f5f9",
    alignItems: "center",
  },
  goalButtonActive: {
    backgroundColor: "#6366f1",
  },
  goalButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#64748b",
  },
  goalButtonTextActive: {
    color: "#fff",
  },
  personaRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  personaRowActive: {
    backgroundColor: "#f0f9ff",
  },
  personaIcon: {
    fontSize: 28,
    marginRight: 12,
  },
  personaInfo: {
    flex: 1,
  },
  personaName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1e293b",
  },
  personaDesc: {
    fontSize: 13,
    color: "#64748b",
    marginTop: 2,
  },
  checkmark: {
    fontSize: 20,
    color: "#6366f1",
  },
  signOutButton: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  signOutText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ef4444",
  },
});
