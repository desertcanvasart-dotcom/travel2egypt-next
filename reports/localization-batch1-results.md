# Phase 3 Batch 1 — RESULTS (Part A write) + Batch 1b map (Part B)

Branch `feat/localization-sweep`. Dataset `migration-staging`.

## PART A — 78 slug-exact ES imports WRITTEN ✅

Writer: `scripts/import-es-hotel-cruise-write.mjs` (raw @sanity/client, batched transactions of 20,
`visibility: sync`). Mapping: corpus frontmatter `title:`→`name[es]`, `description:`→`summary[es]`.
Additive: appended `{_key:'es', value}` only where es was absent; en/ja items preserved verbatim.

| Type | Docs patched | name[es] | summary[es] | es-already-set (skipped) |
|---|---|---|---|---|
| Hotels | 50 | 50 | 50 | 0 |
| Cruises | 28 | 28 | 28 | 0 |
| **Total** | **78** | **78** | **78** | **0 overwrites** |

**Verification**
- Post-write gap counts: hotel name **72→22**, summary 72→22; cruise name **48→20**, summary 48→20.
  (The remaining 22+20 are the remapped-slug docs in Part B — now confirmed all importable.)
- Re-queried 8 hotels + 5 cruises: `name[es]`/`summary[es]` populated with native ES; **en & ja byte-identical** to before (spot-checked en English + ja kana intact on every sampled doc).
- Rendered ES (dev server): `/es/hotels/oberoi-sahl-hasheesh` H1 "The Oberoi Beach Resort, Sahl Hasheesh: lujo all-suite en el mar Rojo" + ES summary; `/es/nile-cruises/eyaru-dahabiya` H1 "Eyaru Dahabiya" + ES summary; `/es/hotels` archive shows imported ES copy (5/6 spot-probed strings present in first render).
- No non-empty es value was overwritten (writer guard `hasNonEmptyEs` skipped any es-populated field; count = 0).

## PART B — remapped-slug map (READ-ONLY, for sign-off — NO writes)

Map: `scripts/remapped-slug-map.mjs` (explicit Sanity-slug → corpus-slug; validates EN name vs ES title).
**Every one of the 42 remaining gaps has a real corpus file** — the Phase-2 "void" label was an artifact of
slug remapping (token reorders, `Mövenpick`→`m-venpick`, suffixes like `-grand-select`/`-hotel`). **Genuine
voids requiring authoring: 0.**

### HOTELS — 20 HIGH + 2 ambiguous

**HIGH (ready to import after your OK — corpus ES title == Sanity EN, same property):**

| Sanity slug | Sanity EN | → corpus slug |
|---|---|---|
| sharm-el-sheikh-fayrouz-resort | JAZ Fayrouz Resort, Naama Bay (ex-Hilton Fayrouz) | fayrouz-resort-sharm-el-sheikh |
| renaissance-sharm-el-sheikh-resort | Renaissance Sharm El Sheikh Golden View Beach Resort | renaissance-sharm-el-sheikh |
| cairo-marriott-hotel-and-omar-khayyam-casino | Cairo Marriott Hotel: The 1869 Gezira Palace | cairo-marriott-hotel-casino |
| maritim-jolie-ville-kings-island-luxor | Jolie Ville Hotel & Spa Kings Island Luxor | maritim-jolie-ville-kings-island-hotel |
| cairo-hotel-pyramids | Cairo Pyramids Hotel: Closest to the Grand Egyptian Museum | cairo-pyramids-hotel |
| hurghada-marriott-red-sea-resort | Hurghada Marriott Beach Resort | hurghada-marriott-resort |
| marriott-mena-house-hotel-cairo | Marriott Mena House Cairo | marriott-mena-house-hotel |
| hilton-alexandria-corniche-hotel | Hilton Alexandria Corniche | hilton-alexandria-corniche |
| helnan-palestine-hotel-alexandria | Helnan Royal Palestine Hotel – Montazah Gardens | helnan-royal-palestine-hotel-montazah-gardens |
| the-four-seasons-hotel-san-stephano | Four Seasons Hotel Alexandria at San Stefano | the-four-seasons-san-stefano |
| royal-maxim-palace-kempinski-cairo | Royal Maxim Palace Kempinski Cairo | royal-maxim-palace-kempinski |
| four-seasons-hotel-cairo-nile-plaza | Four Seasons Cairo at Nile Plaza | four-seasons-nile-plaza-hotel |
| four-seasons-hotel-cairo-first-residence | Four Seasons Cairo at The First Residence, Giza | four-seasons-first-residence |
| westin-cairo-golf-resort-and-spa | The Westin Cairo Golf Resort & Spa, Katameya Dunes | westin-cairo-golf-resort-spa |
| badawiya-hotel-el-dakhla-oasis | Badawiya Dakhla Hotel | badawiya-dakhla-hotel |
| sol-y-mar-pioneers-hotel-al-kharga-oasis | Sol y Mar Pioneers Hotel, Kharga Oasis | sol-y-mar-pioneers-al-kharga |
| steigenberger-nile-palace-luxor-hotel | Steigenberger Nile Palace Luxor | steigenberger-nile-palace-hotel |
| movenpick-resort-spa-el-gouna | Movenpick Resort & Spa El Gouna | m-venpick-resort-spa-el-gouna |
| the-nile-ritz-carlton | The Nile Ritz-Carlton, Cairo | the-nile-ritz-carlton-hotel |
| movenpick-resort-aswan | Movenpick Resort Aswan: A Hotel in the Nile | m-venpick-resort-aswan |

**AMBIGUOUS (need your call):**
| Sanity slug | Sanity EN | → corpus slug | ES title | Why flagged |
|---|---|---|---|---|
| sunrise-montemare-resort | SUNRISE Montemare Resort, Sharm El Sheikh: Adults-Only | sunrise-montemare-resort-**grand-select** | "SUNRISE Montemare Resort **Grand Select**: Hadaba…" | Same resort + "Grand Select" sub-brand suffix — almost certainly fine; confirm the rebrand is intended. |
| the-cascades-soma-bay | The Cascades Golf Resort, Spa & Thalasso, Soma Bay | the-**westin**-soma-bay-golf-resort-spa | "The Cascades Golf Resort, Spa & Thalasso, Soma Bay" | Corpus **slug says westin** but **title says Cascades** (same EN). Verify the file body is about The Cascades, not the neighbouring Westin Soma Bay. |

### CRUISES — 18 HIGH + 2 ambiguous

**HIGH:** swiss-inn-radamis-ii-nile-cruise→swiss-inn-radamis-ii · m-s-amwaj-livingstone-nile-cruise→m-s-amwaj-livingstone ·
sonesta-amirat-dahabiya→amirat-dahabiya · nour-el-nil-meroe-dahabiya→meroe-dahabiya · movenpick-prince-abbas-cruise→m-venpick-prince-abbas ·
m-s-steigenberger-omar-el-khayam→m-s-omar-el-khayam · **m-s-steigenberger-minerva-nile-cruise→m-s-minerva-nile-cruise** (corrects the earlier
false "→legacy") · m-s-sonesta-st-george-nile-cruise→m-s-sonesta-st-george · movenpick-ms-hamees-nile-cruise→m-venpick-m-s-hamees ·
movenpick-ms-darakum-nile-cruise→m-venpick-m-s-darakum · movenpick-ms-royal-lotus-nile-cruise→m-venpick-m-s-royal-lotus ·
movenpick-ms-sun-ray-nile-cruise→m-venpick-m-s-sun-ray · m-s-steigenberger-legacy-nile-cruise→steigenberger-legacy-nile-cruise ·
m-s-alexander-the-great-nile-cruise→y-s-alexander-the-great (M/Y yacht) · m-s-sonesta-star-goddess-nile-cruise→m-s-sonesta-star-goddess ·
movenpick-sb-feddya-dahabiya→sb-feddya-dahabiya · m-s-mayfair→m-s-mayfair-nile-cruise · **adelaide-dahabiya→adela-de-dahabiya** (corrects earlier false "→eyaru").

**AMBIGUOUS (need your call — Nour El Nil fleet has overlapping names):**
| Sanity slug | Sanity EN | → corpus slug | ES title | Why flagged |
|---|---|---|---|---|
| nour-el-nil-assouan-dahabiya | Nour El Nil Assouan: The Founding Dahabiya of the Fleet | nour-el-nil-assouan | "Nour El Nil Assouan: la dahabiya fundacional de la flota" | Title matches exactly; flagged only because the sibling `el-nil` row below touches the same fleet — likely HIGH. |
| el-nil-dahabiya | Nour El Nil – El Nil | nour-el-nil-dahabiya | "El Nil Dahabiya: Nour El Nil, diez habitaciones…" | A **second** "El Nil" file exists (`nour-el-nil-el-nil-dahabiya`). Two candidates for one Sanity doc — confirm which vessel `el-nil-dahabiya` is. |

### Corrections to the earlier Batch-1 dry-run
The crude title-only matcher produced false positives later **resolved** by EN-name↔ES-title comparison:
`adelaide-dahabiya`→**adela-de-dahabiya** (not eyaru), `el-nil-dahabiya`→**nour-el-nil-dahabiya** (not malouka),
`m-s-steigenberger-minerva`→**m-s-minerva-nile-cruise** (not legacy). The "genuine voids" (sunrise-montemare,
movenpick-resort-aswan, movenpick fleet) all **have corpus files** — net genuine voids = **0**.

## Next step (awaiting sign-off)
On your OK I'll extend the writer with this map (38 HIGH: 20 hotel + 18 cruise) and import them the same
additive way, then bring the 4 ambiguous rows back to you individually. After that, hotels & cruises ES
name/summary = 100% localized, and Batch 1 is closed (no authoring needed for these two types).
