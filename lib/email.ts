import { Resend } from 'resend';
import type { VerseWithInsights } from '@/types';
import { env } from './env';

const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function nl2br(value: string): string {
  return escapeHtml(value).replace(/\n/g, '<br>');
}

export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  // Without a key configured the flow still works end to end locally —
  // the link goes to the server log instead of an inbox.
  if (!resend) {
    console.log(`[email] password reset for ${to}: ${resetUrl}`);
    return;
  }

  await resend.emails.send({
    from: env.RESEND_FROM,
    to,
    subject: 'Reset your DailyGita password',
    html: `
      <p>We received a request to reset your DailyGita password.</p>
      <p><a href="${resetUrl}">Reset your password</a></p>
      <p>This link expires in one hour. If you didn't request it, you can ignore this email.</p>
    `,
  });
}

export type DailyVerseEmailInput = {
  to: string;
  displayName: string | null;
  verse: VerseWithInsights;
  /** Absolute app origin, e.g. https://dailygita.up.railway.app */
  appUrl: string;
};

/**
 * Daily wisdom email — full readable verse text in the message body.
 * Interactive actions (personalized example, listen) deep-link into the app;
 * signed-out users hit /auth via the proxy, then land on the verse after login.
 */
export async function sendDailyVerseEmail({
  to,
  displayName,
  verse,
  appUrl,
}: DailyVerseEmailInput) {
  const origin = appUrl.replace(/\/$/, '');
  const versePath = `/verse/${verse.id}`;
  const verseUrl = `${origin}${versePath}`;
  const generateUrl = `${origin}${versePath}?action=generate`;
  const listenUrl = `${origin}${versePath}?action=listen`;
  const settingsUrl = `${origin}/settings`;

  const greeting = displayName ? `Namaste, ${displayName}` : 'Namaste';
  const subject = `Daily Gita ${verse.chapter}.${verse.verse} — today's verse`;

  const text = [
    `${greeting},`,
    '',
    `Here is your verse for today — Bhagavad Gita ${verse.chapter}.${verse.verse}.`,
    '',
    verse.sanskrit,
    '',
    `"${verse.english}"`,
    '',
    'What this means',
    verse.insight.explanation,
    '',
    `Takeaway: ${verse.insight.takeaway}`,
    '',
    `Open the verse: ${verseUrl}`,
    `Generate a personalized example: ${generateUrl}`,
    `Listen to the verse: ${listenUrl}`,
    '',
    'To stop these emails, turn off Daily wisdom email in Settings:',
    settingsUrl,
  ].join('\n');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(subject)}</title>
</head>
<body style="margin:0;padding:0;background:#f3eee6;font-family:Georgia,'Times New Roman',serif;color:#1f2937;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3eee6;padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e8dfd2;">
          <tr>
            <td style="background:linear-gradient(135deg,#c2410c 0%,#9a3412 100%);padding:28px 32px;text-align:center;">
              <p style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:12px;letter-spacing:0.14em;text-transform:uppercase;color:rgba(255,255,255,0.85);">DailyGita</p>
              <h1 style="margin:10px 0 0;font-size:26px;line-height:1.25;font-weight:normal;color:#ffffff;">Your verse for today</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              <p style="margin:0 0 20px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:15px;line-height:1.6;color:#4b5563;">
                ${escapeHtml(greeting)} — here is today's reading. You can take in the full text below.
              </p>

              <p style="margin:0 0 16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:12px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:#c2410c;">
                Chapter ${verse.chapter} · Verse ${verse.verse}
              </p>

              <p style="margin:0 0 24px;font-size:20px;line-height:1.9;text-align:center;color:#111827;">
                ${nl2br(verse.sanskrit)}
              </p>

              <div style="height:1px;background:linear-gradient(90deg,transparent,#d6c4b0,transparent);margin:0 0 24px;"></div>

              <p style="margin:0 0 28px;font-size:17px;line-height:1.75;text-align:center;font-style:italic;color:#1f2937;">
                "${escapeHtml(verse.english)}"
              </p>

              <div style="background:#faf6f0;border-radius:12px;padding:20px 22px;margin:0 0 28px;">
                <p style="margin:0 0 8px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:13px;font-weight:600;color:#9a3412;">
                  What this means
                </p>
                <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#374151;">
                  ${escapeHtml(verse.insight.explanation)}
                </p>
                <p style="margin:0;padding-top:14px;border-top:1px solid #e8dfd2;font-size:15px;line-height:1.65;font-style:italic;color:#c2410c;">
                  ${escapeHtml(verse.insight.takeaway)}
                </p>
              </div>

              <p style="margin:0 0 14px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:13px;font-weight:600;color:#374151;">
                Continue in the app
              </p>
              <p style="margin:0 0 20px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:13px;line-height:1.55;color:#6b7280;">
                Sign in to generate a personalized example or listen to the verse.
              </p>

              <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto 8px;">
                <tr>
                  <td style="padding:0 6px 10px 0;">
                    <a href="${escapeHtml(generateUrl)}" style="display:inline-block;background:#c2410c;color:#ffffff;text-decoration:none;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:14px;font-weight:600;padding:12px 18px;border-radius:999px;">
                      Generate personalized example
                    </a>
                  </td>
                </tr>
                <tr>
                  <td style="padding:0 6px 10px 0;">
                    <a href="${escapeHtml(listenUrl)}" style="display:inline-block;background:#ffffff;color:#9a3412;text-decoration:none;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:14px;font-weight:600;padding:12px 18px;border-radius:999px;border:1px solid #d6c4b0;">
                      Listen to today's verse
                    </a>
                  </td>
                </tr>
                <tr>
                  <td style="padding:0;">
                    <a href="${escapeHtml(verseUrl)}" style="display:inline-block;color:#6b7280;text-decoration:underline;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:13px;padding:8px 4px;">
                      Open verse in DailyGita
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:0 32px 28px;text-align:center;">
              <p style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:12px;line-height:1.6;color:#9ca3af;">
                May this wisdom guide your day.<br>
                To unsubscribe, turn off Daily wisdom email in
                <a href="${escapeHtml(settingsUrl)}" style="color:#c2410c;">Settings</a>.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  if (!resend) {
    console.log(`[email] daily verse for ${to}: ${subject}\n${text}`);
    return;
  }

  await resend.emails.send({
    from: env.RESEND_FROM,
    to,
    subject,
    html,
    text,
  });
}
