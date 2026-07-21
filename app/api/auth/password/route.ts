import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/db';
import { users } from '@/db/schema';
import { hashPassword, verifyPassword } from '@/lib/password';
import { withAuth } from '@/lib/session';

export const PATCH = withAuth(async (session, request: Request) => {
  const parsed = z
    .object({ currentPassword: z.string().min(1), newPassword: z.string().min(8) })
    .safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return Response.json({ error: 'New password must be at least 8 characters' }, { status: 400 });
  }

  const user = await db.query.users.findFirst({ where: eq(users.id, session.id) });
  if (!user || !(await verifyPassword(parsed.data.currentPassword, user.passwordHash))) {
    return Response.json({ error: 'Current password is incorrect' }, { status: 401 });
  }

  await db
    .update(users)
    .set({ passwordHash: await hashPassword(parsed.data.newPassword) })
    .where(eq(users.id, session.id));

  return Response.json({ ok: true });
});
