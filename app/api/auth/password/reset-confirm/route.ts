import { createHash } from 'node:crypto';
import { and, eq, gt, isNull } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/db';
import { passwordResets, users } from '@/db/schema';
import { hashPassword } from '@/lib/password';

const hashToken = (token: string) => createHash('sha256').update(token).digest('hex');

export async function POST(request: Request) {
  const parsed = z
    .object({ token: z.string().min(1), password: z.string().min(8) })
    .safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return Response.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
  }

  const record = await db.query.passwordResets.findFirst({
    where: and(
      eq(passwordResets.tokenHash, hashToken(parsed.data.token)),
      isNull(passwordResets.usedAt),
      gt(passwordResets.expiresAt, new Date()),
    ),
  });

  if (!record) {
    return Response.json(
      { error: 'That reset link is invalid or has expired' },
      { status: 400 },
    );
  }

  const passwordHash = await hashPassword(parsed.data.password);
  await db.transaction(async (tx) => {
    await tx.update(users).set({ passwordHash }).where(eq(users.id, record.userId));
    await tx
      .update(passwordResets)
      .set({ usedAt: new Date() })
      .where(eq(passwordResets.tokenHash, record.tokenHash));
  });

  return Response.json({ ok: true });
}
