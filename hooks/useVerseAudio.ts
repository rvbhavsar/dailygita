'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { AudioResponse } from '@/lib/types';
import { ApiError, apiGet, apiSend } from '@/lib/api';
import { toast } from 'sonner';

export type Track = 'recitation' | 'narration';

interface NarrationText {
  english?: string | null;
  explanation?: string | null;
  takeaway?: string | null;
}

/**
 * Two audio tracks per verse:
 * - recitation: authentic Sanskrit chanting, always available, plays instantly
 * - narration: English, generated on demand by Deepgram then cached server-side
 */
export function useVerseAudio(chapter: number, verse: number, text: NarrationText) {
  const [urls, setUrls] = useState<AudioResponse>({ recitation: null, narration: null });
  const [playing, setPlaying] = useState<Track | null>(null);
  const [loading, setLoading] = useState<Track | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    let cancelled = false;

    apiGet<AudioResponse>(`/verses/${chapter}/${verse}/audio`)
      .then((data) => {
        if (!cancelled) setUrls(data);
      })
      .catch(() => {
        if (!cancelled) setUrls({ recitation: null, narration: null });
      });

    return () => {
      cancelled = true;
    };
  }, [chapter, verse]);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    setPlaying(null);
  }, []);

  // Never leave audio playing after the card unmounts.
  useEffect(() => stop, [stop]);

  const play = useCallback(
    async (track: Track, url: string) => {
      stop();
      const audio = new Audio(url);
      audio.onended = () => {
        audioRef.current = null;
        setPlaying(null);
      };
      audio.onerror = () => {
        audioRef.current = null;
        setPlaying(null);
        toast.error('Could not play this audio');
      };

      audioRef.current = audio;
      setPlaying(track);
      try {
        await audio.play();
      } catch {
        audioRef.current = null;
        setPlaying(null);
      }
    },
    [stop],
  );

  const toggle = useCallback(
    async (track: Track) => {
      if (playing === track) {
        stop();
        return;
      }

      const known = urls[track];
      if (known) {
        await play(track, known);
        return;
      }

      // Only narration is generated on demand; recitation is always seeded.
      if (track !== 'narration') return;

      setLoading('narration');
      try {
        const { url } = await apiSend<{ url: string }>(
          'POST',
          `/verses/${chapter}/${verse}/narration`,
          text,
        );
        setUrls((prev) => ({ ...prev, narration: url }));
        await play('narration', url);
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          toast.error('Please sign in to generate narration');
        } else {
          toast.error(error instanceof Error ? error.message : 'Could not generate audio');
        }
      } finally {
        setLoading(null);
      }
    },
    [chapter, verse, playing, urls, text, play, stop],
  );

  return {
    hasRecitation: Boolean(urls.recitation),
    playing,
    loading,
    toggle,
  };
}
