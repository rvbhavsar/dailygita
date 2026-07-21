export type Challenge = 
  | 'stress-anxiety'
  | 'decision-making'
  | 'discipline-consistency'
  | 'focus-distraction'
  | 'purpose-motivation'
  | 'relationships'
  | 'leadership'
  | 'fear-doubt';

export interface ChallengeInfo {
  id: Challenge;
  label: string;
  description: string;
  icon: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  selectedChallenges: Challenge[];
  dailyEmailEnabled: boolean;
}

export interface Verse {
  id: string;
  chapter: number;
  verse: number;
  sanskrit: string;
  english: string;
}

export interface VerseInsight {
  verseId: string;
  explanation: string;
  takeaway: string;
}

export interface RealLifeExample {
  verseId: string;
  challenge: Challenge;
  title: string;
  description: string;
}

export interface DailyDelivery {
  userId: string;
  verseId: string;
  deliveryDate: string;
}

export interface VerseWithInsights extends Verse {
  insight: VerseInsight;
  examples: RealLifeExample[];
  challenges: Challenge[];
}
