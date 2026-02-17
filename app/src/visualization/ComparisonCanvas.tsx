/**
 * Post-hoc pitch comparison overlay: reference H/L pattern vs user pitch.
 * Shows mora labels, H/L bars, and per-mora correctness.
 */

import React, { useMemo } from "react";
import { View, Text, StyleSheet, useColorScheme } from "react-native";
import type { ComparisonResult } from "../types/pitch";
import type { PitchRating } from "../types/pitch";
import { scoreToRating } from "../audio/pitchCompare";

interface ComparisonCanvasProps {
  result: ComparisonResult;
}

const RATING_COLORS = {
  excellent: { bg: "#DCFCE7", text: "#166534", label: "훌륭해요!" },
  good: { bg: "#FEF9C3", text: "#854D0E", label: "좋아요!" },
  fair: { bg: "#FED7AA", text: "#9A3412", label: "괜찮아요" },
  needs_work: { bg: "#FECACA", text: "#991B1B", label: "다시 해보세요" },
} as const;

export function ComparisonCanvas({ result }: ComparisonCanvasProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const rating = scoreToRating(result.score);
  const ratingConfig = RATING_COLORS[rating];

  return (
    <View style={[styles.container, isDark && styles.containerDark]}>
      {/* Rating badge — qualitative only, no numeric score */}
      <View style={[styles.scoreBadge, { backgroundColor: ratingConfig.bg }]}>
        <Text style={[styles.scoreLabel, { color: ratingConfig.text }]}>
          {ratingConfig.label}
        </Text>
      </View>

      {/* Mora comparison grid */}
      <View style={styles.moraGrid}>
        {/* Expected H/L row */}
        <View style={styles.moraRow}>
          <Text style={[styles.rowLabel, isDark && styles.textMuted]}>기준</Text>
          {result.moraResults.map((m, i) => (
            <View
              key={`exp-${i}`}
              style={[
                styles.moraCell,
                m.expected === "H" && styles.moraCellH,
                m.expected === "L" && styles.moraCellL,
                m.expected === null && styles.moraCellNull,
              ]}
            >
              <Text style={styles.moraCellText}>
                {m.expected ?? "—"}
              </Text>
            </View>
          ))}
        </View>

        {/* User detected H/L row */}
        <View style={styles.moraRow}>
          <Text style={[styles.rowLabel, isDark && styles.textMuted]}>나</Text>
          {result.moraResults.map((m, i) => (
            <View
              key={`det-${i}`}
              style={[
                styles.moraCell,
                m.detected === "H" && styles.moraCellH,
                m.detected === "L" && styles.moraCellL,
                m.detected === null && styles.moraCellNull,
                !m.correct && m.expected !== null && styles.moraCellWrong,
              ]}
            >
              <Text
                style={[
                  styles.moraCellText,
                  !m.correct && m.expected !== null && styles.moraCellTextWrong,
                ]}
              >
                {m.detected ?? "—"}
              </Text>
            </View>
          ))}
        </View>

        {/* Mora labels row */}
        <View style={styles.moraRow}>
          <Text style={[styles.rowLabel, isDark && styles.textMuted]}> </Text>
          {result.moraResults.map((m, i) => (
            <View key={`lbl-${i}`} style={styles.moraLabelCell}>
              <Text
                style={[
                  styles.moraLabelText,
                  isDark && styles.textMuted,
                  !m.correct && m.expected !== null && styles.moraLabelWrong,
                ]}
              >
                {m.mora}
              </Text>
            </View>
          ))}
        </View>

        {/* Correctness indicator row */}
        <View style={styles.moraRow}>
          <Text style={[styles.rowLabel, isDark && styles.textMuted]}> </Text>
          {result.moraResults.map((m, i) => (
            <View key={`chk-${i}`} style={styles.moraLabelCell}>
              <Text style={styles.checkText}>
                {m.expected === null ? "" : m.correct ? "✓" : "·"}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* Feedback text */}
      <Text style={[styles.feedback, isDark && styles.textLight]}>
        {result.feedback}
      </Text>

      {/* Stats — qualitative only */}
      <Text style={[styles.statsText, isDark && styles.textMuted]}>
        {result.accentNucleusCorrect ? "강세 위치 ✓" : "강세 위치를 확인해보세요"}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginTop: 12,
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  containerDark: {
    backgroundColor: "#1E293B",
    borderColor: "#334155",
  },
  scoreBadge: {
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "baseline",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 16,
    gap: 6,
  },
  scoreLabel: {
    fontSize: 14,
    fontWeight: "600",
  },
  moraGrid: {
    gap: 4,
    marginBottom: 12,
  },
  moraRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  rowLabel: {
    width: 28,
    fontSize: 11,
    fontWeight: "500",
    color: "#64748B",
    textAlign: "right",
    marginRight: 4,
  },
  moraCell: {
    flex: 1,
    height: 28,
    borderRadius: 4,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F1F5F9",
  },
  moraCellH: {
    backgroundColor: "#DBEAFE",
  },
  moraCellL: {
    backgroundColor: "#F1F5F9",
  },
  moraCellNull: {
    backgroundColor: "#F8FAFC",
    opacity: 0.5,
  },
  moraCellWrong: {
    backgroundColor: "#FEE2E2",
    borderWidth: 1,
    borderColor: "#FCA5A5",
  },
  moraCellText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#475569",
  },
  moraCellTextWrong: {
    color: "#DC2626",
  },
  moraLabelCell: {
    flex: 1,
    alignItems: "center",
  },
  moraLabelText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#334155",
  },
  moraLabelWrong: {
    color: "#DC2626",
    fontWeight: "700",
  },
  checkText: {
    fontSize: 12,
    color: "#22C55E",
  },
  feedback: {
    fontSize: 14,
    fontWeight: "500",
    color: "#334155",
    textAlign: "center",
    marginBottom: 8,
  },
  textLight: {
    color: "#F1F5F9",
  },
  textMuted: {
    color: "#94A3B8",
  },
  statsText: {
    fontSize: 12,
    color: "#94A3B8",
    textAlign: "center",
  },
});
