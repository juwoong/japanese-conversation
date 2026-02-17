/**
 * Phase 3 — Engage (stub)
 * Will be implemented by another agent.
 * Should reuse recording/STT/feedback logic from the original SessionScreen.
 */

import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { colors } from "../../constants/theme";

interface EngagePhaseProps {
  onComplete: () => void;
}

export default function EngagePhase({ onComplete }: EngagePhaseProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Phase 3: Engage</Text>
      <Text style={styles.description}>
        직접 말해보는 단계 (구현 예정)
      </Text>
      <TouchableOpacity style={styles.button} onPress={onComplete}>
        <Text style={styles.buttonText}>다음 Phase로</Text>
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
