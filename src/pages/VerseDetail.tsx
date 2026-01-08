import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Shuffle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Layout from '@/components/layout/Layout';
import VerseCard from '@/components/verse/VerseCard';
import { curatedVersesMap, getCuratedVersesByChallenge } from '@/data/curatedVerses';
import { getChallengeById } from '@/data/challenges';
import { useVerse, useVerseTranslation } from '@/hooks/useGitaData';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const VerseDetail = () => {
  const { id } = useParams<{ id: string }>();
  
  // Parse chapter and verse number from id (format: "1-1")
  const [chapterNum, verseNum] = id?.split('-').map(Number) || [0, 0];
  
  // Check if it's a curated verse
  const curatedVerse = id ? curatedVersesMap.get(id) : undefined;
  
  // Fetch from API for non-curated verses
  const { data: apiVerse, isLoading: verseLoading } = useVerse(chapterNum, verseNum);
  const { data: translation, isLoading: translationLoading } = useVerseTranslation(apiVerse?.verse_id);
  
  const isLoading = !curatedVerse && (verseLoading || (apiVerse && translationLoading));

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-muted-foreground">Loading verse...</span>
        </div>
      </Layout>
    );
  }

  // If we have a curated verse, use it
  if (curatedVerse) {
    const primaryChallenge = curatedVerse.challenges[0];
    const relatedVerses = getCuratedVersesByChallenge(primaryChallenge).filter(
      (v) => v.id !== curatedVerse.id
    );
    const randomRelated = relatedVerses[Math.floor(Math.random() * relatedVerses.length)];
    const challenge = getChallengeById(primaryChallenge);

    return (
      <Layout>
        <div className="max-w-2xl mx-auto">
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="mb-6 -ml-2"
          >
            <Link to="/browse">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Link>
          </Button>

          <VerseCard verse={curatedVerse} showFullContent />

          {curatedVerse.examples.length > 1 && (
            <div className="mt-8">
              <h3 className="font-semibold text-foreground mb-4">
                More Examples
              </h3>
              <div className="space-y-4">
                {curatedVerse.examples.slice(1).map((example, idx) => (
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
  }

  // For non-curated verses, show API data
  if (!apiVerse) {
    return (
      <Layout>
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-foreground mb-4">
            Verse not found
          </h1>
          <Button asChild variant="outline">
            <Link to="/browse">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Browse
            </Link>
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="mb-6 -ml-2"
        >
          <Link to="/browse">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
        </Button>

        <Card className="overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <Badge variant="outline" className="text-sm">
                Chapter {apiVerse.chapter_number}, Verse {apiVerse.verse_number}
              </Badge>
            </div>

            {/* Sanskrit Text */}
            <div className="font-sanskrit text-xl text-foreground leading-relaxed mb-6 text-center">
              {apiVerse.text.split('\n').map((line, idx) => (
                <p key={idx}>{line}</p>
              ))}
            </div>


            {/* Translation */}
            {translation && (
              <div className="border-t border-border pt-6">
                <p className="text-foreground leading-relaxed">
                  {translation}
                </p>
              </div>
            )}

            {/* No curated content message */}
            <div className="mt-6 p-4 bg-muted/50 rounded-lg text-center">
              <p className="text-sm text-muted-foreground">
                This verse doesn't have curated insights yet. Check back soon!
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default VerseDetail;
