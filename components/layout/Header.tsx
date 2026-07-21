'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Heart, BookOpen, Compass, Sun, Settings, LogOut, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
      {/* Desktop Header */}
      <header className="sticky top-0 z-50 w-full glass border-b border-border/40">
        <div className="page-container">
          <div className="flex h-14 sm:h-16 md:h-20 items-center justify-between">
            {/* Logo */}
            <Link href="/home" className="flex items-center gap-2 sm:gap-3 group">
              <div className="flex h-8 w-8 sm:h-10 sm:w-10 md:h-11 md:w-11 items-center justify-center rounded-lg sm:rounded-xl bg-primary shadow-md group-hover:shadow-lg transition-shadow">
                <span className="font-sanskrit text-base sm:text-lg md:text-xl text-primary-foreground">ॐ</span>
              </div>
              <div className="flex flex-col">
                <span className="text-base sm:text-xl md:text-2xl font-bold text-foreground tracking-tight">
                  <span className="hidden xs:inline">Bhagavad Gita </span>Wisdom
                </span>
                <span className="text-xs text-muted-foreground hidden md:block">
                  Ancient wisdom, modern life
                </span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center">
              <div className="flex items-center bg-secondary/50 rounded-full p-1.5">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      href={item.path}
                      className={cn(
                        'flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-200',
                        isActive
                          ? 'bg-primary text-primary-foreground shadow-md'
                          : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </nav>

            {/* User Avatar Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-full touch-target">
                  <Avatar className="h-8 w-8 sm:h-10 sm:w-10 md:h-11 md:w-11 cursor-pointer border-2 border-border hover:border-primary transition-colors">
                    <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.display_name || 'User'} />
                    <AvatarFallback className="bg-primary text-primary-foreground font-medium text-sm sm:text-base">
                      {getInitials()}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-popover border border-border shadow-lg z-50">
                <div className="px-3 py-2">
                  <p className="text-sm font-medium text-foreground">
                    {profile?.display_name || 'User'}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {user?.email}
                  </p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/settings" className="flex items-center gap-2 cursor-pointer">
                    <Settings className="h-4 w-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={handleSignOut}
                  className="flex items-center gap-2 cursor-pointer text-destructive focus:text-destructive"
                >
                  <LogOut className="h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 glass border-t border-border/40 pb-safe">
        <div className="flex items-center justify-around py-1.5 sm:py-2 px-1 sm:px-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.path;
            return (
              <Link
                key={item.path}
                href={item.path}
                className={cn(
                  'flex flex-col items-center gap-0.5 sm:gap-1 px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-medium transition-all duration-200 min-w-[48px] sm:min-w-[60px] touch-target',
                  isActive 
                    ? 'text-primary bg-primary/10' 
                    : 'text-muted-foreground hover:text-foreground active:bg-secondary/50'
                )}
              >
                <Icon className={cn('h-5 w-5 sm:h-5 sm:w-5', isActive && 'scale-110')} />
                <span>{item.label}</span>
              </Link>
            );
          })}
          {/* Mobile profile icon */}
          <Link
            href="/settings"
            className={cn(
              'flex flex-col items-center gap-0.5 sm:gap-1 px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-medium transition-all duration-200 min-w-[48px] sm:min-w-[60px] touch-target',
              pathname === '/settings' 
                ? 'text-primary bg-primary/10' 
                : 'text-muted-foreground hover:text-foreground active:bg-secondary/50'
            )}
          >
            <User className={cn('h-5 w-5 sm:h-5 sm:w-5', pathname === '/settings' && 'scale-110')} />
            <span>Profile</span>
          </Link>
        </div>
      </nav>
    </>
  );
};

export default Header;
