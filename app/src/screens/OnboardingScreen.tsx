import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { supabase } from "../lib/supabase";
import type { RootStackParamList, Persona } from "../types";
import { colors, shadows } from "../constants/theme";
import LoadingScreen from "../components/LoadingScreen";

type Props = NativeStackScreenProps<RootStackParamList, "Onboarding">;

type Gender = "male" | "female" | "neutral";

const GENDER_OPTIONS: { value: Gender; label: string; icon: string }[] = [
  { value: "male", label: "남성", icon: "👨" },
  { value: "female", label: "여성", icon: "👩" },
  { value: "neutral", label: "상관없음", icon: "🧑" },
];

export default function OnboardingScreen({ navigation }: Props) {
  const [step, setStep] = useState<"gender" | "persona">("gender");
  const [gender, setGender] = useState<Gender | null>(null);
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPersonas();
  }, []);

  const loadPersonas = async () => {
    setLoading(true);
    setError(null);
    const { data, error: fetchError } = await supabase
      .from("personas")
      .select("*")
      .order("sort_order");

    if (fetchError || !data) {
      setError("페르소나를 불러오지 못했습니다");
    } else {
      setPersonas(data);
    }
    setLoading(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const handleGenderSelect = (selectedGender: Gender) => {
    setGender(selectedGender);
    setStep("persona");
  };

  const handlePersonaSelect = async (persona: Persona) => {
    setSaving(true);

    try {
      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        // Update profile with gender
        await supabase.from("profiles").upsert({
          id: user.id,
          gender,
        });

        // Set primary persona
        await supabase.from("user_personas").upsert({
          user_id: user.id,
          persona_id: persona.id,
          is_primary: true,
        });

        // Unlock first situation of this persona
        const { data: situations } = await supabase
          .from("situations")
          .select("id")
          .eq("persona_id", persona.id)
          .order("sort_order")
          .limit(1);

        if (situations && situations.length > 0) {
          await supabase.from("user_situation_progress").upsert({
            user_id: user.id,
            situation_id: situations[0].id,
            status: "available",
          });
        }
      }

      navigation.replace("Home");
    } catch (err) {
      Alert.alert("오류", "저장 중 문제가 발생했습니다. 다시 시도해주세요.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingScreen />;
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>{error}</Text>
          <TouchableOpacity
            style={[styles.option, { justifyContent: "center" }]}
            onPress={loadPersonas}
          >
            <Text style={styles.optionLabel}>다시 시도</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleSignOut}
          >
            <Text style={styles.backButtonText}>로그아웃</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {step === "gender" ? (
        <View style={styles.content}>
          <Text style={styles.title}>성별을 선택해주세요</Text>
          <Text style={styles.subtitle}>
            대화문에서 적절한 표현을 사용하기 위해 필요해요
          </Text>

          <View style={styles.optionsContainer}>
            {GENDER_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={styles.option}
                onPress={() => handleGenderSelect(option.value)}
              >
                <Text style={styles.optionIcon}>{option.icon}</Text>
                <Text style={styles.optionLabel}>{option.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={styles.backButton}
            onPress={handleSignOut}
          >
            <Text style={[styles.backButtonText, { fontSize: 14 }]}>로그아웃</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.content}>
          <Text style={styles.title}>학습 목적을 선택해주세요</Text>
          <Text style={styles.subtitle}>
            목적에 맞는 상황들을 먼저 배울 수 있어요
          </Text>

          <View style={styles.optionsContainer}>
            {personas.map((persona) => (
              <TouchableOpacity
                key={persona.id}
                style={styles.personaOption}
                onPress={() => handlePersonaSelect(persona)}
                disabled={saving}
              >
                <Text style={styles.optionIcon}>{persona.icon}</Text>
                <View style={styles.personaInfo}>
                  <Text style={styles.personaName}>{persona.name_ko}</Text>
                  <Text style={styles.personaDesc}>{persona.description}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setStep("gender")}
          >
            <Text style={styles.backButtonText}>뒤로</Text>
          </TouchableOpacity>

          {saving && <ActivityIndicator style={styles.loader} color={colors.primary} />}
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
  content: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: colors.textDark,
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textMuted,
    textAlign: "center",
    marginBottom: 40,
  },
  optionsContainer: {
    gap: 16,
  },
  option: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    ...shadows.md,
  },
  optionIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  optionLabel: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.textDark,
  },
  personaOption: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    flexDirection: "row",
    alignItems: "flex-start",
    ...shadows.md,
  },
  personaInfo: {
    flex: 1,
  },
  personaName: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.textDark,
    marginBottom: 4,
  },
  personaDesc: {
    fontSize: 14,
    color: colors.textMuted,
    lineHeight: 20,
  },
  backButton: {
    marginTop: 24,
    alignSelf: "center",
  },
  backButtonText: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: "500",
  },
  loader: {
    marginTop: 16,
  },
});
