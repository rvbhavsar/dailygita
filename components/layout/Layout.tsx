import { ReactNode } from 'react';
import Header from './Header';

interface LayoutProps {
  children: ReactNode;
  fullWidth?: boolean;
}

const Layout = ({ children, fullWidth = false }: LayoutProps) => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className={`pb-28 md:pb-12 pt-6 md:pt-10 ${fullWidth ? 'page-container' : 'page-container'}`}>
        <div className={fullWidth ? 'content-container' : 'reading-container'}>
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
