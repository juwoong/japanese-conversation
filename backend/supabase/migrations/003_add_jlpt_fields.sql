-- 003_add_jlpt_fields.sql
-- situations 테이블에 JLPT, 테마, 베이스 상황 필드 추가

-- jlpt_target: N5, N4, N3 등
ALTER TABLE situations ADD COLUMN IF NOT EXISTS jlpt_target TEXT;

-- theme: 한국어 테마 설명 (예: "날씨 이야기하면서 주문")
ALTER TABLE situations ADD COLUMN IF NOT EXISTS theme TEXT;

-- base_situation_id: v2 변형의 원본 상황 참조
ALTER TABLE situations ADD COLUMN IF NOT EXISTS base_situation_id INTEGER REFERENCES situations(id);

-- vocabulary 테이블에 unique 제약 추가 (upsert용)
-- situation_id + word_ja 조합이 유니크해야 함
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'vocabulary_situation_word_unique'
  ) THEN
    ALTER TABLE vocabulary ADD CONSTRAINT vocabulary_situation_word_unique UNIQUE(situation_id, word_ja);
  END IF;
END $$;
