# Travel2Egypt AI Concierge — Production Build Brief v2

*Master technical specification for Claude Code. Supersedes `production-build-brief.md` (the standalone-application brief).*

*Target: an in-site route at `/plan-your-tour` within the existing Travel2Egypt Next.js 15 codebase (`/Users/islamhussein/t2e`). Not a standalone application, not a subdomain, no WordPress redirect. The concierge ships and deploys with the rest of the site.*

*This document is the reframed build brief produced by walking the original twelve-session plan against the verified state of the t2e codebase. Where the original brief or the integration decisions summary (v1.1) contradicted the actual code, the code won; those corrections are recorded in Appendix C. It is written to be executed without reading the original brief or the reframing conversation.*

---

## How to use this document

The build is twelve sequential sessions plus one dedicated Link-Map section (sequenced after Session 8). Each is a reviewable, committable increment against the `t2e` repository. Run them in order; earlier sessions establish foundations later ones depend on. Branch per session off `main`; one commit per session with the specified message.

Flag substantive decisions (anything touching visitor experience, the data model, or integration contracts) before implementing. Trivial implementation details are decided autonomously and noted in the session summary.

Reference materials:
- `travel-to-egypt-agent-system-prompt-v4.1.md` — the agent's instructions. **Locked. Do not modify.** ~8,500 words. Where a behavior must be influenced (locale bias, wrap-up nudge), do it via **runtime context injection**, never by editing this file.
- `concierge-page-design-spec.md` — visual/behavioral spec for the page.
- `concierge-page-mockup-v2.html` — pixel-accurate visual reference. **The mockup governs visual scope where it conflicts with the design spec.** (The mockup's body font is replaced by the site's Source Serif 4; see Architectural decisions → Stack.)
- `ai-concierge-integration-decisions-summary.md` (v1.1) — orientation decisions. Authoritative *except* where it contradicts the code (Appendix C).
- The standalone test harness at `/Users/islamhussein/Tr-ai-nego` is **reference-only** — patterns may be consulted, nothing is ported wholesale, and it is never modified.

---

## Architectural decisions (already made)

**Stack.** The site already provides Next.js 15 (App Router, TypeScript), Tailwind v4 + design tokens, next-intl (en/es/ja), Sanity (content), the brand fonts (Cormorant Garamond + Source Serif 4 + Noto Serif/Sans JP), the site `Header`/`Footer`/`LocaleSwitcher`/`Wordmark`, the cookie-consent system, `JsonLd`, and `buildStaticMetadata`/`lib/seo`. The concierge **adds** two runtime dependencies: `@anthropic-ai/sdk` (chat) and `@supabase/supabase-js` (state); plus `marked` (already present, unused until now) and `isomorphic-dompurify` (new) for safe markdown rendering. Error monitoring (Sentry) is a net-new dependency introduced at Session 11.

**Hosting and routing.** Deployed as part of the site on Railway; no separate deployment, no subdomain. The site's existing host-gated indexing (`robots.ts` + `middleware.ts` noindex on non-production hosts; canonical URLs pinned to `travel2egypt.org` in `lib/site.ts`) carries the concierge through the same DNS cutover with no extra DNS work. Routes:
- `/plan-your-tour` — English (root, no locale prefix).
- `/es/plan-your-tour` — Spanish. **Shared static path** (not a localized slug). The site configures no next-intl `pathnames` map; introducing one for a single route would make the concierge the only static route breaking the site-wide convention. (Full rationale in Session 6.)
- `/ja/plan-your-tour` and any other non-EN/ES locale — in-site fallback (see Language scope). There is no WordPress fallback; the new site is the only site.

**Authentication.** None for visitors. Anonymous sessions via a signed, HTTP-only cookie `t2e_session_id`, scoped to the parent domain `.travel2egypt.org`. The admin reviewer panel uses **Supabase Auth, deliberately separate from Sanity Studio's authentication** — content editors must not gain access to customer conversation data.

**Persistence.** Conversations persist per-browser via the session cookie (opaque ID only; the conversation lives in Postgres). **Cookie max-age: 30 days.** Longer/cross-device continuity is the "Save my conversation" email-resume flow (Session 4).

**Language scope.** The agent operates in English and Spanish only (v4.1 language policy). `/plan-your-tour` and `/es/plan-your-tour` host the chat. Every other locale renders the in-site fallback (a contact path + WhatsApp) with a note that the concierge is available in English and Spanish, that language coming later. The agent's *conversation* language is owned entirely by v4.1 — only the static UI chrome is translated.

**Brief handoff.** Direct webhook to Autoura with a structured JSON payload, HMAC-SHA256-signed. The Autoura contract (URL, secret, field mappings, response codes, signature header) comes from Islam's Autoura team and is confirmed before Session 9 verification. Until then, the build proceeds against placeholders. Permanent failure → email fallback (Resend) + a real-time alert.

**Model.** Claude Sonnet 4.6. The exact API model string is pinned against Anthropic's current documentation at Session 2 (the original `claude-sonnet-4-5-20250929` is stale). Streaming via the Anthropic SDK over Server-Sent Events (native on Railway).

**Circuit breaker.** A single server-side environment variable `CHAT_ENABLED` (boolean) gates the chat **and** the `ConciergeCTA` destination. When `false`, `/plan-your-tour` renders the fallback and site CTAs point at `/contact`. It must remain server-side (a `NEXT_PUBLIC_` var inlines at build time, breaking runtime toggling), so `ConciergeCTA`'s server-component parents read it and pass a `chatEnabled` prop. Go-live and rollback are this single lever.

**Email.** Resend for all transactional mail (resume links, conversation forwards, webhook fallback, failure alerts, admin magic links). From `concierge@travel2egypt.org`, Reply-To → team Gmail inbox (`TEAM_INBOX_EMAIL`). Admin magic-link mail uses a separate from-address (`auth@`/`admin@`). Gmail/Workspace remains the team's human-handling infrastructure; Resend and Gmail coexist via Reply-To.

**Analytics.** Plausible, cookieless. Chat funnel events (chat started, conversation engaged, brief completed, escape hatch triggered/option-taken) are Plausible custom events. No consent gating is triggered.

---

## Database

All concierge tables live in the **single shared site Supabase project**, in a **dedicated `concierge` Postgres schema** (not `public`). Rationale: a future no-prices-portal will likely want the bare `sessions` name; a dedicated schema scopes RLS cleanly and is self-documenting in queries.

**Access model.** The browser never queries Supabase directly — it calls `/api/*` routes, which use the **service role**. RLS is therefore **defense-in-depth**: enabled on every table, with **no permissive policies** (anon and authenticated are denied at the table level). The admin panel is also server-mediated (Session 10), so no permissive RLS policies are added there either.

**Migrations.** Committed as `supabase/migrations/NNNN_concierge_*.sql` + a per-file markdown walkthrough. **Islam applies them via the Supabase Dashboard SQL Editor** — never run programmatically against the shared production database.

**Migration `0001_concierge_init.sql`:**

```sql
create schema if not exists concierge;

create table concierge.sessions (
  id uuid primary key default gen_random_uuid(),
  cookie_id text unique not null,
  created_at timestamptz not null default now(),
  last_active_at timestamptz not null default now(),
  ip_hash text,            -- keyed HMAC-SHA256 (IP_HASH_SECRET), never raw
  user_agent_hash text,    -- keyed HMAC-SHA256
  locale text not null default 'en',
  email text,
  email_verified boolean default false
);
create index sessions_cookie_id_idx on concierge.sessions(cookie_id);

create table concierge.conversations (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references concierge.sessions(id) on delete cascade,
  started_at timestamptz not null default now(),
  last_message_at timestamptz not null default now(),
  prompt_version text not null default 'v4.1',
  brief_completed boolean default false,
  brief_completed_at timestamptz,
  brief_payload jsonb,
  reviewed boolean default false,
  reviewer_rating int check (reviewer_rating between 1 and 5),
  reviewer_notes text,
  archived boolean default false,
  flagged boolean default false,
  flag_reason text   -- controlled vocab: 'escape_hatch_used' | 'prompt_injection_attempt'
                     -- | 'hostile_language' | 'off_topic_persistent' | 'repeated_identical'
  -- escape-hatch columns added in 0002; brief_revision support relates to concierge.briefs
);
create index conversations_session_id_idx on concierge.conversations(session_id);
create index conversations_brief_completed_idx on concierge.conversations(brief_completed);
create index conversations_flagged_idx on concierge.conversations(flagged) where flagged = true;

create table concierge.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references concierge.conversations(id) on delete cascade,
  role text not null check (role in ('user','assistant','system')),
  content text not null,
  created_at timestamptz not null default now(),
  response_time_ms int,
  token_count_input int,
  token_count_output int,
  model_version text
);
create index messages_conversation_id_idx on concierge.messages(conversation_id);
create index messages_created_at_idx on concierge.messages(created_at);

create table concierge.briefs (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references concierge.conversations(id) on delete cascade,
  created_at timestamptz not null default now(),
  payload jsonb not null,
  autoura_webhook_status text default 'pending'
    check (autoura_webhook_status in ('pending','sent','failed','retried')),
  autoura_webhook_response jsonb,
  autoura_attempts int default 0,
  email_fallback_sent boolean default false
  -- brief_revision int added in 0003
);
create index briefs_conversation_id_idx on concierge.briefs(conversation_id);
create index briefs_webhook_status_idx on concierge.briefs(autoura_webhook_status);

create table concierge.rate_limits (
  id uuid primary key default gen_random_uuid(),
  cookie_id text not null,
  ip_hash text,
  window_start timestamptz not null default now(),
  message_count int default 0,
  blocked_until timestamptz
);
create index rate_limits_cookie_id_idx on concierge.rate_limits(cookie_id);
create index rate_limits_blocked_idx on concierge.rate_limits(blocked_until) where blocked_until is not null;

-- RLS defense-in-depth: enable, no permissive policies (service-role access only).
alter table concierge.sessions      enable row level security;
alter table concierge.conversations enable row level security;
alter table concierge.messages      enable row level security;
alter table concierge.briefs        enable row level security;
alter table concierge.rate_limits   enable row level security;
```

Later migrations: `0002` (escape-hatch columns, Session 5), `0003` (`brief_revision`, Session 9).

---

## Operating principles (all sessions)

- **Stick to the spec.** Deviations require flagging before implementation, not after.
- **One session at a time.** Complete scope, present results, get sign-off, then proceed.
- **Flag decisions before implementing them.** Each session lists them.
- **The system prompt is locked.** Influence behavior via runtime context injection only.
- **Migrations are Islam's to apply** via the Supabase Dashboard. Commit `.sql` + markdown; never run them programmatically.
- **Verify before declaring done.** Run each session's verification; state explicitly anything not verified.
- **Cross-check the code, don't assume.** The reframing repeatedly found the code more accurate than the source docs. Continue verifying.
- **No silent changes to existing patterns.** Reuse `Header`/`Footer`/consent/seo/JsonLd; extract shared primitives rather than duplicating.
- **Surface unexpected complexity.** Split a session rather than silently double its scope.
- **Secrets never reach the client.** Server-only modules; verify by grepping the production bundle.

---

## Session 1 — Foundation and visual shell

**Scope.** Add the `/plan-your-tour` route with a static visual shell matching the mockup in the site's tokens and fonts. EN/ES render the concierge shell; other locales render the fallback. The chat is a non-functional placeholder. No backend.

**Deliverables.**
1. Route at `src/app/(site)/[locale]/plan-your-tour/page.tsx`, server component with `setRequestLocale`, inheriting the site layout (header, footer, consent provider, fonts). Metadata via `buildStaticMetadata`; add to `sitemap.ts`. OpenGraph + Twitter are inherited from `buildStaticMetadata`. Structured data: the site-wide `TravelAgency` JSON-LD from `layout.tsx` is inherited; no page-specific JSON-LD is added.
2. Locale gate: `en`/`es` → concierge shell; all other locales → `<ConciergeFallback reason="locale" />`.
3. Circuit breaker: read `CHAT_ENABLED` server-side; when `false`, render `<ConciergeFallback reason="disabled" />` regardless of locale.
4. New components in `src/components/`: `ConciergeFrame` (eyebrow, heading, subheading — eyebrow and the journey indicator are in scope per the mockup, which governs over the design spec's §2 omission), `JourneyIndicator` (three steps + connectors), `TrustStrip` (label + items, mockup glyph/star treatment — ships without partner-logo assets), `ChatContainer` (static placeholder: opening message, four starter chips, disabled input + send), `ConciergeFallback` (note + reuse of the existing `/contact` mechanism + WhatsApp link `wa.me/201158011600`; one component serving both `reason="locale"` and `reason="disabled"`).
5. All visible copy via a new `planYourTour` i18n namespace (distinct from the existing `concierge` marketing-band namespace) in `en.json`/`es.json`; fallback note string in every locale. No hardcoded strings.
6. Visual fidelity using the site's existing Tailwind v4 tokens (orange accent = `faience`) and Cormorant Garamond + Source Serif 4. Map any missing mockup shade into the site token set; do not introduce a parallel set.

**Decisions to flag.** Trust-mark assets + TripAdvisor URL are an external dependency (glyph treatment ships meanwhile); fallback reuses the `/contact` mechanism (verify at implementation whether `/contact` accepts a source/context param; surface if `/contact` is itself under construction); optional concierge-specific OG image deferred into the trust-marks asset batch.

**Verification.** `npm run build` clean; `en`/`es` render the shell, `ja` the fallback; `CHAT_ENABLED=false` forces fallback on all locales; mockup parity; Lighthouse ≥ 90 perf/a11y/SEO; FCP < 2s mid-range mobile.

**Commit.** "Session 1: Concierge route and static visual shell."

---

## Session 2 — Database schema and backend foundation

**Scope.** Create the `concierge` schema in the shared Supabase project, apply `0001`, build the server-side Supabase client and the chat API-route skeleton, implement signed session-cookie management, and prove the Anthropic SDK streams from a route. UI wiring is Session 3.

**Deliverables.**
1. `supabase/migrations/0001_concierge_init.sql` + `0001_concierge_init.md` walkthrough. Islam applies via Dashboard.
2. **Non-`public`-schema verification (before relying on it):** confirm the JS client reads/writes `concierge.*` via `createClient(url, serviceKey, { db: { schema: 'concierge' } })`; confirm RLS enable behaves identically in a non-`public` schema; confirm whether PostgREST "exposed schemas" needs `concierge` added (likely not, since access is service-role server-side). Record findings in the walkthrough.
3. Server-side Supabase client at `src/lib/supabase/server.ts` (service role; never imported by client components). **Verify the service-role key is not bundled to the client** (grep the production bundle for the key).
4. API-route skeleton in `src/app/api/` (alongside the existing `locale-resolve/*`): `chat/route.ts` (POST, streaming), `conversation/route.ts` (GET load / POST start), `brief/route.ts` (POST), `escape-hatch/route.ts` (POST). Already outside the next-intl matcher; `robots.ts` already disallows `/api/`.
5. Session cookie: on first request lacking a valid cookie, generate a UUID, insert a `concierge.sessions` row, set a **signed (HMAC via `SESSION_COOKIE_SECRET`)** HTTP-only, `Secure`, `SameSite=Lax` cookie `t2e_session_id` scoped to `.travel2egypt.org`, **max-age 30 days**. Verify signature on subsequent requests; reject tampered cookies.
6. `lib/conciergePrompt.ts` exporting the verbatim v4.1 prompt. `chat/route.ts` builds the message array, calls Sonnet 4.6 (pin the exact string here), returns SSE.
7. Per-message persistence to `concierge.messages`; capture assistant response time.

**Decisions to flag.** Cookie max-age 30 days (locked); HMAC signing (locked — `SESSION_COOKIE_SECRET` is long-lived, rotation invalidates all sessions); RLS deny-all defense-in-depth (locked); S2 proves streaming in isolation, S3 wires UI (locked).

**Verification.** Migration applies cleanly; all `concierge` tables/indexes/RLS present; JS client confirmed against the non-`public` schema; **run the full path end-to-end**: POST `/api/chat` → streaming v4.1 response → message persists → signed cookie set and survives reload, tampered cookie rejected. Service-role key absent from client bundle. DB types generated to `src/types/concierge-db.ts`.

**Commit.** "Session 2: concierge schema, backend foundation, session cookies."

---

## Session 3 — Chat integration and tour-context entry point

**Scope.** Make the chat functional against the S2 backend; fold in the tour-context entry point.

**Deliverables.**
1. `ChatContainer` → client component: messages, streaming state, input, conversation ID. Consumes the SSE stream; loads prior conversation on mount.
2. **Streaming render strategy (Option A):** stream as plain text; on completion, parse markdown with `marked` and **sanitize with `isomorphic-dompurify`** (allow only bold/italic/lists/links). **Link rewriting (`target="_blank" rel="noopener noreferrer"`) happens after sanitization** (DOMPurify hook or post-pass on the sanitized DOM). Re-evaluate Option A only if the "format snap" at completion feels jarring.
3. Conversation reload on mount with a subtle "Continuing your conversation from [date]" indicator; "Start new conversation" **archives** the current (`archived = true`) and begins fresh.
4. Starter chips: tap populates input (no auto-send); fade after first send; "show suggestions" restores.
5. Input: auto-resize, Enter sends, Shift+Enter newline, focus on mount, send disabled during stream. Thinking indicator → streamed text. Sticky-bottom auto-scroll with jump-to-latest pill.
6. Error handling: network failure → retry; >8s → "Working on a thoughtful response…"; three failed retries → surface the escape hatch.
7. **Tour-context entry point:** read `?tour=<slug>` (canonical root tour slug); if present, fetch the tour title (+ short summary) via a lightweight `tourBySlugQuery` projection; render the canned tour-context opening with the tour name interpolated (localized); persist the tour reference on the conversation and inject it into the model context for the first turn. Invalid/absent slug → default canned opening.
8. `ConciergeCTA`: `planHref` gated on `chatEnabled` (prop from server parents) — `/plan-your-tour?tour={tourSlug}` when enabled, `/contact` when disabled. (Live exposure governed by the circuit breaker; go-live verified at Session 12.)

**Decisions to flag.** marked + isomorphic-dompurify (locked); Option-A streaming (locked); `?tour=` param (locked); CTA gated on `CHAT_ENABLED` (locked); start-new = archive, "Continuing from [date]" subtle (locked).

**Verification.** Send → streaming v4.1; reload → history; start-new → archived + fresh; `?tour=<valid>` → opening interpolates name + first model turn aware; `?tour=<garbage>` → graceful default; errors handled; markdown renders **and a raw-HTML/`<script>` payload in agent or echoed user text is neutralized**.

**Commit.** "Session 3: functional chat — streaming, persistence, tour-context entry."

---

## Session 4 — Brief detection, completion panel, and email resume

**Scope.** Detect completion (conservative, bilingual, two-gate), extract the payload, render the inline panel with a timezone-aware timeframe, implement email-resume. Email infrastructure (Resend) is introduced here.

**Deliverables.**
1. **Two-gate detection.** Gate 1: each assistant response checked against a maintained EN+ES handoff-marker list (`lib/briefDetection.ts`) **and** a captured email on the session. Gate 2: the extraction call confirms it can assemble the minimum brief (name, email, minimum trip context) and returns `complete:true`; otherwise the panel does not fire and the conversation continues. The locked prompt is not modified; no sentinel/tool injected. *(File-top comment ties each marker to its v4.1 source; whoever updates the prompt to v5 also reviews these markers.)*
2. **Extraction.** A separate non-streaming **Sonnet 4.6** call extracts the Autoura-shaped payload from the transcript (prompt in `lib/briefExtraction.ts`); stored on `conversations.brief_payload` and a `concierge.briefs` row.
3. **Completion panel** inline in site tokens: "Your brief is ready," confirmation body with the concrete timeframe, five summary chips (incl. inferred comfort level), "Continue conversation," and the low-emphasis "Save my conversation."
4. **Timeframe** from `Intl.DateTimeFormat(locale, { timeZone: 'Africa/Cairo' })` + the browser zone, rendered concretely in both.
5. Conversation stays open; on significant new info, re-extract and send an `updated_brief` (Autoura `is_update`/`brief_revision`); a small "brief updated" notice appears. Threshold conservative, tuned post-launch.
6. **Email-resume.** Email stored on `sessions.email`; a resume URL with an HMAC-signed, **30-day** stateless token (no table) is sent; following it on any device verifies the token, sets the session cookie, loads the conversation. Secret rotation is the revocation mechanism.
7. **Email module** (`lib/email/`) wrapping Resend; used by S4/S5/S9/S10. From `concierge@travel2egypt.org`, Reply-To → `TEAM_INBOX_EMAIL`.

**Decisions to flag.** Resend (locked); two-gate bilingual detection (locked); extraction model Sonnet 4.6 (locked); stateless 30-day resume token (locked); conservative updated-brief threshold (locked).

**Verification.** Full conversation to completion in EN and ES; panel timeframe correct in two browser zones; payload matches schema; gate-2 aborts a false phrase-match; save-my-conversation sends and the resume link loads on a different browser; `updated_brief` fires on a material change.

**Commit.** "Session 4: brief detection, completion panel, email resume."

---

## Session 5 — Escape hatch and human handoff

**Scope.** The "Talk to a human" three-option panel, persistent trigger, flagging, escape-hatch logging. Extract a shared dialog primitive from the consent-notice pattern.

**Deliverables.**
1. Extract `useFocusTrap`/`Dialog` from `CookieConsent`'s pattern (role="dialog", aria-modal, labelled/described-by, focus move, Tab trap, Escape) and refactor `CookieConsent` to use it (no behavior change). Build the escape-hatch panel on it.
2. Three-option panel in site tokens. Full a11y.
3. **WhatsApp:** opens `wa.me/201158011600` in a new tab, prefilled "Hi, I was using your AI concierge and would like to speak with your team directly. My session reference is [8-char ref]." The 8-char ref is derived deterministically from the session UUID (first 8 chars / hash truncation) so the admin panel can reverse-lookup without a reference table.
4. **Forward to team:** if no email yet, prompt inline; send via Resend to `TEAM_INBOX_EMAIL` (Reply-To → team Gmail) a transcript + session id + visitor email + `conversation_id` (admin URL omitted until S10), subject `[Concierge — Human Help Requested]`; chat shows confirmation. The email is the notification — no Slack.
5. **Continue with AI:** closes; fires the Plausible event.
6. Persistent trigger in the chat header (label desktop / icon-in-menu mobile).
7. **Logging (migration `0002`):** `escape_hatch_used boolean`, `escape_hatch_action text` ('whatsapp'|'forward'|'continue', last action), `escape_hatch_at timestamptz`; plus `flagged=true`, `flag_reason='escape_hatch_used'`. Per-event analytics go to Plausible. *(Comment: if multi-use patterns matter post-launch, revisit via an array of {action,timestamp} or an events table.)*

**Migration `0002`:**
```sql
alter table concierge.conversations
  add column escape_hatch_used   boolean default false,
  add column escape_hatch_action text,
  add column escape_hatch_at      timestamptz;
```

**Decisions to flag.** Logging shape = Option B columns + Plausible (resolved); `TEAM_INBOX_EMAIL` env with swappable placeholder; forward-email-as-notification; 8-char session ref in WhatsApp prefill; `conversation_id` in email, admin URL omitted until S10.

**Verification.** All three paths E2E; WhatsApp prefill carries the correct 8-char ref; forward email arrives with transcript and working Reply-To; conversation columns + flag set; Plausible events fire; panel passes keyboard/SR checks; `CookieConsent` unchanged after refactor.

**Commit.** "Session 5: escape hatch, human handoff, dialog primitive."

---

## Session 6 — Spanish localization

**Scope.** Spanish copy for the concierge UI, locale-aware formatting, QA. URL stays the shared static path. No i18n/routing infrastructure work — it exists.

**The Spanish-URL decision (locked): keep the shared static path `/es/plan-your-tour`.** Do not introduce next-intl `pathnames`. Reasons: (1) every static route on the site is shared-path/locale-prefixed; localized slugs exist only on Sanity content docs — a translated slug would make this the only exception; (2) `pathnames` is a global commitment that re-types the whole navigation layer and creates a second URL-localization mechanism; (3) the SEO case is weak — `buildStaticMetadata` already emits correct hreflang for shared paths, and ES is greenfield (no authority to preserve); (4) localized static slugs, if ever wanted, are a deliberate site-wide project; (5) reversible later with a 301. Trade-off accepted: the URL reads English on a Spanish page — the weakest signal in the set, with content/chat/panel all fully Spanish.

**Deliverables.**
1. Spanish values for the `planYourTour` namespace in `messages/es.json`: eyebrow, heading, subheading, journey steps, trust label, chat header name/status, four chips, input placeholder, send label, brief panel (heading/body/links/five chip labels), escape-hatch panel (heading/three cards/close), error/retry/timeout messages, "Continuing from [date]"/"Start new," "Save my conversation." No hardcoded strings.
2. Drafted by Claude Code, **reviewed by Islam** before launch — warm conversational register matching v4.1's Spanish voice (not textbook), consistent terminology (concierge/brief in Spanish).
3. Locale-aware formatting for the timeframe and dates.
4. Identical structure at `/plan-your-tour` (en) and `/es/plan-your-tour` (es) via the `[locale]` segment; `LocaleSwitcher` moves between them.
5. (Optional, lightweight) inject a "page locale: es" hint into the model context for the first turn — without modifying v4.1 — to resolve cold-start ambiguity; does not change v4.1's continue-in-English-when-the-visitor-writes-English behavior.

**Decisions to flag.** Shared `/es/plan-your-tour` (locked); Claude drafts, Islam reviews (locked); optional locale hint (locked, lightweight). Conversation language owned by v4.1 — only chrome translated.

**Verification.** EN/ES render with all chrome strings (no missing-key fallbacks); `LocaleSwitcher` routes between them; a Spanish conversation gets Spanish responses; brief panel in ES with ES date formatting; an English message on `/es` triggers v4.1's continue-in-English-plus-offer.

**Commit.** "Session 6: Spanish localization."

---

## Session 7 — Rate limiting and abuse handling

**Scope.** DB-backed limits, token caps, conservative bilingual flag-only abuse handling (v4.1 owns the conversational response), keyed IP/UA hashing.

**Deliverables.**
1. Rate limiting in `/api/chat`, backed by `concierge.rate_limits`. Per-session **40 messages / 10 min** → 30s cooldown with a friendly localized message. Per-IP 100 messages / hour → 1-hour block, falling back to `<ConciergeFallback reason="rate_limited" />`. **Thresholds have sensible defaults in code; env vars override only when explicitly set** (fewer env vars in the common case, full control when needed).
2. Token cap per conversation (summing stored counts). Soft cap 50k → inject a runtime **wrap-nudge** context note (no v4.1 edit; aligned with its "WHEN TO WRAP" section, using v4.1 wrap vocabulary). Hard cap 75k → canned, localized clean wrap-up toward brief completion.
3. Conservative bilingual (EN+ES) detection in `lib/abuseDetection.ts`: repeated-identical, prompt-injection markers, persistent off-topic, hostile/abusive. **Flag only** (never blocks a legitimate visitor), with categorized `flag_reason`: `prompt_injection_attempt`, `hostile_language`, `off_topic_persistent`, `repeated_identical`. *(File-top comment ties markers to v4.1; reviewed alongside prompt updates.)*
4. Termination: 3+ abuse signals in a session → localized "we are not the right place for this conversation" + `429` until cooldown.
5. **Keyed hashing:** `ip_hash`/`user_agent_hash` = HMAC-SHA256 with `IP_HASH_SECRET`. No raw IP in DB or logs. (Bare SHA-256 on IPv4 is reversible; the keyed secret is what makes the posture real. `IP_HASH_SECRET` is long-lived.)
6. Alert routing: hostile/abusive → real-time email to `TEAM_INBOX_EMAIL`, subject `[Concierge — Hostile Content Flagged]`; injection → daily review only.

**Decisions to flag.** Keyed HMAC IP/UA hashing (locked); soft-cap context-injection + hard-cap canned wrap (locked); conservative bilingual flag-only detection (locked); thresholds 40/10min, 100/hr, 50k/75k env-configurable (locked, tunable at testing discretion); termination 3+ (locked); alert routing (locked).

**Verification.** Rapid messages → cooldown; per-IP block → fallback; injection → v4.1 declines **and** flagged; 3+ signals → termination + 429; a legitimate fast typist not blocked; DB/logs contain only keyed hashes; hostile email alert arrives.

**Commit.** "Session 7: rate limiting and abuse handling."

---

## Session 8 — Cookie consent and privacy disclosures

**Scope.** Update the existing consent notice and policies to disclose the chat-session identifier and AI conversation data; add the AI-disclosure indicator, a real delete path, and a data-export request. No consent UI is built — it exists.

**Deliverables.**
1. **Notice copy.** Update the `consent` i18n namespace (EN+ES) to disclose `t2e_session_id` as a strictly-necessary/functional cookie enabling the conversation. Bump the consent storage key `consent-v1 → consent-v2` so returning visitors see the updated disclosure once. No accept/decline control — the cookie is exempt; disclosure is informational. *(The original's "decline disables chat → fallback" model is removed.)*
2. **Categorization.** `t2e_session_id` = strictly necessary (ePrivacy/GDPR exemption: strictly necessary for a service explicitly requested by the user). *(Code comment near the decision: "If legal review requires gating: add a category to `ConsentCategories`, bump the consent storage key. The provider already supports granular choice; no restructuring needed.")*
3. **Policies.** Update `/cookie-policy` and `/privacy-policy` (EN+ES) to cover the chat-session identifier and AI-mediated processing/retention. Claude drafts the disclosure copy; **legal sufficiency is Islam's review workstream and a hard launch gate.** Code links the policy from the notice and chat footer.
4. **AI disclosure.** Persistent chat-header indicator using the consistent term **"AI Concierge"** ("AI Concierge — backed by our human team," localized), matching the eyebrow, opening message, and metadata. One term, used consistently. Satisfies EU AI Act Art. 50.
5. **Delete my conversation.** Chat-menu option → confirm → **anonymize** (strip PII: `email`, name, `ip_hash`, `user_agent_hash`; delete `messages` content) and keep a skeleton row (`conversation_id`, timestamps, `brief_completed`, `language`, `prompt_version`) for funnel analytics; clear the `t2e_session_id` cookie. *(Code comment documenting exactly which fields are stripped vs retained, and that the skeleton must be truly non-re-identifiable.)* Not a soft archive.
6. **Data export.** Low-emphasis "Request a copy of your conversation data" → emails `TEAM_INBOX_EMAIL` (Resend) for manual fulfilment in v1, with visitor-facing copy stating the acknowledgment SLA (defined with the team before launch).
7. Plausible stays cookieless; analytics category stays dormant; notice stays informational.

**Decisions to flag.** Strictly-necessary informational categorization, no gate, `consent-v1→v2` bump (locked); delete = anonymize, not hard-delete (locked, field list documented); Claude drafts policy copy / legal owns sufficiency (locked, hard gate); "AI Concierge" consistent term (locked); data export manual via team email (locked).

**Verification.** Notice shows updated disclosure (re-shows once after the key bump); no accept/decline gate; AI indicator visible EN/ES; delete truly anonymizes (verify stripped vs retained fields in DB) and clears the cookie; export email arrives; policies reflect chat disclosures in both languages.

**Commit.** "Session 8: chat-session disclosure, AI disclosure, data rights."

---

## Link Map — concierge deep-linking into site content

*(Sequenced after Session 8, before Session 9.)*

**Scope.** Wrap recognized entities in agent responses with deep links to indexable site content, using the existing curated `conciergeLinkMap` singleton. Enforce the v1 indexable-only constraint in code.

**Model (locked): keep the existing manual singleton.** The `conciergeLinkMap` schema already exists in `src/sanity/schemas/system.ts` — a team-curated singleton of `entries[]` (`canonicalName` + `aliases[]` + `target` reference + `notes`). This **supersedes** the decisions-summary v1.1 "build-time aggregation from per-document fields" description. Reasons: it already exists; auto-aggregation would over-link (the agent's vocabulary is curated, not arbitrary); per-doc metadata fields would impose schema changes + authoring across 134 monuments + guideArticles on the content team; and editorial curation is itself the point for a judgment-led brand. The "build-time" intent survives as a **load + validate** step, not document aggregation.

**Deliverables.**
1. **Map loader + validator** (`lib/linkMap/`): query the singleton, resolve each `target` to its locale-correct URL, and **drop any entry whose target page is `noindex`/robots-disallowed**. The indexability check **derives dynamically from the actual `robots.ts` disallow configuration** (extract the disallow paths to a shared constant imported by both `robots.ts` and the validator) — single source of truth, so when v2 lifts the `wikiDeity`/`wikiDynasty`/`wikiPerson` disallow, those entries auto-include with no link-map code change. Cache the resolved map; rebuild on content change.
2. **Effective v1 link targets:** `wikiMonument` + `guideArticle` only. City/tour are **out** of v1 (city names are common nouns prone to spammy auto-linking; tour-page clickthrough softly conflicts with consultation-only). They can re-enter later if a clear use case emerges.
3. **Runtime entity-wrapping post-processor:** runs in the **same post-stream pass as markdown parse + sanitize** (Session 3, Option A), after the full response is assembled. Longest-match on `canonicalName` + `aliases`; case-insensitive; first occurrence only; never wrap inside existing markdown links or code spans. Wrapped anchors are allowlisted by the DOMPurify config with `target="_blank" rel="noopener noreferrer"`.
4. **Locale-aware:** target resolves to the active conversation locale (EN/ES), honoring Sanity slug localization.
5. **No `category`/`priority` fields** for v1; add `priority` only if real overlap collisions surface in testing.

**Verification.** An agent response mentioning a mapped monument renders a working deep link to its `wikiMonument` page in EN and ES; a mention matching a `wikiDeity` entry is **not** linked; aliases match; no double-wrapping; the sanitizer permits the generated anchors and nothing else; the resolved-map cache invalidates on content change.

**Commit.** "Link map: curated deep-linking with indexable-only enforcement."

---

## Session 9 — Autoura webhook integration

**Scope.** Deliver the brief to Autoura (HMAC-signed, retried, non-blocking), fall back to email, carry the revision indicator. Built against placeholders; real contract confirmed before verification.

**Deliverables.**
1. Env: `AUTOURA_WEBHOOK_URL`, `AUTOURA_WEBHOOK_SECRET`. Signature header name/format per Autoura's contract.
2. **Payload** = the S4-extracted brief plus `brief_revision` (int) and `is_update` (bool), `prompt_version: "v4.1"`, `language`, `session_id`/`conversation_id`, `visitor`/`trip`/`preferences`/`constraints`, `brief_summary`, `follow_up_window`, and `full_transcript` (inline — the transcript is the proposal context that makes the brief valuable). A transform layer maps our shape to Autoura's if they differ.
3. HMAC-SHA256 over the raw body with `AUTOURA_WEBHOOK_SECRET`, in the agreed header.
4. **Non-blocking delivery** (viable on Railway's persistent Node process; would not survive serverless): the brief route persists the `briefs` row and returns; an in-process worker sends with 3× backoff (1s/5s/15s), updating `autoura_webhook_status`/`autoura_attempts`/`autoura_webhook_response`. A **startup reconciliation** re-attempts any `pending` brief left mid-flight by a restart. *(Accepted v1 edge: recovery is by reconciliation, not a durable queue.)*
5. **Email fallback** via Resend to `TEAM_INBOX_EMAIL` on permanent failure or unset URL: full brief + transcript, subject `[Concierge — Brief (email fallback)]`; sets `email_fallback_sent`.
6. **Failure alert** to `TEAM_INBOX_EMAIL` + Islam, subject `[Concierge — Autoura Delivery Failed]`.
7. **Revisions (migration `0003`):** a material update appends a new `briefs` row with incremented `brief_revision` and `is_update: true`; the team dedups by `conversation_id`. *(Whether Autoura updates-by-`conversation_id` or creates-new-each-time is resolved with the Autoura team and reflected in team operating principles; non-blocking.)*

**Migration `0003`:** `alter table concierge.briefs add column brief_revision int default 1;`

**Decisions to flag.** Autoura contract confirmed before verification (locked — placeholders meanwhile, single env swap at go-live); `full_transcript` inline (locked); non-blocking in-process delivery + reconciliation (locked); append-row-per-revision + `is_update` (locked); failure alert via email (locked).

**Verification.** Delivery to a test endpoint succeeds and HMAC verifies; a failing endpoint → backoff → email fallback + alert; a revision send carries `brief_revision: 2`, `is_update: true`; `briefs` status transitions correct; a restart mid-retry is reconciled on startup.

**Commit.** "Session 9: Autoura webhook with HMAC, retry, and email fallback."

---

## Session 10 — Admin reviewer panel

**Scope.** Build the reviewer panel in the site's design system, Supabase-Auth-protected and server-mediated. Reference harness patterns; do not port.

**Deliverables.**
1. `/admin` route group **outside `(site)/[locale]`**, added to the middleware matcher exclusions (like `/studio`) so it is not locale-prefixed; add `/admin` to the `robots.ts` disallow list. *(After the middleware change, regression-test that `/`, `/es`, `/ja`, `/plan-your-tour`, `/es/plan-your-tour` still resolve.)*
2. **Auth:** Supabase Auth magic-link to whitelisted `ADMIN_EMAILS` (separate from Sanity Studio auth). Supabase Auth emails via Resend SMTP, from a separate `auth@`/`admin@` address.
3. **Access model:** all data via `/api/admin/*` routes that verify **both** a valid Supabase Auth session **and** that the email is in `ADMIN_EMAILS` (a valid session alone grants nothing — anyone can create an account), then query with the service role. No permissive RLS policies; deny-all from S2 stands.
4. **List view:** filters (date range, language, brief-completed, flagged, `flag_reason`, reviewed), sort (recent/length/tokens), pagination (20/page), quick stats (conversations today, briefs today, flagged today, avg rating).
5. **Detail view:** full transcript with timestamps/response-times/token counts; formatted brief payload; Autoura delivery status + attempts + revision history; reviewer controls — 1–5 rating (captures overall quality, incl. "handled well") and structured notes (problem categories only: **prompt drift, factual error, escape hatch used, abuse, language switch issue, other**); mark-reviewed. The S5 forward-email admin link now resolves here (update the email template to include it).
6. **Daily digest** at 08:00 `Africa/Cairo` via Railway cron → protected `/api/admin/digest` (`CRON_SECRET`): totals, briefs completed (links), flagged needing review (links grouped by `flag_reason`), notable patterns, top response times, token/cost summary.
7. **Search** across message content via ILIKE (anonymized conversations correctly absent; upgrade to Postgres FTS if it gets slow); **export** transcript to JSON/markdown (admin-only route).

**Decisions to flag.** Server-mediated admin + two-factor check (session AND whitelist), RLS deny-all, no permissive policies (locked, revises S2); `/admin` middleware exclusion + robots disallow (locked); Supabase Auth mail via Resend, separate from-address (locked); Railway cron digest at 08:00 Cairo, `CRON_SECRET` long-lived (locked); ILIKE search (locked); reviewer note categories as listed (locked); full-access whitelist, revoke = remove + redeploy, v2 → DB table (locked).

**Verification.** Magic-link login succeeds only for whitelisted emails; non-whitelisted rejected; `/admin` not locale-prefixed and robots-disallowed; filters/sort/stats correct; detail shows transcript + brief + webhook/revision status + flags; rating/notes/mark-reviewed persist; digest arrives at 08:00 Cairo with working links; search returns expected results; export works; service-role key absent from any client bundle.

**Commit.** "Session 10: admin reviewer panel."

---

## Session 11 — Pre-launch hardening

**Scope.** Final E2E, performance, accessibility, and security review for the concierge surfaces; introduce Sentry; confirm cutover participation.

**Deliverables.**
1. **E2E pass:** full conversation to brief completion in EN and ES; error paths — network failure, API timeout, rate-limit cooldown, per-IP block→fallback, abuse termination (no "declined cookies" path); persistence + reload; save-my-conversation + resume on another device; escape-hatch all three; admin review workflow; Autoura delivery + email fallback + a revision send; link-map deep links render in EN/ES and a noindex target is not linked; delete→anonymize verified in DB.
2. **Performance:** Lighthouse 95+ perf / 100 a11y / 95+ SEO; FCP < 1.5s / TTI < 2.5s mid-range mobile; confirm `@anthropic-ai/sdk` and the Supabase **server** client are server-only (absent from client bundle); lazy-load the chat below the concierge frame. (90+ perf fallback only with a specific diagnosis that the gap is unavoidable — check chat bundle size, image optimization, render-blocking JS, lazy-load behavior first.)
3. **Accessibility:** keyboard nav throughout; screen-reader pass on **both VoiceOver and NVDA** with the streaming message area as `aria-live="polite"` announcing **completed** agent messages (not per token); contrast AA; visible focus; ARIA on all controls; `prefers-reduced-motion` honored.
4. **Security review (tailored):** every `/api/*` route verifies the signed session cookie; admin routes verify Supabase session **and** `ADMIN_EMAILS`; Autoura HMAC; markdown only through `marked`+DOMPurify (raw-HTML/`<script>` XSS test passes; link allowlist + `rel="noopener noreferrer"`); link map cannot emit a link to a noindex/disallowed target; IP/UA stored only as keyed HMAC, no raw IP in logs; tampered session cookie rejected; **rate limiting exercised under load** (per-session and per-IP thresholds confirmed to trigger); `SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY`, `AUTOURA_WEBHOOK_SECRET`, `SESSION_COOKIE_SECRET`, `IP_HASH_SECRET`, `CRON_SECRET`, **and the Resend API key** never reach the client (bundle grep for each); CSRF/same-origin on mutating routes.
5. **Sentry** (`SENTRY_DSN`), client + server, **cookieless**, PII-scrubbed in a `beforeSend` hook. **Never capture:** message content (user/agent), emails/names/phones/contact details, brief payload contents, raw IPs. **May capture:** opaque session/conversation IDs, message/token counts, stack traces + code locations, HTTP/API status codes + response times (no content), browser/OS. Assume any field is PII unless explicitly known otherwise. Debugging path is "look up `conversation_id` in the admin panel," not "find it in Sentry." Confirm Sentry sets no cookies.
6. **Cutover participation:** confirm the route is noindex on the Railway preview host and indexable on production (existing mechanism); canonical/hreflang correct; **verify both `/plan-your-tour` and `/es/plan-your-tour` are actually present in the migration workstream's `redirect-map.csv`** (verify, don't assume — the redirect map is maintained separately and could miss them). No DNS/subdomain work.

**Decisions to flag.** Sentry cookieless + absolute no-PII (locked, lists above); cutover reframe replaces DNS/subdomain/WP-redirect (locked); `aria-live` completed-message announcement, dual SR test (locked); Lighthouse 95+/100/95+ held (locked); tailored security checklist incl. Resend-key bundle check + rate-limit load test (locked).

**Verification.** All E2E paths pass in both languages; Lighthouse/a11y targets met; security checklist complete; Sentry captures a test error with scrubbed context and no PII; route indexes only on production host and is covered by the redirect map.

**Commit.** "Session 11: pre-launch hardening."

---

## Session 12 — Launch and immediate post-launch monitoring

**Scope.** Go live via the circuit breaker; verify the launch gates; monitor 24h; single-lever rollback.

**Environment (production, Railway):** `ANTHROPIC_API_KEY`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `AUTOURA_WEBHOOK_URL`, `AUTOURA_WEBHOOK_SECRET`, `SESSION_COOKIE_SECRET`, `IP_HASH_SECRET`, `CRON_SECRET`, `RESEND_API_KEY`, `TEAM_INBOX_EMAIL`, `ADMIN_EMAILS`, `SENTRY_DSN`, `CHAT_ENABLED`, and rate-limit threshold vars. From/Reply-To addresses configured. WhatsApp number and the pinned Sonnet 4.6 model string are **constants** (stable); rate-limit thresholds are **env** (tunable). (`TEAM_FALLBACK_EMAIL` renamed `TEAM_INBOX_EMAIL`; `RATE_LIMIT_ENABLED` dropped in favor of explicit threshold vars.)

**Hard launch gates (all green):** legal sign-off on the updated privacy + cookie policies; real Autoura values in env and a test brief confirmed received (HMAC verified); `ConciergeCTA` repoint live and the `?tour=` param flowing from tour pages; Resend sending domain verified (SPF/DKIM/DMARC) and `TEAM_INBOX_EMAIL` set; data-request acknowledgment SLA defined and reflected in the export-link copy; both concierge URLs present in the site redirect map.

**Soft gates (may ship with placeholders):** real partner trust marks — **the TripAdvisor mark is the higher-priority soft gate and should land before launch if at all possible** (v4.1's trust-collapse handling references TripAdvisor by name; visitors who reach that moment are looking for that specific signal). Other partner marks (Kayak/JATA/IATA/ASTA) may follow post-launch on the glyph treatment. Concierge-specific OG image (`/og-default.png` otherwise). Launch documentation should record which soft gates are higher-priority follow-ups.

**Plausible analytics integration (added Session 5 — observability, not a hard gate):** wire the cookieless Plausible custom events for the chat funnel (chat started, conversation engaged, brief completed, escape hatch triggered + `escape_hatch_action`). Plausible is not yet wired in the app; the DB columns (`escape_hatch_*`, brief state) are the durable record, so this is observability rather than persistence and can land any time before/around launch. Mechanical once Plausible is added to the site.

**Spanish tour-title coverage for `?tour=` (added Session 6):** verify all production tours that link to `/es/plan-your-tour?tour=<slug>` have Spanish-localized titles in Sanity — or accept code-switching for tours without translations. The tour-context opening interpolates the resolved tour title (`"Veo que has estado mirando {tourName}"`); a tour that falls back to its English title produces a code-switched Spanish sentence. Content-readiness check, not code.

**Launch checklist:** **dry-run the rollback before go-live** — `CHAT_ENABLED=false` → verify chat falls back, CTAs repoint, no Sentry errors; then `CHAT_ENABLED=true` → verify full experience restored (tested rollback is trusted rollback). Final visual review on the production host; a complete real conversation in EN and ES → brief arrives in Autoura; admin panel reachable.

**Rollout:** quiet — internal/partners only. **Timing:** 8–10 PM Cairo time on a Tuesday or Wednesday (low European/Egyptian traffic, full team availability the next day). **Go-live:** set `CHAT_ENABLED=true` on the production host (independent of the broader site cutover). **Monitor 24h:** Sentry (scrubbed), admin panel, Autoura receipt, rate-limit false positives, performance. **Rollback (single lever):** `CHAT_ENABLED=false` reverts chat + CTAs to `/contact` within seconds.

**On-call / authority.** Islam holds rollback authority for the first 24 hours; afterward a senior team member may also hold it.

**Rollback decision criteria (defined before launch, not in the moment):**
- *Definite rollback:* >1% of requests failing; multiple visitor reports of broken experiences; Autoura not receiving briefs; agent producing visibly wrong content at scale.
- *Maybe (judgment call):* performance degradation; unfamiliar Sentry patterns; isolated bad conversations with no systematic cause.
- *Continue monitoring (not rollback triggers):* edge cases; individual visitors; prompt refinements (v5 work).

**Decisions (locked).** Go-live/rollback = `CHAT_ENABLED` single lever, with a pre-launch rollback dry-run; env inventory + constants/env split + renames; hard vs soft gate split with TripAdvisor prioritized; 8–10 PM Cairo Tue/Wed timing, Islam holds rollback authority for 24h then a senior member may too; rollback criteria as above.

**Verification.** Route live at production `/plan-your-tour` with `CHAT_ENABLED=true`; a real conversation completes → arrives in Autoura; admin reachable; circuit breaker toggles chat + CTAs; rollback rehearsed; Sentry clean in the first hour.

**Commit.** "Session 12: production launch."

---

## Post-launch — first 30 days

Daily review by Islam: read flagged conversations (grouped by `flag_reason`), rate them, identify failure patterns. Prompt refinements (toward v5) follow the v3→v4→v4.1 process. When v5 ships, also review the maintained marker lists in `lib/briefDetection.ts` and `lib/abuseDetection.ts`. Weekly metrics: conversation volume, brief-completion rate, proposal/booking conversion (from Autoura), time-to-brief, escape-hatch rate, top flag reasons, token consumption and cost.

---

## Appendix A — Environment and secrets register

**Secrets (long-lived; rotate only on genuine compromise — rotation consequences noted):**
- `SESSION_COOKIE_SECRET` — HMAC for the session cookie. Rotation invalidates all sessions (mid-conversation visitors lose state).
- `IP_HASH_SECRET` — keyed HMAC for IP/UA. Rotation resets rate-limit/abuse continuity.
- `AUTOURA_WEBHOOK_SECRET` — HMAC signing for Autoura.
- `CRON_SECRET` — protects `/api/admin/digest`.
- `SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY`, `RESEND_API_KEY` — provider keys; server-only, never bundled.

**Other env:** `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `AUTOURA_WEBHOOK_URL`, `TEAM_INBOX_EMAIL`, `ADMIN_EMAILS`, `SENTRY_DSN`, `CHAT_ENABLED`. Rate-limit thresholds (per-session, per-IP, token soft/hard) are **code-default with optional env override** — they need only be set to deviate from defaults.

**Constants (not env):** WhatsApp number (`wa.me/201158011600`), pinned Sonnet 4.6 model string.

**Addresses:** From `concierge@travel2egypt.org` (visitor mail); From `auth@`/`admin@travel2egypt.org` (admin magic links); Reply-To → `TEAM_INBOX_EMAIL` (team Gmail).

**Bundle-safety checks (Session 11):** grep the production client bundle for `SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY`, `RESEND_API_KEY`, and all secret prefixes — none may appear.

## Appendix B — External dependencies and launch gates

- **Autoura contract** (URL, secret, field mappings, response codes, signature header) — Islam's Autoura team; needed before Session 9 verification. Single env swap at go-live.
- **Resend + DNS** (account, `concierge@`/`auth@` addresses, SPF/DKIM/DMARC on travel2egypt.org) — Islam's parallel workstream; needed before Session 4 send testing.
- **Team inbox** (`TEAM_INBOX_EMAIL`) — existing inquiry inbox or new `team@travel2egypt.org`; needed before Session 5 verification.
- **Legal sign-off** on privacy + cookie policy — hard launch gate.
- **Trust-mark assets + TripAdvisor URL** — soft gate (glyph treatment ships otherwise). **TripAdvisor mark prioritized before launch** (v4.1 references it by name at the trust-collapse moment); other partner marks may follow post-launch.
- **Data-request SLA** — defined with the team; reflected in export-link copy; launch-checklist item.

## Appendix C — Decision log (corrections to the source docs)

Where the code contradicted the integration decisions summary (v1.1) or the original brief, the code won:
- **Hosting:** Railway in-site deploy + host-gated cutover, not a `plan.travel2egypt.org` subdomain or WordPress redirect.
- **Typography:** body font is Source Serif 4 (site), not the mockup's Public Sans.
- **`ConciergeCTA`:** currently points at `/contact` and only flips the label on `tourSlug`; it does **not** pass a tour param. Param-passing + repoint are net-new (Session 3).
- **Spanish URL:** shared `/es/plan-your-tour`; the site configures no next-intl `pathnames` (localized slugs exist only on Sanity content docs).
- **Link map:** a manually-curated `conciergeLinkMap` singleton already exists; this supersedes the summary's "build-time aggregation from per-document fields."
- **Markdown:** the site renders content via Portable Text, not `marked`; `marked` is unused-but-present and adopted here with `isomorphic-dompurify` for safe rendering.
- **Trust strip:** does not already exist on the homepage; net-new, with no badge assets in the repo.
- **Admin RLS:** admin access is server-mediated (service role + whitelist); no permissive RLS policies (revises the S2 expectation).
- **Cookie consent:** the strictly-necessary categorization removes the original's decline-disables-chat model; the existing provider supports a future flip-to-gated without restructuring.
- **Brief-detection email source (Session 4 — Contradiction B):** the brief's Gate 1 assumed a captured email on the session, but v4.1 captures the visitor's email in chat message content, not `sessions.email` — which the spec only wired to the save-my-conversation flow. Without a fix, Gate 1 would almost never fire in real use. Resolved by auto-capturing the first valid email from a user message into `sessions.email` in the chat route (first-wins, never the agent's echo), keeping `detectBriefMarkers(text, locale, session)` as specified.
- **Web Crypto in Edge middleware (Session 4):** Node's WebCrypto accepts a bare `ArrayBuffer` as the signature argument to `SubtleCrypto.verify`; the Edge runtime's stricter implementation rejects it and requires a `TypedArray`. Node-based unit tests passed, masking the failure — only live middleware testing (the resume-token handler) surfaced it. Any Web Crypto reachable from middleware must pass a `TypedArray` directly.
- **Structured-outputs vs prompt nulls (Session 4):** the extraction's `output_config.format` json_schema hit the API's 16-parameter union-type cap, forcing optional fields to non-null `string` types. The model then could not emit `null` for absent fields and stuffed placeholder junk (`":"`, `"; null"`) in — directly conflicting with the prompt's null-showing examples. Switched to prompt-constrained JSON (the three few-shot examples enforce the shape); Sonnet emitted clean nulls and extraction quality improved (destinations captured vs `[]`). Lesson: when a schema constraint and a prompt instruction conflict, remove the weaker constraint rather than fighting both.
- **Team notification Reply-To direction (Session 5):** team-facing notification emails use `Reply-To` = the **visitor's** email, not the team Gmail. The brief's "Reply-To → team Gmail" pattern applies to *visitor-facing* mail (resume links etc.); for *team-facing* notifications (the escape-hatch "forward to team"), the visitor's email is the right destination so a team member can reply directly to the traveler.
- **Token-cap measurement under prompt caching (Session 7):** `usage.input_tokens` reports only the **non-cached delta**, not the full context the model processed — the cached prefix lives in `cache_read_input_tokens`/`cache_creation_input_tokens`. Context-size measurement must sum all three; measured naively it read ~36 tokens against a ~13k context, so the 50k/75k caps never fired. The cap must also be **sticky**: the canned-wrap row stores the over-cap context size so subsequent turns don't reset to zero and re-call the model with the full oversized payload. This **failed open** (protection silently inert), which is more dangerous than failing closed — a conversation could grow to 100k+ tokens in production, every turn billing real money, with nothing flagging it. Live testing caught what unit tests masked (cf. the Edge-crypto and schema-vs-prompt findings).
- **Hashed-IP privacy disclosure (Session 7 → 8):** rate limiting and abuse prevention process a **keyed HMAC-SHA256 of the visitor's IP and User-Agent** (`ip_hash`/`user_agent_hash`, secret `IP_HASH_SECRET`); the raw IP is never stored or logged (verified live: stored hash equals the keyed HMAC; raw IP absent from DB and logs). The privacy policy must disclose hashed-IP/UA processing for abuse prevention **before launch** — fold into the **Session 8** cookie-consent / privacy-disclosure workstream (legal sufficiency is the hard gate). The keyed hash is non-reversible without the secret, which is the privacy-correct posture to disclose.

## Appendix D — Reusable patterns and operational notes

- **"Cannot modify X" pattern (two-gate detection):** where a locked artifact (the v4.1 prompt) can't emit a signal, gate on cheap external heuristics then confirm with a second, authoritative check (the extraction call). Reused conceptually for the soft-cap wrap nudge and locale hint — all runtime context injections, never prompt edits.
- **Single-source-of-truth guard (link map):** derive the indexability filter from `robots.ts` so v2 changes propagate without code edits.
- **Circuit breaker as launch + rollback lever:** `CHAT_ENABLED` gates chat and CTA destination; go-live and rollback are one flag.
- **Anonymize-not-delete:** documented stripped-vs-retained field list; skeleton must be non-re-identifiable.
- **Email coexistence:** Resend transactional + Gmail human-handling via Reply-To; distinct subject prefixes (`[Concierge — Human Help Requested]`, `[Concierge — Hostile Content Flagged]`, `[Concierge — Brief (email fallback)]`, `[Concierge — Autoura Delivery Failed]`) for Gmail filtering.
- **Railway persistent process** enables in-process background webhook delivery + startup reconciliation (would not work on serverless).
- **Shared Dialog primitive (Session 5):** `src/components/ui/Dialog.tsx` + `useFocusTrap` own dialog *behaviour* (role/aria-modal, focus-on-open, Tab trap, Escape, focus-return) and are headless about styling (each consumer passes its panel class). Extracted from CookieConsent's pattern; CookieConsent and the escape hatch both use it. **Follow-up:** `FloatingConcierge` still has its own hand-rolled focus trap — it should adopt this primitive when next touched. Left as-is in S5 to avoid regression risk on a working component.
- **Browser-only DOMPurify via dynamic import (Session 3):** keeps `isomorphic-dompurify` in dependencies but never loads jsdom server-side. Required because jsdom (which `isomorphic-dompurify` eagerly loads at module-eval time) breaks Next.js's server bundler (`ENOENT … browser/default-stylesheet.css`), 500-ing any page whose client component statically imports the markdown module. The async `renderAgentMarkdown` (`lib/concierge/markdown.ts`) dynamic-imports DOMPurify **only in the browser**, where the native DOM is available — which is also exactly where Option A renders (at stream completion / on history reload, both client-only). Any future code that touches markdown rendering must follow the same async/browser-only pattern; a static `import DOMPurify from 'isomorphic-dompurify'` in any server-reachable module re-introduces the crash.

---

*End of Production Build Brief v2. This document supersedes `production-build-brief.md` and is the implementation guide for the in-site AI concierge integration.*
