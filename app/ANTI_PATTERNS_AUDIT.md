# Anti-Pattern Audit Report
Date: 2026-02-17

## Summary
- Total files scanned: 77
- Violations found: 18
- Acceptable uses: 29
- Needs review: 5

---

## 1. Level / XP / Leaderboard
Search keywords: `level`, `xp`, `exp`, `leaderboard`, `레벨`, `경험치`

### Violations
None found.

### Acceptable Uses
- `src/lib/fsrs.ts:8` — `State` type uses `"learning"` / `"review"` / `"relearning"` — internal SRS state machine, not user-facing levels.
- `src/screens/OnboardingScreen.tsx:26` — `classifyLevel(score)` returns `UserLevel` — internal placement logic to select persona difficulty, never displayed to user.
- `src/types/index.ts:127` — `UserLevel` type — internal type definition.
- `src/components/phases/ReviewPhase.tsx:10` — Comment `"No scores, levels, XP"` — this is the rule documentation itself, not a violation.

### Notes
No XP, leaderboard, or gamification level system found anywhere in the codebase. This is clean.

---

## 2. Streak Warnings
Search keywords: `streak`, `끊`, `미달`, `연속`, `스트릭`

### Violations
None found.

### Acceptable Uses
- `src/lib/notifications.ts:5` — BANNED list comment explicitly bans guilt-based messaging. Good.
- `src/lib/notifications.ts:42-58` — `STREAK_MESSAGES` use travel-day framing ("도쿄 여행 N일차"). Compliant.
- `src/lib/notifications.ts:184` — `generateStreakMessage()` uses "도쿄 여행 N일차" framing. Compliant.
- `src/screens/HomeScreen.tsx:117-188` — Streak count calculated and displayed as `도쿄 여행 ${streakCount}일차!`. Compliant reframing.

### Notes
All streak references use the "도쿄 여행 N일차" reframing. No guilt-based messaging found.

---

## 3. "Wrong/Incorrect" Messages
Search keywords: `틀렸`, `wrong`, `incorrect`, `오답`, `불합격`, `fail`

### Violations
1. **`src/components/phases/activities/SoundDistinction.tsx:97-99`** — When user answers incorrectly, the color turns `styles.wrongText` (red). While the message itself says "다시 들어볼까요?" (soft), the **red color styling** (`wrongText: { color: colors.danger }`) creates a "wrong" visual signal.
   - **Recommended fix**: Use `colors.textMuted` or a neutral color instead of `colors.danger` for incorrect answers. The text message itself is already compliant.

2. **`src/components/UserBubble.tsx:15,58-60`** — `DIFF_COLORS.wrong` = `"#FCA5A5"` (red) is applied to mismatched characters in user speech. While this is diff visualization (not a message), the variable name `wrong` and red coloring frame errors negatively.
   - **Recommended fix**: Rename `wrong` to `differs` or `mismatch`. Consider using a less alarming color like amber/yellow.

3. **`src/visualization/ComparisonCanvas.tsx:74,80,98,202-224`** — Pitch comparison uses `moraCellWrong`, `moraCellTextWrong`, `moraLabelWrong` styles with red (#FEE2E2, #DC2626). Also shows "✗" marks for incorrect moras (line 113).
   - **Recommended fix**: Rename style names from `Wrong` to `Differs`. Replace "✗" with a more neutral indicator. Consider using amber instead of red for pitch differences.

4. **`src/components/phases/activities/ChunkCatch.tsx:27,49,90,103,153`** — `isWrong` state variable and `choiceWrong` style with `borderColor: colors.danger`. The hint message ("한번 더 들어볼게요...") is soft, but the red border frames the wrong choice negatively.
   - **Recommended fix**: Rename `isWrong` to `shouldRetry`. Change `choiceWrong` border to `colors.border` or neutral color.

5. **`src/components/phases/activities/WordCatch.tsx:49,79,87,151`** — Comment `// Wrong — replay and reset`, variable `wrong`, style `choiceWrong` with `colors.danger` border and background.
   - **Recommended fix**: Same as ChunkCatch — use neutral styling, rename variables.

6. **`src/components/phases/inputs/ChoiceInput.tsx:78,137`** — `choiceWrong` style fades out the wrong choice (opacity 0.5) while highlighting the correct one. The opacity approach is actually softer than red, but the style name `choiceWrong` is still problematic in code.
   - **Recommended fix**: Rename `choiceWrong` to `choiceUnselected` or `choiceFaded`.

7. **`src/components/phases/inputs/FillBlankInput.tsx:60,146`** — `chipWrong` style uses `borderColor: colors.danger` and `backgroundColor: colors.dangerLight` (red).
   - **Recommended fix**: Use neutral colors, rename style.

### Acceptable Uses
- `src/lib/feedbackLayer.ts:74,175` — Internal logic comments (`"got wrong"`, `"form is wrong"`) — code comments, not user-facing.
- `src/lib/textDiff.ts:19` — `DiffStatus = "correct" | "wrong" | "missing" | "extra"` — internal data type for diff algorithm.
- `src/lib/variationEngine.ts:12-13` — `roleInBase: "wrong_choice"` — internal cross-situation data model, never displayed.
- `src/lib/npcPrompts.ts:6` — Comment `never "wrong"` — rule documentation.
- `src/lib/variationEngine.ts:7` — Comment `No "wrong/incorrect" framing` — rule documentation.
- `src/components/phases/EngagePhase.tsx:142,152,273-274` — `incorrectCount` / `incorrectRef` — internal counter, used only to pass to `EngagePerformance`, never shown to user.
- `src/types/index.ts:124` — `incorrectCount: number` — internal type field.
- `src/__tests__/*` — All test files — not user-facing.
- `src/audio/dtwConfig.ts:112` — `failThreshold` — internal pitch scoring config.
- `console.error` / `catch (error)` patterns — error handling, not user-facing messaging.

### Needs Review
- **`src/audio/pitchCompare.ts:200-207`** — `wrongMoras` variable used internally, but the resulting feedback message ("의 높낮이를 확인해보세요") is user-facing and phrased constructively. Variable should be renamed but message is compliant.

---

## 4. Scores / Percentages
Search keywords: `score`, `%`, `정답률`, `accuracy`, `percent`

### Violations
1. **`src/components/UserBubble.tsx:39,107`** — Shows `{pct}%` badge directly on user speech bubble with color-coded badge (green/yellow/red). Users see their accuracy as a percentage after every utterance.
   - **Recommended fix**: Remove the percentage badge entirely. The diff-highlighted text already shows what was different. Replace with ability-statement or no badge at all.

2. **`src/screens/HistoryScreen.tsx:140,166`** — Shows `{Math.round(totalStats.averageAccuracy * 100)}%` as "평균 정확도" in summary card, and `{Math.round(day.accuracy * 100)}%` per day in daily stats.
   - **Recommended fix**: Replace percentage with qualitative descriptions (e.g., completion count, ability statement). Or remove the accuracy column entirely and focus on situations completed.

3. **`src/screens/FlashcardScreen.tsx:215-216`** — Shows `정확도: {Math.round(card.accuracy * 100)}%` in the flashcard progress row.
   - **Recommended fix**: Remove the accuracy percentage. The SRS grading buttons already let the user self-evaluate. No need to show a numerical score.

4. **`src/screens/SituationListScreen.tsx:164-168`** — Shows `최고 기록: {Math.round(situation.progress.best_accuracy * 100)}%` for completed situations.
   - **Recommended fix**: Replace with ability statement (e.g., AbilityStatement component) or remove entirely. Show attempt count only if needed.

5. **`src/visualization/ComparisonCanvas.tsx:32-38`** — Shows pitch score as a large number (28pt font) with colored badge: `{result.score}` with label like "훌륭해요!", "좋아요!".
   - **Recommended fix**: Remove the numeric score. Keep only the qualitative labels ("훌륭해요!", "좋아요!", etc.).

6. **`src/visualization/ComparisonCanvas.tsx:127`** — Shows `{result.correctCount}/{result.totalScorable} 모라 정확` as stats text.
   - **Recommended fix**: Remove this fractional score display. The per-mora visual grid already communicates the details.

### Acceptable Uses
- `src/lib/textDiff.ts:31-32,306-313` — Internal `score` field in `TextDiffResult` — used by diff algorithm, acceptable if not displayed.
- `src/lib/fsrs.ts:255-260` — `getRatingFromAccuracy()` — internal SRS scheduling, not displayed.
- `src/hooks/useSession.ts:23,106,171-192` — Internal accuracy calculation for SRS grading and progression logic.
- `src/lib/sessionProgress.ts:37,47,57` — `best_accuracy` in DB operations — internal data.
- `src/screens/OnboardingScreen.tsx:26-28,60-61` — `classifyLevel(score)` — internal placement, not displayed.
- `src/components/phases/activities/ShadowSpeak.tsx:28-37,72-73` — Internal `calcAccuracy()` used to decide if user passes (>= 70). The **displayed text** only says "좋아요, 넘어갈게요" or "한번 더 들어볼까요?" — no number shown.
- `src/components/phases/ReviewPhase.tsx:5,10,159` — Comments explicitly state "no score/percentage". `getAbilityStatement()` returns qualitative text. Compliant.
- `src/audio/dtwConfig.ts`, `src/audio/pitchCompare.ts` — Internal scoring constants and algorithms.
- `src/__tests__/textDiff.test.ts` — Test assertions — not user-facing.
- CSS percentage values (e.g., `width: "100%"`, `maxWidth: "80%"`) — layout, not content scores.

### Needs Review
- **`src/components/phases/activities/ShadowSpeak.tsx:160-168`** — The accuracy value is stored in state but **not displayed as a number** to the user. The UI shows only "좋아요, 넘어갈게요" or "한번 더 들어볼까요?". The style name `accuracyLabel` is misleading but the implementation is compliant.

---

## 5. Korean Pronunciation of Japanese
Search keywords: `발음`, `pronunciation_ko`, `reading_ko`, `후타리`, `이랏샤이마세`

### Violations
1. **`src/screens/FlashcardScreen.tsx:243-244`** — Displays `{card.pronunciation_ko}` directly on the flashcard answer side. Korean phonetic rendering of Japanese text is always visible when card is flipped.
   - **Recommended fix**: Remove `pronunciation_ko` display. The TTS "발음 듣기" button already exists — users should hear pronunciation, not read a Korean approximation.

2. **`src/screens/VocabularyScreen.tsx:155`** — Shows `{item.reading_ko}` (Korean phonetic reading) in every vocabulary card, always visible.
   - **Recommended fix**: Remove `reading_ko` display entirely. Keep only `reading_hiragana` + TTS playback. If Korean reading must exist, hide it behind a [?] tap that fades.

3. **`src/components/NpcBubble.tsx:62-63`** — Shows `{line.pronunciation_ko}` above Japanese text when `showPronunciation` is true.
   - **Recommended fix**: Remove Korean pronunciation display. Users should rely on TTS (already available via speaker icon) and furigana, not Korean phonetic approximation.

### Acceptable Uses
- `src/types/index.ts:49` — `pronunciation_ko: string | null` — type definition, acceptable in data model.
- `src/types/index.ts:144` — `reading_ko: string` — type definition for Vocabulary.
- `src/screens/FlashcardScreen.tsx:254` — `"발음 듣기"` button label — this refers to TTS playback, not Korean pronunciation text. This is good.

---

## 6. "복습" Word
Search keywords: `복습`

### Violations
None found.

### Notes
The word `복습` does not appear anywhere in the codebase. The ReviewPhase uses "이번에 배운 표현" and "대화 완료!" instead. The term "정리" or "되돌아보기" is not used either, but the absence of "복습" is compliant.

---

## 7. L1 Translation Always Visible
Search: patterns where Korean meaning is shown without [?] button tap

### Violations
1. **`src/screens/VocabularyScreen.tsx:156`** — `{item.meaning_ko}` is always visible in vocabulary cards. Korean meaning is displayed permanently without any tap-to-reveal mechanism.
   - **Recommended fix**: Hide `meaning_ko` behind a [?] tap with 3-second fade, consistent with SafetyNetTooltip pattern.

2. **`src/screens/FlashcardScreen.tsx:237,246`** — Korean text (`text_ko`) is the primary content shown on the front of the flashcard, and also shown on the answer side as `cardKoreanSmall`. This is the core mechanic of the flashcard (Ko -> Ja), so the front side is intentional, but the answer side shows Korean permanently alongside Japanese.
   - **Needs review**: The Ko->Ja flashcard format inherently requires showing Korean. However, on the answer side, `text_ko` could be hidden behind a tap.

### Acceptable Uses
- `src/components/NpcBubble.tsx:86-98` — Korean translation is hidden behind "터치하여 번역" blur and only revealed on tap. Compliant.
- `src/components/phases/WatchPhase.tsx:138-162,219-230` — Korean translation requires button tap ("한국어로 보기"), shown with animated 3-second fade. Compliant.
- `src/components/SafetyNetTooltip.tsx` — Full progressive retreat system (immediate -> audio_first -> emoji_hint). Korean always fades after 3 seconds. Compliant.
- `src/components/ToolkitView.tsx:67-98` — `InlineMeaningHint` uses [?] button with 3-second fade. Compliant.
- `src/components/phases/ReviewPhase.tsx:222-228` — Uses `SafetyNetTooltip` for meaning reveal. Compliant.

### Needs Review
- **`src/components/phases/ReviewPhase.tsx:246-253`** — Grammar explanations are in Korean and expand on tap. These are educational context (explaining patterns like "에는 '이걸로!'라는 선택의 느낌이에요"), not direct translations. This is acceptable per the exception rule.

---

## 8. Vocabulary/Flashcard as "Memorization"
Check: `VocabularyScreen.tsx`, `FlashcardScreen.tsx`

### Violations
1. **`src/screens/VocabularyScreen.tsx:169`** — Screen title is `"단어장"` (word book/vocabulary list). This frames the feature as traditional vocabulary memorization.
   - **Recommended fix**: Rename to `"소리 도구함"` or `"표현 모음"` to reframe as "sound toolbox" rather than "word memorization list".

2. **`src/screens/FlashcardScreen.tsx:187,208`** — Screen title is `"플래시카드"`. The grading label (line 260) says `"얼마나 잘 기억했나요?"` — this explicitly frames the activity as memorization recall.
   - **Recommended fix**: Rename screen to `"소리 확인"` or `"표현 복기"`. Change grading label to `"이 표현이 얼마나 익숙한가요?"` to reframe from memory test to familiarity check.

3. **`src/screens/HomeScreen.tsx:413`** — Quick action label `"단어장"` links to VocabularyScreen.
   - **Recommended fix**: Rename to match the new VocabularyScreen title.

### Acceptable Uses
- `src/screens/HomeScreen.tsx:427` — Quick action `"도구 세트"` for ToolkitView — already uses the correct framing.
- `src/components/ToolkitView.tsx:155` — `"나의 도구 세트"` — correct framing.

---

## 9. Grammar Terminology
Search keywords: `문법`, `조사`, `동사`, `활용`, `grammar`

### Violations
1. **`src/components/NpcBubble.tsx:107`** — Toggle text `"문법 팁"` uses grammar terminology directly in UI.
   - **Recommended fix**: Replace with `"이 표현은?"` or `"왜 이렇게 말할까?"` (already used in ReviewPhase).

2. **`src/screens/VocabularyScreen.tsx:33-40`** — `POS_COLORS` map uses grammar terms as filter labels displayed to user: `"명사"`, `"동사"`, `"형용사"`, `"부사"`, `"조사"`, `"접속사"`, `"감탄사"`, `"조동사"`. These are shown as filter tabs in the UI (line 213-214).
   - **Recommended fix**: Replace grammar terms with plain-language descriptions: `"사물"` (명사), `"동작"` (동사), `"상태"` (형용사), etc. Or remove POS filtering entirely and group by situation instead.

3. **`src/types/index.ts:146`** — `pos: string; // 품사 (명사, 동사, 형용사 등)` — while this is a type definition, the `pos` values flow through to user-facing filter tabs in VocabularyScreen.
   - **Recommended fix**: Add a display mapping in VocabularyScreen that converts technical POS tags to plain-language labels.

### Acceptable Uses
- `src/components/phases/ReviewPhase.tsx:45-46` — Comment `"No grammar terminology — plain-language Korean explanations"` — rule documentation.
- `src/components/phases/ReviewPhase.tsx:56-106` — `grammarExplanations` content uses plain language: "메뉴를 골랐을 때, に는 '이걸로!'라는 선택의 느낌이에요" — no grammar jargon in actual explanations. Compliant.
- `src/components/phases/ReviewPhase.tsx:237` — Toggle text `"왜 이렇게 말할까?"` — plain language. Compliant.
- `src/lib/feedbackLayer.ts:116-127` — Internal particle/conjugation classification — not user-facing.
- `src/lib/feedbackLayer.ts:163-166` — Meta hints use soft language: "작은 단어를 모델과 비교해보세요" (for particles), "문장 끝부분을 모델 대화와 비교해보세요" (for conjugation) — mostly plain language.

### Needs Review
- **`src/lib/feedbackLayer.ts:165`** — `"정중한 표현을 써보세요"` — uses `"정중한 표현"` which could be considered grammar-adjacent, but it's actually fairly plain language. Likely acceptable.
- **`src/visualization/ComparisonCanvas.tsx:128`** — `"악센트 핵 ✓"` / `"악센트 핵 ✗"` — `"악센트 핵"` is a technical phonetics term displayed to user. Consider replacing with `"강세 위치"` or removing.

---

## Recommended Fixes (Priority Order)

### High Priority (User-facing, directly contradicts design philosophy)

1. **Remove percentage badges from UserBubble** (`src/components/UserBubble.tsx:106-108`)
   - Delete the `{pct}%` badge. The diff-highlighted text is sufficient feedback.

2. **Remove accuracy percentages from HistoryScreen** (`src/screens/HistoryScreen.tsx:140,166`)
   - Replace with situation completion counts or ability statements.

3. **Remove accuracy percentages from SituationListScreen** (`src/screens/SituationListScreen.tsx:164-168`)
   - Replace `"최고 기록: X%"` with ability statements or remove.

4. **Remove Korean pronunciation from FlashcardScreen** (`src/screens/FlashcardScreen.tsx:243-244`)
   - Delete `pronunciation_ko` display. TTS button already exists.

5. **Remove Korean pronunciation from VocabularyScreen** (`src/screens/VocabularyScreen.tsx:155`)
   - Remove `reading_ko` display. Keep `reading_hiragana` + TTS.

6. **Remove Korean pronunciation from NpcBubble** (`src/components/NpcBubble.tsx:62-63`)
   - Remove the `pronunciation` display above Japanese text.

7. **Hide meaning_ko behind tap in VocabularyScreen** (`src/screens/VocabularyScreen.tsx:156`)
   - Add SafetyNetTooltip-style [?] tap-to-reveal with 3s fade.

### Medium Priority (Framing and naming issues)

8. **Rename "단어장" to "소리 도구함"** across HomeScreen and VocabularyScreen
9. **Rename "플래시카드" and change "기억했나요?" framing** in FlashcardScreen
10. **Replace "문법 팁" with "왜 이렇게 말할까?"** in NpcBubble
11. **Replace grammar POS terms with plain language** in VocabularyScreen filter tabs
12. **Remove numeric pitch score from ComparisonCanvas** — keep only qualitative labels
13. **Remove fractional mora score** from ComparisonCanvas stats line
14. **Remove accuracy label from FlashcardScreen** progress row

### Low Priority (Internal code naming, no user impact)

15. Rename `wrong` to `differs`/`mismatch` in UserBubble DIFF_COLORS
16. Rename `choiceWrong`/`chipWrong`/`moraCellWrong` styles across activity components
17. Rename `isWrong` to `shouldRetry` in ChunkCatch
18. Rename `wrongMoras` to `differingMoras` in pitchCompare.ts
19. Use neutral colors (amber/yellow) instead of red for incorrect selections in choice activities
20. Rename `incorrectCount` to `retryCount` in EngagePhase (internal only, low priority)
