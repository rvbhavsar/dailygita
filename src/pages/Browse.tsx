import { useState } from 'react';
import { BookOpen, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Layout from '@/components/layout/Layout';
import VerseListItem from '@/components/verse/VerseListItem';
import { verses, getVersesByChapter } from '@/data/verses';
import { challenges } from '@/data/challenges';
import { cn } from '@/lib/utils';

const Browse = () => {
  const [selectedChapter, setSelectedChapter] = useState<number | null>(null);
  const [selectedChallenge, setSelectedChallenge] = useState<string | null>(null);

  // Get unique chapters from verses
  const availableChapters = [...new Set(verses.map((v) => v.chapter))].sort(
    (a, b) => a - b
  );

  const filteredVerses = verses.filter((verse) => {
    if (selectedChapter && verse.chapter !== selectedChapter) return false;
    if (selectedChallenge && !verse.challenges.includes(selectedChallenge as any))
      return false;
    return true;
  });

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-serif text-2xl font-semibold text-foreground">
              Browse Verses
            </h1>
            <p className="text-sm text-muted-foreground">
              Explore the wisdom of the Gita
            </p>
          </div>
          <BookOpen className="h-6 w-6 text-primary" />
        </div>

        <Tabs defaultValue="chapter" className="mb-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="chapter">By Chapter</TabsTrigger>
            <TabsTrigger value="challenge">By Challenge</TabsTrigger>
          </TabsList>

          <TabsContent value="chapter" className="mt-4">
            <div className="flex flex-wrap gap-2 mb-6">
              <Button
                variant={selectedChapter === null ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedChapter(null)}
              >
                All
              </Button>
              {availableChapters.map((chapter) => (
                <Button
                  key={chapter}
                  variant={selectedChapter === chapter ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedChapter(chapter)}
                >
                  Ch. {chapter}
                </Button>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="challenge" className="mt-4">
            <div className="flex flex-wrap gap-2 mb-6">
              <Button
                variant={selectedChallenge === null ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedChallenge(null)}
              >
                All
              </Button>
              {challenges.map((challenge) => (
                <Button
                  key={challenge.id}
                  variant={selectedChallenge === challenge.id ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedChallenge(challenge.id)}
                  className="gap-1"
                >
                  {challenge.icon} {challenge.label}
                </Button>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Results */}
        <div className="space-y-3">
          {filteredVerses.length > 0 ? (
            filteredVerses.map((verse) => (
              <VerseListItem key={verse.id} verse={verse} />
            ))
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Filter className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No verses found with these filters</p>
            </div>
          )}
        </div>

        <p className="text-center text-sm text-muted-foreground mt-8">
          {filteredVerses.length} {filteredVerses.length === 1 ? 'verse' : 'verses'}
        </p>
      </div>
    </Layout>
  );
};

export default Browse;
