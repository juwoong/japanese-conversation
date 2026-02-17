# CatchPhase Review - engage-engineer

Reviewed: `CatchPhase.tsx` + all 5 activity components

## Immutable Rule Violations

### 1. ShadowSpeak.tsx - Internal accuracy score (MEDIUM)
- **Line 28**: `calcAccuracy()` returns a percentage (0-100)
- **Line 44**: `const [accuracy, setAccuracy] = useState<number | null>(null);`
- **Line 76**: `if (acc >= 70)` uses a numeric threshold internally
- The score is NOT shown to the user (good), but the variable name `accuracy` and the `calcAccuracy` function use percentage logic internally. The UI correctly shows "좋아요, 넘어갈게요" / "한번 더 들어볼까요?" instead of numbers.
- **Verdict**: Not a visible violation - the user never sees a score. Internal logic is fine.

### 2. SoundDistinction.tsx - No violations found
- Uses "같은 말일까요?" question with "같다"/"다르다" buttons
- Result shows "맞아요!" / "다시 들어볼까요?" (gentle reframing, no "wrong" message)

### 3. ChunkCatch.tsx - No violations found
- Shows "한번 더 들어볼게요..." on wrong answer (gentle)
- No scores, no Korean pronunciation

### 4. WordCatch.tsx - No violations found
- Replays TTS on wrong answer, resets selection (gentle)
- No scores, no Korean pronunciation

### 5. PictureSpeak.tsx - No violations found
- MVP accepts any response
- No scores or "wrong" messages

## No Korean Pronunciation Found
- Searched all activity files for Korean transliteration of Japanese - none found.

## Props / Interface Issues

### CatchPhase.tsx
- Props interface matches SessionScreen usage exactly:
  ```typescript
  interface Props {
    keyExpressions: KeyExpression[];
    inputMode: SessionMode;
    visitCount: number;
    onComplete: () => void;
  }
  ```
- SessionScreen passes: `keyExpressions`, `inputMode`, `visitCount`, `onComplete` - all match.

### SoundDistinction - Trivial pair (not a bug, but worth noting)
- **CatchPhase.tsx line 177-182**: SoundDistinction is always called with `isSame: true` and identical `wordA`/`wordB`. The activity always has the same answer ("같다"). This makes the activity trivially solvable but is probably fine for MVP since it's only shown on `visitCount === 1`.

## Code Quality Notes

1. **CatchPhase.tsx** - `shouldSkipSound` effect + early return pattern (lines 123-133) works but is slightly fragile. If `advance()` triggers synchronously before the null-guard, a render cycle with no current expression could flash. In practice the `useCallback` + `useEffect` order prevents this, so it's fine for now.

2. **No cleanup for Speech.speak()** - All activity components use `expo-speech` without canceling on unmount. If the user advances quickly, TTS from a previous activity may overlap with the next one. A `Speech.stop()` in a cleanup effect would prevent this.

3. **`Animated` import unused** in ChunkCatch.tsx (line 7) - minor lint issue.

## Summary

- **Immutable rule violations**: None visible to the user.
- **Interface mismatches**: None. CatchPhase props align with SessionScreen.
- **Recommended fix**: Add `Speech.stop()` cleanup in activity component unmount effects to prevent TTS overlap.
