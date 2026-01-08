import { useState, useMemo } from 'react';
import { BookOpen, Loader2, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Layout from '@/components/layout/Layout';
import { useChapters, useAllVerses, useTranslations, useVerseChallenges } from '@/hooks/useGitaData';
import { curatedVersesMap } from '@/data/curatedVerses';
import { challenges } from '@/data/challenges';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getChallengeById } from '@/data/challenges';

const ITEMS_PER_PAGE = 12;

const Browse = () => {
  const [selectedChapter, setSelectedChapter] = useState<number | null>(null);
  const [selectedChallenge, setSelectedChallenge] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const { data: chapters, isLoading: chaptersLoading } = useChapters();
  const { data: allVerses, isLoading: versesLoading } = useAllVerses();
  const { data: translations, isLoading: translationsLoading } = useTranslations();
  const { data: verseChallenges, isLoading: challengesLoading } = useVerseChallenges();

  const isLoading = chaptersLoading || versesLoading || translationsLoading;

  // Create a map of verse challenges from AI analysis
  const verseChallengesMap = useMemo(() => {
    const map = new Map<string, string[]>();
    verseChallenges?.forEach(vc => {
      map.set(`${vc.chapter_number}-${vc.verse_number}`, vc.challenges);
    });
    return map;
  }, [verseChallenges]);

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

  // Filter verses based on selection
  const filteredVerses = useMemo(() => {
    let verses = allVerses || [];
    
    if (selectedChapter) {
      verses = verses.filter(v => v.chapter_number === selectedChapter);
    }
    
    if (selectedChallenge) {
      verses = verses.filter(v => {
        const verseId = `${v.chapter_number}-${v.verse_number}`;
        // Check AI-analyzed challenges first, then fall back to curated
        const aiChallenges = verseChallengesMap.get(verseId);
        if (aiChallenges?.includes(selectedChallenge)) return true;
        const curated = curatedVersesMap.get(verseId);
        return curated?.challenges.includes(selectedChallenge as any);
      });
    }
    
    return verses;
  }, [allVerses, selectedChapter, selectedChallenge, verseChallengesMap]);

  // Pagination
  const totalPages = Math.ceil(filteredVerses.length / ITEMS_PER_PAGE);
  const paginatedVerses = filteredVerses.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Reset page when filters change
  const handleChapterChange = (chapter: number | null) => {
    setSelectedChapter(chapter);
    setCurrentPage(1);
  };

  const handleChallengeChange = (challenge: string | null) => {
    setSelectedChallenge(challenge);
    setCurrentPage(1);
  };

  // Get verse count for each challenge (from AI analysis + curated)
  const getChallengeVerseCount = (challengeId: string) => {
    let count = 0;
    verseChallenges?.forEach(vc => {
      if (vc.challenges.includes(challengeId)) count++;
    });
    // Add curated verses not in AI analysis
    curatedVersesMap.forEach((curated, verseId) => {
      if (curated.challenges.includes(challengeId as any) && !verseChallengesMap.has(verseId)) {
        count++;
      }
    });
    return count;
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
                  onClick={() => handleChapterChange(null)}
                  className="rounded-full"
                >
                  All Chapters
                </Button>
                {(chapters || []).map((chapter) => (
                  <Button
                    key={chapter.chapter_number}
                    variant={selectedChapter === chapter.chapter_number ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleChapterChange(chapter.chapter_number)}
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
                onClick={() => handleChallengeChange(null)}
                className="rounded-full"
              >
                All Curated
              </Button>
              {challenges.map((challenge) => (
                <Button
                  key={challenge.id}
                  variant={selectedChallenge === challenge.id ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleChallengeChange(challenge.id)}
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
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {paginatedVerses.length > 0 ? (
              paginatedVerses.map((verse) => {
                const verseId = `${verse.chapter_number}-${verse.verse_number}`;
                const hasCurated = curatedVersesMap.has(verseId);
                const aiChallenges = verseChallengesMap.get(verseId) || [];
                const english = englishTranslationsMap.get(verse.verse_id) || '';
                
                return (
                  <Link key={verse.id} to={`/verse/${verseId}`}>
                    <Card className="h-full card-hover cursor-pointer border-border/50">
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                            Chapter {verse.chapter_number} • Verse {verse.verse_number}
                          </span>
                          {hasCurated && (
                            <Badge variant="secondary" className="gap-1 text-xs">
                              <Sparkles className="h-3 w-3" />
                              Curated
                            </Badge>
                          )}
                        </div>
                        <p className="font-sanskrit text-base text-foreground leading-relaxed line-clamp-2 mb-3">
                          {verse.text.split('\n')[0]}
                        </p>
                        <p className="text-sm text-muted-foreground line-clamp-3 mb-3">
                          {english || 'Translation loading...'}
                        </p>
                        {aiChallenges.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {aiChallenges.slice(0, 2).map(challengeId => {
                              const challenge = getChallengeById(challengeId);
                              return challenge ? (
                                <Badge key={challengeId} variant="outline" className="text-xs">
                                  {challenge.icon} {challenge.label}
                                </Badge>
                              ) : null;
                            })}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </Link>
                );
              })
            ) : (
              <div className="col-span-full text-center py-16 text-muted-foreground">
                <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg">No verses found with these filters</p>
              </div>
            )}
          </div>
        )}
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="rounded-full"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum: number;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                
                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setCurrentPage(pageNum)}
                    className="w-10 h-10 rounded-full"
                  >
                    {pageNum}
                  </Button>
                );
              })}
              {totalPages > 5 && currentPage < totalPages - 2 && (
                <>
                  <span className="px-2 text-muted-foreground">...</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCurrentPage(totalPages)}
                    className="w-10 h-10 rounded-full"
                  >
                    {totalPages}
                  </Button>
                </>
              )}
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="rounded-full"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}

        <p className="text-center text-sm text-muted-foreground pt-4">
          {!isLoading && `Showing ${(currentPage - 1) * ITEMS_PER_PAGE + 1}-${Math.min(currentPage * ITEMS_PER_PAGE, filteredVerses.length)} of ${filteredVerses.length} verses`}
        </p>
      </div>
    </Layout>
  );
};

export default Browse;
