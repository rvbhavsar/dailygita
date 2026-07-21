'use client';

import { useSidebar } from '@/contexts/SidebarContext';

/** Dims and closes the mobile sidebar drawer. Desktop never shows it. */
const Backdrop = () => {
  const { isMobileOpen, closeMobileSidebar } = useSidebar();

  if (!isMobileOpen) return null;

  return (
    <div
      className="fixed inset-0 z-30 bg-gray-900/50 lg:hidden"
      onClick={closeMobileSidebar}
      aria-hidden="true"
    />
  );
};

export default Backdrop;
