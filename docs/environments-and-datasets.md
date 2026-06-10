# Environments, Sanity datasets, and local-testing notes

A durable reference so per-environment data differences (and a couple of
local-shell gotchas) don't have to be rediscovered each session. First
written during the AI-concierge build (Session 3).

## Sanity dataset per environment

The runtime Sanity client (`src/sanity/lib/client.ts`) is pointed at a
single dataset resolved in `src/sanity/lib/env.ts`:

```
dataset = SANITY_STUDIO_DATASET || NEXT_PUBLIC_SANITY_DATASET || 'production'
```

| Context | `NEXT_PUBLIC_SANITY_DATASET` | Effective dataset | `useCdn` | perspective |
|---|---|---|---|---|
| **Local dev** (`.env`) | `migration-staging` | `migration-staging` | `false` (NODE_ENV≠production) | `published` |
| **Production** (Railway) | `production` (set in deploy env) | `production` | `true` | `published` |
| **`npx tsx` one-offs** | *(not auto-loaded)* | `production` (the `DEFAULT_DATASET` fallback) | — | — |

### Consequences (read before testing against content)

- **A slug that exists in one dataset may not exist in the other.** During
  Session 3, `classic-egypt-8-days` resolved in `production` but not in
  `migration-staging`, which briefly looked like a `?tour=` bug — it was
  just the wrong dataset. Pick test slugs from the dataset the running
  process actually reads.
- **The dev server reads `migration-staging` with `perspective: 'published'`.**
  Draft-only docs (common in the WP→Sanity migration — see the project
  memory's "publish gap" notes) are invisible to the dev runtime. A test
  fixture must be **published** in `migration-staging`. Example known-good
  published tour slug: `02-day-luxor-tour-by-plane-from-cairo`.
- **`npx tsx -e '...'` does NOT load `.env`.** It hits the `production`
  dataset (the `DEFAULT_DATASET` fallback) with no token. To test against
  the dev dataset from `tsx`, pass the vars explicitly:

  ```sh
  PID=$(grep '^NEXT_PUBLIC_SANITY_PROJECT_ID=' .env | cut -d= -f2)
  DS=$(grep '^NEXT_PUBLIC_SANITY_DATASET=' .env | cut -d= -f2)
  TOK=$(grep '^SANITY_API_WRITE_TOKEN=' .env | cut -d= -f2-)
  NEXT_PUBLIC_SANITY_PROJECT_ID=$PID NEXT_PUBLIC_SANITY_DATASET=$DS \
    SANITY_API_READ_TOKEN=$TOK npx tsx -e "..."
  ```

  Relevant to future sessions that test against content: S4 (brief-detection
  conversations), S10 (admin panel over real conversations).

- `migration-staging` is **private** — reads need a token
  (`SANITY_API_READ_TOKEN`, falling back to the staging/write tokens in
  dev). The token is server-only; never imported client-side.

## Supabase (concierge schema)

The concierge chat state lives in the **single shared site Supabase
project**, in a dedicated `concierge` Postgres schema (not `public`).
Same project across environments; production-vs-test separation is by
schema, not by project. See `supabase/migrations/` (`0001` init, `0002`
tour context) and each migration's `.md` walkthrough. The schema must be
added to the Dashboard's **Settings → Data API → Exposed schemas** or
every request fails with `PGRST106`.

## Local-shell gotchas (macOS/zsh, this workstation)

These bit the Session 3 build; documented so they're worked around, not
rediscovered:

- **Don't `cd` into the project inside a Bash tool call.** A shell hook on
  `chpwd` mangles `PATH` for that invocation (bare `curl`/`sort`/`tr`
  become "command not found"). The tool's working directory is already the
  project root — just run commands directly, or use absolute binary paths
  (`/usr/bin/curl`).
- **Don't `source .env`.** `WP_APPLICATION_PASSWORD` contains spaces, so
  sourcing tries to execute part of the value as a command and corrupts the
  shell. Read individual values with `grep '^KEY=' .env | cut -d= -f2-`.
- **Dev server + `.next` cache:** running `npm run build` and `next dev`
  against the same `.next`, or rapidly restarting dev, can corrupt the
  webpack cache (`incorrect header check`, missing `vendor-chunks/*.js`,
  `JSON.parse` errors). Fix: stop the server, `rm -rf .next`, start clean.
  The **production build is the authoritative source of truth** for whether
  code is correct; dev-server flakiness here is environmental.
