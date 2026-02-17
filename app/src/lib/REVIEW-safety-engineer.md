# Safety Engineer Review

Reviewed files:
- `app/src/lib/npcEngine.ts`
- `app/src/lib/feedbackLayer.ts`
- `app/src/lib/npcPrompts.ts`

Reviewer: safety-engineer
Date: 2026-02-17

---

## Immutable Rule Violations

### No Korean Pronunciation (PASS)
None of the three files contain Korean pronunciation of Japanese text (e.g., no 후타리, 이랏샤이마세, etc.). All Japanese text is rendered in its native script. **No violations found.**

### [?] Korean Meaning Behavior (N/A)
These files do not render [?] tooltips — that's handled by `SafetyNetTooltip.tsx` and `ReviewPhase.tsx`.

### Sound First, Characters Later (PASS)
`npcPrompts.ts` instructs the NPC to respond only in Japanese (`日本語のみで応答`). No forced reading before listening. **No violations found.**

### No Level, XP, Scores (PASS)
None of the files reference levels, XP, or scores. **No violations found.**

---

## feedbackLayer.ts — Issues

### ISSUE 1: Meta-hint uses Korean grammar terminology (MINOR)
Lines 162-166 — the `hints` record contains grammar terminology:
```typescript
particle: "조사(で/に/を 등)를 확인해보세요",
conjugation: "동사 활용형을 확인해보세요",
politeness: "존댓말/반말 레벨을 맞춰보세요",
```
The project rules say "No grammar terminology." These hints use terms like 조사, 동사 활용형, 존댓말/반말 which are grammar terminology. These should be rephrased as plain-language hints. For example:
- "particle" -> "で, に, を のような小さい言葉を確認してみてください" or a Korean equivalent without the term 조사
- "conjugation" -> "문장 끝부분을 모델과 비교해보세요"
- "politeness" -> "정중한 표현을 써보세요"

**Severity: Minor** — The hints are only shown after 2+ repeated errors of the same type, so the blast radius is small. But it violates the "no grammar terminology" principle.

### ISSUE 2: Character overlap ratio threshold (OBSERVATION)
Line 63 — `ratio >= 0.6` for meaning match. This is a reasonable threshold but may be too lenient for short words (e.g., a single-character difference in a 3-character phrase is 66% match). For MVP this is acceptable, but worth monitoring.

---

## npcEngine.ts — Issues

### No violations found.
Clean implementation. The NPC stays in character, uses Japanese only, and properly delegates to feedbackLayer for classification. The recast pattern (`「${expectedResponse}」ですね。`) is natural and correct.

### OBSERVATION: shouldEnd logic
Line 90: `turnNumber >= Math.min(totalTurns - 1, 7)` — caps at 7 turns which aligns with the 5-7 turn requirement from the prompt spec. Good.

---

## npcPrompts.ts — Issues

### No violations found.
The system prompt explicitly forbids Korean/English responses, prevents meta-linguistic teacher behavior, and avoids negative words. Well-structured.

---

## Interface Compatibility

### SafetyNetTooltip + ReviewPhase integration
`ReviewPhase` passes `expr.textJa`, `expr.textKo`, and `expr.emoji` to `SafetyNetTooltip`. The `KeyExpression` type in `types/index.ts` has all three fields (`textJa`, `textKo`, `emoji?`). **Compatible.**

### feedbackLayer + npcEngine integration
`npcEngine` imports `classifyFeedback`, `classifyErrorType`, and types from `feedbackLayer`. All exports are properly aligned. **Compatible.**

### npcEngine + EngagePhase integration
`NpcResponse` from npcEngine returns `{ text, feedbackType, recastHighlight?, metaHint?, shouldEnd }`. The EngagePhase will need to consume this interface. **Interface is well-defined.**

---

## Code Quality

### feedbackLayer.ts
- Good: Clean separation of normalization, meaning matching, form matching, and difference detection.
- Good: Error type classification covers common Japanese learner mistakes (particles, conjugation, politeness).
- Minor: `findDifference` falls back to returning the entire `expectedNorm` when diff range is invalid (line 102). This is acceptable for MVP.

### npcEngine.ts
- Good: MVP-appropriate scripted approach with feedbackLayer classification.
- Good: Clear path to swap in real Claude API later.
- Good: Clarification doesn't end the conversation (`shouldEnd: false`).

### npcPrompts.ts
- Good: Concise, well-structured system prompt.
- Good: Error handling instructions follow the three-tier pattern (recast / clarification / meta-hint).

---

## Summary

| File | Violations | Severity |
|------|-----------|----------|
| npcPrompts.ts | 0 | - |
| npcEngine.ts | 0 | - |
| feedbackLayer.ts | 1 (grammar terminology in meta hints) | Minor |

**Recommendation**: Rephrase the meta-hint Korean text in `feedbackLayer.ts` to avoid grammar terminology. Everything else is clean.
