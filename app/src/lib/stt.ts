/**
 * Speech-to-Text using OpenAI Whisper API
 */

const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY;

export interface STTResult {
  text: string;
  language: string;
}

/**
 * Transcribe audio to text using Whisper API
 */
export async function transcribeAudio(audioUri: string): Promise<STTResult> {
  if (!OPENAI_API_KEY) {
    throw new Error("OpenAI API key not configured");
  }

  // Read file and create form data
  const response = await fetch(audioUri);
  const blob = await response.blob();

  const formData = new FormData();
  formData.append("file", {
    uri: audioUri,
    type: "audio/m4a",
    name: "recording.m4a",
  } as any);
  formData.append("model", "whisper-1");
  formData.append("language", "ja"); // Japanese

  const result = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: formData,
  });

  if (!result.ok) {
    const error = await result.text();
    throw new Error(`Whisper API error: ${error}`);
  }

  const data = await result.json();

  return {
    text: data.text || "",
    language: "ja",
  };
}
