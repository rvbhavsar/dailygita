import { ReactNode } from 'react';
import Header from './Header';

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container pb-24 md:pb-8 pt-6">
        {children}
      </main>
    </div>
  );
};

export default Layout;
