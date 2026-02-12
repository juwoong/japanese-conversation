-- Add furigana column to lines table
-- Stores pre-computed furigana segments as JSON array:
--   [{"text": "注文", "reading": "ちゅうもん"}, {"text": "は？"}]

ALTER TABLE lines ADD COLUMN IF NOT EXISTS furigana jsonb;

COMMENT ON COLUMN lines.furigana IS 'Pre-computed furigana segments [{text, reading?}]';
