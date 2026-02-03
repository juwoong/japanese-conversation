import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  Animated,
} from "react-native";
import * as Speech from "expo-speech";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { supabase } from "../lib/supabase";
import { startRecording, stopRecording, getRecordingStatus } from "../lib/audio";
import { transcribeAudio } from "../lib/stt";
import { useSession } from "../hooks/useSession";
import type { RootStackParamList, Line } from "../types";

type Props = NativeStackScreenProps<RootStackParamList, "Session">;

type LineLevel = 1 | 2 | 3;
type SessionPhase = "viewing" | "recording" | "processing" | "feedback";

interface FeedbackData {
  accuracy: number;
  userInput: string;
  expectedText: string;
  feedback: string;
}

export default function SessionScreen({ navigation, route }: Props) {
  const { situationId, isReview } = route.params;
  const session = useSession(situationId);

  const [level, setLevel] = useState<LineLevel>(1);
  const [showAnswer, setShowAnswer] = useState(false);
  const [userGender, setUserGender] = useState<string>("neutral");
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Recording & feedback state
  const [phase, setPhase] = useState<SessionPhase>("viewing");
  const [isRecording, setIsRecording] = useState(false);
  const [feedbackData, setFeedbackData] = useState<FeedbackData | null>(null);

  // Recording feedback state
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  const glowAnim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    loadUserProfile();
  }, []);

  // Auto-play TTS for NPC lines
  useEffect(() => {
    if (session.lines.length > 0 && !session.loading) {
      const currentLine = session.lines[session.currentIndex];
      if (currentLine?.speaker === "npc") {
        setPhase("viewing");
        setTimeout(() => speakLine(), 500);
      } else {
        setPhase("viewing");
      }
    }
  }, [session.currentIndex, session.loading]);

  // Recording animation and status polling
  useEffect(() => {
    if (phase === "recording") {
      // Reset duration when starting
      setRecordingDuration(0);
      setAudioLevel(0);

      // Subtle glow animation
      const glowAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 0.8,
            duration: 1200,
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0.4,
            duration: 1200,
            useNativeDriver: true,
          }),
        ])
      );
      glowAnimation.start();

      // Poll for recording status
      const interval = setInterval(async () => {
        const status = await getRecordingStatus();
        if (status) {
          setRecordingDuration(status.durationMillis);
          // Convert dBFS (-160 to 0) to 0-1 range
          // Typical speech is around -30 to -10 dBFS
          if (status.metering !== undefined) {
            const normalized = Math.max(0, Math.min(1, (status.metering + 60) / 60));
            setAudioLevel(normalized);
          }
        }
      }, 100);

      return () => {
        glowAnimation.stop();
        glowAnim.setValue(0.4);
        clearInterval(interval);
      };
    }
  }, [phase, glowAnim]);

  const loadUserProfile = async () => {
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
  };

  const currentLine = session.lines[session.currentIndex];

  const getDisplayText = (): string => {
    if (!currentLine) return "";
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

  // Start recording user's voice
  const handleStartRecording = async () => {
    try {
      setIsRecording(true);
      setPhase("recording");
      await startRecording();
    } catch (error) {
      console.error("Recording error:", error);
      setIsRecording(false);
      setPhase("viewing");
      Alert.alert("오류", "녹음을 시작할 수 없습니다.");
    }
  };

  // Stop recording and process
  const handleStopRecording = async () => {
    try {
      setIsRecording(false);
      setPhase("processing");

      const result = await stopRecording();
      if (!result) {
        setPhase("viewing");
        return;
      }

      // Transcribe audio using Whisper
      const sttResult = await transcribeAudio(result.uri);
      const expectedText = getDisplayText();

      // Submit attempt and get feedback
      const attemptResult = await session.submitAttempt(sttResult.text, expectedText);

      setFeedbackData({
        accuracy: attemptResult.accuracy,
        userInput: sttResult.text,
        expectedText,
        feedback: attemptResult.feedback,
      });
      setPhase("feedback");
    } catch (error) {
      console.error("Processing error:", error);
      setPhase("viewing");
      Alert.alert("오류", "음성 처리 중 오류가 발생했습니다.");
    }
  };

  const handleNext = () => {
    setFeedbackData(null);
    setPhase("viewing");
    setShowAnswer(false);

    if (session.currentIndex < session.lines.length - 1) {
      session.moveNext();
    } else {
      handleComplete();
    }
  };

  const handleRetry = () => {
    setFeedbackData(null);
    setPhase("viewing");
  };

  const handleComplete = async () => {
    if (isReview) {
      Alert.alert(
        "복습 완료!",
        `${session.situation?.name_ko} 복습을 완료했습니다.`,
        [{ text: "확인", onPress: () => navigation.goBack() }]
      );
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

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
      .eq("persona_id", session.situation?.persona_id)
      .gt("sort_order", session.situation?.sort_order)
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
      `${session.situation?.name_ko} 상황을 완료했습니다.`,
      [{ text: "확인", onPress: () => navigation.goBack() }]
    );
  };

  const handleExit = () => {
    Alert.alert("학습 종료", "학습을 종료하시겠습니까?", [
      { text: "취소", style: "cancel" },
      { text: "종료", onPress: () => navigation.goBack() },
    ]);
  };

  // Format recording duration as M:SS
  const formatRecordingTime = (millis: number): string => {
    const seconds = Math.floor(millis / 1000);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Waveform visualization component
  const Waveform = ({ level }: { level: number }) => {
    // Create smooth waveform effect with varying heights
    const bars = [0.3, 0.5, 0.7, 1, 0.8, 0.6, 0.4, 0.7, 1, 0.5, 0.3];
    return (
      <View style={styles.waveform}>
        {bars.map((baseHeight, i) => {
          const height = 4 + (level * baseHeight * 16);
          return (
            <View
              key={i}
              style={[
                styles.waveBar,
                { height },
              ]}
            />
          );
        })}
      </View>
    );
  };

  if (session.loading || !currentLine) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color="#6366f1" />
      </SafeAreaView>
    );
  }

  const isUserTurn = currentLine.speaker === "user";

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleExit}>
          <Text style={styles.closeButton}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.situationTitle}>{session.situation?.name_ko}</Text>
        <Text style={styles.progress}>
          {session.currentIndex + 1} / {session.lines.length}
        </Text>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressBar}>
        <View
          style={[
            styles.progressFill,
            { width: `${((session.currentIndex + 1) / session.lines.length) * 100}%` },
          ]}
        />
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Speaker Badge */}
        <View style={[styles.speakerBadge, isUserTurn && styles.userBadge]}>
          <Text style={styles.speakerText}>
            {isUserTurn ? "내 차례" : "상대방"}
          </Text>
        </View>

        {/* Feedback Card */}
        {phase === "feedback" && feedbackData && (
          <View style={styles.feedbackCard}>
            <Text style={styles.feedbackEmoji}>
              {feedbackData.accuracy >= 0.8 ? "✅" : feedbackData.accuracy >= 0.5 ? "🔶" : "❌"}
            </Text>
            <Text style={styles.feedbackTitle}>{feedbackData.feedback}</Text>

            <View style={styles.comparisonBox}>
              <Text style={styles.comparisonLabel}>내 발화:</Text>
              <Text style={styles.comparisonText}>{feedbackData.userInput || "(인식 안됨)"}</Text>
            </View>

            <View style={styles.comparisonBox}>
              <Text style={styles.comparisonLabel}>정답:</Text>
              <Text style={styles.comparisonTextCorrect}>{feedbackData.expectedText}</Text>
            </View>

            <Text style={styles.accuracyText}>
              정확도: {Math.round(feedbackData.accuracy * 100)}%
            </Text>

            <View style={styles.feedbackButtons}>
              {feedbackData.accuracy < 0.8 && (
                <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
                  <Text style={styles.retryButtonText}>다시 하기</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={styles.nextButtonSmall} onPress={handleNext}>
                <Text style={styles.nextButtonText}>
                  {session.currentIndex < session.lines.length - 1 ? "다음" : "완료"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Main Line Card */}
        {(phase === "viewing" || phase === "recording" || phase === "processing") && (
          <View style={styles.lineCard}>
            {/* For NPC: always show text */}
            {!isUserTurn && (
              <>
                <TouchableOpacity onPress={speakLine} style={styles.japaneseContainer}>
                  <Text style={styles.japaneseText}>{getDisplayText()}</Text>
                  <Text style={styles.speakerIcon}>{isSpeaking ? "🔊" : "🔈"}</Text>
                </TouchableOpacity>
                {level === 1 && currentLine.pronunciation_ko && (
                  <Text style={styles.pronunciation}>{currentLine.pronunciation_ko}</Text>
                )}
                <Text style={styles.translation}>{currentLine.text_ko}</Text>
              </>
            )}

            {/* For User: show based on level */}
            {isUserTurn && (
              <>
                {/* Level 1-2: show hints */}
                {level <= 2 && (
                  <>
                    <Text style={styles.translation}>{currentLine.text_ko}</Text>
                    {level === 1 && (
                      <Text style={styles.hintText}>힌트: {getDisplayText()}</Text>
                    )}
                  </>
                )}

                {/* Level 3: hidden */}
                {level === 3 && !showAnswer && (
                  <Text style={styles.translation}>{currentLine.text_ko}</Text>
                )}

                {/* Recording UI */}
                <View style={styles.recordingSection}>
                  {phase === "recording" ? (
                    <TouchableOpacity
                      style={styles.recordingContainer}
                      onPress={handleStopRecording}
                      activeOpacity={0.8}
                    >
                      <Animated.View
                        style={[
                          styles.recordingGlow,
                          { opacity: glowAnim }
                        ]}
                      />
                      <View style={styles.recordingInner}>
                        <View style={styles.recordingDot} />
                        <Text style={styles.recordingTime}>
                          {formatRecordingTime(recordingDuration)}
                        </Text>
                      </View>
                      <Waveform level={audioLevel} />
                      <Text style={styles.recordingHint}>탭하여 완료</Text>
                    </TouchableOpacity>
                  ) : phase === "processing" ? (
                    <View style={styles.processingContainer}>
                      <View style={styles.processingButton}>
                        <ActivityIndicator size="small" color="#fff" />
                      </View>
                      <Text style={styles.processingText}>처리 중...</Text>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={styles.micButton}
                      onPress={handleStartRecording}
                      activeOpacity={0.8}
                    >
                      <View style={styles.micIconContainer}>
                        <Text style={styles.micIcon}>🎤</Text>
                      </View>
                      <Text style={styles.micText}>탭하여 말하기</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </>
            )}

            {/* Grammar Hint */}
            {currentLine.grammar_hint && !isUserTurn && (
              <View style={styles.grammarHint}>
                <Text style={styles.grammarLabel}>💡 문법 힌트</Text>
                <Text style={styles.grammarText}>{currentLine.grammar_hint}</Text>
              </View>
            )}
          </View>
        )}
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

      {/* Next Button (only for NPC turns) */}
      {!isUserTurn && phase === "viewing" && (
        <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
          <Text style={styles.nextButtonText}>
            {session.currentIndex < session.lines.length - 1 ? "다음" : "완료"}
          </Text>
        </TouchableOpacity>
      )}
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
  feedbackCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  feedbackEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  feedbackTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1e293b",
    marginBottom: 20,
  },
  comparisonBox: {
    width: "100%",
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  comparisonLabel: {
    fontSize: 12,
    color: "#64748b",
    marginBottom: 4,
  },
  comparisonText: {
    fontSize: 18,
    color: "#1e293b",
  },
  comparisonTextCorrect: {
    fontSize: 18,
    color: "#16a34a",
    fontWeight: "600",
  },
  accuracyText: {
    fontSize: 16,
    color: "#6366f1",
    fontWeight: "600",
    marginTop: 8,
    marginBottom: 20,
  },
  feedbackButtons: {
    flexDirection: "row",
    gap: 12,
  },
  retryButton: {
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#64748b",
  },
  nextButtonSmall: {
    backgroundColor: "#6366f1",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
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
  hintText: {
    fontSize: 16,
    color: "#94a3b8",
    marginTop: 12,
    fontStyle: "italic",
  },
  recordingSection: {
    marginTop: 24,
    alignItems: "center",
  },
  micButton: {
    alignItems: "center",
    gap: 12,
  },
  micIconContainer: {
    backgroundColor: "#6366f1",
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#6366f1",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  micIcon: {
    fontSize: 32,
  },
  micText: {
    fontSize: 14,
    color: "#64748b",
    fontWeight: "500",
  },
  recordingContainer: {
    alignItems: "center",
    gap: 16,
  },
  recordingGlow: {
    position: "absolute",
    top: -8,
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: "#ef4444",
  },
  recordingInner: {
    backgroundColor: "#1e293b",
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  recordingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#ef4444",
  },
  recordingTime: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
    fontVariant: ["tabular-nums"],
  },
  recordingHint: {
    fontSize: 13,
    color: "#94a3b8",
  },
  processingContainer: {
    alignItems: "center",
    gap: 12,
  },
  processingButton: {
    backgroundColor: "#94a3b8",
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  processingText: {
    fontSize: 14,
    color: "#94a3b8",
    fontWeight: "500",
  },
  waveform: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 24,
    gap: 3,
  },
  waveBar: {
    width: 3,
    backgroundColor: "#6366f1",
    borderRadius: 1.5,
    minHeight: 4,
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
