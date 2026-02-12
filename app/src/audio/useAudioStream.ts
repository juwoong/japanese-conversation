/**
 * Real-time audio stream hook using react-native-audio-api AudioRecorder.
 * Provides Float32Array PCM buffers via onAudioReady callback.
 */

import { useRef, useCallback } from "react";
import { AudioRecorder, AudioManager } from "react-native-audio-api";
import { AUDIO_CONFIG } from "./pitchConfig";

export interface AudioStreamCallbacks {
  onAudioData: (float32: Float32Array) => void;
}

export function useAudioStream() {
  const recorderRef = useRef<AudioRecorder | null>(null);
  const isStreamingRef = useRef(false);

  const startStream = useCallback(async (callbacks: AudioStreamCallbacks) => {
    if (isStreamingRef.current) return;

    // Request mic permission
    const permission = await AudioManager.requestRecordingPermissions();
    if (permission !== "Granted") {
      throw new Error("Microphone permission not granted");
    }

    const recorder = new AudioRecorder();
    recorderRef.current = recorder;

    // Register real-time audio callback
    const result = recorder.onAudioReady(
      {
        sampleRate: AUDIO_CONFIG.sampleRate,
        bufferLength: Math.round(AUDIO_CONFIG.sampleRate * AUDIO_CONFIG.bufferLengthSec),
        channelCount: AUDIO_CONFIG.channels,
      },
      (event) => {
        // event.buffer is AudioBuffer, getChannelData(0) returns Float32Array
        const float32 = event.buffer.getChannelData(0);
        callbacks.onAudioData(float32);
      },
    );

    if (result.status === "error") {
      throw new Error(`AudioRecorder.onAudioReady failed: ${result.message}`);
    }

    // Start recording (no file output needed, just streaming)
    const startResult = recorder.start();
    if (startResult.status === "error") {
      throw new Error(`AudioRecorder.start failed: ${startResult.message}`);
    }

    isStreamingRef.current = true;
  }, []);

  const stopStream = useCallback(() => {
    if (recorderRef.current) {
      try {
        recorderRef.current.stop();
        recorderRef.current.clearOnAudioReady();
      } catch {
        // Ignore cleanup errors
      }
      recorderRef.current = null;
    }
    isStreamingRef.current = false;
  }, []);

  return { startStream, stopStream, isStreaming: isStreamingRef };
}
