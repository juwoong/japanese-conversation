/**
 * C2: Session progress save must be wrapped in try-catch.
 *
 * The handleComplete logic will be extracted to src/lib/sessionProgress.ts
 * as a pure async function `saveSessionProgress()` that:
 * - Returns { success: true } on success
 * - Returns { success: false, error } on failure (does NOT throw)
 * - Skips progress update when isReview=true
 */

describe("C2: Session completion error handling", () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  test("saveSessionProgress module should exist", () => {
    expect(() => require("../lib/sessionProgress")).not.toThrow();
  });

  test("saveSessionProgress should not throw when supabase fails", async () => {
    // Mock supabase to fail
    jest.mock("../lib/supabase", () => ({
      supabase: {
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockRejectedValue(new Error("Network error")),
              }),
            }),
          }),
          upsert: jest.fn().mockRejectedValue(new Error("Network error")),
        }),
      },
    }));

    const { saveSessionProgress } = require("../lib/sessionProgress");
    // Should NOT throw — returns result object instead
    const result = await saveSessionProgress({
      userId: "test-user-id",
      situationId: 1,
      personaId: 1,
      sortOrder: 1,
      accuracies: [0.85],
      isReview: false,
    });

    expect(result).toHaveProperty("success", false);
    expect(result).toHaveProperty("error");
  });

  test("saveSessionProgress should return success:true on normal operation", async () => {
    jest.mock("../lib/supabase", () => ({
      supabase: {
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: { attempt_count: 1, best_accuracy: 0.7 },
                  error: null,
                }),
              }),
            }),
          }),
          upsert: jest.fn().mockResolvedValue({ error: null }),
          update: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ error: null }),
          }),
        }),
      },
    }));

    const { saveSessionProgress } = require("../lib/sessionProgress");
    const result = await saveSessionProgress({
      userId: "test-user-id",
      situationId: 1,
      personaId: 1,
      sortOrder: 1,
      accuracies: [0.85, 0.9],
      isReview: false,
    });

    expect(result.success).toBe(true);
  });

  test("saveSessionProgress should skip DB writes when isReview=true", async () => {
    const mockFrom = jest.fn();
    jest.mock("../lib/supabase", () => ({
      supabase: { from: mockFrom },
    }));

    const { saveSessionProgress } = require("../lib/sessionProgress");
    await saveSessionProgress({
      userId: "test-user-id",
      situationId: 1,
      personaId: 1,
      sortOrder: 1,
      accuracies: [],
      isReview: true,
    });

    expect(mockFrom).not.toHaveBeenCalled();
  });
});
