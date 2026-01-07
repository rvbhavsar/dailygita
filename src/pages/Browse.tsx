import { useState } from 'react';
import { BookOpen, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Layout from '@/components/layout/Layout';
import { useChapters, useAllVerses, useTranslations } from '@/hooks/useGitaData';
import { curatedVersesMap } from '@/data/curatedVerses';
import { challenges } from '@/data/challenges';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';

const Browse = () => {
  const [selectedChapter, setSelectedChapter] = useState<number | null>(null);
  const [selectedChallenge, setSelectedChallenge] = useState<string | null>(null);

  const { data: chapters, isLoading: chaptersLoading } = useChapters();
  const { data: allVerses, isLoading: versesLoading } = useAllVerses();
  const { data: translations, isLoading: translationsLoading } = useTranslations();

  const isLoading = chaptersLoading || versesLoading || translationsLoading;

  // Get English translations map (verse_id -> translation)
  const englishTranslationsMap = new Map<number, string>();
  if (translations) {
    // Get one English translation per verse (prefer Swami Sivananda)
    const englishTranslations = translations.filter(t => t.lang === 'english');
    const groupedByVerse = new Map<number, typeof englishTranslations>();
    
    englishTranslations.forEach(t => {
      if (!groupedByVerse.has(t.verse_id)) {
        groupedByVerse.set(t.verse_id, []);
      }
      groupedByVerse.get(t.verse_id)!.push(t);
    });

    groupedByVerse.forEach((trans, verseId) => {
      const sivananda = trans.find(t => t.authorName.includes('Sivananda'));
      englishTranslationsMap.set(verseId, sivananda?.description || trans[0]?.description || '');
    });
  }

  // Filter verses based on selection
  const filteredVerses = allVerses?.filter((verse) => {
    if (selectedChapter && verse.chapter_number !== selectedChapter) return false;
    
    if (selectedChallenge) {
      const verseId = `${verse.chapter_number}-${verse.verse_number}`;
      const curated = curatedVersesMap.get(verseId);
      if (!curated?.challenges.includes(selectedChallenge as any)) return false;
    }
    
    return true;
  }) || [];

  // Get curated verses for challenge filter
  const getChallengeVerseCount = (challengeId: string) => {
    return Array.from(curatedVersesMap.values()).filter(
      v => v.challenges.includes(challengeId as any)
    ).length;
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-serif text-2xl font-semibold text-foreground">
              Browse Verses
            </h1>
            <p className="text-sm text-muted-foreground">
              {isLoading ? 'Loading...' : `${allVerses?.length || 0} verses across 18 chapters`}
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
            <ScrollArea className="w-full">
              <div className="flex flex-wrap gap-2 mb-6">
                <Button
                  variant={selectedChapter === null ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedChapter(null)}
                >
                  All
                </Button>
                {(chapters || []).map((chapter) => (
                  <Button
                    key={chapter.chapter_number}
                    variant={selectedChapter === chapter.chapter_number ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedChapter(chapter.chapter_number)}
                    title={chapter.name_meaning}
                  >
                    Ch. {chapter.chapter_number}
                  </Button>
                ))}
              </div>
            </ScrollArea>
            
            {selectedChapter && chapters && (
              <Card className="mb-6 bg-muted/50">
                <CardContent className="pt-4">
                  <h3 className="font-serif text-lg font-medium">
                    Chapter {selectedChapter}: {chapters.find(c => c.chapter_number === selectedChapter)?.name_meaning}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {chapters.find(c => c.chapter_number === selectedChapter)?.name_transliterated}
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="challenge" className="mt-4">
            <div className="flex flex-wrap gap-2 mb-6">
              <Button
                variant={selectedChallenge === null ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedChallenge(null)}
              >
                All Curated
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
                  <span className="text-xs opacity-70">({getChallengeVerseCount(challenge.id)})</span>
                </Button>
              ))}
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Showing verses with curated insights and real-life examples
            </p>
          </TabsContent>
        </Tabs>

        {/* Results */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2 text-muted-foreground">Loading the Gita...</span>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredVerses.length > 0 ? (
              filteredVerses.slice(0, 50).map((verse) => {
                const verseId = `${verse.chapter_number}-${verse.verse_number}`;
                const hasCurated = curatedVersesMap.has(verseId);
                const english = englishTranslationsMap.get(verse.id) || '';
                
                return (
                  <Link key={verse.id} to={`/verse/${verseId}`}>
                    <Card className="transition-all hover:shadow-md hover:border-primary/30 cursor-pointer">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <span className="text-sm font-medium text-primary">
                            Chapter {verse.chapter_number}, Verse {verse.verse_number}
                          </span>
                          {hasCurated && (
                            <Badge variant="secondary" className="gap-1 text-xs">
                              <Sparkles className="h-3 w-3" />
                              Curated
                            </Badge>
                          )}
                        </div>
                        <p className="font-sanskrit text-base text-foreground leading-relaxed line-clamp-2 mb-2">
                          {verse.text.split('\n')[0]}
                        </p>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {english || 'Translation loading...'}
                        </p>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No verses found with these filters</p>
              </div>
            )}
            
            {filteredVerses.length > 50 && (
              <p className="text-center text-sm text-muted-foreground pt-4">
                Showing first 50 of {filteredVerses.length} verses
              </p>
            )}
          </div>
        )}

        <p className="text-center text-sm text-muted-foreground mt-8">
          {!isLoading && `${filteredVerses.length} ${filteredVerses.length === 1 ? 'verse' : 'verses'}`}
        </p>
      </div>
    </Layout>
  );
};

export default Browse;
