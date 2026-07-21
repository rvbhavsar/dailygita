import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/db';
import { profiles, users } from '@/db/schema';
import { setAuthCookie } from '@/lib/jwt';
import { verifyPassword } from '@/lib/password';
import { toProfile, toUser } from '@/lib/serialize';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(request: Request) {
  const parsed = loginSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: 'Invalid email or password' }, { status: 400 });
  }

  const normalizedEmail = parsed.data.email.toLowerCase();
  const user = await db.query.users.findFirst({ where: eq(users.email, normalizedEmail) });

  // Identical response on both branches so the endpoint can't enumerate accounts.
  if (!user || !(await verifyPassword(parsed.data.password, user.passwordHash))) {
    return Response.json({ error: 'Invalid email or password' }, { status: 401 });
  }

  const profile = await db.query.profiles.findFirst({ where: eq(profiles.userId, user.id) });
  if (!profile) {
    return Response.json({ error: 'Account is missing a profile' }, { status: 500 });
  }

  await setAuthCookie({ sub: user.id, email: user.email });

  return Response.json({ user: toUser(user), profile: toProfile(profile) });
}
