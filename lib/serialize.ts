// Drizzle models are camelCase; the client contract in shared/types.ts is
// snake_case (inherited from the Supabase schema). Convert at the boundary
// so neither side has to care about the other's convention.
import type {
  Favorite,
  GitaChapter,
  GitaTranslation,
  GitaVerse,
  Profile,
  SavedInsight,
  User,
  VerseChallenge,
} from '@/lib/types';

type Row = Record<string, any>;

export const toUser = (u: Row): User => ({ id: u.id, email: u.email });

export const toProfile = (p: Row): Profile => ({
  id: p.id,
  user_id: p.userId,
  display_name: p.displayName,
  avatar_url: p.avatarUrl,
  daily_verse_enabled: p.dailyVerseEnabled,
  age: p.age,
  profession: p.profession,
  marital_status: p.maritalStatus,
  is_onboarded: p.isOnboarded,
  selected_challenges: p.selectedChallenges ?? [],
});

export const toChapter = (c: Row): GitaChapter => ({
  id: c.id,
  chapter_number: c.chapterNumber,
  name: c.name,
  name_transliterated: c.nameTransliterated,
  name_translated: c.nameTranslated,
  verses_count: c.versesCount,
  chapter_summary: c.chapterSummary,
  chapter_summary_hindi: c.chapterSummaryHindi,
});

export const toVerse = (v: Row): GitaVerse => ({
  id: v.id,
  verse_id: v.verseId,
  chapter_number: v.chapterNumber,
  verse_number: v.verseNumber,
  text: v.text,
  transliteration: v.transliteration,
  word_meanings: v.wordMeanings,
});

export const toTranslation = (t: Row): GitaTranslation => ({
  id: t.id,
  verse_id: t.verseId,
  author_name: t.authorName,
  language: t.language,
  description: t.description,
});

export const toSavedInsight = (s: Row): SavedInsight => ({
  id: s.id,
  user_id: s.userId,
  verse_id: s.verseId,
  chapter_number: s.chapterNumber,
  verse_number: s.verseNumber,
  title: s.title,
  description: s.description,
  challenge_id: s.challengeId,
  created_at: s.createdAt instanceof Date ? s.createdAt.toISOString() : s.createdAt,
});

export const toFavorite = (f: Row): Favorite => ({
  chapter_number: f.chapterNumber,
  verse_number: f.verseNumber,
  created_at: f.createdAt instanceof Date ? f.createdAt.toISOString() : f.createdAt,
});

export const toVerseChallenge = (v: Row): VerseChallenge => ({
  id: v.id,
  chapter_number: v.chapterNumber,
  verse_number: v.verseNumber,
  challenges: v.challenges ?? [],
  ai_summary: v.aiSummary,
});
