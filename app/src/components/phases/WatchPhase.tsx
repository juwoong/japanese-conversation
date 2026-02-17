/**
 * Phase 1 — Watch (관찰)
 *
 * The user watches the model dialogue auto-play with TTS.
 * - Lines appear one at a time with sequential TTS
 * - Key expressions (user lines) are highlighted
 * - Tap any line to re-play its TTS
 * - [Korean translation] button shows translations for 3 seconds then fades
 * - [Next] button activates after all lines have played
 */

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
} from "react-native";
import * as Speech from "expo-speech";
import { MaterialIcons } from "@expo/vector-icons";
import { colors } from "../../constants/theme";
import FuriganaText from "../FuriganaText";
import type { ModelLine, SessionMode } from "../../types";

interface WatchPhaseProps {
  modelDialogue: ModelLine[];
  inputMode: SessionMode;
  onComplete: () => void;
}

export default function WatchPhase({
  modelDialogue,
  inputMode,
  onComplete,
}: WatchPhaseProps) {
  // Which lines have been revealed so far
  const [revealedCount, setRevealedCount] = useState(0);
  // Which line is currently speaking
  const [speakingIndex, setSpeakingIndex] = useState<number | null>(null);
  // Whether all lines have finished initial playback
  const [allPlayed, setAllPlayed] = useState(false);
  // Korean translation visibility
  const [showKorean, setShowKorean] = useState(false);
  const koreanOpacity = useRef(new Animated.Value(0)).current;
  const koreanTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Phase transition animation
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scrollRef = useRef<ScrollView>(null);
  // Track if auto-play sequence is running
  const autoPlayingRef = useRef(false);

  // Fade in on mount
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, []);

  // Start auto-play sequence when dialogue loads
  useEffect(() => {
    if (modelDialogue.length > 0 && revealedCount === 0) {
      autoPlayingRef.current = true;
      playNextLine(0);
    }
  }, [modelDialogue.length]);

  // Scroll to bottom when new lines are revealed
  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }, [revealedCount]);

  const playNextLine = useCallback(
    (index: number) => {
      if (index >= modelDialogue.length) {
        setAllPlayed(true);
        autoPlayingRef.current = false;
        return;
      }

      // Reveal this line
      setRevealedCount(index + 1);

      const line = modelDialogue[index];

      if (inputMode === "silent") {
        // In silent mode, skip TTS but still auto-advance
        setSpeakingIndex(index);
        setTimeout(() => {
          setSpeakingIndex(null);
          setTimeout(() => playNextLine(index + 1), 500);
        }, 1500);
        return;
      }

      // Play TTS for this line
      setSpeakingIndex(index);
      Speech.speak(line.textJa, {
        language: "ja-JP",
        rate: 0.8,
        onDone: () => {
          setSpeakingIndex(null);
          // Wait 500ms then play next line
          setTimeout(() => playNextLine(index + 1), 500);
        },
        onError: () => {
          setSpeakingIndex(null);
          // Continue even on error
          setTimeout(() => playNextLine(index + 1), 500);
        },
      });
    },
    [modelDialogue, inputMode]
  );

  const handleTapLine = useCallback(
    (index: number) => {
      // Don't interrupt auto-play sequence
      if (autoPlayingRef.current) return;
      if (speakingIndex !== null) return;
      if (inputMode === "silent") return;

      const line = modelDialogue[index];
      setSpeakingIndex(index);
      Speech.speak(line.textJa, {
        language: "ja-JP",
        rate: 0.8,
        onDone: () => setSpeakingIndex(null),
        onError: () => setSpeakingIndex(null),
      });
    },
    [modelDialogue, speakingIndex, inputMode]
  );

  const handleShowKorean = useCallback(() => {
    // Clear any existing timer
    if (koreanTimerRef.current) {
      clearTimeout(koreanTimerRef.current);
    }

    setShowKorean(true);
    // Fade in
    Animated.timing(koreanOpacity, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();

    // After 3 seconds, fade out
    koreanTimerRef.current = setTimeout(() => {
      Animated.timing(koreanOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setShowKorean(false);
      });
    }, 3000);
  }, [koreanOpacity]);

  // Cleanup
  useEffect(() => {
    return () => {
      Speech.stop();
      if (koreanTimerRef.current) clearTimeout(koreanTimerRef.current);
    };
  }, []);

  const renderLine = (line: ModelLine, index: number) => {
    const isNpc = line.speaker === "npc";
    const isSpeaking = speakingIndex === index;
    const isKey = line.isKeyExpression;

    return (
      <TouchableOpacity
        key={index}
        style={[
          styles.lineWrapper,
          isNpc ? styles.lineLeft : styles.lineRight,
        ]}
        onPress={() => handleTapLine(index)}
        activeOpacity={0.7}
      >
        <View
          style={[
            styles.bubble,
            isNpc ? styles.npcBubble : styles.userBubble,
            isKey && styles.keyBubble,
            isSpeaking && styles.speakingBubble,
          ]}
        >
          {/* Speaker label */}
          <Text style={[styles.speakerLabel, !isNpc && styles.userSpeakerLabel]}>
            {isNpc ? "NPC" : "You"}
          </Text>

          {/* Japanese text with furigana */}
          {line.furigana && line.furigana.length > 0 ? (
            <FuriganaText
              segments={line.furigana}
              fontSize={17}
              color={isNpc ? colors.textDark : colors.surface}
              showReading={true}
            />
          ) : (
            <Text
              style={[
                styles.jaText,
                !isNpc && styles.userJaText,
              ]}
            >
              {line.textJa}
            </Text>
          )}

          {/* Korean translation (animated fade) */}
          {showKorean && (
            <Animated.Text
              style={[
                styles.koText,
                !isNpc && styles.userKoText,
                { opacity: koreanOpacity },
              ]}
            >
              {line.textKo}
            </Animated.Text>
          )}

          {/* Speaking indicator */}
          {isSpeaking && (
            <View style={styles.speakingIndicator}>
              <MaterialIcons
                name="volume-up"
                size={14}
                color={isNpc ? colors.primary : colors.surface}
              />
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      {/* Dialogue area */}
      <ScrollView
        ref={scrollRef}
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {modelDialogue.slice(0, revealedCount).map((line, i) => renderLine(line, i))}
      </ScrollView>

      {/* Bottom controls */}
      <View style={styles.controls}>
        <TouchableOpacity
          style={styles.koreanButton}
          onPress={handleShowKorean}
          activeOpacity={0.7}
        >
          <Text style={styles.koreanButtonText}>
            {String.fromCodePoint(0x1F4AC)} {""}
          </Text>
          <Text style={styles.koreanButtonLabel}>
            {showKorean ? "표시 중..." : "한국어로 보기"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.nextButton,
            !allPlayed && styles.nextButtonDisabled,
          ]}
          onPress={allPlayed ? onComplete : undefined}
          activeOpacity={allPlayed ? 0.8 : 1}
        >
          <Text
            style={[
              styles.nextButtonText,
              !allPlayed && styles.nextButtonTextDisabled,
            ]}
          >
            {allPlayed ? "다음으로 \u2192" : "재생 중..."}
          </Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 8,
  },

  // Line layout
  lineWrapper: {
    marginBottom: 10,
  },
  lineLeft: {
    alignItems: "flex-start",
  },
  lineRight: {
    alignItems: "flex-end",
  },

  // Bubble styles
  bubble: {
    maxWidth: "82%",
    borderRadius: 16,
    padding: 14,
  },
  npcBubble: {
    backgroundColor: colors.npcBubble,
    borderTopLeftRadius: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  userBubble: {
    backgroundColor: colors.primary,
    borderTopRightRadius: 4,
  },
  keyBubble: {
    // Subtle highlight for key expressions
    backgroundColor: `${colors.primary}26`, // 0.15 opacity
    borderWidth: 1,
    borderColor: `${colors.primary}40`,
    borderTopRightRadius: 4,
  },
  speakingBubble: {
    borderWidth: 1.5,
    borderColor: colors.primary,
  },

  // Speaker label
  speakerLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.textLight,
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  userSpeakerLabel: {
    color: colors.primaryMuted,
  },

  // Text
  jaText: {
    fontSize: 17,
    fontWeight: "500",
    color: colors.textDark,
    lineHeight: 26,
  },
  userJaText: {
    color: colors.surface,
  },
  koText: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 6,
    lineHeight: 18,
  },
  userKoText: {
    color: "rgba(255,255,255,0.7)",
  },

  // Speaking indicator
  speakingIndicator: {
    position: "absolute",
    top: 10,
    right: 10,
  },

  // Controls
  controls: {
    padding: 16,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
    gap: 10,
  },
  koreanButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 8,
  },
  koreanButtonText: {
    fontSize: 16,
  },
  koreanButtonLabel: {
    fontSize: 14,
    color: colors.textMuted,
    fontWeight: "500",
  },
  nextButton: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  nextButtonDisabled: {
    backgroundColor: colors.borderLight,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: colors.surface,
  },
  nextButtonTextDisabled: {
    color: colors.textLight,
  },
});
