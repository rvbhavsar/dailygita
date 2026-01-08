import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { VerseWithInsights, Challenge } from '@/types';

interface PersonalizedInsight {
  title: string;
  description: string;
}

export const usePersonalizedInsight = () => {
  const [insight, setInsight] = useState<PersonalizedInsight | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { profile } = useAuth();

  const generateInsight = async (verse: VerseWithInsights, challenge?: Challenge) => {
    setIsLoading(true);
    setError(null);
    setInsight(null);

    try {
      const selectedChallenge = challenge || verse.challenges[0];
      
      const { data, error: functionError } = await supabase.functions.invoke('generate-personalized-insight', {
        body: {
          verse: {
            chapter: verse.chapter,
            verse: verse.verse,
            sanskrit: verse.sanskrit,
            english: verse.english,
          },
          profile: profile ? {
            age: profile.age,
            profession: profile.profession,
            marital_status: profile.marital_status,
          } : null,
          challenge: selectedChallenge,
        },
      });

      if (functionError) {
        throw new Error(functionError.message);
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      if (data?.insight) {
        setInsight(data.insight);
      }
    } catch (err) {
      console.error('Error generating personalized insight:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate insight');
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
