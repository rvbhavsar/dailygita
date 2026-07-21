import { ReactNode } from 'react';
import Header from './Header';

interface LayoutProps {
  children: ReactNode;
  fullWidth?: boolean;
}

const Layout = ({ children, fullWidth = false }: LayoutProps) => {
  return (
    // No background here — the fixed ambient canvas mounted in the root layout
    // shows through the gaps between glass chrome and content cards.
    <div className="min-h-screen">
      <Header />
      <main className="page-container pb-28 pt-6 md:pb-12 md:pt-8">
        <div className={fullWidth ? 'content-container' : 'reading-container'}>{children}</div>
      </main>
    </div>
  );
};

export default Layout;
