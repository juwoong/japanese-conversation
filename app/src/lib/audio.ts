/**
 * Audio utilities for recording and playback
 */

import { Audio } from "expo-av";
import * as FileSystem from "expo-file-system";

export interface RecordingResult {
  uri: string;
  duration: number;
}

export interface RecordingStatus {
  durationMillis: number;
  metering: number | undefined; // dBFS value (-160 to 0, where 0 is max)
  isRecording: boolean;
}

let recording: Audio.Recording | null = null;

/**
 * Request microphone permissions
 */
export async function requestPermissions(): Promise<boolean> {
  const { granted } = await Audio.requestPermissionsAsync();
  return granted;
}

/**
 * Start audio recording
 */
export async function startRecording(): Promise<void> {
  try {
    // Clean up any existing recording first
    if (recording) {
      try {
        await recording.stopAndUnloadAsync();
      } catch {
        // Ignore errors from cleanup
      }
      recording = null;
    }

    // Request permissions if needed
    const hasPermission = await requestPermissions();
    if (!hasPermission) {
      throw new Error("Microphone permission not granted");
    }

    // Configure audio mode for recording
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
    });

    // Create and start recording with metering enabled
    const { recording: newRecording } = await Audio.Recording.createAsync(
      {
        ...Audio.RecordingOptionsPresets.HIGH_QUALITY,
        isMeteringEnabled: true,
      }
    );

    recording = newRecording;
  } catch (error) {
    console.error("Failed to start recording:", error);
    throw error;
  }
}

/**
 * Stop recording and return the audio file
 */
export async function stopRecording(): Promise<RecordingResult | null> {
  if (!recording) {
    return null;
  }

  try {
    await recording.stopAndUnloadAsync();

    // Reset audio mode
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
    });

    const status = await recording.getStatusAsync();
    const uri = recording.getURI();

    recording = null;

    if (!uri) {
      return null;
    }

    return {
      uri,
      duration: status.durationMillis || 0,
    };
  } catch (error) {
    console.error("Failed to stop recording:", error);
    recording = null;
    throw error;
  }
}

/**
 * Get current recording status including metering
 */
export async function getRecordingStatus(): Promise<RecordingStatus | null> {
  if (!recording) {
    return null;
  }

  try {
    const status = await recording.getStatusAsync();
    return {
      durationMillis: status.durationMillis || 0,
      metering: status.metering,
      isRecording: status.isRecording || false,
    };
  } catch {
    return null;
  }
}

/**
 * Cancel current recording
 */
export async function cancelRecording(): Promise<void> {
  if (!recording) {
    return;
  }

  try {
    await recording.stopAndUnloadAsync();
  } catch (error) {
    console.error("Failed to cancel recording:", error);
  } finally {
    recording = null;
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
    });
  }
}

/**
 * Convert audio file to base64
 */
export async function audioToBase64(uri: string): Promise<string> {
  const base64 = await FileSystem.readAsStringAsync(uri, {
    encoding: "base64" as const,
  });
  return base64;
}

/**
 * Play audio from text using TTS
 */
export async function playTTS(text: string, language: string = "ja-JP"): Promise<void> {
  // Note: expo-speech is imported in the component that uses it
  // This function is a placeholder for potential future enhancements
  throw new Error("Use expo-speech directly for TTS");
}
