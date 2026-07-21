import { redirect } from 'next/navigation';
import { getSessionProfile } from '@/lib/session';

// Replaces AuthRoute: signed-in users don't belong on the sign-in page.
export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const session = await getSessionProfile();

  if (session) redirect(session.isOnboarded ? '/home' : '/onboarding');

  return <>{children}</>;
}
