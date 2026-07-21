import { ChallengeInfo } from '@/types';

export const challenges: ChallengeInfo[] = [
  {
    id: 'stress-anxiety',
    label: 'Stress & Anxiety',
    description: 'Find peace amidst chaos and cultivate inner calm',
    icon: '🧘',
  },
  {
    id: 'decision-making',
    label: 'Decision Making',
    description: 'Make clear choices with wisdom and confidence',
    icon: '🎯',
  },
  {
    id: 'discipline-consistency',
    label: 'Discipline & Consistency',
    description: 'Build lasting habits and stay committed to your path',
    icon: '⚡',
  },
  {
    id: 'focus-distraction',
    label: 'Focus & Distraction',
    description: 'Master your attention and avoid mental scattered',
    icon: '🔍',
  },
  {
    id: 'purpose-motivation',
    label: 'Purpose & Motivation',
    description: 'Discover your calling and sustain inner drive',
    icon: '🌟',
  },
  {
    id: 'relationships',
    label: 'Relationships',
    description: 'Navigate connections with wisdom and compassion',
    icon: '💝',
  },
  {
    id: 'leadership',
    label: 'Leadership',
    description: 'Lead with integrity, vision, and selfless service',
    icon: '👑',
  },
  {
    id: 'fear-doubt',
    label: 'Fear & Doubt',
    description: 'Overcome hesitation and embrace courage',
    icon: '🦁',
  },
];

export const getChallengeById = (id: string): ChallengeInfo | undefined => {
  return challenges.find((c) => c.id === id);
};
