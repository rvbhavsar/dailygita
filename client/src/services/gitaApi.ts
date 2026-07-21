// Fetches Bhagavad Gita data from the DailyGita API.
import type { GitaChapter, GitaTranslation, GitaVerse } from 'shared';
import { ApiError, apiGet } from '@/lib/api';

export type { GitaChapter, GitaTranslation, GitaVerse };

export function fetchChapters(): Promise<GitaChapter[]> {
  return apiGet<GitaChapter[]>('/chapters');
}

export function fetchVerses(): Promise<GitaVerse[]> {
  return apiGet<GitaVerse[]>('/verses');
}

export function fetchTranslations(): Promise<GitaTranslation[]> {
  return apiGet<GitaTranslation[]>('/translations');
}

export function fetchChapterVerses(chapterNumber: number): Promise<GitaVerse[]> {
  return apiGet<GitaVerse[]>(`/chapters/${chapterNumber}/verses`);
}

export async function fetchVerse(
  chapterNumber: number,
  verseNumber: number,
): Promise<GitaVerse | undefined> {
  try {
    return await apiGet<GitaVerse>(`/verses/${chapterNumber}/${verseNumber}`);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return undefined;
    throw error;
  }
}

export function fetchVerseTranslations(verseId: number): Promise<GitaTranslation[]> {
  return apiGet<GitaTranslation[]>(`/verses/${verseId}/translations`);
}

// Get a single English translation (prefer Swami Sivananda or first available)
export async function fetchVerseEnglishTranslation(verseId: number): Promise<string> {
  const translations = await fetchVerseTranslations(verseId);
  const english = translations.filter((t) => t.language === 'english');

  // Prefer Swami Sivananda's translation for clarity
  const sivananda = english.find((t) => t.author_name.includes('Sivananda'));
  if (sivananda) return sivananda.description;

  return english[0]?.description || translations[0]?.description || '';
}
