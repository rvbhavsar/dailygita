'use client';


import Link from 'next/link';
import { Heart, Share2, BookOpen, Volume2, Loader2, Music } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { VerseWithInsights } from '@/types';
import { useFavorites } from '@/hooks/useFavorites';
import { getChallengeById } from '@/data/challenges';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useVerseAudio } from '@/hooks/useVerseAudio';
import PersonalizedInsight from './PersonalizedInsight';

interface VerseCardProps {
  verse: VerseWithInsights;
  showFullContent?: boolean;
  className?: string;
}

const VerseCard = ({
  verse,
  showFullContent = false,
  className
}: VerseCardProps) => {
  const {
    toggleFavorite,
    isFavorite
  } = useFavorites();
  const saved = isFavorite(verse.id);

  const { hasRecitation, playing, loading, toggle } = useVerseAudio(verse.chapter, verse.verse, {
    english: verse.english,
    explanation: verse.insight?.explanation,
    takeaway: verse.insight?.takeaway,
  });

  const handleShare = async () => {
    const shareText = `${verse.english}\n\n— Bhagavad Gita ${verse.chapter}.${verse.verse}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Bhagavad Gita ${verse.chapter}.${verse.verse}`,
          text: shareText
        });
      } catch {
        // User cancelled or error
      }
    } else {
      await navigator.clipboard.writeText(shareText);
      toast.success('Verse copied to clipboard');
    }
  };
  return <Card className={cn('overflow-hidden border-border/50 bg-card shadow-md card-hover', className)}>
      <CardContent className="p-4 sm:p-6 md:p-10">
        {/* Chapter & Verse Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4 mb-6 sm:mb-8">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Chapter {verse.chapter} • Verse {verse.verse}
          </span>
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            {verse.challenges.slice(0, 2).map(challengeId => {
            const challenge = getChallengeById(challengeId);
            return challenge ? <Badge key={challengeId} variant="secondary" className="text-xs font-medium">
                  {challenge.icon} {challenge.label}
                </Badge> : null;
          })}
          </div>
        </div>

        {/* Sanskrit */}
        <div className="text-center mb-6 sm:mb-8">
          <p className="sanskrit-verse text-xl sm:text-2xl md:text-3xl text-gray-800 dark:text-white">
            {verse.sanskrit}
          </p>
        </div>

        {/* Elegant Divider */}
        <div className="flex items-center gap-4 sm:gap-6 my-6 sm:my-8">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
          <span className="text-primary text-lg sm:text-xl">✦</span>
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
        </div>

        {/* Translation */}
        <p className="text-lg sm:text-xl leading-relaxed text-foreground text-center mb-6 sm:mb-8 italic">
          "{verse.english}"
        </p>

        {showFullContent && <div className="space-y-4 sm:space-y-6 mt-8 sm:mt-10">
            {/* Explanation with Takeaway */}
            <div className="bg-secondary/30 rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8">
              <h4 className="text-foreground mb-2 sm:mb-3 text-base sm:text-lg">What This Means</h4>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-3 sm:mb-4">
                {verse.insight.explanation}
              </p>
              <div className="border-t border-border/50 pt-3 sm:pt-4 mt-3 sm:mt-4">
                <p className="text-sm sm:text-base text-primary font-medium italic leading-relaxed">
                  ✦ {verse.insight.takeaway}
                </p>
              </div>
            </div>

            {/* AI-Powered Personalized Example */}
            <div>
              <h4 className="text-foreground mb-3 sm:mb-4 text-base sm:text-lg">Personalized for You</h4>
              <PersonalizedInsight verse={verse} selectedChallenge={getChallengeById(verse.challenges[0])} />
            </div>
          </div>}

        <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 pt-6 sm:pt-8 mt-6 sm:mt-8 border-t border-border/50">
          {hasRecitation && (
            <Button
              variant="ghost"
              size="lg"
              onClick={() => toggle('recitation')}
              className={cn('gap-1.5 sm:gap-2 rounded-full px-3 sm:px-6 h-10 sm:h-11', playing === 'recitation' && 'text-primary bg-primary/10')}
              title="Hear the Sanskrit chanted"
            >
              <Music className={cn('h-4 w-4 sm:h-5 sm:w-5', playing === 'recitation' && 'fill-current')} />
              <span className="hidden xs:inline text-sm sm:text-base">{playing === 'recitation' ? 'Stop' : 'Chant'}</span>
            </Button>
          )}

          <Button
            variant="ghost"
            size="lg"
            onClick={() => toggle('narration')}
            disabled={loading === 'narration'}
            className={cn('gap-1.5 sm:gap-2 rounded-full px-3 sm:px-6 h-10 sm:h-11', playing === 'narration' && 'text-primary bg-primary/10')}
            title="Hear the English read aloud"
          >
            {loading === 'narration' ? (
              <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
            ) : (
              <Volume2 className={cn('h-4 w-4 sm:h-5 sm:w-5', playing === 'narration' && 'fill-current')} />
            )}
            <span className="hidden xs:inline text-sm sm:text-base">
              {loading === 'narration' ? 'Loading...' : playing === 'narration' ? 'Stop' : 'Listen'}
            </span>
          </Button>

          <Button 
            variant="ghost" 
            size="lg" 
            onClick={() => toggleFavorite(verse.id)} 
            className={cn('gap-1.5 sm:gap-2 rounded-full px-3 sm:px-6 h-10 sm:h-11', saved && 'text-primary bg-primary/10')}
          >
            <Heart className={cn('h-4 w-4 sm:h-5 sm:w-5', saved && 'fill-current')} />
            <span className="hidden xs:inline text-sm sm:text-base">{saved ? 'Saved' : 'Save'}</span>
          </Button>
          
          <Button 
            variant="ghost" 
            size="lg" 
            onClick={handleShare} 
            className="gap-1.5 sm:gap-2 rounded-full px-3 sm:px-6 h-10 sm:h-11"
          >
            <Share2 className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="hidden xs:inline text-sm sm:text-base">Share</span>
          </Button>

          {!showFullContent && <Button variant="ghost" size="lg" asChild className="gap-1.5 sm:gap-2 rounded-full px-3 sm:px-6 h-10 sm:h-11">
              <Link href={`/verse/${verse.id}`}>
                <BookOpen className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="hidden xs:inline text-sm sm:text-base">Read More</span>
              </Link>
            </Button>}
        </div>
      </CardContent>
    </Card>;
};
export default VerseCard;