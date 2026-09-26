# Task 20: the two tipping pages (comparison and recommendation)

Status: **needs decision**. Nothing changed. Written 2026-09-26.

| | `/travel-tips/tipping-in-egypt` | `/resources/tipping-honestly` |
|---|---|---|
| Document | `travelTip` `wp-page-60933` | `fieldGuide` `fieldGuide-tipping-honestly` (seeded by `scripts/seed-field-guide-tipping.ts`, 2026-06-17) |
| Title / H1 | "Tipping in Egypt: How Bakshish Actually Works" | "Tipping, Honestly" (Field Guide No. 03) |
| Meta | summary: "How tipping works in Egypt — the bakshish economy, restaurant and hotel norms, tour-guide and driver rates, and when not to tip." | no SEO fields; the page falls back to the standfirst: "Egypt runs on small notes." `<title>` has no "Egypt" in it |
| Languages | EN, ES, JA (localized title, slug, body) | **EN only.** `/es/` and `/ja/resources/tipping-honestly` return 200 with the English text, self-canonical, `lang="es"`/`"ja"`, and hreflang alternates advertising them as Spanish and Japanese |
| Form | Long essay, ~2,200 words, 8 H2 sections | Intro, 5 sections (2 are tables of 7 and 5 rows), operator notes, closing; ~1,100 words |
| Links to the other page | no | no |
| Spelling | British ("travellers") | US ("travelers") in intro, notes and closing; the canon requires British |

## Coverage

Both cover: why tipping matters in Egypt's wage economy, carrying small notes, porters,
housekeeping, taxis, restaurants, cafés, bathroom attendants, guides, drivers, Nile cruise crew,
"special access" at sites, uninvited helpers, and how to decline.

Only the travel tip: the word's origin, the service charge vs tip distinction, the ahwa, concierge,
hotel bars and pools, all-inclusive Red Sea resorts (dive guides, spa), Uber/Careem, shared
transport (no tip), parking attendants, shoe-minders at mosques, dahabiya crew, Egyptologist vs
standard guide, a guide-and-driver-in-one rate, and a note that EGP figures drift with the currency.

Only the resource: the "small notes as you go / consolidated tip at the end" framework, one
envelope per party at the end of a trip, cabin attendant tipped separately from the crew pool,
photos with people who pose (camel handlers, performers), don't tip in foreign currency (except
end-of-trip guide tips), change a little money before arrival, and keep tip money separate.

## Figures that differ

Every figure on both pages is a price and needs a `[VERIFY]` pass before either page is edited;
the travel tip itself warns its EGP amounts drift. Where the two pages disagree today:

| Item | Travel tip | Resource | |
|---|---|---|---|
| Hotel porter | 50–100 EGP **per bag** (US$1–2) | **20–50 EGP** per bag | differs |
| Housekeeping | 50–100 EGP per day, **daily, not a lump sum** (staff rotate) | 50–100 EGP per night, **on the last day**, or daily if staff rotate | same amount, opposite default |
| Restaurant | 10–15%; the service charge **goes to the establishment and rarely reaches the waiters**; add 5–10% cash | 10%; the service charge **"is real and goes to staff"**; 5–10% extra at better places | **contradiction** on the service charge |
| Street taxi | round up to the next 5–10 EGP; 10% on long trips | round up; +20–50 EGP if they helped with luggage | different advice |
| Café / street food | round up or 10–25 EGP; ahwa 10–25 EGP per round | "a few coins" | differs |
| Bathroom attendant | 5–10 EGP | 5–10 EGP | same |
| Site guard, special access | 25–50 EGP for pointing something out; **50–100 EGP minimum** to open a closed area | table: **20–50 EGP**; the resource's own "grey areas" text: **50–100 EGP** | differs, and the resource contradicts itself |
| Uninvited helper | decline; no figure | 20–50 EGP if you let them talk for several minutes | only one gives a figure |
| Day-tour guide | group tour US$10–20 **per person** per day; private guide US$20–40 per day | US$20–30 **per party** per day | differs (per person vs per party) |
| Egyptologist, multi-day | US$30–50 per day on top of the fee | US$30–60 per day **per party** | differs |
| Driver, multi-day | US$5–10 per day (250–500 EGP); US$15–25 if guide and driver are one person | **US$15–25 per day per party** | differs by 2–3x |
| Nile cruise crew (3–4 nights) | US$5–10 per passenger **per day** into a pool **that includes the cabin stewards** | US$30–50 per traveller for the cruise, **plus US$20–30 for the cabin attendant separately, not in the pool** | contradiction on the cabin steward |
| Dahabiya crew | US$5 per passenger per day | — | |
| Exchange rate implied | ~50 EGP to US$1 throughout | none stated ("current Egyptian pounds", undated) | `[VERIFY]` |

A reader who opens both pages gets different numbers for porters, drivers, guides, cruise crew
and site guards, and opposite answers on who gets the restaurant service charge. That is the real
problem, more than the keyword overlap.

## Recommendation

**Keep both, with distinct roles (the brief's default), after reconciling the figures.**

- `/travel-tips/tipping-in-egypt` stays canonical for "tipping in egypt" / "baksheesh". It is
  longer, localized in ES and JA, and already the canon's own example of the house voice
  (`docs/content-canon.md` §1 quotes its first line).
- `/resources/tipping-honestly` becomes the **quick reference**: the two tables and the
  framework paragraph, with the figures taken from the travel tip once they are verified (one
  source of numbers, not two). Proposed target phrase: **"how much to tip in Egypt"**, with a
  title such as "How Much to Tip in Egypt: The Quick Reference" (the series title "Tipping,
  Honestly" can stay as the display H1 with the phrase in `<title>` and meta). Add the missing SEO
  fields.
- Each links to the other: a line near the top of the travel tip ("the amounts on one page:
  Tipping, Honestly") and a line under the resource's intro ("why it works this way: Tipping in
  Egypt").
- Fix the resource's US spellings when it's touched.
- Separate locale issue: the resource is EN-only but serves English at `/es/` and `/ja/` URLs
  with self-canonicals and hreflang. Either translate it or stop advertising ES/JA alternates for
  EN-only field guides (probably true of the other field guides too; I only checked this one).

**Merge instead** (fold the resource's tables into the travel tip and 301 the resource to it)
only if you'd rather not maintain two sets of prices. The cost: Field Guide No. 03 disappears
from the `/resources` series and its slot needs filling.

## The footer question

`src/components/Footer.tsx` lists four field guides (01, 02, 04, 05) and skips No. 03;
`src/app/(site)/[locale]/resources/page.tsx` lists all five. The `resourcesTipping` label exists in
`messages/en.json`, `es.json` and `ja.json` but nothing uses it.

**The omission from the footer is intended.** Git history (the clone was shallow; I ran
`git fetch --unshallow` to read it) shows, all on 2026-06-17:

- `f088a8f` Seed Tipping, Honestly (No. 03) + surface it on the /resources index
- `34acb5d` Polish Tipping, Honestly: … "Add Tipping, Honestly to the Footer Resources column in
  EN/ES/JA" (this added the `resourcesTipping` keys and the footer line)
- `0d8d447` **"Remove Tipping, Honestly from the Footer Resources column for now.** Per request —
  drop the link from the footer. The /resources index still surfaces it as No. 03 and the guide
  page stays live; only the global footer link is removed."

So: index listing intended, footer omission intended ("per request", "for now"), and the unused
`resourcesTipping` keys are leftovers from `34acb5d` kept for when it returns. The Step 0
discovery note ("suggests the footer entry was meant to be there") had it the wrong way round,
because the shallow clone hid this history. If the resource becomes the quick reference, restoring
the footer line is a one-line change and the labels are ready.
