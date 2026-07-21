import { redirect } from 'next/navigation';
import { getSessionProfile } from '@/lib/session';

// Replaces LandingRoute: signed-in users go straight to the app.
export default async function MarketingLayout({ children }: { children: React.ReactNode }) {
  const session = await getSessionProfile();

  if (session) redirect(session.isOnboarded ? '/home' : '/onboarding');

  return <>{children}</>;
}
