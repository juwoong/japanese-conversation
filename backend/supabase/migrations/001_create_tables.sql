-- 001_create_tables.sql
-- 일본어 회화 학습 앱 데이터베이스 스키마

-- ============================================
-- 1. profiles (사용자 프로필)
-- ============================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  gender TEXT CHECK (gender IN ('male', 'female', 'neutral')),
  current_level INTEGER DEFAULT 1,
  daily_goal INTEGER DEFAULT 3,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2. personas (페르소나)
-- ============================================
CREATE TABLE personas (
  id SERIAL PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name_ko TEXT NOT NULL,
  name_ja TEXT,
  icon TEXT,
  description TEXT,
  sort_order INTEGER DEFAULT 0
);

-- ============================================
-- 3. user_personas (사용자-페르소나 연결)
-- ============================================
CREATE TABLE user_personas (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  persona_id INTEGER REFERENCES personas(id),
  is_primary BOOLEAN DEFAULT FALSE,
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, persona_id)
);

-- ============================================
-- 4. situations (상황)
-- ============================================
CREATE TABLE situations (
  id SERIAL PRIMARY KEY,
  persona_id INTEGER REFERENCES personas(id),
  slug TEXT NOT NULL,
  name_ko TEXT NOT NULL,
  name_ja TEXT,
  location_ko TEXT,
  location_ja TEXT,
  difficulty INTEGER CHECK (difficulty BETWEEN 1 AND 3),
  sort_order INTEGER DEFAULT 0,
  UNIQUE(persona_id, slug)
);

-- ============================================
-- 5. lines (대사)
-- ============================================
CREATE TABLE lines (
  id SERIAL PRIMARY KEY,
  situation_id INTEGER REFERENCES situations(id) ON DELETE CASCADE,
  line_order INTEGER NOT NULL,
  speaker TEXT CHECK (speaker IN ('npc', 'user')),
  text_ja TEXT NOT NULL,
  text_ja_male TEXT,
  text_ja_female TEXT,
  pronunciation_ko TEXT,
  text_ko TEXT NOT NULL,
  grammar_hint TEXT,
  UNIQUE(situation_id, line_order)
);

-- ============================================
-- 6. expressions (표현 - 크로스 해금용)
-- ============================================
CREATE TABLE expressions (
  id SERIAL PRIMARY KEY,
  text_ja TEXT NOT NULL,
  text_ko TEXT NOT NULL,
  pronunciation_ko TEXT,
  tags TEXT[],
  UNIQUE(text_ja)
);

-- ============================================
-- 7. line_expressions (대사-표현 연결)
-- ============================================
CREATE TABLE line_expressions (
  id SERIAL PRIMARY KEY,
  line_id INTEGER REFERENCES lines(id) ON DELETE CASCADE,
  expression_id INTEGER REFERENCES expressions(id) ON DELETE CASCADE,
  UNIQUE(line_id, expression_id)
);

-- ============================================
-- 8. user_situation_progress (상황 진도)
-- ============================================
CREATE TABLE user_situation_progress (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  situation_id INTEGER REFERENCES situations(id),
  status TEXT CHECK (status IN ('locked', 'available', 'in_progress', 'completed')) DEFAULT 'locked',
  completed_at TIMESTAMPTZ,
  best_accuracy REAL,
  attempt_count INTEGER DEFAULT 0,
  UNIQUE(user_id, situation_id)
);

-- ============================================
-- 9. srs_cards (FSRS 카드)
-- ============================================
CREATE TABLE srs_cards (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  line_id INTEGER REFERENCES lines(id),
  stability REAL DEFAULT 0,
  difficulty REAL DEFAULT 0,
  elapsed_days INTEGER DEFAULT 0,
  scheduled_days INTEGER DEFAULT 0,
  reps INTEGER DEFAULT 0,
  lapses INTEGER DEFAULT 0,
  state TEXT CHECK (state IN ('new', 'learning', 'review', 'relearning')) DEFAULT 'new',
  due_date DATE,
  last_review TIMESTAMPTZ,
  UNIQUE(user_id, line_id)
);

-- 오늘 복습할 카드 조회 인덱스
CREATE INDEX idx_srs_due ON srs_cards(user_id, due_date) WHERE state != 'new';

-- ============================================
-- 10. user_attempts (시도 기록)
-- ============================================
CREATE TABLE user_attempts (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  line_id INTEGER REFERENCES lines(id),
  srs_card_id INTEGER REFERENCES srs_cards(id),
  user_input TEXT,
  is_correct BOOLEAN,
  accuracy REAL,
  rating INTEGER CHECK (rating BETWEEN 1 AND 4),
  attempted_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- RLS (Row Level Security) 정책
-- ============================================

-- profiles: 본인만 조회/수정
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- 콘텐츠 테이블: 모두 읽기 가능
ALTER TABLE personas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read personas" ON personas FOR SELECT USING (true);

ALTER TABLE situations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read situations" ON situations FOR SELECT USING (true);

ALTER TABLE lines ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read lines" ON lines FOR SELECT USING (true);

ALTER TABLE expressions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read expressions" ON expressions FOR SELECT USING (true);

ALTER TABLE line_expressions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read line_expressions" ON line_expressions FOR SELECT USING (true);

-- user_personas: 본인만
ALTER TABLE user_personas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own personas" ON user_personas
  FOR ALL USING (auth.uid() = user_id);

-- user_situation_progress: 본인만
ALTER TABLE user_situation_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own progress" ON user_situation_progress
  FOR ALL USING (auth.uid() = user_id);

-- srs_cards: 본인만
ALTER TABLE srs_cards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own cards" ON srs_cards
  FOR ALL USING (auth.uid() = user_id);

-- user_attempts: 본인만
ALTER TABLE user_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own attempts" ON user_attempts
  FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- Trigger: updated_at 자동 갱신
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Trigger: 새 사용자 생성 시 profile 자동 생성
-- ============================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
