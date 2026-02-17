import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Speech from "expo-speech";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { supabase } from "../lib/supabase";
import { startRecording, stopRecording } from "../lib/audio";
import { transcribeAudio } from "../lib/stt";
import { accuracyScore } from "../lib/textDiff";
import type { RootStackParamList, UserLevel } from "../types";
import { colors } from "../constants/theme";

type Props = NativeStackScreenProps<RootStackParamList, "Onboarding">;

type Step = 1 | 2 | 3;

const EXPECTED_TEXT = "いらっしゃいませ";

function classifyLevel(score: number): UserLevel {
  if (score >= 80) return "intermediate";
  if (score >= 40) return "beginner";
  return "conservative_beginner";
}

export default function OnboardingScreen({ navigation }: Props) {
  const [step, setStep] = useState<Step>(1);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [userLevel, setUserLevel] = useState<UserLevel>("conservative_beginner");

  // --- Step 2: TTS ---
  const playGreeting = () => {
    Speech.speak(EXPECTED_TEXT, { language: "ja" });
  };

  const goToStep2 = () => {
    setStep(2);
    // Auto-play TTS after a brief delay for the transition
    setTimeout(playGreeting, 500);
  };

  // --- Step 2: Recording ---
  const handleRecord = async () => {
    if (isRecording) {
      // Stop recording
      setIsRecording(false);
      setIsProcessing(true);
      try {
        const result = await stopRecording();
        if (result) {
          const sttResult = await transcribeAudio(result.uri, EXPECTED_TEXT);
          const score = accuracyScore(EXPECTED_TEXT, sttResult.text);
          setUserLevel(classifyLevel(score));
        }
      } catch {
        // If recording/STT fails, default to conservative beginner
        setUserLevel("conservative_beginner");
      } finally {
        setIsProcessing(false);
        setStep(3);
      }
    } else {
      // Start recording
      try {
        await startRecording();
        setIsRecording(true);
      } catch {
        Alert.alert("마이크 권한이 필요합니다", "설정에서 마이크 권한을 허용해주세요.");
      }
    }
  };

  const handleSkip = () => {
    setUserLevel("conservative_beginner");
    setStep(3);
  };

  // --- Step 3: Save & Navigate ---
  const handleComplete = async () => {
    setSaving(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        // Save profile with level (default persona: tourist)
        await supabase.from("profiles").upsert({
          id: user.id,
          onboarding_completed: true,
        });

        // Set default persona (tourist, id=1)
        const { data: touristPersona } = await supabase
          .from("personas")
          .select("id")
          .eq("slug", "tourist")
          .limit(1)
          .single();

        if (touristPersona) {
          await supabase.from("user_personas").upsert({
            user_id: user.id,
            persona_id: touristPersona.id,
            is_primary: true,
          });

          // Unlock first situation of tourist persona
          const { data: situations } = await supabase
            .from("situations")
            .select("id")
            .eq("persona_id", touristPersona.id)
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
      }

      navigation.replace("Home");
    } catch {
      Alert.alert("오류", "저장 중 문제가 발생했습니다. 다시 시도해주세요.");
    } finally {
      setSaving(false);
    }
  };

  // --- Render ---

  if (step === 1) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: "#87CEEB" }]}>
        <View style={styles.content}>
          <Text style={styles.emoji}>✈️</Text>
          <Text style={styles.title}>도쿄에 도착했습니다.</Text>
          <TouchableOpacity style={styles.primaryButton} onPress={goToStep2}>
            <Text style={styles.primaryButtonText}>시작하기</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (step === 2) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: "#F5F0E8" }]}>
        <View style={styles.content}>
          <Text style={styles.emoji}>🏢</Text>
          <Text style={styles.title}>따라 말해보세요</Text>

          <TouchableOpacity style={styles.listenButton} onPress={playGreeting}>
            <Text style={styles.listenButtonText}>🔊 다시 듣기</Text>
          </TouchableOpacity>

          <View style={styles.buttonGroup}>
            <TouchableOpacity
              style={[
                styles.primaryButton,
                isRecording && styles.recordingButton,
              ]}
              onPress={handleRecord}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.primaryButtonText}>
                  {isRecording ? "⏹ 녹음 중지" : "🎤 녹음"}
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={handleSkip}
              disabled={isProcessing || isRecording}
            >
              <Text style={styles.secondaryButtonText}>듣기만 할게요</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // Step 3
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: "#E8F5E9" }]}>
      <View style={styles.content}>
        <Text style={styles.emoji}>🚪</Text>
        <Text style={styles.title}>첫 번째 일본어를 들었습니다!</Text>
        <Text style={styles.subtitle}>출구가 저쪽이래요.</Text>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={handleComplete}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.primaryButtonText}>도쿄 탐험 시작하기</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  emoji: {
    fontSize: 80,
    marginBottom: 32,
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
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 32,
    marginTop: 32,
    minWidth: 200,
    alignItems: "center",
  },
  primaryButtonText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
  },
  recordingButton: {
    backgroundColor: colors.danger,
  },
  secondaryButton: {
    paddingVertical: 12,
    marginTop: 16,
    alignItems: "center",
  },
  secondaryButtonText: {
    fontSize: 16,
    color: colors.textMuted,
    fontWeight: "500",
  },
  listenButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginTop: 8,
    marginBottom: 16,
  },
  listenButtonText: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: "500",
  },
  buttonGroup: {
    alignItems: "center",
    width: "100%",
  },
});
