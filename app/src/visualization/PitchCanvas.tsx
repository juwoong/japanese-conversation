/**
 * Real-time pitch curve visualization using Skia.
 * Renders a scrolling pitch contour with grid and REC indicator.
 */

import React, { useMemo } from "react";
import { View, useColorScheme } from "react-native";
import {
  Canvas,
  Path,
  Skia,
  LinearGradient,
  Line as SkiaLine,
  Circle,
  Text as SkiaText,
  useFont,
  vec,
} from "@shopify/react-native-skia";
import { PITCH_VIZ } from "../constants/pitchVizTokens";
import type { PitchPoint } from "../audio/pitchConfig";

interface PitchCanvasProps {
  pitchPoints: PitchPoint[];
  isRecording: boolean;
}

export function PitchCanvas({ pitchPoints, isRecording }: PitchCanvasProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const tokens = PITCH_VIZ;
  const bg = isDark ? tokens.background.dark : tokens.background.light;
  const border = isDark ? tokens.borderColor.dark : tokens.borderColor.light;
  const curveTokens = isDark ? tokens.curve.dark : tokens.curve.light;
  const gridColor = isDark ? tokens.grid.color.dark : tokens.grid.color.light;

  const { height, padding, borderRadius } = tokens.canvas;
  const drawWidth = 360 - tokens.canvas.margin.horizontal * 2 - padding.left - padding.right;
  const drawHeight = height - padding.top - padding.bottom;

  // Map semitone to y coordinate
  const semitoneToY = (st: number): number => {
    const clamped = Math.max(tokens.pitch.semitoneMin, Math.min(tokens.pitch.semitoneMax, st));
    const ratio = (tokens.pitch.semitoneMax - clamped) / (tokens.pitch.semitoneMax - tokens.pitch.semitoneMin);
    return padding.top + ratio * drawHeight;
  };

  // Compute visible window
  const visiblePoints = useMemo(() => {
    if (pitchPoints.length === 0) return [];

    const windowMs = tokens.time.visibleWindowSeconds * 1000;
    const latestTime = pitchPoints[pitchPoints.length - 1].timeMs;
    const startTime = Math.max(0, latestTime - windowMs);

    return pitchPoints.filter((p) => p.timeMs >= startTime);
  }, [pitchPoints, tokens.time.visibleWindowSeconds]);

  // Build Skia path from visible points
  const { curvePath, fillPath } = useMemo(() => {
    const curve = Skia.Path.Make();
    const fill = Skia.Path.Make();

    if (visiblePoints.length === 0) {
      return { curvePath: curve, fillPath: fill };
    }

    const windowMs = tokens.time.visibleWindowSeconds * 1000;
    const latestTime = visiblePoints[visiblePoints.length - 1]?.timeMs ?? 0;
    const startTime = latestTime - windowMs;

    const timeToX = (t: number): number => {
      const ratio = (t - startTime) / windowMs;
      return padding.left + ratio * drawWidth;
    };

    // Apply simple smoothing
    const smoothed = applySmoothing(visiblePoints, tokens.pitch.smoothingWindowSize);

    let inSegment = false;
    let segStartX = 0;

    for (let i = 0; i < smoothed.length; i++) {
      const p = smoothed[i];
      if (p.semitone === null) {
        // End current segment
        if (inSegment) {
          // Close fill path down to baseline
          fill.lineTo(timeToX(smoothed[i - 1].timeMs), padding.top + drawHeight);
          fill.lineTo(segStartX, padding.top + drawHeight);
          fill.close();
          inSegment = false;
        }
        continue;
      }

      const x = timeToX(p.timeMs);
      const y = semitoneToY(p.semitone);

      if (!inSegment) {
        curve.moveTo(x, y);
        fill.moveTo(x, padding.top + drawHeight);
        fill.lineTo(x, y);
        segStartX = x;
        inSegment = true;
      } else {
        curve.lineTo(x, y);
        fill.lineTo(x, y);
      }
    }

    // Close last fill segment
    if (inSegment && smoothed.length > 0) {
      const lastVoiced = [...smoothed].reverse().find((p) => p.semitone !== null);
      if (lastVoiced) {
        fill.lineTo(timeToX(lastVoiced.timeMs), padding.top + drawHeight);
        fill.lineTo(segStartX, padding.top + drawHeight);
        fill.close();
      }
    }

    return { curvePath: curve, fillPath: fill };
  }, [visiblePoints, drawWidth, drawHeight, padding, tokens]);

  // Grid lines
  const centerY = semitoneToY(0);
  const majorYs = tokens.grid.majorLine.semitones.map(semitoneToY);

  return (
    <View
      style={{
        marginHorizontal: tokens.canvas.margin.horizontal,
        marginTop: tokens.canvas.margin.top,
        marginBottom: tokens.canvas.margin.bottom,
      }}
    >
      <Canvas
        style={{
          width: "100%",
          height,
          borderRadius,
          backgroundColor: bg,
          borderWidth: 1,
          borderColor: isRecording ? tokens.recording.dot.color + "66" : border,
        }}
      >
        {/* Center grid line */}
        <SkiaLine
          p1={vec(padding.left, centerY)}
          p2={vec(padding.left + drawWidth, centerY)}
          color={gridColor}
          strokeWidth={tokens.grid.centerLine.width}
          opacity={tokens.grid.centerLine.opacity}
        />

        {/* Major grid lines (+6, -6 semitones) */}
        {majorYs.map((y, i) => (
          <SkiaLine
            key={`major-${i}`}
            p1={vec(padding.left, y)}
            p2={vec(padding.left + drawWidth, y)}
            color={gridColor}
            strokeWidth={tokens.grid.majorLine.width}
            opacity={tokens.grid.majorLine.opacity}
          />
        ))}

        {/* Gradient fill under curve */}
        <Path path={fillPath} style="fill">
          <LinearGradient
            start={vec(0, padding.top)}
            end={vec(0, padding.top + drawHeight)}
            colors={[curveTokens.gradientTop, curveTokens.gradientBottom]}
          />
        </Path>

        {/* Pitch curve line */}
        <Path
          path={curvePath}
          style="stroke"
          strokeWidth={tokens.curve.strokeWidth}
          color={curveTokens.strokeColor}
          strokeCap="round"
          strokeJoin="round"
        />

        {/* REC indicator */}
        {isRecording && (
          <Circle
            cx={padding.left + drawWidth + padding.right - tokens.recording.dot.inset}
            cy={tokens.recording.dot.inset + tokens.recording.dot.diameter / 2}
            r={tokens.recording.dot.diameter / 2}
            color={tokens.recording.dot.color}
          />
        )}
      </Canvas>
    </View>
  );
}

/** 3-point moving average, preserving null gaps */
function applySmoothing(
  points: PitchPoint[],
  windowSize: number,
): PitchPoint[] {
  if (windowSize <= 1) return points;
  const half = Math.floor(windowSize / 2);

  return points.map((p, i) => {
    if (p.semitone === null) return p;

    let sum = 0;
    let count = 0;
    for (let j = i - half; j <= i + half; j++) {
      if (j >= 0 && j < points.length && points[j].semitone !== null) {
        sum += points[j].semitone!;
        count++;
      }
    }

    return count > 0
      ? { ...p, semitone: sum / count }
      : p;
  });
}
