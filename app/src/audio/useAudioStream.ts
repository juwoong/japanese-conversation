/**
 * Real-time audio stream hook using react-native-audio-api AudioRecorder.
 * Provides Float32Array PCM buffers via onAudioReady callback.
 */

import { useRef, useCallback } from "react";
import { AUDIO_CONFIG } from "./pitchConfig";

export interface AudioStreamCallbacks {
  onAudioData: (float32: Float32Array) => void;
}

type AudioApiModule = typeof import("react-native-audio-api");
type AudioRecorderClass = AudioApiModule["AudioRecorder"];
type AudioRecorderInstance = InstanceType<AudioRecorderClass>;
type AudioManagerInstance = AudioApiModule["AudioManager"];

let audioRecorderCtor: AudioRecorderClass | null = null;
let audioManagerSingleton: AudioManagerInstance | null = null;
let audioApiLoadError: Error | null = null;

function loadAudioApi() {
  if (audioRecorderCtor && audioManagerSingleton) {
    return { AudioRecorder: audioRecorderCtor, AudioManager: audioManagerSingleton };
  }

  if (audioApiLoadError) {
    throw audioApiLoadError;
  }

  try {
    const audioApi = require("react-native-audio-api") as AudioApiModule;
    audioRecorderCtor = audioApi.AudioRecorder;
    audioManagerSingleton = audioApi.AudioManager;
    return { AudioRecorder: audioRecorderCtor!, AudioManager: audioManagerSingleton! };
  } catch (error) {
    const details = error instanceof Error ? error.message : String(error);
    audioApiLoadError = new Error(
      [
        "react-native-audio-api native module is unavailable.",
        "Expo Go does not bundle this module. Build or reinstall your dev client (e.g. run `npx expo prebuild` then `npx expo run:android`/`run:ios`).",
        `Original error: ${details}`,
      ].join("\n"),
    );
    throw audioApiLoadError;
  }
}

export function useAudioStream() {
  const recorderRef = useRef<AudioRecorderInstance | null>(null);
  const isStreamingRef = useRef(false);

  const startStream = useCallback(async (callbacks: AudioStreamCallbacks) => {
    if (isStreamingRef.current) return;

    const { AudioRecorder: AudioRecorderCtor, AudioManager } = loadAudioApi();

    // Request mic permission
    const permission = await AudioManager.requestRecordingPermissions();
    if (permission !== "Granted") {
      throw new Error("Microphone permission not granted");
    }

    const recorder = new AudioRecorderCtor();
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
