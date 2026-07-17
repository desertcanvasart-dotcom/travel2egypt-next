# Travel2Egypt — The Content Canon

**Binding methodology for all content, in every language, in every future version.**

This document prevails. When any plan, brief, contributor preference, tool
default, or "better idea" conflicts with this canon, the canon wins. The only
way around any rule in this document is a written amendment approved by the
founder, recorded in the Amendments log at the bottom. There are no verbal
exceptions, no one-off waivers, and no "just this page."

It sits above and alongside three existing doctrine documents, which remain in
force for their own layers:

| Layer | Document | Governs |
|---|---|---|
| **This canon** | `docs/content-canon.md` | Voice, tone, language architecture, content process, expansion |
| Design | `docs/journey-system-rules.md` | Tokens, fonts, layout fidelity, page frames |
| Concierge | `travel-to-egypt-agent-system-prompt-v4.x.md` (locked) | The AI concierge's conversational voice |
| Team | `docs/specs/team-operating-principles.md` | How humans mirror the voice after handoff |

---

## Part I — The Vision (what everything serves)

Extracted from the live corpus, not aspirational. Every rule below traces back
to one of these four commitments.

### 1. Honesty is the brand strategy, not a constraint on it

The site's defining move — on every surface — is to open by **correcting the
reader's expectations against reality**, then earning trust from that candor:

> *"Egypt's health and safety reputation runs significantly worse than the
> country's actual lived reality for most foreign visitors."* — Health & Safety

> *"Tipping in Egypt is not what tipping in most other countries is."* — Tipping

> *"Two real options in Esna itself."* — Esna accommodation (a two-hotel town,
> stated as a two-hotel town)

> *"Marsa Matruh runs … wet, and largely shuttered"* — a weather page that
> tells you the beach town closes in winter, because it does

We say the unflattering thing when it is true: a town with two hotels has two
hotels; a closed season is closed; January in Saint Catherine is *"honestly
cold."* The Spanish travel-tip titles carry the same DNA deliberately: *"lo que
de verdad hace falta," "el panorama real," "cómo funciona de verdad."*

**The law:** no content may oversell, pad, or soften reality to make a sale.
When accuracy and appeal conflict, accuracy wins — that IS the appeal.

### 2. We align expectations with reality

From the concierge philosophy, and it governs the whole site: *"We are not
designing trips. We are aligning expectations with reality. If expectations
are wrong, even the perfect itinerary will feel disappointing. If expectations
are right, even small imperfections will be forgiven."* Every page is an
expectation-setting instrument first and a marketing surface second.

### 3. The unhurried expert

The voice is a person who has been in Egyptian travel for decades and is not
in a rush to close a sale: warm, literary but disciplined, specific, never
breathless. Anti-filler is law: no "nestled," no "hidden gem," no "must-visit,"
no exclamation-mark enthusiasm, no filler transitions. Restraint is part of
the register: *"If you are unsure whether a reply is too long, it is too
long."* The same rule applies to page copy.

### 4. One family behind four names

Travel2Egypt is the main house of a family (AffordEgypt · Sawa · Sillage).
Every mention of a sister brand is **care, not referral**: the same house, the
same standards, the same people ultimately looking after the traveler. Nothing
on any surface may make a sister brand feel like "somewhere else we send you."

---

## Part II — Voice & Tone Laws

1. **Reality-first openings.** Ledes orient the reader against their likely
   misconception or tell them the one thing that actually defines the subject.
   Never open with generic scene-setting ("Egypt is a land of contrasts…").
2. **One identity per page.** Every page has a single distinctive claim it
   exists to deliver (a weather page's climate signature, a tour's shape, a
   town's honest position). Everything on the page serves that claim; content
   that belongs to another page's identity is removed, not kept "for SEO."
3. **Verified specifics over soft superlatives.** A concrete number beats an
   adjective. Superlatives ("the warmest," "the widest," "the only") are
   **forbidden unless verified against the full sibling set** — one document
   re-read is not verification. When unverifiable, either soften to "among
   the…" or replace with a self-contained number. (This rule has caught real
   errors three times; it is not theoretical.)
4. **Candid negatives are kept.** Closed seasons, small inventories, hard
   truths about heat, crowds, and prices stay in the copy, stated plainly and
   without apology.
5. **Anti-filler vocabulary ban** (all languages, translated equivalents
   included): *nestled, hidden gem, must-visit/must-see (as filler), breathtaking,
   bucket-list, vibrant tapestry, rich history* (as an empty phrase), *"look no
   further."* If a sentence survives with the phrase deleted, delete the phrase.
6. **No invention.** Facts, prices, hours, distances, and history come from the
   verified data layer or from sourced research — never from plausible-sounding
   generation. A page that needs a fact we don't have gets the fact procured or
   the claim removed. (Design corollary already in journey rules: never
   fabricate a timeline.)
7. **Prices and hours live in the manifest.** Verified commercial facts carry
   their verification stamp ("Checked <Month Year>") and are rendered from the
   single source of truth (`src/data/prices`), never hand-typed into prose.
8. **Overlap boundaries are strict.** Each page type has explicit no-go zones
   (e.g., climate pages carry zero religious/monastery content; weather pages
   don't review hotels; accommodation pages don't teach history). Boundaries
   are recorded per build and respected by every later edit.
9. **Register flexes by audience, never by author.** The concierge prompt's
   register table (measured for British/Nordic/Japanese; warmer for Spanish/
   Italian/Brazilian; depth-in-rotation for academics) applies to content
   localization too. The *voice* never changes; the *temperature* adapts.

---

## Part III — Language Architecture

The site is one corpus in three renderings — not three translations.

1. **English is the source of truth** for editorial content. ES and JA are
   **natural-prose reworkings in the same voice** — a native-feeling rendering
   of the same identity and facts, never a literal word-for-word translation
   and never a different opinion. (Established rule: EN bookends quote the
   dataset caption char-for-char; ES/JA rework it naturally.)
2. **The numeric-claim gate is absolute.** Every figure (temperature, km,
   price, count, date) in ES/JA must match EN exactly. A localization that
   drifts a number is a defect, full stop. All three locales were caught
   drifting once (Esna 60 km vs 55 km); the gate exists because it fires.
3. **Controlled tokens never translate.** Slugs' semantic keys, enum values
   (`comfort_level`, `routed_brand`, region values), JSON keys, and brand names
   render identically in every locale.
4. **Per-locale slugs are real words in that language** (`clima-en-santa-
   catalina`, not `weather-in-saint-catherine-es`), unique per locale, with
   collision handling (JA uses romaji; collisions get deterministic suffixed
   resolution). A slug change is never just a slug change: it ships with a 301
   from the old path in the same commit.
5. **Headings are a reused set.** Recurring section headings have one approved
   translation per locale (e.g. *The Shape of the Year / La forma del año /
   一年の気候の移ろい*; *What to Pack / Qué llevar en la maleta / 持ち物のヒント*).
   New headings require founder approval once, then join the set. Never
   re-translate an existing heading differently on a new page.
6. **Typography is locale-law.** JA: Noto Serif JP, **no italics**, °C only
   (no °F anywhere on the site), full-width punctuation (——、「」) used
   natively. EN: typographic (curly) apostrophes — straight quotes are
   normalized before publish. ES: proper accents everywhere, including in
   regex/tooling that touches ES text (`kilómetros` has bitten us).
7. **Currency renders per locale** from one stored value (EUR stored;
   converted at render to USD/JPY as configured) — never hand-localized.
8. **hreflang and canonicals are structural**, generated from `allSlugs` per
   locale (including the parent-city segment). Never hand-authored.

---

## Part IV — The Gates (the machinery no one can pass)

These are not guidelines; they are executable checks. Content that has not
passed its gates does not ship, no matter who wrote it or how urgent it is.

### Gate A — Locked copy and the verbatim pre-flight
1. All substantial editorial work follows the standing method:
   **Phase 1 read-only investigation** (current state, per-locale block map,
   debris list, overlap boundaries, hero check) → **founder-locked copy** (a
   .md file that physically exists — if the file never landed, STOP; never
   fabricate locked copy from memory) → **staging script** → **HOLD for diff
   approval** → publish → verify.
2. The staging script runs a **verbatim pre-flight**: every string it is about
   to write must byte-match the locked copy file (apostrophe-normalized).
   Mismatch = abort. This gate is what makes "no one can pass" literal — the
   script will not write drifted copy.
3. When copy and an existing dataset caption disagree, **fix the dataset to
   match the reviewed copy** (Option A), never silently the reverse; report
   the exact delta before either edit.

### Gate B — Verification is live, not claimed
4. **Live testing arbitrates.** A change is done when the real rendered output
   is observed — browser-verified in all three locales, desktop and mobile —
   not when the write API returned 200. Screenshots or SSR greps are the
   record.
5. **Verify the system of record.** Merge/publish/deploy state is read from
   git, Sanity, and the live render — never from conversation claims or memory.
   ("Verify shipped ≠ verify live" has caught real gaps twice.)
6. **Check every field, not just the body.** Wrong-city text and stale figures
   hide in `summary` (the auto-excerpt), `seo.metaDescription`, and
   `heroImage.alt` — every content fix sweeps all fields and ends with a
   rendered screenshot.

### Gate C — Images
7. **View every hero candidate.** No image is assigned from its filename or
   alt text. The image is opened and looked at.
8. **The claims test:** the hero must visibly earn the page's own text claims
   (a "turquoise water" standfirst requires visibly turquoise water; the one
   snow page requires visible snow). A wrong-subject image is worse than a
   deferred one — defer and log to the sourcing list instead of forcing.
9. **The alt/caption invariant:** every published, visible hero carries alt
   AND caption in all applicable locales. Any image swap ends with alt/caption
   regeneration in the same operation. The invariant is censused, and the
   census checks **both** storage shapes (localized arrays and flat
   single-language fields).
10. Minimum resolution ≥3000px on the long edge for new heroes (≥2336px
    absolute floor); no third-party watermarks, ever (licensing exposure).

### Gate D — Data & routing
11. **Redirect discipline:** every slug change, page retirement, or dedup
    ships its 301s in the same change; the regenerated map must pass the
    redirect test suite, contain **zero cycles**, and every `to_path` must be
    live-validated (redirect targets go stale; validate, don't trust).
12. **Dedup recipe:** keeper chosen on evidence (authorship, kind-pattern,
    inbound refs) → inbound refs repointed (leaf `_ref` rewrite, `_key`s
    preserved) → superseded doc hidden + flagged (`superseded-duplicate` +
    `supersededBy`) → redirects verified → rollback JSON written **before**
    any write.
13. **Every production content operation writes its rollback first** and lands
    its script + findings as a PR audit trail, even when the content change
    is already live.

### Gate E — The concierge (voice at runtime)
14. The concierge prompt is **locked**; edits require founder sign-off and
    must pass the full eval change-gate (replay personas + extraction
    fixtures + the routing battery) before merge. Baseline vs candidate; a
    flipped scenario is a regression to explain, not a test to delete.
15. Detection markers are **calibrated against real transcripts only** — never
    guessed. Observed phrasing is frozen into the marker corpus test (both
    positive and negative examples) so CI and reality cannot drift apart.

---

## Part V — Adding a New Language (the expansion checklist)

Drawn from what ES and JA actually required. A new locale (e.g. FR, DE, IT)
is **not launched partially**: it ships every item below or it does not ship.
Order matters.

**Phase 0 — Decision & register**
1. Founder defines the locale's register per the concierge table (e.g. French
   academic: depth-in-rotation; German: measured, direct).
2. Native-speaker reviewer identified for the acceptance pass (machine-drafted
   copy is permitted as a working method — the JA-legal pattern — but a human
   with native command reviews before the locale is called done).

**Phase 1 — Structural plumbing (code)**
3. Locale added to `i18n/routing` (+ localized pathnames for named routes like
   `/journeys/*` leaves), fonts chosen and loaded (the JA precedent: script
   support may dictate a different typeface and rules like no-italics),
   locale-specific typography rules documented in Part III.
4. UI strings translated (the full `messages/` namespace — ES/JA needed ~92
   strings; missing keys are build failures, not fallbacks).
5. Currency/units decision (which display currency; date formats).
6. hreflang/canonical/sitemap generation confirmed to emit the new locale
   automatically; redirect-map gains the locale's rows as slugs publish.
   **Redirect sources with non-ASCII characters must be percent-encoded at
   the config layer** (the JA lesson: raw-unicode sources silently never fire).

**Phase 2 — Corpus rendering (content)**
7. Every doc type gets its localized array entry (`body`, `title`, `summary`,
   `seo`, `heroImage.alt/caption`, slugs) — worked corpus-wide, tracked by
   census queries, not by feel.
8. Slugs: real words in the language, collision-resolved; publish slugs +
   redirects together; regenerate + test.
9. Headings: build the locale's approved heading set (translate the recurring
   set once, founder-approved, then reuse verbatim).
10. Numeric-claim gate run corpus-wide (every figure matches EN).
11. Dataset editorial strings (climate descriptors/captions, price-manifest
    chrome, season labels) rendered in the locale; render gates flipped from
    per-locale fallback to full only when the locale's strings exist.
12. Legal pages professionally reviewed (lawyer, not just translator) before
    the locale's consent/cookie/privacy surfaces go live — the JA precedent.

**Phase 3 — Concierge extension**
13. The agent renders the language at runtime, but detection needs
    calibration: run real conversations to wrap in the new language, then
    add **observed** markers + freeze them in the corpus test (the ES
    precedent — initial guesses were wrong; calibration found the real
    phrasing).
14. Extraction display-language directive extended (visitor-shown fields in
    the traveler's language; controlled tokens untouched).
15. The routing battery re-run with new-language scenarios (the close
    discipline is "identical in English and Spanish" — extend that sentence
    and verify it holds).

**Phase 4 — Acceptance**
16. Native-speaker pass on a defined sample (every template type at minimum).
17. Full-locale browser verification: key routes, both viewports; Lighthouse;
    the census queries (alt invariant, numeric gate) re-run scoped to the
    locale.
18. Founder sign-off recorded. Only then is the locale announced.

---

## Part VI — Adding New Content to the Existing Languages

For any new page, page type, or content batch:

1. **Identity first.** Before any copy: what is this page's one distinctive
   claim, and which existing pages' boundaries does it touch? Write the
   overlap boundary down (what this page will NOT cover).
2. **Skeleton reuse.** New pages of an existing type use the type's locked
   skeleton (weather: the 12-block/4-section shape; tours: the decision
   apparatus; price pages: the manifest). New page types get a skeleton
   designed once, approved, then locked for all siblings.
3. **All three locales ship together.** A page is not published EN-only with
   locales "to follow" — the ES/JA reworkings are part of the definition of
   done. (Fallback rendering exists for legacy gaps, not for new work.)
4. **The full field set ships together**: body, title, summary (or cleared),
   `seo.metaDescription`, slugs ×3, hero (viewed + claims-tested) with
   alt/caption ×3 — plus internal links resolved to live targets (validated
   200, no raw absolute domain links, ever).
5. **Gates A–D apply in full** — locked copy, verbatim pre-flight, hold for
   approval, publish, browser-verify ×3 locales ×2 viewports, PR audit trail.
6. **The page joins the machine**: sitemap (automatic), internal-link weave
   (mention-linker run is idempotent), price mesh if commercial, redirect
   rows if it replaces anything.
7. **Nothing ships half-done silently.** If any part is deferred (a hero, a
   locale string), the deferral is logged to the tracking ledger with an owner
   — silent gaps are treated as defects.

---

## Part VII — Enforcement & Precedence

1. **Precedence order** when instructions conflict:
   founder's recorded decision → this canon → layer documents (design rules,
   concierge prompt, team principles) → per-project specs → anyone's
   preference. A newer verbal instruction that contradicts the canon triggers
   a question, not silent compliance; if confirmed, it becomes a written
   amendment.
2. **The gates are executable.** Where a rule can be a script, it is one
   (verbatim pre-flight, numeric gate, marker corpus, redirect tests, alt
   census, eval harness). New rules should be added as scripts, not prose,
   whenever possible — prose persuades, scripts prevent.
3. **Every content operation leaves a trail**: rollback file + script + PR.
   An operation that can't be rolled back doesn't run.
4. **Founder verification is the final gate** for anything that speaks in the
   brand's voice at a decision point (routing, pricing, legal, brand facts).
   The machine proposes; the founder disposes.
5. **Amendments**: append-only log below; each entry has a date, the rule
   changed, the reason, and the founder's approval.

### Amendments log
- *2026-07-17 — v1.0 of this canon adopted. Extracted from the live corpus,
  the concierge prompt v4.x, journey-system rules, and eleven weeks of
  recorded build decisions.*
