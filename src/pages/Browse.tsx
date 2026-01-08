import { useState, useMemo } from 'react';
import { BookOpen, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Layout from '@/components/layout/Layout';
import { useChapters, useAllVerses, useTranslations } from '@/hooks/useGitaData';
import { curatedVersesMap, curatedVerses } from '@/data/curatedVerses';
import { challenges } from '@/data/challenges';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import VerseCard from '@/components/verse/VerseCard';
import { VerseWithInsights } from '@/types';

const Browse = () => {
  const [selectedChapter, setSelectedChapter] = useState<number | null>(null);
  const [selectedChallenge, setSelectedChallenge] = useState<string | null>(null);

  const { data: chapters, isLoading: chaptersLoading } = useChapters();
  const { data: allVerses, isLoading: versesLoading } = useAllVerses();
  const { data: translations, isLoading: translationsLoading } = useTranslations();

  const isLoading = chaptersLoading || versesLoading || translationsLoading;

  // Get translations map (verse_id -> translation, prefer Swami Sivananda)
  const englishTranslationsMap = useMemo(() => {
    const map = new Map<number, string>();
    if (translations) {
      const groupedByVerse = new Map<number, typeof translations>();
      
      translations.forEach(t => {
        if (!groupedByVerse.has(t.verse_id)) {
          groupedByVerse.set(t.verse_id, []);
        }
        groupedByVerse.get(t.verse_id)!.push(t);
      });

      groupedByVerse.forEach((trans, verseId) => {
        const sivananda = trans.find(t => t.author_name.includes('Sivananda'));
        map.set(verseId, sivananda?.description || trans[0]?.description || '');
      });
    }
    return map;
  }, [translations]);

  // Convert database verses to VerseWithInsights format
  const versesWithInsights = useMemo(() => {
    if (!allVerses) return [];
    
    return allVerses.map((verse): VerseWithInsights => {
      const verseId = `${verse.chapter_number}-${verse.verse_number}`;
      const curated = curatedVersesMap.get(verseId);
      const english = englishTranslationsMap.get(verse.verse_id) || '';
      
      if (curated) {
        return curated;
      }
      
      // Generate default insight for non-curated verses
      return {
        id: verseId,
        chapter: verse.chapter_number,
        verse: verse.verse_number,
        sanskrit: verse.text,
        english,
        insight: {
          verseId,
          explanation: `This verse from Chapter ${verse.chapter_number} offers profound wisdom about life, duty, and spiritual growth.`,
          takeaway: 'Reflect on this teaching and apply its wisdom to your daily life.',
        },
        examples: [],
        challenges: [],
      };
    });
  }, [allVerses, englishTranslationsMap]);

  // Filter verses based on selection
  const filteredVerses = useMemo(() => {
    let verses = versesWithInsights;
    
    if (selectedChapter) {
      verses = verses.filter(v => v.chapter === selectedChapter);
    }
    
    if (selectedChallenge) {
      verses = verses.filter(v => v.challenges.includes(selectedChallenge as any));
    }
    
    return verses;
  }, [versesWithInsights, selectedChapter, selectedChallenge]);

  // Get curated verses for challenge filter
  const getChallengeVerseCount = (challengeId: string) => {
    return curatedVerses.filter(v => v.challenges.includes(challengeId as any)).length;
  };

  return (
    <Layout fullWidth>
      <div className="space-y-8">
        {/* Header */}
        <section className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="mb-2">Browse Verses</h1>
            <p className="text-muted-foreground">
              {isLoading ? 'Loading...' : `${allVerses?.length || 0} verses across 18 chapters`}
            </p>
          </div>
          <div className="flex items-center gap-2 text-primary">
            <BookOpen className="h-6 w-6" />
            <span className="text-sm font-medium">Bhagavad Gita</span>
          </div>
        </section>

        {/* Tabs */}
        <Tabs defaultValue="chapter" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2 p-1 h-12 rounded-full bg-secondary/50">
            <TabsTrigger value="chapter" className="rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              By Chapter
            </TabsTrigger>
            <TabsTrigger value="challenge" className="rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              By Challenge
            </TabsTrigger>
          </TabsList>

          <TabsContent value="chapter" className="space-y-6">
            <ScrollArea className="w-full">
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={selectedChapter === null ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedChapter(null)}
                  className="rounded-full"
                >
                  All Chapters
                </Button>
                {(chapters || []).map((chapter) => (
                  <Button
                    key={chapter.chapter_number}
                    variant={selectedChapter === chapter.chapter_number ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedChapter(chapter.chapter_number)}
                    title={chapter.name_translated || chapter.name}
                    className="rounded-full"
                  >
                    Ch. {chapter.chapter_number}
                  </Button>
                ))}
              </div>
            </ScrollArea>
            
            {selectedChapter && chapters && (
              <Card className="bg-secondary/30 border-0">
                <CardContent className="py-4">
                  <h4>
                    Chapter {selectedChapter}: {chapters.find(c => c.chapter_number === selectedChapter)?.name_translated || chapters.find(c => c.chapter_number === selectedChapter)?.name}
                  </h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    {chapters.find(c => c.chapter_number === selectedChapter)?.name_transliterated}
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="challenge" className="space-y-6">
            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedChallenge === null ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedChallenge(null)}
                className="rounded-full"
              >
                All Curated
              </Button>
              {challenges.map((challenge) => (
                <Button
                  key={challenge.id}
                  variant={selectedChallenge === challenge.id ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedChallenge(challenge.id)}
                  className="gap-2 rounded-full"
                >
                  {challenge.icon} {challenge.label}
                  <span className="text-xs opacity-70">({getChallengeVerseCount(challenge.id)})</span>
                </Button>
              ))}
            </div>
            <p className="text-sm text-muted-foreground">
              Showing verses with curated insights and real-life examples
            </p>
          </TabsContent>
        </Tabs>

        {/* Results */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-3 text-muted-foreground">Loading the Gita...</span>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredVerses.length > 0 ? (
              filteredVerses.slice(0, 20).map((verse) => (
                <VerseCard 
                  key={verse.id} 
                  verse={verse} 
                  showFullContent={verse.challenges.length > 0}
                />
              ))
            ) : (
              <div className="text-center py-16 text-muted-foreground">
                <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg">No verses found with these filters</p>
              </div>
            )}
          </div>
        )}
        
        {filteredVerses.length > 20 && (
          <p className="text-center text-sm text-muted-foreground">
            Showing first 20 of {filteredVerses.length} verses
          </p>
        )}

        <p className="text-center text-sm text-muted-foreground pt-4">
          {!isLoading && `${filteredVerses.length} ${filteredVerses.length === 1 ? 'verse' : 'verses'}`}
        </p>
      </div>
    </Layout>
  );
};

export default Browse;
