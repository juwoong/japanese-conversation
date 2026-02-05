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
    // Build a chainable mock that handles arbitrary supabase query chains
    const chainable = (): any => {
      const fn: any = jest.fn().mockImplementation(() => fn);
      fn.select = jest.fn().mockReturnValue(fn);
      fn.eq = jest.fn().mockReturnValue(fn);
      fn.gt = jest.fn().mockReturnValue(fn);
      fn.order = jest.fn().mockReturnValue(fn);
      fn.limit = jest.fn().mockReturnValue(fn);
      fn.single = jest.fn().mockResolvedValue({
        data: { attempt_count: 1, best_accuracy: 0.7 },
        error: null,
      });
      fn.upsert = jest.fn().mockResolvedValue({ error: null });
      fn.update = jest.fn().mockReturnValue(fn);
      // count query returns { count }
      fn.then = undefined; // not a thenable by default
      return fn;
    };
    const mockChain = chainable();
    // Override select with count option to resolve with count
    const origSelect = mockChain.select;
    mockChain.select = jest.fn().mockImplementation((_fields: any, opts: any) => {
      if (opts?.count) {
        const countChain = chainable();
        countChain.eq = jest.fn().mockReturnValue(countChain);
        // make it resolve directly (head:true returns { count })
        (countChain as any).then = (resolve: any) =>
          resolve({ count: 3, error: null });
        return countChain;
      }
      return origSelect(_fields);
    });

    jest.mock("../lib/supabase", () => ({
      supabase: {
        from: jest.fn().mockReturnValue(mockChain),
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
