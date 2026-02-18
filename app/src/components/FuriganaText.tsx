import React from "react";
import { View, Text, StyleSheet } from "react-native";
import type { FuriganaSegment } from "../types";

interface Props {
  segments: FuriganaSegment[];
  /** Base text font size (default 18) */
  fontSize?: number;
  /** Base text color */
  color?: string;
  /** Show furigana readings above kanji (default true) */
  showReading?: boolean;
  /** Color for kanji segments (has reading) — overrides color */
  highlightColor?: string;
  /** Color for non-kanji segments (no reading) — overrides color */
  dimColor?: string;
  /** Color for furigana reading text above kanji */
  readingColor?: string;
}

/**
 * Renders Japanese text with furigana (small hiragana above kanji).
 *
 * React Native has no <ruby> tag, so we use a flex-row of vertical stacks:
 *   [reading]   (small, only for kanji segments)
 *   [base text]
 *
 * Non-kanji segments get an empty spacer to keep baseline alignment.
 */
export default function FuriganaText({
  segments,
  fontSize = 18,
  color = "#1a1a1a",
  showReading = true,
  highlightColor,
  dimColor,
  readingColor,
}: Props) {
  const readingSize = Math.round(fontSize * 0.5);
  // Fixed spacer height so baselines align even when reading is absent
  const readingLineHeight = readingSize + 2;

  return (
    <View style={styles.container}>
      {segments.map((seg, i) => {
        const hasReading = showReading && !!seg.reading;
        // Kanji segment (has reading) → highlightColor, otherwise dimColor
        const segColor = seg.reading
          ? (highlightColor ?? color)
          : (dimColor ?? color);

        return (
          <View key={i} style={styles.segment}>
            <Text
              style={[
                styles.base,
                { fontSize, color: segColor, lineHeight: fontSize + 8 },
              ]}
            >
              {seg.text}
            </Text>
            {hasReading ? (
              <Text
                style={[
                  styles.reading,
                  {
                    fontSize: readingSize,
                    lineHeight: readingLineHeight,
                    color: readingColor ?? "#9ca3af",
                  },
                ]}
              >
                {seg.reading}
              </Text>
            ) : (
              <View style={{ height: readingLineHeight }} />
            )}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "flex-start",
  },
  segment: {
    alignItems: "center",
  },
  reading: {
    textAlign: "center",
  },
  base: {
    fontWeight: "500",
  },
});
