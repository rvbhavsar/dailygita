import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Clock, ChevronRight, Sparkles, Shuffle, ThumbsUp, ThumbsDown, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getTimeUntilNextVerse, getCuratedVersesByChallenge, curatedVerses } from '@/data/curatedVerses';
import { challenges as challengeData } from '@/data/challenges';
import Layout from '@/components/layout/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Challenge } from '@/types';
import { useDailyVerse } from '@/hooks/useDailyVerse';
import { useVerseFeedback } from '@/hooks/useVerseFeedback';
import { Skeleton } from '@/components/ui/skeleton';

const Home = () => {
  const { profile } = useAuth();
  const { dailyVerse, isLoading, error, shuffleVerse } = useDailyVerse();
  const { submitFeedback, getFeedback, loadFeedback, isSubmitting } = useVerseFeedback();
  const [timeLeft, setTimeLeft] = useState(getTimeUntilNextVerse());
  const [isShuffling, setIsShuffling] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(getTimeUntilNextVerse());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // Load existing feedback when verse changes
  useEffect(() => {
    if (dailyVerse?.verse?.verse_id) {
      loadFeedback(dailyVerse.verse.verse_id);
    }
  }, [dailyVerse?.verse?.verse_id, loadFeedback]);

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  // Get personalized verses based on user's selected challenges (from curated as fallback)
  const userChallenges = profile?.selected_challenges || [];
  const personalizedVerses = userChallenges.length > 0
    ? userChallenges.flatMap(challenge => 
        getCuratedVersesByChallenge(challenge as Challenge)
      ).filter((verse, index, self) => 
        self.findIndex(v => v.id === verse.id) === index
      ).slice(0, 3)
    : [];

  const getUserChallengeLabels = () => {
    return userChallenges.map(id => {
      const challenge = challengeData.find(c => c.id === id);
      return challenge ? { id, label: challenge.label, icon: challenge.icon } : null;
    }).filter(Boolean);
  };

  const handleShuffle = async () => {
    setIsShuffling(true);
    await shuffleVerse();
    setIsShuffling(false);
  };

  const handleFeedback = async (type: 'like' | 'dislike') => {
    if (!dailyVerse?.verse) return;
    await submitFeedback(
      dailyVerse.verse.verse_id,
      dailyVerse.verse.chapter_number,
      dailyVerse.verse.verse_number,
      type
    );
  };

  const currentFeedback = dailyVerse?.verse ? getFeedback(dailyVerse.verse.verse_id) : null;

  return (
    <Layout>
      <div className="space-y-8 md:space-y-12">
        {/* Greeting Section */}
        <section className="text-center space-y-3">
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            {today}
          </p>
          <h1>
            Good {getTimeOfDay()}, <span className="gradient-text">{profile?.display_name?.split(' ')[0] || 'Seeker'}</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-md mx-auto">
            Your daily wisdom awaits. Take a moment to reflect.
          </p>
        </section>

        {/* Daily Verse Section */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-foreground">Today's Verse</h3>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleShuffle}
                disabled={isShuffling || isLoading}
                className="h-9 w-9"
                title="Get a different verse"
              >
                {isShuffling ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Shuffle className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant={currentFeedback === 'like' ? 'default' : 'ghost'}
                size="icon"
                onClick={() => handleFeedback('like')}
                disabled={isSubmitting || isLoading}
                className="h-9 w-9"
                title="This verse was helpful"
              >
                <ThumbsUp className="h-4 w-4" />
              </Button>
              <Button
                variant={currentFeedback === 'dislike' ? 'destructive' : 'ghost'}
                size="icon"
                onClick={() => handleFeedback('dislike')}
                disabled={isSubmitting || isLoading}
                className="h-9 w-9"
                title="Show me something different"
              >
                <ThumbsDown className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {isLoading ? (
            <Card className="overflow-hidden border-border/50 bg-card/50">
              <CardContent className="p-6 space-y-4">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ) : error ? (
            <Card className="overflow-hidden border-destructive/50 bg-destructive/10">
              <CardContent className="p-6 text-center">
                <p className="text-destructive">Failed to load verse. Please try again.</p>
                <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
                  Retry
                </Button>
              </CardContent>
            </Card>
          ) : dailyVerse ? (
            <Link to={`/verse/${dailyVerse.verse.chapter_number}/${dailyVerse.verse.verse_number}`}>
              <Card className="overflow-hidden border-border/50 bg-card/50 hover:bg-card transition-colors cursor-pointer group">
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Chapter {dailyVerse.verse.chapter_number} • Verse {dailyVerse.verse.verse_number}
                    </span>
                    <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  
                  {/* Sanskrit Text */}
                  <p className="text-lg leading-relaxed text-foreground/80 font-sanskrit">
                    {dailyVerse.verse.text}
                  </p>
                  
                  {/* Translation */}
                  <p className="text-foreground italic leading-relaxed">
                    "{dailyVerse.translation}"
                  </p>

                  {/* AI Summary */}
                  {dailyVerse.aiSummary && (
                    <div className="pt-2 border-t border-border/50">
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {dailyVerse.aiSummary}
                      </p>
                    </div>
                  )}

                  {/* Challenge Tags */}
                  {dailyVerse.challenges && dailyVerse.challenges.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-2">
                      {dailyVerse.challenges.slice(0, 3).map((challenge) => {
                        const challengeInfo = challengeData.find(c => c.id === challenge);
                        return (
                          <Badge key={challenge} variant="secondary" className="text-xs">
                            {challengeInfo?.icon} {challengeInfo?.label || challenge}
                          </Badge>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </Link>
          ) : null}
        </section>

        {/* Reflection Prompt */}
        <section className="text-center pt-4">
          <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-secondary/50 border border-border/50">
            <span className="text-primary">✦</span>
            <p className="text-sm text-muted-foreground italic">
              How does this verse apply to your day?
            </p>
            <span className="text-primary">✦</span>
          </div>
        </section>

        {/* Personalized Recommendations */}
        {personalizedVerses.length > 0 && (
          <section className="pt-4">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="h-5 w-5 text-primary" />
              <h3 className="text-foreground">For You</h3>
            </div>
            
            {userChallenges.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {getUserChallengeLabels().map((challenge: any) => (
                  <Badge key={challenge.id} variant="secondary" className="text-xs">
                    {challenge.icon} {challenge.label}
                  </Badge>
                ))}
              </div>
            )}

            <div className="space-y-3">
              {personalizedVerses.map((verse) => (
                <Link key={verse.id} to={`/verse/${verse.id}`}>
                  <Card className="overflow-hidden border-border/50 bg-card/50 hover:bg-card transition-colors cursor-pointer group">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Chapter {verse.chapter} • Verse {verse.verse}
                          </span>
                          <p className="text-foreground mt-1 line-clamp-2 text-sm">
                            {verse.insight?.takeaway || verse.english}
                          </p>
                        </div>
                        <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors ml-4 flex-shrink-0" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Tomorrow's Verse Preview */}
        <section className="pt-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-foreground">Next Verse</h3>
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Clock className="h-4 w-4" />
              <span>New verse in {timeLeft.hours}h {timeLeft.minutes}m</span>
            </div>
          </div>
          
          <Card className="overflow-hidden border-border/50 bg-card/30">
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground text-sm">
                Your next personalized verse will be ready at midnight, selected based on your challenges and feedback.
              </p>
            </CardContent>
          </Card>
        </section>
      </div>
    </Layout>
  );
};

const getTimeOfDay = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
};

export default Home;
