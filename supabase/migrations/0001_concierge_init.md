# Migration 0001 — concierge schema init (walkthrough)

**Who applies it:** Islam, manually, via Supabase Dashboard → SQL Editor.
**Never** run this programmatically against the shared production database.

## What it creates

A dedicated `concierge` Postgres schema (kept out of `public` so a future
no-prices-portal can claim the bare `sessions` name, and so RLS scoping is
self-documenting) with five tables:

| Table | Purpose |
|---|---|
| `concierge.sessions` | One row per anonymous browser session (`cookie_id` = the UUID inside the signed `t2e_session_id` cookie). `ip_hash`/`user_agent_hash` stay NULL until Session 7 introduces keyed HMAC hashing. |
| `concierge.conversations` | One row per chat conversation; carries brief/review/flag state. Escape-hatch columns arrive in `0002`. |
| `concierge.messages` | Per-message persistence incl. response time, token counts, model version. |
| `concierge.briefs` | Extracted brief payloads + Autoura delivery state. `brief_revision` arrives in `0003`. |
| `concierge.rate_limits` | DB-backed rate limiting (used from Session 7). |

All five tables get RLS **enabled with no permissive policies** — deny-all.
The browser never talks to Supabase; all access is server-side via the
service role (`src/lib/supabase/server.ts`), which bypasses RLS. The RLS
wall is defense-in-depth, not the access path.

## How to apply

1. Supabase Dashboard → SQL Editor → paste the full contents of
   `0001_concierge_init.sql` → Run.
2. Dashboard → **Settings → API → "Exposed schemas"** → add `concierge`
   alongside the existing entries. **This step is required** (see findings
   below) — without it every `concierge.*` request from supabase-js fails
   with a PostgREST schema error (PGRST106), service role or not.
3. Verify: Table Editor → schema dropdown → `concierge` shows the five
   tables; each shows "RLS enabled" with zero policies.

## Non-`public`-schema findings (brief deliverable 2)

Verified against the Supabase docs ("Using Custom Schemas", checked
2026-06-10) and recorded here per the build brief:

1. **JS client targeting.** `createClient(url, serviceKey, { db: { schema:
   'concierge' } })` pins the whole client to the schema (table names are
   then bare: `.from('sessions')`). A per-query alternative exists
   (`client.schema('concierge').from(...)`). We use the client-level option
   in `src/lib/supabase/server.ts` since this client touches nothing else.
2. **"Exposed schemas" IS required — the brief's "likely not" was wrong.**
   PostgREST only serves schemas listed in its config; the `Accept-Profile`
   / `Content-Profile` headers supabase-js sends must name an exposed
   schema. This is a PostgREST routing concern, not a permissions concern,
   so the service role does NOT bypass it. Hence Dashboard step 2 above.
3. **Grants are required and are scoped to `service_role` only.** The docs'
   boilerplate grants USAGE/ALL to `anon, authenticated, service_role`; we
   deliberately grant only `service_role`. Exposing the schema makes it
   *addressable* with the anon key, but anon/authenticated lack USAGE on
   the schema, so they fail at the Postgres permission layer before RLS is
   even consulted. Two independent walls: no grants, and deny-all RLS.
4. **RLS in a non-`public` schema behaves identically** — `enable row level
   security` + no policies = deny-all for any role that doesn't bypass RLS;
   `service_role` carries `bypassrls`. No schema-specific caveats found.
5. **Default privileges** are set for future tables/sequences created by
   `postgres` (the role the SQL Editor runs as), so migrations `0002`/`0003`
   don't need to repeat the grants for altered/new objects (new columns
   inherit table grants anyway).

### Runtime confirmation (2026-06-10, after Islam applied the migration)

All four findings above were confirmed against the live project
(`Travel AI Negotiator`, eu-west-1):

- **Before** the schema was added to Exposed schemas, every `concierge.*`
  request — service role included — failed exactly as predicted:
  `PGRST106 "Invalid schema: concierge"` / "Only the following schemas are
  exposed: public, graphql_public". After adding it: HTTP 200.
- All five tables reachable through the JS-client wire format
  (`Accept-Profile: concierge`) with the service role.
- The **anon key** gets `42501 permission denied for schema concierge` —
  it fails at the grants layer before RLS is consulted, as designed.
- Full E2E through `/api/chat`: streaming v4.1 response, user+assistant
  rows persisted with `response_time_ms` (~2.2–2.5 s), token counts
  (~13.2k in / per-reply out), `model_version: claude-sonnet-4-6`;
  conversation continuity via the signed cookie; tampered cookie re-mints;
  start-new archives. `prompt_version` default `v4.1` populates correctly.

## Type generation

`src/types/concierge-db.ts` is hand-written to match this migration (the
migration had not been applied at authoring time, so `supabase gen` had
nothing to introspect). After applying, it can be regenerated and diffed:

```sh
npx supabase gen types typescript --project-id <project-ref> --schema concierge
```
