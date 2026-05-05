# Session 8 Handoff — tours/hotels/cruises cohort

## Pre-conditions
- Staging dataset is at zero orphans
- 12 deferred tour-or-package docs ready for Session 8 migration (8 from earlier sessions + 4 from 8r-2b decisions)

## Cohort scope
The full tour-or-package cohort. Source: WP pages with the appropriate template (verify via classifier — likely `template: tour` or `template: package`).

### Confirmed-as-tour additions from 8r-2b (4 docs)
These were classified as guideArticle in the original Phase 4 import but reclassified as tour-or-package in 8r-2b's editorial decisions:

| WP slug | Notes |
|---|---|
| `ramasside-tours` | Multi-tour series |
| `snorkeling-adventure-on-the-nefertari-submarine` | Specific product (Hurghada or Sharm) |
| `a-9-day-egypt-tour-of-culture-and-history` | Generic itinerary, multi-city |
| `10-day-egypt-travel-journey-through-history` | Generic itinerary, multi-city |

Add these 4 to whatever scope file Session 8 uses for cohort definition.

### Original 8 deferred tour docs from earlier sessions
Reference earlier session-handoff documents for the original 8.

## Pre-flight gate A — WP-admin Elementor whitelist
Tour pages in WP source use Elementor templates with embedded shortcodes that need to be whitelisted in the import script's HTML→PortableText transformer. Without this whitelist, tours will lose their Elementor-rendered content (gallery, pricing tiers, itinerary structure).

Sub-phase 8.0 must:
1. Inspect Elementor shortcodes used by tour pages
2. Add appropriate `transformerWhitelist` entries to the WP-import config
3. Run a sample tour through the whitelist before full migration

## Risks
- Tours often have nested PortableText structures that mappers handle differently than guides
- Pricing data may need a separate cohort if tours embed price tiers in body text vs structured fields
- Some tours bind to single cities; some bind to multi-city itineraries — schema must handle both

## Wall-clock estimate
8-15 hours, depending on Elementor complexity.
