import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Check, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { challenges } from '@/data/challenges';
import { useUser } from '@/contexts/UserContext';
import { Challenge } from '@/types';
import { cn } from '@/lib/utils';
import heroBg from '@/assets/hero-bg.jpg';

const Onboarding = () => {
  const navigate = useNavigate();
  const { completeOnboarding } = useUser();
  
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [selectedChallenges, setSelectedChallenges] = useState<Challenge[]>([]);
  const [dailyEmailEnabled, setDailyEmailEnabled] = useState(true);

  const toggleChallenge = (id: Challenge) => {
    setSelectedChallenges((prev) =>
      prev.includes(id)
        ? prev.filter((c) => c !== id)
        : [...prev, id]
    );
  };

  const handleComplete = () => {
    completeOnboarding({
      name,
      email,
      selectedChallenges,
      dailyEmailEnabled,
    });
    navigate('/');
  };

  const canProceedStep1 = name.trim().length > 0 && email.includes('@');
  const canProceedStep2 = selectedChallenges.length > 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div 
        className="relative h-64 md:h-80 flex items-center justify-center overflow-hidden"
        style={{
          backgroundImage: `url(${heroBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-background/30 via-background/60 to-background" />
        <div className="relative z-10 text-center px-4">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary mb-4">
            <span className="font-sanskrit text-2xl text-primary-foreground">ॐ</span>
          </div>
          <h1 className="font-serif text-3xl md:text-4xl font-semibold text-foreground mb-2">
            Daily Gita
          </h1>
          <p className="text-muted-foreground">
            Ancient wisdom for modern life
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="container max-w-lg py-8 px-4">
        {/* Progress */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={cn(
                'h-2 rounded-full transition-all',
                s === step ? 'w-8 bg-primary' : 'w-2 bg-border',
                s < step && 'bg-primary'
              )}
            />
          ))}
        </div>

        {/* Step 1: Basic Info */}
        {step === 1 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="text-center mb-8">
              <h2 className="font-serif text-2xl font-semibold text-foreground mb-2">
                Welcome, Seeker
              </h2>
              <p className="text-muted-foreground">
                Let's personalize your journey
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Your Name</Label>
                <Input
                  id="name"
                  placeholder="How should we address you?"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-12"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="For your daily wisdom"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12"
                />
              </div>
            </div>

            <Button
              onClick={() => setStep(2)}
              disabled={!canProceedStep1}
              className="w-full h-12 text-base"
            >
              Continue
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Step 2: Challenges */}
        {step === 2 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="text-center mb-8">
              <h2 className="font-serif text-2xl font-semibold text-foreground mb-2">
                What brings you here?
              </h2>
              <p className="text-muted-foreground">
                Select the areas you'd like guidance on
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {challenges.map((challenge) => {
                const isSelected = selectedChallenges.includes(challenge.id);
                return (
                  <button
                    key={challenge.id}
                    onClick={() => toggleChallenge(challenge.id)}
                    className={cn(
                      'relative p-4 rounded-lg border-2 text-left transition-all',
                      isSelected
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50 bg-card'
                    )}
                  >
                    {isSelected && (
                      <div className="absolute top-2 right-2 h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                        <Check className="h-3 w-3 text-primary-foreground" />
                      </div>
                    )}
                    <span className="text-2xl block mb-2">{challenge.icon}</span>
                    <span className="text-sm font-medium text-foreground">
                      {challenge.label}
                    </span>
                  </button>
                );
              })}
            </div>

            <Button
              onClick={() => setStep(3)}
              disabled={!canProceedStep2}
              className="w-full h-12 text-base"
            >
              Continue
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Step 3: Preferences */}
        {step === 3 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="text-center mb-8">
              <Sparkles className="h-12 w-12 text-primary mx-auto mb-4" />
              <h2 className="font-serif text-2xl font-semibold text-foreground mb-2">
                You're all set, {name}!
              </h2>
              <p className="text-muted-foreground">
                One last thing...
              </p>
            </div>

            <div className="bg-card border border-border rounded-lg p-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-foreground mb-1">
                    Daily Wisdom Email
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Receive one verse each morning
                  </p>
                </div>
                <Switch
                  checked={dailyEmailEnabled}
                  onCheckedChange={setDailyEmailEnabled}
                />
              </div>
            </div>

            <div className="bg-primary/5 border border-primary/20 rounded-lg p-5 text-center">
              <p className="text-sm text-muted-foreground mb-2">
                Your selected challenges:
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {selectedChallenges.map((id) => {
                  const challenge = challenges.find((c) => c.id === id);
                  return challenge ? (
                    <span
                      key={id}
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm"
                    >
                      {challenge.icon} {challenge.label}
                    </span>
                  ) : null;
                })}
              </div>
            </div>

            <Button
              onClick={handleComplete}
              className="w-full h-12 text-base"
            >
              Begin Your Journey
              <Sparkles className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Onboarding;
