import { useState, useEffect, useCallback } from 'react';
import type { SavedInsight } from 'shared';
import { apiDelete, apiGet, apiSend } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export type { SavedInsight };

interface InsightToSave {
  verse_id: string;
  chapter_number: number;
  verse_number: number;
  title: string;
  description: string;
  challenge_id?: string;
}

export const useSavedInsights = () => {
  const [savedInsights, setSavedInsights] = useState<SavedInsight[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  // The server scopes every query to the session, so no user id is sent.
  const fetchSavedInsights = useCallback(async () => {
    if (!user) {
      setSavedInsights([]);
      return;
    }

    setIsLoading(true);
    try {
      setSavedInsights(await apiGet<SavedInsight[]>('/saved-insights'));
    } catch (error) {
      console.error('Error fetching saved insights:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const saveInsight = async (insight: InsightToSave) => {
    if (!user) {
      toast.error('Please sign in to save insights');
      return false;
    }

    try {
      await apiSend<SavedInsight>('POST', '/saved-insights', {
        ...insight,
        challenge_id: insight.challenge_id ?? null,
      });
      toast.success('Insight saved!');
      await fetchSavedInsights();
      return true;
    } catch (error) {
      console.error('Error saving insight:', error);
      toast.error('Failed to save insight');
      return false;
    }
  };

  const deleteInsight = async (insightId: string) => {
    if (!user) return false;

    try {
      await apiDelete(`/saved-insights/${insightId}`);
      toast.success('Insight removed');
      setSavedInsights((prev) => prev.filter((i) => i.id !== insightId));
      return true;
    } catch (error) {
      console.error('Error deleting insight:', error);
      toast.error('Failed to remove insight');
      return false;
    }
  };

  const isInsightSaved = (verseId: string, title: string) =>
    savedInsights.some((i) => i.verse_id === verseId && i.title === title);

  useEffect(() => {
    fetchSavedInsights();
  }, [fetchSavedInsights]);

  return {
    savedInsights,
    isLoading,
    saveInsight,
    deleteInsight,
    isInsightSaved,
    refetch: fetchSavedInsights,
  };
};
