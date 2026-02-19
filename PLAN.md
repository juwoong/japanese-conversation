# PLAN.md

> 현지인과 대화할 수 있도록 만들어주는 일본어 학습 앱.
> 지속적으로 발화 상황을 제시하여 스스로 단어 및 문장을 인출해 낼 수 있도록 도와줍니다.

---

## 다음 세션

**EngagePhase / FreeInput 작업 마무리 → 디바이스 테스트.**

재개에 필요한 맥락:
- `app/src/components/phases/EngagePhase.tsx`, `app/src/components/phases/inputs/FreeInput.tsx` 수정 중
- 발음 시스템 (Phase 1-4) 코드 완료, 디바이스 테스트 필요
- furigana 스크립트 실행 + DB migration 미적용

---

## 현재 상태 (2026-02-19)

### 완료

- [x] 콘텐츠 파이프라인 (51개 시나리오, 653 어휘, JLPT N5/N4 100%)
- [x] Supabase DB + Edge Functions (transcribe, get-daily-session, submit-attempt)
- [x] 4단계 학습 플로우 (Watch → Catch → Engage → Review)
- [x] STT (Whisper API) + TTS (expo-speech)
- [x] FSRS SRS 알고리즘 + FlashcardScreen 자가평가 연동
- [x] 이메일/비밀번호 인증
- [x] 페르소나 선택 (관광/비즈니스/워홀) + 트래블맵 홈화면
- [x] UX 개선 5 Sprint 완료 (애니메이션, 햅틱, 다크모드, 에러처리)
- [x] v1 리디자인 (온보딩, 여행지도, AI NPC, 안전망, 반복변주, 지속성)
- [x] 발음 피드백 시스템 코드 (피치 감지, H/L 패턴 비교, STT diff, 후리가나)
- [x] 안티패턴 전수 감사 (77파일, 18위반 → 0위반)

### 미완료

- [ ] EngagePhase / FreeInput 현재 작업 마무리
- [ ] 발음 시스템 디바이스 테스트 (Phase 1-4 전부)
- [ ] furigana 스크립트 실행 + DB migration 적용
- [ ] 시뮬레이터/실기기 통합 테스트

---

## Phase 1 — 안정화 & 디바이스 검증

> 돌아가야 "완성"이다. 코드가 있어도 기기에서 안 돌아가면 미완성.

- [ ] EngagePhase / FreeInput 수정 마무리
- [ ] `npx expo prebuild` + 실기기 빌드
- [ ] 발음 시스템 디바이스 테스트 (PitchCanvas, ComparisonCanvas, STT diff)
- [ ] furigana 운영 실행: `GEMINI_API_KEY=... npx tsx scripts/add-furigana.ts`
- [ ] DB migration 적용: `003_furigana.sql`
- [ ] Supabase import 재실행 (furigana 포함)
- [ ] E2E 플로우 확인: 온보딩 → 홈 → 세션(Watch→Catch→Engage→Review) → 리뷰
- [ ] 크래시 발생 시 즉시 수정

---

## Phase 2 — 핵심 루프 검증

> "관찰 → 포착 → 발화 → 반복" — 이 루프가 실제로 인출 연습이 되는지.

- [ ] Watch: NPC 대사 자동 재생 + 후리가나 표시 확인
- [ ] Catch: 5개 활동 (빈칸, 매칭 등) 정상 동작 확인
- [ ] Engage: 3단계 입력 (선택지 → 빈칸 → 자유) 힌트 점진적 제거 확인
- [ ] Review: 틀린 표현 재연습 + "왜 이렇게 말할까?" + 능력 서술문 확인
- [ ] SRS: 세션 완료 → FSRS 카드 업데이트 → 다음 복습일 계산 확인
- [ ] 변주 시스템: 재방문 시 변형 시나리오 제시 확인

---

## Phase 3 — 어휘 데이터 고도화

> 문장장이 아닌 진짜 단어장. 개별 어휘 단위의 인출 연습.

- [ ] Vocabulary 타입 추가 (word_ja, reading_hiragana, meaning_ko, pos)
- [ ] vocabulary 테이블 DB migration
- [ ] 어휘 추출 스크립트 (scripts/generate-vocabulary.ts)
- [ ] 51개 시나리오 JSON에 vocabulary 배열 추가
- [ ] VocabularyScreen 단어별 UI 개편
- [ ] JLPT 레벨 태깅 (N5/N4/N3 필터)

---

## Phase 4 — 온보딩 고도화

> "방문 목적과 목적지를 입력하면 개인 페르소나가 설정된다"

- [ ] 온보딩 확장: 목적지 선택 (오사카/도쿄/후쿠오카 등)
- [ ] 출발일 → D-Day 기반 학습 일정 자동 생성
- [ ] 페르소나별 상황 우선순위 (출장자: 비즈니스 먼저, 여행자: 식당/교통 먼저)
- [ ] 경어체/반말체 자동 분기 (비즈니스 → 경어, 여행/워홀 → 반말)
- [ ] 목적지별 특화 시나리오 (오사카 타코야키, 교토 신사 등)

---

## Phase 5 — 실시간 AI 전환 (향후)

> 사전 생성 스크립트 → 실시간 AI 추론. 매 세션 동적 콘텐츠.

- [ ] Claude API 기반 동적 NPC 대사 생성
- [ ] 사용자 학습 이력 기반 난이도 자동 조절
- [ ] 사용자 응답에 대한 AI 피드백 (문법/뉘앙스)
- [ ] 자유 대화 모드 (스크립트 없이 상황만 주어짐)
- [ ] N3 레벨 콘텐츠 확장

---

## 불변 규칙

- 한국어 발음 표기 금지
- "틀렸습니다" 금지
- 레벨·XP·점수 금지
- 스트릭 끊김 경고 금지
- L1 상시 표시 금지

---

## 기술 스택 결정사항

| 영역 | 선택 | 비고 |
|------|------|------|
| 오디오 입력 | react-native-audio-api (AudioRecorder) | |
| 피치 감지 | pitchy (JS, McLeod Pitch Method) | |
| 시각화 | @shopify/react-native-skia | |
| 애니메이션 | react-native-reanimated v4 | |
| 개발 환경 | expo-dev-client | |
| STT | Whisper API + prompt 바이어싱 | |
| 텍스트 비교 | Myers diff (문자 단위) + 일본어 정규화 | |
| 후리가나 | 빌드타임 pre-computed (Gemini API) | kuromoji.js runtime 삭제 |
