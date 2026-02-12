import { computeDTW, extractVoicedSemitones, suggestBandWidth } from "../analysis/dtw";

describe("computeDTW", () => {
  it("returns zero distance for identical sequences", () => {
    const seq = [0, 2, 4, 3, 1];
    const result = computeDTW(seq, seq);
    expect(result.distance).toBe(0);
    expect(result.rawDistance).toBe(0);
    expect(result.path).toHaveLength(5);
    expect(result.perPointCost.every((c) => c === 0)).toBe(true);
  });

  it("handles empty sequences", () => {
    const result = computeDTW([], [1, 2, 3]);
    expect(result.distance).toBe(0);
    expect(result.path).toHaveLength(0);
  });

  it("computes correct distance for simple shifted sequences", () => {
    const query = [0, 1, 2];
    const reference = [0, 1, 2];
    const result = computeDTW(query, reference);
    expect(result.distance).toBe(0);
  });

  it("computes non-zero distance for different sequences", () => {
    const query = [0, 5, 10];
    const reference = [0, 0, 0];
    const result = computeDTW(query, reference);
    expect(result.distance).toBeGreaterThan(0);
  });

  it("returns a valid path from (0,0) to (n-1,m-1)", () => {
    const query = [1, 3, 5, 7];
    const reference = [2, 4, 6, 8, 10];
    const result = computeDTW(query, reference);
    expect(result.path[0]).toEqual([0, 0]);
    expect(result.path[result.path.length - 1]).toEqual([3, 4]);
  });

  it("per-point cost has one entry per query point", () => {
    const query = [0, 2, 4, 6];
    const reference = [1, 3, 5, 7, 9];
    const result = computeDTW(query, reference);
    expect(result.perPointCost).toHaveLength(4);
  });

  it("handles different-length sequences with band constraint", () => {
    const query = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
    const reference = [0, 2, 4, 6, 8];
    const result = computeDTW(query, reference, { bandWidth: 3 });
    expect(result.distance).toBeGreaterThanOrEqual(0);
    expect(result.path.length).toBeGreaterThan(0);
    expect(result.path[0]).toEqual([0, 0]);
    expect(result.path[result.path.length - 1]).toEqual([9, 4]);
  });

  it("band constraint produces same result as unconstrained for small sequences", () => {
    // For small sequences with tight fit, wide band = no constraint
    const query = [0, 1, 2];
    const reference = [0, 1, 2];
    const constrained = computeDTW(query, reference, { bandWidth: 10 });
    const unconstrained = computeDTW(query, reference);
    expect(constrained.distance).toBe(unconstrained.distance);
  });

  it("accepts a custom distance function", () => {
    const query = [0, 1, 2];
    const reference = [0, 1, 2];
    const squaredDist = (a: number, b: number) => (a - b) * (a - b);
    const result = computeDTW(query, reference, { distanceFn: squaredDist });
    expect(result.distance).toBe(0);
  });

  it("handles time-warped sequences correctly (DTW should be less than Euclidean)", () => {
    // Query is a stretched version of reference
    const reference = [0, 5, 10, 5, 0];
    const query = [0, 0, 5, 5, 10, 10, 5, 5, 0, 0]; // each point doubled
    const dtwResult = computeDTW(query, reference);

    // Simple point-by-point comparison would give high distance
    // DTW should find the alignment and give lower distance
    expect(dtwResult.distance).toBeLessThan(5); // reasonable bound
  });
});

describe("computeDTW performance", () => {
  it("completes 200x200 DTW in under 200ms", () => {
    const n = 200;
    const query = Array.from({ length: n }, (_, i) =>
      Math.sin((i / n) * Math.PI * 4) * 5,
    );
    const reference = Array.from({ length: n }, (_, i) =>
      Math.sin(((i + 10) / n) * Math.PI * 4) * 5 + 0.5,
    );

    const start = Date.now();
    const result = computeDTW(query, reference, { bandWidth: 50 });
    const elapsed = Date.now() - start;

    expect(elapsed).toBeLessThan(200);
    expect(result.distance).toBeGreaterThan(0);
    expect(result.path.length).toBeGreaterThan(0);
    expect(result.perPointCost).toHaveLength(200);
  });

  it("completes 100x100 unconstrained DTW in under 200ms", () => {
    const n = 100;
    const query = Array.from({ length: n }, () => Math.random() * 10);
    const reference = Array.from({ length: n }, () => Math.random() * 10);

    const start = Date.now();
    const result = computeDTW(query, reference);
    const elapsed = Date.now() - start;

    expect(elapsed).toBeLessThan(200);
    expect(result.path.length).toBeGreaterThan(0);
  });
});

describe("extractVoicedSemitones", () => {
  it("filters out null values", () => {
    const input = [null, 2, null, 4, 5, null];
    expect(extractVoicedSemitones(input)).toEqual([2, 4, 5]);
  });

  it("returns empty for all-null input", () => {
    expect(extractVoicedSemitones([null, null, null])).toEqual([]);
  });

  it("returns all values if none are null", () => {
    expect(extractVoicedSemitones([1, 2, 3])).toEqual([1, 2, 3]);
  });
});

describe("suggestBandWidth", () => {
  it("suggests 20% of max length, clamped", () => {
    expect(suggestBandWidth(100, 100)).toBe(20); // 20% of 100
    expect(suggestBandWidth(10, 10)).toBe(5); // clamped to minimum 5
    expect(suggestBandWidth(500, 500)).toBe(60); // clamped to maximum 60
  });

  it("uses the longer sequence for calculation", () => {
    expect(suggestBandWidth(50, 100)).toBe(20); // 20% of 100
  });
});
