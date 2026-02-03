import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  Animated,
  ScrollView,
} from "react-native";
import * as Speech from "expo-speech";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { supabase } from "../lib/supabase";
import { startRecording, stopRecording, getRecordingStatus } from "../lib/audio";
import { transcribeAudio } from "../lib/stt";
import { useSession } from "../hooks/useSession";
import type { RootStackParamList, Line } from "../types";
import { colors } from "../constants/theme";
import LoadingScreen from "../components/LoadingScreen";

type Props = NativeStackScreenProps<RootStackParamList, "Session">;

type SessionPhase = "viewing" | "recording" | "processing" | "success";

interface FeedbackData {
  accuracy: number;
  userInput: string;
  expectedText: string;
  feedback: string;
}

interface ChatMessage {
  lineIndex: number;
  line: Line;
  displayText: string;
  feedbackData?: { accuracy: number; userInput: string };
}

export default function SessionScreen({ navigation, route }: Props) {
  const { situationId, isReview } = route.params;
  const session = useSession(situationId);

  const [showPronunciation, setShowPronunciation] = useState(true);
  const [userGender, setUserGender] = useState<string>("neutral");
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [revealedTranslations, setRevealedTranslations] = useState<Set<number>>(new Set());
  const [expandedGrammar, setExpandedGrammar] = useState<Set<number>>(new Set());
  const scrollRef = useRef<ScrollView>(null);
  const autoAdvanceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  // Scroll to bottom when messages change or phase changes
  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }, [messages, phase, session.currentIndex]);

  // Recording animation and status polling
  useEffect(() => {
    if (phase === "recording") {
      setRecordingDuration(0);
      setAudioLevel(0);

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

      const interval = setInterval(async () => {
        const status = await getRecordingStatus();
        if (status) {
          setRecordingDuration(status.durationMillis);
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

  // Cleanup auto-advance timer on unmount
  useEffect(() => {
    return () => {
      if (autoAdvanceRef.current) clearTimeout(autoAdvanceRef.current);
    };
  }, []);

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

  const getDisplayTextForLine = (line: Line): string => {
    if (userGender === "male" && line.text_ja_male) return line.text_ja_male;
    if (userGender === "female" && line.text_ja_female) return line.text_ja_female;
    return line.text_ja;
  };

  const getDisplayText = (): string => {
    if (!currentLine) return "";
    return getDisplayTextForLine(currentLine);
  };

  const speakText = (text: string) => {
    if (!text || isSpeaking) return;
    setIsSpeaking(true);
    Speech.speak(text, {
      language: "ja-JP",
      rate: 0.8,
      onDone: () => setIsSpeaking(false),
      onError: () => setIsSpeaking(false),
    });
  };

  const speakLine = () => {
    speakText(getDisplayText());
  };

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

  const handleStopRecording = async () => {
    try {
      setIsRecording(false);
      setPhase("processing");

      const result = await stopRecording();
      if (!result) {
        setPhase("viewing");
        return;
      }

      const sttResult = await transcribeAudio(result.uri);
      const expectedText = getDisplayText();
      const attemptResult = await session.submitAttempt(sttResult.text, expectedText);

      const newFeedback: FeedbackData = {
        accuracy: attemptResult.accuracy,
        userInput: sttResult.text,
        expectedText,
        feedback: attemptResult.feedback,
      };
      setFeedbackData(newFeedback);

      if (attemptResult.accuracy >= 0.8) {
        // Success: add user bubble to chat
        setMessages((prev) => [
          ...prev,
          {
            lineIndex: session.currentIndex,
            line: currentLine,
            displayText: getDisplayText(),
            feedbackData: { accuracy: attemptResult.accuracy, userInput: sttResult.text },
          },
        ]);
        setPhase("success");
        // Auto-advance after 1.5s
        autoAdvanceRef.current = setTimeout(() => handleNext(), 1500);
      } else {
        // Failure: don't add bubble, show feedback in footer
        setPhase("success");
      }
    } catch (error) {
      console.error("Processing error:", error);
      setPhase("viewing");
      Alert.alert("오류", "음성 처리 중 오류가 발생했습니다.");
    }
  };

  const handleNext = () => {
    if (autoAdvanceRef.current) {
      clearTimeout(autoAdvanceRef.current);
      autoAdvanceRef.current = null;
    }

    // Add current NPC line to messages if it's an NPC turn
    if (currentLine?.speaker === "npc") {
      setMessages((prev) => [
        ...prev,
        {
          lineIndex: session.currentIndex,
          line: currentLine,
          displayText: getDisplayTextForLine(currentLine),
        },
      ]);
    }

    setFeedbackData(null);
    setPhase("viewing");

    if (session.currentIndex < session.lines.length - 1) {
      session.moveNext();
    } else {
      handleComplete();
    }
  };

  const handleRetry = () => {
    if (autoAdvanceRef.current) {
      clearTimeout(autoAdvanceRef.current);
      autoAdvanceRef.current = null;
    }
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

  const formatRecordingTime = (millis: number): string => {
    const seconds = Math.floor(millis / 1000);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const Waveform = ({ level }: { level: number }) => {
    const bars = [0.3, 0.5, 0.7, 1, 0.8, 0.6, 0.4, 0.7, 1, 0.5, 0.3];
    return (
      <View style={styles.waveform}>
        {bars.map((baseHeight, i) => {
          const height = 4 + level * baseHeight * 16;
          return <View key={i} style={[styles.waveBar, { height }]} />;
        })}
      </View>
    );
  };

  const toggleTranslation = (lineIndex: number) => {
    setRevealedTranslations((prev) => {
      const next = new Set(prev);
      if (next.has(lineIndex)) next.delete(lineIndex);
      else next.add(lineIndex);
      return next;
    });
  };

  const toggleGrammar = (lineIndex: number) => {
    setExpandedGrammar((prev) => {
      const next = new Set(prev);
      if (next.has(lineIndex)) next.delete(lineIndex);
      else next.add(lineIndex);
      return next;
    });
  };

  // --- Render helpers ---

  const renderNpcBubble = (msg: ChatMessage, isActive: boolean = false) => {
    const key = isActive ? "active-npc" : `msg-${msg.lineIndex}`;
    const isRevealed = revealedTranslations.has(msg.lineIndex);
    const isGrammarOpen = expandedGrammar.has(msg.lineIndex);

    return (
      <View key={key} style={styles.npcBubbleWrapper}>
        <View style={styles.npcBubble}>
          {showPronunciation && msg.line.pronunciation_ko && (
            <Text style={styles.bubblePronunciation}>{msg.line.pronunciation_ko}</Text>
          )}
          <View style={styles.bubbleJapaneseRow}>
            <Text style={styles.bubbleJapanese}>{msg.displayText}</Text>
            <TouchableOpacity onPress={() => speakText(msg.displayText)}>
              <Text style={styles.bubbleSpeaker}>{isSpeaking ? "🔊" : "🔈"}</Text>
            </TouchableOpacity>
          </View>

          {/* Translation - blurred until tapped */}
          <TouchableOpacity
            style={styles.translationArea}
            onPress={() => toggleTranslation(msg.lineIndex)}
            activeOpacity={0.7}
          >
            {isRevealed ? (
              <Text style={styles.bubbleTranslation}>{msg.line.text_ko}</Text>
            ) : (
              <View style={styles.blurredTranslation}>
                <Text style={styles.blurredText}>터치하여 번역</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Grammar hint */}
          {msg.line.grammar_hint && (
            <TouchableOpacity
              onPress={() => toggleGrammar(msg.lineIndex)}
              style={styles.grammarToggle}
            >
              <Text style={styles.grammarToggleText}>💡 문법 팁</Text>
              {isGrammarOpen && (
                <Text style={styles.grammarContent}>{msg.line.grammar_hint}</Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  const renderUserBubble = (msg: ChatMessage) => {
    if (!msg.feedbackData) return null;
    const { accuracy, userInput } = msg.feedbackData;
    const pct = Math.round(accuracy * 100);
    const badgeColor = accuracy >= 0.8 ? colors.success : accuracy >= 0.5 ? colors.warning : colors.danger;

    return (
      <View key={`msg-${msg.lineIndex}`} style={styles.userBubbleWrapper}>
        <View style={styles.userBubble}>
          <Text style={styles.userBubbleText}>{userInput}</Text>
          <View style={[styles.accuracyBadge, { backgroundColor: badgeColor }]}>
            <Text style={styles.accuracyBadgeText}>✓ {pct}%</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderUserPlaceholder = () => (
    <View style={styles.userBubbleWrapper}>
      <View style={styles.placeholderBubble}>
        <Text style={styles.placeholderText}>답변을 생각해보세요...</Text>
      </View>
    </View>
  );

  const renderFooter = () => {
    if (!currentLine) return null;
    const isUserTurn = currentLine.speaker === "user";

    // NPC turn: show "next" button
    if (!isUserTurn && phase === "viewing") {
      return (
        <TouchableOpacity style={styles.footerNextButton} onPress={handleNext}>
          <Text style={styles.footerNextButtonText}>
            {session.currentIndex < session.lines.length - 1 ? "다음으로 넘어가기 →" : "완료하기 →"}
          </Text>
        </TouchableOpacity>
      );
    }

    // User turn
    if (isUserTurn) {
      if (phase === "success" && feedbackData) {
        if (feedbackData.accuracy >= 0.8) {
          // Auto-advancing
          return (
            <View style={styles.footerSuccess}>
              <Text style={styles.footerSuccessText}>
                잘했어요! {Math.round(feedbackData.accuracy * 100)}%
              </Text>
              <Text style={styles.footerAutoAdvance}>자동으로 넘어갑니다...</Text>
            </View>
          );
        } else {
          // Failed: show feedback + retry/next
          return (
            <View style={styles.footerFeedback}>
              <Text style={styles.footerFeedbackText}>{feedbackData.feedback}</Text>
              <View style={styles.footerFeedbackCompare}>
                <Text style={styles.footerCompareLabel}>내 발화:</Text>
                <Text style={styles.footerCompareText}>{feedbackData.userInput || "(인식 안됨)"}</Text>
              </View>
              <Text style={styles.footerAccuracy}>
                정확도: {Math.round(feedbackData.accuracy * 100)}%
              </Text>
              <View style={styles.footerButtons}>
                <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
                  <Text style={styles.retryButtonText}>다시 하기</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.skipButton} onPress={handleNext}>
                  <Text style={styles.skipButtonText}>
                    {session.currentIndex < session.lines.length - 1 ? "다음" : "완료"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        }
      }

      if (phase === "recording") {
        return (
          <TouchableOpacity
            style={styles.footerRecording}
            onPress={handleStopRecording}
            activeOpacity={0.8}
          >
            <Animated.View style={[styles.recordingGlow, { opacity: glowAnim }]} />
            <View style={styles.recordingInner}>
              <View style={styles.recordingDot} />
              <Text style={styles.recordingTime}>{formatRecordingTime(recordingDuration)}</Text>
            </View>
            <Waveform level={audioLevel} />
            <Text style={styles.recordingHint}>탭하여 완료</Text>
          </TouchableOpacity>
        );
      }

      if (phase === "processing") {
        return (
          <View style={styles.footerProcessing}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.processingText}>처리 중...</Text>
          </View>
        );
      }

      // Default: show target text + mic
      return (
        <View style={styles.footerUserTurn}>
          <Text style={styles.targetJapanese}>{getDisplayText()}</Text>
          {showPronunciation && currentLine.pronunciation_ko && (
            <Text style={styles.targetPronunciation}>{currentLine.pronunciation_ko}</Text>
          )}
          <Text style={styles.targetKorean}>"{currentLine.text_ko}"</Text>
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
        </View>
      );
    }

    return null;
  };

  // --- Main render ---

  if (session.loading || !currentLine) {
    return <LoadingScreen />;
  }

  const isUserTurn = currentLine.speaker === "user";

  // Build active NPC message (not yet in messages array)
  const activeNpcMsg: ChatMessage | null =
    currentLine.speaker === "npc"
      ? {
          lineIndex: session.currentIndex,
          line: currentLine,
          displayText: getDisplayText(),
        }
      : null;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleExit} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={styles.closeButton}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.situationTitle} numberOfLines={1}>
          {session.situation?.name_ko}
        </Text>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={[styles.pronToggle, showPronunciation && styles.pronToggleActive]}
            onPress={() => setShowPronunciation(!showPronunciation)}
          >
            <Text style={[styles.pronToggleText, showPronunciation && styles.pronToggleTextActive]}>
              あ한글
            </Text>
          </TouchableOpacity>
          <Text style={styles.progress}>
            {session.currentIndex + 1}/{session.lines.length}
          </Text>
        </View>
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

      {/* Chat Area */}
      <ScrollView
        ref={scrollRef}
        style={styles.chatArea}
        contentContainerStyle={styles.chatContent}
        showsVerticalScrollIndicator={false}
      >
        {messages.map((msg) =>
          msg.line.speaker === "npc"
            ? renderNpcBubble(msg)
            : renderUserBubble(msg)
        )}

        {/* Active line */}
        {activeNpcMsg && renderNpcBubble(activeNpcMsg, true)}
        {isUserTurn && phase !== "success" && renderUserPlaceholder()}
        {isUserTurn && phase === "success" && feedbackData && feedbackData.accuracy < 0.8 && renderUserPlaceholder()}
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>{renderFooter()}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  closeButton: {
    fontSize: 22,
    color: colors.textMuted,
    width: 32,
  },
  situationTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.textDark,
    flex: 1,
    textAlign: "center",
    marginHorizontal: 8,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  pronToggle: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: colors.border,
  },
  pronToggleActive: {
    backgroundColor: colors.primary,
  },
  pronToggleText: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.textMuted,
  },
  pronToggleTextActive: {
    color: colors.surface,
  },
  progress: {
    fontSize: 13,
    color: colors.textMuted,
    fontVariant: ["tabular-nums"],
  },
  progressBar: {
    height: 3,
    backgroundColor: colors.border,
    marginHorizontal: 16,
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: colors.primary,
  },

  // Chat area
  chatArea: {
    flex: 1,
  },
  chatContent: {
    padding: 16,
    paddingBottom: 8,
  },

  // NPC bubble
  npcBubbleWrapper: {
    alignItems: "flex-start",
    marginBottom: 12,
  },
  npcBubble: {
    minWidth: "60%",
    maxWidth: "80%",
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderTopLeftRadius: 4,
    padding: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  bubblePronunciation: {
    fontSize: 13,
    color: colors.primary,
    marginBottom: 4,
  },
  bubbleJapaneseRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  bubbleJapanese: {
    fontSize: 18,
    fontWeight: "500",
    color: colors.textDark,
    flex: 1,
    lineHeight: 26,
  },
  bubbleSpeaker: {
    fontSize: 18,
  },
  translationArea: {
    marginTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    paddingTop: 10,
  },
  bubbleTranslation: {
    fontSize: 14,
    color: colors.textMuted,
    lineHeight: 20,
  },
  blurredTranslation: {
    backgroundColor: colors.borderLight,
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  blurredText: {
    fontSize: 13,
    color: colors.textLight,
    textAlign: "center",
  },
  grammarToggle: {
    marginTop: 8,
  },
  grammarToggleText: {
    fontSize: 13,
    color: "#92400e",
    fontWeight: "500",
  },
  grammarContent: {
    fontSize: 13,
    color: "#78350f",
    lineHeight: 18,
    marginTop: 4,
    backgroundColor: "#fef3c7",
    borderRadius: 8,
    padding: 10,
  },

  // User bubble
  userBubbleWrapper: {
    alignItems: "flex-end",
    marginBottom: 12,
  },
  userBubble: {
    maxWidth: "80%",
    backgroundColor: colors.primary,
    borderRadius: 16,
    borderTopRightRadius: 4,
    padding: 14,
  },
  userBubbleText: {
    fontSize: 17,
    color: colors.surface,
    lineHeight: 24,
  },
  accuracyBadge: {
    alignSelf: "flex-end",
    marginTop: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  accuracyBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.surface,
  },

  // Placeholder
  placeholderBubble: {
    maxWidth: "80%",
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: colors.border,
    borderRadius: 16,
    borderTopRightRadius: 4,
    padding: 14,
    opacity: 0.6,
  },
  placeholderText: {
    fontSize: 14,
    color: colors.textLight,
    textAlign: "center",
  },

  // Footer
  footer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },

  // Footer - NPC turn next button
  footerNextButton: {
    backgroundColor: colors.primary,
    margin: 16,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  footerNextButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: colors.surface,
  },

  // Footer - User turn: target text + mic
  footerUserTurn: {
    alignItems: "center",
    padding: 16,
    gap: 6,
  },
  targetJapanese: {
    fontSize: 20,
    fontWeight: "600",
    color: colors.textDark,
    textAlign: "center",
  },
  targetPronunciation: {
    fontSize: 14,
    color: colors.primary,
  },
  targetKorean: {
    fontSize: 14,
    color: colors.textMuted,
    marginBottom: 8,
  },
  micButton: {
    alignItems: "center",
    gap: 8,
  },
  micIconContainer: {
    backgroundColor: colors.primary,
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 5,
  },
  micIcon: {
    fontSize: 28,
  },
  micText: {
    fontSize: 13,
    color: colors.textMuted,
    fontWeight: "500",
  },

  // Footer - Recording
  footerRecording: {
    alignItems: "center",
    padding: 16,
    gap: 12,
  },
  recordingGlow: {
    position: "absolute",
    top: 8,
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: colors.danger,
  },
  recordingInner: {
    backgroundColor: colors.textDark,
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.danger,
  },
  recordingTime: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.surface,
    fontVariant: ["tabular-nums"],
  },
  recordingHint: {
    fontSize: 12,
    color: colors.textLight,
  },
  waveform: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 20,
    gap: 3,
  },
  waveBar: {
    width: 3,
    backgroundColor: colors.primary,
    borderRadius: 1.5,
    minHeight: 4,
  },

  // Footer - Processing
  footerProcessing: {
    alignItems: "center",
    padding: 24,
    gap: 8,
  },
  processingText: {
    fontSize: 14,
    color: colors.textLight,
    fontWeight: "500",
  },

  // Footer - Success (auto-advance)
  footerSuccess: {
    alignItems: "center",
    padding: 20,
    gap: 4,
  },
  footerSuccessText: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.success,
  },
  footerAutoAdvance: {
    fontSize: 13,
    color: colors.textLight,
  },

  // Footer - Feedback (failed)
  footerFeedback: {
    padding: 16,
    alignItems: "center",
    gap: 8,
  },
  footerFeedbackText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textDark,
  },
  footerFeedbackCompare: {
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
  },
  footerCompareLabel: {
    fontSize: 13,
    color: colors.textLight,
  },
  footerCompareText: {
    fontSize: 14,
    color: colors.textMuted,
  },
  footerAccuracy: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: "600",
  },
  footerButtons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 4,
  },
  retryButton: {
    backgroundColor: colors.borderLight,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  retryButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.textMuted,
  },
  skipButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  skipButtonText: {
    fontSize: 15,
    fontWeight: "bold",
    color: colors.surface,
  },
});
