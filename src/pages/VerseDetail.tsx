import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Shuffle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Layout from '@/components/layout/Layout';
import VerseCard from '@/components/verse/VerseCard';
import { getVerseById, getVersesByChallenge } from '@/data/verses';
import { getChallengeById } from '@/data/challenges';

const VerseDetail = () => {
  const { id } = useParams<{ id: string }>();
  const verse = id ? getVerseById(id) : undefined;

  if (!verse) {
    return (
      <Layout>
        <div className="text-center py-12">
          <h1 className="font-serif text-2xl text-foreground mb-4">
            Verse not found
          </h1>
          <Button asChild variant="outline">
            <Link to="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Link>
          </Button>
        </div>
      </Layout>
    );
  }

  // Get a random related verse from the same challenge
  const primaryChallenge = verse.challenges[0];
  const relatedVerses = getVersesByChallenge(primaryChallenge).filter(
    (v) => v.id !== verse.id
  );
  const randomRelated = relatedVerses[Math.floor(Math.random() * relatedVerses.length)];
  const challenge = getChallengeById(primaryChallenge);

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
          <Link to="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
        </Button>

        {/* Verse Card */}
        <VerseCard verse={verse} showFullContent />

        {/* More Examples */}
        {verse.examples.length > 1 && (
          <div className="mt-8">
            <h3 className="font-semibold text-foreground mb-4">
              More Examples
            </h3>
            <div className="space-y-4">
              {verse.examples.slice(1).map((example, idx) => (
                <div
                  key={idx}
                  className="bg-card border border-border rounded-lg p-5"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">
                      {getChallengeById(example.challenge)?.icon}
                    </span>
                    <span className="text-sm font-medium text-foreground">
                      {example.title}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {example.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Related Verse CTA */}
        {randomRelated && challenge && (
          <div className="mt-8 text-center">
            <Button asChild variant="outline" className="gap-2">
              <Link to={`/verse/${randomRelated.id}`}>
                <Shuffle className="h-4 w-4" />
                Another verse for {challenge.label}
              </Link>
            </Button>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default VerseDetail;
