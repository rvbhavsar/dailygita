import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface SavedInsight {
  id: string;
  user_id: string;
  verse_id: string;
  chapter_number: number;
  verse_number: number;
  title: string;
  description: string;
  challenge_id: string | null;
  created_at: string;
}

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

  const fetchSavedInsights = async () => {
    if (!user) {
      setSavedInsights([]);
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('saved_insights')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSavedInsights(data || []);
    } catch (error) {
      console.error('Error fetching saved insights:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveInsight = async (insight: InsightToSave) => {
    if (!user) {
      toast.error('Please sign in to save insights');
      return false;
    }

    try {
      const { error } = await supabase
        .from('saved_insights')
        .insert({
          user_id: user.id,
          verse_id: insight.verse_id,
          chapter_number: insight.chapter_number,
          verse_number: insight.verse_number,
          title: insight.title,
          description: insight.description,
          challenge_id: insight.challenge_id || null,
        });

      if (error) throw error;
      
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
      const { error } = await supabase
        .from('saved_insights')
        .delete()
        .eq('id', insightId)
        .eq('user_id', user.id);

      if (error) throw error;
      
      toast.success('Insight removed');
      setSavedInsights(prev => prev.filter(i => i.id !== insightId));
      return true;
    } catch (error) {
      console.error('Error deleting insight:', error);
      toast.error('Failed to remove insight');
      return false;
    }
  };

  const isInsightSaved = (verseId: string, title: string) => {
    return savedInsights.some(i => i.verse_id === verseId && i.title === title);
  };

  useEffect(() => {
    fetchSavedInsights();
  }, [user]);

  return {
    savedInsights,
    isLoading,
    saveInsight,
    deleteInsight,
    isInsightSaved,
    refetch: fetchSavedInsights,
  };
};
