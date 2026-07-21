import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { translations } from '@/db/schema';
import { toTranslation } from '@/lib/serialize';

// Lives under /translations rather than /verses/:verseId/translations because
// Next disallows two different slug names ([verseId] vs [chapter]) at the same
// routing level.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ verseId: string }> },
) {
  const { verseId } = await params;
  const rows = await db
    .select()
    .from(translations)
    .where(eq(translations.verseId, Number(verseId)));

  return Response.json(rows.map(toTranslation));
}
