# Supabase Backend

Supabase DB + Auth + Edge Functions

---

## 셋업

### 1. Supabase CLI 설치

```bash
npm install -g supabase
supabase login
```

### 2. 프로젝트 연결

```bash
supabase link --project-ref your-project-ref
```

### 3. 환경 변수 (Edge Functions용)

```bash
# Supabase secrets 설정
supabase secrets set OPENAI_API_KEY=sk-...
supabase secrets set ELEVENLABS_API_KEY=xi-...
```

---

## DB 마이그레이션

### 테이블 생성

```bash
# 마이그레이션 생성
supabase migration new create_tables

# SQL 파일 편집 후 적용
supabase db push
```

### 스키마 확인

```bash
supabase db diff
```

---

## 콘텐츠 Import

```bash
# scripts/ 폴더에서 생성된 JSON을 DB에 import
cd ../scripts
npx ts-node import-to-supabase.ts
```

### 데이터 검증

```bash
supabase db query "SELECT COUNT(*) FROM personas"     # 예상: 3
supabase db query "SELECT COUNT(*) FROM situations"   # 예상: 22
supabase db query "SELECT COUNT(*) FROM lines"        # 예상: 110
```

---

## Edge Functions

### 함수 목록

| 함수 | 역할 |
|------|------|
| `get-daily-session` | 오늘의 학습 구성 (FSRS 복습 + 신규) |
| `submit-attempt` | 사용자 답변 채점 + FSRS 업데이트 |
| `transcribe` | 음성 → 텍스트 (Whisper API) |

### 함수 생성

```bash
supabase functions new get-daily-session
supabase functions new submit-attempt
supabase functions new transcribe
```

### 로컬 테스트

```bash
# 함수 실행
supabase functions serve

# 다른 터미널에서 호출
curl -X POST http://localhost:54321/functions/v1/get-daily-session \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"user_id": "test-user"}'
```

### 배포

```bash
supabase functions deploy get-daily-session
supabase functions deploy submit-attempt
supabase functions deploy transcribe
```

---

## RLS 정책 테스트

```bash
# 인증 없이 접근 시도 (실패해야 함)
curl "$SUPABASE_URL/rest/v1/profiles" \
  -H "apikey: $SUPABASE_ANON_KEY"

# 인증 후 접근 (성공해야 함)
curl "$SUPABASE_URL/rest/v1/profiles" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN"
```

---

## 폴더 구조 (예정)

```
backend/
├── supabase/
│   ├── migrations/     # DB 마이그레이션
│   ├── functions/      # Edge Functions
│   │   ├── get-daily-session/
│   │   ├── submit-attempt/
│   │   └── transcribe/
│   └── seed.sql        # 초기 데이터
└── .env.example
```
