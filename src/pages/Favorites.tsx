import { Heart, Sparkles, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Layout from '@/components/layout/Layout';
import VerseListItem from '@/components/verse/VerseListItem';
import { useUser } from '@/contexts/UserContext';
import { useSavedInsights } from '@/hooks/useSavedInsights';
import { curatedVersesMap } from '@/data/curatedVerses';
import { getChallengeById } from '@/data/challenges';

const Favorites = () => {
  const { favorites } = useUser();
  const { savedInsights, deleteInsight, isLoading } = useSavedInsights();
  
  const savedVerses = favorites
    .map((id) => curatedVersesMap.get(id))
    .filter(Boolean);

  return (
    <Layout>
      <div className="space-y-8">
        <section className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="mb-2">Saved</h1>
            <p className="text-muted-foreground">
              Your personal collection of wisdom and insights
            </p>
          </div>
        </section>

        <Tabs defaultValue="verses" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="verses" className="gap-2">
              <Heart className="h-4 w-4" />
              Verses ({savedVerses.length})
            </TabsTrigger>
            <TabsTrigger value="insights" className="gap-2">
              <Sparkles className="h-4 w-4" />
              AI Insights ({savedInsights.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="verses" className="mt-6">
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
                <h3 className="text-foreground mb-2">
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
          </TabsContent>

          <TabsContent value="insights" className="mt-6">
            {isLoading ? (
              <div className="text-center py-20 text-muted-foreground">
                Loading saved insights...
              </div>
            ) : savedInsights.length > 0 ? (
              <div className="space-y-4">
                {savedInsights.map((insight) => {
                  const challenge = insight.challenge_id ? getChallengeById(insight.challenge_id) : null;
                  return (
                    <Card key={insight.id} className="overflow-hidden border-border/50 bg-card">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                Chapter {insight.chapter_number} • Verse {insight.verse_number}
                              </span>
                              {challenge && (
                                <span className="text-xs bg-secondary/50 px-2 py-0.5 rounded-full">
                                  {challenge.icon} {challenge.label}
                                </span>
                              )}
                            </div>
                            <h4 className="text-foreground font-medium mb-2">
                              {insight.title}
                            </h4>
                            <p className="text-muted-foreground text-sm leading-relaxed">
                              {insight.description}
                            </p>
                            <div className="flex items-center gap-4 mt-4">
                              <Link 
                                to={`/verse/${insight.verse_id}`}
                                className="text-sm text-primary hover:underline"
                              >
                                View verse →
                              </Link>
                              <span className="text-xs text-muted-foreground">
                                Saved {new Date(insight.created_at).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteInsight(insight.id)}
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-20">
                <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-secondary/50 mb-6">
                  <Sparkles className="h-10 w-10 text-muted-foreground/50" />
                </div>
                <h3 className="text-foreground mb-2">
                  No saved insights yet
                </h3>
                <p className="text-muted-foreground mb-8 max-w-sm mx-auto">
                  Generate personalized AI examples on any verse and save them here
                </p>
                <Button asChild variant="default" className="rounded-full px-8">
                  <Link to="/browse">Browse Verses</Link>
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Favorites;
