/**
 * SafetyNetTooltip — the [?] button that shows Korean meaning
 * with progressive retreat based on exposure count.
 *
 * Behavior by exposure count:
 *   1-5:  immediate — Korean meaning appears, fades after 3s
 *   6-10: audio_first — TTS plays, Korean after 3s, fades after 3s
 *   11+:  emoji_hint — emoji shown first, Korean on 2nd tap, fades after 3s
 *
 * NEVER shows Korean permanently.
 */

import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  TouchableOpacity,
  Text,
  Animated,
  StyleSheet,
  View,
} from "react-native";
import * as Speech from "expo-speech";
import {
  getExposure,
  getSafetyNetBehavior,
  recordSafetyNetTap,
  type SafetyNetBehavior,
} from "../lib/exposureTracker";
import { colors } from "../constants/theme";

interface SafetyNetTooltipProps {
  word: string;
  meaning: string;
  emoji?: string;
  onTap?: () => void;
}

const FADE_DURATION = 500;
const DISPLAY_DURATION = 3000;

export default function SafetyNetTooltip({
  word,
  meaning,
  emoji,
  onTap,
}: SafetyNetTooltipProps) {
  const [state, setState] = useState<
    "idle" | "emoji_shown" | "meaning_shown"
  >("idle");
  const opacity = useRef(new Animated.Value(0)).current;
  const fadeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (fadeTimer.current) clearTimeout(fadeTimer.current);
    };
  }, []);

  const showMeaning = useCallback(() => {
    setState("meaning_shown");
    opacity.setValue(1);

    // Auto-fade after 3s
    fadeTimer.current = setTimeout(() => {
      Animated.timing(opacity, {
        toValue: 0,
        duration: FADE_DURATION,
        useNativeDriver: true,
      }).start(() => {
        setState("idle");
      });
    }, DISPLAY_DURATION);
  }, [opacity]);

  const handleTap = useCallback(async () => {
    onTap?.();

    // Clear any pending fade
    if (fadeTimer.current) {
      clearTimeout(fadeTimer.current);
      fadeTimer.current = null;
    }

    // If meaning is currently shown, hide it and reset
    if (state === "meaning_shown") {
      Animated.timing(opacity, {
        toValue: 0,
        duration: FADE_DURATION / 2,
        useNativeDriver: true,
      }).start(() => setState("idle"));
      return;
    }

    const record = await getExposure(word);
    await recordSafetyNetTap(word);
    const behavior: SafetyNetBehavior = getSafetyNetBehavior(
      record.exposureCount
    );

    switch (behavior) {
      case "immediate":
        showMeaning();
        break;

      case "audio_first":
        // Play TTS first, show meaning after 3s
        Speech.speak(word, { language: "ja-JP", rate: 0.8 });
        fadeTimer.current = setTimeout(() => {
          showMeaning();
        }, DISPLAY_DURATION);
        break;

      case "emoji_hint":
        if (state === "emoji_shown") {
          // 2nd tap: show Korean meaning
          showMeaning();
        } else {
          // 1st tap: show emoji hint
          setState("emoji_shown");
          opacity.setValue(1);
          // Auto-fade emoji after 5s if no 2nd tap
          fadeTimer.current = setTimeout(() => {
            Animated.timing(opacity, {
              toValue: 0,
              duration: FADE_DURATION,
              useNativeDriver: true,
            }).start(() => setState("idle"));
          }, 5000);
        }
        break;
    }
  }, [word, state, opacity, showMeaning, onTap]);

  const hintEmoji = emoji || "💡";

  return (
    <View style={styles.wrapper}>
      <TouchableOpacity onPress={handleTap} style={styles.button}>
        <Text style={styles.buttonText}>?</Text>
      </TouchableOpacity>

      {state === "emoji_shown" && (
        <Animated.View style={[styles.tooltip, { opacity }]}>
          <Text style={styles.emojiText}>{hintEmoji}</Text>
        </Animated.View>
      )}

      {state === "meaning_shown" && (
        <Animated.View style={[styles.tooltip, { opacity }]}>
          <Text style={styles.meaningText}>{meaning}</Text>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "relative",
  },
  button: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.borderLight,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textMuted,
  },
  tooltip: {
    position: "absolute",
    top: 32,
    right: 0,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    minWidth: 80,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
    zIndex: 10,
  },
  emojiText: {
    fontSize: 20,
    textAlign: "center",
  },
  meaningText: {
    fontSize: 14,
    color: colors.textMuted,
  },
});
