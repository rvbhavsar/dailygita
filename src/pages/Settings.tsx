import { useState } from 'react';
import { ArrowLeft, LogOut, Lock, Loader2, Bell, Calendar, Briefcase, Heart } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Layout from '@/components/layout/Layout';
import { useUser } from '@/contexts/UserContext';
import { useAuth } from '@/contexts/AuthContext';
import { challenges } from '@/data/challenges';
import { Challenge } from '@/types';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

const profileSchema = z.object({
  age: z.string().optional(),
  profession: z.string().optional(),
  maritalStatus: z.string().optional(),
});

const Settings = () => {
  const navigate = useNavigate();
  const { user, updateUser, setUser } = useUser();
  const { user: authUser, profile, signOut, updatePassword, updateProfile } = useAuth();
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [showProfileForm, setShowProfileForm] = useState(false);

  const passwordForm = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });

  const profileForm = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: { 
      age: profile?.age?.toString() || '', 
      profession: profile?.profession || '', 
      maritalStatus: profile?.marital_status || '' 
    },
  });

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

  const handleLogout = async () => {
    await signOut();
    setUser(null);
    localStorage.removeItem('dailygita_favorites');
    navigate('/auth');
    toast.success('Logged out successfully');
  };

  const handlePasswordChange = async (values: z.infer<typeof passwordSchema>) => {
    setIsUpdatingPassword(true);
    const { error } = await updatePassword(values.newPassword);
    setIsUpdatingPassword(false);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Password updated successfully');
      passwordForm.reset();
      setShowPasswordForm(false);
    }
  };

  const handleDailyVerseToggle = async (checked: boolean) => {
    updateUser({ dailyEmailEnabled: checked });
    const { error } = await updateProfile({ daily_verse_enabled: checked });
    
    if (error) {
      updateUser({ dailyEmailEnabled: !checked });
      toast.error('Failed to update preference');
    } else {
      toast.success(checked ? 'Daily emails enabled' : 'Daily emails disabled');
    }
  };

  const handleProfileUpdate = async (values: z.infer<typeof profileSchema>) => {
    setIsUpdatingProfile(true);
    const { error } = await updateProfile({
      age: values.age ? parseInt(values.age) : null,
      profession: values.profession || null,
      marital_status: values.maritalStatus || null,
    });
    setIsUpdatingProfile(false);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Profile updated successfully');
      setShowProfileForm(false);
    }
  };

  const getMaritalStatusLabel = (status: string | null | undefined) => {
    if (!status) return 'Not set';
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  return (
    <Layout>
      <div className="space-y-8">
        {/* Back Button */}
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="-ml-2 rounded-full"
        >
          <Link to="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
        </Button>

        <section>
          <h1 className="font-serif mb-2">Settings</h1>
          <p className="text-muted-foreground">Manage your account and preferences</p>
        </section>

        {/* Account Info */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>Account</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between py-2">
              <span className="text-muted-foreground">Name</span>
              <span className="font-medium">{profile?.display_name || user.name}</span>
            </div>
            <Separator />
            <div className="flex items-center justify-between py-2">
              <span className="text-muted-foreground">Email</span>
              <span className="font-medium">{authUser?.email || user.email}</span>
            </div>
          </CardContent>
        </Card>

        {/* Profile Info */}
        <Card className="border-border/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Profile</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  profileForm.reset({
                    age: profile?.age?.toString() || '',
                    profession: profile?.profession || '',
                    maritalStatus: profile?.marital_status || '',
                  });
                  setShowProfileForm(!showProfileForm);
                }}
                className="rounded-full"
              >
                {showProfileForm ? 'Cancel' : 'Edit'}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {!showProfileForm ? (
              <>
                <div className="flex items-center justify-between py-2">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Age
                  </span>
                  <span className="font-medium">{profile?.age || 'Not set'}</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between py-2">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <Briefcase className="h-4 w-4" />
                    Profession
                  </span>
                  <span className="font-medium">{profile?.profession || 'Not set'}</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between py-2">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <Heart className="h-4 w-4" />
                    Marital Status
                  </span>
                  <span className="font-medium">{getMaritalStatusLabel(profile?.marital_status)}</span>
                </div>
              </>
            ) : (
              <Form {...profileForm}>
                <form onSubmit={profileForm.handleSubmit(handleProfileUpdate)} className="space-y-5">
                  <FormField
                    control={profileForm.control}
                    name="age"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Age</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input type="number" placeholder="Your age" className="pl-10 rounded-xl" {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={profileForm.control}
                    name="profession"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Profession</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Briefcase className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="e.g., Engineer, Teacher" className="pl-10 rounded-xl" {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={profileForm.control}
                    name="maritalStatus"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Marital Status</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="pl-10 rounded-xl">
                              <Heart className="absolute left-3 h-4 w-4 text-muted-foreground" />
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="single">Single</SelectItem>
                            <SelectItem value="married">Married</SelectItem>
                            <SelectItem value="divorced">Divorced</SelectItem>
                            <SelectItem value="widowed">Widowed</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" disabled={isUpdatingProfile} className="rounded-full">
                    {isUpdatingProfile ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      'Save Profile'
                    )}
                  </Button>
                </form>
              </Form>
            )}
          </CardContent>
        </Card>

        {/* Password Settings */}
        <Card className="border-border/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-4 w-4" />
                Password
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPasswordForm(!showPasswordForm)}
                className="rounded-full"
              >
                {showPasswordForm ? 'Cancel' : 'Change'}
              </Button>
            </div>
          </CardHeader>
          {showPasswordForm && (
            <CardContent>
              <Form {...passwordForm}>
                <form onSubmit={passwordForm.handleSubmit(handlePasswordChange)} className="space-y-5">
                  <FormField
                    control={passwordForm.control}
                    name="currentPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Current Password</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="••••••••" className="rounded-xl" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={passwordForm.control}
                    name="newPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>New Password</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="••••••••" className="rounded-xl" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={passwordForm.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm New Password</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="••••••••" className="rounded-xl" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" disabled={isUpdatingPassword} className="rounded-full">
                    {isUpdatingPassword ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      'Update Password'
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          )}
        </Card>

        {/* Daily Email */}
        <Card className="border-border/50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Bell className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <Label htmlFor="daily-email" className="font-semibold text-base">
                    Daily Wisdom Email
                  </Label>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Receive one verse each morning
                  </p>
                </div>
              </div>
              <Switch
                id="daily-email"
                checked={profile?.daily_verse_enabled ?? user.dailyEmailEnabled}
                onCheckedChange={handleDailyVerseToggle}
              />
            </div>
          </CardContent>
        </Card>

        {/* Challenges */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>Your Challenges</CardTitle>
            <p className="text-sm text-muted-foreground">
              We'll prioritize verses for these areas
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {challenges.map((challenge) => {
                const isSelected = user.selectedChallenges.includes(challenge.id);
                return (
                  <button
                    key={challenge.id}
                    onClick={() => toggleChallenge(challenge.id)}
                    className={cn(
                      'p-4 rounded-xl border text-left transition-all duration-200 flex items-center gap-3',
                      isSelected
                        ? 'border-primary bg-primary/5 text-foreground shadow-sm'
                        : 'border-border bg-card text-muted-foreground hover:border-primary/50 hover:bg-secondary/50'
                    )}
                  >
                    <span className="text-lg">{challenge.icon}</span>
                    <span className="font-medium">{challenge.label}</span>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Separator />

        {/* Logout */}
        <Button
          variant="outline"
          className="w-full rounded-xl text-destructive hover:text-destructive hover:bg-destructive/10 h-12"
          onClick={handleLogout}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Log Out
        </Button>

        <p className="text-center text-xs text-muted-foreground pb-4">
          Daily Gita • Ancient wisdom for modern life
        </p>
      </div>
    </Layout>
  );
};

export default Settings;
