import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { supabase } from "../lib/supabase";
import type { RootStackParamList, Persona, Profile } from "../types";
import { colors, type ColorScheme, setColorScheme, getColorScheme } from "../constants/theme";
import { MaterialIcons } from "@expo/vector-icons";
import BackHeader from "../components/BackHeader";

type Props = NativeStackScreenProps<RootStackParamList, "Settings">;

const TTS_SPEED_KEY = "@tts_speed";
const DEPARTURE_DATE_KEY = "@departure_date";

const TTS_SPEEDS = [
  { value: 0.5, label: "0.5x (느림)" },
  { value: 0.8, label: "0.8x (보통)" },
  { value: 1.0, label: "1.0x (빠름)" },
];

const DAILY_GOALS = [
  { value: 1, label: "한 곳" },
  { value: 3, label: "세 곳" },
  { value: 5, label: "다섯 곳" },
];

export default function SettingsScreen({ navigation }: Props) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [currentPersona, setCurrentPersona] = useState<Persona | null>(null);
  const [allPersonas, setAllPersonas] = useState<Persona[]>([]);
  const [ttsSpeed, setTtsSpeed] = useState(0.8);
  const [colorScheme, setColorSchemeState] = useState<ColorScheme>(getColorScheme());
  const [departureDate, setDepartureDate] = useState<string | null>(null);
  const [showDateInput, setShowDateInput] = useState(false);
  const [dateInputYear, setDateInputYear] = useState("");
  const [dateInputMonth, setDateInputMonth] = useState("");
  const [dateInputDay, setDateInputDay] = useState("");

  useEffect(() => {
    loadSettings();
    loadTtsSpeed();
    loadDepartureDate();
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

  const loadDepartureDate = async () => {
    const saved = await AsyncStorage.getItem(DEPARTURE_DATE_KEY);
    if (saved) setDepartureDate(saved);
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

  const handleSetDepartureDate = async () => {
    const y = parseInt(dateInputYear, 10);
    const m = parseInt(dateInputMonth, 10);
    const d = parseInt(dateInputDay, 10);

    if (!y || !m || !d || m < 1 || m > 12 || d < 1 || d > 31) {
      Alert.alert("날짜 확인", "올바른 날짜를 입력해주세요.");
      return;
    }

    const date = new Date(y, m - 1, d);
    // Validate the date is real (e.g. Feb 30 would roll over)
    if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) {
      Alert.alert("날짜 확인", "존재하지 않는 날짜입니다.");
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (date < today) {
      Alert.alert("날짜 확인", "오늘 이후의 날짜를 선택해주세요.");
      return;
    }

    const isoDate = date.toISOString().split("T")[0]; // YYYY-MM-DD
    setDepartureDate(isoDate);
    await AsyncStorage.setItem(DEPARTURE_DATE_KEY, isoDate);
    setShowDateInput(false);
  };

  const handleClearDepartureDate = async () => {
    Alert.alert("출발일 초기화", "설정된 출발일을 지울까요?", [
      { text: "취소", style: "cancel" },
      {
        text: "지우기",
        style: "destructive",
        onPress: async () => {
          setDepartureDate(null);
          await AsyncStorage.removeItem(DEPARTURE_DATE_KEY);
        },
      },
    ]);
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
            // onAuthStateChange가 화면 전환을 처리합니다
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

  const formatDepartureDate = (iso: string): string => {
    const [y, m, d] = iso.split("-");
    return `${y}년 ${parseInt(m, 10)}월 ${parseInt(d, 10)}일`;
  };

  const getDaysUntilDeparture = (iso: string): number => {
    const now = new Date();
    const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const dep = new Date(iso);
    const depMidnight = new Date(dep.getFullYear(), dep.getMonth(), dep.getDate());
    return Math.round((depMidnight.getTime() - todayMidnight.getTime()) / (1000 * 60 * 60 * 24));
  };

  return (
    <SafeAreaView style={styles.container}>
      <BackHeader title="설정" onBack={() => navigation.goBack()} />

      <ScrollView style={styles.scrollView}>
        {/* Profile Section — "현재 레벨" removed (no levels in this app) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>프로필</Text>
          <View style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.label}>성별</Text>
              <Text style={styles.value}>
                {profile?.gender ? genderLabel[profile.gender as keyof typeof genderLabel] : "-"}
              </Text>
            </View>
          </View>
        </View>

        {/* Departure Date Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>여행 출발일</Text>
          <View style={styles.card}>
            {departureDate ? (
              <>
                <View style={styles.departureDateRow}>
                  <View style={styles.departureDateInfo}>
                    <Text style={styles.departureDateText}>
                      {formatDepartureDate(departureDate)}
                    </Text>
                    <Text style={styles.departureDaysLeft}>
                      D-{getDaysUntilDeparture(departureDate)}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={handleClearDepartureDate}>
                    <MaterialIcons name="close" size={20} color={colors.textLight} />
                  </TouchableOpacity>
                </View>
              </>
            ) : !showDateInput ? (
              <TouchableOpacity
                style={styles.setDateButton}
                onPress={() => {
                  const now = new Date();
                  setDateInputYear(String(now.getFullYear()));
                  setDateInputMonth("");
                  setDateInputDay("");
                  setShowDateInput(true);
                }}
              >
                <MaterialIcons name="flight-takeoff" size={20} color={colors.primary} />
                <Text style={styles.setDateButtonText}>출발일 설정하기</Text>
              </TouchableOpacity>
            ) : null}

            {showDateInput && (
              <View style={styles.dateInputContainer}>
                <Text style={styles.dateInputLabel}>출발 날짜를 입력하세요</Text>
                <View style={styles.dateInputRow}>
                  <View style={styles.dateField}>
                    <Text style={styles.dateFieldLabel}>년</Text>
                    <TouchableOpacity
                      style={styles.dateFieldInput}
                      onPress={() => {
                        const currentYear = new Date().getFullYear();
                        const years = Array.from({ length: 3 }, (_, i) => currentYear + i);
                        Alert.alert("연도 선택", "", years.map((y) => ({
                          text: `${y}년`,
                          onPress: () => setDateInputYear(String(y)),
                        })).concat([{ text: "취소", onPress: () => {}, style: "cancel" } as any]));
                      }}
                    >
                      <Text style={[styles.dateFieldValue, !dateInputYear && styles.dateFieldPlaceholder]}>
                        {dateInputYear ? `${dateInputYear}년` : "년"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.dateField}>
                    <Text style={styles.dateFieldLabel}>월</Text>
                    <TouchableOpacity
                      style={styles.dateFieldInput}
                      onPress={() => {
                        const months = Array.from({ length: 12 }, (_, i) => `${i + 1}월`);
                        Alert.alert("월 선택", "", months.map((label, i) => ({
                          text: label,
                          onPress: () => setDateInputMonth(String(i + 1)),
                        })).concat([{ text: "취소", onPress: () => {}, style: "cancel" } as any]));
                      }}
                    >
                      <Text style={[styles.dateFieldValue, !dateInputMonth && styles.dateFieldPlaceholder]}>
                        {dateInputMonth ? `${dateInputMonth}월` : "월"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.dateField}>
                    <Text style={styles.dateFieldLabel}>일</Text>
                    <TouchableOpacity
                      style={styles.dateFieldInput}
                      onPress={() => {
                        const days = Array.from({ length: 31 }, (_, i) => `${i + 1}일`);
                        // Show in pages of 10 for usability
                        Alert.alert("일 선택", "", days.map((label, i) => ({
                          text: label,
                          onPress: () => setDateInputDay(String(i + 1)),
                        })).concat([{ text: "취소", onPress: () => {}, style: "cancel" } as any]));
                      }}
                    >
                      <Text style={[styles.dateFieldValue, !dateInputDay && styles.dateFieldPlaceholder]}>
                        {dateInputDay ? `${dateInputDay}일` : "일"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
                <View style={styles.dateActions}>
                  <TouchableOpacity
                    style={styles.dateCancelButton}
                    onPress={() => setShowDateInput(false)}
                  >
                    <Text style={styles.dateCancelText}>취소</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.dateConfirmButton,
                      (!dateInputYear || !dateInputMonth || !dateInputDay) && styles.dateConfirmButtonDisabled,
                    ]}
                    onPress={handleSetDepartureDate}
                    disabled={!dateInputYear || !dateInputMonth || !dateInputDay}
                  >
                    <Text style={styles.dateConfirmText}>설정</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Daily Goal Section — reframed as travel destinations */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>하루에 얼마나 여행할까요?</Text>
          <View style={styles.card}>
            <View style={styles.goalButtons}>
              {DAILY_GOALS.map(({ value, label }) => (
                <TouchableOpacity
                  key={value}
                  style={[
                    styles.goalButton,
                    profile?.daily_goal === value && styles.goalButtonActive,
                  ]}
                  onPress={() => handleDailyGoalChange(value)}
                >
                  <Text
                    style={[
                      styles.goalButtonText,
                      profile?.daily_goal === value && styles.goalButtonTextActive,
                    ]}
                  >
                    {label}
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
                  <MaterialIcons name="check-circle" size={22} color={colors.primary} />
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
    fontSize: 11,
    fontWeight: "600",
    color: colors.textMuted,
    marginBottom: 12,
    marginLeft: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
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
    backgroundColor: colors.primaryLight,
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
  signOutButton: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  signOutText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.danger,
  },
  // Departure date styles
  departureDateRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
  },
  departureDateInfo: {
    flex: 1,
  },
  departureDateText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textDark,
  },
  departureDaysLeft: {
    fontSize: 13,
    color: colors.primary,
    marginTop: 4,
    fontWeight: "500",
  },
  setDateButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    gap: 8,
  },
  setDateButtonText: {
    fontSize: 16,
    fontWeight: "500",
    color: colors.primary,
  },
  dateInputContainer: {
    padding: 16,
  },
  dateInputLabel: {
    fontSize: 14,
    color: colors.textMedium,
    marginBottom: 12,
  },
  dateInputRow: {
    flexDirection: "row",
    gap: 12,
  },
  dateField: {
    flex: 1,
  },
  dateFieldLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.textLight,
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  dateFieldInput: {
    backgroundColor: colors.borderLight,
    borderRadius: 10,
    padding: 12,
    alignItems: "center",
  },
  dateFieldValue: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textDark,
  },
  dateFieldPlaceholder: {
    color: colors.textLight,
  },
  dateActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
    marginTop: 16,
  },
  dateCancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  dateCancelText: {
    fontSize: 15,
    fontWeight: "500",
    color: colors.textMuted,
  },
  dateConfirmButton: {
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 10,
    backgroundColor: colors.primary,
  },
  dateConfirmButtonDisabled: {
    opacity: 0.4,
  },
  dateConfirmText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});
