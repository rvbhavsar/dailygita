import { useState } from 'react';
import { ApiError, apiSend } from '@/lib/api';
import { VerseWithInsights, ChallengeInfo } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface Insight {
  title: string;
  description: string;
}

export const usePersonalizedInsight = () => {
  const [insight, setInsight] = useState<Insight | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { profile } = useAuth();

  const generateInsight = async (verse: VerseWithInsights, challenge?: ChallengeInfo) => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await apiSend<{ insight?: Insight }>('POST', '/insights/personalized', {
        verse: {
          chapter: verse.chapter,
          verse: verse.verse,
          sanskrit: verse.sanskrit,
          english: verse.english,
          insight: verse.insight,
        },
        profile: profile
          ? {
              age: profile.age,
              profession: profile.profession,
              marital_status: profile.marital_status,
            }
          : null,
        challenge: challenge
          ? {
              label: challenge.label,
              description: challenge.description,
            }
          : null,
      });

      if (!data?.insight) throw new Error('No insight generated');
      setInsight(data.insight);
    } catch (err) {
      console.error('Error generating insight:', err);
      if (err instanceof ApiError && err.status === 429) {
        toast.error('Too many requests. Please wait a moment and try again.');
      }
      setError(err instanceof Error ? err.message : 'Failed to generate personalized example');
    } finally {
      setIsLoading(false);
    }
  };

  const clearInsight = () => {
    setInsight(null);
    setError(null);
  };

  return {
    insight,
    isLoading,
    error,
    generateInsight,
    clearInsight,
  };
};
