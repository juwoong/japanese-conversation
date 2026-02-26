-- Add branches column to lines table for conversation branching
ALTER TABLE lines ADD COLUMN branches JSONB DEFAULT NULL;

COMMENT ON COLUMN lines.branches IS 'Optional depth-1 branch options for user turns. Array of {id, text_ja, text_ko, furigana, npc_reaction}';
