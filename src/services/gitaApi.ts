// Fetches Bhagavad Gita data from Supabase database
import { supabase } from '@/integrations/supabase/client';

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

export async function fetchChapters(): Promise<GitaChapter[]> {
  const { data, error } = await supabase
    .from('chapters')
    .select('*')
    .order('chapter_number');
  
  if (error) throw new Error(`Failed to fetch chapters: ${error.message}`);
  return data || [];
}

export async function fetchVerses(): Promise<GitaVerse[]> {
  const { data, error } = await supabase
    .from('verses')
    .select('*')
    .order('chapter_number')
    .order('verse_number');
  
  if (error) throw new Error(`Failed to fetch verses: ${error.message}`);
  return data || [];
}

export async function fetchTranslations(): Promise<GitaTranslation[]> {
  const { data, error } = await supabase
    .from('translations')
    .select('*');
  
  if (error) throw new Error(`Failed to fetch translations: ${error.message}`);
  return data || [];
}

export async function fetchChapterVerses(chapterNumber: number): Promise<GitaVerse[]> {
  const { data, error } = await supabase
    .from('verses')
    .select('*')
    .eq('chapter_number', chapterNumber)
    .order('verse_number');
  
  if (error) throw new Error(`Failed to fetch chapter verses: ${error.message}`);
  return data || [];
}

export async function fetchVerse(chapterNumber: number, verseNumber: number): Promise<GitaVerse | undefined> {
  const { data, error } = await supabase
    .from('verses')
    .select('*')
    .eq('chapter_number', chapterNumber)
    .eq('verse_number', verseNumber)
    .maybeSingle();
  
  if (error) throw new Error(`Failed to fetch verse: ${error.message}`);
  return data || undefined;
}

export async function fetchVerseTranslations(verseId: number, language: string = 'english'): Promise<GitaTranslation[]> {
  const { data, error } = await supabase
    .from('translations')
    .select('*')
    .eq('verse_id', verseId)
    .eq('language', language);
  
  if (error) throw new Error(`Failed to fetch translations: ${error.message}`);
  return data || [];
}

// Get a single English translation (prefer Swami Sivananda or first available)
export async function fetchVerseEnglishTranslation(verseId: number): Promise<string> {
  const translations = await fetchVerseTranslations(verseId, 'english');
  
  // Prefer Swami Sivananda's translation for clarity
  const sivananda = translations.find(t => t.author_name.includes('Sivananda'));
  if (sivananda) return sivananda.description;
  
  // Otherwise return the first English translation
  return translations[0]?.description || '';
}
