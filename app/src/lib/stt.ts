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

/**
 * Transcribe audio to text using the Edge Function
 */
export async function transcribeAudio(audioUri: string): Promise<STTResult> {
  const base64 = await audioToBase64(audioUri);

  const { data, error } = await supabase.functions.invoke("transcribe", {
    body: { audio: base64, language: "ja" },
  });

  if (error) {
    throw new Error(`Transcription failed: ${error.message}`);
  }

  return {
    text: data.text || "",
    language: data.language || "ja",
  };
}
