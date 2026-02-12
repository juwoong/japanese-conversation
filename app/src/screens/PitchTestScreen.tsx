/**
 * Pitch Test Screen: Record → real-time pitch curve → H/L comparison.
 * Dev screen for validating pitch detection + pronunciation comparison.
 */

import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  useColorScheme,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAudioStream } from "../audio/useAudioStream";
import { usePitchDetection } from "../audio/usePitchDetection";
import { useRMSEnergy } from "../audio/useRMSEnergy";
import { comparePitch } from "../audio/pitchCompare";
import { PitchCanvas } from "../visualization/PitchCanvas";
import { ComparisonCanvas } from "../visualization/ComparisonCanvas";
import { TEST_REFERENCES } from "../data/referencePitch";
import type { ComparisonResult, ReferencePitchData } from "../types/pitch";

export default function PitchTestScreen({ navigation }: any) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const [isRecording, setIsRecording] = useState(false);
  const [selectedRef, setSelectedRef] = useState<ReferencePitchData>(TEST_REFERENCES[0]);
  const [comparisonResult, setComparisonResult] = useState<ComparisonResult | null>(null);

  const { startStream, stopStream } = useAudioStream();
  const { pitchPoints, init, processAudio, startFlushing, stopFlushing, reset } =
    usePitchDetection();
  const { currentRMS, isVoiceActive, processRMS, reset: resetRMS } = useRMSEnergy();

  const handleStart = useCallback(async () => {
    setComparisonResult(null);
    init();
    resetRMS();
    startFlushing();

    await startStream({
      onAudioData: (float32: Float32Array) => {
        processAudio(float32);
        processRMS(float32);
      },
    });
    setIsRecording(true);
  }, [startStream, init, processAudio, processRMS, startFlushing, resetRMS]);

  const handleStop = useCallback(() => {
    stopStream();
    stopFlushing();
    setIsRecording(false);

    // Run H/L comparison after stopping
    if (pitchPoints.length > 0) {
      const result = comparePitch(pitchPoints, selectedRef);
      setComparisonResult(result);
    }
  }, [stopStream, stopFlushing, pitchPoints, selectedRef]);

  const handleReset = useCallback(() => {
    stopStream();
    stopFlushing();
    reset();
    resetRMS();
    setIsRecording(false);
    setComparisonResult(null);
  }, [stopStream, stopFlushing, reset, resetRMS]);

  const lastPoint = pitchPoints[pitchPoints.length - 1];

  return (
    <SafeAreaView style={[styles.container, isDark && styles.containerDark]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={[styles.backText, isDark && styles.textDark]}>← 뒤로</Text>
        </TouchableOpacity>
        <Text style={[styles.title, isDark && styles.textDark]}>피치 비교</Text>
        <View style={{ width: 48 }} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* Selected word display */}
        <View style={styles.selectedWord}>
          <Text style={[styles.wordJa, isDark && styles.textDark]}>
            {selectedRef.textJa}
          </Text>
          <Text style={[styles.wordReading, isDark && styles.textMuted]}>
            {selectedRef.readingHiragana}
          </Text>
          <Text style={[styles.wordPattern, isDark && styles.textMuted]}>
            패턴: {selectedRef.pitchPattern}
          </Text>
        </View>

        {/* Pitch visualization */}
        <PitchCanvas pitchPoints={pitchPoints} isRecording={isRecording} />

        {/* Stats row */}
        <View style={styles.stats}>
          <StatItem label="Hz" value={lastPoint?.hz?.toFixed(0) ?? "—"} isDark={isDark} />
          <StatItem label="세미톤" value={lastPoint?.semitone?.toFixed(1) ?? "—"} isDark={isDark} />
          <StatItem label="RMS" value={currentRMS.toFixed(3)} isDark={isDark} />
          <StatItem label="음성" value={isVoiceActive ? "●" : "○"} isDark={isDark} highlight={isVoiceActive} />
          <StatItem label="포인트" value={String(pitchPoints.length)} isDark={isDark} />
        </View>

        {/* Comparison result (shown after recording) */}
        {comparisonResult && <ComparisonCanvas result={comparisonResult} />}

        {/* Word selector */}
        <View style={styles.wordSelector}>
          <Text style={[styles.sectionTitle, isDark && styles.textDark]}>
            테스트 단어 선택
          </Text>
          <View style={styles.wordGrid}>
            {TEST_REFERENCES.map((ref) => (
              <TouchableOpacity
                key={ref.lineId}
                style={[
                  styles.wordChip,
                  selectedRef.lineId === ref.lineId && styles.wordChipSelected,
                  isDark && styles.wordChipDark,
                ]}
                onPress={() => {
                  setSelectedRef(ref);
                  setComparisonResult(null);
                }}
              >
                <Text
                  style={[
                    styles.wordChipText,
                    selectedRef.lineId === ref.lineId && styles.wordChipTextSelected,
                    isDark && styles.textMuted,
                  ]}
                >
                  {ref.textJa}
                </Text>
                <Text style={[styles.wordChipPattern, isDark && styles.textMuted]}>
                  {ref.pitchPattern}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Controls */}
      <View style={styles.controls}>
        {!isRecording ? (
          <TouchableOpacity style={styles.button} onPress={handleStart}>
            <Text style={styles.buttonText}>● 녹음</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={[styles.button, styles.buttonRecording]} onPress={handleStop}>
            <Text style={styles.buttonText}>■ 정지 + 비교</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.button, styles.buttonSecondary]}
          onPress={handleReset}
        >
          <Text style={[styles.buttonText, styles.buttonSecondaryText]}>초기화</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function StatItem({
  label,
  value,
  isDark,
  highlight,
}: {
  label: string;
  value: string;
  isDark: boolean;
  highlight?: boolean;
}) {
  return (
    <View style={styles.statItem}>
      <Text style={[styles.statValue, isDark && styles.textDark, highlight && styles.highlight]}>
        {value}
      </Text>
      <Text style={[styles.statLabel, isDark && styles.textMuted]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  containerDark: {
    backgroundColor: "#0F172A",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backText: {
    fontSize: 16,
    color: "#4F46E5",
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1E293B",
  },
  textDark: {
    color: "#F1F5F9",
  },
  textMuted: {
    color: "#94A3B8",
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 16,
  },
  selectedWord: {
    alignItems: "center",
    paddingVertical: 12,
  },
  wordJa: {
    fontSize: 32,
    fontWeight: "700",
    color: "#1E293B",
  },
  wordReading: {
    fontSize: 16,
    color: "#64748B",
    marginTop: 2,
  },
  wordPattern: {
    fontSize: 14,
    color: "#94A3B8",
    marginTop: 4,
    fontFamily: "monospace",
  },
  stats: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  statItem: {
    alignItems: "center",
  },
  statValue: {
    fontSize: 18,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
    color: "#1E293B",
  },
  statLabel: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 2,
  },
  highlight: {
    color: "#22C55E",
  },
  wordSelector: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1E293B",
    marginBottom: 8,
  },
  wordGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  wordChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
    minWidth: 70,
  },
  wordChipDark: {
    backgroundColor: "#1E293B",
    borderColor: "#334155",
  },
  wordChipSelected: {
    borderColor: "#4F46E5",
    backgroundColor: "#EEF2FF",
  },
  wordChipText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#334155",
  },
  wordChipTextSelected: {
    color: "#4F46E5",
  },
  wordChipPattern: {
    fontSize: 11,
    color: "#94A3B8",
    marginTop: 2,
    fontFamily: "monospace",
  },
  controls: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  button: {
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "#4F46E5",
  },
  buttonRecording: {
    backgroundColor: "#EF4444",
  },
  buttonSecondary: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  buttonSecondaryText: {
    color: "#64748B",
  },
});
