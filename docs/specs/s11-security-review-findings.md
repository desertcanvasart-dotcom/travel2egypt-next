# Session 11 — Security review findings (concierge)

Static audit against the S11 deliverable-4 checklist in `production-build-brief-v2.md`.
Date: 2026-07-08. Scope: `src/app/api/**`, `src/lib/concierge/**`, `src/lib/admin/**`,
`src/lib/linkMap/**`. No code changes were required by this audit — the surfaces below
were already implemented across S2–S10; this documents the verification.

## Checklist results

| # | Requirement | Status | Evidence |
|---|-------------|--------|----------|
| 1 | Every `/api/*` verifies the signed session cookie | ✅ PASS | Concierge routes resolve via `ensureSession()` → `verifyCookieValue()` (`src/lib/concierge/session.ts`). Mutating routes that must not mint use `createIfMissing:false` and return `401 no_session` on null (`brief`, `escape-hatch`, `data-request`); read-only `conversation` GET returns empty. `locale-resolve/*` are intentionally-public SEO helpers (no session — read-only Sanity lookups). |
| 2 | Admin routes verify Supabase session **and** `ADMIN_EMAILS` | ✅ PASS | `requireAdminSession()` (`src/lib/admin/guard.ts`) wraps `getAdminSession()` (two-factor: Supabase Auth session AND allowlist, `src/lib/admin/whitelist.ts`); fails closed with `401 unauthorized`. |
| 3 | Autoura HMAC | ✅ PASS | S9 `src/lib/concierge/autoura/sign.ts` (HMAC-SHA256, `${t}.${rawBody}`), live-verified against the real receiver's verifier at S9. |
| 4 | Markdown only via `marked` + DOMPurify; link allowlist + `rel="noopener noreferrer"` | ✅ PASS | `src/lib/concierge/markdown.ts`: `ALLOWED_TAGS` = formatting + `a`; `ALLOWED_ATTR` = `href` only. `afterSanitizeAttributes` hook strips non-`http(s)`/relative hrefs (kills `javascript:`/`data:`), enforces the agent-link map allowlist, and sets `target=_blank` + `rel=noopener noreferrer`. Post-processor links are built with DOM ops (`createElement`/`setAttribute`/`textContent`, never `innerHTML`) and also carry `rel=noopener noreferrer`. |
| 5 | Link map cannot emit a link to a noindex/disallowed target | ✅ PASS | `src/lib/linkMap/resolve.ts:51` returns `null` when `isRobotsDisallowed(path)` (robots SSOT `src/lib/robotsPolicy.ts`). Seed script additionally re-verifies robots-indexability at write time. |
| 6 | IP/UA stored only as keyed HMAC; no raw IP in logs | ✅ PASS | `src/lib/concierge/ipHash.ts`: `clientIp()` is consumed only inside `hashedIp()` in the same file — the raw IP never leaves the module; callers receive only the keyed HMAC. Grep of `console.*` across `api/**` + `lib/concierge/**` shows zero raw-IP logging. |
| 7 | Tampered session cookie rejected | ✅ PASS | `verifyCookieValue()` returns null on HMAC mismatch → `ensureSession` treats it as absent (fresh session for minting routes, `401`/empty for non-minting) — never an error. |
| 8 | CSRF / same-origin on mutating routes | ✅ PASS (hardened) | Session cookie is `HttpOnly; Secure; SameSite=Lax` (`src/lib/concierge/cookie.ts:88-91`) — the primary defense (Lax withholds the cookie on cross-site `POST`, and routes parse JSON-only bodies). **Now also enforced explicitly**: `assertSameOrigin(req)` (`src/lib/http/sameOrigin.ts`) is the first statement in every mutating handler (`chat`, `brief`, `escape-hatch`, `resume`, `data-request`, `conversation` POST + admin `review` POST) — rejects `Sec-Fetch-Site: cross-site` (else Origin-host ≠ Host) with `403`, allows same-origin, and no-ops for non-browser callers with no origin signal (SameSite=Lax remains the guard). 8/8 unit assertions pass. |
| — | Secrets never reach the client | ⏳ deferred to bundle grep (task #4) | Verified after production build completes. |
| — | Rate limiting triggers under load | ⏳ deferred to load test | S7 built + unit-verified; the S11 "under load" exercise is a runtime task (needs running server). |

## Recommendation (low severity, optional defense-in-depth) — ✅ IMPLEMENTED 2026-07-08

Added `src/lib/http/sameOrigin.ts` (`assertSameOrigin(req)`) and called it as the first
statement in every mutating handler (`chat`, `brief`, `escape-hatch`, `resume`,
`data-request`, `conversation` POST + admin `review` POST). Policy: trust the browser's
`Sec-Fetch-Site` (reject only `cross-site`); else compare `Origin` host to `Host`; else
(no signal) allow, leaving `SameSite=Lax` as the guard for non-browser callers. Belt-and-
suspenders against a future cookie-attribute regression or a same-site subdomain foothold.
Verified with 8/8 runtime assertions; `tsc` clean.

## Not a finding (intentional design, recorded to prevent re-discovery)

- `locale-resolve/*` routes are public and sessionless by design (SEO locale-alternate
  resolution over published Sanity content). No mutation, no PII.
- Session `SameSite=Lax` (not `Strict`) is deliberate — `Strict` would drop the cookie on the
  email-resume top-level navigation (`?resume=` link), breaking cross-device resume.
