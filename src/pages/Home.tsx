import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Clock, ChevronRight } from 'lucide-react';
import { useUser } from '@/contexts/UserContext';
import { getDailyVerse, getTomorrowsVerse, getTimeUntilNextVerse } from '@/data/curatedVerses';
import Layout from '@/components/layout/Layout';
import VerseCard from '@/components/verse/VerseCard';
import { Card, CardContent } from '@/components/ui/card';

const Home = () => {
  const { user } = useUser();
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

  return (
    <Layout>
      <div className="space-y-8 md:space-y-12">
        {/* Greeting Section */}
        <section className="text-center space-y-3">
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            {today}
          </p>
          <h1>
            Good {getTimeOfDay()}, <span className="gradient-text">{user?.name?.split(' ')[0]}</span>
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
