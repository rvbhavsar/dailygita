import { and, eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/db';
import { savedInsights } from '@/db/schema';
import { withAuth } from '@/lib/session';

export const DELETE = withAuth(
  async (session, _request: Request, ctx: { params: Promise<{ id: string }> }) => {
    const { id } = await ctx.params;

    if (!z.string().uuid().safeParse(id).success) {
      return Response.json({ error: 'Insight not found' }, { status: 404 });
    }

    // Scoping the delete by user id is what stops one account from deleting
    // another's rows now that RLS is gone.
    const deleted = await db
      .delete(savedInsights)
      .where(and(eq(savedInsights.id, id), eq(savedInsights.userId, session.id)))
      .returning();

    if (deleted.length === 0) {
      return Response.json({ error: 'Insight not found' }, { status: 404 });
    }
    return Response.json({ ok: true });
  },
);
