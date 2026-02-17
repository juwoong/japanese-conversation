# Review by variation-engineer

## Files Reviewed
- `app/src/components/SafetyNetTooltip.tsx`
- `app/src/lib/exposureTracker.ts`

## Review Date: 2026-02-17

---

## SafetyNetTooltip.tsx

### Immutable Rule Check
- **Korean pronunciation**: PASS. No Korean pronunciation of Japanese words.
- **"wrong/incorrect" messages**: PASS. No negative framing.
- **Level/XP/Scores**: PASS. None present.
- **Streak pressure / "복습" word**: PASS. Not used.

### Code Quality
- Clean progressive retreat pattern (immediate -> audio_first -> emoji_hint). Well-structured state machine.
- Uses `exposureTracker` correctly for persistence.
- Timer cleanup on unmount is properly handled (`useEffect` cleanup).
- One minor note: the `handleTap` callback depends on `state` but also sets `state`. In rapid tapping, the closure might capture stale state. In practice this is unlikely to cause issues since UI taps are debounced by React Native's touch system.

### Interface Compatibility
- Props interface (`word`, `meaning`, `emoji?`, `onTap?`) is compatible with ToolkitView's inline meaning hint pattern.
- ToolkitView uses its own `InlineMeaningHint` component for simplicity, but could be refactored to use SafetyNetTooltip if the progressive retreat behavior is desired for toolkit expressions.

---

## exposureTracker.ts

### Immutable Rule Check
- **Korean pronunciation**: PASS.
- **"wrong/incorrect" messages**: PASS.
- **Level/XP/Scores**: PASS.
- **Streak pressure / "복습" word**: PASS.

### Code Quality
- In-memory cache with AsyncStorage persistence is a good pattern. Matches what `crossSituationTracker.ts` also uses.
- `defaultRecord()` creates a fresh record with `exposureCount: 0`. This is correct — the first call to `recordExposure()` will increment it to 1.
- `persist()` writes all records at once. For MVP this is fine, but with many expressions this could become slow. Consider batching or writing only changed records in the future.

### Interface Compatibility
- `ExposureRecord` and `SafetyNetBehavior` types are exported and used correctly by SafetyNetTooltip.
- `recordExposure()` should be called by the session engine whenever a word is shown. Currently this is not wired — **crossSituationTracker** and **exposureTracker** should both be called from the session flow (Engage/Catch phases) when expressions are encountered.

---

## Issues Found in Other Files

### SessionScreen.tsx (line 29): "복습" word violation
```typescript
const PHASE_LABELS: Record<SessionPhase, string> = {
  watch: "관찰",
  catch: "포착",
  engage: "실전",
  review: "복습",  // <-- VIOLATION: "복습" word
};
```
**Recommendation**: Change to "되돌아보기" or "정리" to avoid the review/repetition framing.

---

## Integration Notes for Variation System

1. **FSRS integration**: Variation situations, once added as DB records, will automatically get SRS cards through the existing `useSession.submitAttempt` flow. No changes to `fsrs.ts` are needed.

2. **Cross-situation tracking**: `crossSituationTracker.recordCrossSituation()` should be called during CatchPhase and EngagePhase when key expressions are encountered. This enables the ToolkitView to show accurate situation badges.

3. **exposureTracker wiring**: Similarly, `exposureTracker.recordExposure()` should be called alongside cross-situation tracking. Both trackers serve different purposes:
   - `exposureTracker`: drives SafetyNetTooltip behavior (progressive Korean meaning retreat)
   - `crossSituationTracker`: drives ToolkitView (which expressions are versatile)

4. **Variation data flow**: Current MVP has hardcoded variation links. When DB-backed variations are added, the `variationEngine.ts` should be updated to query from Supabase instead of using the hardcoded `VARIATION_LINKS` array.
