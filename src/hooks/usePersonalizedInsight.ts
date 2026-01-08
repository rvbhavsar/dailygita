import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
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
      const { data, error: fnError } = await supabase.functions.invoke('generate-personalized-insight', {
        body: {
          verse: {
            chapter: verse.chapter,
            verse: verse.verse,
            sanskrit: verse.sanskrit,
            english: verse.english,
            insight: verse.insight,
          },
          profile: profile ? {
            age: profile.age,
            profession: profile.profession,
            marital_status: profile.marital_status,
          } : null,
          challenge: challenge ? {
            label: challenge.label,
            description: challenge.description,
          } : null,
        },
      });

      if (fnError) {
        throw fnError;
      }

      if (data?.error) {
        if (data.error.includes('Rate limit')) {
          toast.error('Too many requests. Please wait a moment and try again.');
        } else if (data.error.includes('credits')) {
          toast.error('AI service temporarily unavailable. Please try again later.');
        }
        throw new Error(data.error);
      }

      if (data?.insight) {
        setInsight(data.insight);
      } else {
        throw new Error('No insight generated');
      }
    } catch (err) {
      console.error('Error generating insight:', err);
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
