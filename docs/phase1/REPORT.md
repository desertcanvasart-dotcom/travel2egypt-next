# Phase 1 report: consolidate, fix and redirect

Branch: `claude/brave-mayer-p92z0s` (built on `content/phase1-consolidation`; this session can only push to its own branch). Written 2026-09-26.

**Nothing is published and nothing is merged.** Every content change is a Sanity draft (`drafts.<id>`). Every live page is unchanged until you publish. Redirects live only in this branch until it is deployed.

## How to review and ship

1. **Review the drafts in Studio.** Each draft's reviewed copy is also in `docs/phase1/copy/<folder>/`, and each consolidation's side-by-side note is in `docs/phase1/merges/<task>.md`.
2. **Before deploying this branch, publish the Step 1 target drafts** (Tasks 7, 16 and 17). The branch's live redirects send those sources to their targets. The ported material only appears once the target draft is published.
3. **For each Step 2 task, publish the merged target, then activate its redirects:** `python3 scripts/phase1/redirects.py activate --task N`, then `npm run redirect-map:regenerate`, `npm run test:redirect-map-integrity` and `npm run test:migration-routing`, then commit and deploy. Activation also repoints any legacy row that would chain, and updates the audited-alias record.
4. **Publish the Step 5 link drafts** (see below). Sanity will not unpublish a document that published documents still reference.
5. **Once a task's redirects are live in production,** run `python3 scripts/phase1/retire.py check --task N`, then `write`. This unpublishes the sources the way Studio does: the content is kept as a draft, and nothing is deleted. It refuses if production does not already redirect the URL, or if anything still references the document. It also weakens the `translation.metadata` references that would otherwise block the unpublish.
6. **After deploy,** run `npx tsx scripts/phase1-verify.ts --base https://travel2egypt.org`.

## Tasks

"Ship after publish" means the redirect rows are in `migration/redirect-map.csv` as `# PHASE1-SHIP-AFTER-PUBLISH` comments. They go live only through `redirects.py activate`.

| # | Status | What changed | Sanity drafts | Redirects | Ported from sources |
|---|---|---|---|---|---|
| 1 | Draft awaiting publish | GEM target merged. H1 *The Grand Egyptian Museum: The Complete Visitor Guide*, new meta description and updatedAt; hours, tickets, timed entry and galleries marked `[VERIFY]`. The Cairo guide's GEM sentence is replaced with a neutral line to the GEM post, marked `[VERIFY: current status]`. | `wp-post-216669-en`, `wp-post-249194-es`, `wp-post-249210-ja`, `wp-page-83284` (Cairo) | 3 rows, **ship after publish** | Planning material: first-visit route, 2-hour and half-day plans, Saqqara/Dahshur warning, decide-in-advance list, families, common mistakes. Also official-channel and photography notes carried from the ES target into EN and JA. |
| 2 | Draft awaiting publish | H1 *Is Egypt Safe to Visit? A Dated, Seasonally Updated Answer*. A visible "Last reviewed: [VERIFY]" line; advisory and regional claims marked `[VERIFY]`. EN rewritten for UK/US/AU readers, where the old EN was a translation of the JA (MOFA, Tabi-Resi). | `wp-post-136702-en`, `wp-post-158013-es`, `wp-post-172216-ja` | 3, **ship after publish** | Checkpoints and tourist police, Getting around, Red Sea operator checks, Women travellers and families, drones/drugs/Suez photography, insurance and evacuation, emergency numbers (`[VERIFY]`). |
| 3 | Draft awaiting publish | The Siwa guide overview gains the blogs' unique material. The salt-lakes post stays, linked both ways. No new slug. | `wp-page-58932` (city), `wp-post-153508-en`, `wp-post-155586-es`, `wp-post-167162-ja` | 12 (4 sources × 3), **ship after publish** | Getting there, water and the salt lakes, dress and photography etiquette, market crafts, Siyaha, When to Go (incl. Ramadan), Who Siwa Suits. No sub-page needed changes; they already cover each landmark in more depth. |
| 4 | Draft awaiting publish | H1 *Which Tombs to See in the Valley of the Kings (2026)*. Amenhotep III subsection in the West Valley, Thutmose II subsection, and the 6 AM line replaced; all `[VERIFY]`. A 0/1/2 supplementary-ticket guide built only from tombs in the post; it is a list, because `article` has no table block. | `wp-post-134167-en`, `wp-post-144430-es`, `wp-post-249591-ja` | none | n/a |
| 5 | Draft awaiting publish | H1 *The Best Time to Visit Egypt, Month by Month*. Month-by-month list linking all 11 month posts, with December as a `[VERIFY]` placeholder line (Portable Text has no comments). Links to the winter post, the Travel Tips weather guide and 12 city weather pages. | `wp-post-132475-en`, `wp-post-144401-es`, `wp-post-170579-ja` | 3, **ship after publish** | The Nile-cruise timing, as its own section. |
| 6 | Redirect ready (live on deploy) | Nothing to port; the post is obsolete. | none | 3 live rows, plus 1 legacy JA row repointed | none |
| 7 | Draft awaiting publish, redirect live on deploy | SIM post and Telephones stub ported into Staying Connected. Telephones leaves the index and department lists when it is unpublished (`retire.py --task 7`); the index is built only from published tips. | `travelTip.staying-connected-in-egypt` | 5 live (the EN Telephones row already existed); 5 legacy rows repointed | Buying and testing a SIM, unlock/eSIM notes, keeping the home SIM for 2FA, coverage gaps, dialling Egypt from abroad, landline format, 0800 toll-free (`[VERIFY]`). Obsolete stub material dropped. |
| 8 | Draft awaiting publish | H1 *Visiting the Giza Pyramids Without Getting Worn Down (2026)*. New plateau-entrance section (`[VERIFY]`); 4 existing entrance/transport sentences flagged `[VERIFY]`. | `wp-post-152426-en`, `wp-post-155592-es`, `wp-post-172237-ja` | none | n/a |
| 9 | Draft awaiting publish | Overlap confirmed first: about 10 of 15 topics are shared (evidence table in `merges/9.md`), so the posts are merged. H1 *Tutankhamun's Tomb: The Discovery, the Contents and Visiting KV62*; metaTitle updated. | `wp-post-235766-en`, `wp-post-236110-es`, `wp-post-238735-ja` | 3, **ship after publish** | Carter's search, recording, "over five thousand" objects, ownership in 1922, Egyptomania, the Luxor + Giza itinerary. |
| 10 | Draft awaiting publish | Nile pillar: links to all 7 staying Nile posts, `/nile-cruises`, and Edfu, Kom Ombo and Esna. EN title tuned to *The Definitive Guide to a Nile Cruise in Egypt* (keyword order). | `wp-post-97294-en`, `wp-post-144338-es`, `wp-post-164256-ja` | 3, **ship after publish** | "The sites along the way" (Luxor, Edfu, Kom Ombo, Aswan, Abu Simbel) and what needs extra nights. |
| 11 | Draft awaiting publish | H1 *Family Beach Holidays and Resorts in Egypt*. Hotel names and facilities `[VERIFY]`. | `wp-post-112120-en`, `wp-post-144350-es`, `wp-post-167140-ja` | 3, **ship after publish** | Checking the beach, El Gouna, Marsa Alam, Dahab, Ain Sokhna, the Mediterranean, water safety, and a "which to pick" list. |
| 12 | Needs decision | Nothing applied. 36 clean Markdown exports (12 posts × EN/ES/JA) in `export/sillage/`. 12 EN cross-domain rows are commented in the map. Inbound links listed in `notes/task12-inbound-links.md`. | none | 12 EN rows, **commented; ship when the Sillage URL returns 200** (the proxy blocks sillage-egypte.com, so this is unchecked) | n/a |
| 13 | Draft awaiting publish | H1 *Sinai Desert Travel: Treks, Safaris and What to Know First*. Access, permits and conditions `[VERIFY]`. | `wp-post-115066-en`, `wp-post-144348-es`, `wp-post-167046-ja` | 3, **ship after publish** | Peninsula split and North Sinai, where trips start, the monastery and the Mount Sinai climb, the 2025 court reports (`[VERIFY]`), Bedouin etiquette, seasons, visas and permits. Reef/Blue Hole detail dropped (off-identity). |
| 14 | Redirect ready (live on deploy) | Sources read; the brief's targets stand. The code-route targets can't take a Sanity draft; the sources' unique material is listed in `merges/14.md`. | none | 15 live; 10 legacy rows repointed | none |
| 15 | Draft awaiting publish | H1 *How to Choose an Egypt Travel Package*. US-specific advice in its own section; fares, routes and visa fees `[VERIFY]`. | `wp-post-153058-en`, `wp-post-154308-es`, `wp-post-167192-ja` | 3, **ship after publish** | Inclusions checklist, words to read carefully, insurance and advice, "Travelling from the USA". |
| 16 | Drafts awaiting publish, redirects live on deploy | Three sources now go to the "what to do" sub-page, as the brief prefers where one exists. The thin legacy Luxor, Hurghada and Sharm bodies are rebuilt from the blogs. No GSC export exists, so blog → guide by default and there are no reverse candidates. | `wp-page-59214`, `wp-page-58758` (built on its pending hero draft), `wp-page-60648`, `wp-page-59702`, `wp-page-60487` | 15 live; 8 legacy rows repointed | See `merges/16.md` (Old Cataract terrace, Nubian context, felucca pricing, Elephantine temples, Hurghada dive sites, Sharm activities…). |
| 17 | Drafts awaiting publish, redirects live on deploy | Weather, etiquette and hospitals material ported. The stale WordPress-import draft on Cultural Etiquette was replaced; it is backed up in `backup/drafts.wp-page-73387.json`. | `travelTip.egypt-weather-guide`, `wp-page-73387`, `wp-page-60908` | 9 live; 5 legacy rows repointed | Clothing by season; declining politely, gifts, photography and a Conversation section; a new "Hospitals and What to Expect" section. The source named no specific hospitals. |
| 18 | Needs decision | Exported to `export/budget-hotels-near-the-pyramids(.es/.ja).md`. The post names no budget hotels or prices; Mena House is marked `[VERIFY]`. | none | 1 EN row, **commented**; the AffordEgypt URL is still to be given | n/a |
| 19 | Needs decision | `categories-proposal.csv` (167 EN posts; ES/JA follow EN) with 9 categories, and `categories-redirects.csv` (69 rows). Nothing applied. | none | none yet | n/a |
| 20 | Needs decision | Comparison and recommendation in `notes/task20.md`. Nothing applied. | none | none | n/a |

### Step 5: internal links (drafts)

- **Links repointed:** `scripts/phase1/relink.py` repointed every link to a redirected source (Tasks 1–3, 5–7, 9–11, 13–17) in **243 documents, 404 links**, as drafts. The full list is in `relink-log.json`.
  - It covers internal references, relative and absolute `href`s, links on the old `travel2egypt1.wpenginepowered.com` host, tour day-by-day itineraries, and the tour "Read before you choose" `journalRefs`.
  - Each link goes to the target **in the language of the body it sits in**.
  - Absolute travel2egypt.org links become relative, per the canon.
- **Existing drafts kept:** documents that already had a draft were edited on top of it, so pending work is kept.
- **Task 12/18 links:** listed in `notes/task12-inbound-links.md` and `notes/task18.md`, not changed, as the brief asks.
- **Hard-coded links in `src/`:** none point at a redirected Phase 1 source. Two point at Task 12 posts (see Decisions).
- **Sitemap:** `src/app/sitemap.ts` reads published documents only, and `finalizeSitemap` drops every redirect-map source. Redirected and unpublished URLs therefore drop out without further work. `test:migration-routing` covers this (sitemap-policy passed).
- **hreflang:** blog alternates come from each post's own translation group, so only the retired sources themselves declare alternates to retired URLs, and those pages no longer render. `finalizeSitemap` also strips alternates pointing at URLs not in the sitemap. Guide and Travel Tips alternates are per-locale slugs of the same document, and no target changed its slug.
- **"Read next":** automatic (same language and leaf category); the manual `relatedArticles` / `relatedTips` fields are not rendered. Unpublishing the sources removes them from every list.

### Step 6: verification

`scripts/phase1-verify.ts` was run against a local production build of this branch (`next start`); the output is in `verify-output.txt`:
- **48 PASS:** every Step 1 source in every locale answers 308 with `Location` set to its final target, and the target answers 200 (one hop, no chain).
- **40 HOLD:** "ship after publish" and cross-domain rows. The sources still serve 200, and every in-site planned target is already 200.
- **8 `?`:** the ES/JA versions of the Task 12/18 posts, which await your decision.
- **0 failures.**

Also checked on that build:
- **Sitemap:** the sitemap (4,298 URLs) contains none of the 48 redirected sources.
- **hreflang:** none of the 39 Step 1 target pages declares an hreflang alternate pointing at a redirected URL.

Commands:
- **`npm run build`:** passes (with `NEXT_PUBLIC_SANITY_PROJECT_ID=ufallvd2`, `NEXT_PUBLIC_SANITY_DATASET=production`).
- **`npm run typecheck`:** passes.
- **Redirect tests:** `test:redirect-map-integrity` (4,249 rows, 0 duplicates, loops or chains), `test:retired-content`, `test:migration-routing` and `test:redirect-map-regenerate` all pass. Activation of Tasks 3 and 10 was rehearsed and passed the same suites.
- **`npm run lint`:** cannot run. There is no ESLint config, and `next lint` stops at an interactive prompt; this predates Phase 1.

## VERIFY list

All 182 placeholders (61 distinct facts) are tabled in [`verify-list.md`](verify-list.md), by task, fact and document/locale. The highest-stakes ones:
- **GEM:** hours, tickets, timed entry, which galleries are open (Task 1).
- **Safety:** advisory status for North and central Sinai, the borders and the Western Desert, plus the last-reviewed date (Tasks 2 and 13).
- **Valley of the Kings:** opening hours; Amenhotep III and Thutmose II access (Task 4).
- **Giza:** entrance and shuttle arrangements (Task 8).
- **Family resorts:** each named family resort (Task 11).
- **Packages:** US fares and visa fees (Task 15).
- **Health:** emergency numbers, 112, hospital names and recompression chambers (Task 17).

## Decisions needed

1. **Task 9: merge or split.** The posts overlap heavily, so they are merged in draft. If you would rather keep two, `merges/9.md` gives a split: the 1922 post keeps the discovery story (keyword "discovery of tutankhamun's tomb"). The redirect is only commented until you activate it.
2. **Task 12 (Sillage):**
   - **JA versions:** 12 JA posts (listed in `notes/task12.md`); Sillage has no Japanese. The recommendation is to keep them for now. Post-by-post JA → JA alternatives are listed.
   - **ES versions:** does Sillage have ES journal URLs? If so, those rows can be added.
   - **"Travelling in style":** `/journeys/travelling-in-style` is owner-approved copy in luxury territory. It already links out to Sillage once.
   - **"Luxury Stay":** 9 EN posts; 6 move and 3 stay (re-homed by Task 19).
   - **Hard-coded journal cards:** `src/…/firstTimeContent.ts` uses `exclusive-access-to-the-giza-pyramid` as the only journal card on `/journeys/first-time-in-egypt`, and `travellingInStyleContent.ts` uses `historical-hotels-in-egypt`. Both need a replacement before those posts leave.
   - **Old WordPress URLs:** 15 existing redirect rows already point at these posts; they must be repointed together with the cross-domain rows. The 12 optional rows for the old `/<slug>` URLs are in `notes/task12-redirects.csv`.
3. **Task 14:**
   - Targets kept as proposed.
   - The agent suggested `/blog/egypt-package-deals` for `egypt-holiday-deals`. I kept `/egypt-travel-packages`: the source has commercial "deals" intent, which the listing page answers.
   - It suggested `/blog/personalize-your-egypt-adventure` for `vacation-in-egypt`. I kept the first-timer journey, because that post exists only in EN and rule 7 forbids sending ES/JA there.
   - None of the five posts is 2017–2018 copy any more; all were rewritten in May 2026.
4. **Task 16:**
   - **Reverse candidates:** there is no GSC export, so there are none. Add `docs/phase1/gsc/` if you want the check run.
   - **Dolphinella:** should a captive-dolphin swim appear anywhere on the site? It was dropped from the Sharm page.
   - **Summaries:** the Luxor, Hurghada and Sharm sub-page `summary` fields (and the ES Luxor meta description) still describe the old bodies. Suggested summaries are in `merges/16.md`.
5. **Task 18:** the AffordEgypt destination URL is needed; the row is commented with a placeholder URL. The JA row needs a decision (no JA on AffordEgypt?).
6. **Task 19:**
   - Approve `categories-proposal.csv`.
   - "Practical Egypt" is added as a ninth category.
   - "Red Sea & Diving" has only 5 posts.
   - Planning could be split into "When to Go" and itineraries.
   - Applying it means 9 new category documents, 381 post reassignments as drafts, the category redirects, and then unpublishing the old categories.
7. **Task 20:**
   - **Recommendation:** keep both pages with distinct roles, as your default proposal says, but **first reconcile the figures, which conflict**: porters 50–100 vs 20–50 EGP, drivers US$5–10 vs 15–25 a day, guides per person vs per party, whether cruise stewards are in the pool, and who gets the service charge. The resource even contradicts itself.
   - **Resource target phrase:** "how much to tip in Egypt".
   - **Footer:** the omission is intentional. Commit `0d8d447` removed "Tipping, Honestly" from the footer on request; the Step 0 note had it backwards and is corrected.
8. **New headings for the canon's approved set:**
   - "Conversation / Conversación / 会話" (etiquette)
   - "Hospitals and What to Expect / Hospitales: qué esperar / 病院について知っておくこと" (health)
   - ES "La ropa según el clima" (weather)
   - "Who Siwa Suits" and "When to Go" (Siwa)
9. **Aswan hero image:** the Aswan city draft keeps a pending hero-image swap from July, so publishing it applies that swap. The Phase 1 draft was built on the existing draft so as not to lose it. Revert the hero in Studio before publishing if it isn't wanted.
10. **Task 7 Telephones:** the Telephones travel tip leaves the index and department lists only when it is unpublished, which happens after the ES/JA redirects in this branch are live. The index currently lists it, and its EN link already redirects.

## Locale gaps

- **Targets and sources:** every Phase 1 source and target exists in EN, ES and JA. There are no target gaps, so no redirect goes to another language.
- **Cross-domain moves (Tasks 12 and 18):** ES and JA versions are not redirected; that awaits your decision.
- **Resources page:** `/resources/tipping-honestly` has no ES/JA content or slug. It serves English at `/es` and `/ja`, with self-canonicals.
- **Legacy link errors:** many ES/JA links in guide and wiki pages pointed at another language's post, and several EN bodies linked JA slugs on EN routes, which 404. Step 5 fixed every one that pointed at a Phase 1 source. The rest (for example `/blog/ejiputo-no-rekishi-aru-hoteru` in EN guide pages) are listed under Surprises.
- **Old in-body images:** the images on the Luxor, Hurghada and Sharm sub-pages exist only in EN, and are `_pendingImage` references that may never have been uploaded.

## Anything surprising

- **Strong language-link references block unpublishing.** Every blog post's EN/ES/JA link record (`translation.metadata`) holds *strong* references, which block unpublishing. Each group also has **two** identical metadata documents (`tmeta-…` and `translation.metadata.…`). `retire.py` weakens the references at retirement.
- **The redirect regenerator deleted comment lines.** `npm run redirect-map:regenerate` silently deleted any `#` comment row. It is fixed here, with a test, so pending rows survive.
- **Existing redirect chains, now repointed.** 29 existing rows pointed at a Phase 1 source and would have chained, including `/blog/vacaciones-inolvidables-en-egipto` (an ES slug sent to the EN post). The same will happen for pending tasks; `activate` handles it. `/es/lo-mejor-que-hacer-en-luxor-egipto` → `/es/paquetes-de-viaje-a-egipto` looks wrong but is not a chain, so it is left alone.
- **The audited aliases in `migration/seo-repairs-2026-09-22.json` guard old destinations.** Six were updated to the final target, with the previous destination and the reason recorded.
- **Links that already 404 (not Phase 1 sources, not changed):**
  - 12 EN guide-page fields link JA slugs on the EN route, e.g. `/blog/ejiputo-no-rekishi-aru-hoteru`.
  - The NMEC post links "The National Museum" to the Alexandria National Museum.
  - The Hurghada blog linked a hidden guide page.
- **Wrong or mixed language:**
  - `wp-post-257609-en` ("Wonders of Egypt in March") has a Spanish body.
  - Several EN posts read as machine translations of the JA (the Is Egypt Safe, Sinai, packages and SIM sources).
  - The ES Staying Connected body has no accents anywhere; the new paragraphs are accented, so the page is mixed until it is re-accented.
  - JA "Final Word" headings are in English and italic on the Siwa and Aswan pages.
- **Figures that disagree across locales (canon numeric gate):**
  - Siwa ES: Mountain of the Dead 3 km vs about 1 km, population, travel time.
  - The Siwa ES route via Bahariya, which EN says has been closed since about 2019 (marked `[VERIFY]`).
  - The tipping pages (Task 20).
- **Stale or unmarked claims outside Phase 1 scope:**
  - The GEM "opened formally on 1 November 2025" in `/blog/1-day-giza-pyramids-itinerary` and `/blog/where-is-tutankhamun-now`.
  - The KV62 outer coffin in the latter.
  - Passport and visa: "exactly thirty US dollars", Rafah, the Sinai stamp.
  - JA Staying Connected: 2026 price tables, VPN advice, embassy contacts.
- **Brochure language in the Siwa city summary:** "verdant jewel", "Edenic island". It is out of task scope and left alone.
- **Near-duplicate posts worth a later decision:**
  - `lake-nasser-cruise` vs `lake-nasser-cruises`, which have distinct angles but near-identical slugs.
  - `types-of-dahabiya-boats` vs `dahabiya-nile-cruises-wind-powered-journey`.
  - `/guide/siwa-oasis/salt-lakes` vs `/blog/siwa-salt-lakes`, which share the JA slug `shiwa-no-shio-mizuumi`.
- **Unpublished image swaps on sub-pages:** 17 of 18 Siwa sub-pages, and other guide pages, carry pending July hero-swap drafts that were never published.
- **Brief vs repo:**
  - The Cairo GEM sentence said "2025", not "2023".
  - The GEM "2024 insider guide" had already been rewritten.
  - The Task 14 posts are not 2017–2018 copy.
  - `/blog/egypt-weather-guide` exists, though the upload log doesn't list it.
- **`npm run lint` cannot run.** The repo has no ESLint config, so `next lint` stops at an interactive setup prompt; this predates Phase 1. `npm run typecheck` passes.

## Tooling added (all in this branch)

| File | Purpose |
|---|---|
| `scripts/phase1-snapshot.py` | Backups and the verified inventory |
| `scripts/phase1/ptmd.py`, `scripts/phase1/stage.py` | Locked-copy Markdown ↔ Portable Text and gated draft staging (verbatim pre-flight, stale-backup check, existing-draft guard, link validation, copy lint) |
| `scripts/phase1/redirects.py` | Per-locale rows, pending rows, activation |
| `scripts/phase1/relink.py` | Step 5 link repointing |
| `scripts/phase1/retire.py` | Safe unpublish once redirects are live |
| `scripts/phase1-verify.ts` | Step 6 check |
| `docs/phase1/backup/` | Every touched document before any change; the prior draft state of each write is in `docs/phase1/rollback/` |
