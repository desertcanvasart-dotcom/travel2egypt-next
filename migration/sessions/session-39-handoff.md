# Session 39 — /faq page

**Date:** 2026-05-16
**Branch:** `session-39-faq-page` (worktree off `main`)

First Tier 2 page. `/faq` ships with 24 Q&A across 7 categories,
rendered as a native accordion with deep-link support. This is the one
bit of new component scaffolding in Tier 2 — subsequent Tier 2 pages
reuse `EditorialPageView`.

## What shipped

- **Content:** 7 `faqCategory` docs + 24 `faqEntry` docs, imported via
  `scripts/import-faq.mjs` from `migration/content/faq-prep.md`.
- **Query:** `faqPageQuery` in `queries.ts` — categories ordered by
  `orderRank`, each with its entries nested (`references(^._id)`).
- **Component:** `FaqPage.tsx` (server) + `FaqHashOpener.tsx` (client).
  Hero → intro → 7 headed category groups → bottom WhatsApp CTA. Each
  entry is a native `<details>`/`<summary>` accordion.
- **Route:** `src/app/(site)/[locale]/faq/page.tsx`.
- **Footer:** `/faq` added to the **Resources column** (top of list).
- **Sitemap:** `/faq` restored at priority 0.6 (removed in session 37).
- **Translations:** `faq` namespace (meta + hero + CTA) and
  `footer.faqLabel` added to en/es/ja. ES/JA hold EN placeholders.

## Operator correction applied

The session brief instructed: **"egypt entry visa is $30 now not $25."**
The prep file (marked FINAL) still said USD 25 in two places in the
visa answer. Both were imported as **USD 30** per the operator. Verified
in the rendered page.

## Pre-flight findings — reality vs. brief

- **Schema differs from the brief's assumptions.** `faqCategory` uses
  `name` (not `title`) + a localized `slug` + `orderRank` (not `order`).
  `faqEntry` has `question`, `answer` (localized PT), `category` (ref),
  `relatedArticles`, `orderRank` — **no `slug` field.** Both schemas
  already exist and are registered in `schemas/index.ts`.
- **No schema change made.** The brief's Step 3c assumed a `slug` on
  `faqEntry` for anchors. Rather than extend the schema (operator-gated),
  anchor ids are **derived at render time** by slugifying the EN question
  text (e.g. `do-i-need-a-visa-for-egypt`). Deterministic, zero schema
  risk. Category `<h2>` ids use the real category slug.
- **Zero existing FAQ docs** in the dataset — clean build, no operator
  pre-draft to reconcile.

## Footer column decision

**Option (a) — Resources column** (the brief's default). FAQ sits at the
top of Resources, above Hotel Grade Concept / City Distances / Name in
Hieroglyphs. It's a traveler reference tool, structurally like the rest
of that column.

## Deep-link behaviour

Every `<details>` carries `id={slugified-question}`; every category
`<h2>` carries `id={category-slug}`. `FaqHashOpener` (client) reads the
URL hash on load and on `hashchange`, opens the matching `<details>`,
and scrolls it into view. Native `<details>` means the accordion works
with JS disabled; only the auto-open needs the client.

## Smoke test results (dev server, migration-staging dataset)

Browser-verified via preview (not just curl):

| Check | Result |
|---|---|
| `/en/faq` — hero + 7 categories + 24 entries | PASS (200, 7 `h2[id]`, 24 `<details>`) |
| Click `<summary>` → expand / collapse | PASS (closed→open→closed) |
| `/faq#do-i-need-a-visa-for-egypt` → entry pre-opened + scrolled | PASS (`open=true`, in view; siblings stay closed) |
| `/es/faq` — EN body fallback | PASS (200) |
| `/ja/faq` — EN body fallback | PASS (200) |
| Bottom WhatsApp CTA → wa.me with pre-fill | PASS |
| Footer Resources → "FAQ" link resolves | PASS |
| `/sitemap.xml` — `/faq` at 0.6 × 3 locales | PASS |
| Studio — 7 `faqCategory` + 24 `faqEntry` docs | PASS (imported; schemas registered) |
| Mobile responsive — categories/accordion stack | PASS (narrow-viewport screenshot) |
| Keyboard nav — tab to summaries, Enter toggles | Native `<details>`/`<summary>` — browser-native, not separately scripted |
| `tsc --noEmit` | PASS (clean) |
| Bullet lists / numbered list (`<ol>`) in answers | PASS (17 `<ul>`, 1 `<ol>` for booking steps) |
| Bold / italic marks (e.g. *baksheesh*) | PASS (67 `<strong>`, 15 `<em>`) |
| External link (e-Visa portal, `target=_blank`) | PASS |
| Visa fee shows USD 30 (not 25) | PASS |

Pre-existing unrelated `{tier}` `FORMATTING_ERROR` still in the dev log
— untouched, separate follow-up (noted since s37).

## Editorial note

The prep file's intro paragraph opened with the same sentence as the
hero subhead ("Quick answers to questions we hear most often."). To
avoid the duplication, the hero keeps that line and the on-page intro
starts from "For deeper guidance…". Intro is static EN in the component
(with locale-aware links to /travel-tips and /guide) — consistent with
the EN-only body.

## Spotted (out of scope) — Footer tagline drift

`footer.tagline` reads "Egyptian-operated since **1995**. JATA, IATA,
ASTA accredited." — inconsistent with the locked brand facts (company
registered 2003 / Islam since 1993; four accreditations incl. ETAA).
Not touched this session. Flagged for a follow-up copy fix.

## TODO stack (carried forward)

- **Translation review:** `faq` namespace + `footer.faqLabel` + all FAQ
  body content (24 answers, 7 category names) — ES/JA still EN. Joins the
  batched backlog (sessions 30–34, 36, 37, 38).
- **`faqEntry` has no `slug` field** — anchors are render-derived. If the
  operator later wants editor-controlled anchors or per-entry routes
  (`/faq/<slug>`), that needs a schema field + migration.
- **`relatedArticles`** on `faqEntry` is unused — answers could cross-link
  to editorial once the operator populates it.
- `siteSettings.contact.whatsapp` still unset (s37 — `scripts/set-whatsapp-number.mjs` ready).
- Stale `session-37-contact-and-stopgap` worktree still present.
- `{tier}` `FORMATTING_ERROR` — unrelated pre-existing dev-log error.

## Status

First Tier 2 page complete. The accordion component (`FaqPage` +
`FaqHashOpener`) is FAQ-specific; remaining Tier 2 editorial pages reuse
`EditorialPageView`.
