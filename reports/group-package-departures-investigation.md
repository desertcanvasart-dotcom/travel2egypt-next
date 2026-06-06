# Investigation — structured departures for group packages

**Read-only. No schema/script/frontend changes.** Findings for the content-v2 upload decision.

## TL;DR
The departure **schema, GROQ projection, and frontend are ALL already built and working.**
The **only thing missing is the data** — the `.md` source files carry **zero** departure
information. **This is a data-only gap, not a schema or frontend gap.** Uploading the
group-package `.md` files as-is would leave `departures[]` **empty on every group package**,
even though the page is fully wired to render it.

(Scale is small: there are **only 3 group packages** total — Japan, UK & Europe, USA & Canada.)

---

## 1. Schema state — a `departures` field ALREADY exists
`src/sanity/schemas/tour.ts` (group "Scheduled departures" block, ~L438–512) has:

```
departures: array of {
  startDate:  date  (YYYY-MM-DD, REQUIRED)
  isPeak:     boolean            // applies peakUpliftPct to this date's price
  status:     string enum → guaranteed | few | available | soldout | onrequest   (optional)
  placesLeft: number             (optional)
}
```
Plus the supporting group-pricing fields in the same block: **`basePrice`** (per-person EUR),
**`peakUpliftPct`** (default 30), **`maxGroup`**.

- **Global, not field-level i18n** — correct: a date/status/places count isn't translated.
  (End date is *derived* from `durationDays`; price is *derived* from `basePrice` × peak uplift.)
- **It IS used today.** GROQ projects it (`queries.ts:367 "departures": departures[]{…}`), and
  the current `migration-staging` dataset has it **populated: all 3 group packages carry 8
  departures each** (maxGroup 12; basePrice unset → prices show "On inquiry").
  ⚠️ Those 8 dates were **seeded directly in Sanity, NOT from the `.md`** — so they will **not**
  carry into a fresh `content-v2` built from the `.md` corpus.

## 2. Source data state — the `.md` files carry NO departures
Inspected all **3 group-package files in en + es + ja** (`~/Downloads/All 3 langs/{en,es,ja}/tours/group packages/{Japan & East Asia, USA & Canada, UK & Europe}/`):

- **Frontmatter** is only: `slug, city, kind, locale, title, description`. **No `departures:`, no `dates:`, no date array.**
- **Body** has the full **day-by-day itinerary** ("Day 1 — Arrival…" … "Day 10 — Departure", with `**Meals:**`/`**Overnight:**` per day) and a "shape of the journey" table — but **no actual dates**. Departures appear only as prose intent:
  - *"This is a **fixed-date group departure**."*
  - Duration row: *"10 days / 9 nights — **fixed group departure**"*
  - Price row: *"From **€X** per person, depending on season, **departure date**, hotel grade…"* (literally `€X` — a placeholder).
- The only real date string anywhere is incidental prose — *"Grand Egyptian Museum… fully open since **1 November 2025**"* (a fact, not a departure).
- **ES and JA carry no dates either** (0 hits) — fully consistent with EN. No locale has departure data the others lack.

So: **no structured departures, no inline departure dates, no prices** in the source.

## 3. Frontend state — fully built, waiting for data
`src/components/tour-system/PackageView.tsx` (the group-package view) already:
- reads `tour.departures` → `buildDepartures()` (`src/components/tour-system/departures.ts`),
- renders a **full `<section className="departures" id="departures">`** table (date range, status, places, price), and
- renders a **"next departure"** element in the rail/fact area (`dep.next`, with a "see all N" link to `#departures`).

`departures.ts` already does exactly the right thing: **filters to future dates** (a row is "past"
once its *derived end date* passes), **sorts ascending**, picks the soonest as `next`, derives the
end date from `durationDays`, computes peak price, and renders status/placesLeft. Sold-out and past
are excluded from "next".

So the consuming UI **exists and is correct** — and it logically renders **both** as its own
`#departures` section below the editorial body **and** a "next departures" line in the existing
fact/rail box. No new component needed.

## 4. days[] vs departures — confirmed separate concerns
They are **two distinct fields** doing two distinct jobs, exactly as the brief expects:
- `days[]` = the **shape of one trip** (day-by-day itinerary; group packages must have it).
- `departures[]` = **when that trip runs** (array of date records).
Neither overlaps; no single field is doing both. ✔

## 5. The gap
**Data only.**

| Layer | Status |
|---|---|
| Schema (`departures` + basePrice/peakUpliftPct/maxGroup) | ✅ exists, well-designed |
| GROQ projection | ✅ exists |
| Frontend (section + next-departure + future-filter/sort) | ✅ exists, correct |
| **Source `.md` departure data** | ❌ **absent (0 of 3 docs, all locales)** |

So this is **not** schema-only, schema+data, or schema+data+frontend. It's **data-only**: build
nothing, *source the dates*. Uploading `.md` as-is ships **empty `departures[]`** on all group
packages (the page degrades gracefully — `hasFuture:false` — but shows no dates).

## 6. Recommended structure — use the EXISTING field as-is; add nothing
The existing field already matches (and exceeds) the proposed minimum, and is a **better fit for
this data model** than the draft in the brief:

| Brief draft | Existing field | Note |
|---|---|---|
| `date` | `startDate` (date, required) | same |
| `status: open\|limited\|sold-out\|cancelled` | `status: guaranteed\|few\|available\|soldout\|onrequest` | existing is richer; keep it |
| `capacity` | `placesLeft` | same intent |
| `priceVariant` | `isPeak` (+ `basePrice`×`peakUpliftPct`) | price is **derived**, not stored per row → simpler |
| `notes` (localizedString) | — (none) | **don't add** — source has nothing to populate it; would be empty on every doc |

**Recommendation: do not change the schema.** Adding `notes`/`priceVariant` would ship empty fields
on every document — exactly the mistake the brief warns against. The field the source *also* can't
populate even at the basics is the whole `departures[]` array itself (no dates exist).

## 6. Open questions (need answers before upload)
1. **Where do departure dates come from?** They are not in the `.md` corpus at all. Options:
   - **(a)** Upload group packages with **empty `departures[]`** and have the editorial team add
     dates in Studio (the field + UI already exist; only 3 docs to maintain). Lowest-effort, but
     group pages launch with no dates.
   - **(b)** Source a small **departures dataset** (CSV/sheet: slug → list of `{startDate, isPeak,
     status, placesLeft}`) and merge it at upload. Best if real dates exist somewhere.
   - **(c)** Block group-package upload until dates are sourced.
2. **The 8 departures already seeded per group package in `migration-staging`** — are those **real**
   (then I can export & re-apply them to content-v2, preserving the work) or **placeholder seed
   data** (then ignore)?
3. **`basePrice` is unset on all 3** → every departure renders "On inquiry". Intended for launch, or
   should base prices be sourced alongside dates?
4. **Is the group-package corpus really just these 3 files?** If more are coming, the data task
   scales with them; if it's only 3, the editorial team can populate departures in Studio in minutes.

**Nothing about the heavy `.md` upload needs to change for departures** — the body prose carries no
dates to "rot," so there's no rewrite risk from uploading now. The departures array is simply
populated separately (Studio or a small side-dataset), independent of the editorial body.
