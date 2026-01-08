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
  } = useUser();
  const saved = isFavorite(verse.id);
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
  return <Card className={cn('overflow-hidden border-border/50 bg-card', className)}>
      <CardContent className="p-6 md:p-8">
        {/* Chapter & Verse */}
        <div className="flex items-center justify-between mb-6">
          <span className="text-sm font-medium text-muted-foreground">
            Chapter {verse.chapter}, Verse {verse.verse}
          </span>
          <div className="flex gap-2">
            {verse.challenges.slice(0, 2).map(challengeId => {
            const challenge = getChallengeById(challengeId);
            return challenge ? <Badge key={challengeId} variant="secondary" className="text-xs">
                  {challenge.icon} {challenge.label}
                </Badge> : null;
          })}
          </div>
        </div>

        {/* Sanskrit */}
        <div className="text-center mb-6">
          <p className="font-sanskrit text-xl md:text-2xl leading-relaxed text-foreground whitespace-pre-line">
            {verse.sanskrit}
          </p>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-4 my-6">
          <div className="flex-1 h-px bg-border" />
          <span className="text-primary text-lg">✦</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* Translation */}
        <p className="font-serif text-lg md:text-xl leading-relaxed text-foreground text-center mb-6">
          "{verse.english}"
        </p>

        {showFullContent && <>
            {/* Explanation */}
            <div className="bg-muted/30 rounded-lg p-5 mb-6">
              <h3 className="font-semibold text-foreground mb-2">What This Means</h3>
              <p className="text-muted-foreground leading-relaxed">
                {verse.insight.explanation}
              </p>
            </div>

            {/* Takeaway */}
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-5 mb-6">
              <h3 className="font-semibold text-primary mb-2">Key Takeaway</h3>
              <p className="text-foreground leading-relaxed italic">
                {verse.insight.takeaway}
              </p>
            </div>

            {/* Real-Life Example */}
            {verse.examples[0] && <div className="mb-6">
                
                <div className="bg-card border border-border rounded-lg p-5">
                  <h4 className="font-medium text-foreground mb-2">
                    {verse.examples[0].title}
                  </h4>
                  <p className="text-muted-foreground leading-relaxed">
                    {verse.examples[0].description}
                  </p>
                </div>
              </div>}
          </>}

        {/* Actions */}
        <div className="flex items-center justify-center gap-3 pt-4 border-t border-border/50">
          <Button variant="ghost" size="sm" onClick={() => toggleFavorite(verse.id)} className={cn('gap-2', saved && 'text-primary')}>
            <Heart className={cn('h-4 w-4', saved && 'fill-current')} />
            {saved ? 'Saved' : 'Save'}
          </Button>
          
          <Button variant="ghost" size="sm" onClick={handleShare} className="gap-2">
            <Share2 className="h-4 w-4" />
            Share
          </Button>

          {!showFullContent && <Button variant="ghost" size="sm" asChild className="gap-2">
              <Link to={`/verse/${verse.id}`}>
                <BookOpen className="h-4 w-4" />
                Read More
              </Link>
            </Button>}
        </div>
      </CardContent>
    </Card>;
};
export default VerseCard;