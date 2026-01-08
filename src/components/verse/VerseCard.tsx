import { Link } from 'react-router-dom';
import { Heart, Share2, BookOpen } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { VerseWithInsights } from '@/types';
import { useUser } from '@/contexts/UserContext';
import { getChallengeById } from '@/data/challenges';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import PersonalizedInsight from './PersonalizedInsight';

interface VerseCardProps {
  verse: VerseWithInsights;
  showFullContent?: boolean;
  className?: string;
}

const VerseCard = ({ verse, showFullContent = false, className }: VerseCardProps) => {
  const { toggleFavorite, isFavorite } = useUser();
  const saved = isFavorite(verse.id);

  const handleShare = async () => {
    const shareText = `${verse.english}\n\n— Bhagavad Gita ${verse.chapter}.${verse.verse}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Bhagavad Gita ${verse.chapter}.${verse.verse}`,
          text: shareText,
        });
      } catch {
        // User cancelled or error
      }
    } else {
      await navigator.clipboard.writeText(shareText);
      toast.success('Verse copied to clipboard');
    }
  };

  return (
    <Card className={cn('overflow-hidden border-border/50 bg-card shadow-md card-hover', className)}>
      <CardContent className="p-6 md:p-10">
        {/* Chapter & Verse Header */}
        <div className="flex items-center justify-between mb-8">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Chapter {verse.chapter} • Verse {verse.verse}
          </span>
          <div className="flex gap-2">
            {verse.challenges.slice(0, 2).map((challengeId) => {
              const challenge = getChallengeById(challengeId);
              return challenge ? (
                <Badge key={challengeId} variant="secondary" className="text-xs font-medium">
                  {challenge.icon} {challenge.label}
                </Badge>
              ) : null;
            })}
          </div>
        </div>

        {/* Sanskrit */}
        <div className="text-center mb-8">
          <p className="font-sanskrit text-xl md:text-2xl lg:text-3xl leading-relaxed text-foreground whitespace-pre-line">
            {verse.sanskrit}
          </p>
        </div>

        {/* Elegant Divider */}
        <div className="flex items-center gap-6 my-8">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
          <span className="text-primary text-xl">✦</span>
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
        </div>

        {/* Translation */}
        <p className="text-xl md:text-2xl leading-relaxed text-foreground text-center mb-8 italic">
          "{verse.english}"
        </p>

        {showFullContent && (
          <div className="space-y-6 mt-10">
            {/* Explanation with Takeaway */}
            <div className="bg-secondary/30 rounded-2xl p-6 md:p-8">
              <h4 className="text-foreground mb-3">What This Means</h4>
              <p className="text-muted-foreground leading-relaxed mb-4">
                {verse.insight.explanation}
              </p>
              <div className="border-t border-border/50 pt-4 mt-4">
                <p className="text-primary font-medium italic leading-relaxed">
                  ✦ {verse.insight.takeaway}
                </p>
              </div>
            </div>

            {/* AI-Powered Personalized Example */}
            <div>
              <h4 className="text-foreground mb-4">Personalized for You</h4>
              <PersonalizedInsight 
                verse={verse} 
                selectedChallenge={getChallengeById(verse.challenges[0])} 
              />
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-center gap-2 pt-8 mt-8 border-t border-border/50">
          <Button
            variant="ghost"
            size="lg"
            onClick={() => toggleFavorite(verse.id)}
            className={cn(
              'gap-2 rounded-full px-6',
              saved && 'text-primary bg-primary/10'
            )}
          >
            <Heart className={cn('h-5 w-5', saved && 'fill-current')} />
            {saved ? 'Saved' : 'Save'}
          </Button>
          
          <Button variant="ghost" size="lg" onClick={handleShare} className="gap-2 rounded-full px-6">
            <Share2 className="h-5 w-5" />
            Share
          </Button>

          {!showFullContent && (
            <Button variant="ghost" size="lg" asChild className="gap-2 rounded-full px-6">
              <Link to={`/verse/${verse.id}`}>
                <BookOpen className="h-5 w-5" />
                Read More
              </Link>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default VerseCard;
