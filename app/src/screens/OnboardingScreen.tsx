import React, { useState, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Speech from "expo-speech";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { supabase } from "../lib/supabase";
import { startRecording, stopRecording } from "../lib/audio";
import { transcribeAudio } from "../lib/stt";
import { accuracyScore } from "../lib/textDiff";
import type { RootStackParamList, UserLevel, Destination } from "../types";
import { colors } from "../constants/theme";
import { AuthContext } from "../contexts/AuthContext";

type Props = NativeStackScreenProps<RootStackParamList, "Onboarding">;

type Step = 1 | 2 | 3 | 4 | 5 | 6;

const EXPECTED_TEXT = "いらっしゃいませ";

const PERSONA_OPTIONS = [
  { slug: "tourist", label: "관광·여행", emoji: "🧳", desc: "편의점, 식당, 교통편" },
  { slug: "business", label: "출장·비즈니스", emoji: "💼", desc: "회의, 명함 교환, 식사 접대" },
  { slug: "workingholiday", label: "워홀·유학", emoji: "🎒", desc: "은행, 병원, 부동산, 아르바이트" },
];

const DESTINATION_OPTIONS: { slug: Destination; label: string; emoji: string }[] = [
  { slug: "tokyo", label: "도쿄", emoji: "🗼" },
  { slug: "osaka", label: "오사카", emoji: "🏯" },
  { slug: "kyoto", label: "교토", emoji: "⛩️" },
  { slug: "fukuoka", label: "후쿠오카", emoji: "🌸" },
];

const DEPARTURE_OPTIONS = [
  { label: "1주 후", days: 7 },
  { label: "2주 후", days: 14 },
  { label: "1개월 후", days: 30 },
  { label: "3개월 후", days: 90 },
];

function classifyLevel(score: number): UserLevel {
  if (score >= 80) return "intermediate";
  if (score >= 40) return "beginner";
  return "conservative_beginner";
}

function addDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

export default function OnboardingScreen({ navigation }: Props) {
  const { onOnboardingComplete } = useContext(AuthContext);
  const [step, setStep] = useState<Step>(1);

  // Selections
  const [selectedPersona, setSelectedPersona] = useState<string | null>(null);
  const [selectedDestination, setSelectedDestination] = useState<Destination | null>(null);
  const [departureDate, setDepartureDate] = useState<string | null>(null);

  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [userLevel, setUserLevel] = useState<UserLevel>("conservative_beginner");

  // --- Step 5: TTS ---
  const playGreeting = () => {
    Speech.speak(EXPECTED_TEXT, { language: "ja" });
  };

  const goToRecordingStep = () => {
    setStep(5);
    setTimeout(playGreeting, 500);
  };

  // --- Step 5: Recording ---
  const handleRecord = async () => {
    if (isRecording) {
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
        setUserLevel("conservative_beginner");
      } finally {
        setIsProcessing(false);
        setStep(6);
      }
    } else {
      try {
        await startRecording();
        setIsRecording(true);
      } catch {
        Alert.alert("마이크 권한이 필요합니다", "설정에서 마이크 권한을 허용해주세요.");
      }
    }
  };

  const handleSkipRecording = () => {
    setUserLevel("conservative_beginner");
    setStep(6);
  };

  // --- Step 6: Save & Complete ---
  const handleComplete = async () => {
    setSaving(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        // Save profile with destination + departure_date
        await supabase.from("profiles").upsert({
          id: user.id,
          onboarding_completed: true,
          destination: selectedDestination,
          departure_date: departureDate,
        });

        // Also save departure_date to AsyncStorage for SettingsScreen compat
        if (departureDate) {
          await AsyncStorage.setItem("@departure_date", departureDate);
        }

        // Set persona
        const personaSlug = selectedPersona || "tourist";
        const { data: personaRow } = await supabase
          .from("personas")
          .select("id")
          .eq("slug", personaSlug)
          .limit(1)
          .single();

        if (personaRow) {
          await supabase.from("user_personas").upsert({
            user_id: user.id,
            persona_id: personaRow.id,
            is_primary: true,
          });

          // Unlock first situation of selected persona
          const { data: situations } = await supabase
            .from("situations")
            .select("id")
            .eq("persona_id", personaRow.id)
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

      onOnboardingComplete();
    } catch {
      Alert.alert("오류", "저장 중 문제가 발생했습니다. 다시 시도해주세요.");
    } finally {
      setSaving(false);
    }
  };

  // --- Render helpers ---

  const destinationLabel =
    DESTINATION_OPTIONS.find((d) => d.slug === selectedDestination)?.label ?? "일본";
  const personaLabel =
    PERSONA_OPTIONS.find((p) => p.slug === selectedPersona)?.label ?? "여행";

  // ========== Step 1: Intro ==========
  if (step === 1) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: "#87CEEB" }]}>
        <View style={styles.content}>
          <Text style={styles.bigEmoji}>✈️</Text>
          <Text style={styles.title}>일본에 가시나요?</Text>
          <Text style={styles.subtitle}>현지에서 바로 써먹는 일본어,{"\n"}같이 준비해봐요</Text>
          <TouchableOpacity style={styles.primaryButton} onPress={() => setStep(2)}>
            <Text style={styles.primaryButtonText}>시작하기</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ========== Step 2: Persona Selection ==========
  if (step === 2) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: "#F5F0E8" }]}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.stepLabel}>1/4</Text>
          <Text style={styles.title}>어떤 목적으로 가세요?</Text>

          <View style={styles.cardGrid}>
            {PERSONA_OPTIONS.map((p) => (
              <TouchableOpacity
                key={p.slug}
                style={[
                  styles.selectionCard,
                  selectedPersona === p.slug && styles.selectionCardActive,
                ]}
                onPress={() => setSelectedPersona(p.slug)}
              >
                <Text style={styles.cardEmoji}>{p.emoji}</Text>
                <Text style={[
                  styles.cardLabel,
                  selectedPersona === p.slug && styles.cardLabelActive,
                ]}>{p.label}</Text>
                <Text style={styles.cardDesc}>{p.desc}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.primaryButton, !selectedPersona && styles.buttonDisabled]}
            onPress={() => setStep(3)}
            disabled={!selectedPersona}
          >
            <Text style={styles.primaryButtonText}>다음</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ========== Step 3: Destination Selection ==========
  if (step === 3) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: "#FFF3E0" }]}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.stepLabel}>2/4</Text>
          <Text style={styles.title}>어디로 가세요?</Text>

          <View style={styles.destGrid}>
            {DESTINATION_OPTIONS.map((d) => (
              <TouchableOpacity
                key={d.slug}
                style={[
                  styles.destCard,
                  selectedDestination === d.slug && styles.selectionCardActive,
                ]}
                onPress={() => setSelectedDestination(d.slug)}
              >
                <Text style={styles.destEmoji}>{d.emoji}</Text>
                <Text style={[
                  styles.destLabel,
                  selectedDestination === d.slug && styles.cardLabelActive,
                ]}>{d.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.primaryButton, !selectedDestination && styles.buttonDisabled]}
            onPress={() => setStep(4)}
            disabled={!selectedDestination}
          >
            <Text style={styles.primaryButtonText}>다음</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ========== Step 4: Departure Date ==========
  if (step === 4) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: "#E8F5E9" }]}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.stepLabel}>3/4</Text>
          <Text style={styles.title}>언제 출발하세요?</Text>
          <Text style={styles.subtitle}>출발일에 맞춰 학습 페이스를 조절해드려요</Text>

          <View style={styles.cardGrid}>
            {DEPARTURE_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.days}
                style={[
                  styles.departureCard,
                  departureDate === addDays(opt.days) && styles.selectionCardActive,
                ]}
                onPress={() => setDepartureDate(addDays(opt.days))}
              >
                <Text style={[
                  styles.departureLabel,
                  departureDate === addDays(opt.days) && styles.cardLabelActive,
                ]}>{opt.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={goToRecordingStep}
          >
            <Text style={styles.primaryButtonText}>
              {departureDate ? "다음" : "다음"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.skipButton}
            onPress={() => {
              setDepartureDate(null);
              goToRecordingStep();
            }}
          >
            <Text style={styles.skipButtonText}>아직 모르겠어요</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ========== Step 5: Pronunciation Test ==========
  if (step === 5) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: "#F5F0E8" }]}>
        <View style={styles.content}>
          <Text style={styles.stepLabel}>4/4</Text>
          <Text style={styles.bigEmoji}>🏢</Text>
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
              style={styles.skipButton}
              onPress={handleSkipRecording}
              disabled={isProcessing || isRecording}
            >
              <Text style={styles.skipButtonText}>듣기만 할게요</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // ========== Step 6: Complete ==========
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: "#E8F5E9" }]}>
      <View style={styles.content}>
        <Text style={styles.bigEmoji}>🚀</Text>
        <Text style={styles.title}>{destinationLabel} {personaLabel}</Text>
        <Text style={styles.subtitle}>준비됐어요!</Text>

        {departureDate && (
          <View style={styles.ddayBadge}>
            <Text style={styles.ddayText}>
              D-{Math.max(0, Math.ceil((new Date(departureDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))}
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={handleComplete}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.primaryButtonText}>{destinationLabel} 탐험 시작하기</Text>
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
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  stepLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textMuted,
    marginBottom: 16,
  },
  bigEmoji: {
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
    marginBottom: 32,
    lineHeight: 24,
  },
  // Selection cards
  cardGrid: {
    width: "100%",
    gap: 12,
    marginBottom: 32,
  },
  selectionCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: "transparent",
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  selectionCardActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  cardEmoji: {
    fontSize: 32,
  },
  cardLabel: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.textDark,
  },
  cardLabelActive: {
    color: colors.primary,
  },
  cardDesc: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2,
    flex: 1,
  },
  // Destination grid (2x2)
  destGrid: {
    width: "100%",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 32,
  },
  destCard: {
    width: "47%",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    gap: 8,
    borderWidth: 2,
    borderColor: "transparent",
  },
  destEmoji: {
    fontSize: 40,
  },
  destLabel: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.textDark,
  },
  // Departure date
  departureCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 18,
    borderWidth: 2,
    borderColor: "transparent",
    alignItems: "center",
  },
  departureLabel: {
    fontSize: 17,
    fontWeight: "600",
    color: colors.textDark,
  },
  // D-Day badge
  ddayBadge: {
    backgroundColor: colors.primary,
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 8,
    marginBottom: 16,
    marginTop: 16,
  },
  ddayText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
  },
  // Buttons
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 32,
    marginTop: 8,
    minWidth: 200,
    alignItems: "center",
  },
  primaryButtonText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  recordingButton: {
    backgroundColor: colors.danger,
  },
  skipButton: {
    paddingVertical: 12,
    marginTop: 12,
    alignItems: "center",
  },
  skipButtonText: {
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
