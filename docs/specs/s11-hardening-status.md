# Session 11 — Pre-launch hardening: status

Tracks the S11 checklist in `production-build-brief-v2.md`. Updated 2026-07-08.

## Done this session (code + static verification)

### ✅ Known issue cleared — `nav.*` MISSING_MESSAGE
`nav.faqLabel`, `nav.hotelGradeConcept`, `nav.responsibleTravel` are present in the
`nav` namespace across `messages/{en,es,ja}.json`. Production build is **`MISSING_MESSAGE`-free**
(grep of the full build log = 0). The only build warning is the pre-existing
"custom routes exceeds 1000" from the 3,321-row redirect map — benign, unrelated to concierge.

### ✅ Security review (deliverable 4) — see `s11-security-review-findings.md`
Full static audit. All checklist items PASS except CSRF, which is **mitigated** via
`SameSite=Lax` + JSON-only bodies (no explicit `Origin` assertion — a low-severity
defense-in-depth recommendation is logged in the findings doc). No code changes were
required by the audit — the surfaces were already correctly implemented across S2–S10.

### ✅ Bundle safety (deliverable 2/4)
Grepped all 194 client chunks after a production build:
- **Secret values** (from `.env`) for `SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY`,
  `AUTOURA_WEBHOOK_SECRET`, `SESSION_COOKIE_SECRET`, `IP_HASH_SECRET`, `CRON_SECRET`,
  `RESEND_API_KEY`, `RESUME_TOKEN_SECRET` — **0 occurrences each**.
- Env-var **names** — 0 each.
- **Anthropic SDK** markers (`api.anthropic.com`, `anthropic-version`, `@anthropic-ai`,
  `x-api-key`) — **0**.
- **Supabase server client** markers (project host, `supabase.co`, `service_role`,
  `.schema('concierge')`, `PostgrestClient`) — **0**. (The word "concierge" appears in 9
  chunks as UI copy — benign.)

### ✅ Cutover checks (deliverable 6)
- `/plan-your-tour` and `/es/plan-your-tour` are **not** redirect sources in
  `migration/redirect-map.csv` (grep = 0) — they render, are not 301'd away, and no stale
  legacy URL hijacks them.
- **Preview-noindex mechanism confirmed:** `src/middleware.ts:59-61` sets
  `X-Robots-Tag: noindex, nofollow` on any non-production host (`isProductionHost`), and the
  matcher (`'/((?!api|studio|admin|_next|_vercel|.*\\..*).*)'`) covers the concierge route.
  Auto-lifts at DNS cutover with no redeploy.
- **Canonical/hreflang confirmed:** `buildStaticMetadata` → production-origin canonical
  (host-independent; Railway never self-canonicalizes), hreflang for en/es/ja + `x-default`,
  robots indexable (no `noIndex`).

### ✅ Sentry wired (deliverable 5) — cookieless, PII-scrubbed, dormant until DSN
New files:
- `src/lib/monitoring/sentryScrub.ts` — shared `beforeSend` scrubber used by all three
  runtimes. Drops `user` (IP/email), request cookies/headers/body/query-string; scrubs
  breadcrumbs (console text, fetch/xhr bodies, token URLs); redacts emails/phones from
  exception + message text. Policy: never message content, emails/names/phones, brief
  payload, raw IPs; may keep opaque IDs, counts, stacks, status codes, response times,
  browser/OS.
- `src/sentry.server.config.ts`, `src/sentry.edge.config.ts` — `Sentry.init` per runtime,
  `sendDefaultPii: false`, `beforeSend: scrubEvent`, loaded from `instrumentation.ts`
  `register()` behind positive `NEXT_RUNTIME` guards (same Edge/Node separation as the S9
  reconcile import).
- `src/instrumentation-client.ts` — browser init. **Cookieless: Session Replay is NOT
  enabled** (the only cookie/localStorage-setting feature). Default integrations kept.
  Client DSN via `NEXT_PUBLIC_SENTRY_DSN`. Exports `onRouterTransitionStart`.
- `src/app/global-error.tsx` — root error boundary reporting to Sentry (self-contained
  `<html>`/`<body>`).
- `src/instrumentation.ts` — merged: exports `onRequestError` (RSC errors) + loads the
  server/edge configs; S9 boot-sweep preserved.
- `src/app/(site)/[locale]/error.tsx` — now calls `Sentry.captureException` (the file's
  own TODO anticipated this).
- `next.config.ts` — wrapped with `withSentryConfig` (conservative: source-map upload only
  when `SENTRY_ORG`/`SENTRY_PROJECT`/`SENTRY_AUTH_TOKEN` all set; `telemetry: false`;
  `silent` off-CI; `bundleSizeOptimizations.excludeDebugStatements`). Inert with no auth token.
- `.env.example` — documented `SENTRY_DSN`, `NEXT_PUBLIC_SENTRY_DSN`, sample-rate vars,
  and the optional `SENTRY_ORG`/`SENTRY_PROJECT`/`SENTRY_AUTH_TOKEN` upload trio.

Verification: `tsc --noEmit` clean; production build **green (exit 0) + warning-clean**
(`MISSING_MESSAGE`=0, no Sentry deprecation, only the pre-existing routes>1000 warning);
fresh client bundle re-grepped — 0 secret leaks, 0 Anthropic SDK; Sentry client SDK present.
Middleware bundle grew 54kB→119kB (Sentry edge instrumentation — expected). No cookies set
(no Session Replay); this is enforced by config and should be re-confirmed at the runtime
Sentry live test (owner, item 5 below).

**⚠️ Build-memory finding (for S12/Railway/CI):** with the Sentry webpack plugin over 3,453
pages, a **cold** build (`rm -rf .next`) OOMs at Node's default heap (`FATAL ERROR: Reached
heap limit`, exit 134). Build with `NODE_OPTIONS="--max-old-space-size=8192"` (green at 8GB).
Warm-cache builds are lighter, but set this in the Railway/CI build env to be safe.

## Remaining — runtime / owner gates (not code)

These require a running server, real devices, or owner-supplied secrets, and are **not**
blocked by anything in code:

1. **E2E pass (deliverable 1)** — full EN+ES conversation → brief; error paths (network
   fail, API timeout, rate-limit cooldown, per-IP block→fallback, abuse termination);
   persistence+reload; save+resume cross-device; escape-hatch ×3; admin review; Autoura
   delivery + email fallback + a revision send; link-map deep links + noindex-not-linked;
   delete→anonymize in DB. Needs a running server + real Anthropic/Supabase/Resend.
2. **Performance (deliverable 2)** — Lighthouse 95+/100/95+, FCP<1.5s / TTI<2.5s mid-range
   mobile; lazy-load chat below the frame. Needs a running server + Lighthouse.
3. **Accessibility (deliverable 3)** — keyboard nav; **VoiceOver AND NVDA** SR passes with
   `aria-live="polite"` announcing completed messages; contrast AA; visible focus; ARIA;
   `prefers-reduced-motion`. Needs real screen readers.
4. **Rate-limit under load (deliverable 4)** — exercise per-session + per-IP thresholds to
   confirm they trigger. Needs a running server + load driver.
5. **Sentry live test (deliverable 5 verification)** — owner sets `SENTRY_DSN` +
   `NEXT_PUBLIC_SENTRY_DSN` (+ optional upload trio), triggers a test error, confirms it
   arrives **scrubbed** with **no PII** and **no cookies** set. Config is ready and dormant.
6. **Redirect-map presence (deliverable 6)** — the spec asks to "verify both concierge URLs
   are present in `redirect-map.csv`." They are correctly **absent** (a new route with no WP
   predecessor should not be a redirect source). Flagged for owner confirmation that absence
   is the intended state (it is — presence as a source would 301 the page away).

## Notes
- Optional low-severity hardening from the security audit: add an explicit `assertSameOrigin(req)`
  to mutating concierge routes + admin `review` POST as defense-in-depth over `SameSite=Lax`.
- Not yet committed — changes sit in the working tree pending owner review.
