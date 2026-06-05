# EN/ES/JA Localization Completeness Sweep — Phase 2 Diagnosis

**Branch:** `feat/localization-sweep` · **Project:** ufallvd2 · **Dataset:** migration-staging
**Date:** 2026-06-05 · **Status:** READ-ONLY diagnosis. No content written, no code changed. **Stop for review before Phase 3.**

**Method:**
1. UI-string key parity — `messages/{en,es,ja}.json` flattened-key diff + identical-to-EN scan (cause B).
2. Sanity field population — `scripts/audit-localization-gaps.mjs` introspects every published doc, detects internationalized-array fields, counts es/ja vs en population (cause A). Output: `reports/localization-gaps.data.json`.
3. Live render confirmation — dev server, every page TYPE in `/es` and `/ja`, English-leakage signal + H1/excerpt extraction (separates A from C).
4. Code trace — query projections + view `?? t()` fallback chains to pin C to a file:line.

---

## Phase 1 — Editorial style notes (the register Phase 3 will match)

Absorbed from fully-localized surfaces: JA homepage/nav (re-authored, not translated), ES category mastheads + guide content, and the EN voice on `/about`, `/contact`, `/faq`.

**Brand voice (all locales):** field notes, unhurried, operator-grade. First-person plural ("we run / we answer"), concrete over promotional, honest trade-offs ("skip this", "worth it / not worth it"), **no CTAs in body copy**, no placeholder text. EN is **British English**; "Ramses" not "Ramesses"; **BC/AD** dates.

**ES style note.** Neutral international Spanish (not regional slang), *usted*-implied register but warm. Re-author for a Spanish-reading traveller, do **not** calque English syntax. Keep proper nouns and brand/category loanwords where the trade already uses them (*Deluxe*, *Boutique*, *Dahabiya* are acceptable in ES hospitality). Egyptian place names in their Spanish forms ("El Cairo", "Asuán", "Luxor"). Em-dashes and the unhurried cadence of the EN voice carry over. **ES slugs** are fully localized words (`el-cairo`, `cruceros-por-el-nilo`) — never machine transliteration.

**JA style note.** Native-reading 日本語, **です・ます** polite register, no italic (per the JA type pass). Re-authored for a Japanese audience — short, clean sentences; katakana for foreign proper nouns (カイロ, ルクソール, ナイル川クルーズ). Avoid translationese (no literal renderings of EN idiom). Use 「」 quoting, full-width punctuation （、。）. **JA slugs** use **romaji** (collision-resolved), not kana. **AI-drafted JA must be marked for human review** — it has to read native, not translated.

---

## Headline

- **UI strings (B): essentially complete.** 845/845 keys present in both es & ja — **zero missing keys**. Only a small set of meta/UI labels remain identical-to-EN (FAQ, contact, about, consent). Tightly bounded.
- **Code/display (C): one preemption bug, 3 archive pages.** `/hotels`, `/nile-cruises`, `/travel-tips` mastheads render English H1+deck **even though the translated i18n keys exist** — the Sanity `mastTitle` en-coalesces and short-circuits `?? t()`. Identical to the journey-system bug already fixed; ArchiveTemplate was simply not included in that fix. **Code pass, no translation.**
- **Content (A): the bulk of the work, and it's lopsided.** ES lags badly where JA is largely done (hotels, cruises). FAQ is **entirely English** in both locales. The 25 un-localized tours surface as the English cards (incl. the two named ones). Editorial/about pages, archive-doc mastheads, and a long tail of localized slugs are unfilled.

---

## (C) DISPLAY / SOURCE issues — DO NOT translate around; flag for a code pass

| Route | Field | Cause | Fix |
|---|---|---|---|
| `/hotels` | H1 + deck | `hotelsArchiveQuery` projects `"title": localizedField('mastTitle')` → en-coalesce returns truthy EN, masking translated `hotels.landingTitle`/`landingDeck` (both **exist** in es/ja). View: `archive?.title ?? t('landingTitle')` at [hotels/page.tsx:197](src/app/(site)/[locale]/hotels/page.tsx). | switch `mastTitle`/`tagline` to `localizedFieldStrict` in [queries.ts:650](src/sanity/lib/queries.ts) |
| `/nile-cruises` | H1 + deck | same pattern, [queries.ts:762](src/sanity/lib/queries.ts) + [nile-cruises/page.tsx:197](src/app/(site)/[locale]/nile-cruises/page.tsx) | `localizedFieldStrict` |
| `/travel-tips` | H1 + deck | same pattern, [queries.ts:1528](src/sanity/lib/queries.ts) + [travel-tips/page.tsx:154](src/app/(site)/[locale]/travel-tips/page.tsx) | `localizedFieldStrict` |

**Reference:** `dayToursArchiveQuery` ([queries.ts:684](src/sanity/lib/queries.ts)) already uses `localizedFieldStrict('mastTitle')` — the 4 tour/package category mastheads confirmed rendering localized (ES "Excursiones privadas de un día", JA "プライベート日帰りツアー"). Apply the same to these 3.
**Scope note:** ONLY `mastTitle`/`tagline` have translated i18n fallbacks. The archive `essay`/`kicker` are Sanity-only long-form with no i18n key → those stay en-coalescing and belong to (A), not (C).

---

## (B) MISSING UI STRINGS — add to `messages/{es,ja}.json`

Zero missing keys; these are present-but-identical-to-EN (genuine untranslated UI). **Recommend translating (es + ja unless noted):**

| Key(s) | EN value | Locales |
|---|---|---|
| `faq.heroHeading` | "Frequently Asked Questions" | es + ja |
| `faq.heroSubhead` | "Quick answers to questions we hear most often." | es + ja |
| `faq.bottomCtaPretext` | "Still have a question?" | es + ja |
| `faq.bottomCtaLabel` | "Talk to us on WhatsApp" | es + ja |
| `faq.metaTitle`, `faq.metaDescription` | SEO meta | es + ja |
| `contact.metaTitle`, `contact.metaDescription` | SEO meta | es + ja |
| `about.metaTitle`, `about.metaDescription` | SEO meta | es + ja |
| `consent.headline` | "We use only essential cookies" | es + ja |
| `consent.body` | "Travel2Egypt sets a single cookie…" | es + ja |
| `consent.policyLink` | "Read our cookie policy" | es + ja |
| `consent.gotIt` | "Got it" | es + ja |
| `wiki.roles.noble`, `hotels.categoryDeluxe/Boutique`, `cruises.tierDeluxe/Boutique/typeDahabiya`, `nileCruises.vesselDahabiya`, `hotelGradeConcept.tiers.deluxe.heading`, `floatingConcierge.trigger/eyebrow` | category/loanword labels | **es only** (ja already localized these) — *review:* may be intentional loanwords |

**Leave as-is (brand / symbol / universal):** `site.name` (Travel2Egypt), `footer.faqLabel` ("FAQ"), `cruise.oneWayRoute` ("{from} → {to}").

> WHY left behind: meta/consent/faq-chrome strings were added after the main UI-string translation passes (homepage/nav/tour-system) and never went through a locale sweep.

---

## (A) MISSING CONTENT — author editorial ES/JA in Sanity (additive only)

Counts are published docs with EN populated but the locale value absent. Full doc lists in `reports/localization-gaps.data.json`.

### A1 — FAQ (entirely English, both locales) — **highest impact**
| Doc type | Count | Fields | es | ja |
|---|---|---|---|---|
| `faqEntry` | 24 | `question`, `answer` (portable text) | 0/24 | 0/24 |
| `faqCategory` | 7 | `name`, `slug` | 0/7 | 0/7 |

> WHY: the FAQ subsystem (page + content) shipped after the localization passes and was never translated at all — UI chrome (B) *and* content (A).

### A2 — Tours / packages (the English cards, incl. the two named) — **25 docs, both locales**
| Doc type | Field | gap es | gap ja |
|---|---|---|---|
| `tour` | `summary` (card excerpt) | 25 | 25 |
| `tour` | `body` | 25 | 28 |
- All-or-nothing per doc: the **same 25 tours** lack both es+ja `summary`/`body` (3 extra ja-only body gaps).
- **Confirmed named cards:** `luxor-2-day-tour-by-plane-from-cairo` ("Take to the skies…") and `aswan-and-abu-simbel-from-luxor` ("Embark on the enchanting 2-Day Egypt's Majestic Trio…"). Both are genuine (A) summary gaps — they surface on `/es|ja/egypt-on-the-go`, `/tours`, `/packages`, `/group-day-tours` card grids.
- Structured tour fields (`durationLabel`, `includedItems`, etc.) have en=1 only (seed sample) → negligible.

> WHY: bulk tour-body translation covered ~196/221; these 25 (mostly packages + Red Sea / desert day-tours) were never drafted. Single-tour content was explicitly scoped *separately* in the journey audit (~14k words).

### A3 — Hotels & Cruises (ES-specific — JA largely done)
| Doc type | Field | gap es | gap ja | Note |
|---|---|---|---|---|
| `hotel` | `name`, `summary` | 72 | 2 | body es already done (77/77); only short fields lag in ES → **mixed EN title + ES body** on hotel singles |
| `nileCruise` | `name`, `summary` | 48 | 0 | JA fully localized; ES barely started (2/50) |

> WHY: JA hotel/cruise pass completed name+summary; the ES pass did bodies but never the short head fields. Cruises never got an ES short-field pass at all.

### A4 — Archive masthead docs (long-form, both locales)
| Doc | Fields (es/ja both 0) |
|---|---|
| `hotelsArchive` | `essay`, `essayHeading`, `kicker`, `tagline`, `mastTitle` |
| `nileCruisesArchive` | `essay`, `essayHeading`, `kicker`, `tagline`, `mastTitle` |
| `travelTipsArchive` | `essay`, `essayHeading`, `kicker`, `tagline`, `mastTitle` |
| `dayToursArchive` | `essay`*, `essayHeading`, `mastTitle`, `tagline`, nested `navigator.items[].note`, `featured.dek` |

> NOTE: `mastTitle`/`tagline` on hotels/cruises/travel-tips render via the **(C)** fix once code lands — do NOT author those. `essay`/`essayHeading`/`kicker` have no i18n fallback → must be authored (A). *dayToursArchive `essay`/`kicker` already have es/ja; only `essayHeading`/`mastTitle`/`tagline` (only-EN keys) + nested notes remain.
> WHY: the journey audit drafted day-tour & package category essays; these four archive editorial docs were out of that scope.

### A5 — Editorial / static pages
| Doc | Count | Fields (es/ja 0) |
|---|---|---|
| `editorialPage` (about, contact, hotel-grade-concept, responsible-travel) | 4 | `heroHeading`, `heroSubhead`, `bottomCtaHeading`, `bottomCtaBody`, `ribbonBody`, **+ body essay** |
- `/about` (founder essay "An Aswan childhood…") and `/contact` (all copy) render fully English in both locales.

> WHY: editorial static pages were authored late in EN and never entered a localization pass.

### A6 — Localized slugs & small tails (lower priority — routing/SEO, not visible body copy)
| Doc type | Gap | Effect |
|---|---|---|
| `tourLanding` | 13 missing es/ja slug | localized landing URLs fall back to EN slug |
| `tour` | 5 es / 7 ja missing slug | localized tour URLs fall back |
| `editorialCategory` | 19 missing es slug (4/23 done) | blog category localized URLs |
| `theme` | 8 missing es/ja slug | package-theme localized URLs |
| `legalPage` (4) | es/ja slug null | legal pages render localized **body** (i18n-driven, enW≈0) but have no localized slug |
| `travelTipCategory` | 7 `description` es/ja; 1 slug | category descriptions English |
| `guideArticle` | 4 es title, 2 es/ja body+summary | tiny tail in a 724-doc set (>99.7% localized) |
| `author` (1) `bio`, `theme` (2) `description` | minor | rarely surfaced |

> WHY: slugs/descriptions are the last-mile of each migration batch and were deferred behind body content.

---

## Fully localized — no action (verified)
- **Homepage** (`/es`,`/ja`) — nested cards/hero/starting-points all localized (enW=0). The model.
- **Blog** (`article`) — doc-level i18n, **166/166/166** en/es/ja. Hub + posts clean.
- **Guide** — 724 articles, >99.7% localized (4-doc tail in A6). City docs fully localized.
- **Wiki monuments** — name/summary/body fully es/ja (134 docs). (people/dynasty/deity: 0 published docs.)
- **Travel tips** (singles) — 31 docs, 1 ja tail. **4 tour/package category mastheads** — localized post-fix.
- **Legal page bodies** — render localized (i18n-driven); only slugs missing (A6).

---

## Suggested Phase 3 batching (for your approval)
1. **(C) code pass** — `localizedFieldStrict` on 3 archive queries (no translation). *Separate, fast.*
2. **(B) UI strings** — the ~11 key groups above into `messages/{es,ja}.json`.
3. **(A) batch 1 — FAQ** (24 entries + 7 categories) — highest visible impact, self-contained. **Show samples, STOP for review.**
4. **(A) batch 2 — editorial pages** (4 editorialPage incl. about/contact).
5. **(A) batch 3 — hotels+cruises ES short fields** (72 + 48 name/summary).
6. **(A) batch 4 — 25 tours** summary+body (largest volume; ja marked AI-draft-for-review).
7. **(A) batch 5 — archive essays** (hotels/cruises/travel-tips editorial docs).
8. **(A) batch 6 — localized slug tail** (routing/SEO).

**All Phase-3 writes:** raw `@sanity/client`, additive only (never overwrite a non-empty localized value), correct i18n keys, JA marked AI-drafted for human review.
