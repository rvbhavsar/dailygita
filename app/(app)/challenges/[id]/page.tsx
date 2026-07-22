'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Layout from '@/components/layout/Layout';
import VerseListItem from '@/components/verse/VerseListItem';
import { useAllVerses, useTranslations, useVerseChallenges } from '@/hooks/useGitaData';
import { getChallengeById } from '@/data/challenges';
import { curatedVersesMap } from '@/data/curatedVerses';
import { VerseWithInsights } from '@/types';

const ChallengeDetail = () => {
  const { id } = useParams<{ id: string }>();
  const challenge = id ? getChallengeById(id) : undefined;

  const { data: verseChallenges, isLoading: vcLoading } = useVerseChallenges();
  const { data: verses, isLoading: vLoading } = useAllVerses();
  const { data: translations, isLoading: tLoading } = useTranslations();
  const isLoading = vcLoading || vLoading || tLoading;

  // verse_id -> English translation, preferring Swami Sivananda (matches Browse).
  const englishByVerseId = useMemo(() => {
    const map = new Map<number, string>();
    if (!translations) return map;
    const byVerse = new Map<number, typeof translations>();
    for (const t of translations) {
      const list = byVerse.get(t.verse_id) ?? [];
      list.push(t);
      byVerse.set(t.verse_id, list);
    }
    for (const [verseId, list] of byVerse) {
      const preferred = list.find((t) => t.author_name === 'Swami Sivananda') ?? list[0];
      if (preferred) map.set(verseId, preferred.description);
    }
    return map;
  }, [translations]);

  // The verses tagged to this challenge — the AI analysis plus any curated
  // verse not covered by it. This mirrors the count shown on /challenges, so
  // the list and the count can no longer disagree.
  const matched: VerseWithInsights[] = useMemo(() => {
    if (!id || !verses) return [];

    // Mirror the count logic on /challenges exactly, so the list length and the
    // overview count can never disagree: AI-tagged verses for this challenge,
    // plus curated verses for it that have no AI row at all.
    const analyzed = new Set(verseChallenges?.map((vc) => `${vc.chapter_number}-${vc.verse_number}`));
    const refs = new Set<string>();
    verseChallenges?.forEach((vc) => {
      if (vc.challenges.includes(id)) refs.add(`${vc.chapter_number}-${vc.verse_number}`);
    });
    curatedVersesMap.forEach((curated, verseId) => {
      if (curated.challenges.includes(id as never) && !analyzed.has(verseId)) refs.add(verseId);
    });

    return verses
      .filter((v) => refs.has(`${v.chapter_number}-${v.verse_number}`))
      .sort((a, b) => a.chapter_number - b.chapter_number || a.verse_number - b.verse_number)
      .map((v) => {
        const ref = `${v.chapter_number}-${v.verse_number}`;
        const curated = curatedVersesMap.get(ref);
        return {
          id: ref,
          chapter: v.chapter_number,
          verse: v.verse_number,
          sanskrit: v.text,
          english: curated?.english ?? englishByVerseId.get(v.verse_id) ?? '',
          insight: curated?.insight,
          examples: curated?.examples ?? [],
          challenges: curated?.challenges ?? [],
        } as VerseWithInsights;
      });
  }, [id, verses, verseChallenges, englishByVerseId]);

  if (!challenge) {
    return (
      <Layout>
        <div className="py-12 text-center">
          <h1 className="mb-4 text-2xl font-bold text-foreground">Challenge not found</h1>
          <Button asChild variant="outline">
            <Link href="/challenges">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Challenges
            </Link>
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mx-auto max-w-2xl">
        <Button asChild variant="ghost" size="sm" className="mb-6 -ml-2">
          <Link href="/challenges">
            <ArrowLeft className="mr-2 h-4 w-4" />
            All Challenges
          </Link>
        </Button>

        <div className="mb-8 text-center">
          <span className="mb-4 block text-5xl">{challenge.icon}</span>
          <h1 className="mb-2 text-2xl font-bold text-foreground">{challenge.label}</h1>
          <p className="text-muted-foreground">{challenge.description}</p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {matched.length > 0 ? (
                matched.map((verse) => <VerseListItem key={verse.id} verse={verse} />)
              ) : (
                <div className="py-12 text-center text-muted-foreground">
                  <p>No verses mapped to this challenge yet</p>
                </div>
              )}
            </div>
            {matched.length > 0 && (
              <p className="mt-8 text-center text-sm text-muted-foreground">
                {matched.length} {matched.length === 1 ? 'verse' : 'verses'} for this challenge
              </p>
            )}
          </>
        )}
      </div>
    </Layout>
  );
};

export default ChallengeDetail;
