/**
 * KanaDisplay — renders Japanese text (hiragana/katakana) with optional [?] safety net.
 *
 * Rules:
 *   - NEVER shows Korean pronunciation
 *   - Only [?] SafetyNetTooltip for Korean meaning
 *   - For katakana foreign words, may show original word hint: "ビール (beer)"
 */

import React from "react";
import { View, Text, StyleSheet } from "react-native";
import SafetyNetTooltip from "./SafetyNetTooltip";
import { colors } from "../constants/theme";

interface KanaDisplayProps {
  text: string;
  meaning?: string;
  emoji?: string;
  showSafetyNet?: boolean;
  fontSize?: number;
}

export default function KanaDisplay({
  text,
  meaning,
  emoji,
  showSafetyNet = false,
  fontSize = 18,
}: KanaDisplayProps) {
  return (
    <View style={styles.container}>
      <Text style={[styles.text, { fontSize, lineHeight: fontSize + 8 }]}>
        {text}
      </Text>
      {showSafetyNet && meaning && (
        <SafetyNetTooltip word={text} meaning={meaning} emoji={emoji} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  text: {
    fontWeight: "500",
    color: colors.textDark,
  },
});
