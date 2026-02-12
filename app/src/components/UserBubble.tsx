import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated } from "react-native";
import { colors } from "../constants/theme";
import type { DiffSegment } from "../lib/textDiff";

interface Props {
  userInput: string;
  accuracy: number;
  diffSegments?: DiffSegment[];
}

/** Colors for each diff segment status */
const DIFF_COLORS = {
  correct: "#FFFFFF",
  wrong: "#FCA5A5",    // red-300 on primary bg
  missing: "#FDE047",  // yellow-300 — underline style
  extra: "#A5B4FC",    // indigo-300 — struck through
} as const;

export default function UserBubble({ userInput, accuracy, diffSegments }: Props) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateAnim = useRef(new Animated.Value(15)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(translateAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const pct = Math.round(accuracy * 100);
  const badgeColor =
    accuracy >= 0.8 ? colors.success : accuracy >= 0.5 ? colors.warning : colors.danger;

  const renderText = () => {
    if (!diffSegments || diffSegments.length === 0) {
      return <Text style={styles.text}>{userInput}</Text>;
    }

    return (
      <Text style={styles.text}>
        {diffSegments.map((seg, i) => {
          switch (seg.status) {
            case "correct":
              return (
                <Text key={i} style={{ color: DIFF_COLORS.correct }}>
                  {seg.text}
                </Text>
              );
            case "wrong":
              return (
                <Text key={i} style={{ color: DIFF_COLORS.wrong }}>
                  {seg.text}
                </Text>
              );
            case "missing":
              return (
                <Text
                  key={i}
                  style={{
                    color: DIFF_COLORS.missing,
                    textDecorationLine: "underline",
                  }}
                >
                  {seg.text}
                </Text>
              );
            case "extra":
              return (
                <Text
                  key={i}
                  style={{
                    color: DIFF_COLORS.extra,
                    textDecorationLine: "line-through",
                  }}
                >
                  {seg.text}
                </Text>
              );
          }
        })}
      </Text>
    );
  };

  return (
    <Animated.View
      style={[
        styles.wrapper,
        {
          opacity: fadeAnim,
          transform: [{ translateY: translateAnim }],
        },
      ]}
    >
      <View style={styles.bubble}>
        {renderText()}
        <View style={[styles.badge, { backgroundColor: badgeColor }]}>
          <Text style={styles.badgeText}>{pct}%</Text>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: "flex-end",
    marginBottom: 12,
  },
  bubble: {
    maxWidth: "80%",
    backgroundColor: colors.primary,
    borderRadius: 16,
    borderTopRightRadius: 4,
    padding: 14,
  },
  text: {
    fontSize: 17,
    color: colors.surface,
    lineHeight: 24,
  },
  badge: {
    alignSelf: "flex-end",
    marginTop: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.surface,
  },
});
