/**
 * Speech-to-Text via OpenAI Whisper API (direct call)
 */

import * as FileSystem from "expo-file-system/legacy";

export interface STTResult {
  text: string;
  language: string;
}

export type STTErrorType = "network" | "no_speech" | "server" | "unknown";

export class STTError extends Error {
  type: STTErrorType;

  constructor(message: string, type: STTErrorType) {
    super(message);
    this.type = type;
    this.name = "STTError";
  }

  get userMessage(): string {
    switch (this.type) {
      case "network":
        return "네트워크 연결을 확인해주세요.";
      case "no_speech":
        return "음성이 감지되지 않았습니다. 더 크게 말해보세요.";
      case "server":
        return "서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.";
      default:
        return "음성 인식 중 오류가 발생했습니다.";
    }
  }
}

const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY || "";

/**
 * Transcribe audio to text using Whisper API directly.
 *
 * @param audioUri - File URI of the recorded audio
 * @param expectedText - Optional expected text. Passed as Whisper `prompt`
 *   parameter to bias script choice (kanji vs kana) and improve accuracy
 *   for scripted practice scenarios.
 */
export async function transcribeAudio(
  audioUri: string,
  expectedText?: string,
): Promise<STTResult> {
  if (!OPENAI_API_KEY) {
    throw new STTError("OpenAI API key not configured", "server");
  }

  try {
    const fileInfo = await FileSystem.getInfoAsync(audioUri);
    if (!fileInfo.exists) {
      throw new STTError("Audio file not found", "unknown");
    }

    const formData = new FormData();
    formData.append("file", {
      uri: audioUri,
      type: "audio/m4a",
      name: "audio.m4a",
    } as any);
    formData.append("model", "whisper-1");
    formData.append("language", "ja");
    formData.append("response_format", "json");
    if (expectedText) {
      formData.append("prompt", expectedText);
    }

    const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Whisper API error:", response.status, errorText);
      throw new STTError(`Whisper API error: ${response.status}`, "server");
    }

    const result = await response.json();
    const text = result.text || "";

    if (!text.trim()) {
      throw new STTError("No speech detected", "no_speech");
    }

    return { text, language: "ja" };
  } catch (err: any) {
    if (err instanceof STTError) throw err;

    if (err.message?.includes("fetch") || err.message?.includes("network") || err.message?.includes("Network")) {
      throw new STTError(err.message, "network");
    }
    throw new STTError(err.message || "Unknown error", "unknown");
  }
}
