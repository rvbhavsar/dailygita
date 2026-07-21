import { asc } from 'drizzle-orm';
import { db } from '@/db';
import { chapters } from '@/db/schema';
import { toChapter } from '@/lib/serialize';

// Scripture is public content — no auth.
export async function GET() {
  const rows = await db.select().from(chapters).orderBy(asc(chapters.chapterNumber));
  return Response.json(rows.map(toChapter));
}
