import { db } from '@/db';
import { translations } from '@/db/schema';
import { toTranslation } from '@/lib/serialize';

export async function GET() {
  const rows = await db.select().from(translations);
  return Response.json(rows.map(toTranslation));
}
