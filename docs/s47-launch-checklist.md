# Session-47 launch polish — owner checklist (2026-08-18)

Product of the three-axis launch audit (brand-facts / SEO-indexing / compliance).
Everything code-fixable was fixed in the accompanying PR; the items below need
an owner decision, a CMS edit, or counsel. Ordered by severity.

## A. Ship-blockers (owner wording / CMS edits)

1. **Years-in-business contradiction — three numbers live at once.**
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

4. **Name Sentry (and Cloudinary, if still used) as processors in the privacy
   policy** before setting `SENTRY_DSN` in production. Also soften the cookie
   policy's absolute "no traffic measurement of any kind" (Sentry ships
   `tracesSampleRate: 0.1` performance tracing when the DSN goes live).
5. **Fix `/contact-us` inside the privacy-policy body** (CMS) — the stated
   rights channel. A 301 redirect now covers it site-side (this PR), but the
   text should link `/contact` directly.
6. **EU/UK Art. 27 representative + transfer basis** — counsel: the policy's
   "consent by use" for the Egypt transfer doesn't meet Art. 49; SCC wording
   is hedged ("where required"). Both are hard requirements for an Egyptian
   controller serving EU customers.
7. **Imprint / 特定商取引法 page** — operator identity/address currently only
   inside the cookie policy + terms. Decide whether a dedicated page is
   needed for the Japanese (and German-marketing) exposure.
8. **Cutover-day header check (runbook):** the entire noindex lift hinges on
   the origin seeing `Host: travel2egypt.org`. On cutover day run
   `curl -sI https://travel2egypt.org/ | grep -i x-robots` (must be empty)
   and `curl -s https://travel2egypt.org/robots.txt | head -2` (must be
   `Allow: /`). If a proxy rewrites Host to `*.up.railway.app`, the site
   stays silently noindexed.

## C. Post-launch hygiene (non-blocking)

9. **About-page meta description diverges by locale** (`messages/*` key 819):
   EN has the 1993/2003 frame + a "≈130 customized trips a year" claim absent
   from ES/JA — verify the number, then align the three.
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
15. ~~**Trust badges**~~ ✅ **DROPPED 2026-08-18:** TrustStrip rendered an
    actual Kayak accreditation MARK (not just a comment) — Kayak is a
    metasearch engine, not an accreditation body, and the footer lists only
    JATA/IATA/ASTA. Mark + comment removed; strip now reads TripAdvisor /
    JATA / IATA / ASTA / 30+ years. Revert if there is a real Kayak
    relationship I don't know about.
