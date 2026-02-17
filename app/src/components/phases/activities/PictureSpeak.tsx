import React, { useState, useCallback, useEffect } from "react";
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
  npcPrompt: string; // NPC question TTS text (Japanese)
  situationEmoji: string;
  inputMode: SessionMode;
  onComplete: () => void;
}

export default function PictureSpeak({
  expression,
  npcPrompt,
  situationEmoji,
  inputMode,
  onComplete,
}: Props) {
  const [phase, setPhase] = useState<"prompt" | "respond" | "done">("prompt");
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Play NPC prompt on mount
  useEffect(() => {
    Speech.speak(npcPrompt, {
      language: "ja-JP",
      onDone: () => setPhase("respond"),
      onError: () => setPhase("respond"),
    });
  }, [npcPrompt]);

  const handleRecord = useCallback(async () => {
    if (isRecording) {
      setIsRecording(false);
      setIsProcessing(true);

      try {
        const result = await stopRecording();
        if (result) {
          await transcribeAudio(result.uri, expression.textJa);
          // For MVP, any response is accepted
          setPhase("done");
          setTimeout(onComplete, 600);
        } else {
          setPhase("respond");
        }
      } catch {
        // STT error — still advance
        setPhase("done");
        setTimeout(onComplete, 600);
      } finally {
        setIsProcessing(false);
      }
    } else {
      try {
        await startRecording();
        setIsRecording(true);
      } catch {
        // Permission error
      }
    }
  }, [isRecording, expression.textJa, onComplete]);

  const handleSilentSelect = useCallback(() => {
    setPhase("done");
    setTimeout(onComplete, 400);
  }, [onComplete]);

  return (
    <View style={styles.container}>
      {/* Situation emoji */}
      <Text style={styles.situationEmoji}>{situationEmoji}</Text>

      {/* Phase: NPC prompt playing */}
      {phase === "prompt" && (
        <View style={styles.center}>
          <Text style={styles.listening}>상대방이 말하고 있어요...</Text>
        </View>
      )}

      {/* Phase: user responds */}
      {phase === "respond" && (
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
                {isRecording ? "말하고 있어요..." : "대답해 보세요"}
              </Text>
            </>
          ) : (
            <>
              <Text style={styles.silentInstruction}>
                머릿속으로 대답해 보세요
              </Text>
              <TouchableOpacity
                style={styles.silentButton}
                onPress={handleSilentSelect}
              >
                <Text style={styles.silentButtonText}>했어요</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      )}

      {/* Phase: done */}
      {phase === "done" && (
        <View style={styles.center}>
          <Text style={styles.doneIcon}>✓</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  situationEmoji: {
    fontSize: 56,
    marginBottom: 24,
  },
  center: {
    alignItems: "center",
  },
  listening: {
    fontSize: 16,
    color: colors.textMuted,
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
  instruction: {
    fontSize: 16,
    color: colors.textMedium,
    fontWeight: "500",
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
  doneIcon: {
    fontSize: 48,
    color: colors.success,
    fontWeight: "700",
  },
});
