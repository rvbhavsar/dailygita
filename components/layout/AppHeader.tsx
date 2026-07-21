'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LogOut, Menu, Settings, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useSidebar } from '@/contexts/SidebarContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import ThemeToggleButton from '@/components/common/ThemeToggleButton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const AppHeader = () => {
  const router = useRouter();
  const { user, profile, signOut } = useAuth();
  const { isMobileOpen, toggleSidebar, toggleMobileSidebar } = useSidebar();

  // One control, two meanings: on desktop it collapses the sidebar to an icon
  // rail; on mobile there is no rail, so it opens and closes the drawer.
  const handleToggle = () => {
    if (window.innerWidth >= 1024) toggleSidebar();
    else toggleMobileSidebar();
  };

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
    if (user?.email) return user.email[0].toUpperCase();
    return 'U';
  };

  return (
    <header className="glass-surface sticky top-0 z-50 flex w-full border-b">
      <div className="flex w-full items-center justify-between gap-4 px-4 py-3 md:px-6">
        <button
          type="button"
          onClick={handleToggle}
          aria-label={isMobileOpen ? 'Close navigation' : 'Toggle navigation'}
          aria-expanded={isMobileOpen}
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition-colors duration-150 hover:bg-gray-100 hover:text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:border-gray-800 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
        >
          {isMobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>

        <Link
          href="/home"
          className="flex items-center gap-3 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:hidden"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-500 text-white shadow-cta">
            <span className="font-sanskrit text-lg leading-none">ॐ</span>
          </span>
          <span className="font-display text-base font-semibold text-gray-800 dark:text-white">
            Gita Wisdom
          </span>
        </Link>

        <div className="flex items-center gap-2 lg:ml-auto">
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
            <DropdownMenuContent align="end" className="glass-popover z-50 w-56 border p-2">
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
                  <Settings className="menu-item-icon-inactive h-5 w-5" />
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
    </header>
  );
};

export default AppHeader;
