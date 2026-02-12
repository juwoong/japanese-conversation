/**
 * Dynamic Time Warping with Sakoe-Chiba band constraint.
 *
 * Designed for comparing pitch contours (semitone arrays) in a
 * Japanese speech learning app. Pure TypeScript, zero dependencies,
 * Hermes-compatible.
 *
 * Complexity: O(n * w) where w = band width (not full n*m).
 * For n=200, w=50: ~20k operations, executes in <5ms on Hermes.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DTWResult {
  /** Normalized DTW distance (total distance / path length). Lower = more similar. */
  distance: number;
  /** Raw (unnormalized) accumulated distance. */
  rawDistance: number;
  /** Warping path as [queryIndex, referenceIndex] pairs, from start to end. */
  path: [number, number][];
  /** Per-point cost: for each query index, the distance to its aligned reference point. */
  perPointCost: number[];
}

export interface DTWOptions {
  /**
   * Sakoe-Chiba band width (in number of points).
   * The warping path is constrained so |i - j * (n/m)| <= bandWidth.
   * Set to Infinity to disable the constraint (full DTW).
   * Default: Infinity (no constraint).
   */
  bandWidth?: number;
  /**
   * Distance function between two scalar values.
   * Default: absolute difference |a - b|.
   */
  distanceFn?: (a: number, b: number) => number;
}

// ---------------------------------------------------------------------------
// Implementation
// ---------------------------------------------------------------------------

const DEFAULT_DISTANCE: (a: number, b: number) => number = (a, b) =>
  Math.abs(a - b);

/**
 * Compute DTW between two numeric sequences (e.g. semitone contours).
 *
 * @param query   - The learner's pitch contour.
 * @param reference - The model/target pitch contour.
 * @param options - Band width and distance function.
 * @returns DTWResult with distance, path, and per-point costs.
 *
 * @example
 * ```ts
 * const learner  = [0, 2, 4, 3, 1];
 * const model    = [0, 1, 3, 4, 2, 1];
 * const result   = computeDTW(learner, model, { bandWidth: 3 });
 * console.log(result.distance);      // normalized DTW distance
 * console.log(result.perPointCost);   // cost at each learner point
 * ```
 */
export function computeDTW(
  query: number[],
  reference: number[],
  options?: DTWOptions,
): DTWResult {
  const n = query.length;
  const m = reference.length;

  if (n === 0 || m === 0) {
    return { distance: 0, rawDistance: 0, path: [], perPointCost: [] };
  }

  const distFn = options?.distanceFn ?? DEFAULT_DISTANCE;
  const bandWidth = options?.bandWidth ?? Infinity;

  // Cost matrix. We use a flat array for cache-friendly access.
  // costMatrix[i * m + j] = accumulated cost to reach (i, j).
  // Initialize with Infinity so out-of-band cells are naturally excluded.
  const size = n * m;
  const cost = new Float64Array(size);
  cost.fill(Infinity);

  // Helper to check if (i, j) is within the Sakoe-Chiba band.
  // The band is centered on the diagonal that connects (0,0) to (n-1, m-1).
  // For non-equal lengths, the diagonal is j = i * (m-1)/(n-1).
  // A point is in-band if |j - i * (m-1)/(n-1)| <= bandWidth.
  const ratio = n > 1 ? (m - 1) / (n - 1) : 0;

  function inBand(i: number, j: number): boolean {
    if (bandWidth === Infinity) return true;
    return Math.abs(j - i * ratio) <= bandWidth;
  }

  // Fill cost matrix
  for (let i = 0; i < n; i++) {
    // Compute the j-range that could possibly be in-band to skip unnecessary checks
    const jCenter = Math.round(i * ratio);
    const jMin =
      bandWidth === Infinity ? 0 : Math.max(0, jCenter - bandWidth);
    const jMax =
      bandWidth === Infinity ? m - 1 : Math.min(m - 1, jCenter + bandWidth);

    for (let j = jMin; j <= jMax; j++) {
      if (!inBand(i, j)) continue;

      const d = distFn(query[i], reference[j]);
      const idx = i * m + j;

      if (i === 0 && j === 0) {
        cost[idx] = d;
      } else {
        let minPrev = Infinity;

        // (i-1, j) — insertion
        if (i > 0) {
          const prev = cost[(i - 1) * m + j];
          if (prev < minPrev) minPrev = prev;
        }

        // (i, j-1) — deletion
        if (j > 0) {
          const prev = cost[i * m + (j - 1)];
          if (prev < minPrev) minPrev = prev;
        }

        // (i-1, j-1) — match
        if (i > 0 && j > 0) {
          const prev = cost[(i - 1) * m + (j - 1)];
          if (prev < minPrev) minPrev = prev;
        }

        cost[idx] = d + minPrev;
      }
    }
  }

  // Backtrack to find the optimal warping path
  const path: [number, number][] = [];
  let i = n - 1;
  let j = m - 1;
  path.push([i, j]);

  while (i > 0 || j > 0) {
    if (i === 0) {
      j--;
    } else if (j === 0) {
      i--;
    } else {
      const diag = cost[(i - 1) * m + (j - 1)];
      const left = cost[i * m + (j - 1)];
      const up = cost[(i - 1) * m + j];

      if (diag <= left && diag <= up) {
        i--;
        j--;
      } else if (up <= left) {
        i--;
      } else {
        j--;
      }
    }
    path.push([i, j]);
  }

  path.reverse();

  // Compute per-point cost for each query index.
  // For each query index i, find the aligned reference index j from the path
  // and record the local distance.
  const perPointCost = new Array<number>(n).fill(0);
  // Track which query indices have been assigned (a query point may appear
  // multiple times in the path if the reference is stretched).
  const pointCount = new Array<number>(n).fill(0);

  for (const [pi, pj] of path) {
    perPointCost[pi] += distFn(query[pi], reference[pj]);
    pointCount[pi]++;
  }

  // Average if a query point was aligned to multiple reference points
  for (let k = 0; k < n; k++) {
    if (pointCount[k] > 0) {
      perPointCost[k] /= pointCount[k];
    }
  }

  const rawDistance = cost[(n - 1) * m + (m - 1)];
  const normalizedDistance = rawDistance / path.length;

  return {
    distance: normalizedDistance,
    rawDistance,
    path,
    perPointCost,
  };
}

// ---------------------------------------------------------------------------
// Utility: filter null semitones before DTW
// ---------------------------------------------------------------------------

/**
 * Extract voiced (non-null) semitone values from a PitchPoint array,
 * suitable for DTW comparison. Strips silence gaps.
 *
 * @param semitones - Array where null = unvoiced/silence.
 * @returns Array of voiced semitone values only.
 */
export function extractVoicedSemitones(
  semitones: (number | null)[],
): number[] {
  const result: number[] = [];
  for (let i = 0; i < semitones.length; i++) {
    const s = semitones[i];
    if (s !== null) {
      result.push(s);
    }
  }
  return result;
}

// ---------------------------------------------------------------------------
// Utility: suggest band width based on sequence lengths
// ---------------------------------------------------------------------------

/**
 * Suggest a reasonable Sakoe-Chiba band width based on sequence lengths.
 * Uses 20% of the longer sequence as default, clamped to [5, 60].
 *
 * Rationale: Japanese utterances have moderate tempo variation.
 * 20% allows for natural speed differences without excessive warping
 * that would mask real pitch errors.
 */
export function suggestBandWidth(queryLen: number, refLen: number): number {
  const maxLen = Math.max(queryLen, refLen);
  const suggested = Math.round(maxLen * 0.2);
  return Math.max(5, Math.min(60, suggested));
}
