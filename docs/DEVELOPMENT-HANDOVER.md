# Travel2Egypt — Development Handover Report

**Repository:** `t2e` · **Prepared:** 2026-07-03 · **Stack:** Next.js 15 (App Router) · Sanity CMS · next-intl · Supabase · Anthropic · Resend · Railway

This is the single-source orientation document for anyone picking up the Travel2Egypt platform. It covers the brand and its voice, the full system architecture, every major module and how the modules connect, the AI concierge and its harness, the content pipeline, and the current state of the work with open items. Read §1–§3 for *what this is and why*; §4 onward for *how it is built*.

---

## Table of contents

1. [The project at a glance](#1-the-project-at-a-glance)
2. [Brand vision & positioning](#2-brand-vision--positioning)
3. [Voice & tone — the brand's soul](#3-voice--tone--the-brands-soul)
4. [System architecture](#4-system-architecture)
5. [Content layer — Sanity CMS](#5-content-layer--sanity-cms)
6. [Presentation layer — Next.js frontend](#6-presentation-layer--nextjs-frontend)
7. [The AI concierge](#7-the-ai-concierge)
8. [Autoura integration](#8-autoura-integration)
9. [The quality harness (Layers 1–3)](#9-the-quality-harness-layers-13)
10. [Data & infrastructure](#10-data--infrastructure)
11. [SEO, structured data & compliance](#11-seo-structured-data--compliance)
12. [The sister-brand portfolio](#12-the-sister-brand-portfolio)
13. [Development workflow & conventions](#13-development-workflow--conventions)
14. [Current state & open items](#14-current-state--open-items)
15. [Where to find things — file index](#15-where-to-find-things--file-index)
16. [Glossary](#16-glossary)

---

## 1. The project at a glance

Travel2Egypt is a **rebuild of an established WordPress travel site** into a modern, editorial-grade platform. The company is a real Egyptian tour operator — 30+ years in business, founded and run by Egyptians, headquartered in Cairo with roots in Siwa. The rebuild reframes the business from "tour operator competing on price and Book-Now volume" to an **editorial-luxury travel publication that happens to operate tours**, competing on depth of knowledge, voice, and trust.

Two things make this codebase unusual:

- **There is no transaction layer.** No "Book Now," no cart, no instant-confirm. Every trip begins with a conversation. The site's conversion surface is an **AI concierge** that captures a qualified lead (a "brief") and hands it to the human team.
- **The brand voice is codified as a 600-line system prompt** (`src/lib/conciergePrompt.ts`), which doubles as the richest single articulation of the brand's tone, positioning, and operational knowledge anywhere in the project.

| Fact | Value |
|---|---|
| Framework | Next.js 15.5 (App Router), React 19 |
| CMS | Sanity v4 (project `ufallvd2`, datasets `production` + `migration-staging`) |
| Locales | English (canonical, no prefix), Spanish (`/es`), Japanese (`/ja`) |
| Concierge model | `claude-sonnet-4-6` (chat + extraction); `claude-opus-4-8` (quality judge) |
| Concierge DB | Supabase (Postgres, `concierge` schema) |
| Transactional email | Resend |
| Lead delivery | Autoura webhook (HMAC-signed) → team inbox fallback |
| Hosting | Railway (full Next.js server — ISR, API routes, middleware) |
| History | ~652 commits since 2026-04-26; ~13 concierge sessions (S1–S13) + dozens of content/migration sessions |
| Published tours | 210 (117 day tours + 93 packages) |
| Sanity schema types | ~35 document/object types |
| Legacy redirects | ~3,141 (WordPress → new URLs) |

---

## 2. Brand vision & positioning

**The published brand statement** (the credibility spine everything flows from):

> "Travel2Egypt has been operating tours in Egypt for more than 30 years under the guidance of its Egyptian founder. We are an Egyptian company, founded and run by Egyptians, headquartered in Cairo with deep roots in Siwa. We do not run booking funnels or instant-confirm systems. Every trip we organize begins with a conversation about what you want from your time in Egypt, and ends with us paying close attention to whether you got it."

**The positioning line** (homepage standfirst):

> "Most travel sites treat Egypt as a checklist of monuments. We treat it as a country with eighty million people, four major dialects, and several thousand years of opinions about itself. *The difference shows up in the details.*"

### The strategic shift

- **From:** standard operator competing on price, options, and "Book Now" volume.
- **To:** editorial-luxury publication competing on depth, voice, and trust — *machine-citable and human-readable*.

### Three strategic truths (the brand's self-understanding)

1. **Egyptian, operating from Egypt.** Born in Siwa, HQ in Cairo, run by Egyptians. Rare and valuable — the site should *feel* Egyptian without clichés.
2. **Operator, not curator.** Authority comes from having run thousands of tours, not from editorial sensibility alone. The voice uses "we" and references operational decisions, real client experiences, ground-level knowledge.
3. **Built for AI search, not just SEO.** As travelers increasingly ask ChatGPT/Perplexity, editorial depth + structured authority get cited. AI crawlers are **deliberately allowed** (see §11).

### Brand direction (held in deliberate tension)

- **Editorial authority** — publishing-grade typography, long-form respect, position as "the source."
- **Modern heritage** — Egyptian-ness without cliché; confident architectural presence (think Grand Egyptian Museum), not hieroglyphics-as-decoration.
- **Operator's voice** — specific moments, named people and places, honest about trade-offs.

The **signature headline construction** appears throughout: a plain first line, then an italic second line in *faience* (the brand's blue-green accent). Example — *"Egypt asks more of you than its postcards admit."*

### Target customer & approach modes

The concierge recognizes two opening styles and adapts:
- **Listen-first** — wants to be interviewed ("we're thinking about Egypt, can you help us plan?"). Standard discovery flow.
- **Lead-first** — wants recommendations first, then reacts ("what do you recommend for X days"). Common with larger family inquiries from India/Gulf and time-poor executives.

---

## 3. Voice & tone — the brand's soul

The authoritative source is `src/lib/conciergePrompt.ts` (currently **v4.1.1**, locked — see the change-control note below). The brand-inputs specs under `migration/.brand-inputs/` supplement it. Because this file *is* the voice, it is worth quoting at length.

### Identity

> "You are not a booking engine and not a chatbot. You are a knowledgeable, warm, quietly confident advisor... You carry yourself like a trusted friend who happens to be an Egypt expert: attentive, unhurried, willing to tell the truth, and never in a rush to close a sale."

### The core philosophy (the north star)

> "We are not designing trips. We are aligning expectations with reality. If expectations are wrong, even the perfect itinerary will feel disappointing. If expectations are right, even small imperfections will be forgiven."

> "Egypt is not a checklist destination. If you rush it, you see everything but experience nothing... Never refuse. Always reframe."

The success metric is an **emotional arc**, not information captured:

> "Your job over the course of the conversation is to move them from cautious to curious to trusting... A conversation where a traveler ends with more trust than they began — even if they do not book immediately — is a successful conversation."

### Tone rules (the disciplines)

- **Anti-persuasion.** "Recommend once, clearly, with your reasoning. Then stop... Do not re-assert... That is salesmanship, not advice."
- **Anti-filler.** The words "honestly" / "to be honest" are banned as filler: "Every time you say 'honestly,' the implied subtext is 'unlike the other things I have been saying.'"
- **Length & pacing.** "A short question deserves a short answer... If you are unsure whether a reply is too long, it is too long. Shorten it."
- **Authority through specificity.** "'By 9 AM the temperature is past 35°C' lands harder than 'summer in Abu Simbel is hot.'"
- **Trade-offs are credibility.** "Recommend Aswan first for first-time visitors. Tell people the 6 AM Abu Simbel flight is the wrong choice in summer."

**Vocabulary — avoid:** discover, explore, uncover, embark, journey (as a verb), magical, mystical, enchanting, breathtaking, unforgettable, "must-see," "Book Now," exclamation marks. **Use:** "we've found that…," "on the ground…," "in our experience…," concrete numbers and named places.

### Nationality calibration

The prompt carries a **detailed framework of 11 traveler archetypes** (Japanese, German, Spanish, Italian, French, Nordic, UK, North American, Chinese, Indian, Pakistani, Latin American). Each maps *surface behavior → deeper truth → conversion trigger → operational adjustments → pricing insight*. Examples:

- **Japanese:** precision, safety, flow. Conversion trigger: *"Everything is taken care of"* — proven through specifics, not stated as a slogan. Close with restrained warmth, not poetic farewells.
- **German:** depth, structure, substance. Trigger: *"You will understand Egypt, not just see it."* Assign only top-tier guides.
- **Spanish/Italian:** emotion, experience. Trigger: *"This will be unforgettable"* — not "efficient." Poetic closings are appropriate *only* here.
- **Indian:** dignity, family, dietary precision (Jain-friendly, no onion/garlic common). Trigger centers on the word *dignity*.

### Budget & pricing voice

- **Never ask budget directly** — "the vast majority of customers are uncomfortable sharing a budget number." Reverse-engineer via hotel level, comfort expectations, and special-experience signals.
- **Never quote firm prices** — only rough orders of magnitude (ranges in EUR), with formal quotes coming from the human team.
- Handles **8 distinct pricing-question types** (sticker shock, competitor comparison, shoestring → redirect to AffordEgypt, currency confusion, "include everything," deposit structure, cash-vs-card, "I need to think about it").

### Contact capture (v4.1.1 — recently amended, see §7 & §14)

Full name **+** email **+** phone with country code are all **required** before any brief goes to the team. If a visitor hesitates, the concierge explains once (a WhatsApp number satisfies the phone requirement) and then holds — it will not promise a proposal or send an incomplete brief.

### Editorial voice blocks (in content)

The voice extends into CMS content via typed Portable Text blocks:
- **Concierge note** — a first-person, gold-ruled italic aside with practical guidance (localized label: "Concierge note" / "Nota del concierge" / "コンシェルジュより").
- **Operator note** — a tonal editorial anchor in articles, tagged `honest` / `caution` / `insider` / `context`.

> **Change control:** the concierge prompt is *locked*. Edits require owner (Islam) sign-off and must be gated through the eval harness (§9) — run a baseline, apply the edit, run a candidate, diff. A `v5` (or the reserved `v4.2` for S13's portfolio-triage work) replaces the constant wholesale and also triggers review of the marker lists in `briefDetection.ts` and `abuseDetection.ts`.

---

## 4. System architecture

The system has **three planes** that meet at the Next.js server:

```
┌─────────────────────────────────────────────────────────────────┐
│  CONTENT PLANE (Sanity)          PRESENTATION PLANE (Next.js)     │
│  ┌────────────────┐   GROQ       ┌──────────────────────────┐    │
│  │ production      │◀────reads────│ (site)/[locale]/ routes  │    │
│  │ migration-      │              │ ISR @60s · SSG · dynamic │    │
│  │  staging        │              │ tour-system / archive /  │    │
│  └────────────────┘              │ blog / guide components  │    │
│         ▲                        └────────────┬─────────────┘    │
│         │ WP→Sanity pipeline                  │                   │
│         │ (scripts/, migration/)              │ embeds            │
│                                    ┌──────────▼─────────────┐    │
│                                    │  /plan-your-tour        │    │
│  CONVERSATION PLANE                │  (concierge chat UI)    │    │
│  ┌──────────────────────────┐     └──────────┬─────────────┘    │
│  │ Supabase (concierge schema)│◀── /api/chat ─┤                   │
│  │ sessions/conversations/    │    /api/brief │                   │
│  │ messages/briefs/rate_limits│    /api/*     │                   │
│  │ eval_scores                │               │                   │
│  └────────┬─────────────────┬─┘               │                   │
│           │ Anthropic         │ Autoura webhook (HMAC)            │
│           │ (Sonnet/Opus)     ▼                                   │
│           ▼            Autoura CRM  ──fail──▶ Resend (team inbox) │
│      chat + extract + judge                                       │
└─────────────────────────────────────────────────────────────────┘
```

- **Content plane** — Sanity holds all editorial content (tours, guides, cities, articles, hotels, cruises, wiki). The Next.js runtime reads it via GROQ with a read token; content edits appear on the live site within the 60-second ISR window.
- **Presentation plane** — the App Router renders locale-prefixed pages. Most are statically generated with ISR; the concierge page and all API/admin routes are per-request dynamic.
- **Conversation plane** — the concierge stores state in Supabase, calls Anthropic for chat/extraction/judging, and delivers completed briefs to Autoura (with an email fallback).

The three planes are loosely coupled: the content and conversation planes share almost nothing except that the concierge can be given a *tour context* (the slug of the page the visitor is on) to ground its answers.

---

## 5. Content layer — Sanity CMS

**Project `ufallvd2`.** Two datasets: `production` (the live site reads this) and `migration-staging` (the WordPress import target, refined before cutover). Two Studio workspaces mounted at `/studio/production` and `/studio/staging`; the deployed Studio also lives at `travel2egypt.sanity.studio`.

### Client configuration (`src/sanity/env.ts`, `src/sanity/lib/client.ts`)

- `apiVersion: 2024-12-01`, `useCdn: false` (CDN disabled to avoid stale-publish inconsistency; latency cost accepted).
- **A read token is required** even for published content. Anonymous reads are incomplete — an earlier attempt to drop the token hid ~83 tour pages. Token precedence: `SANITY_API_READ_TOKEN` → `SANITY_PRODUCTION_API_WRITE_TOKEN` → `SANITY_API_WRITE_TOKEN`.
- The write client (used only by seed/migration scripts) requires `SANITY_API_WRITE_TOKEN`; the WP-import client refuses any dataset other than `migration-staging` as a safety guard.

### Schema inventory (~35 types)

**Tours & packages (one unified type with discriminators):**
- `tour` — `type: dayTour | package`, `tourMode: private | group`. Carries classification (theme, cities, duration), content (title/slug/summary/body), itinerary (`days[]` with morning/lunch/afternoon detail), pricing (indication, tiers, base price in EUR, departures), related refs, media, and the **tour-system structured fields** (journey-1/2/3 design blocks — meta row, timeline, price tiers, trust signals, concierge note, access/audience notes).
- `tourCategory` — 4 top-level hubs (private-day, group-day, private-package, group-package); EN slugs locked to the old WP URLs for SEO.
- `tourLanding` — 28 sub-category landing pages, grouped by destination-city, theme, or origin-region.
- `theme` — package themes.

**Geography & guides:**
- `city` — destination hub; `placesToGo[]` references guide articles; carries guide-archive fields (tier, region, dek in operator voice).
- `guideArticle` — sub-pages under a city (attraction, transport, food, accommodation, etc.), grouped by `section`.
- `coordinates` — lat/lng object.

**Editorial:**
- `article` (document-level i18n — one doc per locale), `editorialCategory` (two-level), `author`, `travelerStory`.

**Reference / wiki:** `wikiMonument`, `wikiPerson`, `wikiDynasty`, `wikiDeity`, `travelTip`, `travelTipCategory`, `faqEntry`, `faqCategory`, `fieldGuide`, `deity`.

**Accommodation & transport:** `hotel`, `nileCruise` (cruise ships, dahabiyas, feluccas — with per-day itinerary).

**Archive / structural:** `dayToursArchive`, `hotelsArchive`, `nileCruisesArchive`, `travelTipsArchive` (editorial wrappers for multi-type landing pages).

**System / singletons:** `homePage`, `siteSettings` (founder, address, guide config, trust), `trustBadge`, `conciergeLinkMap`, `page`, `legalPage`, `editorialPage`.

**Shared objects:** `seo`, `localizedImage` (hotspot + per-locale alt/caption), Portable Text with custom blocks (operator-note, concierge-note, definition-list, pull-quote, side-image, gallery).

### Content model & key relationships

- **The 3-level tour system:** `tourCategory` (L1) → `tourLanding` (L2, grouped by city/theme/region) → `tour` (L3). This is the spine of the tours section.
- **City ↔ guide ecosystem:** a `city` points to `guideArticle` children; attractions carry monument type, precise location, and coordinates and are also mirrored into `city.placesToGo`.
- **Wiki interconnection:** monuments ↔ cities, monuments ↔ people, people ↔ dynasties, deities ↔ deities (family tree).
- **Cross-links** (`relatedTours`, `relatedCities`, `relatedArticles`) are filtered per-locale by a `relatedLocaleGuard` so an untranslated target simply drops from the list rather than producing a dead link.

### Internationalization (two strategies)

- **Field-level i18n** (`sanity-plugin-internationalized-array`) for almost everything: fields store `[{_key:'en', value}, {_key:'es', …}, {_key:'ja', …}]`. GROQ helpers `coalesce(field[_key=="$locale"][0].value, field[_key=="en"][0].value)` give an EN fallback chain.
- **Document-level i18n** (`@sanity/document-internationalization`) for `article` only: one document per locale, linked via the plugin. Chosen because editorial content diverges and an ES/JA-only article is acceptable.
- **Locales:** `en` (default), `es`, `ja`. Finnish was retired; the reintroduction path is documented (add to `SUPPORTED_LANGUAGES` + `routing.ts` + redeploy schema).

### The WordPress → Sanity migration pipeline

A large, still-active effort under `scripts/` and `migration/`:
- **Import** (`scripts/wp-import/`): pulls WP content, classifies each page (destination hub, monument, tour, hotel, cruise, article, service), maps it to a Sanity type, and links translations by scraping `hreflang` alternates (WP REST doesn't expose WPML links). Rate-limited 3–5 req/s with a Wordfence backoff protocol. Writes to `migration-staging`.
- **Migration metadata** on every doc (`migration.wpId`, `wpUrl`, `reviewFlag`, `deckNeedsReview`, resolution provenance) drives editorial triage and redirect mapping.
- **Cleanup:** dozens of `dedup-*`, `fix-*`, `audit-*` scripts consolidate duplicate tours, repoint references, and 301 old URLs.
- **Bulk import** (`bulk-import-*-md.ts`): markdown-based batch content authoring.
- **Redirects:** `migration/redirect-map.csv` (the source of truth) → `redirect-map.generated.ts` (~15k lines) → consumed by `next.config.ts`. Regenerate with `npm run redirect-map:regenerate`.
- **Cutover:** promote `migration-staging` → `production` (backup, clear, export+import, QA) — largely complete; DNS go-live is a separate step.

---

## 6. Presentation layer — Next.js frontend

### Route groups

- `src/app/(site)/[locale]/` — all public, locale-prefixed pages.
- `src/app/(studio)/studio/` — Sanity Studio (outside locale prefixing, `force-static`).
- `src/app/(admin)/admin/` — the concierge reviewer panel (non-localized, Supabase-gated, `force-dynamic`).
- `src/app/api/` — chat, brief, resume, admin, and locale-resolve endpoints.

### Key routing mechanics

- **Root catch-all dispatch** (`(site)/[locale]/[...rest]/page.tsx`): tours live at the site root (`/<slug>`). The catch-all resolves a slug against Sanity and dispatches to `SingleTourView`, `PackageView`, `SubcategoryView`, or `TourCategoryView`. Legacy `/tours/…` and `/packages/…` prefixes 308 (permanent) to canonical root URLs; legacy WP root article/monument slugs 308 to `/blog/…` and `/wiki/monuments/…`.
- **Static generation:** `generateStaticParams` pre-builds ~thousands of routes (blog, guide cities + articles, hotels, cruises, travel tips, monuments, resources).
- **Rendering strategy:** the whole `(site)` group carries `revalidate = 60` (ISR). The catch-all and homepage are server-rendered then cached; `/plan-your-tour` and everything under `/admin` and `/api` are `force-dynamic`.

### Internationalization (next-intl)

- `localePrefix: 'as-needed'` — English at the root, `/es` and `/ja` prefixed.
- Static route names are locale-agnostic (all locales share the English path segment, e.g. `/guide`); **Sanity content localizes its own slugs** per document.
- UI strings live in `messages/{en,es,ja}.json`.
- Middleware (`src/middleware.ts`) handles the concierge **resume-token** flow (verifies an HMAC from a saved-conversation email link, sets the session cookie) and sets `X-Robots-Tag: noindex` on non-production hosts.

### Component architecture

- **Chrome:** `Header` (nav + JourneysMenu + LocaleSwitcher), `Footer` (sister brands, legal, accreditations), `JsonLd` (structured data).
- **Tour system** (`src/components/tour-system/`): `SingleTourView`, `PackageView`, `SubcategoryView`, `PackageSubcategoryView`, plus `JourneyImage` (hotspot-aware, crop-correct hero/figure component) and `TourProse`.
- **Archive** (`src/components/archive/`): a reusable `ArchiveTemplate` (header, essay, featured item, curated collections, faceted index, concierge CTA) powering `/hotels`, `/nile-cruises`, `/travel-tips`, `/resources`.
- **Blog/article:** the `/blog/[slug]` template with sticky sidebar (TOC/scroll-spy), related weave, breadcrumb, and inline concierge/operator note blocks.
- **Concierge** (`src/components/concierge/`): `ChatContainer`, `ConciergeFrame`, `FloatingConcierge`, `BriefPanel`, `EscapeHatch`, `DataMenu`, `ConciergeFallback`.
- **Body renderer** (`src/components/Body.tsx`): the Portable Text renderer used everywhere, resolving internal links and the custom editorial blocks.

### Styling & fonts

- **Tailwind 4** globals (`src/app/globals.css`) with design tokens (limestone/faience/sand/night/paper).
- **`src/styles/tour-system.css`** (~831 lines) is a *verbatim port* of the approved reference designs — every px/color copied, page-body rules scoped under `.tour-doc`/`.lvl-*` so L1/L2/L3 differences never bleed.
- **Fonts** (`src/app/fonts.ts`): Cormorant Garamond + Source Serif 4 (EN/ES); Noto Serif/Sans JP (JA, lazy-loaded); special faces for hieroglyphs and Arabic; Newsreader + DM Sans for tour-system chrome.

---

## 7. The AI concierge

The concierge is the conversion engine and the most intricate subsystem. It was built across sessions **S1–S13**; S1–S10 are merged to `main`.

### Request flow (`POST /api/chat`)

1. **Session** — `ensureSession` resolves or creates a signed session cookie (HMAC), stores keyed one-way IP/user-agent hashes for abuse prevention.
2. **Gates before any model call** — abuse-termination check, rate-limit check (per-session soft cooldown + per-IP hard block), token-cap check.
3. **Prompt assembly** — the locked v4.1.1 prompt is **system block 1 with a `cache_control` breakpoint** (~13.2k cached tokens → ~10× input-cost cut on turn 2+). Runtime context (tour context, wrap-nudge) is appended as block 2 *after* the breakpoint so it never invalidates the cache.
4. **Streaming** — the Anthropic response streams back as SSE; the assistant turn is persisted with token counts and cache-read telemetry.
5. **Gate 1 (brief detection)** — a cheap deterministic marker check runs on the assistant text.

### The two-gate brief flow

Capturing a lead is deliberately split so the expensive step runs rarely:

- **Gate 1** (`src/lib/briefDetection.ts`) — a stateless substring match for wrap-up phrases (9 EN + 3 ES markers, calibrated against real wraps) **AND** a captured email on the session. Cheap; runs every assistant turn.
- **Gate 2** (`src/lib/briefExtraction.ts`, via `POST /api/brief`) — a separate non-streaming Sonnet call that extracts a structured `BriefPayload` from the transcript, prompt-constrained to JSON with three worked examples. Only fires after Gate 1. A deterministic `passesCompletenessRule()` guard then enforces completeness in code (name + email + phone **and** trip substance) — this is the v4.1.1 "at both layers" enforcement (§14).

### Supporting subsystems

- **Rate limiting** (`rateLimit.ts`) — fixed-window counters: chat 40/10min soft + 200/hr hard per IP; brief 5/hr; resume email 3/hr + 5/day; abuse 3-strike session termination; token caps (soft 50k → wrap nudge, hard 75k → canned wrap with no model call). All tunable via `RL_*` env.
- **Abuse detection** (`abuseDetection.ts`) — **flag-only, never blocks or rewrites**. Categorizes prompt-injection / hostile / off-topic / repeated-identical (EN+ES, accent-normalized), tags the conversation for review, and (hostile only) fires a real-time team alert.
- **Escape hatch** (`/api/escape-hatch`) — visitor-initiated "talk to a human" (WhatsApp / forward-to-team / continue).
- **Data rights** (`/api/data-request`) — GDPR anonymization: strips message content to `[deleted]`, empties briefs, nulls email, stamps `anonymized_at`, **retains** the abuse-prevention hashes (one-way, non-PII).
- **Resume** (`/api/resume` + middleware) — emails a 30-day HMAC link so a visitor can continue a conversation later.
- **Admin panel** (S10, `/admin`) — Supabase-auth (email OTP) reviewer surface: list/detail views, reviewer rating + notes, transcript export, daily digest, search.

### Prompt caching — a load-bearing detail

The single most important performance mechanism is the cached v4.1 prefix. The chat route records `cache_read_input_tokens` per turn precisely so the daily digest can **alert if the hit rate collapses** — a silent prefix invalidation (from a stray edit or model change) would otherwise show up only as a cost and latency spike. Keep the prompt frozen and keep runtime context after the breakpoint.

---

## 8. Autoura integration

When a brief completes, it is delivered to **Autoura** (the team's external CRM) as an HMAC-signed webhook. The sender was built in S9 and is production-verified. It lives under `src/lib/concierge/autoura/`.

- **`deliver.ts`** — a fire-and-forget worker kicked off by `/api/brief` after the brief row is persisted. It **never throws** to the caller; every external effect is wrapped. Every dependency is injectable, so the whole worker is unit-tested offline.
- **`sign.ts`** — HMAC-SHA256 over `${timestamp}.${rawBody}`, header `X-Autoura-Signature: t=<unix>,v1=<hex>`. A **keystone test** asserts our digest equals the receiver's published test vector — if it ever fails, the two implementations have drifted. The **sign-once contract** is critical: the exact bytes signed must be the exact bytes sent (no re-serialization).
- **`payload.ts` / `types.ts`** — pure transform from the internal `BriefPayload` to Autoura's wire shape (five field renames; `comfort_level` sent verbatim to surface a known receiver-side mapping gap).
- **`stateMachine.ts`** — pure retry logic: **3 total sends** (initial + 2 retries at 1s/5s), outcome classification (2xx = success incl. `duplicate_ignored`; 429/5xx/network = retry; 4xx = permanent), fail-closed on missing config.
- **Idempotency** — every send carries `(conversation_id, brief_revision)`, so retries and startup reconciliation never double-create.
- **Fallback** — when retries exhaust (or config is missing), an **email fallback** sends the full brief + transcript to the team inbox and an ops alert, then marks `email_fallback_sent` so it won't re-fire.
- **Startup reconciliation** (`reconcile.ts`, via `instrumentation.ts`) — on every Node boot, re-attempts up to 20 stuck briefs (this is the v1 durability mechanism; there is no queue).
- **Canary** (`/api/admin/autoura-canary`, added this week) — a scheduled dry-run (`X-Autoura-Dry-Run: true`) that exercises the real signing/payload path weekly and alerts on contract drift *before* a real lead hits it.

> ⚠️ **Local `.env` points at production Autoura.** Completing a brief in a local chat fires a real lead into the production CRM. Blank `AUTOURA_WEBHOOK_URL`/`SECRET` locally to fail-closed to the email fallback before testing the full wrap flow.

---

## 9. The quality harness (Layers 1–3)

Built this week to give the concierge regression protection and live drift detection — the parts that were previously unguarded (marker fragility, extraction accuracy, conversation quality, Autoura contract drift, cache health).

### Layer 1 — regression net (merged to `main`, PR #16)

- **Marker corpus tests** (`src/lib/__tests__/briefDetection.test.ts`, `abuseDetection.test.ts`) freeze the real calibrated wrap phrasings that must fire and the ordinary turns that must stay silent — so any prompt/model change that breaks Gate 1 goes red in CI.
- **Autoura dry-run canary** (see §8).
- **CI** (`.github/workflows/ci.yml`) — the repo's first CI: typecheck + `test:concierge` (markers + Autoura suites) + link-map tests on every push/PR. Env-free by design.

### Layer 2 — offline eval runner (PR #18)

`scripts/concierge-eval/` — the **go/no-go gate** for any prompt edit or model upgrade. `npm run eval:concierge`.
- **Replay suite** (`personas.ts`): 14 scripted EN/ES personas (leads, browsers, injection, hostile) run against the *real* production pipeline. Deterministic checks (wrap emitted or not, contact requested, no prompt leak) reuse the same `detectBriefMarkers` CI freezes.
- **Extraction suite** (`extraction-fixtures.ts`): 6 fixed golden transcripts through the real `extractBrief()`, field-level assertions, rep-variance flagging.
- Resumable, named baseline/candidate runs, optional LLM-judge pass. This is what makes a `v5` prompt or model bump a one-command comparison instead of a leap of faith.

### Layer 3 — production sampling (PR #19)

- **`/api/admin/quality-sample`** — a daily cron judges up to `QUALITY_SAMPLE_SIZE` (default 5) of yesterday's real conversations with the **same rubric** as the offline evals (`src/lib/concierge/qualityJudge.ts`, shared code → one scale), writing scores to `concierge.eval_scores`.
- **Cache-hit telemetry** — the digest reports the daily prompt-cache hit rate and alerts below 50%.
- Everything is **fail-soft**: until migration 0008 is applied the sampler 503s, the digest says "telemetry not enabled," and the chat insert falls back — deploy order cannot break anything.

---

## 10. Data & infrastructure

### Supabase — `concierge` schema

Migrations live in `supabase/migrations/` and are **applied manually** by the owner via the Supabase dashboard (never programmatically against the shared prod DB).

| # | Adds |
|---|---|
| 0001 | `sessions`, `conversations`, `messages`, `briefs`, `rate_limits` |
| 0002 | conversation tour context (`tour_slug`, `tour_title`) |
| 0003 | escape-hatch columns |
| 0004 | rate-limit `action` column |
| 0005 | `briefs.brief_revision` |
| 0006 | `sessions.anonymized_at` (GDPR erasure timestamp) |
| 0007 | *(S13 portfolio-triage — applied to prod from an unmerged branch)* |
| 0008 | `eval_scores` table + `messages.token_count_cache_read` (**applied to prod 2026-07-03**) |

The TypeScript view of the schema is `src/types/concierge-db.ts`; the server client is `src/lib/supabase/server.ts` (`conciergeDb()`).

### Environment variables (names only; values are secrets)

`ANTHROPIC_API_KEY` · `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` · `SANITY_API_READ_TOKEN` / `SANITY_API_WRITE_TOKEN` / `SANITY_STAGING_API_WRITE_TOKEN` · `NEXT_PUBLIC_SANITY_*` · `RESEND_API_KEY` / `EMAIL_FROM` / `TEAM_INBOX_EMAIL` / `ALERT_EMAIL` · `AUTOURA_WEBHOOK_URL` / `AUTOURA_WEBHOOK_SECRET` · `SESSION_COOKIE_SECRET` / `RESUME_TOKEN_SECRET` / IP-hash secret · `CRON_SECRET` · `CHAT_ENABLED` · `QUALITY_SAMPLE_SIZE` · `NEXT_PUBLIC_SITE_URL`.

### Cron jobs (Railway, dashboard-configured)

- Daily digest → `GET /api/admin/digest` (~06:00 UTC / 08:00 Cairo).
- Quality sample → `GET /api/admin/quality-sample` (recommend `15 4 * * *` UTC). **Pending setup.**
- Autoura canary → `GET /api/admin/autoura-canary` (recommend weekly `0 5 * * 1`). **Pending setup.**

All three are `CRON_SECRET` bearer-protected with timing-safe comparison.

### Hosting

Railway, full Next.js server (ISR + API routes + Edge middleware). Non-production hosts are `noindex`-gated until DNS go-live.

---

## 11. SEO, structured data & compliance

### Metadata & i18n (`src/lib/seo.ts`)

- Title/description/OG fall back through the `seo` block → document field → site defaults.
- **hreflang** for en/es/ja with `x-default` = EN canonical; per-locale paths where slugs differ, prefix-based where they don't.
- Canonical = current-locale URL; non-production hosts are canonicalized to production.

### Structured data (`src/lib/structured-data.ts`) — 11 JSON-LD schemas

`Organization` (TravelAgency, with JATA/IATA/ASTA/ETAA accreditations, sister brands as `subOrganization`, founding date 2003), `Person` (founder), `WebSite`, `Article`, `TouristTrip` (tours/packages, with `additionalType` for the four product cells and EUR offers for group products only), `Hotel`, `BoatTrip` (cruises), `Place` (cities/monuments), `TouristAttraction`, `BreadcrumbList`, `FAQPage`.

### Robots (`src/app/robots.ts`, `src/lib/robotsPolicy.ts`)

- Non-production hosts: `Disallow: /` (blocked until cutover). Production: full crawl.
- **AI crawlers deliberately allowed** — anthropic-ai, ClaudeBot, GPTBot, ChatGPT-User, Google-Extended, PerplexityBot, CCBot. Editorial depth is a distribution asset; LLM citation is a channel the brand wants.
- Always disallowed: `/studio`, `/admin`, `/api/`, and the wiki people/dynasty/deity pages (v2 candidates).

### Compliance

- **Cookie consent** — informational only (strictly-necessary cookies: locale + concierge session). A single "Got it" dismiss, re-openable from the footer; there is no analytics/tracking/ad tech.
- **GDPR** — the `/api/data-request` anonymization flow (§7) matches the published privacy policy verbatim; changing one requires editing the other.
- **Legal pages** — `terms` / `privacy` / `cookies` / `disclaimer`, each a localized Sanity document.

---

## 12. The sister-brand portfolio

Defined in `src/components/Footer.tsx` and emitted as `subOrganization` in the Organization JSON-LD. Four tiers by price/positioning:

| Brand | Tier | Note |
|---|---|---|
| **AffordEgypt** | Budget | Where the concierge redirects shoestring negotiators (never a discount on Travel2Egypt). |
| **Travel2Egypt** | Mainstream editorial-authority | This site. |
| **Sillage** | Luxury, Aswan-rooted | Boutique. (Replaced the retired "Soléi.") |
| **Sawa** | Group journeys | Coordinated multi-party travel. |

---

## 13. Development workflow & conventions

- **Sessions.** Work is organized into numbered sessions (concierge S1–S13; content/migration sessions run higher). Each session is one or a few feature branches with a handoff note; memory files track state between them.
- **Branch model.** Feature branches → PR → squash/merge to `main`. Harness work this week was **stacked** (L1 → L2 → L3 → policy); note the lesson learned: merging a base PR with `--delete-branch` *closes* dependent PRs permanently — retarget dependents to `main` first, or recreate them.
- **Testing.** Lightweight `tsx` test files (no jest/vitest), run via `npm run test:*` and aggregated in `test:concierge`; CI runs typecheck + these suites. The eval harness (§9) is the model-behavior test.
- **Prompt/model changes** go through the eval harness baseline→candidate gate.
- **Prod safety.** Sanity writes and Supabase migrations are deliberate, owner-run steps; the WP-import client hard-refuses the production dataset; production DB reads from a dev session are permission-gated.
- **Docs.** Specs and briefs live under `docs/specs/`; reference HTML designs under `docs/references/`; migration docs under `migration/` and `docs/migrations/`.

---

## 14. Current state & open items

### Merged to `main`
Concierge S1–S10 (chat, brief flow, escape hatch, Spanish chrome, rate limiting, consent/privacy, Autoura sender, admin panel); the content platform (tours, guides, blog, wiki, archives); harness **Layer 1** (PR #16).

### Open PRs (this week's work — stacked, merge in order)
1. **PR #18** — harness Layer 2 (offline eval runner).
2. **PR #19** — harness Layer 3 (production sampling + cache telemetry). *Depends on migration 0008, which is already applied to prod.*
3. **PR #20** — **v4.1.1 contact policy + Gate-2 completeness enforcement** (this is a prompt amendment + code guard; see below).

> Merge each, then retarget the next to `main` before deleting the base branch.

### The v4.1.1 amendment (owner decisions, 2026-07-03)
Two day-1 findings from the harness were resolved by owner decision:
1. **Phone required.** v4.1 contradicted itself (phone "non-negotiable" vs "email alone is acceptable"). v4.1.1 makes **full name + email + phone with country code** required before any handoff, everywhere — the hesitancy passage now explains once and holds. `CONCIERGE_PROMPT_VERSION = 'v4.1.1'` is stamped on new conversations.
2. **Gate-2 false-complete fixed in code, at both layers.** `passesCompletenessRule()` now requires the full contact trio *and* trip substance before `complete: true` — a tighten-only guard that leaves the approved prompt text untouched. Verified live: the model still occasionally mis-marks contact-only transcripts complete, and the guard forces `false`.

The full v4.1.1 candidate eval run is **all green** (14/14 replay, 6/6 extraction × 2 reps).

### Ops checklist (owner / dashboard-side)
- [ ] Merge PRs #18 → #19 → #20 (in order).
- [x] Apply migration 0008 (done).
- [ ] Railway cron: quality-sample (`15 4 * * *` UTC).
- [ ] Railway cron: Autoura canary (weekly `0 5 * * 1`).
- [ ] DNS go-live / production cutover (removes the `noindex` gate).

### Known watch-items
- The v4.1.1 phone requirement means privacy-conscious visitors who refuse a number leave without a brief sent — intended, but worth watching the daily quality digest for lead-loss over the first weeks.
- S13 portfolio-triage (v4.2) is fully built on an unmerged branch with migration 0007 applied to prod; it is paused before a founder verification battery.
- Remaining pre-launch gates noted across sessions: JA legal copy, S11 hardening, and the two Railway crons above.

---

## 15. Where to find things — file index

**Brand & voice**
- `src/lib/conciergePrompt.ts` — the locked v4.1.1 system prompt (the voice).
- `migration/.brand-inputs/` — brand spec, voice samples, direction brief.

**Concierge runtime**
- `src/app/api/chat/route.ts` — the chat turn (streaming, gates, prompt assembly, cache telemetry).
- `src/lib/briefDetection.ts` / `src/lib/briefExtraction.ts` — Gate 1 / Gate 2 (+ `passesCompletenessRule`).
- `src/lib/abuseDetection.ts` · `src/lib/concierge/rateLimit.ts` · `session.ts` · `cookie.ts` · `resumeToken.ts` · `tourContext.ts` · `qualityJudge.ts`.
- `src/app/api/{brief,resume,escape-hatch,data-request}/route.ts`.

**Autoura**
- `src/lib/concierge/autoura/{deliver,sign,payload,stateMachine,reconcile,types}.ts` (+ `__tests__/`).
- `src/app/api/admin/autoura-canary/route.ts`.

**Harness**
- `scripts/concierge-eval/` (runner, personas, fixtures, README).
- `src/lib/__tests__/` (marker + completeness tests).
- `.github/workflows/ci.yml`.
- `src/app/api/admin/quality-sample/route.ts` · `src/lib/admin/digest.ts`.

**Content / Sanity**
- `src/sanity/` (env, client, schemas, structure, queries, i18n helpers).
- `sanity.config.ts` · `sanity.cli.ts`.
- `scripts/` (wp-import, dedup, bulk-import, seed) · `migration/`.

**Frontend**
- `src/app/(site)/[locale]/` (routes) · `src/components/{tour-system,archive,concierge}/`.
- `src/middleware.ts` · `src/i18n/` · `next.config.ts` · `src/app/globals.css` · `src/styles/tour-system.css` · `src/app/fonts.ts`.

**SEO / compliance**
- `src/lib/{seo,structured-data,robotsPolicy}.ts` · `src/app/{robots,sitemap}.ts` · `src/components/{Footer,CookieConsent,LegalPageView}.tsx`.

**Infra**
- `supabase/migrations/` · `src/types/concierge-db.ts` · `src/lib/supabase/server.ts` · `.env.example`.

**Docs**
- `docs/specs/` (build brief, agent prompt, decisions, operating principles, email templates).
- `docs/references/` (approved reference designs) · `docs/environments-and-datasets.md`.

---

## 16. Glossary

- **Brief** — the structured lead the concierge extracts and hands to the team (`BriefPayload`).
- **Gate 1 / Gate 2** — the two-stage brief detection: cheap deterministic marker check, then the expensive extraction call.
- **journey-1 / -2 / -3** — the approved reference designs for the 3-level tour system (category / subcategory / single).
- **L1 / L2 / L3** — tourCategory / tourLanding / tour.
- **Tour context** — the slug of the page a visitor is on, injected after the cache breakpoint to ground the concierge.
- **Wrap** — the concierge's closing turn that triggers brief detection.
- **v4.1.1** — the current concierge prompt version (phone-required contact policy).
- **Sxx** — a numbered development session (e.g. S9 = Autoura sender, S10 = admin panel, S13 = portfolio triage).
- **Canary** — the scheduled Autoura dry-run that detects contract drift before a real lead does.
- **Fail-soft** — code that degrades gracefully when a migration/config is absent, so deploy order can't break anything.
- **migration-staging** — the Sanity dataset used as the WordPress import target before cutover to `production`.

---

*Prepared from a full codebase survey of `t2e` (frontend, Sanity content layer, concierge/Autoura backend, and harness) plus the current session's policy and harness work. For the live brand voice, the prompt file is authoritative; for content structure, the Sanity schemas are authoritative; for concierge behavior, the eval harness is the executable spec.*
