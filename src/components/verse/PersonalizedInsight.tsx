import { Sparkles, Loader2, AlertCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { VerseWithInsights, Challenge } from '@/types';
import { usePersonalizedInsight } from '@/hooks/usePersonalizedInsight';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

interface PersonalizedInsightProps {
  verse: VerseWithInsights;
  selectedChallenge?: Challenge;
  className?: string;
}

const PersonalizedInsight = ({ verse, selectedChallenge, className }: PersonalizedInsightProps) => {
  const { insight, isLoading, error, generateInsight, clearInsight } = usePersonalizedInsight();
  const { profile } = useAuth();

  const handleGenerate = () => {
    generateInsight(verse, selectedChallenge);
  };

  if (!insight && !isLoading && !error) {
    return (
      <div className={cn('', className)}>
        <Button
          onClick={handleGenerate}
          variant="outline"
          className="w-full gap-2 bg-gradient-to-r from-primary/10 to-accent/10 border-primary/30 hover:border-primary/50 hover:bg-primary/20"
        >
          <Sparkles className="h-4 w-4" />
          {profile ? 'Generate Personalized Example' : 'Generate AI Example'}
        </Button>
        {!profile && (
          <p className="text-xs text-muted-foreground text-center mt-2">
            Sign in to get examples tailored to your profile
          </p>
        )}
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={cn('bg-gradient-to-br from-primary/5 to-accent/5 border border-primary/20 rounded-2xl p-6 md:p-8', className)}>
        <div className="flex items-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <span className="text-muted-foreground">Creating your personalized example...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn('bg-destructive/10 border border-destructive/30 rounded-2xl p-6', className)}>
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-destructive">{error}</p>
            <Button
              onClick={handleGenerate}
              variant="ghost"
              size="sm"
              className="mt-2 text-destructive hover:text-destructive"
            >
              Try again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (insight) {
    return (
      <div className={cn('bg-gradient-to-br from-primary/5 to-accent/5 border border-primary/20 rounded-2xl p-6 md:p-8 relative', className)}>
        <Button
          onClick={clearInsight}
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 h-8 w-8 text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </Button>
        
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="h-5 w-5 text-primary" />
          <h4 className="text-primary font-medium">Your Personalized Example</h4>
        </div>
        
        <h5 className="text-foreground font-medium mb-3">
          {insight.title}
        </h5>
        <p className="text-muted-foreground leading-relaxed">
          {insight.description}
        </p>
        
        <Button
          onClick={handleGenerate}
          variant="ghost"
          size="sm"
          className="mt-4 gap-2 text-muted-foreground hover:text-primary"
        >
          <Sparkles className="h-3 w-3" />
          Generate another
        </Button>
      </div>
    );
  }

  return null;
};

export default PersonalizedInsight;
