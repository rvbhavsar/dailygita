import { useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Layout from '@/components/layout/Layout';
import VerseListItem from '@/components/verse/VerseListItem';
import { getVersesByChallenge } from '@/data/verses';
import { getChallengeById } from '@/data/challenges';

const ChallengeDetail = () => {
  const { id } = useParams<{ id: string }>();
  const challenge = id ? getChallengeById(id) : undefined;
  const verses = id ? getVersesByChallenge(id as any) : [];

  if (!challenge) {
    return (
      <Layout>
        <div className="text-center py-12">
          <h1 className="font-serif text-2xl text-foreground mb-4">
            Challenge not found
          </h1>
          <Button asChild variant="outline">
            <Link to="/challenges">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Challenges
            </Link>
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        {/* Back Button */}
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="mb-6 -ml-2"
        >
          <Link to="/challenges">
            <ArrowLeft className="mr-2 h-4 w-4" />
            All Challenges
          </Link>
        </Button>

        {/* Header */}
        <div className="text-center mb-8">
          <span className="text-5xl mb-4 block">{challenge.icon}</span>
          <h1 className="font-serif text-2xl font-semibold text-foreground mb-2">
            {challenge.label}
          </h1>
          <p className="text-muted-foreground">
            {challenge.description}
          </p>
        </div>

        {/* Verses */}
        <div className="space-y-3">
          {verses.length > 0 ? (
            verses.map((verse) => (
              <VerseListItem key={verse.id} verse={verse} />
            ))
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <p>No verses mapped to this challenge yet</p>
            </div>
          )}
        </div>

        <p className="text-center text-sm text-muted-foreground mt-8">
          {verses.length} {verses.length === 1 ? 'verse' : 'verses'} for this challenge
        </p>
      </div>
    </Layout>
  );
};

export default ChallengeDetail;
