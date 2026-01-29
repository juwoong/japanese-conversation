# 일본어 회화 학습 앱 - 기획 문서

스크립트 기반 + 페르소나 + SRS 조합의 일본어 회화 학습 앱

---

## 문서 목록

| 문서 | 설명 |
|------|------|
| [PLAN.md](./PLAN.md) | 초기 기획 (원본) |
| [TECH STACK.md](./TECH%20STACK.md) | 기술 스택 결정 |
| [USER_FLOW.md](./USER_FLOW.md) | 사용자 플로우 전체 |
| [PERSONAS.md](./PERSONAS.md) | 페르소나 정의 (관광/비즈니스/워홀) |
| [SITUATIONS.md](./SITUATIONS.md) | 상황 목록 22개 |
| [DB_SCHEMA.md](./DB_SCHEMA.md) | Supabase 테이블 구조 |
| [CONTENT_PIPELINE.md](./CONTENT_PIPELINE.md) | AI 대사 생성 파이프라인 |
| [CHECKLIST.md](./CHECKLIST.md) | 구현 전 점검 체크리스트 |

---

## 핵심 결정 요약

### 기술 스택
- **프레임워크**: Expo (React Native)
- **백엔드**: Supabase (DB + Auth + Edge Functions)
- **AI**: Claude API
- **STT**: Whisper API (유력)
- **TTS**: ElevenLabs or expo-speech (TBD)

### 콘텐츠
- 페르소나 3개 × 상황 22개 × 대사 5개 = **110개 대사**
- 성별 2벌 = **220개 대사**
- 크로스 해금: Expression 단위 공유

### 레벨 시스템
| 레벨 | 표시 | 채점 | Drill |
|------|------|------|-------|
| Lv.1 | 발음+번역 | 단어만 | 따라하기 |
| Lv.2 | 번역만 | 조사 포함 | +안보고 말하기 |
| Lv.3 | 숨김 | 정확한 문장 | +발음교정+공유 |

---

## 구현 순서

1. **Phase 1**: Expo + Supabase 세팅
2. **Phase 2**: 대사 생성 스크립트 실행 → 콘텐츠 생성
3. **Phase 3**: 핵심 기능 (학습 세션, STT/TTS)
4. **Phase 4**: FSRS SRS 구현
5. **Phase 5**: 부가 기능 (단어장, 히스토리, 리워드)

---

## 스크립트

```
scripts/
├── generate-lines.ts   ← 대사 자동 생성
├── situations.json     ← 22개 상황 데이터
└── output/             ← 생성 결과
```

실행: `ANTHROPIC_API_KEY=xxx npx ts-node generate-lines.ts`

---

## 미결정 사항

- STT/TTS 최종 선택 → 구현 시 확정
- Expression 추출 방식 → 구현 시 확정
- 30일 리워드 → 나중에
- 페르소나 복수 선택 → MVP 이후
