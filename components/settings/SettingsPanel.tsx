'use client';

import { useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Bell, Compass, Loader2, LogOut, Palette, ShieldCheck, UserCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import ThemePreviewCard, { type ThemePreference } from './ThemePreviewCard';
import { useAuth } from '@/contexts/AuthContext';
import { challenges } from '@/data/challenges';
import { Challenge } from '@/types';
import { cn } from '@/lib/utils';

type SectionId = 'general' | 'profile' | 'practice' | 'notifications' | 'account';

const SECTIONS: { id: SectionId; label: string; icon: typeof Palette }[] = [
  { id: 'general', label: 'General', icon: Palette },
  { id: 'profile', label: 'Your profile', icon: UserCircle },
  { id: 'practice', label: 'Practice', icon: Compass },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'account', label: 'Account', icon: ShieldCheck },
];

const card = 'rounded-2xl border border-gray-200 bg-card p-5 dark:border-gray-800';

const SectionHeader = ({ title, description }: { title: string; description: string }) => (
  <div className="mb-5">
    <h2 className="font-display text-2xl font-semibold text-gray-800 dark:text-white">{title}</h2>
    <p className="mt-0.5 text-theme-sm text-gray-500 dark:text-gray-400">{description}</p>
  </div>
);

const Field = ({ label, value }: { label: string; value: ReactNode }) => (
  <div className="flex items-center justify-between gap-4 py-2.5">
    <span className="text-theme-sm text-gray-500 dark:text-gray-400">{label}</span>
    <span className="text-theme-sm font-medium text-gray-800 dark:text-white">{value}</span>
  </div>
);

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

const profileSchema = z.object({
  displayName: z.string().trim().min(1, 'Name is required'),
  age: z.string().optional(),
  profession: z.string().optional(),
  maritalStatus: z.string().optional(),
});

const SettingsPanel = () => {
  const router = useRouter();
  const { user, profile, signOut, updatePassword, updateProfile } = useAuth();
  const { theme, setTheme } = useTheme();
  const [active, setActive] = useState<SectionId>('general');
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
      displayName: profile?.display_name || '',
      age: profile?.age?.toString() || '',
      profession: profile?.profession || '',
      maritalStatus: profile?.marital_status || '',
    },
  });

  // The (app) route-group layout already guarantees an authenticated, onboarded
  // session server-side. This only covers the brief client-side window before
  // AuthContext has loaded — redirecting here would be a setState-during-render
  // error.
  if (!user || !profile) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  const toggleChallenge = async (id: Challenge) => {
    const current = profile.selected_challenges ?? [];
    const next = current.includes(id) ? current.filter((c) => c !== id) : [...current, id];

    if (next.length === 0) {
      toast.error('Select at least one challenge');
      return;
    }

    const { error } = await updateProfile({ selected_challenges: next });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success('Preferences updated');
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/auth');
    toast.success('Logged out successfully');
  };

  const handlePasswordChange = async (values: z.infer<typeof passwordSchema>) => {
    setIsUpdatingPassword(true);
    const { error } = await updatePassword(values.currentPassword, values.newPassword);
    setIsUpdatingPassword(false);

    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success('Password updated successfully');
    passwordForm.reset();
    setShowPasswordForm(false);
  };

  const handleDailyVerseToggle = async (checked: boolean) => {
    const { error } = await updateProfile({ daily_verse_enabled: checked });
    if (error) toast.error('Failed to update preference');
    else toast.success(checked ? 'Daily emails enabled' : 'Daily emails disabled');
  };

  const handleProfileUpdate = async (values: z.infer<typeof profileSchema>) => {
    setIsUpdatingProfile(true);
    const { error } = await updateProfile({
      display_name: values.displayName,
      age: values.age ? parseInt(values.age) : null,
      profession: values.profession || null,
      marital_status: values.maritalStatus || null,
    });
    setIsUpdatingProfile(false);

    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success('Profile updated successfully');
    setShowProfileForm(false);
  };

  const maritalStatusLabel = (status: string | null | undefined) =>
    status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Not set';

  const generalSection = (
    <div>
      <SectionHeader title="General" description="How Daily Gita looks on this device." />
      <div className={card}>
        <p className="mb-1 text-theme-sm font-semibold text-gray-800 dark:text-white">Theme</p>
        <p className="mb-5 text-theme-xs text-gray-500 dark:text-gray-400">
          Choose a look, or follow your system setting.
        </p>
        <div className="grid max-w-[480px] grid-cols-3 gap-3">
          {(['system', 'light', 'dark'] as ThemePreference[]).map((id) => (
            <ThemePreviewCard
              key={id}
              variant={id}
              active={theme === id}
              onClick={() => setTheme(id)}
            />
          ))}
        </div>
      </div>
    </div>
  );

  const profileSection = (
    <div>
      <SectionHeader
        title="Your profile"
        description="Used to tailor personalized insights to your life."
      />
      <div className={card}>
        {!showProfileForm ? (
          <>
            <div className="divide-y divide-gray-200 dark:divide-gray-800">
              <Field label="Name" value={profile.display_name || 'Not set'} />
              <Field label="Age" value={profile.age || 'Not set'} />
              <Field label="Profession" value={profile.profession || 'Not set'} />
              <Field label="Marital status" value={maritalStatusLabel(profile.marital_status)} />
            </div>
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => {
                profileForm.reset({
                  displayName: profile.display_name || '',
                  age: profile.age?.toString() || '',
                  profession: profile.profession || '',
                  maritalStatus: profile.marital_status || '',
                });
                setShowProfileForm(true);
              }}
            >
              Edit profile
            </Button>
          </>
        ) : (
          <Form {...profileForm}>
            <form onSubmit={profileForm.handleSubmit(handleProfileUpdate)} className="space-y-5">
              <div className="grid grid-cols-1 gap-x-5 gap-y-4 sm:grid-cols-2">
                <FormField
                  control={profileForm.control}
                  name="displayName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Your name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={profileForm.control}
                  name="age"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Age</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="Your age" {...field} />
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
                        <Input placeholder="e.g. Engineer, Teacher" {...field} />
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
                      <FormLabel>Marital status</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
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
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={isUpdatingProfile}>
                  {isUpdatingProfile ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save changes'}
                </Button>
                <Button type="button" variant="ghost" onClick={() => setShowProfileForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </Form>
        )}
      </div>
    </div>
  );

  const practiceSection = (
    <div>
      <SectionHeader
        title="Practice"
        description="We'll prioritize verses that speak to these areas."
      />
      <div className={card}>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {challenges.map((challenge) => {
            const isSelected = (profile.selected_challenges ?? []).includes(challenge.id);
            return (
              <button
                key={challenge.id}
                onClick={() => toggleChallenge(challenge.id)}
                aria-pressed={isSelected}
                className={cn(
                  'flex items-center gap-3 rounded-lg border p-3 text-left transition-colors duration-150',
                  isSelected
                    ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-500/[0.12] dark:text-brand-400'
                    : 'border-gray-200 text-gray-700 hover:border-gray-300 dark:border-gray-800 dark:text-gray-300 dark:hover:border-gray-700'
                )}
              >
                <span className="text-theme-sm font-medium">{challenge.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );

  const notificationsSection = (
    <div>
      <SectionHeader title="Notifications" description="What Daily Gita sends you, and when." />
      <div className={card}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-theme-sm font-semibold text-gray-800 dark:text-white">
              Daily wisdom email
            </p>
            <p className="mt-0.5 text-theme-xs text-gray-500 dark:text-gray-400">
              Receive one verse each morning.
            </p>
          </div>
          <Switch
            checked={profile.daily_verse_enabled}
            onCheckedChange={handleDailyVerseToggle}
            aria-label="Daily wisdom email"
          />
        </div>
      </div>
    </div>
  );

  const accountSection = (
    <div>
      <SectionHeader title="Account" description="Sign-in details and session." />

      <div className={cn(card, 'mb-4')}>
        <Field label="Email" value={user.email} />
      </div>

      <div className={cn(card, 'mb-4')}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-theme-sm font-semibold text-gray-800 dark:text-white">Password</p>
            <p className="mt-0.5 text-theme-xs text-gray-500 dark:text-gray-400">
              Change the password you use to sign in.
            </p>
          </div>
          {!showPasswordForm && (
            <Button variant="outline" size="sm" onClick={() => setShowPasswordForm(true)}>
              Change
            </Button>
          )}
        </div>

        {showPasswordForm && (
          <Form {...passwordForm}>
            <form
              onSubmit={passwordForm.handleSubmit(handlePasswordChange)}
              className="mt-5 max-w-md space-y-4"
            >
              <FormField
                control={passwordForm.control}
                name="currentPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
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
                    <FormLabel>New password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
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
                    <FormLabel>Confirm new password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex gap-2">
                <Button type="submit" disabled={isUpdatingPassword}>
                  {isUpdatingPassword ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Update password'
                  )}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    passwordForm.reset();
                    setShowPasswordForm(false);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </Form>
        )}
      </div>

      <div className={card}>
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-theme-sm font-semibold text-gray-800 dark:text-white">Sign out</p>
            <p className="mt-0.5 text-theme-xs text-gray-500 dark:text-gray-400">
              End your session on this device.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={handleSignOut}>
            <LogOut className="h-4 w-4" />
            Log out
          </Button>
        </div>
      </div>
    </div>
  );

  const sections: Record<SectionId, ReactNode> = {
    general: generalSection,
    profile: profileSection,
    practice: practiceSection,
    notifications: notificationsSection,
    account: accountSection,
  };

  return (
    <div className="flex flex-col lg:flex-row">
      <aside className="hidden w-[200px] shrink-0 flex-col border-r border-gray-200 pr-3 dark:border-gray-800 lg:flex">
        <p className="px-3 pb-2 text-theme-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
          Settings
        </p>
        <nav className="flex flex-col gap-1" aria-label="Settings sections">
          {SECTIONS.map((s) => {
            const Icon = s.icon;
            const isActive = active === s.id;
            return (
              <button
                key={s.id}
                onClick={() => setActive(s.id)}
                aria-current={isActive ? 'true' : undefined}
                className={cn('menu-item', isActive ? 'menu-item-active' : 'menu-item-inactive')}
              >
                <Icon
                  className={cn(
                    'h-5 w-5 shrink-0',
                    isActive ? 'menu-item-icon-active' : 'menu-item-icon-inactive'
                  )}
                />
                <span className="flex-1 truncate text-left">{s.label}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Below lg the rail becomes a scrollable tab strip. */}
      <div className="hide-scrollbar mb-5 flex items-center gap-1 overflow-x-auto border-b border-gray-200 pb-2 dark:border-gray-800 lg:hidden">
        {SECTIONS.map((s) => {
          const isActive = active === s.id;
          return (
            <button
              key={s.id}
              onClick={() => setActive(s.id)}
              aria-current={isActive ? 'true' : undefined}
              className={cn(
                'shrink-0 rounded-lg px-3 py-1.5 text-theme-sm font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                isActive
                  ? 'bg-brand-50 text-brand-700 dark:bg-brand-500/[0.12] dark:text-brand-400'
                  : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5'
              )}
            >
              {s.label}
            </button>
          );
        })}
      </div>

      <div className="min-w-0 flex-1 lg:pl-6">{sections[active]}</div>
    </div>
  );
};

export default SettingsPanel;
