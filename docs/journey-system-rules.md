# Journey System — Build Rules
Read this before any journey-system page work. The references in docs/references/ are
the canonical spec. Match them; do not reinterpret, "improve", or substitute.

## 1. Fidelity
- Match the reference exactly: layout, spacing, type scale, colours, section order,
  hover states. Before closing a page, render it beside its reference at 1280 / 768 /
  375, list every discrepancy, and fix until they match. Don't declare done otherwise.
- Locked tokens: --paper:#FAF6EC --paper-warm:#F4EEDE --paper-deep:#ECE4D0
  --ink:#1A2230 --navy:#14243B --navy-mute:#5C6675 --gold:#B89456 --gold-dark:#8C6B38
  --black:#14110A --rule:rgba(22,32,46,.14) --rule-soft:rgba(22,32,46,.07)
- Locked fonts: Cormorant Garamond (display), Newsreader (body, 19px/1.72), DM Sans
  (UI). Breakpoints 980px and 620px. Never substitute Inter/system fonts.

## 2. The 2×2 bucket model
Buckets = {day tour, package} × {private/standard, group}:
Private Day Tours · Small Group Day Tours · Egypt Travel Packages · Small Group Travel
Packages. EVERY query (index, per-city/theme counts, navigator, related) scopes to its
bucket's (type, mode) pair. Exclude docs with unset type or mode. Verify every count
against the CMS before closing.

### 2.1 Day-by-day itinerary — GROUP packages ONLY (critical, do not get this wrong)
- **GROUP packages (`type=="package" && tourMode=="group"`) HAVE a structured day-by-day
  itinerary** (the `days[]` field / a per-day grid). It is expected/required for them.
- **PRIVATE packages (`type=="package" && tourMode=="private"`) DO NOT have a day-by-day
  itinerary.** They describe how the days go in PROSE in the body (region/theme `###`
  headings + a "The shape of the journey" block), with **no `days[]` grid**.
  Reference format: `/<slug>` of any imported private package, e.g. `marriott-mena-house-4-days-stay`.
- Day tours: single day, no `days[]`.
- Consequence: never populate `days[]` on a private package; never strip `days[]` from a
  group package. When auditing/cleaning, scope strictly by `tourMode`.
  (History: 76 private packages carried a legacy `days[]` from the WP migration; these were
  stripped/replaced with prose. Group packages were left untouched.)

## 3. Frame + content (never ship a blank frame)
- Required editorial fields (byline heading + note, section intros) are seeded so they
  never render blank.
- Every image slot renders at its locked aspect ratio: next/image (object-fit:cover)
  when a published image exists, else a tonal placeholder block at the SAME ratio.
  Nothing balloons or collapses.
- Optional/flagship sections (mood chooser, orientation) render only when the landing
  doc supplies them; omit cleanly when absent — no empty shells.

## 4. The decision apparatus (single tour/package pages) — REQUIRED, never inline
Every single page carries: a meta row (duration/group/effort/departs/from); a
two-column layout with a sticky decision rail (Shape-of-the-day card, Price-logic card
with the tour's real tiers, Why-book-with-us trust card from GLOBAL signals, inquiry
buttons); an Included/Not-included section; and a three-column related weave. The rail
must never collapse to a single column or be dumped inline as prose. Itinerary: a
structured timeline when timed stages exist, prose route otherwise — never fabricate a
timeline.

## 5. No invention
Never invent prices, tiers, facts, drive-times, or inclusions. Surface every data gap
in the session report instead of filling it.

## 6. Flagship vs standard landings
Flagship landings carry the rich optional sections; standard landings are hero + essay
+ tours + index only. The landing doc's authored content sets the richness — not code.

## 7. Locked image ratios (day-tour pages)
Category: editor's-pick lead 3:4, two side picks 4:5; navigator cells are text.
Subcategory: hero full-bleed (min-height clamp(520px,72vh,640px)); mood-chooser visuals
4:3; featured tour image 4:5; the four side tour images 1:1; orientation + index are
text. Single: feature image 16:7; rail/body/related are text.
(Package ratios will be defined by the package references when approved.)

## 8. i18n / RTL
All copy via i18n (en/es/ja); es/ja fall back to en until localized. RTL out of scope.

## 9. Session protocol
Read this doc → match the reference → visual-diff verify at 3 widths → report data gaps
→ typecheck → merge to main and push → leave a one-line memory of final state.
