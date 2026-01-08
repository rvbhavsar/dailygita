import { Link } from 'react-router-dom';
import { Sparkles, BookOpen, Target, ArrowRight, Volume2, Heart, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { curatedVerses } from '@/data/curatedVerses';
import { getChallengeById } from '@/data/challenges';

// Sample verses for the landing page
const sampleVerses = curatedVerses.slice(0, 3);

const Landing = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
        <div className="container mx-auto px-4 py-16 md:py-24 relative">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-4">
              <span className="font-sanskrit text-4xl text-primary">ॐ</span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight">
              Bhagavad Gita <span className="gradient-text">Wisdom</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Ancient wisdom for modern life. Discover verses from the Bhagavad Gita 
              personalized to your life challenges with AI-powered insights.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button asChild size="lg" className="gap-2 text-lg px-8">
                <Link to="/auth">
                  Get Started <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="gap-2 text-lg px-8">
                <Link to="/auth">
                  Sign In
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-secondary/30">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Sparkles className="h-8 w-8 text-primary" />}
              title="AI-Personalized Insights"
              description="Get wisdom tailored to your profession, life stage, and current challenges. The ancient text speaks directly to your modern life."
            />
            <FeatureCard
              icon={<Target className="h-8 w-8 text-primary" />}
              title="Browse by Life Challenges"
              description="Feeling anxious? Struggling with decisions? Find verses organized by real-life situations like stress, relationships, and career."
            />
            <FeatureCard
              icon={<BookOpen className="h-8 w-8 text-primary" />}
              title="All 700+ Verses"
              description="Access the complete Bhagavad Gita with Sanskrit text, translations, and deep explanations for every verse."
            />
          </div>
        </div>
      </section>

      {/* Sample Verses Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Sample Verses
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              Experience the timeless wisdom. Sign up to unlock personalized insights and audio.
            </p>
          </div>

          <div className="space-y-8 max-w-4xl mx-auto">
            {sampleVerses.map((verse) => (
              <SampleVerseCard key={verse.id} verse={verse} />
            ))}
          </div>

          <div className="text-center mt-12">
            <Button asChild size="lg" className="gap-2 text-lg px-8">
              <Link to="/auth">
                Sign Up to Explore All 700+ Verses <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Challenges Preview */}
      <section className="py-16 bg-secondary/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Find Wisdom for Your Challenges
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              Life brings different challenges. The Gita has guidance for all of them.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-3 max-w-3xl mx-auto">
            {['stress-anxiety', 'focus-distraction', 'fear-doubt', 'relationships', 'purpose-motivation', 'decision-making', 'leadership', 'discipline-consistency'].map((challengeId) => {
              const challenge = getChallengeById(challengeId);
              return challenge ? (
                <Badge 
                  key={challengeId} 
                  variant="secondary" 
                  className="text-base py-2 px-4 cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                >
                  {challenge.icon} {challenge.label}
                </Badge>
              ) : null;
            })}
          </div>

          <div className="text-center mt-10">
            <Button asChild variant="outline" size="lg" className="gap-2">
              <Link to="/auth">
                Explore All Challenges
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 md:py-28">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto space-y-6">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              Start Your Journey Today
            </h2>
            <p className="text-muted-foreground text-lg">
              Join thousands discovering daily wisdom from the Bhagavad Gita. 
              Free to start, personalized to your life.
            </p>
            <Button asChild size="lg" className="gap-2 text-lg px-10 py-6">
              <Link to="/auth">
                Create Free Account <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>Bhagavad Gita Wisdom • Ancient wisdom for modern life</p>
        </div>
      </footer>
    </div>
  );
};

const FeatureCard = ({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) => (
  <div className="text-center p-6">
    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
      {icon}
    </div>
    <h3 className="text-xl font-semibold text-foreground mb-2">{title}</h3>
    <p className="text-muted-foreground">{description}</p>
  </div>
);

const SampleVerseCard = ({ verse }: { verse: typeof sampleVerses[0] }) => (
  <Card className="overflow-hidden border-border/50 bg-card shadow-md">
    <CardContent className="p-6 md:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Chapter {verse.chapter} • Verse {verse.verse}
        </span>
        <div className="flex gap-2">
          {verse.challenges.slice(0, 2).map((challengeId) => {
            const challenge = getChallengeById(challengeId);
            return challenge ? (
              <Badge key={challengeId} variant="secondary" className="text-xs font-medium">
                {challenge.icon} {challenge.label}
              </Badge>
            ) : null;
          })}
        </div>
      </div>

      {/* Sanskrit */}
      <div className="text-center mb-6">
        <p className="font-sanskrit text-xl md:text-2xl leading-loose text-foreground whitespace-pre-line tracking-wide">
          {verse.sanskrit}
        </p>
      </div>

      {/* Divider */}
      <div className="flex items-center gap-6 my-6">
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
        <span className="text-primary text-lg">✦</span>
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      </div>

      {/* Translation */}
      <p className="text-lg leading-relaxed text-foreground text-center mb-6 italic">
        "{verse.english}"
      </p>

      {/* Explanation Preview */}
      <div className="bg-secondary/30 rounded-xl p-4 mb-6">
        <p className="text-muted-foreground text-sm leading-relaxed line-clamp-2">
          {verse.insight.explanation}
        </p>
      </div>

      {/* Actions (disabled preview) */}
      <div className="flex items-center justify-center gap-2 pt-4 border-t border-border/50">
        <Button variant="ghost" size="sm" className="gap-2 opacity-60" disabled>
          <Volume2 className="h-4 w-4" />
          Listen
        </Button>
        <Button variant="ghost" size="sm" className="gap-2 opacity-60" disabled>
          <Heart className="h-4 w-4" />
          Save
        </Button>
        <Button variant="ghost" size="sm" className="gap-2 opacity-60" disabled>
          <Share2 className="h-4 w-4" />
          Share
        </Button>
        <Button variant="ghost" size="sm" className="gap-2" asChild>
          <Link to="/auth">
            <Sparkles className="h-4 w-4" />
            Sign up for AI Insights
          </Link>
        </Button>
      </div>
    </CardContent>
  </Card>
);

export default Landing;
