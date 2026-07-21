import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, BookOpen, Target, ArrowRight, Volume2, Heart, Share2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import AudioWaveform from '@/components/ui/AudioWaveform';
import { curatedVerses } from '@/data/curatedVerses';
import { VerseWithInsights } from '@/types';
import { getChallengeById } from '@/data/challenges';
import { apiGet } from '@/lib/api';
import type { AudioResponse } from 'shared';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// Sample verses for the landing page
const sampleVerses = curatedVerses.slice(0, 3);

const Landing = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
        <div className="container mx-auto px-4 py-12 sm:py-16 md:py-24 relative">
          <div className="text-center max-w-3xl mx-auto space-y-4 sm:space-y-6">
            <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-primary/10 mb-2 sm:mb-4">
              <span className="font-sanskrit text-3xl sm:text-4xl text-primary">ॐ</span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight">
              Bhagavad Gita <span className="gradient-text">Wisdom</span>
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed px-2">
              Ancient wisdom for modern life. Discover verses from the Bhagavad Gita 
              personalized to your life challenges with AI-powered insights.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center pt-2 sm:pt-4 px-4">
              <Button asChild size="lg" className="gap-2 text-base sm:text-lg px-6 sm:px-8 w-full sm:w-auto">
                <Link to="/auth">
                  Get Started <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="gap-2 text-base sm:text-lg px-6 sm:px-8 w-full sm:w-auto">
                <Link to="/auth">
                  Sign In
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 sm:py-16 bg-secondary/30">
        <div className="container mx-auto px-4">
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8">
            <FeatureCard
              icon={<Sparkles className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />}
              title="AI-Personalized Insights"
              description="Get wisdom tailored to your profession, life stage, and current challenges. The ancient text speaks directly to your modern life."
            />
            <FeatureCard
              icon={<Target className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />}
              title="Browse by Life Challenges"
              description="Feeling anxious? Struggling with decisions? Find verses organized by real-life situations like stress, relationships, and career."
            />
            <FeatureCard
              icon={<BookOpen className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />}
              title="All 700+ Verses"
              description="Access the complete Bhagavad Gita with Sanskrit text, translations, and deep explanations for every verse."
            />
          </div>
        </div>
      </section>

      {/* Sample Verses Section */}
      <section className="py-12 sm:py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-3 sm:mb-4">
              Sample Verses
            </h2>
            <p className="text-muted-foreground text-base sm:text-lg max-w-xl mx-auto px-2">
              Experience the timeless wisdom. Sign up to unlock personalized insights and audio.
            </p>
          </div>

          <div className="space-y-6 sm:space-y-8 max-w-4xl mx-auto">
            {sampleVerses.map((verse) => (
              <SampleVerseCard key={verse.id} verse={verse} />
            ))}
          </div>

          <div className="text-center mt-8 sm:mt-12 px-4">
            <Button asChild size="lg" className="gap-2 text-base sm:text-lg px-6 sm:px-8 w-full sm:w-auto">
              <Link to="/auth">
                Sign Up to Explore All 700+ Verses <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Challenges Preview */}
      <section className="py-12 sm:py-16 bg-secondary/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-3 sm:mb-4">
              Find Wisdom for Your Challenges
            </h2>
            <p className="text-muted-foreground text-base sm:text-lg max-w-xl mx-auto px-2">
              Life brings different challenges. The Gita has guidance for all of them.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-2 sm:gap-3 max-w-3xl mx-auto px-2">
            {['stress-anxiety', 'focus-distraction', 'fear-doubt', 'relationships', 'purpose-motivation', 'decision-making', 'leadership', 'discipline-consistency'].map((challengeId) => {
              const challenge = getChallengeById(challengeId);
              return challenge ? (
                <Badge 
                  key={challengeId} 
                  variant="secondary" 
                  className="text-sm sm:text-base py-1.5 sm:py-2 px-3 sm:px-4 cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                >
                  {challenge.icon} {challenge.label}
                </Badge>
              ) : null;
            })}
          </div>

          <div className="text-center mt-8 sm:mt-10">
            <Button asChild variant="outline" size="lg" className="gap-2 w-full sm:w-auto mx-4 sm:mx-0">
              <Link to="/auth">
                Explore All Challenges
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-20 md:py-28">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto space-y-4 sm:space-y-6">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground">
              Start Your Journey Today
            </h2>
            <p className="text-muted-foreground text-base sm:text-lg px-2">
              Join thousands discovering daily wisdom from the Bhagavad Gita. 
              Free to start, personalized to your life.
            </p>
            <Button asChild size="lg" className="gap-2 text-base sm:text-lg px-8 sm:px-10 py-5 sm:py-6 w-full sm:w-auto">
              <Link to="/auth">
                Create Free Account <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-6 sm:py-8 border-t border-border">
        <div className="container mx-auto px-4 text-center text-muted-foreground text-sm sm:text-base">
          <p>Bhagavad Gita Wisdom • Ancient wisdom for modern life</p>
        </div>
      </footer>
    </div>
  );
};

const FeatureCard = ({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) => (
  <div className="text-center p-4 sm:p-6">
    <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-primary/10 mb-3 sm:mb-4">
      {icon}
    </div>
    <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-2">{title}</h3>
    <p className="text-sm sm:text-base text-muted-foreground">{description}</p>
  </div>
);

const SampleVerseCard = ({ verse }: { verse: VerseWithInsights }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  const [cachedAudioUrl, setCachedAudioUrl] = useState<string | null>(null);

  // Audio is generated in phase 2; a null url keeps the listen button hidden.
  useEffect(() => {
    let cancelled = false;

    apiGet<AudioResponse>(`/verses/${verse.chapter}/${verse.verse}/audio`)
      .then(({ url }) => {
        if (!cancelled) setCachedAudioUrl(url);
      })
      .catch(() => {
        if (!cancelled) setCachedAudioUrl(null);
      });

    return () => {
      cancelled = true;
    };
  }, [verse.chapter, verse.verse]);

  const handleReadAloud = async () => {
    if (audioElement) {
      audioElement.pause();
      audioElement.currentTime = 0;
      setAudioElement(null);
      setIsPlaying(false);
      return;
    }

    if (!cachedAudioUrl) return;

    setIsLoading(true);
    try {
      const audio = new Audio(cachedAudioUrl);

      audio.onended = () => {
        setIsPlaying(false);
        setAudioElement(null);
      };
      
      setAudioElement(audio);
      setIsLoading(false);
      setIsPlaying(true);
      await audio.play();
    } catch (error) {
      console.error('TTS error:', error);
      toast.error('Failed to read verse aloud');
      setIsLoading(false);
      setIsPlaying(false);
    }
  };

  const handleShare = async () => {
    const shareText = `${verse.english}\n\n— Bhagavad Gita ${verse.chapter}.${verse.verse}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Bhagavad Gita ${verse.chapter}.${verse.verse}`,
          text: shareText
        });
      } catch {
        // User cancelled
      }
    } else {
      await navigator.clipboard.writeText(shareText);
      toast.success('Verse copied to clipboard');
    }
  };

  return (
    <Card className="overflow-hidden border-border/50 bg-card shadow-md">
      <CardContent className="p-4 sm:p-6 md:p-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4 mb-4 sm:mb-6">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Chapter {verse.chapter} • Verse {verse.verse}
          </span>
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
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
        <div className="text-center mb-4 sm:mb-6">
          <p className="font-sanskrit text-lg sm:text-xl md:text-2xl leading-loose text-foreground whitespace-pre-line tracking-wide">
            {verse.sanskrit}
          </p>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-4 sm:gap-6 my-4 sm:my-6">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
          <span className="text-primary text-base sm:text-lg">✦</span>
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
        </div>

        {/* Translation */}
        <p className="text-base sm:text-lg leading-relaxed text-foreground text-center mb-4 sm:mb-6 italic">
          "{verse.english}"
        </p>

        {/* Explanation Preview */}
        <div className="bg-secondary/30 rounded-xl p-3 sm:p-4 mb-4 sm:mb-6">
          <p className="text-muted-foreground text-sm leading-relaxed line-clamp-2">
            {verse.insight.explanation}
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 pt-3 sm:pt-4 border-t border-border/50">
          {cachedAudioUrl && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReadAloud}
              disabled={isLoading}
              className={cn('gap-1.5 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3', isPlaying && 'text-primary bg-primary/10')}
            >
              {isLoading ? (
                <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" />
              ) : isPlaying ? (
                <AudioWaveform isPlaying={isPlaying} />
              ) : (
                <Volume2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              )}
              <span className="hidden xs:inline">{isLoading ? 'Loading...' : (isPlaying ? 'Stop' : 'Listen')}</span>
            </Button>
          )}
          <Button variant="ghost" size="sm" className="gap-1.5 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3 opacity-60" disabled>
            <Heart className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="hidden xs:inline">Save</span>
          </Button>
          <Button variant="ghost" size="sm" className="gap-1.5 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3" onClick={handleShare}>
            <Share2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="hidden xs:inline">Share</span>
          </Button>
          <Button variant="ghost" size="sm" className="gap-1.5 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3" asChild>
            <Link to="/auth">
              <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Sign up for AI Insights</span>
              <span className="sm:hidden">AI Insights</span>
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default Landing;
