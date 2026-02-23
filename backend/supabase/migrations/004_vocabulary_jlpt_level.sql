-- 004_vocabulary_jlpt_level.sql
-- vocabulary 테이블에 개별 단어 JLPT 레벨 컬럼 추가
-- 기존 situations.jlpt_target은 상황 레벨, 이건 단어별 레벨

ALTER TABLE vocabulary ADD COLUMN IF NOT EXISTS jlpt_level TEXT;

CREATE INDEX IF NOT EXISTS idx_vocabulary_jlpt_level ON vocabulary(jlpt_level);
