import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Animated,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Speech from "expo-speech";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { supabase } from "../lib/supabase";
import { Audio } from "expo-av";
import * as Haptics from "expo-haptics";
import { startRecording, stopRecording, getRecordingStatus } from "../lib/audio";
import { transcribeAudio, STTError } from "../lib/stt";
import { useSession } from "../hooks/useSession";
import { saveSessionProgress } from "../lib/sessionProgress";
import type { RootStackParamList, Line } from "../types";
import type { DiffSegment } from "../lib/textDiff";
import { colors } from "../constants/theme";
import { MaterialIcons } from "@expo/vector-icons";
import LoadingScreen from "../components/LoadingScreen";
import NpcBubble from "../components/NpcBubble";
import UserBubble from "../components/UserBubble";
import FuriganaText from "../components/FuriganaText";

type Props = NativeStackScreenProps<RootStackParamList, "Session">;

type SessionPhase = "viewing" | "recording" | "processing" | "success";

interface FeedbackData {
  accuracy: number;
  userInput: string;
  expectedText: string;
  feedback: string;
  diffSegments: DiffSegment[];
}

interface ChatMessage {
  lineIndex: number;
  line: Line;
  displayText: string;
  feedbackData?: { accuracy: number; userInput: string; diffSegments?: DiffSegment[] };
}

export default function SessionScreen({ navigation, route }: Props) {
  const { situationId, isReview } = route.params;
  const session = useSession(situationId);

  const [showPronunciation, setShowPronunciation] = useState(true);
  const [userGender, setUserGender] = useState<string>("neutral");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [ttsSpeed, setTtsSpeed] = useState(0.8);

  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [revealedTranslations, setRevealedTranslations] = useState<Set<number>>(new Set());
  const [expandedGrammar, setExpandedGrammar] = useState<Set<number>>(new Set());
  const scrollRef = useRef<ScrollView>(null);
  const autoAdvanceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const recordingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const silenceStartRef = useRef<number | null>(null);
  const hasSpokenRef = useRef(false);
  const RECORDING_TIMEOUT_MS = 30000; // 30 seconds
  const SILENCE_THRESHOLD = -45; // dBFS — below this = silence
  const SILENCE_DURATION_MS = 1500; // 1.5s of silence after speech → auto stop

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
    AsyncStorage.getItem("@tts_speed").then((v) => {
      if (v) setTtsSpeed(parseFloat(v));
    });
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

      silenceStartRef.current = null;
      hasSpokenRef.current = false;

      const interval = setInterval(async () => {
        const status = await getRecordingStatus();
        if (status) {
          setRecordingDuration(status.durationMillis);
          if (status.metering !== undefined) {
            const normalized = Math.max(0, Math.min(1, (status.metering + 60) / 60));
            setAudioLevel(normalized);

            // Silence detection: auto-stop after speech + pause
            const isSilent = status.metering < SILENCE_THRESHOLD;
            if (!isSilent) {
              hasSpokenRef.current = true;
              silenceStartRef.current = null;
            } else if (hasSpokenRef.current) {
              if (!silenceStartRef.current) {
                silenceStartRef.current = Date.now();
              } else if (Date.now() - silenceStartRef.current >= SILENCE_DURATION_MS) {
                handleStopRecording();
              }
            }
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

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (autoAdvanceRef.current) clearTimeout(autoAdvanceRef.current);
      if (recordingTimeoutRef.current) clearTimeout(recordingTimeoutRef.current);
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

  const [ttsError, setTtsError] = useState(false);

  const speakText = (text: string) => {
    if (!text || isSpeaking) return;
    setIsSpeaking(true);
    setTtsError(false);
    Speech.speak(text, {
      language: "ja-JP",
      rate: ttsSpeed,
      onDone: () => setIsSpeaking(false),
      onError: () => {
        setIsSpeaking(false);
        setTtsError(true);
        // Auto-hide error after 3 seconds
        setTimeout(() => setTtsError(false), 3000);
      },
    });
  };

  const speakLine = () => {
    speakText(getDisplayText());
  };

  const handleStartRecording = async () => {
    try {
      // Check microphone permission first
      const { status } = await Audio.getPermissionsAsync();
      if (status !== "granted") {
        const { status: newStatus } = await Audio.requestPermissionsAsync();
        if (newStatus !== "granted") {
          Alert.alert(
            "마이크 권한 필요",
            "음성 녹음을 위해 마이크 권한이 필요합니다. 설정에서 권한을 허용해주세요.",
            [{ text: "확인" }]
          );
          return;
        }
      }

      // Haptic feedback on start
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      setIsRecording(true);
      setPhase("recording");
      await startRecording();

      // Set recording timeout (no stale closure check — ref-based phase handles it)
      recordingTimeoutRef.current = setTimeout(() => {
        handleStopRecording();
      }, RECORDING_TIMEOUT_MS);
    } catch (error) {
      console.error("Recording error:", error);
      setIsRecording(false);
      setPhase("viewing");
      Alert.alert("오류", "녹음을 시작할 수 없습니다.");
    }
  };

  const handleStopRecording = async () => {
    // Clear recording timeout
    if (recordingTimeoutRef.current) {
      clearTimeout(recordingTimeoutRef.current);
      recordingTimeoutRef.current = null;
    }

    // Haptic feedback on stop
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    try {
      setIsRecording(false);
      setPhase("processing");

      const result = await stopRecording();
      if (!result) {
        setPhase("viewing");
        return;
      }

      // Whisper requires minimum 0.1s audio
      if (result.duration < 200) {
        setPhase("viewing");
        return;
      }

      const expectedText = getDisplayText();
      const sttResult = await transcribeAudio(result.uri, expectedText);
      const attemptResult = await session.submitAttempt(sttResult.text, expectedText);

      const newFeedback: FeedbackData = {
        accuracy: attemptResult.accuracy,
        userInput: sttResult.text,
        expectedText,
        feedback: attemptResult.feedback,
        diffSegments: attemptResult.diffSegments,
      };
      setFeedbackData(newFeedback);

      if (attemptResult.accuracy >= 0.8) {
        // Success: add user bubble to chat (deduplicate by lineIndex)
        setMessages((prev) => {
          if (prev.some((m) => m.lineIndex === session.currentIndex && m.feedbackData)) return prev;
          return [
            ...prev,
            {
              lineIndex: session.currentIndex,
              line: currentLine,
              displayText: getDisplayText(),
              feedbackData: {
                accuracy: attemptResult.accuracy,
                userInput: sttResult.text,
                diffSegments: attemptResult.diffSegments,
              },
            },
          ];
        });
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

      if (error instanceof STTError) {
        Alert.alert("음성 인식 실패", error.userMessage);
      } else {
        Alert.alert("오류", "음성 처리 중 오류가 발생했습니다.");
      }
    }
  };

  const handleNext = () => {
    if (autoAdvanceRef.current) {
      clearTimeout(autoAdvanceRef.current);
      autoAdvanceRef.current = null;
    }

    // Add current NPC line to messages if it's an NPC turn (deduplicate by lineIndex)
    if (currentLine?.speaker === "npc") {
      setMessages((prev) => {
        if (prev.some((m) => m.lineIndex === session.currentIndex && !m.feedbackData)) return prev;
        return [
          ...prev,
          {
            lineIndex: session.currentIndex,
            line: currentLine,
            displayText: getDisplayTextForLine(currentLine),
          },
        ];
      });
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

  const [showCompletion, setShowCompletion] = useState(false);
  const [completionStats, setCompletionStats] = useState({
    totalLines: 0,
    userLines: 0,
    avgAccuracy: 0,
    learnedExpressions: [] as string[],
  });
  const completionFadeAnim = useRef(new Animated.Value(0)).current;
  const completionScaleAnim = useRef(new Animated.Value(0.9)).current;
  const emojiBounceAnim = useRef(new Animated.Value(0)).current;

  const handleComplete = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const attemptAccuracies = messages
      .filter((m) => m.feedbackData)
      .map((m) => m.feedbackData!.accuracy);

    // Save progress via extracted function (try-catch inside)
    const result = await saveSessionProgress({
      userId: user.id,
      situationId,
      personaId: session.situation?.persona_id ?? 0,
      sortOrder: session.situation?.sort_order ?? 0,
      accuracies: attemptAccuracies,
      isReview: isReview ?? false,
    });

    if (!result.success) {
      Alert.alert("저장 오류", "진행 상황 저장에 실패했습니다. 학습 기록은 다음에 다시 시도됩니다.");
    }

    // Gather completion stats
    const userLines = session.lines.filter((l) => l.speaker === "user");
    const avg = attemptAccuracies.length > 0
      ? attemptAccuracies.reduce((a, b) => a + b, 0) / attemptAccuracies.length
      : 0;

    setCompletionStats({
      totalLines: session.lines.length,
      userLines: userLines.length,
      avgAccuracy: avg,
      learnedExpressions: userLines.slice(0, 3).map((l) => l.text_ja),
    });
    setShowCompletion(true);

    // Animate completion screen entrance
    Animated.parallel([
      Animated.timing(completionFadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(completionScaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    // Bounce emoji animation
    Animated.sequence([
      Animated.delay(200),
      Animated.spring(emojiBounceAnim, {
        toValue: 1,
        friction: 3,
        tension: 150,
        useNativeDriver: true,
      }),
    ]).start();
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

  const renderNpcBubbleItem = (msg: ChatMessage, isActive: boolean = false) => {
    const key = isActive ? "active-npc" : `msg-${msg.lineIndex}`;
    return (
      <NpcBubble
        key={key}
        displayText={msg.displayText}
        line={msg.line}
        lineIndex={msg.lineIndex}
        showPronunciation={showPronunciation}
        isSpeaking={isSpeaking}
        isRevealed={revealedTranslations.has(msg.lineIndex)}
        isGrammarOpen={expandedGrammar.has(msg.lineIndex)}
        onSpeak={speakText}
        onToggleTranslation={toggleTranslation}
        onToggleGrammar={toggleGrammar}
      />
    );
  };

  const renderUserBubbleItem = (msg: ChatMessage) => {
    if (!msg.feedbackData) return null;
    return (
      <UserBubble
        key={`msg-${msg.lineIndex}`}
        userInput={msg.feedbackData.userInput}
        accuracy={msg.feedbackData.accuracy}
        diffSegments={msg.feedbackData.diffSegments}
      />
    );
  };

  const renderUserPlaceholder = () => (
    <View style={styles.placeholderWrapper}>
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
          {currentLine.furigana && currentLine.furigana.length > 0 ? (
            <FuriganaText
              segments={currentLine.furigana}
              fontSize={20}
              color={colors.textDark}
            />
          ) : (
            <Text style={styles.targetJapanese}>{getDisplayText()}</Text>
          )}
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
              <MaterialIcons name="mic" size={28} color={colors.surface} />
            </View>
            <Text style={styles.micText}>탭하여 말하기</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return null;
  };

  // --- Main render ---

  if (showCompletion) {
    const pct = Math.round(completionStats.avgAccuracy * 100);
    return (
      <SafeAreaView style={styles.container}>
        <Animated.ScrollView
          contentContainerStyle={styles.completionContainer}
          style={{
            opacity: completionFadeAnim,
            transform: [{ scale: completionScaleAnim }],
          }}
        >
          <Animated.View
            style={[
              styles.completionIconContainer,
              {
                transform: [
                  {
                    scale: emojiBounceAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.3, 1],
                    }),
                  },
                ],
              },
            ]}
          >
            <MaterialIcons
              name={pct >= 80 ? "celebration" : pct >= 50 ? "thumb-up" : "fitness-center"}
              size={48}
              color={colors.primary}
            />
          </Animated.View>
          <Text style={styles.completionTitle}>
            {isReview ? "복습 완료!" : "학습 완료!"}
          </Text>
          <Text style={styles.completionSituation}>
            {session.situation?.name_ko}
          </Text>

          {/* Stats */}
          <View style={styles.completionStats}>
            <View style={styles.completionStat}>
              <Text style={styles.completionStatValue}>{completionStats.totalLines}</Text>
              <Text style={styles.completionStatLabel}>대사</Text>
            </View>
            <View style={styles.completionStatDivider} />
            <View style={styles.completionStat}>
              <Text style={styles.completionStatValue}>{completionStats.userLines}</Text>
              <Text style={styles.completionStatLabel}>연습</Text>
            </View>
            <View style={styles.completionStatDivider} />
            <View style={styles.completionStat}>
              <Text style={[
                styles.completionStatValue,
                { color: pct >= 80 ? colors.success : pct >= 50 ? colors.warning : colors.danger },
              ]}>
                {pct}%
              </Text>
              <Text style={styles.completionStatLabel}>정확도</Text>
            </View>
          </View>

          {/* Learned expressions */}
          {completionStats.learnedExpressions.length > 0 && (
            <View style={styles.completionExpressions}>
              <Text style={styles.completionExpTitle}>배운 표현</Text>
              {completionStats.learnedExpressions.map((expr, i) => (
                <Text key={i} style={styles.completionExpr}>• {expr}</Text>
              ))}
            </View>
          )}

          <TouchableOpacity
            style={styles.completionButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.completionButtonText}>확인</Text>
          </TouchableOpacity>
        </Animated.ScrollView>
      </SafeAreaView>
    );
  }

  if (session.loading) {
    return <LoadingScreen />;
  }

  if (session.error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <MaterialIcons name="error-outline" size={48} color={colors.textLight} />
          <Text style={styles.errorText}>{session.error}</Text>
          <TouchableOpacity style={styles.errorButton} onPress={() => navigation.goBack()}>
            <Text style={styles.errorButtonText}>돌아가기</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (session.lines.length === 0 || !currentLine) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <MaterialIcons name="inbox" size={48} color={colors.textLight} />
          <Text style={styles.errorText}>이 상황에 대사가 없습니다.</Text>
          <TouchableOpacity style={styles.errorButton} onPress={() => navigation.goBack()}>
            <Text style={styles.errorButtonText}>돌아가기</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
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
          <MaterialIcons name="close" size={24} color={colors.textMuted} />
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

      {/* TTS Error Banner */}
      {ttsError && (
        <View style={styles.ttsErrorBanner}>
          <Text style={styles.ttsErrorText}>음성 재생에 실패했습니다</Text>
        </View>
      )}

      {/* Chat Area */}
      <ScrollView
        ref={scrollRef}
        style={styles.chatArea}
        contentContainerStyle={styles.chatContent}
        showsVerticalScrollIndicator={false}
      >
        {messages.map((msg) =>
          msg.line.speaker === "npc"
            ? renderNpcBubbleItem(msg)
            : renderUserBubbleItem(msg)
        )}

        {/* Active line */}
        {activeNpcMsg && renderNpcBubbleItem(activeNpcMsg, true)}
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
  ttsErrorBanner: {
    backgroundColor: colors.warningLight,
    paddingVertical: 6,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  ttsErrorText: {
    color: colors.warning,
    fontSize: 12,
    fontWeight: "500",
  },

  // Chat area
  chatArea: {
    flex: 1,
  },
  chatContent: {
    padding: 16,
    paddingBottom: 8,
  },

  // Placeholder
  placeholderWrapper: {
    alignItems: "flex-end" as const,
    marginBottom: 12,
  },
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
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 5,
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

  // Completion screen
  completionContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  completionIconContainer: {
    marginBottom: 16,
  },
  completionTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: colors.textDark,
    marginBottom: 4,
  },
  completionSituation: {
    fontSize: 16,
    color: colors.textMuted,
    marginBottom: 32,
  },
  completionStats: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    width: "100%",
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.border,
  },
  completionStat: {
    flex: 1,
    alignItems: "center",
  },
  completionStatValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: colors.textDark,
  },
  completionStatLabel: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 4,
  },
  completionStatDivider: {
    width: 1,
    backgroundColor: colors.border,
  },
  completionExpressions: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    width: "100%",
    marginBottom: 32,
    borderWidth: 1,
    borderColor: colors.border,
  },
  completionExpTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textMuted,
    marginBottom: 12,
  },
  completionExpr: {
    fontSize: 16,
    color: colors.textDark,
    lineHeight: 28,
  },
  completionButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 48,
    paddingVertical: 16,
    borderRadius: 14,
  },
  completionButtonText: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.surface,
  },

  // Error state
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  errorText: {
    fontSize: 16,
    color: colors.textMuted,
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 24,
  },
  errorButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  errorButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: colors.surface,
  },
});
