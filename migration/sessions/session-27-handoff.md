# Session 27 — Standalone Sanity Studio deployment

**Date:** 2026-05-16
**Branch:** `session-27-studio-deploy`
**Numbering note:** prompt said SESSION 26 but session 26 already exists on
main (slug visibility). Numbered 27 to keep history linear.

## Deployed Studio

**URL:** **https://travel2egypt.sanity.studio/**

Multi-workspace, both datasets reachable from one URL:
- https://travel2egypt.sanity.studio/production
- https://travel2egypt.sanity.studio/staging *(= migration-staging dataset, current source of truth)*

Studio loads the default workspace selector on the root URL. Team members
pick the workspace at sign-in.

## What this session actually did

`sanity.config.ts` and `sanity.cli.ts` already existed at root — a previous
session set up the standalone config (multi-workspace) but never ran
`sanity deploy`. This session:

1. Confirmed CLI login + project access (ufallvd2, 3 members already).
2. Ran `sanity build` clean (~3s, 2 schemas).
3. Ran `sanity deploy`. CLI registered the `travel2egypt` hostname (was
   never claimed before) and pushed the bundle. Total deploy ~10s.
4. Added `studio:dev`, `studio:build`, `studio:deploy` npm scripts so
   the workflow is `npm run studio:deploy` going forward.

Embedded Next.js Studio at `/studio/staging` and `/studio/production` is
untouched and continues to work via `npm run dev`.

## Build / runtime version notes

CLI flagged two warnings on build, neither blocking:

1. `styled-components ^6.1.14` declared vs `^6.1.15` required by sanity.
2. Local `sanity` + `@sanity/vision` are 3.99.0 but runtime serves 4.22.0
   (auto-updates is enabled, so the deployed Studio gets the runtime
   version, not the locally-built one). Worth a `npm install sanity@latest
   @sanity/vision@latest` to align local dev with runtime.

Sanity is moving to v4 on July 15 with a Node 20+ requirement. Node v20.20.2
already in use here — no action needed before then, but the v3→v4 upgrade is
on the horizon.

## CORS

Sanity's `*.sanity.studio` URLs are pre-allowlisted on every project — no
CORS step needed for the deployed Studio itself. CORS only matters for the
embedded Next.js Studio when accessed from production domains (your
travel2egypt.com origin is presumably already added; if not, that's a
separate ticket).

## Inviting team members

Operator does this manually via web UI — Claude can't.

1. Open https://www.sanity.io/manage/project/ufallvd2/members
2. Click **Invite project members**
3. For each email, pick a role:

| Role | What they can do | Use for |
|---|---|---|
| **Administrator** | Everything: members, settings, datasets, deploys, content | Trusted leads only |
| **Developer** | Deploy schema/Studio + full content access | Devs (yourself) |
| **Editor** | Create/edit/publish documents, can't change schema or members | Most editorial team |
| **Contributor** | Create/edit, but **cannot publish** (changes stay in drafts for review) | Reviewers, juniors |
| **Viewer** | Read-only | Stakeholders who shouldn't edit |

Default recommendation for the editorial team: **Editor**. Reserve
**Administrator** for yourself + one backup.

Invited members get an email with a sign-in link. First sign-in creates
their Sanity account (Google / GitHub / email OTP).

## Dataset behavior

Both Studios (deployed + embedded) read and write the same Sanity
datasets — there's only one canonical dataset per environment. So:

- An editor publishing a doc via https://travel2egypt.sanity.studio/staging
  has the same effect as a local dev publishing via `npm run dev` →
  http://localhost:3000/studio/staging.
- Drafts created in one Studio appear in the other (within a few seconds
  of refresh).

This is by design and matches how Sanity Studios are meant to coexist.

## How to redeploy

After schema or structure changes:

```bash
npm run studio:deploy
```

CLI uses the already-registered `travel2egypt` hostname. ~10s end-to-end.
No prompts.

To deploy a preview/branch Studio under a different hostname:
```bash
npx sanity deploy --source <branch-name>
```
(would need to set a different hostname in `sanity.cli.ts` temporarily).

## Plan / billing

Project is on the Growth Trial — 11 days left at the time of the original
prompt. The deployed Studio is included in all paid plans; staying on
trial does not block deploy. After trial expires, choose a plan at
https://www.sanity.io/manage/project/ufallvd2/plan — Growth ($99/mo) or
Free (with limits). Operator monitors.

## Outstanding from prior sessions (unchanged)

- Session 21 orphan drafts (4 docs)
- `grand-islamic-cairo-day-tour` misclassification (session 24)
- `itineraryPhases` future schema candidate (session 24)
- Fallback hero images decision pending (session 25 follow-up)
- Bulk `poweredBy` assignment plan pending operator confirm (session 25
  follow-up — 25 cruise-ships → engine, 9 dahabiyas → wind)
