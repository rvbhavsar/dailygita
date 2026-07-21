import { redirect } from 'next/navigation';
import { getSessionProfile } from '@/lib/session';

// Replaces OnboardingRoute: requires auth, bounces if already onboarded.
export default async function OnboardingLayout({ children }: { children: React.ReactNode }) {
  const session = await getSessionProfile();

  if (!session) redirect('/auth');
  if (session.isOnboarded) redirect('/home');

  return <>{children}</>;
}
