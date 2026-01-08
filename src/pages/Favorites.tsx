import { Heart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Layout from '@/components/layout/Layout';
import VerseListItem from '@/components/verse/VerseListItem';
import { useUser } from '@/contexts/UserContext';
import { curatedVersesMap } from '@/data/curatedVerses';

const Favorites = () => {
  const { favorites } = useUser();
  const savedVerses = favorites
    .map((id) => curatedVersesMap.get(id))
    .filter(Boolean);

  return (
    <Layout>
      <div className="space-y-8">
        <section className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="font-serif mb-2">Saved Verses</h1>
            <p className="text-muted-foreground">
              Your personal collection of wisdom
            </p>
          </div>
          <div className="flex items-center gap-2 text-primary">
            <Heart className="h-6 w-6" />
            <span className="text-sm font-medium">{savedVerses.length} saved</span>
          </div>
        </section>

        {savedVerses.length > 0 ? (
          <div className="space-y-4">
            {savedVerses.map((verse) => (
              <VerseListItem key={verse!.id} verse={verse!} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-secondary/50 mb-6">
              <Heart className="h-10 w-10 text-muted-foreground/50" />
            </div>
            <h3 className="font-serif text-foreground mb-2">
              No saved verses yet
            </h3>
            <p className="text-muted-foreground mb-8 max-w-sm mx-auto">
              Save verses that resonate with you for quick access later
            </p>
            <Button asChild variant="default" className="rounded-full px-8">
              <Link to="/browse">Browse Verses</Link>
            </Button>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Favorites;
