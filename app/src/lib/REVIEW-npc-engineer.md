# Code Review — npc-engineer

Reviewed files:
- `app/src/lib/exposureTracker.ts`
- `app/src/components/SafetyNetTooltip.tsx`

---

## exposureTracker.ts

### Immutable Rule Check
- No Korean pronunciation: PASS
- No "wrong/incorrect": PASS
- No Level/XP/Scores/percentages: PASS
- No streak pressure: PASS
- NPC character integrity: N/A (utility module)

### Interface Compatibility
- `ExposureRecord` and `SafetyNetBehavior` types are clean and self-contained.
- `getExposure()` returns a default record for unknown words (good defensive behavior).
- Compatible with SafetyNetTooltip's import of `getExposure`, `getSafetyNetBehavior`, `recordSafetyNetTap`.

### Code Quality
- **Good**: In-memory cache avoids repeated AsyncStorage reads.
- **Good**: `defaultRecord()` factory ensures consistent defaults.
- **Minor**: `loadAll()` parses JSON without try/catch. If AsyncStorage contains corrupted data, the app will crash. Consider wrapping in try/catch with a fallback to empty map.
- **Minor**: `persist()` is called on every `recordExposure` and `recordSafetyNetTap`. For frequent calls, consider debouncing to reduce I/O.
- **Note**: The cache is module-level singleton. This is fine for a single-user app but worth noting for testability (no reset mechanism).

### Verdict: APPROVE with minor suggestions

---

## SafetyNetTooltip.tsx

### Immutable Rule Check
- No Korean pronunciation: PASS — shows Korean *meaning* (not pronunciation), which is the intended L1 safety net behavior.
- No "wrong/incorrect": PASS
- No Level/XP/Scores/percentages: PASS
- No streak pressure: PASS
- NPC character integrity: N/A (UI component, not NPC dialogue)

### Interface Compatibility
- Props (`word`, `meaning`, `emoji`, `onTap`) are clean and minimal.
- Correctly imports and uses exposureTracker functions.
- The component is self-contained — easy to drop into ReviewPhase or EngagePhase.

### Code Quality
- **Good**: Progressive retreat logic (immediate -> audio_first -> emoji_hint) is cleanly implemented.
- **Good**: Auto-fade with cleanup on unmount prevents memory leaks.
- **Good**: Toggle behavior — tapping when meaning is shown hides it.
- **Minor**: In `audio_first` mode, there's a 3s delay before showing meaning, but the TTS also takes time. If TTS finishes before 3s, user sees nothing for the gap. Consider using Speech's `onDone` callback to start the delay from TTS completion.
- **Minor**: The `handleTap` callback dependency array includes `state`, but `state` changes trigger re-creation of the callback on every state change. Since the callback reads state via closure, this is correct but slightly inefficient. Not a real concern given the tap frequency.
- **Good**: The `?` button is compact (28x28) and visually unobtrusive.

### Verdict: APPROVE with minor suggestions

---

## Summary

Both files are well-written, follow immutable rules, and have compatible interfaces. The progressive safety net retreat is a good UX pattern that avoids L1 dependency without cold-turkey removal. Minor robustness improvements suggested but nothing blocking.
