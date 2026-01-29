# 데이터베이스 스키마 (Supabase PostgreSQL)

## 개요

- **백엔드**: Supabase (PostgreSQL + Auth + Edge Functions)
- **설계 원칙**:
  - 상황(Situation)과 표현(Expression) 분리 → 크로스 해금 지원
  - FSRS 알고리즘용 SRS 데이터 구조
  - 성별에 따른 대사 변형 지원

---

## 테이블 구조

### 1. profiles (사용자 프로필)

Supabase Auth의 `auth.users`와 1:1 연결

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  gender TEXT CHECK (gender IN ('male', 'female', 'neutral')),
  current_level INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | UUID | auth.users FK |
| gender | TEXT | 성별 (male/female/neutral) |
| current_level | INTEGER | 전체 레벨 (1~3) |

---

### 2. personas (페르소나)

```sql
CREATE TABLE personas (
  id SERIAL PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,  -- 'tourist', 'business', 'workingholiday'
  name_ko TEXT NOT NULL,
  name_ja TEXT,
  icon TEXT,
  description TEXT,
  sort_order INTEGER DEFAULT 0
);
```

**초기 데이터:**
| slug | name_ko |
|------|---------|
| tourist | 관광 |
| business | 비즈니스 |
| workingholiday | 워홀/유학 |

---

### 3. user_personas (사용자-페르소나 연결)

복수 선택은 MVP 이후지만, 구조는 미리 준비

```sql
CREATE TABLE user_personas (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  persona_id INTEGER REFERENCES personas(id),
  is_primary BOOLEAN DEFAULT FALSE,
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, persona_id)
);
```

---

### 4. situations (상황)

```sql
CREATE TABLE situations (
  id SERIAL PRIMARY KEY,
  persona_id INTEGER REFERENCES personas(id),
  slug TEXT NOT NULL,  -- 'convenience_store', 'cafe', etc.
  name_ko TEXT NOT NULL,
  name_ja TEXT,
  location_ko TEXT,  -- 장소
  location_ja TEXT,
  difficulty INTEGER CHECK (difficulty BETWEEN 1 AND 3),
  sort_order INTEGER DEFAULT 0,
  UNIQUE(persona_id, slug)
);
```

| 컬럼 | 설명 |
|------|------|
| difficulty | 1=★☆☆, 2=★★☆, 3=★★★ |
| sort_order | 가이드 모드 순서 |

---

### 5. lines (대사)

상황별 5개 대사

```sql
CREATE TABLE lines (
  id SERIAL PRIMARY KEY,
  situation_id INTEGER REFERENCES situations(id) ON DELETE CASCADE,
  line_order INTEGER NOT NULL,  -- 1~5
  speaker TEXT CHECK (speaker IN ('npc', 'user')),

  -- 일본어 (성별 무관한 기본형)
  text_ja TEXT NOT NULL,

  -- 성별별 변형 (NULL이면 기본형 사용)
  text_ja_male TEXT,
  text_ja_female TEXT,

  -- 발음 가이드 (Lv.1용)
  pronunciation_ko TEXT,

  -- 번역
  text_ko TEXT NOT NULL,

  -- 힌트/문법 설명
  grammar_hint TEXT,

  UNIQUE(situation_id, line_order)
);
```

**성별 처리 로직:**
```
IF user.gender = 'male' AND text_ja_male IS NOT NULL:
    return text_ja_male
ELIF user.gender = 'female' AND text_ja_female IS NOT NULL:
    return text_ja_female
ELSE:
    return text_ja  -- 기본형
```

---

### 6. expressions (표현 - 크로스 해금용)

```sql
CREATE TABLE expressions (
  id SERIAL PRIMARY KEY,
  text_ja TEXT NOT NULL,
  text_ko TEXT NOT NULL,
  pronunciation_ko TEXT,
  tags TEXT[],  -- ['greeting', 'transaction', 'number', ...]
  UNIQUE(text_ja)
);
```

---

### 7. line_expressions (대사-표현 연결)

```sql
CREATE TABLE line_expressions (
  id SERIAL PRIMARY KEY,
  line_id INTEGER REFERENCES lines(id) ON DELETE CASCADE,
  expression_id INTEGER REFERENCES expressions(id) ON DELETE CASCADE,
  UNIQUE(line_id, expression_id)
);
```

**크로스 해금 쿼리 예시:**
```sql
-- 사용자가 배운 표현이 포함된 다른 상황 찾기
SELECT DISTINCT s.*
FROM situations s
JOIN lines l ON l.situation_id = s.id
JOIN line_expressions le ON le.line_id = l.id
WHERE le.expression_id IN (
  SELECT expression_id FROM user_learned_expressions WHERE user_id = ?
);
```

---

### 8. user_situation_progress (상황 진도)

```sql
CREATE TABLE user_situation_progress (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  situation_id INTEGER REFERENCES situations(id),
  status TEXT CHECK (status IN ('locked', 'available', 'in_progress', 'completed')),
  completed_at TIMESTAMPTZ,
  best_accuracy REAL,  -- 0.0 ~ 1.0
  attempt_count INTEGER DEFAULT 0,
  UNIQUE(user_id, situation_id)
);
```

---

### 9. srs_cards (FSRS 카드)

FSRS 알고리즘 필드 포함

```sql
CREATE TABLE srs_cards (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  line_id INTEGER REFERENCES lines(id),

  -- FSRS 필드
  stability REAL DEFAULT 0,
  difficulty REAL DEFAULT 0,
  elapsed_days INTEGER DEFAULT 0,
  scheduled_days INTEGER DEFAULT 0,
  reps INTEGER DEFAULT 0,
  lapses INTEGER DEFAULT 0,
  state TEXT CHECK (state IN ('new', 'learning', 'review', 'relearning')) DEFAULT 'new',

  -- 스케줄
  due_date DATE,
  last_review TIMESTAMPTZ,

  UNIQUE(user_id, line_id)
);

-- 오늘 복습할 카드 조회 인덱스
CREATE INDEX idx_srs_due ON srs_cards(user_id, due_date) WHERE state != 'new';
```

---

### 10. user_attempts (시도 기록)

```sql
CREATE TABLE user_attempts (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  line_id INTEGER REFERENCES lines(id),
  srs_card_id INTEGER REFERENCES srs_cards(id),

  -- 입력
  user_input TEXT,  -- STT 결과

  -- 채점
  is_correct BOOLEAN,
  accuracy REAL,  -- 0.0 ~ 1.0

  -- FSRS 등급 (1=Again, 2=Hard, 3=Good, 4=Easy)
  rating INTEGER CHECK (rating BETWEEN 1 AND 4),

  attempted_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 관계 다이어그램

```
profiles
    │
    ├──< user_personas >── personas
    │                          │
    ├──< user_situation_progress >── situations ──< lines
    │                                                 │
    ├──< srs_cards >─────────────────────────────────┘
    │         │
    └──< user_attempts >─────────────────────────────┘

expressions ──< line_expressions >── lines
```

---

## RLS (Row Level Security) 정책

```sql
-- profiles: 본인만 조회/수정
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- 콘텐츠 테이블 (personas, situations, lines, expressions): 모두 읽기 가능
ALTER TABLE personas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read" ON personas FOR SELECT USING (true);

-- 사용자 데이터: 본인만
ALTER TABLE srs_cards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own cards" ON srs_cards
  FOR ALL USING (auth.uid() = user_id);
```

---

## Edge Functions (예정)

| 함수 | 역할 |
|------|------|
| `get-daily-session` | 오늘의 학습 구성 (FSRS 복습 + 신규) |
| `submit-attempt` | 사용자 답변 채점 + FSRS 업데이트 |
| `unlock-situation` | 상황 해금 처리 |

---

## 열린 질문

1. ~~표현(Expression) 테이블 필요?~~ → ✅ 유지 (크로스 해금 핵심 기능)
2. ~~오디오 저장~~ → ✅ 온라인 서빙 (TTS 실시간 or Supabase Storage)
3. ~~오프라인 지원~~ → ❌ MVP 제외
4. 표현(Expression) 자동 추출 vs 수동 태깅? → 🔜 구현 시 결정
