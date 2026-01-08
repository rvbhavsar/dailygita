import { Link, useLocation } from 'react-router-dom';
import { Heart, BookOpen, Compass, Settings, Sun, Menu } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { path: '/', label: 'Today', icon: Sun },
  { path: '/browse', label: 'Browse', icon: BookOpen },
  { path: '/challenges', label: 'Challenges', icon: Compass },
  { path: '/favorites', label: 'Saved', icon: Heart },
];

const Header = () => {
  const location = useLocation();

  return (
    <>
      {/* Desktop Header */}
      <header className="sticky top-0 z-50 w-full glass border-b border-border/40">
        <div className="page-container">
          <div className="flex h-16 md:h-20 items-center justify-between">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3 group">
              <div className="flex h-10 w-10 md:h-11 md:w-11 items-center justify-center rounded-xl bg-primary shadow-md group-hover:shadow-lg transition-shadow">
                <span className="font-sanskrit text-lg md:text-xl text-primary-foreground">ॐ</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xl md:text-2xl font-bold text-foreground tracking-tight">
                  Daily Gita
                </span>
                <span className="text-xs text-muted-foreground hidden sm:block">
                  Ancient wisdom, modern life
                </span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center">
              <div className="flex items-center bg-secondary/50 rounded-full p-1.5">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
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

            {/* Settings */}
            <Link
              to="/settings"
              className={cn(
                'flex h-10 w-10 md:h-11 md:w-11 items-center justify-center rounded-xl transition-all duration-200',
                location.pathname === '/settings'
                  ? 'bg-primary text-primary-foreground shadow-md'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
              )}
            >
              <Settings className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 glass border-t border-border/40 pb-safe">
        <div className="flex items-center justify-around py-2 px-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  'flex flex-col items-center gap-1 px-4 py-2 rounded-xl text-xs font-medium transition-all duration-200 min-w-[60px]',
                  isActive 
                    ? 'text-primary bg-primary/10' 
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Icon className={cn('h-5 w-5', isActive && 'scale-110')} />
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
