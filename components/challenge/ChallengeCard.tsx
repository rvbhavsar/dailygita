import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { ChallengeInfo } from '@/types';

interface ChallengeCardProps {
  challenge: ChallengeInfo;
  verseCount?: number;
}

const ChallengeCard = ({ challenge, verseCount = 0 }: ChallengeCardProps) => {
  return (
    <Link href={`/browse?challenge=${challenge.id}`}>
      <Card className="h-full border-border/50 bg-card card-hover cursor-pointer group">
        <CardContent className="p-6 flex flex-col items-center text-center">
          <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">
            {challenge.icon}
          </div>
          <h4 className="text-foreground mb-2">
            {challenge.label}
          </h4>
          <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
            {challenge.description}
          </p>
          <span className="text-xs font-semibold text-primary uppercase tracking-wider">
            {verseCount} {verseCount === 1 ? 'verse' : 'verses'}
          </span>
        </CardContent>
      </Card>
    </Link>
  );
};

export default ChallengeCard;
