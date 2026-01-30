import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from "react-native";
import * as Speech from "expo-speech";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { supabase } from "../lib/supabase";
import type { RootStackParamList, Situation, Line, Profile } from "../types";

type Props = NativeStackScreenProps<RootStackParamList, "Session">;

type LineLevel = 1 | 2 | 3; // 1: pronunciation+translation, 2: translation only, 3: hidden

export default function SessionScreen({ navigation, route }: Props) {
  const { situationId } = route.params;

  const [loading, setLoading] = useState(true);
  const [situation, setSituation] = useState<Situation | null>(null);
  const [lines, setLines] = useState<Line[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [level, setLevel] = useState<LineLevel>(1);
  const [showAnswer, setShowAnswer] = useState(false);
  const [userGender, setUserGender] = useState<string>("neutral");
  const [isSpeaking, setIsSpeaking] = useState(false);

  const loadSession = useCallback(async () => {
    try {
      // Load user profile
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("gender")
          .eq("id", user.id)
          .single();
        if (profile?.gender) {
          setUserGender(profile.gender);
        }
      }

      // Load situation
      const { data: situationData } = await supabase
        .from("situations")
        .select("*")
        .eq("id", situationId)
        .single();

      if (situationData) {
        setSituation(situationData);
      }

      // Load lines
      const { data: linesData } = await supabase
        .from("lines")
        .select("*")
        .eq("situation_id", situationId)
        .order("line_order");

      if (linesData) {
        setLines(linesData);
      }
    } catch (error) {
      console.error("Error loading session:", error);
    } finally {
      setLoading(false);
    }
  }, [situationId]);

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  const currentLine = lines[currentIndex];

  const getDisplayText = (): string => {
    if (!currentLine) return "";

    // Handle gender variants
    if (userGender === "male" && currentLine.text_ja_male) {
      return currentLine.text_ja_male;
    }
    if (userGender === "female" && currentLine.text_ja_female) {
      return currentLine.text_ja_female;
    }
    return currentLine.text_ja;
  };

  const speakLine = async () => {
    const text = getDisplayText();
    if (!text || isSpeaking) return;

    setIsSpeaking(true);
    Speech.speak(text, {
      language: "ja-JP",
      rate: 0.8,
      onDone: () => setIsSpeaking(false),
      onError: () => setIsSpeaking(false),
    });
  };

  const handleNext = () => {
    if (currentIndex < lines.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setShowAnswer(false);
    } else {
      // Session complete
      handleComplete();
    }
  };

  const handleComplete = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Update progress
    await supabase.from("user_situation_progress").upsert({
      user_id: user.id,
      situation_id: situationId,
      status: "completed",
      completed_at: new Date().toISOString(),
      attempt_count: 1,
    });

    // Unlock next situation
    const { data: nextSituation } = await supabase
      .from("situations")
      .select("id")
      .eq("persona_id", situation?.persona_id)
      .gt("sort_order", situation?.sort_order)
      .order("sort_order")
      .limit(1)
      .single();

    if (nextSituation) {
      await supabase.from("user_situation_progress").upsert({
        user_id: user.id,
        situation_id: nextSituation.id,
        status: "available",
      });
    }

    Alert.alert(
      "학습 완료!",
      `${situation?.name_ko} 상황을 완료했습니다.`,
      [
        {
          text: "확인",
          onPress: () => navigation.goBack(),
        },
      ]
    );
  };

  const handleExit = () => {
    Alert.alert(
      "학습 종료",
      "학습을 종료하시겠습니까?",
      [
        { text: "취소", style: "cancel" },
        { text: "종료", onPress: () => navigation.goBack() },
      ]
    );
  };

  if (loading || !currentLine) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#6366f1" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleExit}>
          <Text style={styles.closeButton}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.situationTitle}>{situation?.name_ko}</Text>
        <Text style={styles.progress}>
          {currentIndex + 1} / {lines.length}
        </Text>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressBar}>
        <View
          style={[
            styles.progressFill,
            { width: `${((currentIndex + 1) / lines.length) * 100}%` },
          ]}
        />
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Speaker Badge */}
        <View
          style={[
            styles.speakerBadge,
            currentLine.speaker === "user" && styles.userBadge,
          ]}
        >
          <Text style={styles.speakerText}>
            {currentLine.speaker === "npc" ? "상대방" : "나"}
          </Text>
        </View>

        {/* Line Card */}
        <View style={styles.lineCard}>
          {/* Japanese Text */}
          {level <= 2 && (
            <TouchableOpacity onPress={speakLine} style={styles.japaneseContainer}>
              <Text style={styles.japaneseText}>{getDisplayText()}</Text>
              <Text style={styles.speakerIcon}>{isSpeaking ? "🔊" : "🔈"}</Text>
            </TouchableOpacity>
          )}

          {/* Pronunciation (Level 1 only) */}
          {level === 1 && currentLine.pronunciation_ko && (
            <Text style={styles.pronunciation}>{currentLine.pronunciation_ko}</Text>
          )}

          {/* Translation (Level 1 & 2) */}
          {level <= 2 && (
            <Text style={styles.translation}>{currentLine.text_ko}</Text>
          )}

          {/* Level 3: Hidden until revealed */}
          {level === 3 && !showAnswer && (
            <TouchableOpacity
              style={styles.revealButton}
              onPress={() => setShowAnswer(true)}
            >
              <Text style={styles.revealButtonText}>정답 보기</Text>
            </TouchableOpacity>
          )}

          {level === 3 && showAnswer && (
            <>
              <Text style={styles.japaneseText}>{getDisplayText()}</Text>
              <Text style={styles.translation}>{currentLine.text_ko}</Text>
            </>
          )}

          {/* Grammar Hint */}
          {currentLine.grammar_hint && (level <= 2 || showAnswer) && (
            <View style={styles.grammarHint}>
              <Text style={styles.grammarLabel}>💡 문법 힌트</Text>
              <Text style={styles.grammarText}>{currentLine.grammar_hint}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Level Toggle */}
      <View style={styles.levelToggle}>
        {[1, 2, 3].map((l) => (
          <TouchableOpacity
            key={l}
            style={[styles.levelButton, level === l && styles.levelButtonActive]}
            onPress={() => {
              setLevel(l as LineLevel);
              setShowAnswer(false);
            }}
          >
            <Text
              style={[
                styles.levelButtonText,
                level === l && styles.levelButtonTextActive,
              ]}
            >
              Lv.{l}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Next Button */}
      <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
        <Text style={styles.nextButtonText}>
          {currentIndex < lines.length - 1 ? "다음" : "완료"}
        </Text>
      </TouchableOpacity>
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
    paddingVertical: 12,
  },
  closeButton: {
    fontSize: 24,
    color: "#64748b",
    width: 40,
  },
  situationTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1e293b",
  },
  progress: {
    fontSize: 14,
    color: "#64748b",
    width: 40,
    textAlign: "right",
  },
  progressBar: {
    height: 4,
    backgroundColor: "#e2e8f0",
    marginHorizontal: 20,
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#6366f1",
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
  },
  speakerBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#e2e8f0",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 12,
  },
  userBadge: {
    backgroundColor: "#dbeafe",
  },
  speakerText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#64748b",
  },
  lineCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  japaneseContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  japaneseText: {
    fontSize: 24,
    fontWeight: "600",
    color: "#1e293b",
    flex: 1,
    lineHeight: 36,
  },
  speakerIcon: {
    fontSize: 24,
    marginLeft: 12,
  },
  pronunciation: {
    fontSize: 16,
    color: "#6366f1",
    marginTop: 12,
  },
  translation: {
    fontSize: 18,
    color: "#64748b",
    marginTop: 16,
    lineHeight: 28,
  },
  revealButton: {
    backgroundColor: "#f1f5f9",
    paddingVertical: 40,
    borderRadius: 12,
    alignItems: "center",
  },
  revealButtonText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#6366f1",
  },
  grammarHint: {
    marginTop: 20,
    padding: 16,
    backgroundColor: "#fef3c7",
    borderRadius: 12,
  },
  grammarLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#92400e",
    marginBottom: 4,
  },
  grammarText: {
    fontSize: 14,
    color: "#78350f",
    lineHeight: 20,
  },
  levelToggle: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
    paddingVertical: 16,
  },
  levelButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: "#e2e8f0",
  },
  levelButtonActive: {
    backgroundColor: "#6366f1",
  },
  levelButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#64748b",
  },
  levelButtonTextActive: {
    color: "#fff",
  },
  nextButton: {
    backgroundColor: "#6366f1",
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
  },
  nextButtonText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
  },
});
