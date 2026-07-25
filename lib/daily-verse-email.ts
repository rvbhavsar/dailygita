import { and, eq, inArray } from 'drizzle-orm';
import { db } from '@/db';
import { dailyEmailDeliveries, profiles, users } from '@/db/schema';
import { getDailyVerse } from '@/data/curatedVerses';
import { env } from '@/lib/env';
import { sendDailyVerseEmail } from '@/lib/email';

/** UTC calendar date as YYYY-MM-DD — matches cron runs on Railway. */
export function utcDeliveryDate(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: string }).code === '23505'
  );
}

export type DailyVerseSendResult = {
  deliveryDate: string;
  verseId: string;
  eligible: number;
  sent: number;
  skipped: number;
  failed: number;
  errors: string[];
};

/**
 * Send today's curated daily verse to every onboarded user with
 * daily_verse_enabled. Already-delivered users for this UTC date are skipped.
 */
export async function sendDailyVerseEmails(
  options: { deliveryDate?: string } = {},
): Promise<DailyVerseSendResult> {
  const deliveryDate = options.deliveryDate ?? utcDeliveryDate();
  const verse = getDailyVerse();
  const errors: string[] = [];

  const recipients = await db
    .select({
      userId: users.id,
      email: users.email,
      displayName: profiles.displayName,
    })
    .from(profiles)
    .innerJoin(users, eq(users.id, profiles.userId))
    .where(
      and(eq(profiles.dailyVerseEnabled, true), eq(profiles.isOnboarded, true)),
    );

  if (recipients.length === 0) {
    return {
      deliveryDate,
      verseId: verse.id,
      eligible: 0,
      sent: 0,
      skipped: 0,
      failed: 0,
      errors,
    };
  }

  const alreadySent = await db
    .select({ userId: dailyEmailDeliveries.userId })
    .from(dailyEmailDeliveries)
    .where(
      and(
        eq(dailyEmailDeliveries.deliveryDate, deliveryDate),
        inArray(
          dailyEmailDeliveries.userId,
          recipients.map((r) => r.userId),
        ),
      ),
    );

  const alreadySentIds = new Set(alreadySent.map((r) => r.userId));
  const pending = recipients.filter((r) => !alreadySentIds.has(r.userId));

  let sent = 0;
  let skipped = alreadySentIds.size;
  let failed = 0;

  for (const recipient of pending) {
    // Claim the delivery slot first so concurrent cron runs can't double-send.
    try {
      await db.insert(dailyEmailDeliveries).values({
        userId: recipient.userId,
        deliveryDate,
        verseId: verse.id,
      });
    } catch (error) {
      if (isUniqueViolation(error)) {
        skipped += 1;
        continue;
      }
      failed += 1;
      const message = error instanceof Error ? error.message : 'Unknown error';
      errors.push(`${recipient.email}: ${message}`);
      console.error(`[daily-verse-email] claim failed for ${recipient.email}:`, error);
      continue;
    }

    try {
      await sendDailyVerseEmail({
        to: recipient.email,
        displayName: recipient.displayName,
        verse,
        appUrl: env.APP_URL,
      });
      sent += 1;
    } catch (error) {
      // Release the claim so a later retry can try again.
      await db
        .delete(dailyEmailDeliveries)
        .where(
          and(
            eq(dailyEmailDeliveries.userId, recipient.userId),
            eq(dailyEmailDeliveries.deliveryDate, deliveryDate),
          ),
        );
      failed += 1;
      const message = error instanceof Error ? error.message : 'Unknown error';
      errors.push(`${recipient.email}: ${message}`);
      console.error(`[daily-verse-email] failed for ${recipient.email}:`, error);
    }
  }

  return {
    deliveryDate,
    verseId: verse.id,
    eligible: recipients.length,
    sent,
    skipped,
    failed,
    errors,
  };
}
