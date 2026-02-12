/**
 * Real-time pitch detection hook using pitchy (McLeod Pitch Method).
 * Consumes Float32Array from useAudioStream, emits PitchPoints.
 */

import { useRef, useCallback, useState } from "react";
import { PitchDetector } from "pitchy";
import {
  PITCH_CONFIG,
  NOISE_GATE_CONFIG,
  type PitchPoint,
} from "./pitchConfig";
import { hzToSemitone } from "./pitchMath";

function calculateRMS(buffer: Float32Array, offset: number, length: number): number {
  let sum = 0;
  const end = offset + length;
  for (let i = offset; i < end; i++) {
    sum += buffer[i] * buffer[i];
  }
  return Math.sqrt(sum / length);
}

export function usePitchDetection() {
  const [pitchPoints, setPitchPoints] = useState<PitchPoint[]>([]);

  const detectorRef = useRef<PitchDetector<Float32Array> | null>(null);
  const ringBufferRef = useRef<Float32Array>(new Float32Array(PITCH_CONFIG.windowSize * 2));
  const writePositionRef = useRef(0);
  const samplesSinceHopRef = useRef(0);
  const startTimeRef = useRef(0);
  const totalSamplesRef = useRef(0);
  const pendingPointsRef = useRef<PitchPoint[]>([]);
  const rafRef = useRef<number | null>(null);

  const init = useCallback(() => {
    detectorRef.current = PitchDetector.forFloat32Array(PITCH_CONFIG.windowSize);
    ringBufferRef.current = new Float32Array(PITCH_CONFIG.windowSize * 2);
    writePositionRef.current = 0;
    samplesSinceHopRef.current = 0;
    totalSamplesRef.current = 0;
    startTimeRef.current = Date.now();
    pendingPointsRef.current = [];
    setPitchPoints([]);
  }, []);

  // Flush pending points to state at ~30fps
  const startFlushing = useCallback(() => {
    const flush = () => {
      if (pendingPointsRef.current.length > 0) {
        const batch = pendingPointsRef.current;
        pendingPointsRef.current = [];
        setPitchPoints((prev) => [...prev, ...batch]);
      }
      rafRef.current = requestAnimationFrame(flush);
    };
    rafRef.current = requestAnimationFrame(flush);
  }, []);

  const stopFlushing = useCallback(() => {
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    // Flush remaining
    if (pendingPointsRef.current.length > 0) {
      const batch = pendingPointsRef.current;
      pendingPointsRef.current = [];
      setPitchPoints((prev) => [...prev, ...batch]);
    }
  }, []);

  const processAudio = useCallback((float32: Float32Array) => {
    const detector = detectorRef.current;
    if (!detector) return;

    const ring = ringBufferRef.current;
    const ringLen = ring.length;

    // Write incoming samples into ring buffer
    for (let i = 0; i < float32.length; i++) {
      ring[writePositionRef.current] = float32[i];
      writePositionRef.current = (writePositionRef.current + 1) % ringLen;
      samplesSinceHopRef.current++;
      totalSamplesRef.current++;

      // Extract analysis window every hopSize samples
      if (samplesSinceHopRef.current >= PITCH_CONFIG.hopSize) {
        samplesSinceHopRef.current = 0;

        // Build window from ring buffer
        const window = new Float32Array(PITCH_CONFIG.windowSize);
        const readStart = (writePositionRef.current - PITCH_CONFIG.windowSize + ringLen) % ringLen;
        for (let j = 0; j < PITCH_CONFIG.windowSize; j++) {
          window[j] = ring[(readStart + j) % ringLen];
        }

        const rms = calculateRMS(window, 0, PITCH_CONFIG.windowSize);
        const timeMs = (totalSamplesRef.current / 16000) * 1000;

        if (rms < NOISE_GATE_CONFIG.rmsThreshold) {
          // Silence
          pendingPointsRef.current.push({
            timeMs,
            semitone: null,
            hz: null,
            clarity: 0,
            rms,
          });
          continue;
        }

        const [pitch, clarity] = detector.findPitch(window, 16000);

        const isValid =
          clarity >= PITCH_CONFIG.confidenceThreshold &&
          pitch >= PITCH_CONFIG.minFrequencyHz &&
          pitch <= PITCH_CONFIG.maxFrequencyHz;

        pendingPointsRef.current.push({
          timeMs,
          semitone: isValid ? hzToSemitone(pitch) : null,
          hz: isValid ? pitch : null,
          clarity,
          rms,
        });
      }
    }
  }, []);

  const reset = useCallback(() => {
    stopFlushing();
    detectorRef.current = null;
    setPitchPoints([]);
  }, [stopFlushing]);

  return {
    pitchPoints,
    init,
    processAudio,
    startFlushing,
    stopFlushing,
    reset,
  };
}
