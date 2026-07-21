'use client';

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';

type SidebarContextType = {
  isExpanded: boolean;
  isMobileOpen: boolean;
  isHovered: boolean;
  toggleSidebar: () => void;
  toggleMobileSidebar: () => void;
  closeMobileSidebar: () => void;
  setIsHovered: (isHovered: boolean) => void;
};

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) throw new Error('useSidebar must be used within a SidebarProvider');
  return context;
};

const STORAGE_KEY = 'sidebar-expanded';

export const SidebarProvider = ({ children }: { children: ReactNode }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Restore after mount rather than in the initial state — reading
  // localStorage during render would diverge from the server HTML.
  useEffect(() => {
    if (localStorage.getItem(STORAGE_KEY) === 'false') setIsExpanded(false);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (!mobile) setIsMobileOpen(false);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleSidebar = useCallback(() => {
    setIsExpanded((prev) => {
      localStorage.setItem(STORAGE_KEY, String(!prev));
      return !prev;
    });
  }, []);

  const toggleMobileSidebar = useCallback(() => setIsMobileOpen((prev) => !prev), []);
  const closeMobileSidebar = useCallback(() => setIsMobileOpen(false), []);

  return (
    <SidebarContext.Provider
      value={{
        // Collapsed rail is a desktop affordance; on mobile the sidebar is a
        // drawer that is either open or gone.
        isExpanded: isMobile ? false : isExpanded,
        isMobileOpen,
        isHovered,
        toggleSidebar,
        toggleMobileSidebar,
        closeMobileSidebar,
        setIsHovered,
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
};
