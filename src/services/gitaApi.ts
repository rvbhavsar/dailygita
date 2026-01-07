// Fetches Bhagavad Gita data from the gita/gita GitHub repository
const BASE_URL = 'https://raw.githubusercontent.com/gita/gita/main/data';

export interface GitaChapter {
  id: number;
  chapter_number: number;
  chapter_summary: string;
  chapter_summary_hindi: string;
  name: string;
  name_meaning: string;
  name_translation: string;
  name_transliterated: string;
  verses_count: number;
  image_name: string;
}

export interface GitaVerse {
  id: number;
  chapter_id: number;
  chapter_number: number;
  verse_number: number;
  verse_order: number;
  text: string;
  transliteration: string;
  word_meanings: string;
  title: string;
  externalId: number;
}

export interface GitaTranslation {
  id: number;
  verse_id: number;
  verseNumber: number;
  author_id: number;
  authorName: string;
  description: string;
  lang: string;
  language_id: number;
}

// Cache the data in memory to avoid refetching
let chaptersCache: GitaChapter[] | null = null;
let versesCache: GitaVerse[] | null = null;
let translationsCache: GitaTranslation[] | null = null;

export async function fetchChapters(): Promise<GitaChapter[]> {
  if (chaptersCache) return chaptersCache;
  
  const response = await fetch(`${BASE_URL}/chapters.json`);
  if (!response.ok) throw new Error('Failed to fetch chapters');
  
  chaptersCache = await response.json();
  return chaptersCache!;
}

export async function fetchVerses(): Promise<GitaVerse[]> {
  if (versesCache) return versesCache;
  
  const response = await fetch(`${BASE_URL}/verse.json`);
  if (!response.ok) throw new Error('Failed to fetch verses');
  
  versesCache = await response.json();
  return versesCache!;
}

export async function fetchTranslations(): Promise<GitaTranslation[]> {
  if (translationsCache) return translationsCache;
  
  const response = await fetch(`${BASE_URL}/translation.json`);
  if (!response.ok) throw new Error('Failed to fetch translations');
  
  translationsCache = await response.json();
  return translationsCache!;
}

export async function fetchChapterVerses(chapterNumber: number): Promise<GitaVerse[]> {
  const verses = await fetchVerses();
  return verses.filter(v => v.chapter_number === chapterNumber);
}

export async function fetchVerse(chapterNumber: number, verseNumber: number): Promise<GitaVerse | undefined> {
  const verses = await fetchVerses();
  return verses.find(v => v.chapter_number === chapterNumber && v.verse_number === verseNumber);
}

export async function fetchVerseTranslations(verseId: number, lang: string = 'english'): Promise<GitaTranslation[]> {
  const translations = await fetchTranslations();
  return translations.filter(t => t.verse_id === verseId && t.lang === lang);
}

// Get a single English translation (prefer Swami Sivananda or first available)
export async function fetchVerseEnglishTranslation(verseId: number): Promise<string> {
  const translations = await fetchVerseTranslations(verseId, 'english');
  
  // Prefer Swami Sivananda's translation for clarity
  const sivananda = translations.find(t => t.authorName.includes('Sivananda'));
  if (sivananda) return sivananda.description;
  
  // Otherwise return the first English translation
  return translations[0]?.description || '';
}
