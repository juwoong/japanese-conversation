/**
 * sessionResume.ts — Mid-session exit recovery + progress save.
 *
 * Saves a lightweight snapshot of the current session to AsyncStorage
 * so the user can resume where they left off after backgrounding the app
 * or force-quitting.
 *
 * Recovery message uses travel narrative tone.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import type { SessionPhase, SessionMode } from "../types";

const STORAGE_PREFIX = "session_snapshot_";

// --- Types ---

export interface SessionSnapshot {
  situationId: number;
  phase: SessionPhase;
  activityIndex: number;
  turnNumber: number;
  inputMode: SessionMode;
  visitCount: number;
  savedAt: string; // ISO 8601
}

// --- Phase display names (travel narrative) ---

const PHASE_LABELS: Record<SessionPhase, string> = {
  watch: "대화 보기",
  catch: "표현 따라잡기",
  engage: "직접 대화",
  review: "정리",
};

// --- Public API ---

/**
 * Save a session snapshot for the given situation.
 * Overwrites any previous snapshot for the same situationId.
 */
export async function saveSessionSnapshot(snapshot: SessionSnapshot): Promise<void> {
  const key = STORAGE_PREFIX + snapshot.situationId;
  await AsyncStorage.setItem(key, JSON.stringify(snapshot));
}

/**
 * Load a previously saved snapshot for the given situation.
 * Returns null if nothing is saved.
 */
export async function loadSessionSnapshot(situationId: number): Promise<SessionSnapshot | null> {
  const key = STORAGE_PREFIX + situationId;
  const raw = await AsyncStorage.getItem(key);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as SessionSnapshot;
  } catch {
    // Corrupted data — clean up and return null
    await AsyncStorage.removeItem(key);
    return null;
  }
}

/**
 * Clear the saved snapshot for a situation (e.g. after successful resume or completion).
 */
export async function clearSessionSnapshot(situationId: number): Promise<void> {
  const key = STORAGE_PREFIX + situationId;
  await AsyncStorage.removeItem(key);
}

/**
 * Generate a user-facing resume prompt message.
 * Example: "지난번에 편의점에서 직접 대화하고 있었어요. 이어서 할까요?"
 */
export async function getResumeMessage(
  snapshot: SessionSnapshot,
  situationName: string,
): Promise<string> {
  const phaseLabel = PHASE_LABELS[snapshot.phase];
  return `지난번에 ${situationName}에서 ${phaseLabel}하고 있었어요. 이어서 할까요?`;
}

/**
 * Returns true if the snapshot is older than maxHours (default 24).
 * Stale snapshots should prompt "처음부터 하기" instead of resume.
 */
export function isSnapshotStale(snapshot: SessionSnapshot, maxHours: number = 24): boolean {
  const savedTime = new Date(snapshot.savedAt).getTime();
  const now = Date.now();
  const diffHours = (now - savedTime) / (1000 * 60 * 60);
  return diffHours > maxHours;
}
