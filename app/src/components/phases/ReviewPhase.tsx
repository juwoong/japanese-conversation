/**
 * Phase 4 — Review (stub)
 * Will be implemented by another agent.
 */

import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { colors } from "../../constants/theme";

interface ReviewPhaseProps {
  onComplete: () => void;
}

export default function ReviewPhase({ onComplete }: ReviewPhaseProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Phase 4: Review</Text>
      <Text style={styles.description}>
        복습 단계 (구현 예정)
      </Text>
      <TouchableOpacity style={styles.button} onPress={onComplete}>
        <Text style={styles.buttonText}>학습 완료</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  label: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.textDark,
    marginBottom: 8,
  },
  description: {
    fontSize: 15,
    color: colors.textMuted,
    textAlign: "center",
    marginBottom: 24,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 32,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: colors.surface,
  },
});
