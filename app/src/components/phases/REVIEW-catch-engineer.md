# Review: EngagePhase.tsx + ReviewPhase.tsx

Reviewed by: catch-engineer
Date: 2026-02-17

---

## EngagePhase.tsx

### Immutable Rule Violations

1. **"X / Y" progress counter in header** (line 343-344):
   ```tsx
   <Text style={styles.headerProgress}>
     {Math.min(turnIndex + 1, totalTurns)} / {totalTurns}
   </Text>
   ```
   This shows a numeric score-like counter ("3 / 5"). While it's technically a progress indicator, it creates a "how am I doing?" scoring feel. Consider replacing with a simple progress bar (like CatchPhase) or removing entirely — the session header in SessionScreen already shows phase dots.

2. **`choiceWrong` style — red border on wrong answers** (line 78-79 in ChoiceInput.tsx):
   ```tsx
   choiceWrong: {
     borderColor: colors.danger,
     backgroundColor: colors.dangerLight,
   },
   ```
   Red = "you got it wrong." This violates the "no wrong/incorrect messages" rule. Consider using a neutral color (e.g., `colors.border` with slight dimming) and gently highlighting the correct answer with a dashed green border, so the feedback is "here's the right one" rather than "you failed."

3. **`userBubbleWrong` style** (line 514-516):
   ```tsx
   userBubbleWrong: {
     backgroundColor: colors.primaryMuted,
   },
   ```
   The wrong answers in the chat thread get a visually different (muted/faded) bubble. This subtly marks which answers were "wrong." Better to use the same bubble color for all user messages — the learning happened regardless.

### Interface Mismatches

- None found. The `EngagePhaseProps` matches the call site in SessionScreen.tsx correctly.

### Code Quality Issues

1. **`moveAfterNpc` not wrapped in useCallback** (line 192): It's used inside the `useEffect` at line 157 but isn't in the dependency array. This could cause stale closure bugs where `turnIndex` is captured at mount time. Either wrap in `useCallback` and add to deps, or restructure the effect.

2. **Missing `eslint-disable` or acknowledged deps in useEffect** (line 190):
   ```tsx
   }, [turnIndex, turnPhase]);
   ```
   `moveAfterNpc` and `setMessages` closures are captured but not listed. This works today because React setState is stable, but `moveAfterNpc` is not stable.

3. **`handleFreeAnswer` comparison logic is fragile** (line 243-248):
   ```tsx
   const correct = norm === expNorm || norm.includes(expNorm);
   ```
   `norm.includes(expNorm)` means if the user types a longer string containing the expected text, it counts as correct. This could lead to false positives. Consider using the same `calcAccuracy` approach from ShadowSpeak for consistency.

---

## ReviewPhase.tsx

### Immutable Rule Violations

- **None found.** The ReviewPhase carefully avoids scores, percentages, and levels. The `getAbilityStatement()` function converts performance data into qualitative statements without exposing numbers. Well done.

### Interface Mismatches

- `performance` prop is optional (`performance?: EngagePerformance`) but SessionScreen passes a non-null fallback:
  ```tsx
  performance={engagePerformance ?? undefined}
  ```
  This is fine — the component handles the `undefined` case in `getAbilityStatement()`. No mismatch.

- `situationName` prop is optional (`situationName?: string`) and SessionScreen passes `fourPhase.situation?.name_ko` which could be undefined. This is correctly handled.

### Code Quality Issues

1. **Timeout cleanup on unmount** (line 134-136): `hideTimeouts` ref holds timeout IDs but they are never cleared on component unmount. If the user navigates away quickly, the `setRevealedMeanings` callback fires on an unmounted component. Add a cleanup:
   ```tsx
   useEffect(() => {
     return () => {
       hideTimeouts.current.forEach(clearTimeout);
     };
   }, []);
   ```

2. **Hardcoded grammar explanations** (line 46-104): This is fine for MVP but should be noted as tech debt — these should eventually come from the content pipeline or database.

3. **`FuriganaText` import** (line 27): The component imports `FuriganaText` from `../FuriganaText`. If this component doesn't exist yet, the build will fail. Verified it exists at `app/src/components/FuriganaText.tsx`.

---

## Summary

| File | Immutable Violations | Interface Issues | Code Quality |
|------|---------------------|-----------------|--------------|
| EngagePhase.tsx | 2 (progress counter, red wrong styling) | 0 | 3 |
| ReviewPhase.tsx | 0 | 0 | 2 |
| ChoiceInput.tsx | 1 (red wrong border) | 0 | 0 |

**Priority fixes:**
1. Remove or replace the numeric progress counter in EngagePhase header
2. Replace red "wrong" styling with neutral reframing in ChoiceInput + EngagePhase chat bubbles
3. Fix stale closure risk in EngagePhase useEffect
