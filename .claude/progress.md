# 작업 진행 기록

큰 작업 완료 시 결과를 여기에 기록합니다.

---

## 기록 형식

```markdown
### [날짜] Phase X - 작업명

**완료 항목:**
- 항목 1
- 항목 2

**결과:**
- 생성된 파일: X개
- 테스트 결과: 통과/실패

**다음 작업:**
- 다음에 할 일
```

---

## 진행 기록

### 2026-01-30 Phase 1 - Content Generation & DB Setup

**완료 항목:**
- 22개 상황 JSON 파일 생성 (상황당 5개 대사 = 총 110개 대사)
- 10개 테이블 DB 마이그레이션 SQL 생성
- 3개 페르소나 seed.sql 생성
- import-to-supabase.ts 스크립트 생성

**결과:**
- 생성된 파일: 22개 JSON 파일 (`scripts/output/`)
- Tourist: 7개 상황, Business: 7개 상황, Working Holiday: 8개 상황

**생성된 파일:**
- `backend/supabase/migrations/001_create_tables.sql`
- `backend/supabase/seed.sql`
- `scripts/import-to-supabase.ts`
- `scripts/output/*.json` (22개)

---

### 2026-01-30 Phase 2 - Expo App Navigation & Onboarding

**완료 항목:**
- 필수 Expo 의존성 설치
- Supabase 클라이언트 설정
- 6개 스크린 네비게이션 구조 생성
- OnboardingScreen (성별 + 페르소나 선택)
- HomeScreen (진행률 표시)

**결과:**
- 의존성: @react-navigation, @supabase/supabase-js, expo-av, expo-speech 등
- TypeScript 컴파일 성공

---

### 2026-01-30 Phase 3 - Learning Session & Edge Functions

**완료 항목:**
- SessionScreen (3단계 난이도)
- expo-speech TTS 재생
- transcribe Edge Function (Whisper API)
- get-daily-session Edge Function
- submit-attempt Edge Function

**결과:**
- Lv.1: 발음+번역, Lv.2: 번역만, Lv.3: 숨김
- Edge Functions 배포 준비 완료

---

### 2026-01-30 Phase 4 - FSRS SRS Implementation

**완료 항목:**
- FSRS-4.5 알고리즘 구현
- 안정성/난이도 기반 카드 스케줄링
- useSession 훅으로 SRS 통합
- 오디오 녹음 유틸리티

**결과:**
- 4단계 평가: Again (1), Hard (2), Good (3), Easy (4)
- 다음 복습 날짜 자동 계산

---

### 2026-01-30 Phase 5 - Additional Screens

**완료 항목:**
- SituationListScreen (페르소나별 상황 목록)
- SettingsScreen (프로필, 일일 목표, 페르소나 변경)
- HistoryScreen (학습 통계 및 일별 기록)

**결과:**
- 모든 스크린 TypeScript 컴파일 성공
- MVP 앱 구조 완성

---

### 2026-01-31 Phase 6 - STT Integration & E2E Testing

**완료 항목:**
- Whisper API 연동 (stt.ts)
- SessionScreen 녹음/피드백 UI
- 정확도 비교 및 재시도 플로우
- iOS 시뮬레이터 E2E 테스트

**결과:**
- STT: OpenAI Whisper API 직접 호출
- 녹음: expo-av 사용
- 피드백: 정확도 %, 내 발화 vs 정답 비교
- 테스트: 홈 → 세션 → 녹음 → 피드백 플로우 확인

---

### 2026-02-01 Phase 7 - Email/Password Authentication

**완료 항목:**
- AuthScreen 생성 (로그인/회원가입 토글)
- Supabase Auth 연동 (signUp, signInWithPassword)
- App.tsx 네비게이션 수정 (미인증 → Auth 화면)
- 로그아웃 시 Auth 화면으로 이동

**결과:**
- 이메일/비밀번호 회원가입
- 비밀번호 확인 필드
- 한글 에러 메시지
- 익명 세션 제거

---

### 2026-02-01 Phase 8 - Vocabulary Screen

**완료 항목:**
- VocabularyScreen 생성 (단어장)
- 필터 탭 (전체/약한 표현/마스터)
- SRS 카드 기반 학습 표현 표시
- TTS 재생 기능 (카드 탭 시)
- HomeScreen에 단어장 퀵액션 추가

**결과:**
- 배운 표현 목록 조회
- 정확도/연습 횟수 표시
- 상태 태그 (새로운/학습중/복습/재학습)
- iOS 시뮬레이터 테스트 완료

---

### 2026-02-01 Phase 9 - Recording Feedback Improvements

**완료 항목:**
- 녹음 버튼 펄싱 애니메이션 추가
- 녹음 시간 표시 (M:SS 형식)
- 오디오 레벨 바 (5개 바, dBFS 기반)
- audio.ts에 metering 활성화 및 getRecordingStatus() 추가

**결과:**
- 녹음 중 시각적 피드백 개선
- 녹음 시간 실시간 업데이트 (100ms 간격)
- iOS 시뮬레이터 테스트 완료

**변경 파일:**
- `app/src/screens/SessionScreen.tsx` - 애니메이션, 시간 표시, 레벨 바 UI
- `app/src/lib/audio.ts` - metering 활성화, getRecordingStatus() 추가

---

### 2026-02-03 Refactoring - Theme, Components, Types 추출

**완료 항목:**
- `src/constants/theme.ts` 생성 (colors + shadows 상수)
- `src/components/LoadingScreen.tsx` 생성 (전체 화면 로딩)
- `src/components/BackHeader.tsx` 생성 (뒤로가기 헤더)
- `SituationWithProgress` 타입을 `types/index.ts`로 이동

**결과:**
- 8개 화면에서 색상/그림자 하드코딩 → theme 상수 참조로 교체
- 6개 화면 로딩 블록 → LoadingScreen 컴포넌트로 교체
- 4개 화면 헤더 블록 → BackHeader 컴포넌트로 교체
- 2개 화면의 중복 타입 정의 제거
- TypeScript 컴파일: 통과
- Expo 빌드: 통과

**생성된 파일:**
- `app/src/constants/theme.ts`
- `app/src/components/LoadingScreen.tsx`
- `app/src/components/BackHeader.tsx`

**수정된 파일:**
- `app/src/types/index.ts`
- `app/src/screens/HomeScreen.tsx`
- `app/src/screens/SessionScreen.tsx`
- `app/src/screens/HistoryScreen.tsx`
- `app/src/screens/OnboardingScreen.tsx`
- `app/src/screens/SettingsScreen.tsx`
- `app/src/screens/SituationListScreen.tsx`
- `app/src/screens/VocabularyScreen.tsx`
- `app/src/screens/AuthScreen.tsx`

---

### 2026-02-05 UX 개선 - Phase A: Crash Prevention (Tier 1)

**완료 항목:**
- ErrorBoundary 컴포넌트 생성 (App.tsx 전체 감싸기)
- app.json 마이크 권한 선언 (iOS NSMicrophoneUsageDescription + Android RECORD_AUDIO)
- HomeScreen 데이터 로드 실패 시 에러 UI + "다시 시도" 버튼
- SessionScreen 빈 라인 / 에러 상태 방어 처리

**결과:**
- TypeScript 컴파일: 통과
- 생성된 파일: `src/components/ErrorBoundary.tsx`

---

### 2026-02-05 UX 개선 - Phase B: User Retention (Tier 2)

**완료 항목:**
- 네트워크 상태 감지 + 오프라인 배너 (useNetworkStatus 훅 + @react-native-community/netinfo)
- 학습 완료 시 전용 축하 화면 (정확도/대사수/배운 표현 요약)
- 연속 학습일(스트릭) 추적 및 HomeScreen 배지 표시
- 복습 알림 배너 (HomeScreen 상단에 복습 유도)
- TTS 속도 조절 (0.5x/0.8x/1.0x, Settings에서 변경, AsyncStorage 저장)

**결과:**
- 생성된 파일: `src/hooks/useNetworkStatus.ts`
- 의존성 추가: `@react-native-community/netinfo`

---

### 2026-02-05 UX 개선 - Phase C: Learning Depth (Tier 3)

**완료 항목:**
- VocabularyScreen 검색 기능 (일본어/한국어/발음 검색)
- FlashcardScreen 생성 (약한 표현 플래시카드 모드)
- 레벨 자동 업데이트 (완료 상황 수 기반: 3=Lv.2, 7=Lv.3, 10=Lv.4, 15=Lv.5)
- SituationListScreen 최고 기록/도전 횟수 표시 + 재도전 가능
- 다크 모드 지원 (theme.ts에 dark 컬러셋, Settings에서 시스템/라이트/다크 선택)

**결과:**
- 생성된 파일: `src/screens/FlashcardScreen.tsx`
- 네비게이션 타입에 Flashcard 라우트 추가

---

### 2026-02-05 UX 개선 - Phase D: Code Quality (Tier 4)

**완료 항목:**
- SessionScreen 분리: NpcBubble, UserBubble 컴포넌트 추출
- theme.ts에 다크 모드 컬러셋 통합, getColors() 함수 추가
- Whisper API 호출을 Supabase Edge Function으로 이동 (클라이언트에 OpenAI 키 노출 제거)

**결과:**
- 생성된 파일: `src/components/NpcBubble.tsx`, `src/components/UserBubble.tsx`
- stt.ts: supabase.functions.invoke("transcribe") 사용으로 변경
- TypeScript 컴파일: 통과
- Expo 빌드: 통과

---

### 2026-02-05 Sprint 1 - Critical UX Fixes (TDD)

**완료 항목:**
- C6: textLight (#94a3b8→#6b7280) + primary (#6366f1→#4f46e5) WCAG AA 대비 수정
- C8: OnboardingScreen 에러 핸들링 (에러 상태, 재시도, 로그아웃)
- C2: saveSessionProgress 추출 (try-catch, 에러 시 Alert)
- C1: gradeFlashcard + FSRS w[17-18] 누락 파라미터 수정
- C3: OfflineBanner 컴포넌트 + HomeScreen 통합

**결과:**
- 테스트: 5 suites, 21 tests 전부 통과
- TypeScript: `tsc --noEmit` 통과
- 신규 파일: sessionProgress.ts, flashcardGrading.ts, OfflineBanner.tsx
- 커밋: 7개 (all-red → 5 green commits → refactor)

**다음 작업:**
- SessionScreen에서 saveSessionProgress 실제 사용 확인 (시뮬레이터)
- FlashcardScreen에 gradeFlashcard UI 연동
- Sprint 2 (High priority) 시작

---

## 현재 상태 (2026-02-05)

**코드 상태:** 모든 Sprint 1 커밋 완료
**빌드 상태:** `npx tsc --noEmit` 통과
**테스트 상태:** 21/21 통과

**다음 세션에서 할 일:**
1. FlashcardScreen에 자가평가 UI + gradeFlashcard 연동
2. Sprint 2 (High priority) 이슈 시작
3. 시뮬레이터 통합 테스트

---

## 다음 단계

1. ~~Supabase 마이그레이션 실행~~ ✅
2. ~~시드 데이터 삽입~~ ✅
3. ~~콘텐츠 임포트~~ ✅
4. ~~Edge Functions 배포~~ ✅
5. ~~Expo 시작~~ ✅
6. ~~시뮬레이터 테스트~~ ✅
7. ~~회원가입 기능~~ ✅
8. ~~단어장 기능~~ ✅
9. ~~녹음 피드백 개선~~ ✅
10. ~~UX 전면 개선 (4 Tiers)~~ ✅
11. 시뮬레이터에서 UX 개선 확인 테스트
12. 실제 기기 테스트

