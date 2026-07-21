import { useCallback, useEffect, useState } from 'react';
import type { Favorite } from 'shared';
import { apiDelete, apiGet, apiSend } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

// Callers work in composite verse keys ("2-47"); the API works in
// chapter/verse pairs. Translate at this boundary.
const toKey = (chapter: number, verse: number) => `${chapter}-${verse}`;

const parseKey = (verseId: string): { chapter: number; verse: number } | null => {
  const [chapter, verse] = verseId.split('-').map(Number);
  if (!Number.isFinite(chapter) || !Number.isFinite(verse)) return null;
  return { chapter, verse };
};

export const useFavorites = () => {
  const [favorites, setFavorites] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  const refetch = useCallback(async () => {
    if (!user) {
      setFavorites([]);
      return;
    }

    setIsLoading(true);
    try {
      const rows = await apiGet<Favorite[]>('/favorites');
      setFavorites(rows.map((f) => toKey(f.chapter_number, f.verse_number)));
    } catch (error) {
      console.error('Error fetching favorites:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const isFavorite = useCallback((verseId: string) => favorites.includes(verseId), [favorites]);

  const toggleFavorite = async (verseId: string) => {
    if (!user) {
      toast.error('Please sign in to save verses');
      return;
    }

    const parsed = parseKey(verseId);
    if (!parsed) return;

    const wasFavorite = favorites.includes(verseId);
    // Optimistic: the heart should respond immediately.
    setFavorites((prev) => (wasFavorite ? prev.filter((f) => f !== verseId) : [...prev, verseId]));

    try {
      if (wasFavorite) {
        await apiDelete(`/favorites/${parsed.chapter}/${parsed.verse}`);
      } else {
        await apiSend('POST', '/favorites', {
          chapter_number: parsed.chapter,
          verse_number: parsed.verse,
        });
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      setFavorites((prev) =>
        wasFavorite ? [...prev, verseId] : prev.filter((f) => f !== verseId),
      );
      toast.error('Failed to update saved verses');
    }
  };

  return { favorites, isLoading, isFavorite, toggleFavorite, refetch };
};
