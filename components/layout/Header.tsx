'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Heart, BookOpen, Compass, Sun, Settings, LogOut, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import ThemeToggleButton from '@/components/common/ThemeToggleButton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const navItems = [
  { path: '/home', label: 'Today', icon: Sun },
  { path: '/browse', label: 'Browse', icon: BookOpen },
  { path: '/challenges', label: 'Challenges', icon: Compass },
  { path: '/favorites', label: 'Saved', icon: Heart },
];

const Header = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { user, profile, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  const getInitials = () => {
    if (profile?.display_name) {
      return profile.display_name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    if (user?.email) {
      return user.email[0].toUpperCase();
    }
    return 'U';
  };

  return (
    <>
      {/* Standing chrome — glass over the ambient backdrop, hairline bottom rule. */}
      <header className="glass-surface sticky top-0 z-50 w-full border-b">
        <div className="page-container">
          <div className="flex h-16 items-center justify-between gap-4">
            {/* Daily Gita's own mark. The ॐ is set in the Devanagari face,
                never in the Latin display type. */}
            <Link
              href="/home"
              className="flex items-center gap-3 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-500 text-white shadow-cta">
                <span className="font-sanskrit text-xl leading-none">ॐ</span>
              </span>
              <span className="flex flex-col">
                <span className="font-display text-base font-semibold text-gray-800 dark:text-white">
                  <span className="hidden xs:inline">Bhagavad Gita </span>Wisdom
                </span>
                <span className="hidden text-theme-xs text-gray-500 dark:text-gray-400 md:block">
                  Ancient wisdom, modern life
                </span>
              </span>
            </Link>

            <nav className="hidden items-center gap-1 md:flex">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    href={item.path}
                    aria-current={isActive ? 'page' : undefined}
                    className={cn(
                      'menu-item group w-auto',
                      isActive ? 'menu-item-active' : 'menu-item-inactive'
                    )}
                  >
                    <Icon
                      className={cn(
                        'h-5 w-5',
                        isActive ? 'menu-item-icon-active' : 'menu-item-icon-inactive'
                      )}
                    />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <div className="flex items-center gap-2">
              <ThemeToggleButton />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    aria-label="Account menu"
                    className="flex items-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <Avatar className="h-10 w-10 cursor-pointer border border-gray-200 transition-colors duration-150 hover:border-gray-300 dark:border-gray-800 dark:hover:border-gray-700">
                      <AvatarImage
                        src={profile?.avatar_url || undefined}
                        alt={profile?.display_name || 'User'}
                      />
                      <AvatarFallback className="bg-brand-50 text-theme-sm font-semibold text-brand-700 dark:bg-brand-500/[0.12] dark:text-brand-400">
                        {getInitials()}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="glass-popover z-50 w-56 border p-2"
                >
                  <div className="px-3 py-2">
                    <p className="text-theme-sm font-medium text-gray-800 dark:text-white">
                      {profile?.display_name || 'User'}
                    </p>
                    <p className="truncate text-theme-xs text-gray-500 dark:text-gray-400">
                      {user?.email}
                    </p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/settings" className="menu-item menu-item-inactive cursor-pointer">
                      <Settings className="h-5 w-5 menu-item-icon-inactive" />
                      Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={handleSignOut}
                    className="menu-item cursor-pointer text-error-600 hover:bg-error-50 focus:bg-error-50 focus:text-error-700 dark:text-error-400 dark:hover:bg-error-500/10"
                  >
                    <LogOut className="h-5 w-5" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile bottom nav — the same glass material and menu vocabulary as the
          header, laid out for thumbs. */}
      <nav className="glass-surface pb-safe fixed bottom-0 left-0 right-0 z-50 border-t md:hidden">
        <div className="flex items-stretch justify-around px-2 py-1.5">
          {[...navItems, { path: '/settings', label: 'Profile', icon: User }].map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.path;
            return (
              <Link
                key={item.path}
                href={item.path}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'touch-target flex min-w-[56px] flex-col items-center justify-center gap-1 rounded-lg px-2 py-1.5 text-theme-xs font-medium transition-colors duration-150',
                  isActive
                    ? 'menu-item-active'
                    : 'text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/5'
                )}
              >
                <Icon
                  className={cn('h-5 w-5', isActive && 'menu-item-icon-active')}
                />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
};

export default Header;
