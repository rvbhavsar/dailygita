import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Clock, ChevronRight, Sparkles } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getDailyVerse, getTomorrowsVerse, getTimeUntilNextVerse, getCuratedVersesByChallenge, curatedVerses } from '@/data/curatedVerses';
import { challenges as challengeData } from '@/data/challenges';
import Layout from '@/components/layout/Layout';
import VerseCard from '@/components/verse/VerseCard';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Challenge, VerseWithInsights } from '@/types';

const Home = () => {
  const { profile } = useAuth();
  const dailyVerse = getDailyVerse();
  const tomorrowsVerse = getTomorrowsVerse();
  const [timeLeft, setTimeLeft] = useState(getTimeUntilNextVerse());

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(getTimeUntilNextVerse());
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  // Get personalized verses based on user's selected challenges
  const userChallenges = profile?.selected_challenges || [];
  const personalizedVerses = userChallenges.length > 0
    ? userChallenges.flatMap(challenge => 
        getCuratedVersesByChallenge(challenge as Challenge)
      ).filter((verse, index, self) => 
        // Remove duplicates and exclude daily verse
        self.findIndex(v => v.id === verse.id) === index && verse.id !== dailyVerse.id
      ).slice(0, 3)
    : [];

  // Get challenge labels for display
  const getUserChallengeLabels = () => {
    return userChallenges.map(id => {
      const challenge = challengeData.find(c => c.id === id);
      return challenge ? { id, label: challenge.label, icon: challenge.icon } : null;
    }).filter(Boolean);
  };

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

        {/* Daily Verse */}
        <VerseCard verse={dailyVerse} showFullContent />

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
            <h3 className="text-foreground">Tomorrow's Verse</h3>
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Clock className="h-4 w-4" />
              <span>New verse in {timeLeft.hours}h {timeLeft.minutes}m</span>
            </div>
          </div>
          
          <Link to={`/verse/${tomorrowsVerse.id}`}>
            <Card className="overflow-hidden border-border/50 bg-card/50 hover:bg-card transition-colors cursor-pointer group">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Chapter {tomorrowsVerse.chapter} • Verse {tomorrowsVerse.verse}
                    </span>
                    <p className="text-foreground mt-2 line-clamp-2 italic">
                      "{tomorrowsVerse.english}"
                    </p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors ml-4 flex-shrink-0" />
                </div>
              </CardContent>
            </Card>
          </Link>
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
