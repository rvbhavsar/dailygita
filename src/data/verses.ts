import { VerseWithInsights, Challenge } from '@/types';

// Sample verses from the Bhagavad Gita - in production, these would come from the GitHub API
export const verses: VerseWithInsights[] = [
  {
    id: '2-47',
    chapter: 2,
    verse: 47,
    sanskrit: 'कर्मण्येवाधिकारस्ते मा फलेषु कदाचन ।\nमा कर्मफलहेतुर्भूर्मा ते सङ्गोऽस्त्वकर्मणि ॥',
    english: 'You have the right to perform your duties, but you are not entitled to the fruits of your actions. Never consider yourself the cause of the results, nor be attached to inaction.',
    insight: {
      verseId: '2-47',
      explanation: 'This is perhaps the most famous verse of the Gita. It teaches us to focus on the process, not the outcome. When we detach from results, we perform better because anxiety and fear no longer cloud our actions.',
      takeaway: 'Do your best work without obsessing over outcomes. Excellence comes from presence, not pressure.',
    },
    examples: [
      {
        verseId: '2-47',
        challenge: 'stress-anxiety',
        title: 'The Anxious Job Interview',
        description: 'Sarah was paralyzed before her dream job interview, imagining rejection. When she shifted focus to simply sharing her genuine experiences rather than "winning" the job, her anxiety melted. She performed authentically and got the offer.',
      },
      {
        verseId: '2-47',
        challenge: 'focus-distraction',
        title: 'The Distracted Entrepreneur',
        description: 'Mark kept checking his startup metrics obsessively instead of doing the work. When he committed to 4 hours of focused building daily without checking numbers, his productivity tripled.',
      },
    ],
    challenges: ['stress-anxiety', 'focus-distraction', 'discipline-consistency'],
  },
  {
    id: '2-14',
    chapter: 2,
    verse: 14,
    sanskrit: 'मात्रास्पर्शास्तु कौन्तेय शीतोष्णसुखदुःखदाः ।\nआगमापायिनोऽनित्यास्तांस्तितिक्षस्व भारत ॥',
    english: 'The contact between the senses and their objects gives rise to fleeting perceptions of pleasure and pain. These are temporary, appearing and disappearing like winter and summer. Bear them patiently, O Arjuna.',
    insight: {
      verseId: '2-14',
      explanation: 'All experiences—good and bad—are temporary. Like seasons, they come and go. Understanding this impermanence helps us stay balanced through life\'s ups and downs.',
      takeaway: 'This too shall pass. Both joy and sorrow are visitors, not permanent residents.',
    },
    examples: [
      {
        verseId: '2-14',
        challenge: 'stress-anxiety',
        title: 'The Failed Product Launch',
        description: 'When Priya\'s startup launch flopped, she felt devastated. Remembering that this pain was temporary helped her regroup, learn from feedback, and launch successfully three months later.',
      },
    ],
    challenges: ['stress-anxiety', 'fear-doubt'],
  },
  {
    id: '3-21',
    chapter: 3,
    verse: 21,
    sanskrit: 'यद्यदाचरति श्रेष्ठस्तत्तदेवेतरो जनः ।\nस यत्प्रमाणं कुरुते लोकस्तदनुवर्तते ॥',
    english: 'Whatever actions great persons perform, common people follow. Whatever standards they set by exemplary acts, the whole world pursues.',
    insight: {
      verseId: '3-21',
      explanation: 'Leaders shape culture through their behavior, not their words. People watch what you do, not what you say. Your actions set the standard for those around you.',
      takeaway: 'Be the change you wish to see. Your example speaks louder than any instruction.',
    },
    examples: [
      {
        verseId: '3-21',
        challenge: 'leadership',
        title: 'The Late-Night Email CEO',
        description: 'When David stopped sending late-night emails, his whole team stopped feeling pressure to be "always on." He realized his habits were creating the culture, for better or worse.',
      },
    ],
    challenges: ['leadership', 'relationships'],
  },
  {
    id: '6-5',
    chapter: 6,
    verse: 5,
    sanskrit: 'उद्धरेदात्मनात्मानं नात्मानमवसादयेत् ।\nआत्मैव ह्यात्मनो बन्धुरात्मैव रिपुरात्मनः ॥',
    english: 'Elevate yourself through the power of your mind, and not degrade yourself. The mind can be the friend of the self, and also its enemy.',
    insight: {
      verseId: '6-5',
      explanation: 'You are your own best friend or worst enemy. The same mind that creates anxiety can create peace. Self-discipline and self-compassion work together to lift us up.',
      takeaway: 'Treat yourself as you would treat your best friend—with both encouragement and accountability.',
    },
    examples: [
      {
        verseId: '6-5',
        challenge: 'discipline-consistency',
        title: 'The Morning Routine Breakthrough',
        description: 'Instead of harsh self-criticism when he missed workouts, Alex started speaking to himself with compassion. Paradoxically, this gentleness made him more consistent than punishment ever did.',
      },
    ],
    challenges: ['discipline-consistency', 'purpose-motivation', 'fear-doubt'],
  },
  {
    id: '2-62',
    chapter: 2,
    verse: 62,
    sanskrit: 'ध्यायतो विषयान्पुंसः सङ्गस्तेषूपजायते ।\nसङ्गात्सञ्जायते कामः कामात्क्रोधोऽभिजायते ॥',
    english: 'When a person dwells on sense objects, attachment to them arises. From attachment springs desire, and from desire arises anger.',
    insight: {
      verseId: '2-62',
      explanation: 'This verse maps the psychology of distraction and addiction. First we look, then we want, then we need, then we suffer when we don\'t get it. Awareness of this chain helps us break it early.',
      takeaway: 'Notice what you give attention to. Attention becomes attachment becomes suffering.',
    },
    examples: [
      {
        verseId: '2-62',
        challenge: 'focus-distraction',
        title: 'The Social Media Spiral',
        description: 'Maya noticed how one "quick check" of Instagram led to an hour lost and feeling inadequate. By blocking the first look, she broke the chain before it could form.',
      },
    ],
    challenges: ['focus-distraction', 'discipline-consistency'],
  },
  {
    id: '18-63',
    chapter: 18,
    verse: 63,
    sanskrit: 'इति ते ज्ञानमाख्यातं गुह्याद्गुह्यतरं मया ।\nविमृश्यैतदशेषेण यथेच्छसि तथा कुरु ॥',
    english: 'Thus, I have explained to you this knowledge that is more secret than all secrets. Ponder over it deeply, and then do as you wish.',
    insight: {
      verseId: '18-63',
      explanation: 'After 18 chapters of guidance, Krishna ends with remarkable respect for human autonomy. True wisdom is shared, not imposed. The final choice always remains yours.',
      takeaway: 'Seek wisdom, but make your own choices. Authentic action comes from inner conviction, not external pressure.',
    },
    examples: [
      {
        verseId: '18-63',
        challenge: 'decision-making',
        title: 'The Career Crossroads',
        description: 'After gathering advice from mentors, friends, and family, Rohan realized he had to make his own choice about leaving corporate for his startup. No one else could decide for him.',
      },
    ],
    challenges: ['decision-making', 'purpose-motivation'],
  },
];

export const getVerseById = (id: string): VerseWithInsights | undefined => {
  return verses.find((v) => v.id === id);
};

export const getVersesByChallenge = (challenge: Challenge): VerseWithInsights[] => {
  return verses.filter((v) => v.challenges.includes(challenge));
};

export const getVersesByChapter = (chapter: number): VerseWithInsights[] => {
  return verses.filter((v) => v.chapter === chapter);
};

export const getDailyVerse = (): VerseWithInsights => {
  // Simple daily verse selection based on date
  const today = new Date();
  const dayOfYear = Math.floor(
    (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000
  );
  return verses[dayOfYear % verses.length];
};
