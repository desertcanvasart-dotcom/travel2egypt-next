# Session-47 launch polish — owner checklist (2026-08-18)

Product of the three-axis launch audit (brand-facts / SEO-indexing / compliance).
Everything code-fixable was fixed in the accompanying PR; the items below need
an owner decision, a CMS edit, or counsel. Ordered by severity.

## A. Ship-blockers (owner wording / CMS edits)

1. ~~**Years-in-business contradiction — three numbers live at once.**~~
   ✅ **DONE 2026-08-18 (owner chose the 1993 canon; propagated ×3 locales,
   commit 889f9bc):** hero now reads "Egyptian operator since 2003" +
   "Since 1993"; concierge eyebrow "backed by 30 years on the ground";
   footer/trust strip "Egyptian-operated since 2003". Original finding kept below.
   The homepage hero pairs "Egyptian operator since 2003" with "30 years
   operating in Egypt" (adjacent, all 3 locales — `messages/*.json` keys
   `home.heroEyebrow` vs `home.heroMetaYears`); the concierge page says both
   "30 years of operator expertise" and "over twenty years of running trips"
   on one screen (`planYourTour` eyebrow vs key 500); journeys copy also says
   "twenty years". 2003 → 2026 is 23. The EN About meta already models the
   reconciling frame: *founder guiding since 1993 (30+ yrs personal), company
   registered 2003.* DECIDE the canonical framing, then I propagate to every
   string in one pass. Inventory of every occurrence: see the brand-facts
   audit in the session log; main sites = `messages/{en,es,ja}.json` keys 11-12,
   72, 80-81, 500; `src/components/TrustStrip.tsx:3` ("30+ years" badge);
   `src/lib/conciergePrompt.ts:50,158`; `journeys/travellingInStyleContent.ts:51`.

2. ~~**Privacy policy contradicts the cookie policy on analytics (CMS edit).**~~
   ✅ **DONE (owner-approved, applied 2026-08-18):** all three analytics
   claims removed from `legal-privacy-policy` ×3 locales via
   `scripts/s47-legal-a2-a3.ts` (guarded, idempotent; rollback in
   `backups/s47-legal-a2-a3-rollback-*.json`). Browser-verified ×3 locales.

3. ~~**`t2e_ccy` currency cookie is set without disclosure.**~~ ✅ **FULLY
   DONE 2026-08-18:** code half merged (middleware cookie removed,
   `/api/geo-currency` in-memory suggestion; cookie written only on an
   explicit pick). CMS half applied via the same script: dedicated
   "currency cookie: t2e_ccy" section ×3 locales, "Change your currency"
   choices bullet, clear/block-cookies mentions — plus consistency fixes the
   pass surfaced (JA "only one cookie" claims, JA consent-v1→v2, drifted ES
   block-cookies bullet, stale "second cookie" ordinals, future-proofed
   changes clause). Consent-banner body (`messages/*.json` `consent.body`)
   now names t2e_ccy too. Both docs' lastUpdated → 2026-08-18.

## B. Before DNS cutover (owner/counsel)

4. ~~**Name Sentry (and Cloudinary, if still used) as processors in the privacy
   policy**~~ ✅ **DONE 2026-09-07** (owner: Cloudinary NOT used — not named).
   Applied to production ×3 locales via `scripts/s47-legal-b4-sentry.ts`
   (guarded, idempotent; rollback `backups/s47-legal-b4-rollback-2026-09-07.json`):
   cookie policy — analytics bullet softened, new "Error monitoring: Sentry"
   section (h2 + 2¶), lost EN/ES "What a cookie is" definition restored;
   privacy policy — "Error monitoring." paragraph under Usage data naming
   Sentry as processor + outside-Egypt storage. Both lastUpdated 2026-09-07.
   Host-verified ×6 pages. `SENTRY_DSN` may now go live.
5. ~~**Fix `/contact-us` inside the privacy-policy body**~~ ✅ **DONE
   2026-08-19** (owner: "do what you can"): the rights-channel line now
   reads `…travel2egypt.org/contact` ×3 locales
   (`scripts/content-hygiene-2026-08-19.ts`; EN was a split-span variant,
   patched by span key). Verified rendered on all three privacy pages.
6. ~~**EU/UK Art. 27 representative + transfer basis**~~ ✅ **CLOSED
   2026-09-07 — counsel reviewed and confirmed the policy is acceptable as
   written** (owner relayed). No text change.
7. ~~**Imprint / 特定商取引法 page**~~ ✅ **CLOSED 2026-09-07 — owner decision:
   no dedicated page needed.** Operator identity/address stays where it is
   (cookie policy contact block + terms).
8. **Cutover-day header check (runbook):** the entire noindex lift hinges on
   the origin seeing `Host: travel2egypt.org`. On cutover day run
   `curl -sI https://travel2egypt.org/ | grep -i x-robots` (must be empty)
   and `curl -s https://travel2egypt.org/robots.txt | head -2` (must be
   `Allow: /`). If a proxy rewrites Host to `*.up.railway.app`, the site
   stays silently noindexed.

## C. Post-launch hygiene (non-blocking)

9. ~~**About-page meta description diverges by locale**~~ ✅ **CLOSED
   2026-09-07 — owner: fine as is** (EN keeps the ≈130-trips figure; ES/JA
   left without it). No change.
10. ~~**`siteSettings.defaultOgImage` is dead wiring**~~ ✅ **DONE 2026-08-18:**
    `buildMetadata`/`buildStaticMetadata` are now async and self-resolve
    `siteSettings.defaultOgImage` (React-cached, fetched only when the doc
    has no seo/hero image; failure falls through to `/og-default.png`). The
    CMS field is currently null, so behavior is unchanged until an editor
    uploads one — but the knob is real now.
11. ~~**WhatsApp number hardcoded 11×**~~ ✅ **DONE 2026-08-18:** all 10
    call sites (7 tour-system views, FloatingConcierge, ConciergeCTA,
    FaqPage) now import `WHATSAPP_LINK`/`whatsappUrl` from
    `src/lib/concierge/constants.ts` — the number lives in exactly one file.
12. **Footer has no public email** — ✅ the stale comment in
    `src/lib/concierge/constants.ts` (claimed the address shows in the
    footer) is fixed 2026-08-18. STILL OPEN (owner): should the footer
    carry `info@travel2egypt.org`, or is WhatsApp-primary intentional?
13. ~~**Structure the landing `faq` fields**~~ ✅ **DONE 2026-08-18** (the
    corpus had ZERO faq content and no live renderer, so no migration was
    needed): `tourLanding.faq`/`tourCategory.faq` are now arrays of the new
    `landingFaqItem` object (question ×3 locales + PT answer, mirroring
    `faqEntry`); one shared `LandingFaq` component renders the section AND
    emits `FAQPage` JSON-LD from the same items across all four landing
    views (SubcategoryView, PackageSubcategoryView, and the two inline
    wrappers). Dormant until an editor authors items; filled path
    live-verified on al-gouna (transient test item, since removed).
14. ~~**In-chat privacy-policy link**~~ ✅ **DONE 2026-08-18:** DataMenu
    now links `/privacy-policy` (localized Link, new tab) beneath the
    delete/export options; strings EN+ES (concierge locales).
15. ~~**Trust badges**~~ ✅ **RESOLVED 2026-08-19:** briefly dropped
    2026-08-18 (looked like a phantom accreditation), then owner confirmed a
    real Kayak relationship — restored as a LINKED partner mark pointing at
    Kayak's Hurghada guide (kayak.co.uk/Hurghada.34001.guide, new tab),
    mirroring the TripAdvisor linked-mark pattern. Strip: TripAdvisor /
    Kayak / JATA / IATA / ASTA / 30+ years.
