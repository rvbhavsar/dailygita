import { Compass } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import ChallengeCard from '@/components/challenge/ChallengeCard';
import { challenges } from '@/data/challenges';

const Challenges = () => {
  return (
    <Layout>
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-serif text-2xl font-semibold text-foreground">
              Life Challenges
            </h1>
            <p className="text-sm text-muted-foreground">
              Ancient wisdom for modern struggles
            </p>
          </div>
          <Compass className="h-6 w-6 text-primary" />
        </div>

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
