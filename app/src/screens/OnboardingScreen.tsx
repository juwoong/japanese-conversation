import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { supabase } from "../lib/supabase";
import type { RootStackParamList, Persona } from "../types";

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

  useEffect(() => {
    loadPersonas();
  }, []);

  const loadPersonas = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("personas")
      .select("*")
      .order("sort_order");

    if (data && !error) {
      setPersonas(data);
    }
    setLoading(false);
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
    } catch (error) {
      console.error("Error saving onboarding:", error);
    } finally {
      setSaving(false);
    }
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

          {saving && <ActivityIndicator style={styles.loader} color="#6366f1" />}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1e293b",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#64748b",
    textAlign: "center",
    marginBottom: 40,
  },
  optionsContainer: {
    gap: 16,
  },
  option: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  optionIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  optionLabel: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1e293b",
  },
  personaOption: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    flexDirection: "row",
    alignItems: "flex-start",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  personaInfo: {
    flex: 1,
  },
  personaName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 4,
  },
  personaDesc: {
    fontSize: 14,
    color: "#64748b",
    lineHeight: 20,
  },
  backButton: {
    marginTop: 24,
    alignSelf: "center",
  },
  backButtonText: {
    fontSize: 16,
    color: "#6366f1",
    fontWeight: "500",
  },
  loader: {
    marginTop: 16,
  },
});
