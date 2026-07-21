# DailyGita

Bhagavad Gita reading app. Sign up, pick the life challenges you're working through, and get a daily verse plus verses matched to those challenges.

## Stack

| Layer | Choice |
|---|---|
| Frontend | Vite + React 18 + TypeScript + shadcn/ui + Tailwind |
| Backend | Fastify + TypeScript |
| Database | Postgres via Drizzle ORM |
| Auth | JWT + bcrypt in an httpOnly cookie |
| AI | Meta Model API (`muse-spark-1.1`) for personalized insights |
| TTS | Deepgram Aura-2 for English narration |
| Email | Resend (password reset) |
| Hosting | Railway (one service serving API + static client) |

## Layout

```
client/    React SPA
server/    Fastify API + Drizzle schema, migrations, seed
shared/    Types used by both sides
dist/      Build output (client/ and server/)
```

## Local setup

Requires Node 20+ and a local Postgres.

```sh
npm install
createdb dailygita
cp .env.example .env      # then edit DATABASE_URL and JWT_SECRET
npm run migrate           # create tables
npm run seed              # load 18 chapters, 701 verses, 4907 translations
npm run seed:recitation   # register the Sanskrit recitation urls
npm run dev               # API on :3001, client on :5173
```

Open http://localhost:5173. The Vite dev server proxies `/api` to the API, so
the app is same-origin in development exactly as it is in production.

Without a `RESEND_API_KEY`, password-reset links are printed to the server log
instead of emailed — enough to exercise the flow locally.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | API + client with hot reload |
| `npm run build` | Build client and server into `dist/` |
| `npm start` | Run the production server (serves API + built client) |
| `npm run generate` | Generate a migration after changing `server/src/db/schema.ts` |
| `npm run migrate` | Apply pending migrations |
| `npm run seed` | Load Gita content (idempotent, safe to re-run) |
| `npm run typecheck` | Typecheck both workspaces |

## Deploying to Railway

1. `railway login`
2. Create a project and add the **Postgres** plugin.
3. Point a service at this repo. `railway.json` supplies the build and start
   commands; migrations run before the server accepts traffic.
4. Set service variables:
   - `DATABASE_URL` → `${{Postgres.DATABASE_URL}}` (reference variable)
   - `JWT_SECRET` → `openssl rand -hex 32`
   - `APP_URL` → your public URL, e.g. `https://dailygita.up.railway.app`
   - `NODE_ENV` → `production`
   - `RESEND_API_KEY` → optional, needed for password-reset emails
5. Add a volume mounted at `/data` (narration mp3s are cached there).
6. After the first deploy, load content once. Note that `railway run` executes
   **locally**, so `postgres.railway.internal` will not resolve — seed through
   the public proxy instead:

   ```sh
   DATABASE_URL="$(railway variables --service Postgres --json | jq -r .DATABASE_PUBLIC_URL)" \
     npm run seed && npm run seed:recitation
   ```

Session cookies are set `secure` whenever `NODE_ENV=production`, so the app
must be served over HTTPS in production. Railway does this by default.

## Authorization

There is no row-level security. Every protected route pairs the `requireAuth`
middleware with an explicit `WHERE user_id = <session user>`, and the user id
always comes from the verified JWT — never from the request body.

## Audio

Two tracks per verse, from deliberately different sources:

- **Chant** — authentic Sanskrit recitation, hotlinked from the `gita/gita`
  dataset (701 files covering all 701 verses). Free, no generation step.
- **Listen** — English translation and insight, generated on demand by
  Deepgram and cached under `AUDIO_DIR`, then served from `/audio/*`.

Deepgram offers no Sanskrit or Hindi voice, so it cannot read the Devanagari —
hence the split. Real recitation also sounds better than any TTS would.

Narration generation sits behind auth because each call costs money; the
result is cached so a given verse is only ever synthesized once.
