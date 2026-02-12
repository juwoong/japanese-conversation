# Phase 2: DTW Comparison + Pitch Preprocessing Parameter Sheet

**Author**: TTS/STT Expert Agent
**Date**: 2026-02-11
**Status**: SPECIFICATION (ready for implementation)
**Depends on**: Phase 1 (pitchy pitch extraction at 16kHz, hop 512, ~31 pts/sec)

---

## 0. Phase 1 Recap — Input Contract

From `app/src/audio/pitchConfig.ts`:

```typescript
interface PitchPoint {
  timeMs: number;
  semitone: number | null;   // relative to A3=220Hz, null = unvoiced
  hz: number | null;
  clarity: number;           // 0..1
  rms: number;
}
```

- Sample rate: 16,000 Hz
- Window: 1024 samples (64ms)
- Hop: 512 samples (32ms) => **~31.25 points/sec**
- Confidence threshold: 0.9
- Frequency range: 75-500 Hz
- Semitone reference: A3 = 220 Hz

---

## 1. Pitch Preprocessing Pipeline for DTW

### 1.1 Pipeline Overview

```
PitchPoint[] (raw)
  │
  ├─ Step 1: Strip silence edges
  ├─ Step 2: Interpolate short null gaps
  ├─ Step 3: Median smoothing (window=3)
  ├─ Step 4: Mean-normalize (per utterance)
  └─ Step 5: Resample to fixed length (optional, for scoring only)
       │
       └─ number[] (DTW-ready contour)
```

### 1.2 Step 1 — Strip Silence Edges

Remove leading/trailing frames where `semitone === null`. Speech typically starts and ends with silence; DTW should only compare the voiced region.

```typescript
/** Concrete parameter */
const EDGE_STRIP_CONFIG = {
  /** Minimum consecutive voiced frames to consider "speech onset" */
  minOnsetFrames: 3,    // ~96ms of voiced signal
  /** Minimum consecutive voiced frames to consider "speech offset" */
  minOffsetFrames: 2,   // ~64ms
} as const;
```

**Algorithm**: Scan from the start, find the first run of `minOnsetFrames` consecutive non-null semitones. That is the start index. Same from the end for offset. Trim everything outside.

### 1.3 Step 2 — Interpolate Short Null Gaps

Unvoiced frames in the middle of speech (e.g., unvoiced consonants like /t/, /k/, /s/) create null gaps. Short gaps should be linearly interpolated; long gaps indicate actual pauses.

```typescript
const INTERPOLATION_CONFIG = {
  /** Max consecutive null frames to interpolate across */
  maxGapFrames: 4,      // ~128ms — covers unvoiced consonants
  /** Gaps longer than this are kept as segment boundaries */
  segmentBreakFrames: 8, // ~256ms — actual pause between phrases
} as const;
```

**Algorithm**: Scan for runs of null semitones. If run length <= `maxGapFrames`, linearly interpolate between the flanking voiced values. If run length > `segmentBreakFrames`, mark as a segment boundary (used later for per-segment scoring).

### 1.4 Step 3 — Median Smoothing

Already partially done in the visualization layer (`pitchVizTokens.ts` has `smoothingWindowSize: 3`). We re-apply here on the analysis path to ensure the DTW input is smoothed independently of the display.

```typescript
const SMOOTHING_CONFIG = {
  /** Median filter window size (must be odd) */
  windowSize: 3,        // ±1 frame around center
} as const;
```

**Rationale**: Median filter (not moving average) because it preserves pitch accent edges (the H->L or L->H transitions that define Japanese accent) while removing impulse noise from pitch tracker jitter.

### 1.5 Step 4 — Mean Normalization

**Normalize per utterance** (not per segment). This removes speaker F0 baseline differences between user and reference. Japanese pitch accent is relative (High vs Low pattern), not absolute pitch.

```typescript
const NORMALIZATION_CONFIG = {
  /** Normalization strategy */
  method: 'mean-subtract' as const,
  // Alternatives considered and rejected:
  // 'z-score': Too aggressive, flattens dynamic range for short utterances
  // 'min-max': Sensitive to outliers
  // 'median-subtract': Slightly more robust but mean is fine with median-smoothed input
} as const;
```

**Algorithm**:
1. Compute mean of all non-null semitone values in the utterance
2. Subtract mean from every value
3. Result: contour centered around 0, where positive = higher than speaker average, negative = lower

This means a male speaker at 120Hz and a female speaker at 250Hz produce comparable contours if their pitch *patterns* match.

### 1.6 Step 5 — Resample to Fixed Length (Conditional)

For the DTW comparison itself, **do NOT resample to fixed length**. DTW's entire purpose is to handle temporal variation. However, for a quick "overview score" or for caching, we may want a fixed-length representation.

```typescript
const RESAMPLE_CONFIG = {
  /** Whether to resample before DTW (false = let DTW handle timing) */
  resampleBeforeDTW: false,
  /** Fixed length for cached reference summaries (used for quick display only) */
  referenceSummaryLength: 50,
} as const;
```

### 1.7 Full Preprocessing Type

```typescript
/** Output of the preprocessing pipeline — the DTW-ready contour */
interface ProcessedContour {
  /** Mean-normalized semitone values (no nulls after interpolation) */
  values: number[];
  /** Time in ms for each value (original timing preserved) */
  times: number[];
  /** Segment boundaries (indices where pauses were detected) */
  segmentBreaks: number[];
  /** Statistics for denormalization / display */
  stats: {
    meanSemitone: number;
    stdSemitone: number;
    durationMs: number;
    voicedFrameCount: number;
  };
}

/** Top-level preprocessing function signature */
function preprocessPitch(raw: PitchPoint[]): ProcessedContour;
```

---

## 2. DTW Algorithm Configuration

### 2.1 Library Decision: Write Our Own (Lightweight)

**Recommendation: Write a custom ~80-line DTW function** rather than using an npm package.

Reasons:
- `dynamic-time-warping` (npm): No Sakoe-Chiba band support, no TypeScript types, not maintained
- `dtw` by langholz (npm): Supports custom distance but no band constraint, last updated 11 years ago
- Our needs are specific: 1D contour, Sakoe-Chiba band, path extraction, segment-aware scoring

A 1D DTW with Sakoe-Chiba band is straightforward (~80 lines) and avoids dependency risk on unmaintained packages.

### 2.2 Distance Metric

```typescript
const DTW_CONFIG = {
  /** Distance function between two semitone values */
  distanceMetric: 'manhattan' as const,
  // Why manhattan (L1) over euclidean (L2):
  // - L1 is more robust to occasional outlier spikes
  // - For 1D signals, L1 = |a - b|, computationally cheaper (no sqrt)
  // - L2 would over-penalize large differences, which may occur at
  //   consonant-vowel transitions even in correct pronunciation
} as const;
```

```typescript
/** Distance function */
function pitchDistance(a: number, b: number): number {
  return Math.abs(a - b);
}
```

### 2.3 Sakoe-Chiba Band Width

The band constrains the warping path to stay within `w` steps of the diagonal. This prevents pathological alignment where a single mora in the user's speech gets stretched to cover half the reference.

```typescript
const BAND_CONFIG = {
  /**
   * Band width as a fraction of the shorter sequence length.
   * Adaptive approach: compute from sequence length.
   */
  bandFraction: 0.2,

  /** Minimum absolute band width (in frames) */
  minBandWidth: 3,

  /** Maximum absolute band width (in frames) */
  maxBandWidth: 30,
} as const;

/**
 * Compute Sakoe-Chiba band width for a given pair of sequences.
 *
 * Word-level (5-15 pts): band = 3 frames (~96ms tolerance)
 * Phrase-level (15-50 pts): band = 3-10 frames
 * Sentence-level (50-200 pts): band = 10-30 frames
 */
function computeBandWidth(seqLenA: number, seqLenB: number): number {
  const shorter = Math.min(seqLenA, seqLenB);
  const raw = Math.round(shorter * BAND_CONFIG.bandFraction);
  return Math.max(BAND_CONFIG.minBandWidth, Math.min(raw, BAND_CONFIG.maxBandWidth));
}
```

### 2.4 Step Pattern

```typescript
const STEP_PATTERN = {
  /**
   * symmetric2 (Sakoe-Chiba P=0 pattern):
   *   (i-1, j-1) -> (i, j)  cost: d(i,j)
   *   (i-1, j)   -> (i, j)  cost: d(i,j)
   *   (i, j-1)   -> (i, j)  cost: d(i,j)
   *
   * Preferred over symmetric1 because:
   * - symmetric1 adds 2*d(i,j) for diagonal, biasing toward axis moves
   * - symmetric2 treats all three steps equally, better for speech
   */
  type: 'symmetric2' as const,
} as const;
```

### 2.5 Subsequence DTW

**Not needed for our use case.** The user is prompted to speak a specific sentence, so both reference and user contours represent the same complete utterance. Edge trimming (Step 1) handles any leading/trailing silence. If we later add "free conversation" mode, we would revisit this.

### 2.6 Performance Estimate

DTW with Sakoe-Chiba band: O(N * W) where N = longer sequence length, W = band width.

| Scenario | User pts | Ref pts | Band W | Operations | Est. time (JS, mobile) |
|----------|----------|---------|--------|------------|----------------------|
| Single word (0.5s) | ~16 | ~16 | 3 | 48 | < 0.1ms |
| Short phrase (2s) | ~62 | ~62 | 12 | 744 | < 0.5ms |
| Full sentence (4s) | ~125 | ~125 | 25 | 3,125 | < 1ms |
| Long sentence (8s) | ~250 | ~250 | 30 | 7,500 | < 2ms |

These are well within real-time budget. No need for Web Worker or native module.

---

## 3. Scoring

### 3.1 DTW Distance to Similarity Score (0-100)

The DTW cost is a sum of per-step distances. To convert to a 0-100 score, we use **mean step distance** (total cost / path length), then map through a sigmoid-like function.

```typescript
const SCORING_CONFIG = {
  /**
   * Mean step distance thresholds (in semitones).
   *
   * Calibration rationale:
   * - Japanese pitch accent has ~4-6 semitone H-L difference typically
   * - A "good" speaker matches within ~1 semitone mean deviation
   * - A "struggling" speaker deviates by 2-3+ semitones on average
   */

  /** Mean step distance for "perfect" score (100) */
  perfectThreshold: 0.3,     // semitones — nearly identical contour

  /** Mean step distance for "zero" score (0) */
  failThreshold: 4.0,        // semitones — completely different contour

  /** Mapping function: linear interpolation, clamped [0, 100] */
  // score = 100 * (1 - (meanDist - perfect) / (fail - perfect))
  // clamped to [0, 100]
} as const;

function dtwDistanceToScore(totalCost: number, pathLength: number): number {
  const meanDist = totalCost / pathLength;
  const { perfectThreshold, failThreshold } = SCORING_CONFIG;

  if (meanDist <= perfectThreshold) return 100;
  if (meanDist >= failThreshold) return 0;

  const normalized = (meanDist - perfectThreshold) / (failThreshold - perfectThreshold);
  return Math.round(100 * (1 - normalized));
}
```

### 3.2 Score Ratings

```typescript
type PitchRating = 'excellent' | 'good' | 'fair' | 'needs_work';

const RATING_THRESHOLDS = {
  excellent: 85,    // 85-100: Nearly native pitch pattern
  good: 65,         // 65-84:  Recognizable accent pattern, minor deviations
  fair: 40,         // 40-64:  General shape correct, significant deviations
  needs_work: 0,    //  0-39:  Pitch pattern not matching
} as const;

function scoreToRating(score: number): PitchRating {
  if (score >= RATING_THRESHOLDS.excellent) return 'excellent';
  if (score >= RATING_THRESHOLDS.good) return 'good';
  if (score >= RATING_THRESHOLDS.fair) return 'fair';
  return 'needs_work';
}
```

### 3.3 Per-Mora Segment Scoring

Split the DTW alignment path into mora-level segments, then compute a local score for each mora. This enables feedback like "your pitch was too low on the 3rd mora."

```typescript
interface MoraScore {
  /** Mora index (0-based) */
  moraIndex: number;
  /** The mora text (e.g., "こん", "に", "ち", "は") */
  moraText: string;
  /** Local DTW score for this mora (0-100) */
  score: number;
  /** Rating for this mora */
  rating: PitchRating;
  /** Mean pitch difference (signed): positive = user too high, negative = user too low */
  meanDiffSemitones: number;
  /** Start/end frame indices in the DTW path */
  pathStartIdx: number;
  pathEndIdx: number;
}

interface DTWResult {
  /** Overall similarity score (0-100) */
  overallScore: number;
  /** Overall rating */
  overallRating: PitchRating;
  /** Per-mora breakdown */
  moraScores: MoraScore[];
  /** Raw DTW total cost */
  totalCost: number;
  /** DTW path: array of [userIdx, refIdx] pairs */
  path: [number, number][];
  /** Mean step distance (semitones) */
  meanStepDistance: number;
}
```

**Mora segmentation from reference data**: The reference pitch data (from VOICEVOX) comes with mora boundaries. Each mora has a known duration (consonant_length + vowel_length). We use these timestamps to partition the DTW path into mora-level chunks.

For each mora chunk:
1. Extract the sub-path from the full DTW path
2. Compute local mean step distance
3. Map to local score using the same `dtwDistanceToScore` function
4. Compute signed difference (user mean - ref mean) for directional feedback

### 3.4 Feedback Text Generation

```typescript
interface MoraFeedback {
  moraText: string;
  message: string;  // e.g., "ちは の音が低すぎます" or "良いです！"
}

const FEEDBACK_CONFIG = {
  /** Only show feedback for moras with score below this */
  feedbackThreshold: 65,
  /** Minimum absolute semitone difference to mention direction */
  directionThreshold: 0.8,  // semitones
} as const;
```

---

## 4. Reference Pitch Generation (VOICEVOX)

### 4.1 VOICEVOX Pipeline

VOICEVOX provides pitch data at the mora level via its `AudioQuery` API. The pipeline:

```
Text (Japanese)
  │
  ├─ POST /audio_query?text={text}&speaker={id}
  │     → AudioQuery JSON (with mora-level pitch, timing)
  │
  ├─ POST /synthesis (optional: generate WAV for TTS playback)
  │
  └─ Extract pitch contour from AudioQuery moras
```

### 4.2 VOICEVOX Mora Structure

```typescript
/** From VOICEVOX API response */
interface VoicevoxMora {
  text: string;              // e.g., "コ"
  consonant: string | null;  // e.g., "k", null for vowel-only moras
  consonant_length: number;  // seconds
  vowel: string;             // e.g., "o"
  vowel_length: number;      // seconds
  pitch: number;             // log-F0 scale (e.g., 5.7 = ~298Hz)
}

interface VoicevoxAccentPhrase {
  moras: VoicevoxMora[];
  accent: number;           // accent nucleus position (1-indexed)
  pause_mora: VoicevoxMora | null;
  is_interrogative: boolean;
}

interface VoicevoxAudioQuery {
  accent_phrases: VoicevoxAccentPhrase[];
  speedScale: number;
  pitchScale: number;
  intonationScale: number;
  volumeScale: number;
  prePhonemeLength: number;
  postPhonemeLength: number;
  outputSamplingRate: number;
  outputStereo: boolean;
  kana: string;
}
```

### 4.3 VOICEVOX Pitch Value Conversion

VOICEVOX pitch values are in **natural log of Hz** (ln(Hz)):

```typescript
/** Convert VOICEVOX pitch to Hz */
function voicevoxPitchToHz(logF0: number): number {
  if (logF0 === 0) return 0; // unvoiced
  return Math.exp(logF0);
}

/** Convert VOICEVOX pitch to our semitone scale (relative to A3=220Hz) */
function voicevoxPitchToSemitone(logF0: number): number | null {
  if (logF0 === 0) return null; // unvoiced
  const hz = Math.exp(logF0);
  return 12 * Math.log2(hz / 220); // same formula as pitchConfig.ts
}

// Example conversions:
// VOICEVOX pitch 5.6 → e^5.6 ≈ 270Hz → 12*log2(270/220) ≈ 3.55 semitones above A3
// VOICEVOX pitch 5.8 → e^5.8 ≈ 330Hz → 12*log2(330/220) ≈ 7.02 semitones above A3
// VOICEVOX pitch 6.0 → e^6.0 ≈ 403Hz → 12*log2(403/220) ≈ 10.49 semitones above A3
// VOICEVOX pitch 0   → unvoiced (null)
```

### 4.4 Expanding Mora-Level Pitch to Frame-Level Contour

VOICEVOX provides **one pitch value per mora**, but our user data has ~31 frames/sec. We need to expand the reference to match.

```typescript
/**
 * Expand VOICEVOX mora-level pitch to frame-level contour
 * matching our pipeline's 32ms hop size.
 *
 * Strategy: Each mora spans (consonant_length + vowel_length) seconds.
 * Fill that duration with frames at 32ms intervals, holding the mora's pitch constant
 * then optionally apply linear interpolation between adjacent moras for smoother contour.
 */
const REFERENCE_EXPANSION_CONFIG = {
  /** Frame hop in seconds (must match user pipeline) */
  frameHopSec: 0.032,  // 512 / 16000

  /**
   * Interpolation between adjacent mora pitch values.
   * 'hold': Each mora's pitch is held constant for its duration (step function)
   * 'linear': Linear interpolation from one mora pitch to the next
   *
   * 'linear' is preferred because real speech has gradual pitch transitions
   * even within a single accent phrase.
   */
  interpolation: 'linear' as const,
} as const;
```

**Algorithm**:
1. Walk through `accent_phrases[].moras[]` sequentially
2. For each mora, compute its start time (cumulative sum of previous durations)
3. Compute frame count: `Math.round(moraDuration / frameHopSec)`
4. If `interpolation === 'linear'`: for each frame, lerp between this mora's pitch and the next
5. Convert each value from VOICEVOX log-F0 to our semitone scale
6. The result is `PitchPoint[]` with the same structure as user data

### 4.5 VOICEVOX Speaker Selection

```typescript
const VOICEVOX_CONFIG = {
  /** Default speaker for reference generation */
  defaultSpeakerId: 3,  // ずんだもん (ノーマル) — clear, standard pitch
  /**
   * Alternative speakers for gender matching:
   *   Male: 13 (青山龍星) or 52 (WhiteCUL ノーマル)
   *   Female: 3 (ずんだもん), 0 (四国めたん)
   */

  /** VOICEVOX Engine URL (local Docker or cloud endpoint) */
  engineUrl: 'http://localhost:50021',

  /** Audio synthesis settings */
  speedScale: 1.0,
  pitchScale: 0.0,
  intonationScale: 1.0,  // keep default intonation for reference
} as const;
```

### 4.6 Pre-Computed Reference Storage Format

References should be generated **once per line** (at content generation time, not at runtime) and stored as JSON.

```typescript
/** Stored reference pitch data — one per Line record */
interface ReferencePitch {
  /** Line ID from database */
  lineId: number;
  /** Japanese text (for verification) */
  textJa: string;
  /** VOICEVOX speaker ID used */
  speakerId: number;
  /** Total duration in ms */
  durationMs: number;
  /** Frame-level pitch contour (already in semitone scale, already mean-normalized) */
  contour: {
    /** Semitone values (relative to A3=220Hz, mean-normalized) */
    values: number[];
    /** Time in ms for each value */
    times: number[];
  };
  /** Mora boundaries — for per-mora segment scoring */
  moras: ReferenceMora[];
  /** Preprocessing stats (for debugging / denormalization) */
  stats: {
    meanSemitone: number;
    rawMeanHz: number;
  };
  /** Schema version for future migrations */
  version: 1;
}

interface ReferenceMora {
  /** Mora text (e.g., "こ") */
  text: string;
  /** Start frame index in contour.values */
  startFrame: number;
  /** End frame index (exclusive) in contour.values */
  endFrame: number;
  /** Duration in ms */
  durationMs: number;
  /** Original VOICEVOX pitch (log-F0, for debugging) */
  rawPitch: number;
  /** Is this mora the accent nucleus? */
  isAccentNucleus: boolean;
}
```

### 4.7 Storage Location

```
scripts/output/
  ├── cafe.json               ← existing line data
  ├── cafe_pitch.json          ← NEW: reference pitch data for cafe lines
  ...

# OR embedded in the existing JSON:
scripts/output/cafe.json
  └── lines[].reference_pitch: ReferencePitch
```

**Recommendation**: Separate `_pitch.json` files. Reasons:
- Reference pitch data is ~5-10KB per line (125 frames * 2 fields), so ~25-50KB per situation (5 lines)
- Keeps the existing JSON schema backwards-compatible
- Can be lazy-loaded only when the user enters pronunciation practice mode

### 4.8 Reference Generation Script

A new script `scripts/generate-reference-pitch.ts` that:

1. Reads each `scripts/output/*.json`
2. For each user-spoken line (`speaker === "user"`), calls VOICEVOX `audio_query`
3. Expands mora-level pitch to frame-level contour
4. Applies the same preprocessing pipeline (mean normalization)
5. Saves as `*_pitch.json`

```bash
# Requires VOICEVOX Engine running locally (Docker)
docker run --rm -p 50021:50021 voicevox/voicevox_engine:latest

# Then generate references
npx ts-node scripts/generate-reference-pitch.ts
```

---

## 5. Complete Configuration Constants File

This is the file that would be created at `app/src/audio/dtwConfig.ts`:

```typescript
/**
 * DTW pitch comparison configuration.
 * Parameters validated by TTS/STT Expert for Japanese speech.
 *
 * Phase 2 of pronunciation feedback system.
 * Depends on: pitchConfig.ts (Phase 1)
 */

// ─── Preprocessing ───────────────────────────────────────────

export const EDGE_STRIP_CONFIG = {
  minOnsetFrames: 3,
  minOffsetFrames: 2,
} as const;

export const INTERPOLATION_CONFIG = {
  maxGapFrames: 4,
  segmentBreakFrames: 8,
} as const;

export const SMOOTHING_CONFIG = {
  windowSize: 3,
} as const;

export const NORMALIZATION_CONFIG = {
  method: 'mean-subtract' as const,
} as const;

// ─── DTW Algorithm ───────────────────────────────────────────

export const DTW_CONFIG = {
  distanceMetric: 'manhattan' as const,
  stepPattern: 'symmetric2' as const,
  bandFraction: 0.2,
  minBandWidth: 3,
  maxBandWidth: 30,
} as const;

// ─── Scoring ─────────────────────────────────────────────────

export const SCORING_CONFIG = {
  perfectThreshold: 0.3,
  failThreshold: 4.0,
} as const;

export const RATING_THRESHOLDS = {
  excellent: 85,
  good: 65,
  fair: 40,
  needs_work: 0,
} as const;

export const FEEDBACK_CONFIG = {
  feedbackThreshold: 65,
  directionThreshold: 0.8,
} as const;

// ─── Reference Expansion ────────────────────────────────────

export const REFERENCE_EXPANSION_CONFIG = {
  frameHopSec: 0.032,
  interpolation: 'linear' as const,
} as const;

// ─── Types ──────────────────────────────────────────────────

export type PitchRating = 'excellent' | 'good' | 'fair' | 'needs_work';

export interface ProcessedContour {
  values: number[];
  times: number[];
  segmentBreaks: number[];
  stats: {
    meanSemitone: number;
    stdSemitone: number;
    durationMs: number;
    voicedFrameCount: number;
  };
}

export interface MoraScore {
  moraIndex: number;
  moraText: string;
  score: number;
  rating: PitchRating;
  meanDiffSemitones: number;
  pathStartIdx: number;
  pathEndIdx: number;
}

export interface DTWResult {
  overallScore: number;
  overallRating: PitchRating;
  moraScores: MoraScore[];
  totalCost: number;
  path: [number, number][];
  meanStepDistance: number;
}

export interface ReferencePitch {
  lineId: number;
  textJa: string;
  speakerId: number;
  durationMs: number;
  contour: {
    values: number[];
    times: number[];
  };
  moras: ReferenceMora[];
  stats: {
    meanSemitone: number;
    rawMeanHz: number;
  };
  version: 1;
}

export interface ReferenceMora {
  text: string;
  startFrame: number;
  endFrame: number;
  durationMs: number;
  rawPitch: number;
  isAccentNucleus: boolean;
}
```

---

## 6. Implementation File Map (Phase 2 Tasks)

| Task ID | File | Description |
|---------|------|-------------|
| P2.1 | `app/src/audio/dtwConfig.ts` | All constants + types from Section 5 above |
| P2.1 | `app/src/audio/dtw.ts` | Custom DTW algorithm (~80 lines) with Sakoe-Chiba band |
| P2.2 | `app/src/audio/pitchPreprocess.ts` | `preprocessPitch(PitchPoint[]) → ProcessedContour` |
| P2.3 | `scripts/generate-reference-pitch.ts` | VOICEVOX → ReferencePitch JSON generation |
| P2.3 | `scripts/output/*_pitch.json` | Pre-computed reference data (22 situations) |
| P2.4 | `app/src/audio/pitchCompare.ts` | Orchestrator: preprocess both → DTW → score → MoraScore[] |
| P2.5 | `app/src/audio/__tests__/dtw.test.ts` | Unit tests for DTW + scoring |

### Implementation Order

1. `dtwConfig.ts` — Copy constants from this spec
2. `dtw.ts` — Implement DTW core
3. `pitchPreprocess.ts` — Implement preprocessing pipeline
4. `dtw.test.ts` — Test with synthetic contours
5. `generate-reference-pitch.ts` — VOICEVOX reference generation
6. `pitchCompare.ts` — Wire it all together

---

## 7. Key Design Decisions Summary

| Decision | Choice | Rationale |
|----------|--------|-----------|
| DTW library | Custom (~80 LOC) | No JS library supports Sakoe-Chiba band; our case is 1D and simple |
| Distance metric | Manhattan (L1) | Robust to outliers, cheap for 1D |
| Band constraint | Sakoe-Chiba, 20% of shorter sequence | Prevents pathological warping while allowing natural tempo variation |
| Step pattern | symmetric2 | Equal cost for all step directions |
| Normalization | Mean-subtract per utterance | Removes speaker baseline, preserves relative pitch pattern |
| Smoothing | Median filter, window=3 | Preserves accent edges, removes impulse noise |
| Null handling | Interpolate gaps <= 4 frames | Covers unvoiced consonants without losing pause structure |
| Reference format | Pre-computed JSON, frame-level contour | No runtime VOICEVOX dependency; fast comparison |
| VOICEVOX pitch | ln(Hz), convert to semitone via exp() then log2() | Matches user pipeline's semitone scale exactly |
| Mora segmentation | From VOICEVOX mora boundaries | Direct mapping from TTS engine; no need for separate morphological analysis |
| Subsequence DTW | Not needed | User speaks prompted sentence; both sequences are complete utterances |

---

## Sources

- [VOICEVOX Engine API Documentation](https://voicevox.github.io/voicevox_engine/api/)
- [VOICEVOX Audio Query and Synthesis Models (DeepWiki)](https://deepwiki.com/VOICEVOX/voicevox_engine/5.2-audio-query-and-synthesis-models)
- [Observing the VOICEVOX API (Hikari's Notebook)](https://www.hikari-dev.com/en/blog/2024/11/12/voicevox-api/)
- [langholz/dtw — JavaScript DTW implementation](https://github.com/langholz/dtw)
- [dynamic-time-warping (npm)](https://www.npmjs.com/package/dynamic-time-warping)
- [Accent type recognition of Japanese using perceived mora pitch values (ISCA)](https://www.isca-archive.org/tal_2004/hirose04_tal.html)
- [DTW Suite — Dynamic Time Warping Algorithms](https://dynamictimewarping.github.io/)
- [tslearn DTW documentation](https://tslearn.readthedocs.io/en/stable/user_guide/dtw.html)
