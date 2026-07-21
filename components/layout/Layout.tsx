'use client';

import { ReactNode } from 'react';
import { useSidebar } from '@/contexts/SidebarContext';
import AppHeader from './AppHeader';
import AppSidebar from './AppSidebar';
import Backdrop from './Backdrop';

interface LayoutProps {
  children: ReactNode;
  fullWidth?: boolean;
}

const Layout = ({ children, fullWidth = false }: LayoutProps) => {
  const { isExpanded } = useSidebar();

  // The sidebar is fixed, so the content column is offset by margin. Hovering
  // the collapsed rail expands it *over* the content rather than pushing it —
  // reflowing a page of verse text on hover would be worse than the overlap.
  const contentMargin = isExpanded ? 'lg:ml-[240px]' : 'lg:ml-[80px]';

  return (
    // No background here — the fixed ambient canvas mounted in the root layout
    // shows through the gaps between glass chrome and content cards.
    <div className="min-h-screen">
      <AppSidebar />
      <Backdrop />
      <div
        className={`flex min-h-screen min-w-0 flex-col transition-all duration-300 ease-out ${contentMargin}`}
      >
        <AppHeader />
        <main className="w-full flex-1 px-4 py-6 md:px-6 md:py-8">
          <div className={fullWidth ? 'content-container' : 'reading-container'}>{children}</div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
