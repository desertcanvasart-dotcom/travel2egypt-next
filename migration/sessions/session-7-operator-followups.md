# Session 7 — Operator follow-ups

These items don't block the Session 7 merge but should be addressed by the operator (Islam) at convenient intervals or in dedicated future sessions.

## Track 1: Sidebar typography unification

### A. Sidebar editorial entries render in sans-serif

Surfaced during Phase 3.5 Studio walkthrough (city detail pages on localhost against migration-staging).

City detail pages have a sidebar with editorial sections — e.g., **CAIRO TRAVEL GUIDE**, **Plan Your Trip**, **While You Are There**, **Places To Go** — and each section's link entries currently render in a sans-serif face (Inter or similar). The body uses Cormorant Garamond (the editorial display font).

The sidebar entries are **editorial content**, not generic UI labels — handcrafted Travel2Egypt section names like "Nile Rhythms: Cairo Dinner Cruise with Belly-Dancing" or "Pyramid Heritage Tour". They deserve the same typographic care as the body. As-is, the page reads as typographically disjointed: editorial body in serif, editorial sidebar in sans, with no clear hierarchy reason for the split.

**Recommendation:**
- Apply Cormorant Garamond to sidebar editorial entries (section labels and link entries)
- Use a different weight or size than body to maintain visual hierarchy (e.g., lighter weight or smaller size, but same family)
- Keep sans-serif for actual UI affordances (primary CTAs, breadcrumbs, navigation chrome) — those are correctly sans-serif

**Scope:** global CSS / component-level change in the city detail page sidebar component (and any shared sidebar partial used elsewhere).

**Target session:** Session 10.5 (GEO/SEO + design polish), or a dedicated typography pass session if scope warrants. Pre-launch nice-to-have, not blocking.

## Track 2: Tabular data Portable Text block

### A. Tabular content currently rendered as bullet lists

Surfaced during Phase 3.5 Studio walkthrough — visible on `/guide/cairo/ticket-prices-for-attractions-in-cairo` and other ticket-pricing / hours-of-operation pages.

These pages contain tabular content: attraction name + adult price + student price + open time + close time. Currently each row is a bullet with `·` (middot) separating columns. Reads as bullets but is structurally a table — hard to scan visually, columns don't align across rows, header row is buried as a regular bullet.

The pattern recurs across travel guides:
- Hours of operation tables
- Transit fare comparisons
- Hotel rate sheets
- Distance / drive-time tables
- Festival / event date tables

**Recommendation (operator-confirmed):**
- Build a custom Portable Text block type for tabular data in the Sanity schema. Suggested shape:

  ```ts
  {
    name: 'tabularBlock',
    type: 'object',
    fields: [
      { name: 'caption', type: 'internationalizedArrayString' },
      { name: 'headers', type: 'array', of: [{ type: 'string' }] },
      { name: 'rows', type: 'array', of: [{ type: 'object', fields: [{ name: 'cells', type: 'array', of: [{ type: 'string' }] }] }] },
    ]
  }
  ```

- Build a matching Next.js renderer: styled HTML `<table>` with proper semantics (`<thead>` / `<tbody>` / `<th scope>`), responsive overflow handling on narrow viewports, locale-aware number/time/currency formatting.
- Migration step: identify existing pages with bullet-list-shaped tabular data (regex/heuristic detection during a dedicated migration pass — pages with consistent `·`-separated bullets, repeated column count, header-shaped first item), convert in place to `tabularBlock`.
- Editorial review of converted pages — operator scans the auto-converted set for false positives (e.g., a bullet list that *looks* tabular but is actually a bulleted enumeration).

**Scope:** Sanity schema addition (new block type), Next.js renderer (table component + styles), importer migration logic (detection + conversion), editorial review of converted pages.

**Target session:** dedicated schema enrichment session — Session 9 if scope-light, or Session 9.5 if scope warrants its own carve-out.

**Pre-launch priority:** should land **before Phase 11 cutover**. Launching production with bullet-list tables is shippable but not great — operator-grade content deserves operator-grade presentation.

## Track 3: Monument detail page vertical gaps

### A. Excessive blank space between H2 sections

Surfaced during Phase 3.5 Studio walkthrough on `/wiki/monuments/mosque-of-amr-ibn-al-as` (and presumably consistent across the 135-monument cohort).

The wikiMonument detail page renders large vertical gaps between major H2 sections — Introduction, Architectural Profile, Chronology, Historical & Cultural Role, Visitor Essentials, Insider Tips. The gaps look excessive: more than typical editorial breathing room. Three plausible causes, in order of likelihood:

1. **Empty Portable Text blocks** — the importer's body parser (built on the Elementor HTML pipeline) may be producing empty paragraph blocks or null content blocks that render as blank space.
2. **Image elements failing to load** — inline images that haven't been migrated to Sanity assets may be rendering as zero-dimension elements while still reserving vertical space via CSS aspect-ratio reservations.
3. **CSS H2 margin issue** — top/bottom margin on monument-detail H2 may be over-tuned for a different content shape.

Investigation needed before fix.

**Recommended investigation steps:**
- Inspect rendered DOM at gap locations: empty `<p>` tags? Excessive `<h2>` margins? Image elements failing to load?
- Inspect the underlying Sanity Portable Text body for the affected monument: `*[_id=="wp-page-63607"][0].body[_key=="en"][0].value` — look for empty paragraph blocks or null content blocks.
- If empty PT blocks are the cause: importer's body parsing is producing them; fix at import time (cleanup pass in mapper) or batch-migrate via Sanity client.
- If CSS margin issue: tighten H2 spacing in the monument detail page template only (don't propagate to other detail pages without checking their content shape).

**Scope:** investigation + potentially data cleanup pass + potentially CSS adjustment.

**Target session:** pre-launch QA (Session 11) or dedicated rendering polish session.

**Pre-launch priority:** yes — visual quality issue affects every monument page in the cohort.

## Track 4: Right-column imagery on monument detail pages

### A. Right column nearly blank — only "TYPE / CITY" metadata box

Surfaced during Phase 3.5 Studio walkthrough. Operator notes the previous (WP-rendered) version had imagery in the right column to balance the visual weight of the long article body; the current Next.js template renders a small "TYPE / CITY" metadata box at the top of the right column and is otherwise blank.

Two contributing causes:
- **Mapper does not populate `gallery`** — the wikiMonument schema has a `gallery: array of localizedImage` field, but the mapper only sets `heroImage` (top banner). Gallery is empty across all 135 monuments.
- **WP source body HTML** likely contains inline `<img>` tags that the body parser may be stripping or not converting to Portable Text image blocks. (The parser's known to strip Elementor wrappers and category-grid noise — needs verification of what it does with inline images.)

**Recommended approaches (operator decision pending):**

- **A. Mapper-side extraction:** importer walks WP body HTML, extracts inline `<img>` tags, populates `gallery` at import time. Automatic but may pull low-quality images, captions stripped of context, or images that are decorative-only and shouldn't appear in a public gallery.
- **B. Editorial curation:** operator manually adds gallery entries in Studio per monument. High quality, but ~135 monuments × ~2 min each = ~4-5 hours of editorial work.
- **C. Hybrid:** mapper extracts an initial set (best-effort auto-population); operator curates/refines in Studio. Minimizes editorial time while preserving final quality control.

Plus template work — independent of the data approach above:
- Next.js monument detail page template needs a right-column gallery render slot (current template may not have one). Ideally a sticky-positioned column that scrolls with the body but stays in view past the fold.

**Scope:** schema review (gallery field shape — does it carry alt text and caption per locale?), mapper extension (or editorial pass), template addition, possibly batch migration.

**Target session:** schema enrichment session (Session 9 or 9.5) for technical work, plus operator editorial pass.

**Pre-launch priority:** high — visual balance issue affects every monument page; launching with blank right columns is shippable but not great — particularly for high-traffic monuments like the Pyramids of Giza, Valley of the Kings, etc.

## Track 5: i18n monumentType translation keys missing

### A. Metadata box displays raw i18n keys

Surfaced during Phase 3.5 Studio walkthrough. Monument detail page right-column metadata box currently displays literal i18n key text — e.g., `wiki.monumentTypes.mosque` — instead of the rendered translation "Mosque".

All 16 monumentType enum values likely need translations:
- `temple`, `mortuary-temple`, `tomb`, `rock-cut-tomb`, `pyramid`, `shrine`, `fortress`, `palace`, `obelisk`, `colossus`, `necropolis`, `church`, `mosque`, `monastery`, `museum`, `other`

Translations needed in 3 locales: EN, ES, JA. Total: **48 translation entries** (16 × 3).

**Recommended fix:**
- Add translations to `messages/en.json`, `messages/es.json`, `messages/ja.json` under the `wiki.monumentTypes` namespace.
- Could be a 5–10 minute task if operator provides translations directly, or longer if Spanish/Japanese translations need editorial review or native-speaker validation.
- Add a render fallback in the template: if translation key missing, display the capitalized enum value (e.g., `mortuary-temple` → "Mortuary temple") as fallback. This way future schema additions don't break the page even if translations temporarily lag.

**Scope:** i18n message file additions (3 files, 16 entries each) + optional template fallback (1 small change).

**Target session:** any time — not blocking, very small task. Could land alongside any other session 7 polish work.

**Pre-launch priority:** yes — current rendering shows internal i18n keys to users, which looks unprofessional and breaks the editorial polish of the rest of the page.

## Track 6: WP editorial gaps — monuments to author pre-launch

### A. Four monuments expected by Cairo travelers but absent from the cohort

Surfaced during Phase 3.5 Cairo placesToGo walkthrough (135-doc post-Phase-3c cohort + WP source cache check).

These are **editorial gaps that pre-date the migration** — the WP corpus simply doesn't have a page for them — not migration defects. Some are major Cairo monuments that tourists actively look for; their absence is a real editorial gap visitors will notice.

**The 4 absent monuments:**

1. **Grand Egyptian Museum (GEM)** — *highest priority.* The new flagship Egyptian Museum opened with massive 2025–2026 press coverage and is one of the most-searched Egyptian attractions in 2026. WP source has it only as a tour-product page (`pyramids-of-giza-and-grand-egyptian-museum`, rerouted to `tour-or-package` in Phase 1.5b-ii); no standalone monument page exists. Operator should prioritize authoring a wikiMonument doc for GEM before launch.

2. **Al-Rifai Mosque** — adjacent to Sultan Hassan Mosque in Cairo; major Islamic Cairo monument; royal mausoleum (King Farouk, Reza Shah Pahlavi, Hussein Kamel of Egypt). Notable absence: tourists visit alongside Sultan Hassan as a paired visit, and the Mosque-Madrassa of Sultan Hassan IS in cohort.

3. **Salah el-Din (Saladin) Mosque** — distinct from the Citadel of Saladin (which IS in cohort under `the-citadel-of-saladin`). The standalone mosque has historical significance separate from the Citadel; visitors expect both as separate entries.

4. **Babylon Fortress** — the actual Roman fortification in Coptic Cairo. "The Roman Towers" IS in cohort (`the-roman-towers`) but only covers the surviving towers; the fortress as a whole is broader and includes more cultural context (the bastion that hosts Hanging Church, Coptic Museum, etc.).

**Recommendation:**
- Author 4 wikiMonument docs editorially in Sanity Studio before launch.
- For **GEM specifically:** highest priority — author with full content (summary, body, visitor info, ticket prices, opening hours) given its 2026 significance.
- For the other 3: author at minimum a stub doc with summary + city ref so they appear in Cairo's `placesToGo` and have a URL; expand body later.

**Scope:**
- Operator-led editorial work in Studio (no migration code changes needed).
- ~30–60 min per monument for full content; ~10 min per monument for stub.
- All 4 should land in Cairo's `placesToGo` array after authoring (forward-ref `city` set to Cairo).

**Target session:** any time before Phase 11 cutover; could be a dedicated Cairo editorial pass or piecemeal across pre-launch.

**Pre-launch priority:** yes, especially GEM. The other 3 can ship as stubs.

**Future operator follow-up:** as Phase 3.5 walkthrough proceeds for Giza, Aswan, Luxor, Alexandria, etc., capture similar editorial gaps in this same track. The track may grow during the walkthrough.

### B. Four monuments / monument-updates from Giza walkthrough

Surfaced during Phase 3.5 Giza placesToGo walkthrough (second city in the sequential review after Cairo). Like the Cairo gaps, these are editorial issues that pre-date the migration — not migration defects. Note: item 4 below is a **body update of an existing doc**, not a new authoring.

**The 4 items:**

1. **Step Pyramid of Djoser** — major Saqqara monument; the world's first pyramid (Third Dynasty); **extremely high-priority absence.** Tourists visiting Saqqara primarily come to see this. WP source check during Giza walkthrough: not present in WP corpus. Operator should author a wikiMonument doc; recommended placement under Giza's `placesToGo` (Saqqara is in Giza governorate). `monumentType: pyramid`.

2. **Mastaba of Ti** — major Old Kingdom mastaba tomb at Saqqara, famous for its wall reliefs depicting daily life, hunting, and farming scenes. Iconic among Egyptology students and serious tourists; recurrent stop on guided Saqqara tours. WP source check: not present. Operator should author wikiMonument doc; placement under Giza's `placesToGo`. `monumentType: tomb` (or possibly a new schema enum value if mastaba warrants its own type — operator decision).

3. **Memphis open-air archaeological site** — currently `memphis-mit-rahina-museum` covers only the museum building. The broader Memphis site includes the Colossal Ramesses II statue, the Apis Sphinx, the alabaster sphinx, and the open-air gallery of monuments. Operator decision needed:
   - **Option (a):** expand the existing `memphis-mit-rahina-museum` doc body to include the broader site (mixes museum-visit content with open-air-site content)
   - **Option (b):** author a separate `memphis-archaeological-site` doc, leaving the existing museum doc as a sub-component (cleaner editorial separation — museum and open-air site are distinct visit experiences)
   - **Recommendation:** option (b) for editorial cleanliness. Both placed under Giza's `placesToGo`.

4. **The Solar Boat Museum — body update needed (NOT a new authoring)** — the existing doc `the-solar-boat-museum` describes a museum that is now functionally defunct. Khufu's Solar Boat was relocated from this museum (which sat at the foot of the Great Pyramid) to the **Grand Egyptian Museum in 2021**. The museum building still stands but is no longer a tourist destination for the boat. Editorial action needed:
   - Update the body to reflect the relocation
   - Decision pending operator on framing:
     - **Redirect-style content:** "The boat is now at the Grand Egyptian Museum; visit there instead" — points the visitor to GEM
     - **Historical-record content:** keep existing content with a clear "Status: Closed; boat relocated to GEM in 2021" header — preserves the historical record
   - This is the only Track 6 item that is a **body update of an existing doc** rather than new authoring; flagged separately for the action-verb difference.

**Recommendation:**
- For the 3 absences (items 1–3): author wikiMonument docs editorially in Sanity Studio before launch.
- For Solar Boat (item 4): editorial update of existing doc body before launch.
- All 4 should land in their correct Giza `placesToGo` arrangement after editorial work.

**Scope:**
- Items 1–3: ~30–60 min per monument for full content; ~10 min per monument for stub.
- Item 4: ~15–30 min for body update + framing decision.
- Total: ~2–3.5 hours of operator editorial work.

**Target session:** any time before Phase 11 cutover; can be done piecemeal across pre-launch sessions.

**Pre-launch priority:**
- **High** for Step Pyramid of Djoser (it's the most-visited monument at Saqqara — absence is operator-grade visible).
- **Medium** for Mastaba of Ti and Memphis broader site.
- **High** for Solar Boat update (current page is misleading to 2026 visitors — references a museum that no longer hosts the boat).

### C. Three monuments expected by Aswan travelers but absent from the cohort

Surfaced during Phase 3.5 Aswan placesToGo walkthrough (third city in sequential review, after Cairo and Giza). Like the Cairo and Giza gaps, these are editorial issues that pre-date the migration — not migration defects. Operator (Islam) confirmed all 3 are notable absences worth authoring before launch.

**The 3 items:**

1. **Aswan High Dam (Sadd el-Aali)** — *highest priority of the 3.* The 1960s engineering megaproject that created Lake Nasser and forced the UNESCO Nubian rescue (Abu Simbel relocation, Philae Temple relocation, Kalabsha Temple relocation). One of the most significant 20th-century monuments in Egypt — both as engineering achievement and as the catalyst for the modern conservation of multiple ancient sites already in the cohort. Tourists visit Aswan partly to see the Dam complex (lake views, Soviet-Egyptian friendship monument, panoramic photographs). WP source check: presumed absent (operator-confirmed editorial gap). Operator should author wikiMonument doc; placement under Aswan's `placesToGo`. `monumentType: other` (no enum value for "dam" or "engineering monument" — defensible default; operator can refine).

2. **Old Aswan Dam (1902 British dam)** — built 1898–1902 by British colonial engineers, predating the High Dam by 60+ years. Now sometimes called the "Lower Aswan Dam." Architecturally distinct from the High Dam (~6km downstream). Some tourists visit both as part of an Aswan dam-tour. Lower priority than the High Dam but historically significant as part of Egypt's 20th-century infrastructure narrative. `monumentType: other` (same rationale as the High Dam).

3. **Tombs of the Nobles (Qubbet el-Hawa)** — west bank Aswan tombs cut into the cliff face overlooking the Nile, dating from the Old to Middle Kingdoms. Famous tombs include Sarenput I, Sarenput II, Mekhu and Sabni, and Harkhuf (the desert explorer who described his journeys to Yam in his autobiographical inscription). Significant for Egyptology students and archaeologically-minded tourists. WP source check: presumed absent (operator-confirmed editorial gap). Operator should author wikiMonument doc; placement under Aswan's `placesToGo`. `monumentType: tomb` (`rock-cut-tomb` would be more precise — the tombs are literally rock-cut into the cliff — but the cohort's existing usage of `tomb` for similar Old/Middle Kingdom tombs makes `tomb` fine).

**Recommendation:**
- For all 3 items: author wikiMonument docs editorially in Sanity Studio before launch.
- Total estimated work: ~1.5–3 hours of operator editorial time (~30–60 min per monument).
- All 3 should land in Aswan's `placesToGo` array after editorial work.

**Pre-launch priority:**
- **High** for Aswan High Dam (iconic 20th-century monument; visitors expect it).
- **Medium** for Old Aswan Dam and Tombs of the Nobles (specialty interest — good editorial coverage but not headline).

**Cumulative Track 6 totals (post-sub-section-C):**
- Sub-section A (Cairo): 4 items
- Sub-section B (Giza): 3 absences + 1 body update = 4 items
- Sub-section C (Aswan): 3 absences
- **Total: 11 items captured for pre-launch authoring/editorial work**

### D. Al Fayoum monument expansion (7 priority + 5 deferred)

Surfaced during Phase 3.5 Al Fayoum walkthrough (4th city in sequential review). Operator (Islam) compiled source material for 12 expected-but-absent monuments across Al Fayoum's three monument categories (Coptic, Greco-Roman, Pharaonic), drawing from regional Egyptian tourism sources. Architect-prioritized 7 for inline capture (Tier 1: Karanis, Qasr Qarun, Medinet Madi, Seila Pyramid; Tier 2: Tebtunis, Qasr El-Sagha, Karanis Open Air Museum). The remaining 5 are URL-referenced for future expansion.

The source material for these monuments is more substantive than the absence-only entries in sub-sections A/B/C — operator pre-curated content suitable for editorial adaptation into wikiMonument body text.

**Note on schema enum:** Several of the 7 items raise the question of `archaeological-site` enum value addition (Karanis, Tebtunis are Greco-Roman towns, not single monuments). See **Track 9** for that scoping decision.

#### D.1 — Karanis (Kom Ushim)

**monumentType (proposed):** `archaeological-site` (pending Track 9 schema decision; default `other` if Track 9 deferred)

**Source material (operator-compiled):**

Karanis is one of the best-preserved Greco-Roman towns in Egypt and offers an extraordinary glimpse into everyday life during the Ptolemaic and Roman periods. Founded during the reign of the Ptolemies in the 3rd century BC, the city later flourished under Roman rule as an agricultural settlement supported by Fayoum's fertile irrigation system.

Visitors can walk through remarkably preserved mudbrick houses, streets, granaries, bathhouses, and temples dedicated to crocodile deities associated with Sobek worship. Unlike monumental temple sites, Karanis reveals the daily realities of ordinary ancient residents — from family homes to marketplaces and farming infrastructure.

The nearby Kom Ushim Museum complements the site with artifacts discovered during excavations, including statues, pottery, papyri, and funerary objects.

**Source citations:** fayoum.gov.eg, Real Fayoum Tours, Explore Fayoum
**Pre-launch priority:** **High** — most-visited Greco-Roman site in Al Fayoum

#### D.2 — Qasr Qarun (Dionysias)

**monumentType (proposed):** `temple`

**Source material (operator-compiled):**

Qasr Qarun is among the most atmospheric temples in Fayoum. Built during the Greco-Roman era, the temple was dedicated to Sobek and other local deities connected to fertility and water. Despite its relatively modest exterior, the structure contains a fascinating labyrinth of narrow corridors, chambers, stairways, and hidden rooms.

The temple's isolated desert location near the western edge of Lake Qarun creates a dramatic setting, especially at sunset when the golden light transforms the sandstone walls. Archaeologists believe the surrounding settlement once functioned as an important frontier community tied to trade and agriculture.

Today, the temple remains one of the most photogenic and mysterious monuments in the Fayoum Oasis.

**Source citations:** SIS (Egyptian State Information Service)
**Pre-launch priority:** **High** — photogenic, well-preserved, tourist-friendly

#### D.3 — Medinet Madi (Narmouthis)

**monumentType (proposed):** `temple` (multi-period site, but temple is the dominant draw)

**Source material (operator-compiled):**

Medinet Madi is considered one of the most impressive archaeological sites in Fayoum because it preserves both Pharaonic and Greco-Roman remains in exceptional condition. The original temple dates to the Middle Kingdom and was later expanded during the Ptolemaic and Roman periods.

Dedicated to the cobra goddess Renenutet and the crocodile god Sobek, the site includes beautifully preserved inscriptions, courtyards, towers, and processional avenues. The remote desert setting adds to the dramatic atmosphere of the ruins.

At night, the illuminated remains create one of the most visually striking archaeological experiences in Egypt.

**Source citations:** Explore Fayoum (pharaonic-monuments)
**Pre-launch priority:** **High** — multi-period preservation, dramatic illuminated nights, signature destination

#### D.4 — Seila Pyramid

**monumentType (proposed):** `pyramid`

**Source material (operator-compiled):**

The Pyramid of Seila is one of Egypt's lesser-known pyramids and likely formed part of a network of symbolic provincial pyramids built during the reign of Sneferu.

Unlike royal burial pyramids, Seila may have functioned as a ceremonial or political monument representing royal authority in the Fayoum region. The structure rises dramatically above the surrounding landscape and offers impressive views across the oasis edge and desert plains.

**Source citations:** Explore Fayoum (pharaonic-monuments)
**Pre-launch priority:** **High** — connects to Sneferu pyramid evolution narrative (cross-references Saqqara/Dahshur cohort)

#### D.5 — Tebtunis (Umm El-Baragat)

**monumentType (proposed):** `archaeological-site` (pending Track 9; default `other`)

**Source material (operator-compiled):**

Ancient Tebtunis was one of the major scholarly and religious centers of Greco-Roman Fayoum. The town became famous for its temple dedicated to the crocodile god Soknebtunis and for the extraordinary collection of papyri discovered there.

Excavations revealed houses, temples, cemeteries, administrative buildings, and written documents that provide valuable insight into daily life in Roman Egypt. Many of these papyri are now preserved in museums and universities around the world.

The site is particularly important for historians because it preserves evidence of both Egyptian religious traditions and strong Greek cultural influence during the Ptolemaic and Roman periods.

**Source citations:** Explore Fayoum (greaco-roman-monuments)
**Pre-launch priority:** **Medium** — major scholarly site, papyri-famous; appeals to Egyptology-interested tourists

#### D.6 — Qasr El-Sagha Temple

**monumentType (proposed):** `temple`

**Source material (operator-compiled):**

Hidden deep in the desert north of Lake Qarun, Qasr El-Sagha is one of Fayoum's most mysterious ancient temples. Built from massive sandstone blocks, the unfinished structure stands isolated among barren desert hills.

Scholars still debate the exact purpose and date of the temple, though most believe it originated during the Middle Kingdom. Its remote location and enigmatic appearance give the site a powerful sense of mystery rarely found elsewhere in Egypt.

**Source citations:** Explore Fayoum (pharaonic-monuments)
**Pre-launch priority:** **Medium** — atmospheric, off-beaten-path appeal

#### D.7 — Karanis Open Air Museum

**monumentType (proposed):** `museum`

**Source material (operator-compiled):**

The Karanis Open Air Museum contains large architectural fragments, statues, and stone monuments collected from archaeological excavations throughout Fayoum. Many of the displayed pieces date back to the Middle and New Kingdoms and were relocated from rescue excavations in Kiman Faris.

The museum allows visitors to appreciate monumental sculpture and temple architecture outside traditional indoor galleries while understanding the long continuity of civilization in Fayoum across thousands of years.

**Source citations:** Explore Fayoum (pharaonic-monuments)
**Pre-launch priority:** **Medium** — pairs with Karanis (D.1) site visit; best as cross-link

#### Deferred items (URL-only references)

Considered during Phase 3.5 Al Fayoum walkthrough but architect-deprioritized for inline capture. Operator can promote any to inline-capture status during pre-launch editorial work.

| # | Monument | Why deferred | Source URLs |
|---|---|---|---|
| 8 | Deir El-Azab (Monastery of the Virgin Mary) | Specialty Coptic interest; less tourist-broad | fayoumegypt.com/category/coptic-monuments, realfayoum.com/coptic-monuments |
| 9 | Monastery of Archangel Gabriel (Deir El-Malak Ghobrial) | Specialty Coptic interest | sis.gov.eg coptic-monuments-in-fayyoum |
| 10 | North of Lake Qarun (regional cluster) | Regional concept, not single monument; awkward fit for wikiMonument schema | fayoumegypt.com/category/coptic-monuments |
| 11 | Euhemeria (Qasr Banat) | Less-visited Greco-Roman; specialty interest | fayoumegypt.com/category/greaco-roman-monuments/page/2 |
| 12 | Greek Baths of Fayoum City | Architectural curiosity, not headline; awkward monumentType | fayoumegypt.com/category/greaco-roman-monuments |
| 13 | Kiman Faris (Shedet/Crocodilopolis) | Largely buried under modern Fayoum, limited visit experience | fayoumegypt.com/category/greaco-roman-monuments |

(Note: 12 absences total = 7 priority + 5–6 deferred; the table above lists 6 entries because Kiman Faris was added by the architect during deferral discussion. Operator can verify the final list during editorial pass.)

**Recommendation summary** for sub-section D:
- **Author the 7 priority items pre-launch:** ~30–60 min per monument × 7 = **~3.5–7 hours of operator editorial time**
- Body content can adapt the inline source material (rewrite in Travel2Egypt voice, original prose; do not direct-lift)
- All 7 should land in Al Fayoum's `placesToGo` array after editorial work
- Schema enum question (`archaeological-site` for Karanis, Tebtunis) tracked in **Track 9**
- The 5–6 deferred items remain candidates for promotion if pre-launch editorial scope allows

**Pre-launch priority for sub-section D:**
- **High:** Karanis, Qasr Qarun, Medinet Madi, Seila Pyramid (4 of 7)
- **Medium:** Tebtunis, Qasr El-Sagha, Karanis Open Air Museum (3 of 7)

**Cumulative Track 6 totals (post-sub-section-D):**

| Sub-section | City | Items | Type |
|---|---|---:|---|
| A | Cairo | 4 | absences |
| B | Giza | 4 | 3 absences + 1 body update |
| C | Aswan | 3 | absences |
| D | Al Fayoum | 7 priority + 5 deferred | inline-source-material absences |
| **Total inline** | — | **18** | priority items captured |
| **Total deferred** | — | **5** | URL-only references |

### E. Alexandria monument expansion (3 priority + 7 next-tier)

Surfaced during Phase 3.5 Alexandria placesToGo walkthrough (5th city in sequential review). Operator (Islam) confirmed Alexandria as one of two cities (alongside Luxor) warranting deep editorial expansion before launch. Alexandria's existing 5 placesToGo (Serapeum Temple, Royal Family Jewellery Museum, Greco-Roman Museum, Al-Mursi Abu Al-Abbas Mosque, National Museum) under-represent a Mediterranean coastal city with ~2,300 years of layered Hellenistic, Roman, Coptic, Islamic, and modern heritage.

Track 6 sub-section E captures 3 priority items with inline source material (matching Al Fayoum sub-section D depth) plus 7 next-tier items with URL-only references. Source material was web-researched during Phase 3.5 walkthrough; operator approved composite for capture.

**Note on pacing:** During Alexandria research, the architect (Claude) burned significant context on 3 monuments, leading to a pacing decision (path C — capture 3 deep + 7 light) rather than full 10-deep research in a single session. Architect flagged the underestimation as a process improvement note.

#### E.1 — Citadel of Qaitbay (Qaitbay Fort)

**monumentType (proposed):** `fortress`

**Source material (web-researched):**

The Citadel of Qaitbay stands on the eastern tip of Pharos Island at the mouth of Alexandria's Eastern Harbour, built between 1477 and 1479 AD by the Mamluk Sultan Al-Ashraf Sayf al-Din Qaitbay on the foundations of the legendary Lighthouse of Alexandria. The Lighthouse — one of the Seven Wonders of the Ancient World — collapsed across multiple earthquakes between the 11th and 14th centuries; Qaitbay's architects incorporated stones from the fallen lighthouse directly into the fortress walls, creating a tangible architectural bridge between ancient maritime wonder and Mamluk military mastery.

The fortress was Sultan Qaitbay's response to rising Ottoman naval threat in the Mediterranean following the fall of Constantinople in 1453. Designed by Mameluke architect Qagmas Al-Eshaqy at a cost of over 100,000 gold dinars, the citadel covers approximately 17,550 square meters with a square layout, defensive towers at each corner, and an inner courtyard centered on a three-story main keep. A mosque inside the citadel served the garrison. The structure functioned as Alexandria's primary coastal defense through the Mamluk and Ottoman periods until it was severely damaged during the British naval bombardment of 1882. King Farouk briefly converted it into a royal rest house in 1940–1941, and after the 1952 revolution the Egyptian Naval forces transformed it into a Maritime Museum. Major restoration work followed in 1984 and 2003.

Today the Citadel of Qaitbay is one of Alexandria's most photographed landmarks, offering panoramic Mediterranean views from its ramparts and serving as both cultural heritage site and active visitor destination. Its evening Sound and Light show narrates Alexandria's history from Alexander the Great through the Hellenistic, Roman, and Islamic eras.

**Source citations:** Egyptian Ministry of Tourism and Antiquities (egymonuments.gov.eg), Wikipedia (Citadel of Qaitbay), UNESCO (tentative list reference)

**Pre-launch priority:** **Highest** — iconic Alexandria photograph; appears in nearly every Alexandria tour itinerary; absence is glaring

#### E.2 — Pompey's Pillar (at the Serapeum site)

**monumentType (proposed):** `colossus` (operator may revise during authoring; alternatives: `obelisk` or `other`)

**Probe result (post-capture, prompt 55):** The existing `the-serapeum-temple` wikiMonument doc body **does mention Pompey's Pillar** under its "Current Status" section, framing it as the temple's most prominent surviving remnant. The mention is a single bullet, structurally part of the Serapeum entry rather than independent coverage. Operator decision pending: **(α)** accept current single-bullet treatment as adequate (no separate authoring); **(β)** author standalone Pompey's Pillar wikiMonument doc with cross-reference to the Serapeum entry — recommended for a monument of the Pillar's renown. Captured here per operator's earlier instruction to track regardless of probe result; if (α) chosen, this entry becomes a no-op rather than new authoring.

**Source material (web-researched):**

Pompey's Pillar stands at the heart of the ancient Serapeum complex, the largest Greco-Roman temple in Alexandria. The monument is a single 26.85m monolithic column of red Aswan granite weighing approximately 285 tons — one of the largest free-standing ancient columns ever erected outside Rome. Despite its name, the column has no connection to the Roman general Pompey; it was erected between 297–302 AD in honor of Emperor Diocletian, commemorating his suppression of an Alexandrian revolt. The misnomer arose from medieval Crusaders who confused the dedication's Greek inscription (naming the prefect "Publius") with the Roman name "Pompeius."

The pillar originally supported a colossal statue of Diocletian, estimated at 7m tall, now lost. The column stands within the ruined precinct of the Serapeum, the temple complex dedicated to the Greco-Egyptian syncretic god Serapis. Built by Ptolemy III Euergetes (246–222 BC) and rebuilt under Roman rule, the Serapeum housed the daughter library of the famed Library of Alexandria and rivaled Rome's Capitoline sanctuary in importance by the 4th century. The complex was destroyed in 391 AD by Christian mobs under Patriarch Theophilus following Emperor Theodosius I's decree banning paganism. Pompey's Pillar is the only ancient monument in Alexandria still standing in its original location.

The site today includes the pillar itself, two granite sphinx statues from Heliopolis flanking its base, narrow shafts descending into the Serapeum's underground chambers, and a surviving Nilometer used to measure the Nile's flood levels. The archaeological park is approximately a 10-minute drive from Alexandria's city center.

**Source citations:** Wikipedia (Pompey's Pillar, Serapeum of Alexandria), Lonely Planet, Egyptian travel resources

**Pre-launch priority:** High — only ancient monument in Alexandria standing in original location; iconic Alexandria photograph; pairs with Catacombs visit

#### E.3 — Catacombs of Kom el-Shoqafa

**monumentType (proposed):** `necropolis`

**Source material (web-researched):**

The Catacombs of Kom el-Shoqafa are an underground Roman-era necropolis in western Alexandria's Karmouz district, considered one of the Seven Wonders of the Middle Ages. Constructed in the 2nd century AD during the reign of the Antonine emperors and used until the late 4th century, the catacombs descend approximately 35 meters below ground across three levels (the lowest of which remains underwater due to groundwater infiltration). The name "Kom el-Shoqafa" means "Mound of Shards" in Arabic — visitors to the tombs would bring food and wine for commemorative meals but break the containers rather than carry them home, leaving heaps of terracotta fragments at the surface.

The site was discovered by accident on September 28, 1900, when a donkey fell through an unstable opening at the surface. German archaeologists subsequently excavated the complex, revealing one of the most remarkable architectural fusions of Egyptian, Greek, and Roman traditions in the ancient world. A circular spiral staircase — historically used to lower deceased bodies into the chambers — leads down to a vestibule, a rotunda with six pillars, a triclinium (funeral banquet hall) where families gathered for commemorative meals, and the principal burial chamber. The chamber's iconography exemplifies Alexandria's syncretic culture: Egyptian deities like Anubis appear in Roman soldiers' uniforms, while Greek mythological scenes (the Abduction of Persephone) appear alongside Egyptian funerary imagery (winged solar discs, falcon-Horus motifs, mummification scenes).

Originally constructed as a private family tomb, the catacombs expanded over the 2nd–4th centuries to accommodate over 300 burials, including a possible "Hall of Caracalla" where bones suggest victims of Emperor Caracalla's 215 AD massacre may have been interred. The site is recognized by UNESCO and represents the largest Roman burial site in Egypt.

**Source citations:** Wikipedia (Catacombs of Kom El Shoqafa), Inside-Egypt, alexandria.gov.eg, TheCollector

**Pre-launch priority:** High — UNESCO-recognized; one of the most-visited Alexandria sites; pairs with Pompey's Pillar in standard tour itineraries

#### Next-tier items (URL-only references, deferred)

These were considered during Phase 3.5 Alexandria walkthrough but research deferred for context-window economy. Operator can promote any to inline-capture status during pre-launch editorial work.

| # | Monument | Why notable | Recommended sources |
|---|---|---|---|
| E.4 | **Roman Theatre at Kom el-Dikka** | Best-preserved Roman amphitheater in Egypt + adjacent Villa of the Birds mosaics | egymonuments.gov.eg, Wikipedia (Kom el-Dikka) |
| E.5 | **Bibliotheca Alexandrina** | Modern (2002) but iconic; spiritual successor to ancient Library; debatable as "monument" but tourists treat as one | bibalex.org (official), UNESCO |
| E.6 | **Anfushi Tombs** | Hellenistic-period necropolis in Anfushi neighborhood; lesser-visited counterpart to Kom el-Shoqafa | egymonuments.gov.eg |
| E.7 | **Mustafa Kamel Tombs** | Hellenistic necropolis; well-preserved frescoes | egymonuments.gov.eg |
| E.8 | **Montaza Palace and Gardens** | Royal palace + extensive gardens on the Mediterranean; major Alexandria public attraction | Egyptian government tourism sources |
| E.9 | **Ras el-Tin Palace** | Royal palace in Ras el-Tin neighborhood; current presidential summer residence | Egyptian government sources (limited public access) |
| E.10 | **Cavafy Museum (Cavafy House)** | Constantine P. Cavafy's preserved residence; modernist literary heritage | Cavafy Archive, literary tourism guides |

**Recommendation summary** for sub-section E:

- Author the 3 priority items (Citadel of Qaitbay, Pompey's Pillar, Catacombs) pre-launch using the inline source material as starting point: ~30–60 min per monument × 3 = **~1.5–3 hours editorial time**
- For 7 next-tier items: research + author in a future Alexandria expansion pass; total estimated work **~4–7 hours** including web research + composition
- All 10 should land in Alexandria's `placesToGo` array post-authoring, bringing Alexandria from 5 → 15 places (comparable to Aswan's 11)

**Pre-launch priority for sub-section E:**

- **Highest:** Citadel of Qaitbay (E.1)
- **High:** Pompey's Pillar (E.2), Catacombs of Kom el-Shoqafa (E.3), Roman Theatre at Kom el-Dikka (E.4), Bibliotheca Alexandrina (E.5)
- **Medium:** Anfushi Tombs, Mustafa Kamel Tombs, Montaza Palace, Ras el-Tin Palace, Cavafy Museum (E.6–E.10)

**Cumulative Track 6 totals (post-sub-section-E):**

| Sub-section | City | Inline | Deferred/light | Type |
|---|---|---:|---:|---|
| A | Cairo | 4 | — | absences |
| B | Giza | 4 | — | 3 absences + 1 body update |
| C | Aswan | 3 | — | absences |
| D | Al Fayoum | 7 | 5 | inline source material |
| E | Alexandria | 3 | 7 | 3 inline + 7 URL-only |
| **Total** | — | **21 priority** | **12 deferred** | **33 items** |

### F. Luxor monument expansion (11 new authoring + 2 body enrichments)

Surfaced during Phase 3.5 Luxor placesToGo walkthrough (6th city in sequential review). Operator (Islam) confirmed Luxor as the second of two cities (alongside Alexandria) warranting deep editorial expansion before launch. Luxor is one of the densest monument concentrations in Egypt — ancient Thebes — and the existing 5 placesToGo (Luxor Temple, Colossi of Memnon, Luxor Museum, Madinat Habu Temple, Karnak Temple) under-represent the West Bank Theban Necropolis cluster substantially.

Operator pre-prepared comprehensive source material for 13 items: 11 net-new monuments requiring authoring plus 2 body enrichments for already-cohort monuments (Medinet Habu and Colossi of Memnon). This is the largest Track 6 sub-section by item count.

**Note on "body enrichments" vs "absences":** Items F.12 and F.13 are NOT new authoring — they enrich existing wikiMonument bodies with substantially more substantial source material. Operator pre-prepared content significantly deeper than the current cohort docs. F.12 (Medinet Habu) also raises a monumentType refinement question: current `temple` could be `mortuary-temple` for editorial precision.

#### F.1 — Valley of the Kings

**monumentType (proposed):** `necropolis`

**Source material (operator-provided):**

Hidden deep within the barren cliffs of Luxor's western desert lies the Valley of the Kings, the royal necropolis of Egypt's New Kingdom pharaohs. From the 18th to the 20th Dynasties, this isolated valley became the chosen burial ground of kings who once ruled one of the most powerful empires of the ancient world. Rather than building visible pyramids vulnerable to robbery, the pharaohs carved elaborate tombs directly into the mountain itself, transforming the landscape into a sacred gateway to eternity.

The valley contains more than sixty tombs, including those of famous rulers such as Tutankhamun, Seti I, Ramesses II, and Ramesses VI. The interiors were designed not merely as burial chambers, but as spiritual maps for the afterlife. Their walls are covered with richly colored scenes from funerary texts such as the Book of the Dead, the Amduat, and the Book of Gates, guiding the king through the dangerous journey across the underworld toward rebirth with the rising sun.

Unlike temples built for public ceremonies, these tombs were deeply symbolic and intensely personal. Every corridor, chamber, and painted figure served a ritual purpose connected to resurrection, divine kingship, and cosmic order. The valley also reveals the remarkable craftsmanship of the artisans of Deir el-Medina, whose precision and artistry transformed solid rock into some of the greatest funerary monuments ever created.

**Source citations:** Wander Wise Tours, Egyptian government tourism sources
**Pre-launch priority:** **Highest** — most-visited Luxor site after Karnak; absence is glaring

#### F.2 — Temple of Hatshepsut (Deir el-Bahari)

**monumentType (proposed):** `mortuary-temple`

**Source material (operator-provided):**

Rising dramatically against the limestone cliffs of Deir el-Bahari, the Temple of Hatshepsut is one of the most elegant and architecturally revolutionary monuments of ancient Egypt. Built during the 18th Dynasty for Queen Hatshepsut, one of the very few women to rule Egypt as pharaoh, the temple was designed not simply as a mortuary sanctuary, but as a bold political statement carved into the landscape itself.

Known in antiquity as Djeser-Djeseru — "The Holy of Holies" — the temple unfolds across three grand terraces connected by ramps and lined with graceful colonnades. Its unusual harmony with the surrounding cliffs creates a striking visual composition unlike almost any other Egyptian monument. The temple was dedicated to the god Amun as well as to the eternal cult of Hatshepsut herself.

Its reliefs provide extraordinary insight into the ambitions of Hatshepsut's reign. Scenes depict her divine birth, trading expeditions to the mysterious Land of Punt, religious rituals, and offerings to the gods. Particularly important are the images presenting her as a legitimate ruler chosen by Amun, reflecting the political challenge of ruling as a female pharaoh within a traditionally male institution.

The upper terrace once featured Osiride statues of Hatshepsut, portraying her in the form of Osiris, god of rebirth and the afterlife. Even today, traces of ancient color remain visible across parts of the temple. Recent excavations around the site have also uncovered decorated blocks and architectural fragments that continue to deepen modern understanding of the temple's original grandeur.

**Source citations:** egymonuments.gov.eg, Reuters
**Pre-launch priority:** **Highest** — iconic terraced temple; one of the most-photographed Luxor sites

#### F.3 — Ramesseum

**monumentType (proposed):** `mortuary-temple`

**Source material (operator-provided):**

The Ramesseum was the grand memorial temple of Ramesses II, the legendary pharaoh often remembered as Ramesses the Great. Built on Luxor's West Bank during the 19th Dynasty, the temple once stood among the most impressive monuments in ancient Thebes, celebrating the military achievements, divine authority, and eternal legacy of one of Egypt's longest-ruling kings.

The temple complex originally featured enormous pylons, colossal statues, ceremonial courts, storerooms, and sacred halls dedicated to the cult of Ramesses II and the god Amun. Although much of the structure now lies in ruins due to earthquakes and centuries of stone reuse, the surviving remains still convey the monument's former magnificence.

One of the most famous remnants is the shattered colossal statue of Ramesses II, once among the largest statues ever carved in ancient Egypt. Fragments of this immense sculpture inspired the poet Percy Bysshe Shelley's famous poem *Ozymandias*, turning the ruins into a symbol of the impermanence of earthly power.

The walls of the Ramesseum contain reliefs depicting Ramesses II's military campaigns, particularly the Battle of Kadesh against the Hittites — one of the most celebrated royal narratives of ancient Egyptian history. These scenes blend propaganda, religion, and royal ideology, portraying the king as both a victorious warrior and a divinely protected ruler.

Even in ruin, the Ramesseum remains deeply atmospheric, offering insight into how New Kingdom pharaohs sought immortality through monumental architecture and sacred ritual.

**Source citations:** Stjernegaard Rejser
**Pre-launch priority:** **High** — Ramesses II's memorial temple; literary connection to Shelley's *Ozymandias*

#### F.4 — Deir el-Medina (Workers' Village)

**monumentType (proposed):** `archaeological-site` (per Track 9 — multi-monument settlement; pending schema enum addition)

**Source material (operator-provided):**

Tucked between the cliffs of Luxor's western mountains lies Deir el-Medina, one of the most important archaeological discoveries ever made for understanding daily life in ancient Egypt. Unlike the temples and royal tombs built for kings and gods, this remarkably preserved village belonged to the highly skilled craftsmen and artisans responsible for constructing and decorating the tombs of the Valley of the Kings and Valley of the Queens.

Established during the 18th Dynasty and inhabited for nearly four hundred years, the settlement functioned as a tightly organized community of elite workers employed directly by the royal administration. The residents included painters, stonecutters, sculptors, draftsmen, and scribes — the very people who created some of the greatest masterpieces of ancient Egyptian funerary art.

What makes Deir el-Medina extraordinary is the amount of information it has preserved. Excavations uncovered houses, personal belongings, tools, religious shrines, administrative documents, and thousands of ostraca — fragments of limestone and pottery used as writing surfaces. These records reveal details about wages, labor disputes, illnesses, holidays, marriages, legal conflicts, and even personal gossip. Through them, historians gained an unprecedented understanding of the human side of ancient Egyptian civilization.

The village tombs themselves are among the finest non-royal tombs in Egypt. Their interiors are often smaller than royal tombs, yet remarkably vibrant and expressive. Many preserve intensely colorful scenes depicting gods, family members, funerary rituals, and personal prayers for protection in the afterlife. Because the tomb owners were artists themselves, the decoration quality is exceptionally refined.

The site also reflects the strong religious beliefs of the workers' community. Chapels dedicated to Hathor, Ptah, Meretseger, and other protective deities reveal how deeply spirituality shaped the lives of those working in the dangerous environment of the royal necropolis.

More than almost anywhere else in Egypt, Deir el-Medina transforms ancient Egyptians from distant historical figures into real people — workers with families, ambitions, frustrations, humor, and deeply personal beliefs about life and death.

**Source citations:** egymonuments.gov.eg, Wikipedia, Nile Holiday
**Pre-launch priority:** **High** — UNESCO-recognized; deepens visitor experience beyond temples; pairs with Valley of the Kings/Queens visits

#### F.5 — Mummification Museum

**monumentType (proposed):** `museum`

**Source material (operator-provided):**

Nestled quietly along the Nile Corniche beside Luxor Temple, the Mummification Museum is one of Luxor's smallest museums — yet also one of its most intellectually fascinating. Unlike the grand archaeological museums that focus on statues, temples, or royal treasures, this museum is devoted entirely to one of ancient Egypt's most misunderstood practices: the preparation of the dead for eternity.

Opened in 1997 as the first museum in the world dedicated exclusively to mummification, the museum was designed to explain the religious philosophy, scientific methods, and ritual symbolism behind the ancient Egyptian belief in preservation after death.

For the ancient Egyptians, mummification was never simply a technical process. It was a sacred transformation tied to resurrection, rebirth, and the journey into the afterlife. The museum carefully walks visitors through this belief system, beginning with scenes inspired by funerary papyri and continuing into displays of embalming tools, natron salts, linen wrappings, canopic jars, protective amulets, ritual oils, and coffins.

One of the museum's greatest strengths is that it demonstrates how mummification extended beyond humans alone. Ancient Egyptians also embalmed sacred animals associated with particular gods, and the collection includes mummified crocodiles, cats, fish, and birds connected to religious cults and temple worship. These exhibits help visitors understand how closely religion, daily life, and the natural world were intertwined in ancient Egyptian belief systems.

Among the museum's most remarkable objects is the mummy of Masaharta, a high priest of Amun from the 21st Dynasty, displayed alongside beautifully preserved funerary equipment. The museum's restrained lighting, focused presentation, and carefully curated displays create an atmosphere that feels contemplative rather than overwhelming — a sharp contrast to the scale and intensity of Luxor's monumental temples.

What makes the Mummification Museum particularly valuable is its ability to bridge archaeology and spirituality. Visitors leave not simply understanding how bodies were preserved, but why the ancient Egyptians invested such extraordinary care into preparing for eternity. For anyone seeking a deeper understanding of ancient Egyptian religion rather than only monumental architecture, this museum offers one of the most rewarding experiences in Luxor.

**Source citations:** Wikipedia, egymonuments.gov.eg, Tripadvisor
**Pre-launch priority:** **Medium-High** — first-of-kind museum globally; beside Luxor Temple = high foot traffic; deepens religious education

#### F.6 — Karnak Open-Air Museum

**monumentType (proposed):** `museum`

**Source material (operator-provided):**

Hidden within the vast Karnak Temple Complex lies one of Luxor's most overlooked archaeological treasures: the Karnak Open-Air Museum. While most visitors focus on Karnak's colossal columns and monumental pylons, this remarkable section of the complex reveals something equally important — how ancient Egyptian temples evolved over centuries through dismantling, rebuilding, and architectural transformation.

The museum was established to preserve and reconstruct monuments that had originally disappeared inside Karnak's later structures. As successive pharaohs expanded the temple complex, many earlier chapels and shrines were dismantled, their stones reused as filling material inside pylons and walls. Modern excavations uncovered thousands of these decorated blocks, allowing archaeologists to painstakingly reconstruct some of Egypt's most important ceremonial shrines.

Among the museum's masterpieces is the White Chapel of Senusret I, one of the finest surviving examples of Middle Kingdom architecture. Built from finely carved limestone and quartzite, the chapel once served as a ceremonial kiosk associated with royal jubilee rituals. Its reliefs preserve elegant scenes of the king before the gods and detailed depictions of Egypt's ancient provinces.

Equally remarkable is the Red Chapel of Hatshepsut, originally constructed as a sacred barque shrine for the god Amun during the reign of the female pharaoh Hatshepsut. The chapel's beautifully preserved reliefs portray religious processions, divine rituals, and scenes designed to legitimize Hatshepsut's rule through her connection to Amun. The reconstructed monument provides rare insight into the artistic refinement and political messaging of the 18th Dynasty.

Other reconstructed monuments include the calcite shrine of Amenhotep II, the alabaster chapel of Amenhotep I, and shrines linked to Thutmose III and Thutmose IV. Together, these structures create a kind of architectural timeline, allowing visitors to trace how religious art, royal ideology, and temple construction changed across different dynasties.

Unlike the monumental scale of Karnak's hypostyle halls, the Open-Air Museum rewards careful observation. Here, visitors can study delicate relief carving, original pigments, inscriptions, and construction techniques often impossible to appreciate elsewhere in the complex. It is also one of the best places in Luxor to understand the layered nature of Egyptian temples — monuments continuously altered, expanded, dismantled, and reborn over nearly two thousand years of history.

For travelers interested in archaeology rather than only spectacle, the Karnak Open-Air Museum is one of Luxor's essential experiences.

**Source citations:** Wikipedia, Tripadvisor
**Pre-launch priority:** **Medium** — sub-component of Karnak Temple complex; specialty interest

#### F.7 — Luxor Sound and Light Show at Karnak

**monumentType (proposed):** `other` (it's a performance/experience, not a physical monument; alternatives below)

**Source material (operator-provided):**

Long after the daytime crowds leave Karnak Temple and the desert sky darkens over ancient Thebes, the temple complex transforms into something entirely different. The Luxor Sound and Light Show at Karnak is not simply an evening performance, but an atmospheric journey through the history, mythology, and grandeur of one of the greatest religious complexes ever built.

Set within the vast temple of Amun at Karnak, the experience uses dramatic illumination, narration, music, and shadow to bring the ruins back to life beneath the night sky. Visitors move gradually through the temple complex as voices representing ancient pharaohs and priests recount the rise of Thebes, the glory of Egypt's empire, and the sacred role of Karnak within ancient Egyptian religion.

The setting itself is what makes the experience unforgettable. Massive columns emerge from darkness in shifting gold and blue light. Hieroglyphs become visible across towering walls. Obelisks and statues appear almost suspended in silence as music echoes through the ancient stone halls. Unlike a daytime visit focused on archaeology and photography, the nighttime atmosphere emphasizes emotion, scale, and imagination.

The show particularly highlights Karnak's connection to Amun, the supreme deity of Thebes, as well as the achievements of pharaohs who expanded the complex over centuries, including Seti I, Ramesses II, Hatshepsut, and Thutmose III. Through narration and carefully staged lighting, the temple becomes a storytelling space where architecture itself serves as the stage for ancient Egyptian history.

The experience concludes beside Karnak's Sacred Lake, where reflections of illuminated columns shimmer across the water while the final part of the narration unfolds. This quieter ending creates a striking contrast to the monumentality of the temple interiors and leaves visitors with a rare sense of Karnak not merely as a ruin, but as a living ceremonial landscape once filled with ritual, processions, priests, and sacred performance.

While the Sound and Light Show is theatrical by nature, it remains one of Luxor's most iconic evening experiences because it allows visitors to encounter Karnak in a completely different emotional register — mysterious, immersive, and deeply atmospheric beneath the stars of Upper Egypt.

**Source citations:** soundandlight.show, Tripadvisor
**Pre-launch priority:** **Medium** — popular evening experience; categorized differently from physical monuments. Operator decision pending: wikiMonument with `monumentType: other`, OR a different content type entirely (similar question to Track 8 visual itinerary considerations)
**Schema/architecture note:** This is the first Track 6 entry that may not fit cleanly into the wikiMonument schema. Operator may want to consider whether wikiMonument is the right home for ticketed experiences/performances vs. a separate content type.

#### F.8 — Valley of the Queens

**monumentType (proposed):** `necropolis`

**Source material (operator-provided):**

Southwest of the Valley of the Kings, hidden within the rugged desert cliffs of Luxor's West Bank, lies the Valley of the Queens — the burial ground of royal women, princes, and members of the ancient Egyptian elite during the New Kingdom. Known in antiquity as Ta-Set-Neferu, meaning "The Place of Beauty," the valley reflects not only the prestige of Egypt's royal families, but also evolving beliefs about the afterlife and divine rebirth.

The valley contains more than ninety tombs dating primarily from the 19th and 20th Dynasties. Although smaller in scale than the royal tombs of the Valley of the Kings, many of these chambers are among the most refined and emotionally expressive funerary monuments in Egypt. Their walls are covered with brilliantly painted scenes showing queens and royal children interacting with gods, navigating the underworld, and preparing for eternal life.

The most celebrated tomb in the valley belongs to Queen Nefertari, the beloved wife of Ramesses II. Widely regarded as one of the finest decorated tombs ever discovered in Egypt, its extraordinary paintings are often described as the "Sistine Chapel of Ancient Egypt." The vivid colors, elegant proportions, and delicate artistic details remain astonishingly preserved more than three thousand years after their creation. Scenes portray Nefertari being guided through the afterlife by gods such as Isis, Hathor, and Anubis, reflecting both royal ideology and deeply personal spiritual hopes.

Unlike the Valley of the Kings, where royal power dominates the decoration programs, the Valley of the Queens often feels more intimate and human. The artistic focus shifts toward themes of protection, rebirth, motherhood, beauty, and divine care. Many tombs emphasize tenderness and grace rather than military triumph or royal propaganda.

The valley also provides insight into the social structure of New Kingdom Egypt. Alongside queens and royal children, some high-ranking officials connected to the royal court were also buried here, reflecting the prestige attached to proximity to the pharaoh's household.

Today, the Valley of the Queens remains one of Luxor's most atmospheric and emotionally resonant archaeological sites — a quieter, more delicate counterpart to the monumental grandeur of the Valley of the Kings.

**Source citations:** egymonuments.gov.eg, Wikipedia (Tomb of Nefertari)
**Pre-launch priority:** **Highest** — Nefertari's tomb is iconic; pairs with Valley of the Kings as a paired West Bank visit

#### F.9 — Tombs of the Nobles (Sheikh Abd el-Qurna)

**monumentType (proposed):** `necropolis` (or `archaeological-site` if the cluster is treated as a settlement; pending Track 9)

**Source material (operator-provided):**

Scattered across the hills of Sheikh Abd el-Qurna on Luxor's West Bank are hundreds of tombs belonging not to kings, but to the nobles, officials, priests, scribes, and administrators who helped govern ancient Egypt during the New Kingdom. Collectively known as the Tombs of the Nobles, these burial sites offer one of the richest and most revealing portraits of everyday life in ancient Egypt.

Unlike royal tombs, which focus heavily on religious texts and the pharaoh's divine journey through the underworld, noble tombs often celebrate the life the tomb owner actually lived. Their walls depict vivid scenes of banquets, agricultural work, hunting, fishing, music, craftsmanship, family gatherings, and religious ceremonies. Together, they form an extraordinary visual archive of ancient Egyptian society.

Many of the tombs date to the 18th Dynasty, a period when Thebes became the political and religious heart of Egypt's empire. Officials buried here often served under famous rulers such as Hatshepsut, Thutmose III, Amenhotep III, and Akhenaten. Their titles included overseers of granaries, royal scribes, temple priests, architects, and diplomats — positions that reveal the complexity of Egypt's administrative system.

Among the most remarkable tombs are those of Rekhmire, Ramose, Sennefer, and Nakht. The Tomb of Rekhmire, for example, preserves detailed scenes of foreign tribute arriving from Nubia, Syria, and the Aegean, illustrating Egypt's international connections during the height of the empire. The Tomb of Nakht is famous for its beautifully painted agricultural and banquet scenes, while the Tomb of Sennefer features a richly decorated ceiling covered with vines and grapes, earning it the nickname "The Tomb of the Vineyards."

Architecturally, the tombs vary from simple chambers to elaborate multi-room complexes with pillared halls and chapels. Their artistic styles also evolved over time, allowing visitors to trace changing fashions, religious ideas, and painting techniques across generations.

What makes Sheikh Abd el-Qurna especially fascinating is the human perspective it provides. Here, ancient Egypt feels less distant and ceremonial. The scenes are filled with movement, music, humor, labor, and family life — reminders that beyond the pharaohs and temples stood a sophisticated society of individuals whose stories still survive in painted stone.

**Source citations:** exploreluxor.org, egymonuments.gov.eg
**Pre-launch priority:** **High** — major specialty site; complements Valley of the Kings/Queens; F.10 (Tomb of Ramose) is a sub-component but treated as own entry per operator decision

#### F.10 — Tomb of Ramose (TT55)

**monumentType (proposed):** `tomb`

**Architectural note:** Tomb of Ramose is geographically and contextually a sub-component of the Tombs of the Nobles cluster (F.9 — Sheikh Abd el-Qurna). Operator decided to capture as own entry given the source material depth and historical importance. Future cross-linking between F.9 and F.10 advisable when both are authored.

**Source material (operator-provided):**

Hidden among the noble tombs of Sheikh Abd el-Qurna on Luxor's West Bank, the Tomb of Ramose is one of the most historically important tombs in all of ancient Egypt — not because of the man buried there alone, but because its walls capture a civilization in the middle of transformation.

Ramose served as vizier and governor of Thebes during the late reign of Amenhotep III and the early years of Amenhotep IV, the pharaoh later known as Akhenaten. His tomb, designated TT55, was constructed precisely during the moment when Egypt began shifting away from the traditional worship of Amun toward the radical Aten-centered religious revolution that would define the Amarna Period. Because of this, the tomb preserves one of the clearest visual transitions between classical New Kingdom art and the emerging Amarna artistic style.

Architecturally, the tomb is among the grandest in the Valley of the Nobles. Visitors enter through an open courtyard into a vast hypostyle hall originally supported by thirty-two papyrus-shaped columns, followed by a secondary pillared chamber and an unfinished shrine area deeper inside the monument. Although the tomb was never fully completed, its unfinished state actually reveals how ancient Egyptian artists planned and carved reliefs step by step, with sketched outlines still visible on certain walls.

What makes the tomb extraordinary is the coexistence of two completely different artistic worlds within the same monument. On some walls, the decoration follows the refined elegance of traditional Theban art under Amenhotep III — idealized figures, balanced compositions, and formal religious scenes associated with the worship of Amun and the old gods. Yet elsewhere, the style changes dramatically. Figures become elongated and more naturalistic, movement appears freer, and the sun disk of the Aten stretches its rays downward toward the royal family in unmistakable Amarna fashion.

Among the tomb's most famous scenes is the depiction of Amenhotep IV (Akhenaten) and Queen Nefertiti appearing on the "Window of Appearances," showering Ramose with the "Gold of Honour," one of the highest distinctions awarded by the royal court. Above them, the Aten extends protective rays ending in tiny hands, symbolizing divine life flowing directly from the sun god. The scene is remarkable not only artistically, but politically — capturing the earliest visible stages of Akhenaten's religious revolution before the complete abandonment of traditional Egyptian religion.

Other reliefs depict funerary processions, mourning women, priests performing rituals, musicians, family members, and attendants carrying offerings. Some of these carvings are considered masterpieces of 18th Dynasty art, particularly the emotional scenes of lamentation and funeral ceremonies. The craftsmanship is exceptionally refined, with delicate facial expressions and fluid movement rarely matched elsewhere in the Theban necropolis.

Scholars also believe the tomb may never have been fully used. When Akhenaten later moved the royal court to Amarna, Ramose may have followed him northward, leaving TT55 unfinished. No confirmed burial of Ramose has ever been identified inside the tomb, adding another layer of mystery to the monument.

Today, the Tomb of Ramose remains one of Luxor's most intellectually fascinating sites. More than a burial monument, it is a visual record of one of the most dramatic religious and artistic shifts in Egyptian history — a place where the old world of Thebes and the revolutionary vision of Akhenaten briefly coexist on the same walls before Egypt changed forever.

**Source citations:** Madain Project, Wikipedia, Ancient Cultures Institute, Egyptian Monuments, Goota Travel, Reflections in the Nile
**Pre-launch priority:** **High** — historically significant transitional artwork; specialty depth attractive to Egyptology-interested visitors

#### F.11 — Howard Carter's House (Museum)

**monumentType (proposed):** `museum`

**Source material (operator-provided):**

On the edge of Luxor's West Bank, near the entrance to the Valley of the Kings, stands the modest mudbrick home of Howard Carter, the British archaeologist whose discovery of Tutankhamun's tomb in 1922 became one of the greatest archaeological finds in history. Today preserved as a small museum, the house offers a rare glimpse into the world of early twentieth-century Egyptology and the man whose persistence transformed modern understanding of ancient Egypt.

Howard Carter lived here during many excavation seasons while working in the Theban Necropolis under the sponsorship of Lord Carnarvon. From this quiet residence, Carter planned surveys, catalogued discoveries, studied artifacts, and organized the search that ultimately led to the intact tomb of the young pharaoh Tutankhamun after years of frustration and near failure.

Unlike Luxor's monumental temples, the house feels personal and understated. The rooms have been restored with period furniture, maps, photographs, excavation equipment, and replicas associated with Carter's work. Visitors can see his office, bedroom, drawing spaces, and study areas, offering insight into the daily routines of archaeologists working in Egypt during the golden age of exploration.

One of the museum's highlights is the recreation of Carter's darkroom, where photographs documenting the excavation of Tutankhamun's tomb were developed. These images became some of the most famous archaeological photographs ever taken and played a major role in shaping global fascination with ancient Egypt.

The house also reflects the changing nature of archaeology itself. Carter worked during a period when Egyptology was evolving from treasure hunting into a more systematic scientific discipline focused on documentation, conservation, and historical analysis. His meticulous recording of Tutankhamun's tomb contents remains one of archaeology's greatest achievements.

Although small, Howard Carter's House carries immense historical significance. It connects visitors not only to ancient Egypt, but also to the modern rediscovery of the pharaohs — a moment that forever changed how the world imagined the civilization of the Nile.

**Source citations:** egymonuments.gov.eg, Wikipedia
**Pre-launch priority:** **Medium** — modern history (not ancient); specialty interest tied to Tutankhamun discovery; near Valley of the Kings entrance = high foot traffic

#### F.12 — Medinet Habu (BODY ENRICHMENT — existing wikiMonument)

**Existing wikiMonument:** `madinat-habu-temple` (currently in cohort)
**Current `monumentType`:** `temple`
**Proposed `monumentType`:** `mortuary-temple` (more precise — Medinet Habu is Ramesses III's mortuary temple, not a generic temple)
**Action type:** **Body enrichment + monumentType change**

**Source material (operator-provided) — to enrich existing body content:**

Often considered one of Luxor's most underrated masterpieces, Medinet Habu is the vast mortuary temple complex of Ramesses III, the last great warrior king of the New Kingdom. Located on Luxor's West Bank near the Theban hills, the complex is celebrated for its extraordinary state of preservation, monumental scale, and remarkably vivid reliefs that still retain traces of their original colors after more than three thousand years.

The temple was constructed during the 20th Dynasty and dedicated both to the funerary cult of Ramesses III and to the worship of the god Amun. Architecturally, it follows the traditions of earlier royal mortuary temples such as the Ramesseum, yet surpasses many of them in preservation and detail. Massive pylons, fortified gateways, ceremonial courts, chapels, magazines, and palace areas once formed part of a self-contained sacred city.

What makes Medinet Habu particularly significant are its historical reliefs. The temple preserves some of the most important visual records of the battles fought against the mysterious "Sea Peoples," whose invasions threatened Egypt and much of the eastern Mediterranean during the late Bronze Age. These carved battle scenes remain among the most valuable military records from the ancient world.

Beyond its political importance, the temple offers a rare emotional sense of ancient Egypt still alive. The colors, textures, and carved hieroglyphs remain unusually clear, allowing visitors to experience something remarkably close to what the temple may have looked like during the height of the New Kingdom.

**Source citations:** Luxor and Aswan, egymonuments.gov.eg, Wikipedia
**Pre-launch priority:** **High** — existing doc body is thin; this enrichment substantially deepens the editorial value; monumentType change addresses taxonomy precision

#### F.13 — Colossi of Memnon (BODY ENRICHMENT — existing wikiMonument)

**Existing wikiMonument:** `the-colossi-of-memnon` (currently in cohort)
**Current `monumentType`:** `colossus` ✓ (correct, no change)
**Action type:** **Body enrichment only**

**Source material (operator-provided) — to enrich existing body content:**

Standing silently on Luxor's West Bank for more than 3,400 years, the Colossi of Memnon are two gigantic seated statues of Pharaoh Amenhotep III, once guarding the entrance to his vast mortuary temple. Although the temple itself has largely disappeared due to floods, earthquakes, and centuries of stone removal, the colossi continue to dominate the landscape as enduring symbols of ancient Thebes.

Each statue depicts Amenhotep III seated upon his throne, facing east toward the Nile and the rising sun — a symbolic orientation associated with rebirth and renewal. Smaller carved figures beside the king portray members of the royal family, including Queen Tiye and the king's mother Mutemwiya.

During antiquity, the statues became famous throughout the Greco-Roman world because one of them reportedly emitted mysterious sounds at dawn following earthquake damage. Ancient travelers associated the phenomenon with Memnon, a mythical Ethiopian hero of the Trojan War, giving the statues the name by which they are still known today.

Modern restoration work has helped recover part of the original grandeur of Amenhotep III's mortuary complex, which was once among the largest and richest temple complexes ever built in Egypt. Today, the colossi remain one of Luxor's most iconic landmarks and one of the earliest monuments encountered by travelers exploring the Theban Necropolis.

**Source citations:** Luxor and Aswan
**Pre-launch priority:** **High** — existing doc body is thin; this enrichment substantially deepens the editorial value

**Recommendation summary** for sub-section F:

- 11 net-new items (F.1–F.11): author wikiMonument docs editorially in Sanity Studio before launch
- 2 body enrichments (F.12, F.13): update existing wikiMonument doc bodies with the provided source material; for F.12 (Medinet Habu), also change `monumentType` `temple` → `mortuary-temple`
- Total estimated work: 11 × ~30–60 min new authoring (~5.5–11 hours) + 2 × ~15–30 min body updates (~30–60 min) = **~6–12 hours of operator editorial time for Luxor expansion**
- All items should land in Luxor's `placesToGo` array, bringing Luxor from 5 → 16 places (largest Luxor expansion to date)

**Pre-launch priority for sub-section F:**
- **Highest:** Valley of the Kings (F.1), Temple of Hatshepsut (F.2), Valley of the Queens (F.8)
- **High:** Ramesseum (F.3), Deir el-Medina (F.4), Tombs of the Nobles (F.9), Tomb of Ramose (F.10), Medinet Habu body update (F.12), Colossi of Memnon body update (F.13)
- **Medium-High:** Mummification Museum (F.5)
- **Medium:** Karnak Open-Air Museum (F.6), Luxor Sound and Light Show (F.7), Howard Carter's House (F.11)

**Cumulative Track 6 totals (post-sub-section-F):**

| Sub-section | City | Inline | Deferred/light | Total |
|---|---|---:|---:|---:|
| A | Cairo | 4 | — | 4 |
| B | Giza | 4 | — | 4 |
| C | Aswan | 3 | — | 3 |
| D | Al Fayoum | 7 | 5 | 12 |
| E | Alexandria | 3 | 7 | 10 |
| F | Luxor | 13 | — | 13 (11 new + 2 body updates) |
| **Total** | — | **34 priority** | **12 deferred** | **46 items** |

## Track 8: Visual Itinerary / Travel Infographic Content Type

### A. Concept

Surfaced during Phase 3.5 Giza walkthrough. Operator floated the idea of adding Monocle-style travel-infographic content to the Travel2Egypt site. Reference: a *"How to Tour the Giza Pyramids Area"* infographic combining a hand-illustrated map, a numbered route (1 → 2 → 3 → 4 → 5 → 6), an essentials sidebar (arrive early, sun protection, comfortable shoes, water, etc.), and additional context boxes (getting there, tickets, nearby stops, further afield, good to know).

The Monocle Travel Guides aesthetic combines hand-illustrated maps, numbered route waypoints, an essentials sidebar, and operational tips into a single integrated visual asset. This serves multiple editorial goals:

- **Practical operational value** — concrete tips: 8am arrival, 30–45min drive from central Cairo, etc.
- **Visual differentiation** from generic stock-photo-driven travel sites
- **Editorial authority** — curated, in-the-field knowledge, hard to fake
- **Mobile-friendly comprehension** — visual sequencing easier to scan than prose
- **Shareability** — screenshot-friendly, drives organic Instagram / Pinterest discovery

### B. Architectural questions (UNRESOLVED — needs product thinking)

Operator was asked: "would this content type replace existing travel guides or supplement them?" Operator answered: unclear, needs product thinking before deciding. Open architectural questions to resolve before any implementation:

1. **Where does this content type live in IA?** Parallel to wikiMonument? Inside guideArticle? New top-level type called `travelItinerary` or `visitGuide`?
2. **What's the relationship to existing travel guides?** Replace, supplement, complement, or coexist with overlap?
3. **What's the editorial scope per instance?** One per famous-monument-area (Giza Pyramids, Saqqara, Valley of the Kings, Karnak, Abu Simbel, Saint Catherine, etc.)? One per city? One per common multi-stop itinerary (Cairo Day 1, Cairo Day 2, etc.)?
4. **What's the production workflow?** Designer time per infographic? AI image generation + cleanup? Pre-built component library that operator assembles?
5. **What's the visual style guide?** Color palette? Typography? Illustration style consistency across the cohort?
6. **How does it cross-link to existing content?** Each step in the route → wikiMonument detail page? Embedded thumbnails? Caption-only?

### C. Implementation cost (rough estimate)

- Schema work (new content type with fields for: title, intro, route waypoints, essentials, context boxes, illustration assets) — **4–8 hours**
- Next.js renderer + template — **8–16 hours**
- Editorial creation per infographic — **4–8 hours of designer + operator time per page**
- Site IA decisions — separate product session
- Cross-linking to existing content types — **4–8 hours engineering**

### D. Recommendation

**DEFER TO POST-LAUNCH.** Specifically:

- ❌ Not Session 7 (would derail the wikiMonument migration core deliverable)
- ❌ Not Session 8 (tours/hotels/cruises cohort is already substantial)
- ❌ Not Session 9 (manual redirects + Phase 2 relink — different concern)
- ❌ Not Sessions 10/10.5/11 (concierge, GEO/SEO, cutover — all launch-critical)
- ✅ **Target: Session 12+ (post-launch product enhancement)**

**Pre-launch alternative if operator insists:** ONE proof-of-concept for the Giza Pyramids tour (~4–8 hour investment max), deployed to staging. Use POC performance to inform the decision about scaling up the cohort. Anything more than one POC pre-launch is scope creep.

### E. Why post-launch is the right call

1. The current wikiMonument + city placesToGo + travel guides is a **complete shippable product**. This feature is **additive value, not foundational**.
2. Real user data post-launch tells you which infographics to prioritize. Building speculatively pre-launch risks investing in the wrong ones.
3. Migration sprint has a clear endpoint; adding feature work derails focus.
4. Doing it right requires real product thinking that doesn't fit between migration sub-phases.

### F. Operator decisions captured this turn

- **Q:** How to handle? — *"Capture as Track 8 follow-up, target post-launch (Session 12+) — don't derail Session 7"* ✓
- **Q:** Replace or supplement existing travel guides? — *"Unclear — needs product thinking before deciding"* ✓

Both architectural decisions deferred. Track 8 captures the idea and the open questions for future product work.

## Track 9: Schema Enum Addition — `archaeological-site` to wikiMonument.monumentType

### A. Concept

During Phase 3.5 Al Fayoum walkthrough, operator (Islam) committed to expanding `wikiMonument.monumentType` enum with a new `archaeological-site` value. This addresses a recurring schema gap surfaced during walkthrough: multi-monument settlements / towns / complexes that are themselves the destination but where individual buildings within may not be separately notable.

### B. Definition (proposed)

`archaeological-site`: A multi-monument settlement, town, or archaeological complex that is itself the tourist destination, where the visit experience is the broader site rather than a single building.

**Examples (from Track 6 sub-section D):**
- Karanis (Greco-Roman town with houses, granaries, bathhouses, multiple temples)
- Tebtunis (Greco-Roman papyri site with town infrastructure)
- Memphis archaeological site (per Track 6 sub-section B item 3 — the open-air gallery + sphinxes + colossal Ramesses statue + surrounding ruins)

### C. Distinction from existing enum values

- `temple` — single religious building (Qasr Qarun, Medinet Madi)
- `tomb` — single burial chamber/structure
- `necropolis` — burial complex (Saqqara Necropolis, Dahshur Necropolis)
- `museum` — modern museum building
- `other` — fallback when no enum fits
- **`archaeological-site` (new)** — multi-monument settlement / town complex

### D. Implementation scope

1. **Schema change** — extend enum in `src/sanity/schemas/wikiMonument.ts` (4-line addition, like Phase 0.5a's mosque/monastery/church/museum additions).
2. **Classifier extension** — `inferMonumentType` heuristic in `scripts/wp-classifier.ts` likely needs no change (slug patterns for archaeological sites don't have a consistent token); operator manually sets in Studio post-import.
3. **Content audit** — review existing 134 monuments for candidates that should reclassify from `other` (or `temple`/`tomb`) to `archaeological-site`. Likely candidates:
   - `the-saqqara-necropolis` — currently `necropolis`; operator may consider promoting if treating Saqqara as the broader site (though `necropolis` still applies — probably leave)
   - `abusir-necropolis` — same consideration
   - `dahshur-necropolis` — same
   - The 7 Al Fayoum items in Track 6 sub-section D where applicable (Karanis, Tebtunis specifically)
   - `memphis-mit-rahina-museum` — currently `museum`, possibly should split into museum + archaeological-site (per Track 6 sub-section B item 3 body-update consideration)
4. **Test additions** — extend `inferMonumentType` test suite if classifier rules added; cardinality assertions in `classifier-overrides.test.ts` updated.
5. **Migration considerations** — none needed (schema additions are non-breaking; existing data continues to validate).

### E. Implementation cost (rough estimate)

- Schema change: ~5 min
- Classifier work (if any): ~15 min
- Content audit: ~30–45 min (review of 134 monuments + decisions on reclassification)
- Test updates: ~15–30 min
- Migration: ~0 min (none needed)
- **Total: ~1–1.5 hours**

### F. Recommendation

**LAND PRE-LAUNCH.** Track 9 is small-scope and unblocks Track 6 sub-section D's authoring (Karanis and Tebtunis specifically benefit from the more precise enum value). Best done before the pre-launch editorial pass on Track 6 monuments — otherwise operator authors at `other` and reclassifies later.

### G. Target session

Could be a small carve-out within Session 9 (alongside other schema enrichment work like Track 2's tabular Portable Text block) OR a tail-end of Session 7 if time allows in Phase 3.5 / 4 / 5.

### H. Pre-launch priority

**Medium-high.** Not launch-blocking (existing `other` fallback works), but improves data precision for editorial filtering and SEO structured data.

### I. Operator decisions captured

- **Q:** Add `archaeological-site` enum value? — *"Yes, add as part of pre-launch work"* ✓
- **Q:** Where in process? — *"Separate Track 9, distinct from per-monument authoring (Track 6)"* ✓

## Track 10: Phase 4 rendering spot-check anomalies

### Concept

During Phase 4 rendering spot-check (Session 7 close), two anomalies were surfaced. Both are out of scope for Session 7's wikiMonument migration but should be tracked for resolution in Session 9 (redirect-map work) and ongoing operator/tester documentation.

### A. Deleted-slug needs 301 redirect (Session 9 work)

The Pair A duplicate `wp-page-69911` (slug `the-mosque-of-amr-ibn-al-as`) was deleted in Phase 3.5 cleanup. Phase 4 verified the slug now serves Next.js's not-found page (HTTP 200 in dev mode with body containing "This page could not be found"; production build would return 404).

While this is correct deletion behavior, the slug `the-mosque-of-amr-ibn-al-as` may have inbound links (Google search results, external bookmarks, social shares) from before deletion. Best practice for SEO and user experience is a 301 redirect from the deleted slug to the keeper slug.

**Recommendation:**
- Add `the-mosque-of-amr-ibn-al-as` → `mosque-of-amr-ibn-al-as` to the redirect map in Session 9's redirect-map work
- This becomes a pattern for any future Phase 3.5+ duplicate deletions (Pair B, future cleanups) — capture the deleted-slug → keeper-slug mapping at deletion time, then batch into the redirect map at Session 9

**Pre-launch priority:** Medium — affects SEO link equity and user experience for inbound links to the deleted slug. Not launch-blocking but should land before Phase 11 cutover.

**Target session:** Session 9 (redirect-map work; mentioned in operator workflow context as "manual redirects + Phase 2 relink")

### B. Locale-specific slug routing documentation

Phase 4 spot-check revealed that city slugs are locale-specific. EN slug `cairo` does NOT route to `/es/guide/cairo` (which 404s); the ES route requires `/es/guide/el-cairo`. Presumably the same pattern for JA (e.g., `/ja/guide/カイロ` or romanized equivalent).

This is by-design behavior consistent with i18n best practices (each locale has its own slug). However, it's an important documentation point for:
- Operators manually testing locale routes
- Future Phase 4-equivalent rendering spot-checks (must use locale-specific slugs)
- QA test plans (test data must include all 3 locale slugs per city)
- SEO sitemap generation (sitemap must include all locale variants of each route)

**Recommendation:**
- Document the locale-slug pattern in `docs/` or wherever operator/tester documentation lives
- Add a sanity-check assertion to test infrastructure that verifies all 3 locale slugs exist for each city in the cohort (currently 41 cities × 3 locales = 123 city slug entries)
- Sitemap generation should explicitly enumerate all locale variants

**Pre-launch priority:** Medium — affects QA tooling and SEO completeness. Not visible to end users (each locale's users see correct slugs naturally). Documentation gap rather than functional gap.

**Target session:** Session 11 (pre-launch QA) for documentation; Session 12 or later for any test-infrastructure additions.

### Operator decision captured

- **Q:** Capture Phase 4's two anomalies before Phase 5? — *"Yes — capture both anomalies as Track 10"* ✓
