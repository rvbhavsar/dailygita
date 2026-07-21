'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookOpen, Compass, Heart, MessageCircle, Settings, Sun, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSidebar } from '@/contexts/SidebarContext';

type NavItem = { name: string; path: string; icon: LucideIcon };

// Flat, no submenus. The template's collapsible groups exist because it has
// ~80 admin destinations; this app has five, and nesting them would add a
// click to reach every page.
const menuItems: NavItem[] = [
  { name: 'Today', path: '/home', icon: Sun },
  { name: 'Browse', path: '/browse', icon: BookOpen },
  { name: 'Challenges', path: '/challenges', icon: Compass },
  { name: 'Saved', path: '/favorites', icon: Heart },
  { name: 'Ask', path: '/chat', icon: MessageCircle },
];

const accountItems: NavItem[] = [{ name: 'Settings', path: '/settings', icon: Settings }];

const AppSidebar = () => {
  const pathname = usePathname();
  const { isExpanded, isMobileOpen, isHovered, setIsHovered, closeMobileSidebar } = useSidebar();

  // When collapsed to the icon rail, hovering temporarily expands it.
  const showLabels = isExpanded || isHovered || isMobileOpen;

  const isActive = (path: string) => pathname === path || pathname.startsWith(`${path}/`);

  const renderItems = (items: NavItem[]) => (
    <ul className="flex flex-col gap-1">
      {items.map((item) => {
        const Icon = item.icon;
        const active = isActive(item.path);
        return (
          <li key={item.path}>
            <Link
              href={item.path}
              onClick={closeMobileSidebar}
              aria-current={active ? 'page' : undefined}
              title={showLabels ? undefined : item.name}
              className={cn(
                'menu-item group',
                active ? 'menu-item-active' : 'menu-item-inactive',
                !showLabels && 'lg:justify-center'
              )}
            >
              <Icon
                className={cn(
                  'h-5 w-5 shrink-0',
                  active ? 'menu-item-icon-active' : 'menu-item-icon-inactive'
                )}
              />
              {showLabels && <span>{item.name}</span>}
            </Link>
          </li>
        );
      })}
    </ul>
  );

  const sectionLabel = (label: string) =>
    showLabels ? (
      <h2 className="mb-3 px-3 text-theme-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
        {label}
      </h2>
    ) : (
      <div className="mb-3 flex justify-center">
        <span className="h-px w-6 rounded-full bg-gray-200 dark:bg-gray-700" />
      </div>
    );

  return (
    <aside
      className={cn(
        // Below lg the drawer starts under the header (mt-16) and sits beneath
        // it in the stack, so the header's close button stays reachable while
        // the drawer is open. On lg+ it's a full-height fixed rail.
        'glass-surface fixed left-0 top-0 z-40 mt-16 flex h-[calc(100vh-4rem)] flex-col border-r px-4 transition-all duration-300 ease-out lg:mt-0 lg:h-screen lg:translate-x-0',
        showLabels ? 'w-[260px] lg:w-[240px]' : 'w-[80px]',
        isMobileOpen ? 'translate-x-0' : '-translate-x-full'
      )}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={cn('hidden h-16 shrink-0 items-center lg:flex', !showLabels && 'lg:justify-center')}>
        <Link
          href="/home"
          onClick={closeMobileSidebar}
          className="flex items-center gap-3 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-500 text-white shadow-cta">
            <span className="font-sanskrit text-xl leading-none">ॐ</span>
          </span>
          {showLabels && (
            // min-w-0 + truncate: the rail is only 240px, and without these the
            // tagline wraps to two lines and shoves the mark out of alignment.
            <span className="flex min-w-0 flex-col">
              <span className="truncate font-display text-base font-semibold text-gray-800 dark:text-white">
                Gita Wisdom
              </span>
              <span className="truncate text-theme-xs text-gray-500 dark:text-gray-400">
                Ancient wisdom, modern life
              </span>
            </span>
          )}
        </Link>
      </div>

      <nav className="no-scrollbar flex flex-col gap-6 overflow-y-auto py-4">
        <div>
          {sectionLabel('Read')}
          {renderItems(menuItems)}
        </div>
        <div>
          {sectionLabel('Account')}
          {renderItems(accountItems)}
        </div>
      </nav>
    </aside>
  );
};

export default AppSidebar;
