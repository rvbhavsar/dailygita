'use client';

import { useMemo } from 'react';
import { Compass, Loader2 } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import ChallengeCard from '@/components/challenge/ChallengeCard';
import { challenges } from '@/data/challenges';
import { useVerseChallenges } from '@/hooks/useGitaData';
import { curatedVersesMap } from '@/data/curatedVerses';

const Challenges = () => {
  const { data: verseChallenges, isLoading } = useVerseChallenges();

  // Create a map of verse challenges from AI analysis
  const verseChallengesMap = useMemo(() => {
    const map = new Map<string, string[]>();
    verseChallenges?.forEach(vc => {
      map.set(`${vc.chapter_number}-${vc.verse_number}`, vc.challenges);
    });
    return map;
  }, [verseChallenges]);

  // Get verse count for each challenge (from AI analysis + curated)
  const challengeVerseCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    
    challenges.forEach(challenge => {
      let count = 0;
      
      // Count from AI-analyzed verses
      verseChallenges?.forEach(vc => {
        if (vc.challenges.includes(challenge.id)) count++;
      });
      
      // Add curated verses not in AI analysis
      curatedVersesMap.forEach((curated, verseId) => {
        if (curated.challenges.includes(challenge.id as any) && !verseChallengesMap.has(verseId)) {
          count++;
        }
      });
      
      counts[challenge.id] = count;
    });
    
    return counts;
  }, [verseChallenges, verseChallengesMap]);

  return (
    <Layout fullWidth>
      <div className="space-y-8">
        <section className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="mb-2">Life Challenges</h1>
            <p className="text-muted-foreground">
              Ancient wisdom for modern struggles
            </p>
          </div>
          <div className="flex items-center gap-2 text-primary">
            <Compass className="h-6 w-6" />
            <span className="text-sm font-medium">Explore Topics</span>
          </div>
        </section>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-3 text-muted-foreground">Loading challenges...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {challenges.map((challenge) => (
              <ChallengeCard 
                key={challenge.id} 
                challenge={challenge} 
                verseCount={challengeVerseCounts[challenge.id] || 0}
              />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Challenges;
