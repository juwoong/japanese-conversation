import { supabase } from "./supabase";

/** Returns today's date as YYYY-MM-DD in the device's local timezone. */
export function getLocalDateString(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

interface SaveProgressParams {
  userId: string;
  situationId: number;
  personaId: number;
  sortOrder: number;
  accuracies: number[];
  isReview: boolean;
}

type SaveResult =
  | { success: true }
  | { success: false; error: unknown };

export async function saveSessionProgress(
  params: SaveProgressParams
): Promise<SaveResult> {
  const { userId, situationId, personaId, sortOrder, accuracies, isReview } =
    params;

  if (isReview) {
    return { success: true };
  }

  try {
    const { data: existing } = await supabase
      .from("user_situation_progress")
      .select("attempt_count, best_accuracy")
      .eq("user_id", userId)
      .eq("situation_id", situationId)
      .single();

    const sessionAvg =
      accuracies.length > 0
        ? accuracies.reduce((a, b) => a + b, 0) / accuracies.length
        : 0;

    const prevBest = existing?.best_accuracy ?? 0;
    const newBest = Math.max(prevBest, sessionAvg);
    const newAttemptCount = (existing?.attempt_count ?? 0) + 1;

    await supabase.from("user_situation_progress").upsert({
      user_id: userId,
      situation_id: situationId,
      status: "completed",
      completed_at: new Date().toISOString(),
      attempt_count: newAttemptCount,
      best_accuracy: newBest,
    }, { onConflict: 'user_id,situation_id' });

    // Unlock next situation
    const { data: nextSituation } = await supabase
      .from("situations")
      .select("id")
      .eq("persona_id", personaId)
      .gt("sort_order", sortOrder)
      .order("sort_order")
      .limit(1)
      .single();

    if (nextSituation) {
      await supabase.from("user_situation_progress").upsert({
        user_id: userId,
        situation_id: nextSituation.id,
        status: "available",
      }, { onConflict: 'user_id,situation_id' });
    }

    // Update level based on completed count
    const { count } = await supabase
      .from("user_situation_progress")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("status", "completed");

    const completed = count ?? 0;
    let level = 1;
    if (completed >= 15) level = 5;
    else if (completed >= 10) level = 4;
    else if (completed >= 7) level = 3;
    else if (completed >= 3) level = 2;

    await supabase
      .from("profiles")
      .update({ current_level: level })
      .eq("id", userId);

    return { success: true };
  } catch (error) {
    return { success: false, error };
  }
}
