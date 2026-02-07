-- 002_vocabulary.sql
-- 어휘(단어) 테이블 및 대사-어휘 연결 테이블

-- ============================================
-- 1. vocabulary (어휘)
-- ============================================
CREATE TABLE IF NOT EXISTS vocabulary (
  id SERIAL PRIMARY KEY,
  situation_id INTEGER NOT NULL REFERENCES situations(id) ON DELETE CASCADE,
  word_ja TEXT NOT NULL,
  reading_hiragana TEXT NOT NULL,
  reading_ko TEXT NOT NULL,
  meaning_ko TEXT NOT NULL,
  pos TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2. line_vocabulary (대사-어휘 연결)
-- ============================================
CREATE TABLE IF NOT EXISTS line_vocabulary (
  id SERIAL PRIMARY KEY,
  line_id INTEGER NOT NULL REFERENCES lines(id) ON DELETE CASCADE,
  vocabulary_id INTEGER NOT NULL REFERENCES vocabulary(id) ON DELETE CASCADE,
  UNIQUE(line_id, vocabulary_id)
);

-- ============================================
-- Indexes
-- ============================================
CREATE INDEX IF NOT EXISTS idx_vocabulary_situation ON vocabulary(situation_id);
CREATE INDEX IF NOT EXISTS idx_line_vocabulary_line ON line_vocabulary(line_id);
CREATE INDEX IF NOT EXISTS idx_line_vocabulary_vocab ON line_vocabulary(vocabulary_id);

-- ============================================
-- RLS (Row Level Security) 정책
-- ============================================
ALTER TABLE vocabulary ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read vocabulary" ON vocabulary FOR SELECT USING (true);

ALTER TABLE line_vocabulary ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read line_vocabulary" ON line_vocabulary FOR SELECT USING (true);
