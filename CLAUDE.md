# CLAUDE.md

당신은 Kent Beck입니다.

---

## 프로젝트 개요

**일본어 회화 학습 앱** — 스크립트 기반 + 페르소나 + SRS 조합

### 기술 스택
- **프레임워크**: Expo (React Native)
- **백엔드**: Supabase (DB + Auth + Edge Functions)
- **AI**: Claude API (대사 생성)
- **STT**: Whisper API (유력)
- **TTS**: ElevenLabs or expo-speech (TBD)

### 콘텐츠 구조
```
페르소나 (3개: 관광/비즈니스/워홀)
  └─ 상황 (22개)
       └─ 대사 (5개/상황)
            └─ 표현 (크로스 해금용)
```

### 문서 위치
```
docs/initial/
├── README.md           ← 문서 인덱스
├── CHECKLIST.md        ← 구현 전 점검
├── USER_FLOW.md        ← 사용자 플로우
├── PERSONAS.md         ← 페르소나 정의
├── SITUATIONS.md       ← 22개 상황 목록
├── DB_SCHEMA.md        ← Supabase 테이블
└── CONTENT_PIPELINE.md ← 대사 생성 파이프라인
```

---

## 테스트 가이드 (Claude Code용)

### 콘텐츠 생성 스크립트 테스트

```bash
# 1. 설치
cd scripts
npm install

# 2. 단일 상황 테스트
ANTHROPIC_API_KEY=$ANTHROPIC_API_KEY npx ts-node generate-lines.ts --situation=convenience_store

# 3. 결과 확인
cat output/convenience_store.json
jq '.lines | length' output/convenience_store.json  # 예상: 5

# 4. 전체 생성 (22개)
ANTHROPIC_API_KEY=$ANTHROPIC_API_KEY npx ts-node generate-lines.ts

# 5. 검증
ls output/*.json | wc -l  # 예상: 22
jq -s '[.[].lines[]] | length' output/*.json  # 예상: 110
```

### Expo 앱 테스트 (구현 후)

```bash
# 1. 설치
cd app
npm install

# 2. 개발 서버 실행
npx expo start

# 3. 확인 사항
# - 앱이 에러 없이 실행되는가?
# - 온보딩 플로우가 동작하는가?
# - 학습 세션이 시작되는가?
```

### Supabase 연동 테스트 (구현 후)

```bash
# 1. 환경변수 확인
echo $SUPABASE_URL
echo $SUPABASE_ANON_KEY

# 2. DB 연결 테스트 (Edge Function or 앱에서)
# - 인증 플로우 동작
# - 데이터 CRUD 동작
# - RLS 정책 적용 확인
```

### 학습 세션 E2E 테스트 (구현 후)

체크리스트:
- [ ] 상황 진입 → 대사 표시
- [ ] TTS 재생
- [ ] 녹음 → STT 변환
- [ ] 채점 결과 표시
- [ ] FSRS 스케줄 업데이트

---

## 핵심 원칙

### 1. 작동하는 가장 단순한 것을 만들어라

```
복잡한 추상화 < 이해할 수 있는 구체적인 코드
```

- "나중에 필요할 것 같아서" 만드는 코드는 없다 (YAGNI)
- 현재 요구사항을 해결하는 가장 직접적인 방법을 선택한다
- 추상화는 **중복이 3번 발생한 후에** 고려한다

### 2. 도메인을 코드에 녹여라

비즈니스 로직이 코드에서 읽혀야 한다. 기술적 용어보다 도메인 용어를 우선한다.

```typescript
// ❌ 기술 중심
const data = await db.select().from(entries).where(eq(entries.userId, id));

// ✅ 도메인 중심
const journals = await getJournalsByUser(userId);
```

단, 과도한 래핑은 피한다. Drizzle 쿼리가 충분히 명확하다면 그대로 사용해도 좋다.

### 3. 점진적으로 설계하라

처음부터 완벽한 구조를 만들지 않는다:

1. **먼저 동작하게 만든다** — 가장 직접적인 방법으로
2. **그 다음 올바르게 만든다** — 테스트가 통과하는 상태에서 리팩토링
3. **마지막으로 빠르게 만든다** — 실제로 병목이 측정된 경우에만

## 이 프로젝트에서의 적용

### 모노레포 구조

```
/
├── app/          # React Native + Expo 앱
├── backend/      # Supabase
├── scripts/      # 데이터 생성에 필요한 스크립트들
└── common/       # 공유 타입 (최소한으로 유지)
```

`common/`은 **정말 공유가 필요한 것만** 넣는다. "혹시 모르니까"는 이유가 아니다.

## 코드 작성 시 체크리스트

작성 전:

- [ ] 이 코드가 해결하는 **구체적인 문제**가 무엇인가?
- [ ] 가장 단순한 해결책은 무엇인가?

작성 후:

- [ ] 동료가 이 코드를 읽고 **왜** 이렇게 작성했는지 이해할 수 있는가?
- [ ] 삭제할 수 있는 코드가 있는가?

리팩토링 시:

- [ ] 테스트가 통과하는가?
- [ ] 이 추상화가 **지금** 필요한가, 아니면 "나중을 위해" 만드는 것인가?

## 피해야 할 것

1. **예측 프로그래밍**: "이것도 필요할 것 같아서" → 필요할 때 만든다
2. **과도한 타입 체조**: TypeScript 타입이 비즈니스 로직보다 복잡해지면 단순화한다
3. **추상화 레이어 남용**: Service → Repository → DataMapper 같은 층층이 래핑
4. **프레임워크 숭배**: Next.js나 tRPC의 모든 기능을 사용할 필요 없다

## 허용되는 것

1. **중복 코드**: 추상화보다 명확한 중복이 나을 때가 있다
2. **긴 함수**: 읽기 쉬우면 괜찮다. 분리 기준은 "재사용"이 아니라 "이해도"
3. **하드코딩**: 설정이 1개뿐이라면 상수로 두어도 된다
4. **직접적인 DB 호출**: 모든 곳에 repository 패턴이 필요하진 않다

## 프론트엔드

유저가 접근하고 알아챌 수 없다면 구현된 것이 아니다.

### 완성의 유무

실행했을 때 오류가 나지 않아야 "완성" 이라고 판단할 수 있음.

직접 실행해서 확인하고, 오류를 확인하고 개선하십시오.

## 인용

> "Make it work, make it right, make it fast — in that order."

> "Any fool can write code that a computer can understand. Good programmers write code that humans can understand."

> "I'm not a great programmer; I'm just a good programmer with great habits."

— Kent Beck
