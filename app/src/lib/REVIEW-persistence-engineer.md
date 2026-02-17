# Code Review: DDayBanner.tsx + situationThemes.ts

Reviewed by: persistence-engineer
Date: 2026-02-17

---

## DDayBanner.tsx

### Immutable Rule Compliance

- [x] No Level/XP/Scores/percentages shown to user
- [x] No streak warnings or guilt-based messaging
- [x] No "wrong/incorrect" messages
- [x] No "복습" word (uses none)
- [x] No Korean pronunciation (発音) shown
- [x] Travel narrative tone maintained (departure/trip framing)

**Verdict: PASS.** The component uses a D-Day countdown framed as a trip departure, which fits the travel narrative. No guilt language detected.

### Interface Compatibility with notifications.ts / sessionResume.ts

- The `departureDate` prop is self-contained (ISO string from settings). No coupling with notification or session modules. Clean boundary.
- The `daysRemaining` calculation could in theory be shared with `scheduleReturnNotification` (which also deals with "days since last activity"), but these are different concepts (departure countdown vs. inactivity), so no sharing needed. YAGNI applies.

### Code Quality

1. **getDaysRemaining**: Uses midnight normalization for both dates. Correct approach.
2. **getBannerContent**: Returns `null` for past dates, which cleanly short-circuits rendering. Good.
3. **Minor**: The `colors` import from `../constants/theme` is imported but never used in the component (all colors come from `getBannerColors`). This is harmless since tree-shaking handles it, but the import could be removed for cleanliness.

---

## situationThemes.ts

### Immutable Rule Compliance

- [x] No Level/XP/Scores/percentages
- [x] No streak warnings or guilt-based messaging
- [x] No "wrong/incorrect" messages
- [x] No "복습" word
- [x] No Korean pronunciation

**Verdict: PASS.** This is a pure data/config file with no user-facing text.

### Interface Compatibility

- The `SituationTheme.slug` field (e.g., "convenience_store", "restaurant") can be used by `notifications.ts` to generate situation-specific daily messages. The slug maps to situation names, but `notifications.ts` takes human-readable situation names (Korean), not slugs. No direct import needed; the caller is responsible for the mapping.
- `SituationTheme` and `SituationThemeDark` have identical shapes. They could be a single type, but having separate named types makes the intent clear and costs nothing. Fine as-is.

### Code Quality

1. **Map-based lookup**: `lightMap` / `darkMap` with fallback defaults is clean and O(1).
2. **8 themes for 22 situations**: Only 8 slugs are themed; the remaining 14 will get `defaultLightTheme`. This is fine — themes can be added incrementally.
3. **Dark mode support**: Both light and dark variants are provided. Consistent with `theme.ts` having both color sets.

---

## Summary

Both files are clean, follow the immutable rules, and have no direct coupling issues with `notifications.ts` or `sessionResume.ts`. No changes requested.
