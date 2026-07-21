import { redirect } from 'next/navigation';
import { getSessionProfile } from '@/lib/session';

// Replaces ProtectedRoute: requires auth AND completed onboarding.
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSessionProfile();

  if (!session) redirect('/auth');
  if (!session.isOnboarded) redirect('/onboarding');

  return <>{children}</>;
}
