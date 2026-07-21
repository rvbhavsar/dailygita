import { db } from '@/db';
import { verseChallenges } from '@/db/schema';
import { toVerseChallenge } from '@/lib/serialize';

export async function GET() {
  const rows = await db.select().from(verseChallenges);
  return Response.json(rows.map(toVerseChallenge));
}
