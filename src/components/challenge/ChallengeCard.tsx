import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { ChallengeInfo } from '@/types';
import { getVersesByChallenge } from '@/data/verses';

interface ChallengeCardProps {
  challenge: ChallengeInfo;
}

const ChallengeCard = ({ challenge }: ChallengeCardProps) => {
  const verseCount = getVersesByChallenge(challenge.id).length;

  return (
    <Link to={`/challenges/${challenge.id}`}>
      <Card className="h-full border-border/50 bg-card hover:bg-muted/50 hover:border-primary/30 transition-all cursor-pointer group">
        <CardContent className="p-6 flex flex-col items-center text-center">
          <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">
            {challenge.icon}
          </div>
          <h3 className="font-semibold text-foreground mb-2">
            {challenge.label}
          </h3>
          <p className="text-sm text-muted-foreground mb-3">
            {challenge.description}
          </p>
          <span className="text-xs text-primary font-medium">
            {verseCount} {verseCount === 1 ? 'verse' : 'verses'}
          </span>
        </CardContent>
      </Card>
    </Link>
  );
};

export default ChallengeCard;
