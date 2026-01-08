import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  fetchChapters,
  fetchVerses,
  fetchChapterVerses,
  fetchVerse,
  fetchTranslations,
  fetchVerseEnglishTranslation,
  GitaChapter,
  GitaVerse,
  GitaTranslation,
} from '@/services/gitaApi';

// Fetch all 18 chapters
export function useChapters() {
  return useQuery<GitaChapter[]>({
    queryKey: ['chapters'],
    queryFn: fetchChapters,
    staleTime: Infinity, // Data doesn't change
  });
}

// Fetch all verses (700+)
export function useAllVerses() {
  return useQuery<GitaVerse[]>({
    queryKey: ['verses'],
    queryFn: fetchVerses,
    staleTime: Infinity,
  });
}

// Fetch verses for a specific chapter
export function useChapterVerses(chapterNumber: number | null) {
  return useQuery<GitaVerse[]>({
    queryKey: ['verses', 'chapter', chapterNumber],
    queryFn: () => fetchChapterVerses(chapterNumber!),
    enabled: chapterNumber !== null,
    staleTime: Infinity,
  });
}

// Fetch a single verse
export function useVerse(chapterNumber: number, verseNumber: number) {
  return useQuery<GitaVerse | undefined>({
    queryKey: ['verse', chapterNumber, verseNumber],
    queryFn: () => fetchVerse(chapterNumber, verseNumber),
    staleTime: Infinity,
  });
}

// Fetch all translations
export function useTranslations() {
  return useQuery<GitaTranslation[]>({
    queryKey: ['translations'],
    queryFn: fetchTranslations,
    staleTime: Infinity,
  });
}

// Fetch English translation for a verse
export function useVerseTranslation(verseId: number | undefined) {
  return useQuery<string>({
    queryKey: ['translation', verseId],
    queryFn: () => fetchVerseEnglishTranslation(verseId!),
    enabled: verseId !== undefined,
    staleTime: Infinity,
  });
}

// Type for verse challenges from database
export interface VerseChallenges {
  chapter_number: number;
  verse_number: number;
  challenges: string[];
  ai_summary: string | null;
}

// Fetch all AI-analyzed verse challenges
export function useVerseChallenges() {
  return useQuery<VerseChallenges[]>({
    queryKey: ['verse-challenges'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('verse_challenges')
        .select('chapter_number, verse_number, challenges, ai_summary');
      
      if (error) throw error;
      return data || [];
    },
    staleTime: Infinity,
  });
}
