import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors } from "../constants/theme";

interface Props {
  userInput: string;
  accuracy: number;
}

export default function UserBubble({ userInput, accuracy }: Props) {
  const pct = Math.round(accuracy * 100);
  const badgeColor =
    accuracy >= 0.8 ? colors.success : accuracy >= 0.5 ? colors.warning : colors.danger;

  return (
    <View style={styles.wrapper}>
      <View style={styles.bubble}>
        <Text style={styles.text}>{userInput}</Text>
        <View style={[styles.badge, { backgroundColor: badgeColor }]}>
          <Text style={styles.badgeText}>✓ {pct}%</Text>
        </View>
      </View>
    </View>
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
    borderRadius: 10,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.surface,
  },
});
