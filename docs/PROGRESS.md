# Project Progress

Status log for DailyGita. Newest phase first. See [BACKLOG.md](./BACKLOG.md) for what's next.

**Live:** https://dailygita-app-production.up.railway.app
**Repo:** https://github.com/rvbhavsar/dailygita (`main`)

> **Deploying:** the Railway service has **no GitHub repo connected**, so
> pushing to `main` does *not* deploy. Ship with `railway up --service
> dailygita-app`. (Connecting the repo for push-to-deploy is in the backlog.)

---

## Current state at a glance

| | |
|---|---|
| Framework | Next.js 16 (App Router) + React 19 + TypeScript |
| UI | shadcn/ui + Tailwind v3, on the AIX Theme v2 "Liquid Glass" design system |
| Type | Inter (UI) + Geist (display), self-hosted; Arya / Noto Sans Devanagari for Sanskrit |
| Database | Postgres on Railway via Drizzle ORM |
| Auth | Hand-rolled JWT + bcrypt in an httpOnly cookie |
| AI | Meta Model API (`muse-spark-1.1`) — personalized insights |
| TTS | Deepgram Aura-2 — English narration |
| Email | Resend — password reset only |
| Hosting | Railway: one service, Postgres plugin, `/data` volume |

**Content loaded:** 18 chapters, 701 verses, 4,907 translations, 701 Sanskrit recitations.

---

## Phase 8 — MCP connector (2026-07-21) ✅

Users can now connect Daily Gita's verse corpus to their own agent, so it
answers from real, citable scripture instead of hallucinating chapter/verse
numbers.

- **Remote MCP server** at `/api/mcp` — stateless Streamable HTTP, hand-rolled
  JSON-RPC (initialize / tools/list / tools/call / ping). Mounted under `/api`
  so `proxy.ts`'s cookie gate never touches it. Validated with the official MCP
  Inspector (handshake + tools/list + tools/call), not just curl.
- **Retrieval-only tools** — `search_verses`, `get_verse`, `list_life_challenges`,
  `get_verses_for_challenge`. Deliberately no "explain" tool: the moat is
  grounding, and the caller's own (usually stronger) model does the explaining.
- **Bearer API keys** — a hashed `api_keys` table (SHA-256, show-once, prefix
  kept for display). Settings → Connect mints/revokes keys, shows the endpoint,
  and gives copy-paste setup for Claude Desktop/Code and `mcp.json` clients.
  Verified: revoke invalidates immediately (401), and one user can't revoke
  another's key (404).

**Auth caveat, stated in the UI:** bearer keys work with Claude Desktop/Code,
Cursor, VS Code and any client that sends an `Authorization` header. ChatGPT and
Claude.ai's *web* connectors require OAuth 2.1 (ChatGPT also wants specifically
named `search`/`fetch` tools) — that's a larger follow-up, noted in the backlog.

## Phase 7 — Knowledge retrieval + OKF (2026-07-21) ✅

Three things, deliberately decoupled.

- **Retrieval, from Postgres.** The `verse_search` materialized view aggregates
  all English translations + word-by-word meanings + chapter summary per verse
  into one weighted document, ranked by `ts_rank_cd` (source weight + proximity).
  Measured on 8 thematic probes (`scripts/retrieval-probe.ts`): 6/8 → 7/8, and
  the anxiety probe now ranks 2.47 first where it had left the top 5.
- **OKF bundle.** An [Open Knowledge Format](https://github.com/GoogleCloudPlatform/knowledge-catalog)
  export in `knowledge/` — one markdown concept per verse (701) and chapter (18),
  valid frontmatter, cross-links, reserved index/log files. A **derived export**,
  not in the retrieval path: coupling it there would be two sources of truth for
  zero accuracy gain. Regenerate with `scripts/build-okf.ts`.
- **AI thematic enrichment.** All 701 verses tagged with challenges + keywords +
  a summary (`scripts/enrich-verses.ts`), written to `verse_challenges` — which
  was empty, so this also lights up the Challenges page and closes a backlog gap.
  Keywords feed the search view. Held 7/8 on the probes while improving rankings
  within hits (anger probe → 2.63 first, was 4th).

**Why OKF is not in the retrieval path:** it's a documentation/exchange format,
not a retrieval engine. The accuracy win is the Postgres view + enrichment; the
bundle is the portable, diffable catalog OKF is actually for.

**Known ceiling:** the one probe miss (2.3) is exact-synonym — reader says
"afraid", verse says "faint-heartedness". Query-side synonym expansion is the
next lever (backlog).

## Phase 6 — Gita chat companion (2026-07-21) ✅

A new "Ask" section: a chat agent that listens to what someone raises, then
explains what the Gita says about that theme with specific chapter/verse
citations. It does **not** give advice — asked what to do, it declines and
returns to the text; off-topic requests are turned away.

- **Grounded, not recalled.** `lib/gita-search.ts` full-text searches our own
  translations, and the agent may cite only what it's handed. A model citing
  the Gita from memory invents plausible-but-wrong verse numbers, the worst
  failure for a devotional app.
- **Full-text quirk:** terms are OR-ed with `ts_rank` ranking. `websearch_to_tsquery`
  and `plainto_tsquery` both AND every term, so a conversational sentence
  matched nothing.
- **Conversation, not one-shot.** Follow-ups like "say more about that second
  verse" carry no searchable words, so retrieval also extracts any
  chapter/verse reference already cited in the thread and looks it up directly.
  Without this the agent denied verses it had just cited a turn earlier.
- Replies stream token-by-token; `X-Accel-Buffering: no` so Railway's proxy
  doesn't buffer them.

Also fixed the personalized-insight prompt, which used to instruct the model to
"name a person in the story" — every insight read like a parable about a
stranger, and an invented name carries an invented gender and culture. It now
writes in the second person and refers to others by role.

## Phase 5 — Sidebar shell and Settings (2026-07-21) ✅

Adopted the template's app shell and settings layout.

- **Sidebar** replaces the top nav. Desktop persists expanded/collapsed in
  localStorage; collapsed is an 80px icon rail that expands on hover *over* the
  content rather than pushing it — reflowing verse text on hover would be worse
  than the overlap. Below `lg` it's a drawer opened from the header, sitting
  under the header in both position and stacking order so the close button
  stays reachable. Items are flat: the template nests because it has ~80 admin
  destinations, this app has five.
- **The mobile bottom nav was removed.** A drawer and a bottom nav showing the
  same five links would be redundant, so the template's pattern won. This costs
  a tap on every mobile navigation and is worth revisiting — see the backlog.
- **Settings** rebuilt on the section-rail pattern (rail on desktop, scrolling
  tab strip below `lg`): General / Your profile / Practice / Notifications /
  Account. All prior behaviour preserved against the same endpoints, plus a
  theme picker with preview cards and — new — an editable display name, which
  had been set at onboarding and read-only ever since.

## Phase 4 — AIX design system (2026-07-21) ✅

Adopted the design language of the
[aix-ui-template](https://github.com/Ai-Xccelerate/aix-ui-template) — AIX Theme
v2, "Liquid Glass" — so this app matches the rest of the AIX stack visually.

**The judgement call:** that template is TailAdmin, an *admin dashboard* on
Tailwind v4 with its own component library. This is a five-page consumer
reading app on Tailwind v3 + shadcn. Adopting it literally would have meant
rebuilding a working, verified app on both a mismatched stack and a mismatched
product archetype. So we ported the **design language, not the stack**: the
tokens are re-expressed through shadcn's `hsl(var(--x))` indirection, which let
every existing component adopt the system without being rewritten.

- Tokens: Untitled-UI gray ramp, saffron/success/error/warning ramps, radii
  retuned tight (controls 5px, cards 8px), AIX type scale, motion easings.
- Ambient backdrop: a fixed canvas of three slow-drifting warm blobs, with
  glass chrome floating over it. Chrome only — cards stay opaque and flat.
- Nav: header and mobile bottom nav rebuilt on the template's `menu-item`
  vocabulary. The header/bottom-nav split was **kept** rather than the
  template's admin sidebar, which doesn't fit a five-destination reading app.
- Dark mode promoted to first-class. `next-themes` was already a dependency
  but had never been wired up.
- Type: self-hosted Inter (UI) and Geist (display) replace Lato. No CDN.

**Deliberately not adopted:** the template's logo, product name, agent identity
colours and its Inter-only type. Daily Gita keeps its ॐ mark, its name, and the
Devanagari faces. Its saffron measured the same as the AIX brand ramp, so the
tint and shade steps transferred without a palette fork.

**Bugs fixed on the way:**
- **`/challenges` was a hard 500 for every logged-in user** — the page calls
  hooks but was never marked `'use client'`. It had been broken since the
  Next.js migration. The build compiles fine, which is why the phase-3
  checklist missed it; only requesting the route *while authenticated*
  surfaces it. Same class as the `/settings` break from phase 1.
- A hydration mismatch in the new theme toggle: the icon was gated on
  `mounted` but the `aria-label` wasn't, so the server and client disagreed.
- Devanagari line collision in verse cards (pre-existing, verified against the
  pre-change build). Matras stack above *and* below the headline, so
  `leading-loose` still let line 1's descenders hit line 2's vowel signs.

## Phase 3 — Vite → Next.js 16 (2026-07-21) ✅

Consolidated onto Next.js to match the rest of the stack and to enable streaming
route handlers for the planned agentic voice work. Fastify, Vite, React Router
and the npm workspaces are gone; everything lives in `app/`.

- 1:1 API port into Route Handlers — `lib/api.ts`, the react-query hooks and
  `serialize.ts`'s snake_case contract were left untouched, so the client kept
  working against identical responses.
- Data fetching deliberately stayed client-side. Converting to Server Components
  in the same change would have put the authorization model at risk.
- Route guards became layered: `proxy.ts` (Next 16's rename of `middleware.ts`,
  now on the Node runtime) does an optimistic cookie check; route-group layouts
  hit the DB and are authoritative.
- React 18 → 19. Made nearly free by deleting 27 unused shadcn components and the
  four packages needing breaking upgrades (`react-day-picker`, `recharts`,
  `vaul`, `react-resizable-panels`) — all were imported by zero app files.

**Fixed on the way through:** `Settings` called `navigate()` during render, which
React Router tolerated and React 19 rejects outright.

**Deploy failures worth remembering:** a committed `tsconfig.tsbuildinfo` (Nixpacks
mounts a cache directory at that path and can't bind over a file), and top-level
await in the db scripts once the flattened `package.json` lost `"type": "module"`.

## Phase 2 — AI insights and verse audio (2026-07-21) ✅

- `POST /api/insights/personalized` calls Meta's Model API. It's a reasoning model
  (~8s latency, pads its output), so responses are parsed defensively.
- Two audio tracks per verse, from deliberately different sources. **Deepgram has
  no Sanskrit or Hindi voice** and cannot read Devanagari, so:
  - **Chant** — authentic recitation hotlinked from the `gita/gita` dataset.
    701 files covering all 701 verses. Free, no generation step.
  - **Listen** — English, generated on demand by Deepgram, cached to the volume.
- Narration generation sits behind auth because each call costs money.

## Phase 1 — Supabase → Node/Postgres on Railway (2026-07-21) ✅

Moved off Lovable and Supabase entirely: own auth, own database, own deploy.

- Replaced Supabase Auth and **RLS**. Since plain Postgres has no row-level
  security, every protected query now carries an explicit
  `WHERE user_id = <session user>`, with the id from the verified JWT and never
  from a request body. This is the single most important invariant in the app.
- Signup creates user + profile in one transaction (replacing the
  `handle_new_user()` trigger).
- Seeded content from the public `gita/gita` dataset.

**Bugs fixed:** `/settings` was unreachable for every logged-in user (it guarded
on a dead localStorage store); that zombie `UserContext` was deleted and favorites
were promoted to the database; 158 lines of dead code removed.

---

## Verification standard

Each phase is checked against the same end-to-end list, locally and then against
the live URL:

migrate on a clean DB → seed → signup sets an httpOnly cookie → session survives
refresh → onboarding persists → `/settings` reachable and saving → favorites
survive logout/login → saved-insight CRUD → **user B cannot read or delete user
A's rows** → deep links work → `/api/*` misses return JSON → chant plays →
narration generates, caches and replays → Meta insight generates and saves.

The cross-user isolation check is the gate. It has passed on every phase and must
keep passing — there is no RLS behind it.
