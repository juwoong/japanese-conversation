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
};

export interface SituationWithProgress extends Situation {
  progress?: UserSituationProgress;
}

// Session Types
export interface SessionLine extends Line {
  situation: Situation;
}

export interface DailySession {
  reviewCards: SRSCard[];
  newLines: SessionLine[];
  totalCount: number;
}
