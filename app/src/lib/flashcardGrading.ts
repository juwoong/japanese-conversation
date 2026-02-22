import { supabase } from "./supabase";
import { schedule, createCard, type Card, type Rating, type State } from "./fsrs";
import type { TurnRecord } from "../types";

/**
 * Grade a flashcard and update its SRS schedule in the database.
 * Fetches the card, runs FSRS schedule(), and upserts the result.
 */
export async function gradeFlashcard(
  cardId: number,
  rating: Rating
): Promise<void> {
  const { data, error } = await supabase
    .from("srs_cards")
    .select("*")
    .eq("id", cardId)
    .single();

  if (error || !data) {
    throw new Error(`Card ${cardId} not found`);
  }

  // Convert DB row (snake_case) to FSRS Card (camelCase)
  const card: Card = {
    due: new Date(data.due_date),
    stability: data.stability,
    difficulty: data.difficulty,
    elapsedDays: data.elapsed_days,
    scheduledDays: data.scheduled_days,
    reps: data.reps,
    lapses: data.lapses,
    state: data.state as State,
    lastReview: data.last_review ? new Date(data.last_review) : null,
  };

  const { card: updated } = schedule(card, rating);

  // Convert back to DB row (snake_case)
  await supabase.from("srs_cards").upsert({
    id: cardId,
    stability: updated.stability,
    difficulty: updated.difficulty,
    elapsed_days: updated.elapsedDays,
    scheduled_days: updated.scheduledDays,
    reps: updated.reps,
    lapses: updated.lapses,
    state: updated.state,
    due_date: updated.due.toISOString(),
    last_review: new Date().toISOString(),
  });
}

/**
 * TurnRecord에서 FSRS Rating을 계산한다.
 * - 피드백 없이 정답 → Easy(4)
 * - 정답이지만 피드백 있음 → Good(3)
 * - 틀렸지만 피드백으로 교정됨 → Hard(2)
 * - 연습 안 함 → null (grading 안 함)
 */
export function turnRecordsToRating(
  records: TurnRecord[]
): Rating | null {
  if (records.length === 0) return null;

  const hadCorrectWithoutFeedback = records.some(
    (r) => r.correct && r.feedbackType === "none"
  );
  const hadCorrectWithFeedback = records.some(
    (r) => r.correct && r.feedbackType !== "none"
  );
  const hadIncorrect = records.some((r) => !r.correct);

  if (hadIncorrect) return 2; // Hard
  if (hadCorrectWithFeedback) return 3; // Good
  if (hadCorrectWithoutFeedback) return 4; // Easy
  return null;
}

/**
 * Engage 세션 완료 후, 각 key expression의 line에 대해 자동으로 FSRS grading을 수행한다.
 * line_id 기반으로 srs_card를 get-or-create 한 뒤 gradeFlashcard를 호출한다.
 */
export async function gradeSessionExpressions(
  turnRecords: TurnRecord[],
  lines: { id: number; text_ja: string; speaker: string }[]
): Promise<void> {
  // key expression별 turn records 그룹핑
  const byExpression = new Map<string, TurnRecord[]>();
  for (const record of turnRecords) {
    const key = record.keyExpressionJa;
    if (!key) continue;
    const existing = byExpression.get(key) ?? [];
    existing.push(record);
    byExpression.set(key, existing);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  for (const [expressionJa, records] of byExpression) {
    const rating = turnRecordsToRating(records);
    if (!rating) continue;

    // text_ja로 line_id 찾기 (exact match — keyExpressionJa는 line.text_ja에서 직접 옴)
    const line = lines.find(
      (l) => l.speaker === "user" && l.text_ja === expressionJa
    );
    if (!line) continue;

    // srs_card get or create
    const { data: existingCard } = await supabase
      .from("srs_cards")
      .select("*")
      .eq("user_id", user.id)
      .eq("line_id", line.id)
      .single();

    const card: Card = existingCard
      ? {
          due: new Date(existingCard.due_date || new Date()),
          stability: existingCard.stability,
          difficulty: existingCard.difficulty,
          elapsedDays: existingCard.elapsed_days,
          scheduledDays: existingCard.scheduled_days,
          reps: existingCard.reps,
          lapses: existingCard.lapses,
          state: existingCard.state as State,
          lastReview: existingCard.last_review
            ? new Date(existingCard.last_review)
            : null,
        }
      : createCard();

    const { card: updated } = schedule(card, rating);

    await supabase.from("srs_cards").upsert(
      {
        id: existingCard?.id,
        user_id: user.id,
        line_id: line.id,
        stability: updated.stability,
        difficulty: updated.difficulty,
        elapsed_days: updated.elapsedDays,
        scheduled_days: updated.scheduledDays,
        reps: updated.reps,
        lapses: updated.lapses,
        state: updated.state,
        due_date: updated.due.toISOString().split("T")[0],
        last_review: updated.lastReview?.toISOString() || null,
      },
      { onConflict: "user_id,line_id" }
    );
  }
}
