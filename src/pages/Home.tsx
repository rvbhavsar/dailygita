import { useUser } from '@/contexts/UserContext';
import { getDailyVerse } from '@/data/curatedVerses';
import Layout from '@/components/layout/Layout';
import VerseCard from '@/components/verse/VerseCard';

const Home = () => {
  const { user } = useUser();
  const dailyVerse = getDailyVerse();

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
          <h1 className="font-serif">
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
