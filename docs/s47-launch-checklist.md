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

2. **Privacy policy contradicts the cookie policy on analytics (CMS edit).**
   The privacy policy claims "operate and analyse", a "Website analytics: up
   to 26 months" retention row, and "IT and analytics providers" — no
   analytics exist, and the cookie policy says so explicitly. Remove all
   three phrases from the `legal-privacy-policy` doc (×3 locales). The 26-month
   line is GA-template boilerplate.

3. ~~**`t2e_ccy` currency cookie is set without disclosure.**~~ ✅ **CODE HALF
   DONE (owner chose defer, 2026-08-18):** the middleware no longer persists
   the geo-derived cookie; the suggestion flows cookie-free via
   `/api/geo-currency` (no-store, in-memory apply), and `t2e_ccy` is written
   only on an explicit currency pick. REMAINING (CMS, one line): mention the
   switcher-set currency cookie in the cookie policy's list — it is now a
   genuinely "explicitly requested" preference cookie, but the policy's
   exhaustive list should still name it.

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
10. **`siteSettings.defaultOgImage` is dead wiring** — projected and accepted
    by `buildMetadata`, but no route passes it; every static page falls to
    `/og-default.png`. Either wire it through the layout or remove the field
    so editors aren't misled.
11. **WhatsApp number hardcoded 11×** (value consistent: `201158011600`) —
    consolidate onto `src/lib/concierge/constants.ts` on next refactor.
12. **Footer has no public email** — the comment in
    `src/lib/concierge/constants.ts:52` claims `info@travel2egypt.org` shows
    in the footer; it doesn't. Intentional?
13. **Structure the landing `faq` fields** — currently free-form Portable
    Text, so no `FAQPage` schema can be emitted for the commercial landings
    (this PR added BreadcrumbList + ItemList; FAQPage needs structured Q/A).
14. **In-chat privacy-policy link** — the concierge DataMenu offers
    delete/export but never links the policy; an in-chat link better satisfies
    GDPR Art. 13 timing.
15. **Trust badges** — `TrustStrip.tsx` doc comment mentions Kayak; no other
    accreditation list does. Align or drop.
