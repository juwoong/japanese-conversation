// Database Types

export interface Profile {
  id: string;
  gender: "male" | "female" | "neutral" | null;
  current_level: number;
  daily_goal: number;
  created_at: string;
  updated_at: string;
}

export interface Persona {
  id: number;
  slug: string;
  name_ko: string;
  name_ja: string | null;
  icon: string | null;
  description: string | null;
  sort_order: number;
}

export interface Situation {
  id: number;
  persona_id: number;
  slug: string;
  name_ko: string;
  name_ja: string | null;
  location_ko: string | null;
  location_ja: string | null;
  difficulty: number;
  sort_order: number;
}

export interface FuriganaSegment {
  /** Display text (kanji, kana, punctuation) */
  text: string;
  /** Hiragana reading — present only when text contains kanji */
  reading?: string;
}

export interface Line {
  id: number;
  situation_id: number;
  line_order: number;
  speaker: "npc" | "user";
  text_ja: string;
  text_ja_male: string | null;
  text_ja_female: string | null;
  pronunciation_ko: string | null;
  text_ko: string;
  grammar_hint: string | null;
  furigana?: FuriganaSegment[];
}

export interface SRSCard {
  id: number;
  user_id: string;
  line_id: number;
  stability: number;
  difficulty: number;
  elapsed_days: number;
  scheduled_days: number;
  reps: number;
  lapses: number;
  state: "new" | "learning" | "review" | "relearning";
  due_date: string | null;
  last_review: string | null;
}

export interface UserSituationProgress {
  id: number;
  user_id: string;
  situation_id: number;
  status: "locked" | "available" | "in_progress" | "completed";
  completed_at: string | null;
  best_accuracy: number | null;
  attempt_count: number;
}

// Navigation Types
export type RootStackParamList = {
  Auth: undefined;
  Onboarding: undefined;
  Home: undefined;
  Session: { situationId: number; isReview?: boolean };
  SituationList: undefined;
  Settings: undefined;
  History: undefined;
  Vocabulary: undefined;
  Flashcard: undefined;
  PitchTest: undefined;
};

export interface SituationWithProgress extends Situation {
  progress?: UserSituationProgress;
}

export type SessionMode = 'voice' | 'silent';

// Four-Phase Learning Engine Types
export type SessionPhase = 'watch' | 'catch' | 'engage' | 'review';

export interface ModelLine {
  lineIndex: number;
  speaker: 'npc' | 'user';
  textJa: string;
  textKo: string;
  furigana?: FuriganaSegment[];
  isKeyExpression?: boolean;
  audioPlayed?: boolean;
}

export interface KeyExpression {
  textJa: string;
  textKo: string;
  emoji?: string;
  furigana?: FuriganaSegment[];
  /** Preceding NPC line — used as the prompt in PictureSpeak */
  npcPrompt?: string;
}

export interface TurnRecord {
  userText: string;
  expectedText: string;
  correct: boolean;
  feedbackType: 'none' | 'recast' | 'clarification' | 'meta_hint';
  errorType?: string;
  recastHighlight?: string;
  keyExpressionJa?: string;
}

export interface EngagePerformance {
  totalTurns: number;
  userTurns: number;
  correctCount: number;
  incorrectCount: number;
  turnRecords: TurnRecord[];
  errorBreakdown: Record<string, number>;
  conversationLog: Array<{
    speaker: 'npc' | 'user';
    textJa: string;
    textKo: string;
    feedbackType?: string;
  }>;
}

export type UserLevel = 'intermediate' | 'beginner' | 'conservative_beginner';

// Session Types
export interface SessionLine extends Line {
  situation: Situation;
}

export interface DailySession {
  reviewCards: SRSCard[];
  newLines: SessionLine[];
  totalCount: number;
}

export interface Vocabulary {
  id: number;
  word_ja: string;           // 日本語 단어
  reading_hiragana: string;  // ひらがな 읽기
  reading_ko: string;        // 한글 발음
  meaning_ko: string;        // 한국어 의미
  pos: string;               // 품사 (명사, 동사, 형용사 등)
  appears_in_lines?: number[]; // 등장 대사 번호
}
