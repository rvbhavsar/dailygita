import { Heart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Layout from '@/components/layout/Layout';
import VerseListItem from '@/components/verse/VerseListItem';
import { useUser } from '@/contexts/UserContext';
import { getVerseById } from '@/data/verses';

const Favorites = () => {
  const { favorites } = useUser();
  const savedVerses = favorites
    .map((id) => getVerseById(id))
    .filter(Boolean);

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-serif text-2xl font-semibold text-foreground">
              Saved Verses
            </h1>
            <p className="text-sm text-muted-foreground">
              Your personal collection of wisdom
            </p>
          </div>
          <Heart className="h-6 w-6 text-primary" />
        </div>

        {savedVerses.length > 0 ? (
          <div className="space-y-3">
            {savedVerses.map((verse) => (
              <VerseListItem key={verse!.id} verse={verse!} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <Heart className="h-16 w-16 mx-auto mb-4 text-muted-foreground/30" />
            <h2 className="font-serif text-xl text-foreground mb-2">
              No saved verses yet
            </h2>
            <p className="text-muted-foreground mb-6">
              Save verses that resonate with you for quick access later
            </p>
            <Button asChild variant="outline">
              <Link to="/browse">Browse Verses</Link>
            </Button>
          </div>
        )}

        {savedVerses.length > 0 && (
          <p className="text-center text-sm text-muted-foreground mt-8">
            {savedVerses.length} saved {savedVerses.length === 1 ? 'verse' : 'verses'}
          </p>
        )}
      </div>
    </Layout>
  );
};

export default Favorites;
