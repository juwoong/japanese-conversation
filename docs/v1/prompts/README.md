# v1 리디자인 프롬프트 문서 인덱스

> 현재 앱(Phase 1~9 완료)을 v1 기획서 방향으로 리디자인하는 7개 프롬프트 문서입니다.
> 각 문서는 에이전트가 자체 피드백 루프를 돌며 완료할 수 있도록 설계되었습니다.

## 실행 순서 및 의존 관계

```
01-onboarding ──┐
                ├──→ 03-four-phase ──→ 04-ai-npc-feedback
02-travel-map ──┘         │
                          ├──→ 05-l1-safety-net
                          │
                          └──→ 06-repetition-variation
                                      │
                                      └──→ 07-persistence-visual
```

### Phase A: 독립 실행 가능 (병렬 가능)

| # | 문서 | 핵심 변경 | 예상 난이도 |
|---|------|----------|------------|
| 01 | [온보딩 리디자인](./01-onboarding-redesign.md) | OnboardingScreen → 공항 도착 체험 | M |
| 02 | [메인 화면 여행 지도](./02-main-screen-travel-map.md) | HomeScreen → TravelMap 지도 기반 | L |

### Phase B: Phase A 완료 후

| # | 문서 | 핵심 변경 | 예상 난이도 | 의존 |
|---|------|----------|------------|------|
| 03 | [4 Phase 학습 엔진](./03-four-phase-learning.md) | SessionScreen → Watch/Catch/Engage/Review | XL | 01, 02 |

### Phase C: Phase B 완료 후 (병렬 가능)

| # | 문서 | 핵심 변경 | 예상 난이도 | 의존 |
|---|------|----------|------------|------|
| 04 | [AI NPC & 피드백](./04-ai-npc-feedback.md) | Claude API NPC + 피드백 계층화 | L | 03 |
| 05 | [L1 안전망 & 문자](./05-l1-safety-net-characters.md) | [?] 안전망 + 앰비언트 노출 | M | 03 |
| 06 | [반복 학습 변주](./06-repetition-variation.md) | 변주 시나리오 + 교차 반복 | L | 03 |

### Phase D: 전체 마무리

| # | 문서 | 핵심 변경 | 예상 난이도 | 의존 |
|---|------|----------|------------|------|
| 07 | [지속성 & 비주얼](./07-persistence-visual.md) | 알림 리프레이밍 + 테마 + Anti-Pattern 제거 | M | 04, 05, 06 |

## 공통 규칙 (모든 문서에 적용)

1. **git commit**: 각 스텝 완료 시 커밋
2. **자동 진행**: 스텝 완료 시 다음 스텝으로 자동 이동
3. **PLAN.md**: 전체 프로세스를 컨텍스트가 아닌 파일로 관리
4. **리뷰어 필수**: 모든 작업에 리뷰어 할당
5. **실행 검증**: 시뮬레이터에서 동작 확인 전까지 미완료

## 불변 규칙 (v1 기획서)

- 한국어 발음 표기 금지 (후타리, 이랏샤이마세 등)
- "틀렸습니다" 메시지 금지
- 레벨/XP/점수 금지
- 스트릭 끊김 경고 금지
- L1(한국어) 상시 표시 금지

## 관련 문서

- v1 기획서: `docs/v1/Part1_원칙_온보딩_메인.md`, `Part2_4Phase.md`, `Part3_문자_반복_AI_지속성.md`
- 프로젝트 원칙: `CLAUDE.md`
- 진행 기록: `.claude/progress.md`
