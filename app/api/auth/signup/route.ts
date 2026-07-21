import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/db';
import { profiles, users } from '@/db/schema';
import { setAuthCookie } from '@/lib/jwt';
import { hashPassword } from '@/lib/password';
import { toProfile, toUser } from '@/lib/serialize';

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  displayName: z.string().trim().min(1).optional(),
  age: z.number().int().positive().max(120).optional(),
  profession: z.string().trim().optional(),
  maritalStatus: z.string().trim().optional(),
});

export async function POST(request: Request) {
  const parsed = signupSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const { email, password, displayName, age, profession, maritalStatus } = parsed.data;
  const normalizedEmail = email.toLowerCase();

  const existing = await db.query.users.findFirst({ where: eq(users.email, normalizedEmail) });
  if (existing) {
    return Response.json(
      { error: 'An account with that email already exists' },
      { status: 409 },
    );
  }

  const passwordHash = await hashPassword(password);

  // One transaction, replacing Supabase's handle_new_user() trigger. A partial
  // signup would leave a loginable user with no profile, which black-holes
  // the onboarding route guard.
  const created = await db.transaction(async (tx) => {
    const [user] = await tx
      .insert(users)
      .values({ email: normalizedEmail, passwordHash })
      .returning();

    const [profile] = await tx
      .insert(profiles)
      .values({
        userId: user.id,
        displayName: displayName ?? null,
        age: age ?? null,
        profession: profession ?? null,
        maritalStatus: maritalStatus ?? null,
      })
      .returning();

    return { user, profile };
  });

  await setAuthCookie({ sub: created.user.id, email: created.user.email });

  return Response.json(
    { user: toUser(created.user), profile: toProfile(created.profile) },
    { status: 201 },
  );
}
