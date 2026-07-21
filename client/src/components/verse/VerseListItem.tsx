import { Link } from 'react-router-dom';
import { ChevronRight, Heart } from 'lucide-react';
import { VerseWithInsights } from '@/types';
import { useFavorites } from '@/hooks/useFavorites';
import { cn } from '@/lib/utils';

interface VerseListItemProps {
  verse: VerseWithInsights;
}

const VerseListItem = ({ verse }: VerseListItemProps) => {
  const { isFavorite } = useFavorites();
  const saved = isFavorite(verse.id);

  return (
    <Link
      to={`/verse/${verse.id}`}
      className="group flex items-center gap-4 p-5 rounded-2xl border border-border/50 bg-card card-hover"
    >
      <div className="flex-shrink-0 flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold">
        {verse.chapter}.{verse.verse}
      </div>
      
      <div className="flex-1 min-w-0">
        <p className="font-sanskrit text-sm text-muted-foreground truncate mb-1">
          {verse.sanskrit.split('\n')[0]}
        </p>
        <p className="text-foreground line-clamp-2 leading-relaxed">
          {verse.english}
        </p>
      </div>

      <div className="flex items-center gap-3 flex-shrink-0">
        {saved && (
          <Heart className="h-4 w-4 text-primary fill-primary" />
        )}
        <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
      </div>
    </Link>
  );
};

export default VerseListItem;
