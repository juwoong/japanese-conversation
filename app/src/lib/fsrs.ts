/**
 * FSRS (Free Spaced Repetition Scheduler) Implementation
 *
 * Simplified version of the FSRS algorithm for the Japanese conversation app.
 * Based on FSRS-4.5 algorithm.
 */

export type State = "new" | "learning" | "review" | "relearning";
export type Rating = 1 | 2 | 3 | 4; // Again, Hard, Good, Easy

export interface Card {
  due: Date;
  stability: number;
  difficulty: number;
  elapsedDays: number;
  scheduledDays: number;
  reps: number;
  lapses: number;
  state: State;
  lastReview: Date | null;
}

export interface ReviewLog {
  rating: Rating;
  state: State;
  due: Date;
  stability: number;
  difficulty: number;
  elapsedDays: number;
  lastElapsedDays: number;
  scheduledDays: number;
  review: Date;
}

// FSRS-4.5 default parameters
const FSRS_PARAMS = {
  w: [
    0.4, 0.6, 2.4, 5.8, // initial stability
    4.93, 0.94, 0.86, 0.01, // difficulty
    1.49, 0.14, 0.94, // stability after lapse
    2.18, 0.05, 0.34, 1.26, // stability increase
    0.29, 2.61, // difficulty adjustment
  ],
  requestRetention: 0.9,
  maximumInterval: 36500, // 100 years
  easyBonus: 1.3,
  hardInterval: 1.2,
};

/**
 * Create a new empty card
 */
export function createCard(): Card {
  return {
    due: new Date(),
    stability: 0,
    difficulty: 0,
    elapsedDays: 0,
    scheduledDays: 0,
    reps: 0,
    lapses: 0,
    state: "new",
    lastReview: null,
  };
}

/**
 * Calculate initial stability based on rating
 */
function initStability(rating: Rating): number {
  const w = FSRS_PARAMS.w;
  return Math.max(w[rating - 1], 0.1);
}

/**
 * Calculate initial difficulty based on rating
 */
function initDifficulty(rating: Rating): number {
  const w = FSRS_PARAMS.w;
  return constrainDifficulty(w[4] - Math.exp(w[5] * (rating - 1)) + 1);
}

/**
 * Constrain difficulty to valid range [1, 10]
 */
function constrainDifficulty(d: number): number {
  return Math.min(Math.max(d, 1), 10);
}

/**
 * Calculate next difficulty based on current difficulty and rating
 */
function nextDifficulty(d: number, rating: Rating): number {
  const w = FSRS_PARAMS.w;
  const newD = d - w[6] * (rating - 3);
  return constrainDifficulty(meanReversion(w[4], newD));
}

/**
 * Mean reversion formula
 */
function meanReversion(init: number, current: number): number {
  const w = FSRS_PARAMS.w;
  return w[7] * init + (1 - w[7]) * current;
}

/**
 * Calculate next stability for short-term scheduling (learning/relearning)
 */
function shortTermStability(s: number, rating: Rating): number {
  const w = FSRS_PARAMS.w;
  return s * Math.exp(w[17] * (rating - 3 + w[18]));
}

/**
 * Calculate next stability for long-term scheduling (review)
 */
function nextStability(d: number, s: number, r: number, rating: Rating): number {
  const w = FSRS_PARAMS.w;
  const hardPenalty = rating === 2 ? w[15] : 1;
  const easyBonus = rating === 4 ? w[16] : 1;

  return (
    s *
    (1 +
      Math.exp(w[8]) *
        (11 - d) *
        Math.pow(s, -w[9]) *
        (Math.exp((1 - r) * w[10]) - 1) *
        hardPenalty *
        easyBonus)
  );
}

/**
 * Calculate stability after a lapse (forgetting)
 */
function forgetStability(d: number, s: number, r: number): number {
  const w = FSRS_PARAMS.w;
  return (
    w[11] *
    Math.pow(d, -w[12]) *
    (Math.pow(s + 1, w[13]) - 1) *
    Math.exp((1 - r) * w[14])
  );
}

/**
 * Calculate interval from stability
 */
function nextInterval(s: number): number {
  const interval = (s / FSRS_PARAMS.requestRetention) * 9 * (1 / (1 - FSRS_PARAMS.requestRetention) - 1);
  return Math.min(Math.max(Math.round(interval), 1), FSRS_PARAMS.maximumInterval);
}

/**
 * Calculate retrievability (probability of recall)
 */
export function retrievability(s: number, elapsedDays: number): number {
  return Math.pow(1 + elapsedDays / (9 * s), -1);
}

/**
 * Schedule next review based on rating
 */
export function schedule(card: Card, rating: Rating, now: Date = new Date()): { card: Card; log: ReviewLog } {
  const lastReview = card.lastReview || now;
  const elapsedDays = Math.max(
    0,
    Math.floor((now.getTime() - lastReview.getTime()) / (1000 * 60 * 60 * 24))
  );

  let newCard: Card = { ...card };
  newCard.lastReview = now;
  newCard.reps++;

  if (card.state === "new") {
    // First review
    newCard.difficulty = initDifficulty(rating);
    newCard.stability = initStability(rating);

    if (rating === 1) {
      newCard.state = "learning";
      newCard.scheduledDays = 0;
    } else if (rating === 2) {
      newCard.state = "learning";
      newCard.scheduledDays = 1;
    } else {
      newCard.state = "review";
      newCard.scheduledDays = nextInterval(newCard.stability);
    }
  } else if (card.state === "learning" || card.state === "relearning") {
    // Short-term scheduling
    newCard.difficulty = nextDifficulty(card.difficulty, rating);

    if (rating === 1) {
      newCard.stability = initStability(1);
      newCard.scheduledDays = 0;
      newCard.lapses++;
      newCard.state = "relearning";
    } else if (rating === 2) {
      newCard.stability = shortTermStability(card.stability, rating);
      newCard.scheduledDays = 1;
    } else {
      newCard.stability = shortTermStability(card.stability, rating);
      newCard.scheduledDays = nextInterval(newCard.stability);
      newCard.state = "review";
    }
  } else {
    // Review state - long-term scheduling
    const r = retrievability(card.stability, elapsedDays);
    newCard.difficulty = nextDifficulty(card.difficulty, rating);
    newCard.elapsedDays = elapsedDays;

    if (rating === 1) {
      newCard.stability = forgetStability(card.difficulty, card.stability, r);
      newCard.scheduledDays = 0;
      newCard.lapses++;
      newCard.state = "relearning";
    } else {
      newCard.stability = nextStability(card.difficulty, card.stability, r, rating);
      newCard.scheduledDays = nextInterval(newCard.stability);
    }
  }

  // Calculate due date
  const dueDate = new Date(now);
  dueDate.setDate(dueDate.getDate() + newCard.scheduledDays);
  newCard.due = dueDate;

  const log: ReviewLog = {
    rating,
    state: card.state,
    due: newCard.due,
    stability: newCard.stability,
    difficulty: newCard.difficulty,
    elapsedDays,
    lastElapsedDays: card.elapsedDays,
    scheduledDays: newCard.scheduledDays,
    review: now,
  };

  return { card: newCard, log };
}

/**
 * Get cards due for review
 */
export function isDue(card: Card, now: Date = new Date()): boolean {
  return card.due <= now;
}

/**
 * Calculate accuracy-based rating
 */
export function getRatingFromAccuracy(accuracy: number): Rating {
  if (accuracy >= 0.95) return 4; // Easy
  if (accuracy >= 0.8) return 3; // Good
  if (accuracy >= 0.5) return 2; // Hard
  return 1; // Again
}
