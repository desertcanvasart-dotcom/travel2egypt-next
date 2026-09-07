# Delivery readiness — 2026-09-07

Owner-facing runbook for handing the site over. Every line here was verified
against the system of record today (git, CI, the Railway host, Sanity, DNS),
not from memory. Ordered: what blocks delivery, then what to do on the day,
then what is safely deferrable.

## 0. Where we stand

| Area | State | Evidence |
|---|---|---|
| Code on `main` | GREEN | `main == origin/main` at 187725e; tsc clean; concierge 97 / linkmap 37 / redirect 3657 assertions pass; CI green on the last 3 pushes |
| Railway deploy | on main HEAD | Kayak partner mark + Rosetta redirects live on the host |
| Sanity `production` dataset | current | 210 tours, 70 FAQ entries, legal pages stamped 2026-08-18 |
| Railway → Sanity dataset | FIXED 2026-09-07 13:50 | `NEXT_PUBLIC_SANITY_DATASET` was `migration-staging` on Railway; now `production` + rebuilt. Host verified: production image paths on / /es /ja, 70 FAQ questions, privacy "Last updated August 18, 2026", legacy redirects resolve, chat streams |
| Concierge DB (Supabase) | RESTORED 2026-09-07 | project resolves again, all 6 `concierge` tables + data intact (7 conversations / 2 briefs); host `/api/chat` streams a full reply |
| Autoura canary cron | GREEN again (2026-09-07) | dry-run 200, brand_mapping route, signer valid — Railway AUTOURA_* is fixed |
| Quality-sample cron | GREEN (2026-09-07 manual run) | `"ok":true` after DB restore + new Anthropic key on Railway |
| Indexing | noindex, host-gated | `x-robots-tag: noindex, nofollow` on the Railway domain; lifts itself when `Host: travel2egypt.org` |
| DNS | still WordPress | Step 6 of the content cutover, never started |

**All three blockers closed 2026-09-07.** B1: Railway dataset variable fixed +
rebuilt. B2: Supabase project restored (was paused) and an invalid Anthropic
key replaced. B3: both harness crons green. What remains is the pre-cutover
owner/counsel list (§2) and the cutover sitting itself (§3).

## 1. Blockers (owner, in this order)

### B1 — ~~Point Railway at the `production` dataset, then REBUILD~~ ✅ CLOSED 2026-09-07

Railway had `NEXT_PUBLIC_SANITY_DATASET=migration-staging`. Owner set it to
`production` and redeployed; host switched at 13:50 and every check below
passed. Steps kept for the record.


Every content fix since June (prices, climate copy, legal A2/A3, the 70-entry
FAQ, tour dedups, hero swaps, Solar Boat rewrite) is invisible on the host.

1. Railway → service `travel2egypt-next-production` → Variables.
2. Set `NEXT_PUBLIC_SANITY_DATASET=production`. If `SANITY_STUDIO_DATASET`
   exists there too, set it to `production` as well (it wins in `src/sanity/env.ts`).
3. Trigger a **redeploy that rebuilds** (Deployments → Redeploy, or push an
   empty commit). `NEXT_PUBLIC_*` is inlined at build time; a restart is not enough.
4. Verify:

```bash
curl -sL https://travel2egypt-next-production.up.railway.app/ | grep -oE "ufallvd2/[a-z-]+" | sort -u
```

Expected: only `ufallvd2/production`. Then open `/faq` and count 70 entries,
and `/privacy-policy` should show the 2026-08-18 "last updated" stamp.

### B2 — ~~Restore the concierge Supabase project~~ ✅ CLOSED 2026-09-07

Project restored by the owner; verified from this Mac and via the host chat
route. The Anthropic key was also invalid and has been replaced on Railway +
local `.env`. Still recommended before cutover: **upgrade to Pro** (a paused
Free-tier DB takes the concierge down) and move ownership to @travel2egypt.org.
Original steps kept below for the record.


The project "Travel AI Negotiator" (org under hello@autoura.net, Free plan) no
longer resolves. Free-tier projects pause after inactivity and are deleted
after a further 90 days. Log in to the hello@autoura.net dashboard and check.

- **If paused:** click Restore. Wait for the project to come up, then re-run
  the quality sampler (`gh workflow run "Quality sample"`) — it should return
  `"ok":true`. No env changes needed.
- **If deleted:** recreate under the @travel2egypt.org account (this was the
  S12 gate that was never done: Free→Pro + ownership move), then:
  1. Apply `supabase/migrations/0001` … `0008` in order (SQL editor or CLI).
  2. Expose the `concierge` schema in Project Settings → API → Exposed schemas.
  3. Copy the new `SUPABASE_URL` + service-role key into Railway variables
     **and** local `.env`; redeploy.
  4. Re-verify: host `/api/chat` no longer returns `chat_unavailable`;
     quality-sample cron green.
- Either way: **upgrade to Pro** before DNS cutover. A paused DB takes the
  concierge down with it, which is the only conversion surface on the site.

### B3 — ~~Harness crons~~ ✅ CLOSED 2026-09-07

- Autoura canary: fixed itself when Railway env was corrected (green 2026-09-07).
  Nothing to do; keep an eye on next Monday's run.
- Quality sample: manual run 2026-09-07 10:36 UTC returned `"ok":true`.

## 2. Pre-cutover (owner / counsel, from `docs/s47-launch-checklist.md`)

- ~~**B4** Sentry named as processor + cookie policy softened~~ ✅ DONE
  2026-09-07 ×3 locales (`scripts/s47-legal-b4-sentry.ts`). Cloudinary not
  used. `SENTRY_DSN` / `NEXT_PUBLIC_SENTRY_DSN` may now be set on Railway.
- ~~**B6** EU/UK Art. 27 representative + transfer basis~~ ✅ CLOSED 2026-09-07 — counsel: OK as is.
- ~~**B7** Imprint / 特定商取引法 page~~ ✅ CLOSED 2026-09-07 — owner: not needed.
- ~~**C9** About-page meta description~~ ✅ CLOSED 2026-09-07 — owner: fine as is.
- ~~**C12** Footer public email~~ ✅ CLOSED 2026-09-07 — owner: WhatsApp-first
  stays. ⏳ New WhatsApp number to come: one constant in
  `src/lib/concierge/constants.ts` + the two legal pages' contact lines ×3.
- **S11 owner gates:** VoiceOver + NVDA pass on `/plan-your-tour`; Sentry
  DSN live test — step-by-step in `docs/go-live-steps-sentry-dns-2026-09-07.md`
  Part A. ~~delete the 4 test client records in getAutoura~~ ✅ CLOSED
  2026-09-07: owner says they are real tenants with their own content — keep.
  Redirect-absence sign-off: moot.
- ~~**Standalone Studio deploy**~~ ✅ DONE 2026-09-07 — `npm run studio:deploy`
  succeeded (2/2 schemas deployed, https://travel2egypt.sanity.studio/ → 200).
- ~~**Two heroes with a third-party watermark**~~ ✅ CLOSED 2026-09-07 — both
  found by asset filename. (1) Port Said weather hero: already re-imaged
  2026-07-12; the watermarked asset is now an unreferenced orphan
  (`El-Ahmar-Sinai-Go-tell-it-on-the-mountain_result-1.jpg`) — owner may
  delete it from the Studio asset library. (2) History of Asyut
  (wp-page-59260): a watermarked *Sinai* photo — swapped to the Asyut city's
  own 8090px Nile-shore panorama, alt+caption ×3 rewritten; the city doc's
  wrong alt ("mosque at dusk") corrected at the same time. Verified on the
  host in EN/ES/JA. Script + rollback: `scripts/asyut-history-hero-swap-2026-09-07.ts`.

## 3. Cutover day (Step 6 — own sitting)

> Full step-by-step (Cloudflare records, Railway domain setup, SSL mode, WP
> rule cleanup, verification, rollback): `docs/go-live-steps-sentry-dns-2026-09-07.md` Part B.

1. B1 + B2 done and verified. Sentry DSN set (after B4).
2. Point travel2egypt.org (Cloudflare / registrar) at the Railway service;
   add the custom domain in Railway so it issues the certificate.
3. Header check — the noindex lift depends on the origin seeing the real host:

```bash
curl -sI https://travel2egypt.org/ | grep -i x-robots
```

Must print nothing.

```bash
curl -s https://travel2egypt.org/robots.txt | head -2
```

Must show `Allow: /`. If a proxy rewrites Host to `*.up.railway.app`, the
site stays silently noindexed.

4. Spot-check one URL per surface in all three locales: `/`, a tour, a guide
   article, `/faq`, `/plan-your-tour` (send one test brief; it should reach
   getAutoura under the travel2egypt brand), `/privacy-policy`.
5. Submit the sitemap in Search Console.
6. **Rollback** = point DNS back at WordPress (untouched throughout). The
   pre-cutover Sanity backup is `backups/production-pre-cutover-2026-06-12.tar.gz`.

## 4. Repo housekeeping (safe, no runtime effect)

- PRs [#106](https://github.com/desertcanvasart-dotcom/travel2egypt-next/pull/106)
  and [#107](https://github.com/desertcanvasart-dotcom/travel2egypt-next/pull/107)
  are script-only audit trails of Sanity writes already applied to production.
  Both merge cleanly into `main` today (0 conflict hunks). Merge or close.
- PR [#102](https://github.com/desertcanvasart-dotcom/travel2egypt-next/pull/102)
  (homepage redesign) stays a DRAFT under the standing hold — do not merge.
- `docs/imported-link-audit-2026-08-19.csv` is an untracked audit output
  (same shape as the committed 2026-07-05 one) — commit as an audit trail.

## 5. Deferred, not launch-blocking

9 FAQ VERIFY drafts (owner fact-check; list in
`migration/faq-import-report-2026-08-19.md`) · `drafts.wp-page-89619` owner WIP
tour + 6 other stale tour drafts from July (harmless, discard or finish) ·
Safaga group-tour rewrite/retire · Kom Ombo accommodation hero · deferred hero
sourcing (Sohag / Kom Ombo / Safaga / AWG / Saint Catherine) · 47 heroes
awaiting owner images · mobile perf accepted at ~87 · fenced E-projects
(price-manifest JA render gap, weather body copy, 7 factual items) ·
`siteSettings.defaultOgImage` still null (falls back to `/og-default.png`).
