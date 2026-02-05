/**
 * C1: FlashcardScreen must update SRS cards when user self-grades.
 *
 * A new function `gradeFlashcard(cardId, rating)` will be created
 * in src/lib/flashcardGrading.ts that:
 * - Fetches the SRS card by ID
 * - Runs FSRS schedule()
 * - Upserts the updated card back to DB
 */

import { schedule, createCard, type Rating } from "../lib/fsrs";

describe("C1: Flashcard self-grading with SRS update", () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  test("gradeFlashcard module should exist", () => {
    expect(() => require("../lib/flashcardGrading")).not.toThrow();
  });

  test("gradeFlashcard should fetch card, schedule, and upsert", async () => {
    const mockUpsert = jest.fn().mockResolvedValue({ error: null });
    const mockSingle = jest.fn().mockResolvedValue({
      data: {
        id: 1, stability: 2.4, difficulty: 4.93,
        elapsed_days: 0, scheduled_days: 1, reps: 1,
        lapses: 0, state: "learning",
        due_date: "2026-02-05", last_review: "2026-02-04T00:00:00Z",
      },
      error: null,
    });

    jest.mock("../lib/supabase", () => ({
      supabase: {
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: mockSingle,
            }),
          }),
          upsert: mockUpsert,
        }),
      },
    }));

    const { gradeFlashcard } = require("../lib/flashcardGrading");
    await gradeFlashcard(1, 3 as Rating);

    expect(mockUpsert).toHaveBeenCalled();
    const arg = mockUpsert.mock.calls[0][0];
    expect(arg).toHaveProperty("stability");
    expect(arg).toHaveProperty("due_date");
    expect(arg.reps).toBe(2);
  });

  test("gradeFlashcard with Again(1) should increase lapses", async () => {
    const mockUpsert = jest.fn().mockResolvedValue({ error: null });
    jest.mock("../lib/supabase", () => ({
      supabase: {
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: {
                  id: 1, stability: 2.4, difficulty: 4.93,
                  elapsed_days: 5, scheduled_days: 5, reps: 3,
                  lapses: 0, state: "review",
                  due_date: "2026-02-05", last_review: "2026-01-31T00:00:00Z",
                },
                error: null,
              }),
            }),
          }),
          upsert: mockUpsert,
        }),
      },
    }));

    const { gradeFlashcard } = require("../lib/flashcardGrading");
    await gradeFlashcard(1, 1 as Rating);

    const arg = mockUpsert.mock.calls[0][0];
    expect(arg.state).toBe("relearning");
    expect(arg.lapses).toBe(1);
  });

  // Pure FSRS test — this should pass without any implementation
  test("FSRS: Easy(4) should schedule further out than Good(3)", () => {
    const card = createCard();
    const { card: afterGood } = schedule(card, 3);
    const { card: afterEasy } = schedule(card, 4);
    expect(afterEasy.scheduledDays).toBeGreaterThanOrEqual(afterGood.scheduledDays);
  });
});
