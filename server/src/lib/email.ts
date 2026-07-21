import { Resend } from 'resend';
import { env } from './env.js';

const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

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
