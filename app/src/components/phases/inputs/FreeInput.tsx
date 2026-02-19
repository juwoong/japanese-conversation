/**
 * FreeInput — Voice or text free input for experienced learners (visitCount >= 5).
 *
 * Voice mode: mic button -> record -> STT
 * Silent mode: TextInput field
 */

import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Animated,
  ActivityIndicator,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { colors, borderRadius } from "../../../constants/theme";
import {
  startRecording,
  stopRecording,
  getRecordingStatus,
} from "../../../lib/audio";
import { transcribeAudio, STTError } from "../../../lib/stt";
import type { SessionMode } from "../../../types";

interface FreeInputProps {
  expectedText: string;
  inputMode: SessionMode;
  onAnswer: (userText: string) => void;
}

export default function FreeInput({
  expectedText,
  inputMode,
  onAnswer,
}: FreeInputProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [textValue, setTextValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const glowAnim = useRef(new Animated.Value(0.4)).current;
  const silenceStartRef = useRef<number | null>(null);
  const hasSpokenRef = useRef(false);
  const autoStopRef = useRef(false);

  const SILENCE_THRESHOLD_DB = -45;
  const SILENCE_REQUIRED_MS = 900;

  useEffect(() => {
    if (!isRecording) return;
    silenceStartRef.current = null;
    hasSpokenRef.current = false;

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
      if (status?.metering !== undefined) {
        const normalized = Math.max(
          0,
          Math.min(1, (status.metering + 60) / 60)
        );
        setAudioLevel(normalized);

        const isSilent = status.metering < SILENCE_THRESHOLD_DB;
        if (!isSilent) {
          hasSpokenRef.current = true;
          silenceStartRef.current = null;
        } else if (hasSpokenRef.current) {
          if (!silenceStartRef.current) {
            silenceStartRef.current = Date.now();
          } else if (
            !autoStopRef.current &&
            Date.now() - silenceStartRef.current >= SILENCE_REQUIRED_MS
          ) {
            autoStopRef.current = true;
            handleStopRecording();
          }
        }
      }
    }, 100);

    return () => {
      glowAnimation.stop();
      glowAnim.setValue(0.4);
      clearInterval(interval);
    };
  }, [isRecording]);

  const handleStartRecording = async () => {
    try {
      setError(null);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      autoStopRef.current = false;
      silenceStartRef.current = null;
      hasSpokenRef.current = false;
      await startRecording();
      setIsRecording(true);
    } catch {
      setError("녹음을 시작할 수 없습니다.");
    }
  };

  const handleStopRecording = async () => {
    if (!isRecording) return;
    autoStopRef.current = true;
    setIsRecording(false);
    setIsProcessing(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    try {
      const result = await stopRecording();
      if (!result || result.duration < 200) {
        setIsProcessing(false);
        setError("말씀이 짧습니다. 다시 눌러 말해보세요.");
        return;
      }

      const sttResult = await transcribeAudio(result.uri, expectedText);
      setIsProcessing(false);
      onAnswer(sttResult.text);
    } catch (err) {
      setIsProcessing(false);
      if (err instanceof STTError) {
        setError(err.userMessage);
      } else {
        setError("음성 인식 중 오류가 발생했습니다.");
      }
    }
  };

  const handleTextSubmit = () => {
    const trimmed = textValue.trim();
    if (!trimmed) return;
    onAnswer(trimmed);
    setTextValue("");
  };

  if (inputMode === "silent") {
    return (
      <View style={styles.container}>
        <View style={styles.textInputRow}>
          <TextInput
            style={styles.textInput}
            value={textValue}
            onChangeText={setTextValue}
            placeholder="일본어로 입력하세요..."
            placeholderTextColor={colors.textLight}
            returnKeyType="send"
            onSubmitEditing={handleTextSubmit}
            autoCorrect={false}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              !textValue.trim() && styles.sendButtonDisabled,
            ]}
            onPress={handleTextSubmit}
            disabled={!textValue.trim()}
          >
            <MaterialIcons
              name="send"
              size={20}
              color={textValue.trim() ? colors.surface : colors.textLight}
            />
          </TouchableOpacity>
        </View>
        {error && <Text style={styles.errorText}>{error}</Text>}
      </View>
    );
  }

  // Voice mode
  return (
    <View style={styles.container}>
      {isProcessing ? (
        <View style={styles.processingContainer}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={styles.processingText}>처리 중...</Text>
        </View>
      ) : isRecording ? (
        <TouchableOpacity
          style={styles.recordingContainer}
          onPress={handleStopRecording}
          activeOpacity={0.8}
        >
          <Animated.View
            style={[styles.recordingGlow, { opacity: glowAnim }]}
          />
          <View style={styles.recordingInner}>
            <View style={styles.recordingDot} />
          </View>
          <Text style={styles.recordingHint}>말이 끝나면 자동으로 인식됩니다</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={styles.micButton}
          onPress={handleStartRecording}
          activeOpacity={0.8}
        >
          <View style={styles.micIconContainer}>
            <MaterialIcons name="mic" size={28} color={colors.surface} />
          </View>
          <Text style={styles.micText}>음성으로 답하기</Text>
        </TouchableOpacity>
      )}
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    alignItems: "flex-end",
    paddingHorizontal: 16,
    gap: 8,
  },
  // Voice mode
  micButton: {
    alignItems: "center",
    gap: 8,
  },
  micIconContainer: {
    backgroundColor: colors.primary,
    width: 56,
    height: 56,
    borderRadius: 28,
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
  recordingContainer: {
    alignItems: "center",
    gap: 8,
  },
  recordingGlow: {
    position: "absolute",
    top: -4,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.danger,
  },
  recordingInner: {
    backgroundColor: colors.textDark,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.danger,
  },
  recordingHint: {
    fontSize: 12,
    color: colors.textLight,
  },
  processingContainer: {
    alignItems: "center",
    gap: 8,
    padding: 16,
  },
  processingText: {
    fontSize: 14,
    color: colors.textLight,
    fontWeight: "500",
  },
  // Silent mode
  textInputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    width: "100%",
  },
  textInput: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: colors.textDark,
  },
  sendButton: {
    backgroundColor: colors.primary,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  sendButtonDisabled: {
    backgroundColor: colors.border,
  },
  errorText: {
    fontSize: 13,
    color: colors.danger,
    textAlign: "center",
  },
});
