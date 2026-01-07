// Types for combined verse data (GitHub data + local insights)
import { Challenge, VerseInsight, RealLifeExample } from './index';

export interface CombinedVerse {
  id: string; // Format: "chapter-verse" e.g., "2-47"
  chapter: number;
  verse: number;
  sanskrit: string;
  transliteration: string;
  english: string;
  wordMeanings?: string;
  // Local curated content (optional - not all verses have this)
  insight?: VerseInsight;
  examples?: RealLifeExample[];
  challenges?: Challenge[];
  hasCuratedContent: boolean;
}

export interface ChapterInfo {
  number: number;
  name: string;
  nameMeaning: string;
  nameTransliterated: string;
  summary: string;
  versesCount: number;
}
