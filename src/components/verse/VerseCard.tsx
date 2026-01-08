import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Share2, BookOpen, Volume2, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { VerseWithInsights } from '@/types';
import { useUser } from '@/contexts/UserContext';
import { getChallengeById } from '@/data/challenges';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import PersonalizedInsight from './PersonalizedInsight';

interface VerseCardProps {
  verse: VerseWithInsights;
  showFullContent?: boolean;
  className?: string;
}

const VerseCard = ({
  verse,
  showFullContent = false,
  className
}: VerseCardProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  const [cachedAudioUrl, setCachedAudioUrl] = useState<string | null>(null);
  
  const {
    toggleFavorite,
    isFavorite
  } = useUser();
  const saved = isFavorite(verse.id);

  // Check for cached audio on mount
  useEffect(() => {
    const checkCachedAudio = async () => {
      const storagePath = `${verse.chapter}/${verse.verse}.mp3`;
      const { data } = supabase.storage
        .from('verse-audio')
        .getPublicUrl(storagePath);
      
      if (data?.publicUrl) {
        // Verify the file exists by checking verse_audio table
        const { data: audioRecord } = await supabase
          .from('verse_audio')
          .select('storage_path')
          .eq('chapter_number', verse.chapter)
          .eq('verse_number', verse.verse)
          .single();
        
        if (audioRecord) {
          setCachedAudioUrl(data.publicUrl);
        }
      }
    };
    
    checkCachedAudio();
  }, [verse.chapter, verse.verse]);

  const handleReadAloud = async () => {
    // If already playing, stop it
    if (audioElement) {
      audioElement.pause();
      audioElement.currentTime = 0;
      setAudioElement(null);
      setIsPlaying(false);
      return;
    }

    setIsLoading(true);
    try {
      let audioUrl = cachedAudioUrl;
      
      // If no cached audio, generate on-the-fly
      if (!audioUrl) {
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/elevenlabs-verse-tts`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            },
            body: JSON.stringify({
              sanskrit: verse.sanskrit,
              translation: verse.english,
              explanation: verse.insight.explanation,
              takeaway: verse.insight.takeaway,
            }),
          }
        );

        if (!response.ok) {
          throw new Error('Failed to generate audio');
        }

        const audioBlob = await response.blob();
        audioUrl = URL.createObjectURL(audioBlob);
      }

      const audio = new Audio(audioUrl);
      
      audio.onended = () => {
        setIsPlaying(false);
        setAudioElement(null);
        // Only revoke if it was a blob URL (not cached)
        if (!cachedAudioUrl && audioUrl) {
          URL.revokeObjectURL(audioUrl);
        }
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
        // User cancelled or error
      }
    } else {
      await navigator.clipboard.writeText(shareText);
      toast.success('Verse copied to clipboard');
    }
  };
  return <Card className={cn('overflow-hidden border-border/50 bg-card shadow-md card-hover', className)}>
      <CardContent className="p-6 md:p-10">
        {/* Chapter & Verse Header */}
        <div className="flex items-center justify-between mb-8">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Chapter {verse.chapter} • Verse {verse.verse}
          </span>
          <div className="flex gap-2">
            {verse.challenges.slice(0, 2).map(challengeId => {
            const challenge = getChallengeById(challengeId);
            return challenge ? <Badge key={challengeId} variant="secondary" className="text-xs font-medium">
                  {challenge.icon} {challenge.label}
                </Badge> : null;
          })}
          </div>
        </div>

        {/* Sanskrit */}
        <div className="text-center mb-8">
          <p className="font-sanskrit text-2xl md:text-3xl leading-loose text-foreground whitespace-pre-line tracking-wide lg:text-3xl">
            {verse.sanskrit}
          </p>
        </div>

        {/* Elegant Divider */}
        <div className="flex items-center gap-6 my-8">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
          <span className="text-primary text-xl">✦</span>
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
        </div>

        {/* Translation */}
        <p className="text-xl leading-relaxed text-foreground text-center mb-8 italic md:text-xl">
          "{verse.english}"
        </p>

        {showFullContent && <div className="space-y-6 mt-10">
            {/* Explanation with Takeaway */}
            <div className="bg-secondary/30 rounded-2xl p-6 md:p-8">
              <h4 className="text-foreground mb-3">What This Means</h4>
              <p className="text-muted-foreground leading-relaxed mb-4">
                {verse.insight.explanation}
              </p>
              <div className="border-t border-border/50 pt-4 mt-4">
                <p className="text-primary font-medium italic leading-relaxed">
                  ✦ {verse.insight.takeaway}
                </p>
              </div>
            </div>

            {/* AI-Powered Personalized Example */}
            <div>
              <h4 className="text-foreground mb-4">Personalized for You</h4>
              <PersonalizedInsight verse={verse} selectedChallenge={getChallengeById(verse.challenges[0])} />
            </div>
          </div>}

        <div className="flex items-center justify-center gap-2 pt-8 mt-8 border-t border-border/50">
          <Button 
            variant="ghost" 
            size="lg" 
            onClick={handleReadAloud} 
            disabled={isLoading}
            className={cn('gap-2 rounded-full px-6', isPlaying && 'text-primary bg-primary/10')}
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Volume2 className={cn('h-5 w-5', isPlaying && 'fill-current')} />
            )}
            {isLoading ? 'Loading...' : (isPlaying ? 'Stop' : (cachedAudioUrl ? 'Listen' : 'Listen'))}
          </Button>

          <Button variant="ghost" size="lg" onClick={() => toggleFavorite(verse.id)} className={cn('gap-2 rounded-full px-6', saved && 'text-primary bg-primary/10')}>
            <Heart className={cn('h-5 w-5', saved && 'fill-current')} />
            {saved ? 'Saved' : 'Save'}
          </Button>
          
          <Button variant="ghost" size="lg" onClick={handleShare} className="gap-2 rounded-full px-6">
            <Share2 className="h-5 w-5" />
            Share
          </Button>

          {!showFullContent && <Button variant="ghost" size="lg" asChild className="gap-2 rounded-full px-6">
              <Link to={`/verse/${verse.id}`}>
                <BookOpen className="h-5 w-5" />
                Read More
              </Link>
            </Button>}
        </div>
      </CardContent>
    </Card>;
};
export default VerseCard;