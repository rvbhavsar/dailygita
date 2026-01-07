import { ArrowLeft, LogOut } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import Layout from '@/components/layout/Layout';
import { useUser } from '@/contexts/UserContext';
import { challenges } from '@/data/challenges';
import { Challenge } from '@/types';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const Settings = () => {
  const navigate = useNavigate();
  const { user, updateUser, setUser } = useUser();

  if (!user) {
    navigate('/');
    return null;
  }

  const toggleChallenge = (id: Challenge) => {
    const newChallenges = user.selectedChallenges.includes(id)
      ? user.selectedChallenges.filter((c) => c !== id)
      : [...user.selectedChallenges, id];
    
    if (newChallenges.length === 0) {
      toast.error('Select at least one challenge');
      return;
    }
    
    updateUser({ selectedChallenges: newChallenges });
    toast.success('Preferences updated');
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('dailygita_favorites');
    navigate('/');
    toast.success('Logged out successfully');
  };

  return (
    <Layout>
      <div className="max-w-lg mx-auto">
        {/* Back Button */}
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="mb-6 -ml-2"
        >
          <Link to="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
        </Button>

        <h1 className="font-serif text-2xl font-semibold text-foreground mb-6">
          Settings
        </h1>

        {/* Account Info */}
        <div className="bg-card border border-border rounded-lg p-5 mb-6">
          <h2 className="font-medium text-foreground mb-4">Account</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Name</span>
              <span className="text-sm text-foreground">{user.name}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Email</span>
              <span className="text-sm text-foreground">{user.email}</span>
            </div>
          </div>
        </div>

        {/* Daily Email */}
        <div className="bg-card border border-border rounded-lg p-5 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="daily-email" className="font-medium">
                Daily Wisdom Email
              </Label>
              <p className="text-sm text-muted-foreground mt-1">
                Receive one verse each morning
              </p>
            </div>
            <Switch
              id="daily-email"
              checked={user.dailyEmailEnabled}
              onCheckedChange={(checked) => {
                updateUser({ dailyEmailEnabled: checked });
                toast.success(
                  checked ? 'Daily emails enabled' : 'Daily emails disabled'
                );
              }}
            />
          </div>
        </div>

        {/* Challenges */}
        <div className="bg-card border border-border rounded-lg p-5 mb-6">
          <h2 className="font-medium text-foreground mb-2">Your Challenges</h2>
          <p className="text-sm text-muted-foreground mb-4">
            We'll prioritize verses for these areas
          </p>
          <div className="grid grid-cols-2 gap-2">
            {challenges.map((challenge) => {
              const isSelected = user.selectedChallenges.includes(challenge.id);
              return (
                <button
                  key={challenge.id}
                  onClick={() => toggleChallenge(challenge.id)}
                  className={cn(
                    'p-3 rounded-lg border text-left text-sm transition-all flex items-center gap-2',
                    isSelected
                      ? 'border-primary bg-primary/5 text-foreground'
                      : 'border-border bg-background text-muted-foreground hover:border-primary/50'
                  )}
                >
                  <span>{challenge.icon}</span>
                  <span>{challenge.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <Separator className="my-6" />

        {/* Logout */}
        <Button
          variant="outline"
          className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={handleLogout}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Log Out
        </Button>

        <p className="text-center text-xs text-muted-foreground mt-8">
          Daily Gita • Ancient wisdom for modern life
        </p>
      </div>
    </Layout>
  );
};

export default Settings;
