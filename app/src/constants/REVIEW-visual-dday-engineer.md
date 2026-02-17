# Review: notifications.ts & sessionResume.ts

Reviewed by: visual-dday-engineer
Date: 2026-02-17

## Files Reviewed

1. `app/src/lib/notifications.ts`
2. `app/src/lib/sessionResume.ts`

---

## Immutable Rule Check

### No Level/XP/Scores/Percentages
- notifications.ts: PASS - No mention of levels, XP, scores, or percentages.
- sessionResume.ts: PASS - No mention of levels, XP, scores, or percentages.

### No Streak Warnings or Guilt-Based Messaging
- notifications.ts: PASS - Explicitly bans guilt messaging in header comment. Return messages are light/casual ("도쿄가 그리워요", "편할 때 오세요"). Streak messages are framed as travel day counts, not pressure.
- sessionResume.ts: PASS - Resume prompt is neutral and helpful ("이어서 할까요?").

### No "wrong/incorrect" Messages
- notifications.ts: PASS - No such language.
- sessionResume.ts: PASS - No such language.

### No Korean Pronunciation of Japanese
- notifications.ts: PASS - Not applicable (no Japanese content in notifications).
- sessionResume.ts: PASS - Not applicable.

### No "복습" Word (use "정리" instead)
- notifications.ts: PASS - No occurrence of "복습".
- sessionResume.ts: PASS - Uses "정리" for the review phase label. Correct.

### Visual Tone: "travel guidebook" NOT "learning app"
- notifications.ts: PASS - All messaging uses Tokyo travel metaphor consistently ("도쿄 산책", "골목길", "동네 사람들").
- sessionResume.ts: PASS - Uses travel situation names for context.

---

## Banned Phrase Check

| Phrase | notifications.ts | sessionResume.ts |
|--------|-----------------|-----------------|
| "스트릭이 끊겼습니다" | Not found | Not found |
| "목표 미달성" | Not found | Not found |
| Guilt language | Not found | Not found |

---

## Interface Compatibility

- `SessionSnapshot` uses `SessionPhase` and `SessionMode` from `../types` - compatible with existing types.
- `notifications.ts` uses `expo-notifications` which is in package.json - OK.
- Both files use `AsyncStorage` consistently with the rest of the app.
- `PHASE_LABELS` in sessionResume.ts correctly maps all four `SessionPhase` values.

---

## Summary

Both files are clean. No immutable rule violations detected. The travel narrative tone is maintained throughout. All interfaces are compatible with existing types.
