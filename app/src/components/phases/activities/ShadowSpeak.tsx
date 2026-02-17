import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import * as Speech from "expo-speech";
import { colors, borderRadius } from "../../../constants/theme";
import { startRecording, stopRecording } from "../../../lib/audio";
import { transcribeAudio } from "../../../lib/stt";
import type { KeyExpression, SessionMode } from "../../../types";

interface Props {
  expression: KeyExpression;
  inputMode: SessionMode;
  onComplete: () => void;
}

/** Normalize Japanese text for comparison (strip punctuation/whitespace) */
function normalize(text: string): string {
  return text
    .replace(/[\s\u3000。、！？!?.,\-~～…「」『』（）()]/g, "")
    .toLowerCase();
}

function calcAccuracy(expected: string, actual: string): number {
  const e = normalize(expected);
  const a = normalize(actual);
  if (e.length === 0) return 0;

  let matches = 0;
  for (let i = 0; i < e.length; i++) {
    if (a.includes(e[i])) matches++;
  }
  return Math.round((matches / e.length) * 100);
}

export default function ShadowSpeak({ expression, inputMode, onComplete }: Props) {
  const [phase, setPhase] = useState<"listen" | "record" | "result">("listen");
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const playTTS = useCallback(() => {
    setIsSpeaking(true);
    Speech.speak(expression.textJa, {
      language: "ja-JP",
      onDone: () => {
        setIsSpeaking(false);
        setPhase("record");
      },
      onError: () => {
        setIsSpeaking(false);
        setPhase("record");
      },
    });
  }, [expression.textJa]);

  const handleRecord = useCallback(async () => {
    if (isRecording) {
      // Stop recording
      setIsRecording(false);
      setIsProcessing(true);

      try {
        const result = await stopRecording();
        if (result) {
          const sttResult = await transcribeAudio(result.uri, expression.textJa);
          const acc = calcAccuracy(expression.textJa, sttResult.text);
          setAccuracy(acc);
          setPhase("result");

          if (acc >= 70) {
            setTimeout(onComplete, 800);
          }
        } else {
          setPhase("record");
        }
      } catch {
        setPhase("record");
      } finally {
        setIsProcessing(false);
      }
    } else {
      // Start recording
      try {
        await startRecording();
        setIsRecording(true);
      } catch {
        // Permission denied or error
      }
    }
  }, [isRecording, expression.textJa, onComplete]);

  const handleSilentMode = useCallback(() => {
    // Play the correct answer, then proceed
    Speech.speak(expression.textJa, {
      language: "ja-JP",
      onDone: () => { setTimeout(onComplete, 400); },
      onError: () => { setTimeout(onComplete, 400); },
    });
  }, [expression.textJa, onComplete]);

  return (
    <View style={styles.container}>
      {/* Listen phase */}
      {phase === "listen" && (
        <View style={styles.center}>
          <TouchableOpacity style={styles.listenButton} onPress={playTTS}>
            <Text style={styles.listenIcon}>{isSpeaking ? "🔊" : "🔈"}</Text>
          </TouchableOpacity>
          <Text style={styles.instruction}>먼저 들어보세요</Text>
        </View>
      )}

      {/* Record phase */}
      {phase === "record" && (
        <View style={styles.center}>
          {inputMode === "voice" ? (
            <>
              {isProcessing ? (
                <ActivityIndicator size="large" color={colors.primary} />
              ) : (
                <TouchableOpacity
                  style={[
                    styles.recordButton,
                    isRecording && styles.recordButtonActive,
                  ]}
                  onPress={handleRecord}
                >
                  <Text style={styles.recordIcon}>
                    {isRecording ? "⏹" : "🎙"}
                  </Text>
                </TouchableOpacity>
              )}
              <Text style={styles.instruction}>
                {isRecording ? "말하고 있어요..." : "따라 말해보세요"}
              </Text>
            </>
          ) : (
            <>
              <Text style={styles.silentInstruction}>
                머릿속으로 따라 해보세요
              </Text>
              <TouchableOpacity
                style={styles.silentButton}
                onPress={handleSilentMode}
              >
                <Text style={styles.silentButtonText}>했어요</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      )}

      {/* Result phase */}
      {phase === "result" && accuracy !== null && (
        <View style={styles.center}>
          <Text style={styles.resultIcon}>
            {accuracy >= 70 ? "✓" : "🔁"}
          </Text>
          <Text style={styles.accuracyLabel}>
            {accuracy >= 70 ? "좋아요, 넘어갈게요" : "한번 더 들어볼까요?"}
          </Text>
          {accuracy < 70 && (
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => setPhase("listen")}
            >
              <Text style={styles.retryText}>다시 듣기</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  center: {
    alignItems: "center",
  },
  listenButton: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  listenIcon: {
    fontSize: 40,
  },
  instruction: {
    fontSize: 16,
    color: colors.textMedium,
    fontWeight: "500",
  },
  recordButton: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.surface,
    borderWidth: 3,
    borderColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  recordButtonActive: {
    backgroundColor: colors.dangerLight,
    borderColor: colors.danger,
  },
  recordIcon: {
    fontSize: 40,
  },
  silentInstruction: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.textDark,
    marginBottom: 24,
    textAlign: "center",
  },
  silentButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: 14,
    paddingHorizontal: 40,
  },
  silentButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  resultIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  accuracyLabel: {
    fontSize: 16,
    color: colors.textMedium,
    fontWeight: "500",
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: colors.backgroundAlt,
    borderRadius: borderRadius.md,
    paddingVertical: 12,
    paddingHorizontal: 32,
  },
  retryText: {
    fontSize: 15,
    fontWeight: "500",
    color: colors.textMedium,
  },
});
