import { cn } from '@/lib/utils';

interface AudioWaveformProps {
  isPlaying: boolean;
  className?: string;
  barCount?: number;
}

const AudioWaveform = ({ isPlaying, className, barCount = 4 }: AudioWaveformProps) => {
  return (
    <div className={cn('flex items-center gap-0.5 h-4', className)}>
      {Array.from({ length: barCount }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'w-0.5 bg-primary rounded-full transition-all',
            isPlaying ? 'animate-waveform' : 'h-1'
          )}
          style={{
            animationDelay: isPlaying ? `${i * 0.15}s` : '0s',
          }}
        />
      ))}
    </div>
  );
};

export default AudioWaveform;
