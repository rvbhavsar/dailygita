import { Link } from 'react-router-dom';
import { ChevronRight, Heart } from 'lucide-react';
import { VerseWithInsights } from '@/types';
import { useUser } from '@/contexts/UserContext';
import { cn } from '@/lib/utils';

interface VerseListItemProps {
  verse: VerseWithInsights;
}

const VerseListItem = ({ verse }: VerseListItemProps) => {
  const { isFavorite } = useUser();
  const saved = isFavorite(verse.id);

  return (
    <Link
      to={`/verse/${verse.id}`}
      className="group flex items-center gap-4 p-4 rounded-lg border border-border/50 bg-card hover:bg-muted/50 transition-colors"
    >
      <div className="flex-shrink-0 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-sm">
        {verse.chapter}.{verse.verse}
      </div>
      
      <div className="flex-1 min-w-0">
        <p className="font-sanskrit text-sm text-muted-foreground truncate mb-1">
          {verse.sanskrit.split('\n')[0]}
        </p>
        <p className="text-sm text-foreground line-clamp-2">
          {verse.english}
        </p>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        {saved && (
          <Heart className="h-4 w-4 text-primary fill-primary" />
        )}
        <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
      </div>
    </Link>
  );
};

export default VerseListItem;
