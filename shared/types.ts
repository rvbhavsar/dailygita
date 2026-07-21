// Shared API contract between client and server.

export interface User {
  id: string;
  email: string;
}

export interface Profile {
  id: string;
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  daily_verse_enabled: boolean;
  age: number | null;
  profession: string | null;
  marital_status: string | null;
  is_onboarded: boolean;
  selected_challenges: string[];
}

export interface GitaChapter {
  id: number;
  chapter_number: number;
  name: string;
  name_transliterated: string | null;
  name_translated: string | null;
  verses_count: number;
  chapter_summary: string | null;
  chapter_summary_hindi: string | null;
}

export interface GitaVerse {
  id: number;
  verse_id: number;
  chapter_number: number;
  verse_number: number;
  text: string;
  transliteration: string | null;
  word_meanings: string | null;
}

export interface GitaTranslation {
  id: number;
  verse_id: number;
  author_name: string;
  language: string;
  description: string;
}

export interface SavedInsight {
  id: string;
  user_id: string;
  /** Composite verse key, e.g. "2-47". */
  verse_id: string;
  chapter_number: number;
  verse_number: number;
  title: string;
  description: string;
  challenge_id: string | null;
  created_at: string;
}

export interface Favorite {
  chapter_number: number;
  verse_number: number;
  created_at: string;
}

export interface VerseChallenge {
  id: string;
  chapter_number: number;
  verse_number: number;
  challenges: string[];
  ai_summary: string | null;
}

export interface AudioResponse {
  url: string | null;
}

export interface AuthResponse {
  user: User;
  profile: Profile;
}
