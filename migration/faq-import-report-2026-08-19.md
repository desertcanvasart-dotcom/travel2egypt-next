# FAQ migration import — owner review sheet (2026-08-19)

Source: owner-supplied audit of legacy `/egypt-travel-faqs/` (71 rewritten Q&As).
Imported as **DRAFTS only** — the live /faq page is unchanged (still its 24
published entries) until you publish from the Studio.

**What was created:** 55 draft `faqEntry` docs + 5 draft `faqCategory` docs
(Getting Around, Museums, Ancient Sites, Red Sea & Outdoors, Food, Markets &
Living Culture — ranks 8–12). Wave-1 questions went into your existing four
categories. Full ID list: `migration/faq-import-created-2026-08-19.json`.

## Publish order (matters)

1. Publish the **5 new categories first** — entries pointing at them carry weak
   references until the category exists published.
2. Then publish entries in any order. The /faq page and its FAQPage rich-result
   markup pick them up automatically.
3. EN-only, matching the existing 24 entries. ES/JA reworkings remain on the
   localization backlog for the whole /faq corpus.
4. Internal links: none embedded (matches existing entries). Run the
   mention-linker weave after publishing; per-question link hints below are
   preserved in the ledger JSON.

## Publish status (2026-08-19)

Owner instructed: publish categories + safe drafts. DONE — all 5 categories
and the 46 safe entries are live (70 published Q&As on /faq, FAQPage schema
verified at 70). ONLY the 9 VERIFY drafts below remain unpublished.

## ⚠ Fact-check, then publish (9 drafts still held)

(Two of these — drone rules, alcohol rules — were missing from this report's
first version due to a ledger gap on a partial re-run; list is now complete.)

- **What are the rules on flying a drone in Egypt?** (`faq-entry-what-are-the-rules-on-flying-a-drone-in-egypt`)
  - VERIFY current customs procedure
- **What are the rules around alcohol in Egypt?** (`faq-entry-what-are-the-rules-around-alcohol-in-egypt`)
  - CORRECTION — legacy answer had the age missing entirely
- **Should I visit the Grand Egyptian Museum?** (`faq-entry-should-i-visit-the-grand-egyptian-museum`)
  - NEW — the legacy page predates the opening and does not mention GEM anywhere. This is now the most important museum question on the site and it is entirely absent.
- **What's at the Egyptian Museum in Tahrir Square?** (`faq-entry-whats-at-the-egyptian-museum-in-tahrir-square`)
  - CORRECTION — the legacy answer credits Tahrir with both the royal mummies and the Tutankhamun treasures. Neither has been true since 2021 and 2025 respectively.
- **Where are the royal mummies?** (`faq-entry-where-are-the-royal-mummies`)
  - NEW
- **Is there wreck diving in the Red Sea?** (`faq-entry-is-there-wreck-diving-in-the-red-sea`)
  - CORRECTION — the legacy page renders this as "This telegram wreck," which appears twice. It is the SS Thistlegorm.
- **Can I visit St Catherine's Monastery?** (`faq-entry-can-i-visit-st-catherines-monastery`)
  - VERIFY opening days before publishing
- **How do I get to the Bahariya Oasis and the White Desert?** (`faq-entry-how-do-i-get-to-the-bahariya-oasis-and-the-white-desert`)
  - CORRECTION — legacy answer had the drive time stripped and linked to a Lake Nasser cruise page
- **What are the best souvenirs from Egypt?** (`faq-entry-what-are-the-best-souvenirs-from-egypt`)
  - NEW ANSWER — the legacy page has this question with **no answer at all** beneath it. It has been sitting empty on a live page.

## Skipped as overlaps (16) — live answer kept

These already exist as owner-approved published entries. Where the migration
answer looks richer, upgrading is your call — the rewritten text is in
`migration/faq-migration-source-2026-08-19.json` under the listed key:

- When is the best time to visit Egypt?  → live `faq-entry-when-is-the-best-time-to-visit-egypt`
  - migration note: Rewritten — legacy version had all temperature figures missing
- Do I need a visa to travel to Egypt?  → live `faq-entry-do-i-need-a-visa-for-egypt`
  - migration note: VERIFY — eligibility lists and fees change; consider a "last checked" date stamp on this one
- How much should I budget per day?  → live `faq-entry-how-much-should-i-budget-per-day`
  - migration note: REWRITE REQUIRED — legacy figures were stripped in extraction, and pre-2024 EGP figures would be misleading anyway
- What currency is used in Egypt?  → live `faq-entry-what-currency-does-egypt-use`
  - migration note: Rewritten — add a note that the rate has moved substantially since the March 2024 float
- Can I use credit cards throughout Egypt?  → live `faq-entry-are-credit-cards-accepted-everywhere`
  - migration note: migrate-as-is
- How does tipping work in Egypt?  → live `faq-entry-how-does-tipping-work-in-egypt`
  - migration note: NEW — the legacy page had no tipping question at all, which is a significant gap for a booking site
- Can I get a local SIM card easily?  → live `faq-entry-can-i-get-a-sim-card-in-egypt`
  - migration note: VERIFY registration requirements
- What time zone is Egypt in?  → live `faq-entry-what-time-zone-is-egypt`
  - migration note: CORRECTION — the legacy answer states Egypt has no daylight saving adjustment. That has been wrong since April 2023.
- Is it safe to travel to Egypt right now?  → live `faq-entry-is-egypt-safe-to-travel-right-now`
  - migration note: VERIFY — consider making this one dynamic, or dated. A hardcoded safety claim is the single riskiest sentence on a travel site.
- What vaccinations do I need for Egypt?  → live `faq-entry-what-vaccinations-do-i-need-for-egypt`
  - migration note: Merged — the legacy page asked this twice with slightly different answers
- Can I drink the tap water in Egypt?  → live `faq-entry-can-i-drink-the-tap-water-in-egypt`
  - migration note: Rewritten — legacy answer opened by saying the water "should be safe to drink" and then told readers not to drink it
- How do I avoid tourist scams in Egypt?  → live `faq-entry-how-do-i-avoid-tourist-scams`
  - migration note: migrate-as-is
- Are there restrictions on photography?  → live `faq-entry-are-there-restrictions-on-photography`
  - migration note: Rewritten — legacy answer had no internal link at all
- What's the dress code for mosques and religious sites?  → live `faq-entry-whats-the-dress-code`
  - migration note: Merged from two near-identical legacy entries
- Is English widely spoken in Egypt?  → live `faq-entry-how-widely-is-english-spoken`
  - migration note: migrate-as-is
- What Arabic phrases are worth knowing?  → live `faq-entry-what-are-some-useful-arabic-phrases`
  - migration note: migrate-as-is

## Also in the source doc, not actioned here

- Section 3 lists 42 legacy entries deliberately dropped (dup/thin/unsound).
- 'Theme demo content leaking on the live page' — the LEGACY WP page ships a
  demo nav + lorem-ipsum footer with a fake NY address. Worth checking before
  the old site is shut down (legacy-site concern, not this repo).
