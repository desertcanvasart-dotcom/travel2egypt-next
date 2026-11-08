# Session 11 — Pre-launch hardening: status

Tracks the S11 checklist in `production-build-brief-v2.md`. Updated 2026-08-02
(runtime-gate session; see "Runtime gates — results" at the bottom).

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
- ~~Not yet committed~~ — S11 code merged via PR #21 (2026-07-08).

## Runtime gates — results (2026-08-02, branch fix/s11-runtime-gate-findings)

Environment: local production build (`next start`, port 3000), real Anthropic
(org funded 2026-08-02) / Supabase / Resend / live getautoura.net.

### 1. E2E — PASS with 2 real findings, both FIXED (d79fc6c)
- **EN conversation → brief:** multi-turn wrap, Gate 1→2, panel captures
  accurate facts; contact trio enforced. `briefs` row rev 1,
  `autoura_webhook_status: sent` (1 attempt), receiver `status: received`
  with client/thread record on getautoura.net — first non-dry-run proof of
  the multi-tenant pipeline.
- **ES conversation → brief:** live ES wrap markers fired; extraction
  accurate (4 pax / 8 days / El Cairo+Hurghada); delivered `sent`.
- **FINDING (fixed): revision send was unreachable end-to-end.** Client only
  fired Gate 2 when no brief existed, and /api/brief's idempotency guard
  returned the cached rev-1 payload unconditionally (its own comment marked
  the S4 material-update trigger "deferred") — while the live agent PROMISES
  "the revised brief is on its way" in prose. Everything beneath (rev
  stamping, idempotent delivery, receiver contract) was already
  revision-ready. Fix: client re-arms after "Continue conversation";
  route re-extracts when a fresh Gate-1 wrap postdates
  `brief_completed_at`. Live-verified: rev 1 `received` → rev 2 `updated`.
- **⚠️ OPEN (logged, not fixed): Gate-1 marker corpus misses revision-wrap
  phrasings.** On revision wraps the live agent abbreviates ("brief is with
  the team", "within the timeframe I mentioned", "by 10 a.m. tomorrow
  morning") — none match the 9 EN markers, which were calibrated on FIRST
  wraps. Observed live 3×. Needs an L2-harness calibration round for
  revision scenarios (add revision personas + recalibrate markers).
- **Persistence + reload:** conversation + brief panel restore. ✓
- **Save + resume cross-device:** resume email accepted by Resend
  (`delivered@resend.dev`; NOTE Resend rejects example.com test addresses —
  the 500 seen was that, not an app bug); middleware re-attached the session
  cookie on a cookie-less request from the HMAC token; all 8 messages +
  brief restored. ✓
- **Escape hatch ×3:** whatsapp (wa.me URL + sessionRef), forward (team
  email sent, confirmation state), continue (modal closes, input re-arms);
  conversation row records action + `flagged: escape_hatch_used`. ✓
- **Abuse termination:** 2 injection signals deflected, 3rd → `terminated`
  429 before any model call; subsequent turns blocked at entry. ✓
- **Delete → anonymize:** UI flow + DB verified — session email nulled,
  `anonymized_at` stamped, every message `[deleted]`, brief visitor nulled,
  fresh chat state. ✓
- **Link-map deep links:** `?tour=<slug>` renders the resolved-title opening
  line; garbage slug degrades silently; canonical on the param URL points to
  clean `/plan-your-tour` (no indexable variant). ✓
- **Network-fail path:** rejected fetch → "That message didn't go through" +
  Retry; retry delivers. ✓ (API-timeout not separately simulated; slow-path
  timer exists in client.)
- **Admin review:** email-OTP login through the real verify route (OTP
  minted via GoTrue admin API), conversations list + detail render, review
  POST persists rating + `reviewed` (contract: `rating`, `noteCategories`
  controlled vocabulary, `markReviewed`). ✓

### 2. Performance — BELOW TARGET (pre-existing, not a regression; decision needed)
Lighthouse 12.8.2, headless Chrome, defaults (simulated mid-range mobile):
- /plan-your-tour: perf 68 / a11y 100 / bp 100; FCP 2.2s, LCP 7.8s, TTI 7.8s
- home: perf 68 / a11y 100 / bp 100; FCP 2.2s, LCP 8.1s
- Unthrottled observed run: perf 94, FCP=LCP=TTI 2.5s, TBT 0ms.
- Targets (95+/…, FCP<1.5s, TTI<2.5s mobile) are NOT met under simulation.
  Site-wide cause, not concierge: 5 render-blocking CSS files (~1.2s
  simulated), unused CSS ~750ms / unused JS ~820ms, LCP = header wordmark
  (font-chain render delay 7.5s under simulation). Server is fine (warm
  TTFB ~110ms dynamic / 14ms static). SEO-category fails are localhost
  artifacts (noindex header + production-origin canonical — both intended
  pre-cutover). Chat is statically imported on /plan-your-tour — it IS the
  page content; nothing else to lazy-load there.
- Recommendation: treat as its own perf session (CSS consolidation, font
  preload/display tuning, unused-JS pruning) or consciously relax the
  target; not a concierge-launch blocker per se since home scores the same.

### 3. Accessibility — automated portion PASS after fixes; SR passes remain
- Lighthouse a11y now 100 on both pages (was 91 on /plan-your-tour). Fixed:
  `--cnc-ink-muted` contrast (3.7→≥4.5:1), escape-button accessible name on
  mobile, TrustStrip listitem-on-anchor.
- `aria-live="polite"` announcer verified live (completed assistant messages
  mirrored to the sr-only region); cooldown/flash use `role="status"`.
- STILL OWNER: VoiceOver + NVDA manual passes, `prefers-reduced-motion`
  spot-check on a real device.

### 4. Rate-limit under load — PASS
Thresholds env-overridden (same code path) on a second instance:
- Per-session: N allowed → 429 `scope:session` + cooldown; retry inside the
  window re-arms the cooldown (designed soft-limit behavior).
- Per-IP: summed across sessions (cookie-cleared) → 429 `scope:ip`,
  retryAfter 3600. Also tripped naturally by the day's accumulated E2E
  messages — cross-session summation proven twice.
- Client treatments verified: session cooldown notice (`role=status`, input
  disabled, auto re-enable) and the per-IP hard-block fallback panel
  ("Our team is ready to help" + Contact/WhatsApp CTAs).
- Test rows cleaned after (conversations, sessions, rate_limits).

### 5. Sentry live test — STILL OWNER (set SENTRY_DSN + NEXT_PUBLIC_SENTRY_DSN, then trigger + inspect scrubbing)

### 6. Redirect-map absence — confirmed correct in code; owner one-word sign-off outstanding

### Test-artifact residue (intentional, for owner)
- getautoura.net Travel2Egypt tenant: 4 test client records
  ([deleted]/Sam Tester rev1, Rania Probe, Ana Prueba, Kim Revtest rev1+2)
  — delete in the platform UI.
- Team inbox: one `[S11 E2E]`-style handoff email + possibly a hostile-content
  alert from the abuse probe — ignore/delete.
- t2e Supabase: all synthetic rows deleted same evening (verified 0 remain).
