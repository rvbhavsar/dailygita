# AGENTS.md

## Cursor Cloud specific instructions

DailyGita is a single Next.js 16 app (App Router) backed by Postgres via Drizzle.
There are no separate services — `app/`, `db/`, `lib/`, `services/` are all folders of
the one app. Standard commands live in `package.json` and `README.md`; the notes below
only cover non-obvious cloud-environment gotchas.

### Local-dev env overrides (important)
The environment injects the **deployed/Railway** secrets as real env vars, and those
override `.env`/`.env.local` (dotenv and Next don't override an already-set var). Left
as-is they break local dev:
- `DATABASE_URL` is an unresolved Railway reference template, not a real connection URL,
- `NODE_ENV` is the deployed (prod) value, which forces `secure` session cookies, so login
  fails over `http://localhost`,
- `AUDIO_DIR` and `APP_URL` point at the deployed app's volume path / public URL.

`~/.bashrc` contains a guarded block that rewrites only these to local values
(local Postgres `DATABASE_URL`, dev `NODE_ENV`, `AUDIO_DIR=/workspace/.audio-cache`,
`APP_URL=http://localhost:3000`) while keeping the real optional API keys
(`JWT_SECRET`, `RESEND_API_KEY`, `DEEPGRAM_API_KEY`, `META_API_KEY`). So **run all dev
commands from a login bash shell** (e.g. tmux `bash -l`) so those overrides apply. If you
use a non-login/non-bash shell, export those four vars to local values yourself first.

### Postgres
Postgres 16 is installed but not auto-started. Start it each boot:
`sudo pg_ctlcluster 16 main start`. Local DB/creds: db `dailygita`, user/pass
`dailygita`/`dailygita` (matches the `~/.bashrc` local `DATABASE_URL`). The schema + seed
content persist in the VM snapshot; to recreate from scratch run
`npm run migrate && npm run seed && npm run seed:recitation` (seeds fetch Gita content
over the network and are idempotent).

### Dev dependencies
Because the injected prod `NODE_ENV` makes a plain `npm install` skip devDependencies
(eslint/tsc/drizzle-kit), always install with `npm install --include=dev` (this is what
the startup update script does).

### Run / typecheck / lint
- Run: `npm run dev` → http://localhost:3000 ; readiness probe `GET /api/health` → `{"ok":true}`.
- Typecheck: `npm run typecheck` passes, but needs `next-env.d.ts`, which is generated on
  the first `next dev`/`next build`. If typecheck reports missing `*.jpg` module types,
  start the dev server (or `next build`) once to generate it.
- Lint: `npm run lint` is **broken in the repo as committed** — `eslint.config.js` is a
  stale Vite-era config that imports `eslint-plugin-react-hooks`/`eslint-plugin-react-refresh`
  (not in `package.json`) and targets `client/**`,`server/**`,`shared/**` globs that don't
  exist in this Next.js app. This is a pre-existing code issue, not an environment gap.
