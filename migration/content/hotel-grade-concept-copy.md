# Hotel Grade Concept — page copy

> Polished editorial copy for the Hotel Grade Concept page, prepared ahead of 
> session 34 build. To be imported into the `staticPage` / `editorialContent` 
> Sanity entity at build time.

## Metadata

- **Intended URL**: `/hotel-grade-concept` (preserve old WP slug for SEO equity)
- **Type**: Hybrid editorial + dynamic (philosophy text below is editorial; tier 
  columns auto-generate from `hotel` + `nileCruise` entities with `category` field)
- **Build session**: Session 34 (waiting for ~60% hotel categorization completion)
- **Locale strategy**: EN-only at first ship; ES + JA deferred to post-launch 
  editorial pass (consistent with sessions 30/31/32/33)
- **Status**: Draft — 4 operator verification items pending (see TODOs below)

---

## Hero section

**Heading:**

Our Hotel Grade Concept

**Subhead:**

Three clear levels of 5-star stays across Egypt — S (Standard), D (Deluxe), 
and L (Luxury). Hand-picked for service and consistency.

**CTAs:**

`[Plan with an Egyptologist]` `[See the Shortlist]`

> **Removed from original**: "Licensed guides • Private AC vehicle • Transparent 
> pricing" — those are tour service signals, not hotel-grade signals. They 
> belong on tour pages or the homepage, not here.

---

## Section: How the grades work

Not every 5-star is the same. International star ratings cover wide ground — a 
5-star in Cairo may sit beside another 5-star with twice the rate and triple 
the polish. Travellers shouldn't have to parse that themselves.

We've grouped our 5-star inventory into three tiers, based on rooms we've 
actually stayed in, kitchens we've actually eaten in, and front-desk teams 
we've actually dealt with at 11pm when something needed solving.

**S — Standard Five-Star.** Classic international comfort. Reliable rooms, 
good service, mainstream brands. Best value within the 5-star tier.

**D — Deluxe Five-Star.** Refined style and upgraded amenities. Better rooms, 
dining, and service. The right step up for travellers who want a little more 
polish.

**L — Luxury Five-Star.** Top-tier properties with exceptional service and 
design. Flagship international brands, Egypt's iconic addresses, and a few 
well-kept secrets.

---

## Section: Why this matters

Egypt's hotel landscape changes faster than star ratings keep up with. New 
brands open, old ones change hands, service drifts. Our grades reflect what 
the property is actually like *this season*, not what it was rated five years 
ago.

Every hotel on our shortlist has been visited, tested, and re-tested. We 
update categorization as service evolves, and we drop properties when they 
don't hold the line.

---

## Mid-page ribbon

> Renders as the orange persuasion band between intro and tier columns.

Not sure which tier fits? Tell us your comfort level and pace — we'll match 
you to the right hotel in every city, and lock in our negotiated rates.

**Button:** `Request a Shortlist`

---

## Tier columns

> Auto-generated from Sanity at build time. NOT manually maintained.
> 
> GROQ query per tier (S/D/L) and per entity type (hotel + nileCruise):
> 
> ```groq
> *[_type == "hotel" && category == "standard"] 
>   | order(city->name asc, name asc) {
>     name, slug, city->{name, slug}
>   }
> ```
> 
> Render as three columns: S | D | L, with hotels grouped by city within each.
> Cruises follow same pattern in a "Nile Cruises" sub-section per tier.

---

## Bottom CTA section

**Heading:**

Ready to start building your trip?

**Body:**

Tell us how you like to travel — pace, style, budget — and we'll match you to 
the right hotels in every city. Itinerary first, hotels chosen around it.

**Buttons:**

`[Start Planning Your Journey]` `[Get Expert Advice]`

> **Changed from original**: "Ready to Experience Egypt in Luxury?" assumed 
> everyone wants L tier; new heading is neutral and tier-agnostic.

---

## Operator verification TODOs (resolve at session 34)

These items in the polished copy assert specific claims about how Travel2Egypt 
operates. Verify before publish — soften or rephrase if any are inaccurate.

### TODO-1: "Rooms we've actually stayed in, kitchens we've actually eaten in, and front-desk teams we've actually dealt with at 11pm when something needed solving"

This is the most distinctive line in the philosophy section — it earns the 
"we know hotels by experience" claim with specificity.

- **If accurate**: Keep as-is. Strong differentiator.
- **If you rely more on supplier relationships + occasional inspections**: 
  soften to "rooms we've inspected, kitchens we've tested, teams we've worked 
  with closely."
- **If the truth is mixed (some hands-on, some sourced)**: split the difference 
  — "rooms we've inspected, teams we've worked alongside" without the 
  11pm-specifics.

### TODO-2: "Lock in our negotiated rates" (in the mid-page ribbon)

- **If you have contract rates with hotels**: Keep as-is.
- **If pricing is more case-by-case / spot-rate**: change to "secure the best 
  available rate" or similar.

### TODO-3: "We drop properties when they don't hold the line" (Why this matters section)

- **If you've actually dropped properties from your inventory due to service 
  decline**: Keep as-is. Confident, credible.
- **If you've never actually dropped a property**: soften to "we re-categorize 
  properties as service evolves" — true without making a claim you can't back.

### TODO-4: "Three levels of 5-star stays" framing

The hero/philosophy positions all three tiers as variants of 5-star. Verify:

- The `hotel.category` enum in Sanity schema (session 22) — does it include only 
  standard/deluxe/luxury, or also boutique/budget/etc.?
- Your actual hotel inventory — are all hotels currently mapped to S/D/L all 
  genuinely 5-star, or are there 4-star boutiques in oases that don't fit?

**If inventory includes hotels outside 5-star** (e.g., 4-star Siwa boutique, 
Bedouin Castle in Bahariya, ecolodges): the "all 5-star" framing breaks. 
Options:
- Reframe as "Three levels of premium stays" (looser)
- Add a 4th tier "B — Boutique / Character" for the non-5-star inventory
- Keep "5-star" framing and exclude non-5-star hotels from this page entirely 
  (they show up elsewhere on the site)

---

## Notes for session 34 build

When this page is actually built:

1. **Editorial vs dynamic split**: philosophy sections (Hero, How the grades 
   work, Why this matters, mid-ribbon, bottom CTA) → Sanity editorial doc, 
   operator-editable via Studio. Tier columns → GROQ query, auto-generated.

2. **Locale**: ship EN. ES + JA via translation pass alongside other deferred 
   translation work (sessions 30, 31, 32, 33).

3. **Empty/sparse state**: page should render gracefully if a tier has only 
   a few hotels (e.g., L tier might initially have 5 hotels while S has 30). 
   Don't show empty columns; show "Coming soon — more L-tier additions" if 
   genuinely empty.

4. **Cruise inclusion in tier columns**: original WP page mixed hotels + 
   cruises in tier columns (e.g., S column had hotels by city, then "Nile 
   Cruises" sub-section, then "Lake Nasser Cruises"). Replicate this pattern 
   — operator's `nileCruise` entity also has a `category` field (session 22), 
   so same GROQ pattern applies.

5. **Hotel slugs linking**: each hotel name in the tier columns should link to 
   the hotel detail page (`/hotels/[slug]`). City names link to city travel 
   guide (`/[city-slug]-travel-guide` per existing pattern).

6. **"Hotels:" / "Nile Cruises:" labels**: original WP page uses bold labels 
   before each city's hotel list. Preserve the visual rhythm — but may not 
   need the literal "Hotels:" text since context is clear from the city 
   heading.

7. **Mobile considerations**: three-column layout collapses to single column 
   on mobile. Each tier becomes a vertical section; user scrolls through 
   S → D → L. Consider an anchor nav or tab switcher for faster navigation.

---

*Polished copy ready. Build pending operator decision on TODOs above + 
session 34 trigger (suggested: when hotel categorization reaches ~60% to 
ensure the page renders substantively, not sparsely).*
