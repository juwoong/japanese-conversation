/**
 * crossSituationTracker — tracks expressions that appear across
 * multiple situations. When an expression appears in 3+ situations,
 * it becomes a "toolkit" expression — a versatile phrase the learner
 * can use in many contexts.
 *
 * Uses AsyncStorage for local persistence.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "cross_situation_entries";

export interface SituationAppearance {
  slug: string;
  role: string;
  emoji: string;
}

export interface CrossSituationEntry {
  expression: string;
  situations: SituationAppearance[];
  isToolkit: boolean; // true if appears in 3+ situations
}

// Known cross-situation expressions for MVP (hardcoded seed data)
const KNOWN_CROSS_EXPRESSIONS: Record<string, SituationAppearance[]> = {
  "すみません": [
    { slug: "airport_pickup", role: "attention", emoji: "\u270B" },
    { slug: "train_station", role: "apology", emoji: "\uD83D\uDE47" },
    { slug: "restaurant", role: "call_staff", emoji: "\uD83D\uDE4B" },
    { slug: "ask_directions", role: "apology", emoji: "\uD83D\uDE4F" },
  ],
  "ありがとうございます": [
    { slug: "airport_pickup", role: "thanks", emoji: "\u2708\uFE0F" },
    { slug: "train_station", role: "thanks", emoji: "\uD83D\uDE83" },
    { slug: "hotel_checkin", role: "thanks", emoji: "\uD83C\uDFE8" },
    { slug: "convenience_store", role: "thanks", emoji: "\uD83C\uDFEA" },
    { slug: "restaurant", role: "thanks", emoji: "\uD83C\uDF5C" },
    { slug: "ask_directions", role: "thanks", emoji: "\u26E9\uFE0F" },
    { slug: "shopping_market", role: "thanks", emoji: "\uD83D\uDECD\uFE0F" },
    { slug: "taxi", role: "thanks", emoji: "\uD83C\uDD98" },
  ],
  "おねがいします": [
    { slug: "convenience_store", role: "request", emoji: "\uD83C\uDFEA" },
    { slug: "hotel_checkin", role: "request", emoji: "\uD83C\uDFE8" },
    { slug: "restaurant", role: "request", emoji: "\uD83C\uDF5C" },
  ],
};

// In-memory cache
let cache: Map<string, CrossSituationEntry> | null = null;

async function loadAll(): Promise<Map<string, CrossSituationEntry>> {
  if (cache) return cache;
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (raw) {
    const entries: CrossSituationEntry[] = JSON.parse(raw);
    cache = new Map(entries.map((e) => [e.expression, e]));
  } else {
    // Seed with known cross-situation expressions
    cache = new Map();
    for (const [expression, situations] of Object.entries(KNOWN_CROSS_EXPRESSIONS)) {
      cache.set(expression, {
        expression,
        situations,
        isToolkit: situations.length >= 3,
      });
    }
    await persist();
  }
  return cache;
}

async function persist(): Promise<void> {
  if (!cache) return;
  const entries = Array.from(cache.values());
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

/**
 * Record an expression appearance in a situation.
 * Adds the situation to the expression's list if not already present.
 */
export async function recordCrossSituation(
  expression: string,
  situationSlug: string,
  role: string,
  emoji: string
): Promise<void> {
  const map = await loadAll();
  const existing = map.get(expression) ?? {
    expression,
    situations: [],
    isToolkit: false,
  };

  // Don't duplicate
  const alreadyRecorded = existing.situations.some(
    (s) => s.slug === situationSlug
  );
  if (!alreadyRecorded) {
    existing.situations.push({ slug: situationSlug, role, emoji });
    existing.isToolkit = existing.situations.length >= 3;
    map.set(expression, existing);
    await persist();
  }
}

/**
 * Get all cross-situation entries for an expression.
 */
export async function getCrossSituations(
  expression: string
): Promise<CrossSituationEntry | null> {
  const map = await loadAll();
  return map.get(expression) ?? null;
}

/**
 * Get all toolkit expressions (appearing in 3+ situations).
 */
export async function getToolkitExpressions(): Promise<CrossSituationEntry[]> {
  const map = await loadAll();
  return Array.from(map.values()).filter((e) => e.isToolkit);
}

/**
 * Get total number of tracked expressions.
 */
export async function getTrackedCount(): Promise<number> {
  const map = await loadAll();
  return map.size;
}
