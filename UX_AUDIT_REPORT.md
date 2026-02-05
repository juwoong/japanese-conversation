# UX 종합 감사 보고서

**일자**: 2026-02-05
**대상**: 일본어 회화 학습 앱 (Expo React Native)
**분석 방법**: 소스코드 정적 분석 (5개 병렬 에이전트)

---

## 요약 대시보드

| 에이전트 | Critical | High | Medium | Low | 합계 |
|----------|----------|------|--------|-----|------|
| Navigation | 0 | 1 | 4 | 5 | **10** |
| Error States | 2 | 7 | 6 | 9 | **24** |
| Accessibility | 3 | 8 | 13 | 5 | **29** |
| Consistency | 1 | 3 | 6 | 10 | **20** |
| Happy Paths | 2 | 4 | 8 | 4 | **18** |
| **총합** | **8** | **23** | **37** | **33** | **101** |

### 핵심 수치
- **화면 수**: 9개 (Auth, Onboarding, Home, Session, SituationList, Settings, History, Vocabulary, Flashcard)
- **접근성 라벨 누락**: 52/57개 인터랙티브 요소 (91%)
- **대비 실패 조합**: 19개 색상 조합
- **하드코딩 색상**: 31개
- **에러 핸들링 누락 비동기 작업**: 11/22개 (50%)

---

## CRITICAL 이슈 (즉시 수정 필요) — 8건

### C1. 플래시카드 세션이 데이터를 전혀 저장하지 않음
- **에이전트**: Happy Paths + Error States
- **파일**: `src/screens/FlashcardScreen.tsx`
- **설명**: 플래시카드 모드에서 카드를 넘기는 행위가 SRS 스케줄, 정확도, 학습 기록 등 어떤 데이터도 업데이트하지 않음. 사용자의 복습 노력이 완전히 소실됨.
- **영향**: SRS 시스템의 핵심 루프가 깨짐. "약한 표현"이 영원히 약한 상태로 유지.
- **권장**: Again/Hard/Good/Easy 자가 평가 버튼 추가 → FSRS 스케줄 함수 호출로 카드 상태 업데이트

### C2. SessionScreen.handleComplete에 try-catch 없음
- **에이전트**: Error States
- **파일**: `src/screens/SessionScreen.tsx` (handleComplete 함수)
- **설명**: 학습 완료 시 4개 이상의 순차적 Supabase upsert가 에러 핸들링 없이 실행됨. 네트워크 불안정 시 unhandled promise rejection으로 앱 크래시 가능.
- **영향**: 사용자의 학습 진행도 손실 + 앱 크래시
- **권장**: try-catch 래핑. 실패 시 "진행도 저장 실패" 알림 + 완료 화면은 유지

### C3. useNetworkStatus 훅이 존재하지만 어디서도 사용되지 않음
- **에이전트**: Error States
- **파일**: `src/hooks/useNetworkStatus.ts` (미사용)
- **설명**: 네트워크 상태 감지 훅을 구현해놓았으나 어떤 화면에서도 import하지 않음. 오프라인 시 모든 화면이 의미 없는 에러 표시.
- **영향**: 오프라인 사용자에게 "오프라인" 대신 알 수 없는 에러 노출
- **권장**: SessionScreen, AuthScreen, HomeScreen에 오프라인 감지 통합

### C4. 첫 세션에 튜토리얼/가이드 없음
- **에이전트**: Happy Paths
- **파일**: `src/screens/SessionScreen.tsx`
- **설명**: 세션 UI의 핵심 인터랙션(번역 터치 공개, 발음 토글, 녹음 플로우, 문법 팁)에 대한 안내 없음. 사용자가 모든 것을 시행착오로 발견해야 함.
- **영향**: 신규 사용자 이탈 (첫 세션에서 무엇을 해야 하는지 모름)
- **권장**: 첫 세션에만 코치마크 오버레이 표시

### C5. 접근성 라벨/역할이 앱 전체에 전무
- **에이전트**: Accessibility
- **파일**: 전체 screens/ 및 components/
- **설명**: 57개 이상의 인터랙티브 요소에 accessibilityLabel, accessibilityRole, accessibilityHint, accessibilityState가 하나도 없음. VoiceOver/TalkBack 사용자에게 앱이 사실상 사용 불가.
- **영향**: 시각 장애 사용자 완전 배제
- **권장**: 모든 TouchableOpacity에 accessibilityRole='button', 아이콘 전용 버튼에 명시적 accessibilityLabel 추가

### C6. textLight 색상(#94a3b8)이 모든 배경에서 대비 실패
- **에이전트**: Accessibility
- **파일**: `src/constants/theme.ts`
- **설명**: textLight 색상이 모든 배경색(#f8fafc, #fff, #f1f5f9)에서 WCAG AA 기준 미달 (2.52:1~2.88:1, 필요 4.5:1). 힌트, 메타데이터, 플레이스홀더 등 광범위 사용.
- **영향**: 저시력 사용자에게 텍스트 읽기 어려움
- **권장**: textLight를 최소 #6b7280으로 변경 (4.6:1 이상)

### C7. 31개 하드코딩 색상 → 다크모드 완전 미작동
- **에이전트**: Consistency
- **파일**: HomeScreen, History, Vocabulary, NpcBubble, Session 등 8개 파일
- **설명**: 모든 화면이 정적 `colors` 객체(항상 라이트모드)를 import. `getColors()` 반응형 함수를 사용하는 화면이 0개. Settings에서 다크모드를 변경해도 어떤 화면도 반응하지 않음.
- **영향**: 다크모드 기능이 존재하지만 완전히 무작동
- **권장**: (A) 다크모드 설정 자체를 제거하거나 (B) 전체 화면을 getColors()로 마이그레이션

### C8. Onboarding 실패 시 사용자 고착
- **에이전트**: Error States + Navigation
- **파일**: `src/screens/OnboardingScreen.tsx`
- **설명**: 페르소나 로드 실패 시 빈 목록만 표시 (에러/재시도 없음). 페르소나 저장 실패 시 console.error만 출력 (사용자 피드백 없음). 로그아웃/뒤로가기 없어 화면에 갇힘.
- **영향**: 네트워크 불안정 시 앱 사용 불가 상태 진입
- **권장**: 에러 상태 UI + 재시도 + 로그아웃 링크 추가

---

## HIGH 이슈 (다음 스프린트 수정) — 23건

### 에러 핸들링 (7건)
| ID | 화면 | 설명 |
|----|------|------|
| ERR-005 | Onboarding | 페르소나 더블탭 방지 없음 (race condition) |
| ERR-006 | Settings | 모든 비동기 작업에 로딩/에러 상태 없음 (5개 async 작업) |
| ERR-007 | Settings | handlePersonaChange/handleDailyGoalChange에 try-catch 없음 |
| ERR-008 | Flashcard | loadWeakCards에 try-catch 전무 |
| ERR-009 | Session | 세션 로드 실패 시 재시도 버튼 없음 (뒤로가기만) |
| HP-003 | Auth | 이메일 인증 플로우 처리 없음 |
| HP-004 | Session | 마이크 대안 입력 수단 없음 |

### 접근성 (8건)
| ID | 화면 | 설명 |
|----|------|------|
| A11Y-004 | Home, History | 보라색 배경 위 부제목 대비 2.83:1 |
| A11Y-005 | UserBubble | 경고색 배지 위 흰 텍스트 대비 1.94:1 |
| A11Y-006 | Settings | 토글 버튼 선택 상태 미전달 (accessibilityState 없음) |
| A11Y-007 | Session | 녹음/처리/성공 등 단계 전환 스크린리더 미알림 |
| A11Y-008 | NpcBubble | 스피커 이모지 버튼 ~18x18pt (최소 44x44pt) |
| A11Y-009 | SituationList | 상태 점이 색상으로만 정보 전달 |
| A11Y-010 | SituationList | 펼침/접힘 상태 스크린리더 미전달 |
| A11Y-028 | 다크모드 전체 | 다크모드에서 대비 더욱 악화 (textLight 2.26:1) |

### 네비게이션 (1건)
| ID | 화면 | 설명 |
|----|------|------|
| NAV-006 | Session 완료 | "다음 상황" 버튼 없음 — 매번 Home으로 돌아가야 함 |

### 일관성 (3건)
| ID | 카테고리 | 설명 |
|----|----------|------|
| CON-001 | 간격 | 화면 패딩 16~24 불규칙 (스페이싱 스케일 미정의) |
| CON-003 | 색상 | Vocabulary에서 테마 색상을 하드코딩으로 재작성 + 초록색 다른 shade |
| CON-004 | 색상 | 모든 화면이 정적 colors import (getColors() 사용 0건) |

### 해피패스 (4건)
| ID | 여정 | 설명 |
|----|------|------|
| HP-005 | 복습 | 복습 세션과 신규 세션이 시각적으로 동일 |
| HP-006 | 플래시카드 | 플래시카드 효과 없음 (데이터 미저장) |
| HP-007 | 온보딩 | Auth 기본 모드가 '로그인' (신규 사용자에게 비직관적) |
| HP-008 | 세션 | 마이크 권한 사전 설명 없음, 거부 시 복구 안내 없음 |

---

## MEDIUM 이슈 (점진적 개선) — 37건

### 에러 핸들링 (6건)
- SituationList: 에러 상태 UI 없음 (console.error만)
- History: 에러와 빈 상태 구분 불가
- Vocabulary: 로드 실패 시 "배운 표현 없음" 오해 유발
- Auth: 클라이언트 측 이메일 형식 검증 없음
- Auth: 네트워크 에러 전용 메시지 없음
- Session: STT 타임아웃/취소 없음

### 접근성 (13건)
- 프로그레스바 accessibilityRole 없음 (Home, Session)
- 설정 기어 버튼 40x40pt (최소 44x44pt)
- "전체 보기" 링크 패딩 없음
- Vocabulary 필터탭/연습 버튼 높이 부족
- Session 발음 토글 ~30x19pt
- Auth 모드 전환 터치영역 부족
- Onboarding 뒤로 버튼 터치영역 부족
- NpcBubble 문법 팁 토글 ~auto x 18pt
- Settings 비활성 버튼 대비 3.76:1
- History 정확도 배지 대비 4.02:1
- 플래시카드 접근성 힌트 없음 (탭하여 뒤집기)
- 다이나믹 타입 미테스트
- FlashcardScreen 비활성 버튼 대비 1.66:1

### 일관성 (6건)
- 버튼 borderRadius 불일치 (12/14/16)
- 카드 borderRadius 불일치 (12/16/20)
- 그림자 인라인 vs theme 프리셋 혼용
- 헤더 패딩 불일치 (BackHeader 20 vs 콘텐츠 16)
- 섹션 타이틀 스타일 불일치
- #92400e 4곳에서 사용되나 테마 미정의

### 해피패스 (8건)
- 복습 알림 배너 탭 불가
- 복습 일괄 시작 옵션 없음
- 복습이 일일 진행도에 미반영
- Vocabulary 접근이 스크롤 최하단에 위치
- 플래시카드 버튼명 "연습"이지만 수동 복습
- 플래시카드 완료 요약 화면 없음
- 온보딩 단계 표시 없음 (1/2)
- 세션 완료 시 "다시 하기"/"다음" 선택지 없음

### 네비게이션 (4건)
- Onboarding에서 Auth로 돌아갈 방법 없음
- Session 스와이프 백 비활성 (의도적이나 마찰)
- SituationList가 useFocusEffect 미사용 (세션 후 데이터 미갱신)
- Auth 화면 보호 없음 (로그인 상태에서도 Auth 접근 가능)

---

## LOW 이슈 (백로그) — 33건

에러 핸들링 9건, 접근성 5건, 일관성 10건, 해피패스 4건, 네비게이션 5건

주요 항목:
- Auth 입력 maxLength 미설정
- 이메일 trim 미처리
- supabase.ts 빈 문자열 fallback
- 플래시카드 방향 선택 없음 (한→일만)
- BackHeader 스페이서 스크린리더 포커스
- activeOpacity 값 불일치
- 빈 상태 컴포넌트 패턴 불일치
- FlatList vs ScrollView 혼용

---

## 화면별 종합 등급

| 화면 | 에러 핸들링 | 접근성 | 일관성 | 종합 |
|------|-------------|--------|--------|------|
| HomeScreen | A | D | C | **B-** |
| SessionScreen | B- | D | C | **C+** |
| AuthScreen | B | D | C | **C** |
| VocabularyScreen | B | D | D | **C-** |
| HistoryScreen | C | D | C | **C-** |
| FlashcardScreen | C | D | C | **D+** |
| OnboardingScreen | D | D | C | **D** |
| SettingsScreen | F | D | C | **D-** |
| SituationListScreen | D | D | C | **D** |

---

## 우선순위 실행 로드맵

### Sprint 1 (즉시) — Critical 수정
1. `handleComplete`에 try-catch 추가 (SessionScreen.tsx)
2. `useNetworkStatus` 통합 (최소 Session, Auth, Home)
3. `textLight` 색상 #94a3b8 → #6b7280으로 변경 (theme.ts)
4. 플래시카드에 자가 평가 버튼 + SRS 업데이트 추가 (FlashcardScreen.tsx)
5. Onboarding에 에러 상태/재시도/로그아웃 추가

### Sprint 2 — High 수정
6. 모든 TouchableOpacity에 accessibilityRole='button' 추가
7. 아이콘 전용 버튼에 accessibilityLabel 추가
8. Settings 비동기 작업에 try-catch 추가
9. 세션 완료 화면에 "다음 상황"/"다시 하기" 버튼 추가
10. 복습 세션 시각적 구분 (헤더 뱃지/색상)

### Sprint 3 — Medium 수정
11. 하드코딩 색상 → 테마 변수 마이그레이션
12. 다크모드: getColors() 전환 또는 설정 제거
13. 터치 타겟 최소 44x44pt 보장
14. 첫 세션 튜토리얼 오버레이
15. 스페이싱 스케일 정의 및 통일

---

## 분석 제한 사항

- **정적 분석만 수행**: 실제 시뮬레이터 실행 테스트 미수행 (시각적 레이아웃, 애니메이션 타이밍, 실제 네트워크 에러 등 미확인)
- **대비 비율 근사치**: 알파/투명도가 있는 색상의 대비 비율은 근사값
- **성능 미측정**: 렌더링 성능, 메모리 사용량, 앱 시작 시간 등 미포함
