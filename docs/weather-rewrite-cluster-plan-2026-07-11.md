# Weather-page rewrite — cluster plan & build order

The 23-page weather body-rewrite project. Each debris-cohort weather page gets
the same treatment the **al-Quseir pilot** proved end-to-end (shipped
2026-07-11, `wp-page-58691`): full editorial body rewrite in all 3 locales,
listicle/debris removal, a topical photo hero, and the climate signature moved
**inline** (surfaceless ruled, PriceManifest-v2 pattern) via the
`[[climate-signature]]` marker — mechanism merged to `main` in
[PR #44](https://github.com/desertcanvasart-dotcom/travel2egypt-next/pull/44)
(`e8b9ed7`).

This doc groups the **22 remaining** debris pages (al-Quseir done) by genuine
climate/geographic character so each cluster can be authored against one shared
reference from the already-clean pages — voice reference + structural skeleton —
the same way al-Quseir was written against Dahab (voice) + Al-Gouna (skeleton).

Derived empirically: debris-signal audit of all 41 `guideArticle kind=="climate"`
docs against `src/data/climate/index.ts`. **Read-only analysis; no copy written.**
Owner-approved 2026-07-11.

## Cohort

- **41** climate pages total → **22 debris** (need rewrite) + **19 clean**
  (18 pre-existing references + al-Quseir, now shipped).
- **Clean weather pages carry no photo hero** — they render the boxed climate
  signature only. Every debris page carries a leftover photo hero (frequently
  topically wrong) plus the numbered-listicle template debris.
- Identification is structural (`kind == "climate"`), not title/slug — titles are
  inconsistent ("Weather in…", "…Weather", "Temperature Trends", etc.).

**Debris (22):** al-minya, al-wadi-al-gadid, bahariya-oasis, cairo, edfu, esna,
hurghada, kharga-oasis, kom-ombo, luxor, marsa-matruh, nuweiba, port-said, qena,
ras-sudr, safaga, saint-catherine, sharm-el-sheikh, sohag, suez, taba,
wadi-el-natrun.

**Clean reference pool (18 + al-Quseir):** abu-simbel, akhmim, al-arish,
al-fayoum, al-gouna, alexandria, aswan, asyut, baris, beni-suef, dahab,
dakhla-oasis, farafra-oasis, giza, ismailia, marsa-alam, rosetta-rasheed,
siwa-oasis, **al-quseir** (pilot).

## Cluster map

Climate values below are data-confirmed (Jan high/low °C, annual range, annual
rain days, descriptor), not region-name assumptions.

### A · Red Sea & Gulf warm-sea coast (6)
*Rainless, warm winter sea (Jan low 11–13°), annual range 24–26°.*

| Page | Character | Debris signals | Hero |
| --- | --- | --- | --- |
| **hurghada** | resort coast, wind | numbered-listicle (h3×5), °F, 12 decorative links, 2 pending images | ✅ beach/reef — keep |
| **sharm-el-sheikh** | winter-sun capital | dup-title H2, °F, 2 pending images | ✅ snorkeller — keep |
| **safaga** | working port, serious wind | °F, 2 pending images (n34) | ✅ watersport — keep |
| **ras-sudr** | Gulf-of-Suez windsurf flat-water | listicle, °F, 2 pending images | ⚠️ beach — shared asset w/ marsa-matruh |
| **nuweiba** | Gulf of Aqaba, mountain dawns | listicle, °F, 2 pending images | ⚠️ desert-camp — shared asset w/ suez |
| **taba** | Sinai/Aqaba, Gulf calm | °F, 2 pending images (n38) | desert dune (weak topical) |

**References:** Al-Gouna (skeleton) + al-Quseir + Marsa Alam (voice) for the
mainland trio (hurghada, sharm, safaga); **Dahab** (voice — "warm sea, cool wind,
mountain backdrop") for the Sinai/Aqaba pair (nuweiba, taba). ras-sudr → Al-Gouna
/ Dahab.

### B · Western Desert Oases (3)
*Rainless, huge annual range 36–37°, freezing winter nights (Jan low 3–5°),
fierce 40–42° summers.*

| Page | Debris signals | Hero |
| --- | --- | --- |
| **kharga-oasis** | dup-title, °F, 14 decorative links, 2 pending images | ✅ date-palms/oasis — keep (shared w/ sohag) |
| **al-wadi-al-gadid** (New Valley — region-level page) | dup-title, °F, 2 pending images | ⚠️ shared asset w/ wadi-el-natrun |
| **bahariya-oasis** | dup-title, **no °F**, 2 pending images, **n9 — thin stub** | ✅ White Desert chalk — keep |

**References:** farafra-oasis, dakhla-oasis, baris, siwa-oasis (all clean oases).

### C · Upper Egypt Nile Valley — temple corridor (5)
*Rainless, dry heat, annual range 33–35°.*

| Page | Debris signals | Hero |
| --- | --- | --- |
| **qena** | dup-title, listicle (h3×5), JA まとめ tail, °F | old-fort walls |
| **luxor** | °F, JA まとめ tail, 6 links | Luxor Temple — keep (temple town) |
| **esna** | listicle (h3×2), °F, 2 pending images | ⚠️ Hathor capitals — the image al-Quseir *discarded* |
| **edfu** | °F, 10 links, 2 pending images | Temple of Horus — keep (temple town) |
| **kom-ombo** | listicle (h3×5), °F | Kom Ombo Temple — keep (temple town) |

**References:** **Aswan** — structural/register reference only. NB: the
Esna/Edfu/Kom-Ombo *accommodation* pages are thematic continuity only, **not** a
structural template — different page type, different job (honesty-about-absence
vs. climate description).

### D · Middle Egypt Nile Valley (2)
*Rainless, dry heat, colder winter dawns (Jan low 5°), annual range 33–34°.*

| Page | Debris signals | Hero |
| --- | --- | --- |
| **al-minya** | dup-title, listicle (h3×5), °F, 11 links, 2 pending images | hieroglyph relief |
| **sohag** | listicle (h3×5), °F, 2 pending images | ⚠️ oasis-palms (wrong for a Nile town), shared w/ kharga |

**References:** asyut, akhmim (both "Middle Egypt · dry heat · cool nights";
akhmim adjoins sohag), beni-suef.

### E · Cairo & desert-edge lowland (2)
*Rare rain, annual range 26–29°, mild (Jan low 7–9°).*

| Page | Debris signals | Hero |
| --- | --- | --- |
| **cairo** | dup-title, listicle (h3×1), °F, 4 links, 2 pending images | Egyptian Museum facade |
| **wadi-el-natrun** | °F, JA まとめ tail (n31) | ⚠️ temple, shared asset w/ al-wadi-al-gadid |

**References:** giza (Cairo twin — range 28°), al-fayoum (desert lakes).

### F · Canal Zone (2)

| Page | Character | Debris signals | Hero |
| --- | --- | --- | --- |
| **suez** | canal-mouth, **dry**, windy | listicle (h3×5), °F | ⚠️ desert-camp, shared w/ nuweiba |
| **port-said** | Mediterranean-canal, **rain 28**, humid | °F, 2 pending images (n28) | ⚠️ **wrong subject (granite peaks)** — hero deferred |

**References:** ismailia (canal air); + alexandria / al-arish for port-said's
winter-rain note.

### G · Mediterranean NW coast (1)
*Coldest days (Jan high 17°), rain 41 days, stormy winters.*

**marsa-matruh** — °F, 2 pending images. Hero: beach parasols (topical, but
shared asset w/ ras-sudr). **Reference:** alexandria (Mediterranean, winter rain,
summer refuge).

### H · Sinai High Mountain (1)
*Unique: Jan low −2°, snowfall, 1,600 m altitude.*

**saint-catherine** — listicle (h3×5), **no °F**, monastery hero ✅ (correct
subject). **No climate peer** — bespoke voice (altitude, sub-zero, snow); borrow
only a structural skeleton from any clean page.

## °F exceptions

The °C(°F) → °C removal step is **not** blanket. 20 of 22 debris pages carry °F;
**bahariya-oasis** and **saint-catherine** do not — skip °F removal on those two.
(Separately confirmed: farafra-oasis, a *clean* page, still carries °F in body —
so the clean cohort is not uniformly °F-free either. Always check per page.)

## Hero policy (owner-set)

- **Keep town-appropriate temple heroes as-is** — Luxor, Edfu, Kom Ombo. These are
  topically correct for temple towns, **not** mismatches like al-Quseir's Hathor
  hero was. Do **not** force a landscape swap for uniformity.
- **Wrong-subject heroes needing sourcing (deferred, own items):**
  - **port-said** — "rugged granite peaks" (Sinai mountains) on a flat
    Mediterranean canal city. Deferred; does **not** block shipping Suez.
  - (peer status: Kom-Ombo hero sourcing, tracked separately.)

## ⚠️ Shared-hero entanglement (4 pairs)

Four hero assets are each reused on two debris pages. **Rule:** whichever page of
a pair is authored first must be given its **own resolved hero** — do not leave
the other page pointing at an asset that's now "claimed" by the rewritten page.

| Asset (short) | Pages | Note |
| --- | --- | --- |
| `f1f8723c…` | al-wadi-al-gadid ↔ wadi-el-natrun | **Crosses clusters B/E**, and a naming-confusion risk: New Valley oasis vs. Cairo-area monastery depression — different places |
| `345b8d94…` | kharga-oasis ↔ sohag | Oasis image; wrong for Nile-town Sohag |
| `d09ce9bd…` | marsa-matruh ↔ ras-sudr | Beach; topical for both coasts |
| `752211618f…` | nuweiba ↔ suez | Desert-camp; mismatch for canal-city Suez |

## Data integrity

**No wrong-city text** found in any of the 22 pages (standfirst scan, all
locales). No second wrong-hero pattern beyond port-said. Thin-source flag:
**bahariya-oasis** body is only 9 blocks (stub) — little existing material to
draw from.

## Confirmed build order

Front-loads clusters that reuse proven voice; ends with the unique, highest-risk
page. Within a cluster, first page = worst offender (same logic that picked
al-Quseir).

1. **A · Red Sea/Gulf** — **hurghada** first (worst: most decorative links +
   numbered listicle + flagship; own hero already good, so unblocked).
2. **C · Upper Egypt corridor** — **qena** first, then **luxor**. (Owner override:
   Qena is messier, and Luxor is the highest-traffic page in the corpus — the
   wrong page to prove the pattern on. Apply the proven corridor voice to Luxor
   after Qena.)
3. **B · Western Desert Oases** — **kharga-oasis** first (highest link debris; New
   Valley capital anchors al-wadi-al-gadid).
4. **D · Middle Egypt** — **al-minya** first.
5. **E · Cairo/desert-edge** — **cairo** first (flagship/high-traffic).
6. **F · Canal Zone** — **suez** first; **port-said deferred** pending a sourced
   hero.
7. **G · Mediterranean NW** — **marsa-matruh**.
8. **H · Saint Catherine** — **last**, bespoke voice (no peer reference).

---

*Hold for owner go per cluster. No copy authored from this plan yet. Each page
ships as a Sanity draft → full diff → HOLD → publish → rollback snapshot →
live browser verification (EN/ES/JA, desktop + mobile), same flow as the pilot.*
