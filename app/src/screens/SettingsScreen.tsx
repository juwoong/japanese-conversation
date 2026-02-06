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
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { supabase } from "../lib/supabase";
import type { RootStackParamList, Persona, Profile } from "../types";
import { colors, shadows, type ColorScheme, setColorScheme, getColorScheme } from "../constants/theme";
import BackHeader from "../components/BackHeader";

type Props = NativeStackScreenProps<RootStackParamList, "Settings">;

const TTS_SPEED_KEY = "@tts_speed";
const TTS_SPEEDS = [
  { value: 0.5, label: "0.5x (느림)" },
  { value: 0.8, label: "0.8x (보통)" },
  { value: 1.0, label: "1.0x (빠름)" },
];

export default function SettingsScreen({ navigation }: Props) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [currentPersona, setCurrentPersona] = useState<Persona | null>(null);
  const [allPersonas, setAllPersonas] = useState<Persona[]>([]);
  const [ttsSpeed, setTtsSpeed] = useState(0.8);
  const [colorScheme, setColorSchemeState] = useState<ColorScheme>(getColorScheme());

  useEffect(() => {
    loadSettings();
    loadTtsSpeed();
    AsyncStorage.getItem("@color_scheme").then((v) => {
      if (v) {
        const scheme = v as ColorScheme;
        setColorSchemeState(scheme);
        setColorScheme(scheme);
      }
    });
  }, []);

  const loadTtsSpeed = async () => {
    const saved = await AsyncStorage.getItem(TTS_SPEED_KEY);
    if (saved) setTtsSpeed(parseFloat(saved));
  };

  const handleTtsSpeedChange = async (speed: number) => {
    setTtsSpeed(speed);
    await AsyncStorage.setItem(TTS_SPEED_KEY, speed.toString());
  };

  const handleColorSchemeChange = async (scheme: ColorScheme) => {
    setColorSchemeState(scheme);
    setColorScheme(scheme);
    await AsyncStorage.setItem("@color_scheme", scheme);
  };

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
    Alert.alert("변경 완료", `${persona.name_ko} 페르소나로 변경되었습니다.`, [
      {
        text: "확인",
        onPress: () => {
          // Reset navigation to Home to refresh with new persona
          navigation.reset({
            index: 0,
            routes: [{ name: "Home" }],
          });
        },
      },
    ]);
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
      <BackHeader title="설정" onBack={() => navigation.goBack()} />

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

        {/* TTS Speed */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>음성 속도</Text>
          <View style={styles.card}>
            <View style={styles.goalButtons}>
              {TTS_SPEEDS.map((s) => (
                <TouchableOpacity
                  key={s.value}
                  style={[
                    styles.goalButton,
                    ttsSpeed === s.value && styles.goalButtonActive,
                  ]}
                  onPress={() => handleTtsSpeedChange(s.value)}
                >
                  <Text
                    style={[
                      styles.goalButtonText,
                      ttsSpeed === s.value && styles.goalButtonTextActive,
                    ]}
                  >
                    {s.label}
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

        {/* Theme */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>화면 테마</Text>
          <View style={styles.card}>
            <View style={styles.goalButtons}>
              {([
                { value: "system" as const, label: "시스템" },
                { value: "light" as const, label: "라이트" },
                { value: "dark" as const, label: "다크" },
              ]).map((opt) => (
                <TouchableOpacity
                  key={opt.value}
                  style={[
                    styles.goalButton,
                    colorScheme === opt.value && styles.goalButtonActive,
                  ]}
                  onPress={() => handleColorSchemeChange(opt.value)}
                >
                  <Text
                    style={[
                      styles.goalButtonText,
                      colorScheme === opt.value && styles.goalButtonTextActive,
                    ]}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
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
    backgroundColor: colors.background,
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
    color: colors.textMuted,
    marginBottom: 12,
    marginLeft: 4,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    overflow: "hidden",
    ...shadows.md,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  label: {
    fontSize: 16,
    color: colors.textDark,
  },
  value: {
    fontSize: 16,
    color: colors.textMuted,
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
    backgroundColor: colors.borderLight,
    alignItems: "center",
  },
  goalButtonActive: {
    backgroundColor: colors.primary,
  },
  goalButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textMuted,
  },
  goalButtonTextActive: {
    color: colors.surface,
  },
  personaRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
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
    color: colors.textDark,
  },
  personaDesc: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2,
  },
  checkmark: {
    fontSize: 20,
    color: colors.primary,
  },
  signOutButton: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    ...shadows.md,
  },
  signOutText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.danger,
  },
});
