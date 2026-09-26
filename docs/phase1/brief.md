# Travel2Egypt — Phase 1: Consolidate, Fix and Redirect (20 tasks)

You are working on the travel2egypt.org codebase (Next.js 15 + Sanity CMS). Your job is to carry out the 20 Phase 1 tasks below: merge overlapping posts, retire thin or duplicate posts behind 301 redirects, apply two content updates, and prepare a category clean-up.

These tasks change live URLs that carry search equity. Work carefully, keep a complete record, and never lose content.

---

## Ground rules (read before touching anything)

1. **Branch and drafts only.** Work on a new git branch `content/phase1-consolidation`. Every content change in Sanity goes in as a **draft**, not a publish. I will review and publish. Commit code changes (redirects, config, scripts) in small commits, one per task.
2. **Never delete a Sanity document.** Before any change, export every source and target document to `docs/phase1/backup/<doc-id>.json`. A retired post is unpublished only *after* its redirect is live, and never deleted.
3. **Don't invent facts.** Do not write prices, opening hours, dates, access status, discovery details or statistics from your own knowledge. Where a task needs a current fact, insert a clearly marked placeholder, `[VERIFY: what needs checking]`, and list it in the report. Moving and editing existing text is fine; asserting new facts is not.
4. **House style.** British English (travellers, colour, centre). If the repo has a style guide, `CLAUDE.md`, or SOP files, read them first and follow them. Keep the existing operator voice: direct, judgment-led, no brochure language.
5. **Keep target slugs.** The target URL of each consolidation stays exactly as it is. Do not create new slugs.
6. **Redirects:** permanent (301/308), source → final target in one hop, no chains, no loops. Every target must return 200 before its redirect ships.
7. **Locales.** The site has at least EN and JA (routes look like `/[locale]/blog/[slug]`, and `ja_JP` is declared as an alternate). Check for ES too. Handle every locale variant of each source URL. Redirect a JA source to the JA target, never to EN. If a locale version of a target doesn't exist, report it; don't redirect to another language.
8. **When unsure, don't guess.** If a task depends on a decision I haven't given you, do the safe preparatory work, stop that task, and put the question in the report. Carry on with the other tasks.

---

## Step 0: Discovery (do this first, report before Step 1)

Find and document in `docs/phase1/discovery.md`:

- How blog posts, `/guide` pages, `/travel-tips` pages and `/resources` pages are modelled in Sanity (document types, slug fields, locale handling, category references, author/byline fields, published/updated date fields, meta description field).
- How redirects are currently implemented (`next.config` `redirects()`, middleware, a Sanity redirect document type, or hosting config) and where existing redirects live. Use the same mechanism; don't introduce a second one.
- How the sitemap is generated and whether unpublished or redirected docs are excluded automatically.
- How "Read next" / related posts are chosen (for later phases; just note it).
- For every source and target URL in the task list: does the document exist, in which locales, and what is its Sanity ID? Build `docs/phase1/inventory.csv` with columns: `task, role (source/target), url, locale, sanity_id, exists, status_code`.

If any target doesn't exist, mark the affected task as **blocked** and continue with the others.

---

## Step 1: Pure redirects (no content merging)

For each task, first read the source and check whether it holds anything the target lacks. Examples: a list of hospitals, a specific tip, a useful table. If it does, port that material into the target **as a draft**, rewritten into the target's structure, and note it in the report. Then add the redirect.

### Task 6: Retire the post-pandemic travel post
- Source: `/blog/traveling-to-egypt-in-the-time-of-coronavirus`
- Target: `/travel-tips/passport-and-visa`
- Nothing to port, since it is obsolete. Redirect, then unpublish the source.

### Task 7: Retire the blog SIM post and the Telephones stub
- Sources: `/blog/how-to-choose-a-sim-card-for-your-trip-to-egypt`, `/travel-tips/telephones-in-egypt`
- Target: `/travel-tips/staying-connected-in-egypt`
- The Telephones page is a short stub with a garbled excerpt. Port any unique, still-accurate content (e.g. landline or dialling notes) into the target draft. Remove the Telephones entry from the Travel Tips index and department lists.

### Task 14: Retire legacy commercial posts (2017–2018)
Each source goes to its closest live page. Proposed mapping (read each source first; if the content points somewhere better, use that and say why):

| Source | Proposed target |
|---|---|
| `/blog/egypt-holiday-deals` | `/egypt-travel-packages` |
| `/blog/vacation-in-egypt` | `/journeys/first-time-in-egypt` |
| `/blog/best-places-to-visit-in-egypt` | `/guide` |
| `/blog/places-in-egypt` | `/guide` |
| `/blog/touring-egypt` | `/journeys/first-time-in-egypt` |

### Task 16: Redirect blog posts that duplicate city guide pages
Default direction is blog → guide:

| Source | Proposed target |
|---|---|
| `/blog/7-unforgettable-to-do-in-aswan` | `/guide/aswan` (or its "what to do" sub-page if one exists) |
| `/blog/places-to-visit-in-aswan` | `/guide/aswan` |
| `/blog/top-things-to-do-in-luxor-egypt` | `/guide/luxor/what-to-do-in-luxor` |
| `/blog/33-amazing-things-to-do-in-hurghada` | `/guide/hurghada` (or its "what to do" sub-page) |
| `/blog/top-adventures-things-to-do-in-sharm-el-sheikh` | `/guide/sharm-el-sheikh` (or its "what to do" sub-page) |

**Search data check:** if a Google Search Console export exists at `docs/phase1/gsc/` (pages report, last 3–6 months), compare clicks and impressions for each blog URL against its guide target. If the blog URL clearly outperforms, **don't redirect that pair**. Flag it in the report as "reverse candidate" for my decision. With no GSC data, proceed blog → guide and say so in the report.

### Task 17: Redirect duplicate practical posts to Travel Tips

| Source | Target |
|---|---|
| `/blog/egypt-weather-guide` | `/travel-tips/egypt-weather-guide` |
| `/blog/faux-pas-to-avoid-in-egypt` | `/travel-tips/cultural-etiquette-in-egypt` |
| `/blog/local-hospitals-in-egypt` | `/travel-tips/health-and-safety` |

The hospitals post is the most likely to contain unique material (named hospitals, what to expect). Port it into the health-and-safety draft under its own heading. Mark any named facility, phone number or address `[VERIFY]`.

---

## Step 2: Consolidations (merge content, then redirect)

For each consolidation:

1. Read the target and every source in full.
2. Build the merged version **in the target document, as a draft.** Keep the target's strongest structure. Bring in only what the target lacks: unique sections, examples, practical detail. Drop repetition. The result should read as one piece, not two pasted together.
3. Apply the metadata below to the target: title/H1, a fresh meta description (≤155 characters, written for the target keyword, no "Explore…" or "Embark on…" openers), and the updated date field.
4. Add the internal links listed.
5. Prepare the redirect(s) from source to target, but **mark them "ship after publish"** in the report. The redirect goes live only once I've published the merged target. Then unpublish the source.
6. Save a side-by-side note in `docs/phase1/merges/<task>.md`: what came from where, what was dropped and why.

### Task 1: Grand Egyptian Museum
- Target: `/blog/the-grand-egyptian-museum`. Source: `/blog/the-grand-egyptian-museum-2024-insider-guide`
- H1: *The Grand Egyptian Museum: The Complete Visitor Guide*. Keyword: grand egyptian museum
- Opening hours, ticketing, timed-entry booking and gallery availability are all `[VERIFY]`. Do not carry over 2024-era statements about partial opening as current fact.
- **Also:** the Cairo guide page (`/guide/cairo`) says the GEM is "opening progressively from 2023 onward". Replace that sentence in a draft with a neutral line pointing to the GEM post, marked `[VERIFY current status]`.
- Link to: `/guide/giza`, `/blog/national-museum-of-egyptian`, the pyramids-and-GEM content if it exists.

### Task 2: Is Egypt safe
- Target: `/blog/is-egypt-safe`. Source: `/blog/safety-guide-for-travelers-to-egypt`
- H1: *Is Egypt Safe to Visit? A Dated, Seasonally Updated Answer*. Keyword: is egypt safe
- Add a visible "Last reviewed: [VERIFY date]" line near the top. Any statement about current advisories or regional conditions is `[VERIFY]`.
- Link to: `/travel-tips/health-and-safety`, `/travel-tips/solo-woman-traveler-in-egypt`, `/travel-tips/touts-in-egypt`, `/blog/police-escorts-in-egypt`.

### Task 3: Siwa (into the guide, not the blog)
- Target: `/guide/siwa-oasis` (the existing city guide page). Sources: `/blog/discover-siwa-oasis`, `/blog/siwa-oasis-culture-and-adventure`, `/blog/siwas-historical-landmarks`, `/blog/siwa-oasis-a-timeless-epic-adventure`
- **Do not create `/blog/siwa-oasis-guide`.**
- Merge unique material into the guide page, or into its existing sub-pages where a landmark has its own field page. Match the guide's page format.
- **Keep `/blog/siwa-salt-lakes` as a separate article**, but link it from the guide page and link it back.

### Task 5: Best time to visit
- Target: `/blog/best-time-to-visit-egypt`. Source: `/blog/best-time-to-cruise-the-nile`
- H1: *The Best Time to Visit Egypt, Month by Month*. Keyword: best time to visit egypt
- Add a month-by-month section linking every existing month post (January to November; December doesn't exist yet, so leave a placeholder comment), the winter post, the Travel Tips weather guide, and the city weather pages.
- Fold the Nile-cruise timing into its own section.

### Task 9: Tutankhamun's tomb
- Target: `/blog/the-story-of-king-tutankhamun-tomb`. Source: `/blog/the-1922-discovery-of-tutankhamuns-tomb-why-it-matters-the-ultimate-guide`
- H1: *Tutankhamun's Tomb: The Discovery, the Contents and Visiting KV62*. Keyword: tutankhamun tomb
- **Before merging, confirm they really overlap.** If the 1922 post is mainly the discovery story and the other is mainly the tomb today, report that and propose keeping both with distinct keywords instead of merging. Don't merge until I confirm in that case.
- Link to: `/blog/where-is-tutankhamun-now`, `/blog/the-curse-of-king-tuts-tomb`, `/blog/a-simple-guide-to-the-valley-of-the-kings`, `/guide/luxor/valley-of-the-kings`.

### Task 10: Nile cruise pillar
- Target: `/blog/the-definitive-guide-to-egypt-nile-cruise`. Source: `/blog/historical-sites-visited-by-a-nile-cruise`
- H1 stays close to the current one. Keyword: nile cruise egypt
- This becomes the pillar for the Nile cluster. Link to every existing Nile post that stays on Travel2Egypt (the luxury Nile posts are moving to Sillage in Task 12): `what-is-included-in-nile-cruise-packages`, `types-of-dahabiya-boats`, `dahabiya-nile-cruises-wind-powered-journey`, `felucca-rides-in-egypt`, `lake-nasser-cruise`, `lake-nasser-cruises`, `pack-for-a-dahabiya-nile-cruise-journey`. Also link `/nile-cruises` and the guide pages for Edfu, Kom Ombo and Esna.

### Task 11: Family resorts
- Target: `/blog/best-family-resorts-in-egypt`. Source: `/blog/family-beach-holidays-in-egypt`
- H1: *Family Beach Holidays and Resorts in Egypt*. Keyword: family resorts egypt
- Hotel names, facilities and prices from 2024 are `[VERIFY]`.
- Link to: `/blog/family-adventures-in-egypt`, `/journeys/travelling-as-a-family`, `/travel-tips/traveling-with-kids`.

### Task 12: Move luxury posts to Sillage (moved to Step 4: prepare, don't apply)
See Task 12 in Step 4. Don't merge these posts on Travel2Egypt.

### Task 13: Sinai
- Target: `/blog/sinai-desert-safaris`. Source: `/blog/sinai-adventure`
- H1: *Sinai Desert Travel: Treks, Safaris and What to Know First*. Keyword: sinai desert safari
- Any statement about access, permits or regional conditions is `[VERIFY]`.
- Link to: `/guide/saint-catherine`, `/guide/dahab`, `/guide/sharm-el-sheikh`, `/blog/sinai-historical-sites`, `/blog/wadi-feiran`.

### Task 15: Choosing a package
- Target: `/blog/egypt-package-deals`. Source: `/blog/travel-packages-from-the-usa-to-egypt`
- H1: *How to Choose an Egypt Travel Package*. Keyword: egypt travel packages
- Keep any US-specific advice as its own section.
- Link to: `/egypt-travel-packages`, `/small-group-travel-packages`, `/blog/travel-agency-in-egypt`, `/blog/group-tours-vs-private-tours`.

---

## Step 3: Content updates at existing URLs (no redirects)

Structure, links and metadata only. Every new fact is `[VERIFY]`.

### Task 4: Valley of the Kings tombs
- URL stays `/blog/must-see-tombs-in-the-valley-of-the-kings`
- H1: *Which Tombs to See in the Valley of the Kings (2026)*. Keyword: valley of the kings tombs
- In the West Valley section, add a subsection on the tomb of Amenhotep III: `[VERIFY: current access status and ticketing]`.
- Add a short subsection on the tomb of Thutmose II, found in 2025: `[VERIFY: discovery details and whether visitors can enter]`.
- Replace "Official site notes give opening as 6 AM" with `[VERIFY: current opening hours, checked date]`.
- Add a small table: which tombs to pick with 0, 1 or 2 supplementary tickets, built only from tombs already described in the post.
- Link to: `/guide/luxor/valley-of-the-kings`, `/guide/luxor/ticket-prices-for-attractions-in-luxor`, `/blog/a-simple-guide-to-the-valley-of-the-kings`, `/blog/the-story-of-king-tutankhamun-tomb`.

### Task 8: Giza without getting worn down
- URL stays `/blog/how-to-avoid-scams-at-giza-pyramids`
- H1: *Visiting the Giza Pyramids Without Getting Worn Down (2026)*. Keyword: giza pyramids scams
- Add a section on the current plateau entrance and visitor arrangements: `[VERIFY: new entrance, shuttle/transport rules, ticket points]`. Flag any existing sentence about entrances or on-site transport that may now be outdated.
- Link to: `/travel-tips/touts-in-egypt`, `/guide/giza/the-giza-plateau`, `/blog/inside-the-great-pyramid-of-giza`.

---

## Step 4: Prepare but don't apply (decisions needed)

### Task 12: Move luxury posts to Sillage Égypte
Brand decision: Sillage (sillage-egypte.com) owns luxury and high-end; Travel2Egypt is mid-market. These posts leave Travel2Egypt:

| Travel2Egypt source | Sillage destination (planned) |
|---|---|
| `/blog/egypt-luxury-travel`, `/blog/the-luxurious-egyptian-vacation` | `https://sillage-egypte.com/journal/is-luxury-egypt-worth-it` |
| `/blog/luxury-resorts-in-egypt`, `/blog/egypt-luxury-beach-resorts` | `https://sillage-egypte.com/journal/best-luxury-resorts-red-sea` |
| `/blog/luxury-nile-cruise`, `/blog/boutique-nile-cruises-in-egypt`, `/blog/experiencing-egypt-aboard-the-oberoi-zahra` | `https://sillage-egypte.com/journal/best-luxury-nile-cruises` |
| `/blog/historical-hotels-in-egypt` | `https://sillage-egypte.com/journal/historic-hotels-of-egypt` |
| `/blog/boutique-hotels-in-egypt` | `https://sillage-egypte.com/journal/luxury-villas-egypt` |
| `/blog/how-to-choose-the-right-egyptian-airport-for-your-private-flight`, `/blog/a-helicopter-adventure-over-the-pyramids-and-nile` | `https://sillage-egypte.com/journal/private-jet-and-helicopter-egypt` |
| `/blog/exclusive-access-to-the-giza-pyramid` | `https://sillage-egypte.com/journal/pyramids-without-crowds` |

- Export each source (and any JA version) as clean Markdown to `docs/phase1/export/sillage/<slug>.md` with front matter: title, original URL, dates, images, and the planned Sillage destination.
- Add each cross-domain 301 to the redirect config **commented out**, with a note: ships only when the Sillage URL returns 200. Sillage is EN/ES/FR/NL/DE with no Japanese, so the JA versions of these posts need their own decision. List them in the report; don't redirect JA to English.
- Find every internal link on Travel2Egypt pointing to these posts and list them in the report. Don't change them yet.
- Note in the report that the "Travelling in style" journey page and the "Luxury Stay" blog category also sit in luxury territory, for my decision.

### Task 18: Move the budget hotel post to AffordEgypt
- Source: `/blog/budget-hotels-near-the-pyramids`
- The destination lives on affordegypt.com, which is probably a separate codebase. **Do not add the cross-domain redirect yet.**
- Export the post as clean Markdown to `docs/phase1/export/budget-hotels-near-the-pyramids.md`, with front matter (title, original URL, original dates, images list). Hotel names and prices are `[VERIFY]`.
- Add the redirect rule to the config **commented out**, with a note that it ships only once the AffordEgypt URL returns 200.

### Task 19: Blog categories
- Currently 20 categories, many misassigned. Examples: "Packing for a Dahabiya" is under History; "What to Actually Do in Aswan" and "Walking Khan el-Khalili" are under Hotels; "Is Egypt Safe?" is under Culture.
- **Don't change assignments yet.** Produce `docs/phase1/categories-proposal.csv`, listing every published blog post with its current category and a proposed new one.
- Use about 8 categories. Starting point, which you can adjust if the posts suggest better groupings: *Planning & Itineraries; The Nile; Sites & Monuments; History & Egyptology; Cairo & the Cities; Desert, Oases & Sinai; Red Sea & Diving; Culture & Food.* Retire "Luxury Stay": that territory moves to Sillage (Task 12).
- Include the redirect map for retired category URLs (`/blog/category/<old>` → `/blog/category/<new>`).
- I'll approve the CSV, then you apply it.

### Task 20: Duplicate tipping pages
- Pages: `/travel-tips/tipping-in-egypt` and `/resources/tipping-honestly`. Both target the same query.
- Compare them and write a short recommendation in the report: merge, or keep both with distinct roles. Default proposal: Travel Tips stays canonical for "tipping in egypt"; the resource becomes a visual quick-reference with a different target phrase, and each links to the other.
- Also note: the footer Resources list omits "Tipping, Honestly" while the Resources index lists it. Report which is intended.
- Don't apply changes until I confirm.

---

## Step 5: Clean-up after the redirects (for every redirected source)

- **Internal links:** search all Sanity content (blog, guide, travel-tips, resources, journeys, packages, tours) and hard-coded links in components for links to every source URL. Update them to point directly at the target, in drafts. List every changed document.
- **Sitemap:** confirm redirected and unpublished URLs drop out of the sitemap.
- **hreflang / alternates:** confirm no page declares an alternate that now redirects.
- **"Read next" lists:** if related-post lists are manual, remove retired posts from them.

---

## Step 6: Verification

Write `scripts/phase1-verify` (in whatever language the repo already uses) that, for every source URL and locale variant:

- requests the URL without following redirects and checks for a 301/308;
- checks the `Location` is the final target, with no chain;
- requests the target and checks for a 200.

Run it against a local or preview build and save the output to `docs/phase1/verify-output.txt`. Also run the project's build, lint and type-check, and fix anything you broke.

---

## Deliverable: `docs/phase1/REPORT.md`

One table with a row per task: task number, status (done / draft awaiting publish / blocked / needs decision), what changed, Sanity draft IDs, redirects added (with "ship after publish" flags), and content ported from sources.

Then these sections:

- **VERIFY list:** every placeholder, with its document and the fact needed.
- **Decisions needed:** tasks 9 (if the posts don't really overlap), 12 (JA versions, the "Travelling in style" page), 16 (any reverse candidates), 18, 19 and 20, plus anything you found yourself.
- **Locale gaps:** sources or targets missing in JA or ES.
- **Anything surprising:** broken links found, existing redirect chains, docs that didn't match this brief.

Don't publish anything, and don't merge the branch. Stop when the report is written. USE the image exist
