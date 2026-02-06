/**
 * Speech-to-Text via Supabase Edge Function (proxies to Whisper API)
 * API key stays server-side, not exposed in client bundle.
 */

import { supabase } from "./supabase";
import { audioToBase64 } from "./audio";

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

/**
 * Transcribe audio to text using the Edge Function
 */
export async function transcribeAudio(audioUri: string): Promise<STTResult> {
  let base64: string;
  try {
    base64 = await audioToBase64(audioUri);
  } catch (err) {
    throw new STTError("Failed to process audio file", "unknown");
  }

  let data: any;
  let error: any;
  try {
    const result = await supabase.functions.invoke("transcribe", {
      body: { audio: base64, language: "ja" },
    });
    data = result.data;
    error = result.error;
  } catch (err: any) {
    // Network error
    if (err.message?.includes("fetch") || err.message?.includes("network")) {
      throw new STTError(err.message, "network");
    }
    throw new STTError(err.message || "Unknown error", "unknown");
  }

  if (error) {
    if (error.message?.includes("network") || error.message?.includes("fetch")) {
      throw new STTError(error.message, "network");
    }
    throw new STTError(error.message, "server");
  }

  const text = data?.text || "";

  // Empty result likely means no speech detected
  if (!text.trim()) {
    throw new STTError("No speech detected", "no_speech");
  }

  return {
    text,
    language: data?.language || "ja",
  };
}
