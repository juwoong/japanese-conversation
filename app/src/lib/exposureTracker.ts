/**
 * exposureTracker — tracks per-word exposure count and determines
 * safety net behavior (progressive retreat of Korean meaning).
 *
 * Uses AsyncStorage for local persistence.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "exposure_records";

export interface ExposureRecord {
  word: string;
  exposureCount: number;
  lastExposedAt: string;
  safetyNetTaps: number;
  recognizedWithoutAudio: boolean;
}

export type SafetyNetBehavior = "immediate" | "audio_first" | "emoji_hint";

/**
 * 1-5 exposures: show Korean meaning immediately (3s fade)
 * 6-10 exposures: TTS first, Korean after 3s delay, then 3s fade
 * 11+: emoji hint first, Korean on 2nd tap, then 3s fade
 */
export function getSafetyNetBehavior(exposureCount: number): SafetyNetBehavior {
  if (exposureCount <= 5) return "immediate";
  if (exposureCount <= 10) return "audio_first";
  return "emoji_hint";
}

// In-memory cache to avoid repeated AsyncStorage reads
let cache: Map<string, ExposureRecord> | null = null;

async function loadAll(): Promise<Map<string, ExposureRecord>> {
  if (cache) return cache;
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (raw) {
    try {
      const records: ExposureRecord[] = JSON.parse(raw);
      cache = new Map(records.map((r) => [r.word, r]));
    } catch {
      cache = new Map();
    }
  } else {
    cache = new Map();
  }
  return cache;
}

async function persist(): Promise<void> {
  if (!cache) return;
  const records = Array.from(cache.values());
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

function defaultRecord(word: string): ExposureRecord {
  return {
    word,
    exposureCount: 0,
    lastExposedAt: new Date().toISOString(),
    safetyNetTaps: 0,
    recognizedWithoutAudio: false,
  };
}

export async function getExposure(word: string): Promise<ExposureRecord> {
  const map = await loadAll();
  return map.get(word) ?? defaultRecord(word);
}

export async function recordExposure(word: string): Promise<void> {
  const map = await loadAll();
  const record = map.get(word) ?? defaultRecord(word);
  record.exposureCount += 1;
  record.lastExposedAt = new Date().toISOString();
  map.set(word, record);
  await persist();
}

export async function recordSafetyNetTap(word: string): Promise<void> {
  const map = await loadAll();
  const record = map.get(word) ?? defaultRecord(word);
  record.safetyNetTaps += 1;
  map.set(word, record);
  await persist();
}
