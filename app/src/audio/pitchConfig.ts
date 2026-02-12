/**
 * Pitch detection pipeline configuration.
 * Parameters validated by TTS/STT Expert for Japanese speech.
 */

// --- Audio Capture (react-native-audio-api) ---
export const AUDIO_CONFIG = {
  sampleRate: 16000,
  channels: 1,
  /** Buffer length in seconds for AudioRecorder callback */
  bufferLengthSec: 0.128, // 2048 samples @ 16kHz
} as const;

// --- Pitch Detection (pitchy) ---
export const PITCH_CONFIG = {
  windowSize: 1024, // 64ms @ 16kHz — captures ~4.8 periods at 75Hz
  hopSize: 512, // 32ms — ~31 pitch points/sec
  confidenceThreshold: 0.9,
  minFrequencyHz: 75, // male lower bound
  maxFrequencyHz: 500, // female upper bound (emphatic)
} as const;

// --- Noise Gate ---
export const NOISE_GATE_CONFIG = {
  rmsThreshold: 0.01, // ~-40 dBFS
} as const;

// --- Semitone Conversion ---
export const SEMITONE_CONFIG = {
  refHz: 220, // A3 — midpoint of male/female Japanese speech
} as const;

// --- Types ---
export interface PitchPoint {
  timeMs: number;
  semitone: number | null;
  hz: number | null;
  clarity: number;
  rms: number;
}
