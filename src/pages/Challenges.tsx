import { Compass } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import ChallengeCard from '@/components/challenge/ChallengeCard';
import { challenges } from '@/data/challenges';

const Challenges = () => {
  return (
    <Layout fullWidth>
      <div className="space-y-8">
        <section className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="font-serif mb-2">Life Challenges</h1>
            <p className="text-muted-foreground">
              Ancient wisdom for modern struggles
            </p>
          </div>
          <div className="flex items-center gap-2 text-primary">
            <Compass className="h-6 w-6" />
            <span className="text-sm font-medium">Explore Topics</span>
          </div>
        </section>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {challenges.map((challenge) => (
            <ChallengeCard key={challenge.id} challenge={challenge} />
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default Challenges;
