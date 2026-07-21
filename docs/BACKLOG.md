# Backlog

Everything we want to do next. See [PROGRESS.md](./PROGRESS.md) for what's done.

Ordered roughly by priority within each section. Add freely — this is the running
list, not a committed roadmap.

---

## 🔴 Promises the app makes but doesn't keep

These are the ones that matter most: a user can see or toggle these today and
nothing happens. Same class of bug as the `/settings` break we already fixed.

### Daily verse email is not implemented
Onboarding asks "Daily Wisdom Email — receive one verse each morning" and Settings
exposes the toggle. It writes `daily_verse_enabled` to the database and **nothing
ever sends.** There is no scheduled job anywhere in the codebase.

The original Supabase edge function (`send-daily-verse`, Resend-based) was never
ported — recover it from git history at `b099295^` if useful. Needs a Railway cron
service or a scheduled route handler, plus a delivery record so a restart doesn't
double-send.

*Until it ships, consider hiding the toggle rather than promising something we
don't do.*

### Only 6 of 701 verses have insights
`data/curatedVerses.ts` covers `2-47, 2-14, 3-21, 6-5, 2-62, 18-63`. Every other
verse falls back to Sanskrit plus a bare translation — no explanation, no takeaway,
no real-life examples. Browse advertises 701.

Options: generate insights with Meta and store them (cache in Postgres like we do
narration), commission/write them, or be explicit in the UI about which verses are
"deep-dive" ones.

### `verse_challenges` is empty (0 rows)
The AI job that tagged verses to life challenges (`analyze-verses-challenges` in
the old Supabase stack) was never ported. Consequences:
- Challenge matching relies entirely on those 6 curated verses.
- `ChallengeDetail` shows only curated verses while `Challenges` counts both, so
  counts can disagree with what the page renders.

Port it as a batch script using the Meta integration we already have.

---

## 🟡 Housekeeping — do soon, low effort

- **Rotate API keys.** Resend, Meta and Deepgram keys were shared in a chat
  transcript. The Resend key is also shared with the `cal-sync` project.
- **Prove password reset end to end.** Configured and the sending domain
  (`aixccelerate.email`) is verified in Resend, but no delivery to a real inbox has
  been confirmed. Resend accepts then bounces asynchronously, so a 200 isn't proof.
- **Delete merged branches** `migrate-to-railway` and `next16-migration` once we're
  confident in the Next.js deploy.
- **Scrub `.env` from git history** *if this repo ever goes public.* It was
  committed before the migration and holds the old Supabase publishable key (public
  by design, and that project is abandoned — so this is cleanup, not an incident).
- **Fix pre-existing lint errors.** ~8 errors, all inherited from Lovable
  scaffolding: `no-explicit-any` in Browse/Challenges/ChallengeDetail/Home and
  `no-empty-object-type` in a couple of shadcn components. Typecheck is clean.

---

## 🟢 Next feature work

### Agentic voice + interactive capabilities
The reason we moved to Next.js. Streaming route handlers and realtime are now
available. Worth deciding early: conversational Q&A over the Gita, or voice-driven
navigation of the existing app? They pull the architecture in different directions.

### SEO / indexing the 701 verses
Deferred deliberately, now much cheaper than it was on Vite. Two parts:
- Server-render verse pages so crawlers get content, not an empty shell.
- **Per-verse `og:` metadata.** Today every shared verse link previews as the same
  generic card, which also hurts social sharing regardless of search.

Note this pulls against the current "all client components" choice — verse pages
would need to fetch server-side. Do it as its own change, with the isolation test
as the gate.

---

## 🔵 Technical improvements

- **`output: 'standalone'`** for Railway — smaller image, faster boots. Needs
  `outputFileTracingRoot` care; deliberately deferred so it wouldn't entangle with
  the framework migration.
- **HTTP Range/206 on `app/audio/[...file]`.** `@fastify/static` gave us this free;
  the route handler doesn't implement it. Only needed if we ship a scrub bar —
  `useVerseAudio` currently only ever seeks to 0.
- **Mirror recitation audio to our own volume.** We hotlink ~88MB from GitHub raw.
  Fine now, but we don't control that URL's availability or rate limits.
- **Automated tests.** Everything so far has been verified by hand. The cross-user
  isolation check in particular should be a test that runs on every change, not a
  curl sequence someone remembers to run.
- **Error monitoring.** No Sentry or equivalent; failures are only visible in
  Railway logs.
- **Rate-limit the paid endpoints.** `/api/insights/personalized` and
  `/api/verses/:c/:v/narration` are auth-gated but unmetered per user — one account
  can run up the Meta and Deepgram bills.

---

## 💭 Ideas / unshaped

Not committed, just captured so they aren't lost.

- Streaks, or some notion of a daily reading habit.
- Verse search (full-text over translations).
- Reading progress / "continue where you left off".
- Multi-language: the dataset already ships Hindi translations we don't surface.
- Social login (Google) — the auth model is hand-rolled, so this is real work.
- Shareable verse cards (image generation) — pairs well with the `og:` work.
