# Project Progress

Status log for DailyGita. Newest phase first. See [BACKLOG.md](./BACKLOG.md) for what's next.

**Live:** https://dailygita-app-production.up.railway.app
**Repo:** https://github.com/rvbhavsar/dailygita (`main`)

---

## Current state at a glance

| | |
|---|---|
| Framework | Next.js 16 (App Router) + React 19 + TypeScript |
| UI | shadcn/ui + Tailwind |
| Database | Postgres on Railway via Drizzle ORM |
| Auth | Hand-rolled JWT + bcrypt in an httpOnly cookie |
| AI | Meta Model API (`muse-spark-1.1`) — personalized insights |
| TTS | Deepgram Aura-2 — English narration |
| Email | Resend — password reset only |
| Hosting | Railway: one service, Postgres plugin, `/data` volume |

**Content loaded:** 18 chapters, 701 verses, 4,907 translations, 701 Sanskrit recitations.

---

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
