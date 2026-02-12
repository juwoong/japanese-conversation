/**
 * RMS energy tracking for voice activity detection.
 * Provides current volume level for waveform visualization.
 */

import { useRef, useCallback, useState } from "react";
import { NOISE_GATE_CONFIG } from "./pitchConfig";

export function useRMSEnergy() {
  const [currentRMS, setCurrentRMS] = useState(0);
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const smoothedRef = useRef(0);

  const processRMS = useCallback((float32: Float32Array) => {
    let sum = 0;
    for (let i = 0; i < float32.length; i++) {
      sum += float32[i] * float32[i];
    }
    const rms = Math.sqrt(sum / float32.length);

    // Exponential smoothing (attack fast, release slow)
    const alpha = rms > smoothedRef.current ? 0.3 : 0.05;
    smoothedRef.current = alpha * rms + (1 - alpha) * smoothedRef.current;

    setCurrentRMS(smoothedRef.current);
    setIsVoiceActive(smoothedRef.current >= NOISE_GATE_CONFIG.rmsThreshold);
  }, []);

  const reset = useCallback(() => {
    smoothedRef.current = 0;
    setCurrentRMS(0);
    setIsVoiceActive(false);
  }, []);

  return { currentRMS, isVoiceActive, processRMS, reset };
}
