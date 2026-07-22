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

### ~~`verse_challenges` is empty (0 rows)~~ — DONE (phase 7)
`scripts/enrich-verses.ts` tagged all 701 verses; 692 carry challenges. The
table is full, the Challenges page has real data, and `ChallengeDetail` now
lists the AI-tagged verses (rewritten to match the overview count exactly —
verified 183 = 183 in the browser, the old count-vs-render mismatch is gone).
Re-run the script to refresh tags.

**Not in seed.** Enrichment is a separate paid AI job, so a fresh database gets
an empty `verse_challenges` and a dormant Challenges page until
`scripts/enrich-verses.ts` is run. `seed.ts` does not load it.

---

## 🎨 Design system — finish the page pass

Phase 4 landed the token layer, the nav chrome and the shared primitives;
phase 5 landed the sidebar shell and rebuilt Settings. The remaining pages were
only swept for breakage, not restyled. These are the places page markup still
contradicts the system (see `AIX-DESIGN-SYSTEM.md` and `DESIGN.md` in the
template for the rules).

- **Emoji in the challenge badges** (🔍 Focus & Distraction, ⚡ Discipline &
  Consistency). The system calls for one icon language — stroke icons, ~1.5–2px,
  no fill. Emoji also render differently per platform.
- **Nested bordered cards.** "What This Means" is a bordered box inside the
  verse card, which the system forbids outright. Should be a plain tinted
  region or separated by a rule.
- **Pill-shaped controls on Browse.** The chapter filter chips and the
  By Chapter / By Challenge tabs are `rounded-full`; controls are `rounded-lg`
  (5px) and pills are reserved for avatars, dots and badges.
- **Sentence case everywhere.** Several headings are still Title Case
  ("Welcome Back", "Browse Verses", "Personalized for You"). Settings is done.
- **Sidebar drawer has no Escape-to-close and no focus trap.** Tab order runs
  straight through the drawer into the page behind it. The template's drawer
  has the same gap, so this is faithful adoption rather than a regression —
  but it's still an accessibility bug worth fixing on our side.
- **Reconsider the mobile bottom nav.** Phase 5 replaced it with a hamburger
  drawer to match the template, which costs a tap on every navigation. For a
  daily-habit reading app with five destinations, sidebar-on-desktop plus
  bottom-nav-on-mobile may serve better. Shipped as-is deliberately.
- **Empty states as invitations** (icon + one sentence + an action), never
  "No data" / bare "Nothing here yet".
- Consider adopting the template's **density control** (`data-density` on
  `<html>` scaling the root `--spacing` token). Cheap to port, and it suits a
  reading app — but it needs a settings surface, so it's a real feature.

---

## 🟡 Housekeeping — do soon, low effort

- **Rotate API keys.** Resend, Meta and Deepgram keys were shared in a chat
  transcript. The Resend key is also shared with the `cal-sync` project.
- **Prove password reset end to end.** Configured and the sending domain
  (`aixccelerate.email`) is verified in Resend, but no delivery to a real inbox has
  been confirmed. Resend accepts then bounces asynchronously, so a 200 isn't proof.
- **Connect the GitHub repo to the Railway service** so pushing to `main`
  deploys. Today it doesn't — shipping requires `railway up` from the CLI, which
  is easy to forget and means `main` can silently be ahead of production.
- **Delete merged branches** `migrate-to-railway` and `next16-migration` once we're
  confident in the Next.js deploy. (`aix-design-system` is already deleted.)
- **Scrub `.env` from git history** *if this repo ever goes public.* It was
  committed before the migration and holds the old Supabase publishable key (public
  by design, and that project is abandoned — so this is cleanup, not an incident).
- **Fix pre-existing lint errors.** ~8 errors, all inherited from Lovable
  scaffolding: `no-explicit-any` in Browse/Challenges/ChallengeDetail/Home and
  `no-empty-object-type` in a couple of shadcn components. Typecheck is clean.

---

## 🟢 Retrieval — next levers

- **Query-side synonym expansion.** The one standing probe miss (reader says
  "afraid", verse says "faint-heartedness") is a vocabulary gap the corpus can't
  close alone. Expand the reader's terms (a thesaurus, or an embedding step)
  before the tsquery. This is the highest-leverage next accuracy win.
- **Consider semantic/vector search.** Full-text has a ceiling on paraphrase.
  Pure-feeling queries confirm it: "comparing myself to others" matched verses
  containing the literal word "others"; "burned out" matched "fire cannot burn
  the soul." The keyword layer helps translation-worded themes but can't reach
  metaphor. Embedding the enriched per-verse documents (pgvector) would catch
  these — at the cost of an embedding pipeline and a model dependency. This is
  the real fix for the feeling-query class.
- **Spot-check enrichment quality.** The AI tags are broadly good but were not
  hand-audited across 701 verses. Sample for obvious mis-tags; the `keywords`
  are the load-bearing part for retrieval.

## 🟢 MCP connector — next

- **OAuth 2.1 for ChatGPT / Claude.ai web connectors.** The bearer-key MCP
  server (phase 8) works with Claude Desktop/Code, Cursor and programmatic
  clients, but the *web* connector flows in ChatGPT and Claude.ai require OAuth
  with dynamic client registration / CIMD — no "paste a key" field. This is the
  bigger lift to reach the clients the user named. ChatGPT deep-research also
  requires tools named `search` and `fetch` with specific schemas (aliasing our
  `search_verses`/`get_verse` would cover it).
- **Rate-limit `/api/mcp` per key.** It's exposed to "any agent" and hits the
  retrieval path (and, if an explain tool is ever added, the Meta bill). Fold
  into the existing rate-limit backlog item.
- **Perplexity** support depends on its MCP/connector auth model — verify before
  claiming it.

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

- **Validate `selected_challenges` against the known challenge ids.** Both the
  profile and onboarding endpoints accept `z.array(z.string())`, so a client
  can persist ids that don't exist in `data/challenges.ts`. They then silently
  never match anything — no error, just a user whose preferences quietly do
  nothing. Caught while testing Settings with hand-written ids.

- **`output: 'standalone'`** for Railway — smaller image, faster boots. Needs
  `outputFileTracingRoot` care; deliberately deferred so it wouldn't entangle with
  the framework migration.
- **HTTP Range/206 on `app/audio/[...file]`.** `@fastify/static` gave us this free;
  the route handler doesn't implement it. Only needed if we ship a scrub bar —
  `useVerseAudio` currently only ever seeks to 0.
- **Mirror recitation audio to our own volume.** We hotlink ~88MB from GitHub raw.
  Fine now, but we don't control that URL's availability or rate limits.
- **Automated tests.** Everything so far has been verified by hand. Two checks
  in particular should run on every change rather than being remembered:
  - **Cross-user isolation** — there is no RLS behind it.
  - **Every route returns 200 while authenticated.** `/challenges` was a 500 in
    production for an entire release because the build compiles a page that
    throws at request time. A build passing is not evidence a page renders.
- **Error monitoring.** No Sentry or equivalent; failures are only visible in
  Railway logs.
- **Rate-limit the paid endpoints.** `/api/insights/personalized`,
  `/api/verses/:c/:v/narration` and now `/api/chat` are auth-gated but unmetered
  per user — one account can run up the Meta and Deepgram bills. `/api/chat` is
  the biggest exposure: it streams, invites repeated use, and sends up to 40
  turns of history per call. Meter this one first.

---

## 💭 Ideas / unshaped

Not committed, just captured so they aren't lost.

- Streaks, or some notion of a daily reading habit.
- Verse search (full-text over translations).
- Reading progress / "continue where you left off".
- Multi-language: the dataset already ships Hindi translations we don't surface.
- Social login (Google) — the auth model is hand-rolled, so this is real work.
- Shareable verse cards (image generation) — pairs well with the `og:` work.
