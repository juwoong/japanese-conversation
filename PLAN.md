# Project Plan

## 다음 세션

**v1 리디자인 진행 중** — Phase A (01 온보딩 + 02 여행지도) 병렬 실행.

---

# v1 리디자인 실행 계획

> 시작일: 2026-02-17
> 현재 Phase: A

## 의존 관계

```
Phase A (병렬):  01-onboarding ──┐
                 02-travel-map ──┼──→ Phase B: 03-four-phase
                                 │
Phase C (병렬):  04-ai-npc ──────┤
                 05-l1-safety ───┼──→ Phase D: 07-persistence
                 06-repetition ──┘
```

## Phase A: 독립 실행 (병렬)

### 01 - 온보딩 리디자인: 공항 도착 체험

- [ ] Step 1: 현재 OnboardingScreen 분석 + 3단계 플로우 설계
- [ ] Step 2: OnboardingScreen.tsx 리디자인 (3단계 state machine)
- [ ] Step 3: SessionModeSelector.tsx 구현 (매 세션 음성/묵음 분기)
- [ ] Step 4: 통합 테스트 + 시뮬레이터 검증

### 02 - 메인 화면: 여행 동선 지도

- [ ] Step 1: 현재 HomeScreen 분석 + 지도 데이터 모델 설계
- [ ] Step 2: TravelMap.tsx 컴포넌트 구현
- [ ] Step 3: AbilityStatement.tsx + "오늘의 추천" 구현
- [ ] Step 4: HomeScreen 통합 + SituationListScreen 역할 정리
- [ ] Step 5: 통합 테스트

## Phase B: Phase A 완료 후

### 03 - 4 Phase 학습 엔진

- [ ] Step 1: 세션 state machine 설계 + 데이터 모델
- [ ] Step 2: Phase 1 관찰(Watch) 구현
- [ ] Step 3: Phase 2 포착(Catch) 구현
- [ ] Step 4: Phase 3 참여(Engage) 구현
- [ ] Step 5: Phase 4 정리(Review) 구현
- [ ] Step 6: 식당 상황 전체 플로우 통합 테스트

## Phase C: Phase B 완료 후 (병렬)

### 04 - AI NPC & 피드백 계층화
- [ ] NPC 프롬프트 + feedbackLayer + Edge Function + 통합 테스트

### 05 - L1 안전망 & 문자 체계
- [ ] SafetyNetTooltip + exposureTracker + 앰비언트 노출 + 통합

### 06 - 반복 학습 변주
- [ ] 변주 시나리오 + 교차 반복 + 도구 세트 + FSRS 연동

## Phase D: 전체 마무리

### 07 - 지속성 & 비주얼
- [ ] 알림 + 세션 복귀 + D-Day + 테마 + Anti-Pattern 전수 검증

## 불변 규칙

- 한국어 발음 표기 금지 / "틀렸습니다" 금지 / 레벨·XP·점수 금지 / 스트릭 끊김 경고 금지 / L1 상시 표시 금지

---

# 이전 계획 (참고용)

## 이전 다음 세션 (보류)

**Phase 4 남은 운영 작업**:
1. furigana 생성 스크립트 실행: `GEMINI_API_KEY=... npx tsx scripts/add-furigana.ts`
2. Supabase migration 적용: `003_furigana.sql`
3. Supabase import 재실행 (furigana 포함)

---

## Sprint 7 — JLPT 레벨 태깅

### 목표
22개 상황 × 347개 어휘에 JLPT N5~N1 레벨 태깅 → 필터링/난이도 파악 가능하게.

### 수정 파일

| # | 파일 | 작업 | 설명 |
|---|------|------|------|
| 1 | `scripts/tag-jlpt-levels.ts` | 생성 | Gemini로 기존 어휘 JLPT 태깅 |
| 2 | `scripts/generate-vocab-sql.ts` | 생성 | JSON→SQL 변환 (jlpt_level 포함) |
| 3 | `scripts/generate-vocabulary.ts` | 수정 | VocabItem에 jlpt_level, 프롬프트 수정 |
| 4 | `backend/supabase/migrations/003_add_jlpt_level.sql` | 생성 | ALTER TABLE + INDEX + 기존 데이터 UPDATE |
| 5 | `scripts/output/vocabulary_insert.sql` | 재생성 | jlpt_level 컬럼 포함 INSERT문 |
| 6 | `scripts/output/*.json` (22개) | 수정 | 태깅 스크립트 실행 결과 |
| 7 | `app/src/types/index.ts` | 수정 | Vocabulary에 jlpt_level 추가 |
| 8 | `app/src/screens/VocabularyScreen.tsx` | 수정 | JLPT 필터 + 배지 UI |

### 상태
| # | 항목 | 상태 |
|---|------|------|
| 1 | tag-jlpt-levels.ts 생성 | [ ] |
| 2 | 태깅 스크립트 실행 (22개 JSON 업데이트) | [ ] |
| 3 | generate-vocab-sql.ts 생성 | [ ] |
| 4 | vocabulary_insert.sql 재생성 | [ ] |
| 5 | 003_add_jlpt_level.sql 마이그레이션 | [ ] |
| 6 | generate-vocabulary.ts 수정 | [ ] |
| 7 | app/src/types/index.ts 수정 | [ ] |
| 8 | VocabularyScreen JLPT 필터+배지 | [ ] |

---

## 발음 피드백 시스템 (Phase 1-4)

### Phase 1: 오디오 캡처 + 실시간 피치 시각화 [x] 코드 완료, [ ] 디바이스 테스트

| ID | 항목 | 상태 |
|----|------|------|
| P1.0 | expo-dev-client + 패키지 설치 | [x] |
| P1.1 | pitchConfig.ts (파라미터 시트) | [x] |
| P1.2 | useAudioStream.ts (AudioRecorder 기반) | [x] |
| P1.3 | usePitchDetection.ts (pitchy + ring buffer) | [x] |
| P1.4 | useRMSEnergy.ts (노이즈 게이트) | [x] |
| P1.5 | pitchVizTokens.ts (디자인 토큰) | [x] |
| P1.6 | PitchCanvas.tsx (Skia 시각화) | [x] |
| P1.7 | PitchTestScreen.tsx + 라우트 | [x] |
| P1.8 | npx expo prebuild + 디바이스 테스트 | [ ] |

### Phase 2: 기준 데이터 + 억양 비교 피드백 [x] 코드 완료, [ ] 디바이스 테스트

**설계 변경**: DTW 전체 윤곽 → H/L 이진 패턴 매칭 (V1)

| ID | 항목 | 상태 |
|----|------|------|
| P2.1 | types/pitch.ts (타입 정의) | [x] |
| P2.2 | pitchMath.ts (공유 유틸 추출) | [x] |
| P2.3 | moraSegmenter.ts (모라 분할) | [x] |
| P2.4 | pitchCompare.ts (H/L 패턴 비교) | [x] |
| P2.5 | referencePitch.ts (정적 레퍼런스 데이터) | [x] |
| P2.6 | ComparisonCanvas.tsx (비교 결과 시각화) | [x] |
| P2.7 | PitchTestScreen 비교 모드 UI | [x] |
| P2.8 | analysis/dtw.ts (V2용 DTW, 에이전트 작성) | [x] |
| P2.9 | 디바이스 테스트 | [ ] |

### Phase 3: STT 정확도 + 텍스트 diff + 하이라이트 [x] 코드 완료, [ ] 디바이스 테스트

**설계 변경**: STTEngine 추상화 삭제 (YAGNI), PlatformSTTEngine 삭제, whisper.rn 삭제

| ID | 항목 | 상태 |
|----|------|------|
| P3.A | japaneseNormalize.ts (일본어 텍스트 정규화) | [x] |
| P3.B | textDiff.ts 개선 (japaneseNormalize 통합) | [x] |
| P3.C | stt.ts — Whisper prompt 파라미터 추가 | [x] |
| P3.D | useSession.ts — Levenshtein→Myers diff 교체 | [x] |
| P3.E | UserBubble.tsx — 인라인 diff 하이라이트 | [x] |
| P3.F | SessionScreen.tsx — expectedText/diffSegments 연동 | [x] |
| P3.G | 디바이스 테스트 | [ ] |

### Phase 4: 후리가나 표시 시스템 [x] 코드 완료, [ ] 운영 실행, [ ] 디바이스 테스트

**설계 변경**: kuromoji.js runtime 삭제 (5명 합의), 빌드타임 pre-computed furigana 채택, mora timing defer

| ID | 항목 | 상태 |
|----|------|------|
| P4.A | FuriganaSegment 타입 + Line.furigana 필드 | [x] |
| P4.B | FuriganaText.tsx 컴포넌트 | [x] |
| P4.C | add-furigana.ts 스크립트 (Gemini API) | [x] 작성, [ ] 실행 |
| P4.D | DB migration 003_furigana.sql | [x] 작성, [ ] 적용 |
| P4.E | NpcBubble FuriganaText 연동 | [x] |
| P4.F | SessionScreen footer FuriganaText 연동 | [x] |
| P4.G | import-to-supabase.ts furigana 필드 추가 | [x] |
| P4.H | 디바이스 테스트 | [ ] |

### 기술 스택 결정사항

| 영역 | 선택 | 변경 이력 |
|------|------|-----------|
| 오디오 입력 | `react-native-audio-api` (AudioRecorder) | live-audio-stream → audio-api (DA 리뷰) |
| 피치 감지 | `pitchy` (JS, McLeod Pitch Method) | 원안 유지 |
| 시각화 | `@shopify/react-native-skia` | 원안 유지 (DA: SVG 대안 기각) |
| 애니메이션 | `react-native-reanimated` v4 | 원안 유지 |
| 개발 환경 | `expo-dev-client` | 추가 (DA: Phase 0 필수) |
| STT | Whisper API (직접 호출) + `prompt` 바이어싱 | P3: 네이티브 STT 삭제 (DA: 비원어민 정확도 낮음) |
| 텍스트 비교 | Myers diff (문자 단위) + 일본어 정규화 | P3: Levenshtein → Myers diff 교체 |
| 후리가나 | 빌드타임 pre-computed (Gemini API) | P4: kuromoji.js runtime 삭제 (5명 합의) |

---

## (보류) Sprint 6 — 어휘 데이터 개선

6개 서브에이전트 감사 결과를 종합한 사용자 관점 개선 계획입니다.

---

## Sprint 6 — 어휘 데이터 개선

### 현재 문제점

1. **발음 정보가 문장 단위로만 존재**
   - 현재: `"いらっしゃいませ。ご注文は?"` → `"이랏샤이마세. 고츄-몬와?"` (전체 문장)
   - 필요: 각 단어별 발음 (`いらっしゃいませ` → `이랏샤이마세`)

2. **개별 단어/어휘 데이터 없음**
   - `key_expressions`는 텍스트만 있고 상세 정보(의미, 읽기, 품사) 없음
   - VocabularyScreen이 "단어장"이 아닌 "문장장"으로 동작

3. **한자 읽기(후리가나) 없음**
   - `四百円` → `よんひゃくえん` 정보 부재
   - 한자 학습에 필수적인 정보 누락

### 작업 항목

| ID | 항목 | 상태 | 난이도 |
|----|------|------|--------|
| V1 | Vocabulary 타입 추가 (`app/src/types/index.ts`) | [ ] | XS |
| V2 | vocabulary 테이블 마이그레이션 (`backend/supabase/migrations/`) | [ ] | S |
| V3 | 어휘 추출 스크립트 작성 (`scripts/generate-vocabulary.ts`) | [ ] | M |
| V4 | 22개 상황 JSON에 vocabulary 데이터 추가 | [ ] | M |
| V5 | VocabularyScreen 단어별 UI로 개편 | [ ] | M |
| V6 | (선택) SessionScreen 단어 탭 인터랙션 | [ ] | S |

### V1: Vocabulary 타입
```typescript
interface Vocabulary {
  id: number;
  word_ja: string;           // 日本語 단어
  reading_hiragana: string;  // ひらがな 읽기
  reading_ko: string;        // 한글 발음
  meaning_ko: string;        // 한국어 의미
  pos: string;               // 품사 (명사, 동사, 형용사 등)
}
```

### V4: 개선된 데이터 구조 예시
```json
{
  "situation_slug": "cafe",
  "lines": [...],
  "vocabulary": [
    {
      "word_ja": "ご注文",
      "reading_hiragana": "ごちゅうもん",
      "reading_ko": "고츄몬",
      "meaning_ko": "주문",
      "pos": "명사",
      "appears_in_lines": [1]
    }
  ]
}
```

### 수정 파일 목록

| 파일 | 변경 내용 |
|------|----------|
| `app/src/types/index.ts` | Vocabulary 인터페이스 추가 |
| `backend/supabase/migrations/002_vocabulary.sql` | vocabulary, line_vocabulary 테이블 |
| `scripts/generate-vocabulary.ts` | 어휘 추출 스크립트 (신규) |
| `scripts/output/*.json` | 22개 파일에 vocabulary 배열 추가 |
| `app/src/screens/VocabularyScreen.tsx` | 단어별 UI로 전면 개편 |

### 시작 순서
1. `app/src/types/index.ts`에 Vocabulary 타입 추가
2. `scripts/generate-vocabulary.ts` 스크립트 작성
3. cafe.json으로 테스트 후 전체 22개 파일에 적용
4. DB 마이그레이션 및 앱 UI 수정

### 필요 컨텍스트
- Claude API 키: `.env`의 `ANTHROPIC_API_KEY`
- 기존 스크립트 참고: `scripts/generate-lines.ts`

---

## (완료) Sprint 1-5 — UX 개선

모든 Sprint 완료 (2026-02-06).

---

## Sprint 2 — Critical: 핵심 기능 미연결 (3 items)

### [C1] FlashcardScreen 자가평가 버튼 추가
- **문제**: `gradeFlashcard()`가 `lib/flashcardGrading.ts`에 구현되어 있지만 FlashcardScreen에서 **한 번도 import/호출하지 않음**. 사용자가 카드를 넘기기만 할 뿐 SRS 스케줄이 절대 업데이트되지 않음.
- **파일**: `src/screens/FlashcardScreen.tsx`
- **변경**: 답 확인 후 Again/Hard/Good/Easy 4버튼 표시 → `gradeFlashcard(card.id, rating)` 호출 → 다음 카드 이동
- **난이도**: S

### [C2] HomeScreen에서 플래시카드 직접 접근
- **문제**: 플래시카드가 VocabularyScreen → "플래시카드" 버튼으로만 접근 가능. 홈에서 2탭 필요.
- **파일**: `src/screens/HomeScreen.tsx`
- **변경**: quickActions에 "플래시카드" 추가 또는 복습 알림 배너에 플래시카드 바로가기 추가
- **난이도**: XS

### [C3] 오프라인 배너 중복 제거
- **문제**: App.tsx (line 92-96)과 HomeScreen의 `<OfflineBanner />` 컴포넌트가 동시에 표시됨
- **파일**: `App.tsx`, `src/screens/HomeScreen.tsx`
- **변경**: App.tsx의 인라인 배너 제거, 각 화면에서 OfflineBanner 사용으로 통일 (또는 반대)
- **난이도**: XS

---

## Sprint 3 — High: 녹음/STT 안정성 (4 items)

### [H1] 마이크 권한 사전 확인 UX
- **문제**: 녹음 버튼 탭 시 바로 `startRecording()` 호출. 권한 거부 시 에러만 표시.
- **파일**: `src/screens/SessionScreen.tsx`, `src/lib/audio.ts`
- **변경**: `handleStartRecording()`에서 `Audio.getPermissionsAsync()` 확인 → 미허용 시 안내 모달 → `requestPermissionsAsync()`
- **난이도**: S

### [H2] 녹음 타임아웃 (30초)
- **문제**: 녹음 시간 제한이 없음. 사용자가 실수로 녹음을 멈추지 않으면 영원히 녹음.
- **파일**: `src/screens/SessionScreen.tsx`
- **변경**: recording phase 진입 시 30초 타이머 설정 → 만료 시 자동 `handleStopRecording()`
- **난이도**: XS

### [H3] STT 실패 시 구체적 안내
- **문제**: STT 결과가 빈 문자열이면 `"(인식 안됨)"` 표시. 마이크 문제인지, 소리가 작은지, 네트워크 문제인지 사용자가 알 수 없음.
- **파일**: `src/screens/SessionScreen.tsx`
- **변경**: `transcribeAudio()` 에러 유형 구분 → "음성이 감지되지 않았습니다. 더 크게 말해보세요." / "네트워크 연결을 확인해주세요." 등 분기
- **난이도**: S

### [H4] TTS 실패 시 무음 문제
- **문제**: `Speech.speak()` onError 콜백이 `setIsSpeaking(false)`만 실행. 사용자에게 아무 피드백 없음.
- **파일**: `src/screens/SessionScreen.tsx`
- **변경**: onError에서 짧은 Toast 또는 아이콘 변경으로 실패 표시
- **난이도**: XS

---

## Sprint 4 — Medium: 학습 흐름 개선 (4 items)

### [M1] 상황 잠금해제 시스템 확인/수정
- **문제**: `saveSessionProgress`에서 다음 상황을 `available`로 업데이트하는 로직이 DB에 정상 반영되는지 확인 필요. 신규 유저가 첫 상황만 풀린 채로 막힐 가능성.
- **파일**: `src/lib/sessionProgress.ts`, DB migration
- **변경**: 상황 완료 시 next situation unlock 로직 검증 + 디버깅
- **난이도**: M

### [M2] SituationListScreen에서 available vs in_progress 구분
- **문제**: 두 상태 모두 같은 색 도트(primary/warning)로 표시되나, 진행 중인 상황에 진행도 표시가 없음.
- **파일**: `src/screens/SituationListScreen.tsx`
- **변경**: in_progress 상황에 "3/5 대사" 같은 진행도 텍스트 추가
- **난이도**: S

### [M3] 세션 완료 시 자연스러운 전환
- **문제**: `handleComplete()` 호출 시 `showCompletion = true` 세팅만. 전환 애니메이션 없이 갑자기 화면 교체.
- **파일**: `src/screens/SessionScreen.tsx`
- **변경**: 완료 화면 진입 시 fade-in 또는 scale-up 애니메이션
- **난이도**: S

### [M4] Settings 페르소나 변경 후 HomeScreen 갱신
- **문제**: Settings에서 페르소나를 바꾸면 HomeScreen으로 돌아갈 때 `useFocusEffect`가 다시 호출되나, 상황 목록이 제대로 바뀌는지 확인 필요.
- **파일**: `src/screens/SettingsScreen.tsx`, `src/screens/HomeScreen.tsx`
- **변경**: 페르소나 변경 시 `navigation.reset()`으로 Home 스택 초기화
- **난이도**: S

---

## Sprint 5 — Low: 시각적 완성도 (5 items)

### [L1] 채팅 버블 입장 애니메이션
- **문제**: NPC/User 버블이 갑자기 나타남. 대화 느낌이 약함.
- **파일**: `src/components/NpcBubble.tsx`, `src/components/UserBubble.tsx`
- **변경**: Animated.View로 fadeInUp (translateY: 20→0, opacity: 0→1) 200ms 적용
- **난이도**: S

### [L2] 녹음 시작/종료 햅틱 피드백
- **문제**: 녹음 버튼 탭 시 시각적 피드백(glow)만 있고 촉각 피드백 없음.
- **파일**: `src/screens/SessionScreen.tsx`
- **변경**: `expo-haptics` 추가, `handleStartRecording`에 `Haptics.impactAsync(ImpactFeedbackStyle.Medium)`, `handleStopRecording`에 `Haptics.notificationAsync(Success)`
- **난이도**: XS

### [L3] 스켈레톤 로딩 화면
- **문제**: 전체 화면 스피너(`<LoadingScreen />`)가 모든 곳에서 동일. 레이아웃 점프 발생.
- **파일**: `src/screens/HomeScreen.tsx`
- **변경**: HomeScreen에만 우선 적용. 프로그레스 카드 + 상황 목록 스켈레톤 placeholder.
- **난이도**: M

### [L4] FlashcardScreen 카드 넘김 애니메이션
- **문제**: 카드가 즉시 교체됨. 학습 앱 특유의 스와이프/슬라이드 느낌 부재.
- **파일**: `src/screens/FlashcardScreen.tsx`
- **변경**: Animated.View로 좌우 슬라이드 전환
- **난이도**: M

### [L5] 학습 완료 축하 효과
- **문제**: 완료 화면에 이모지만 표시. 성취감 부족.
- **파일**: `src/screens/SessionScreen.tsx`
- **변경**: 이모지 bounce-in 애니메이션 + 배경 confetti-like 파티클 (react-native-reanimated or 간단한 Animated)
- **난이도**: M

---

## 작업 추적

| ID | 항목 | 상태 | Sprint |
|----|------|------|--------|
| C1 | FlashcardScreen 자가평가 | [x] | 2 |
| C2 | HomeScreen 플래시카드 접근 | [x] | 2 |
| C3 | 오프라인 배너 중복 제거 | [x] | 2 |
| H1 | 마이크 권한 사전 확인 | [x] | 3 |
| H2 | 녹음 타임아웃 | [x] | 3 |
| H3 | STT 실패 안내 개선 | [x] | 3 |
| H4 | TTS 실패 피드백 | [x] | 3 |
| M1 | 상황 잠금해제 검증 | [x] | 4 |
| M2 | available/in_progress 구분 | [x] | 4 |
| M3 | 완료 화면 전환 애니메이션 | [x] | 4 |
| M4 | 페르소나 변경 후 갱신 | [x] | 4 |
| L1 | 채팅 버블 애니메이션 | [x] | 5 |
| L2 | 녹음 햅틱 피드백 | [x] | 5 |
| L3 | 스켈레톤 로딩 | [x] | 5 |
| L4 | 플래시카드 넘김 애니메이션 | [x] | 5 |
| L5 | 학습 완료 축하 효과 | [x] | 5 |
