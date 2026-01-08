import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface DailyVerseData {
  verse: {
    verse_id: number;
    chapter_number: number;
    verse_number: number;
    text: string;
    word_meanings: string | null;
  };
  translation: string;
  challenges: string[];
  aiSummary: string;
  isFromHistory: boolean;
}

export const useDailyVerse = () => {
  const { user, profile } = useAuth();
  const [dailyVerse, setDailyVerse] = useState<DailyVerseData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDailyVerse = useCallback(async (shuffle = false) => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const challenges = profile?.selected_challenges || [];
      
      const { data, error: fnError } = await supabase.functions.invoke("get-daily-verse", {
        body: {
          userId: user.id,
          challenges,
          shuffle,
        },
      });

      if (fnError) {
        throw fnError;
      }

      if (data.error) {
        throw new Error(data.error);
      }

      setDailyVerse(data);
    } catch (err) {
      console.error("Error fetching daily verse:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch daily verse");
    } finally {
      setIsLoading(false);
    }
  }, [user, profile?.selected_challenges]);

  useEffect(() => {
    fetchDailyVerse(false);
  }, [fetchDailyVerse]);

  const shuffleVerse = useCallback(() => {
    fetchDailyVerse(true);
  }, [fetchDailyVerse]);

  return {
    dailyVerse,
    isLoading,
    error,
    shuffleVerse,
    refetch: () => fetchDailyVerse(false),
  };
};
