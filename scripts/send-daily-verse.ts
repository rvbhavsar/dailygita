import { sendDailyVerseEmails } from '../lib/daily-verse-email';

async function main() {
  const result = await sendDailyVerseEmails();
  console.log(JSON.stringify(result, null, 2));
  if (result.failed > 0 && result.sent === 0) process.exit(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
