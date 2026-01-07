import { useUser } from '@/contexts/UserContext';
import { getDailyVerse } from '@/data/verses';
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
      <div className="max-w-2xl mx-auto">
        {/* Greeting */}
        <div className="text-center mb-8">
          <p className="text-sm text-muted-foreground mb-1">{today}</p>
          <h1 className="font-serif text-2xl md:text-3xl font-semibold text-foreground">
            Good {getTimeOfDay()}, {user?.name?.split(' ')[0]}
          </h1>
          <p className="text-muted-foreground mt-2">
            Your daily wisdom awaits
          </p>
        </div>

        {/* Daily Verse */}
        <VerseCard verse={dailyVerse} showFullContent />

        {/* Reflection Prompt */}
        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground italic">
            "Take a moment to reflect on how this verse applies to your day."
          </p>
        </div>
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
