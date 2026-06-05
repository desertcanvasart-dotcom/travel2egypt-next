# Phase 3 Batch 1b — RESULTS (Part A) + ambiguous body evidence (Part B)

Branch `feat/localization-sweep`. Dataset `migration-staging`.

## PART A — 38 HIGH-confidence remapped ES imports WRITTEN ✅

Writer: `scripts/import-es-remap-write.mjs` (raw @sanity/client, batched, additive `{_key:'es', value}`,
fill-where-null, en/ja untouched). Source: corpus frontmatter `title:`→`name[es]`, `description:`→`summary[es]`.

| Type | Docs patched | name[es] | summary[es] | overwrites |
|---|---|---|---|---|
| Hotels | 20 | 20 | 20 | 0 |
| Cruises | 18 | 18 | 18 | 0 |
| **Total** | **38** | **38** | **38** | **0** |

**Verification**
- Remaining hotel es-name gaps: **only** `sunrise-montemare-resort`, `the-cascades-soma-bay`.
- Remaining cruise es-name gaps: **only** `nour-el-nil-assouan-dahabiya`, `el-nil-dahabiya`.
  → exactly the 4 ambiguous; everything else now localized.
- Re-queried sample (helnan, movenpick-resort-aswan, steigenberger-minerva, movenpick-hamees, adelaide,
  nile-ritz): `name[es]`/`summary[es]` populated native ES; **en & ja byte-identical** (English + kana intact).
- ES render: `/es/hotels/the-nile-ritz-carlton` H1 "The Nile Ritz-Carlton, Cairo: Nilo, Museo Egipcio y Tahrir";
  `/es/nile-cruises/m-s-steigenberger-minerva-nile-cruise` H1 "Steigenberger Minerva: hospitalidad alemana en el Nilo".

**Cumulative (Batch 1 + 1b):** 116 docs imported (70 hotels + 46 cruises). Hotel/cruise ES name+summary
now resolved except the 4 below.

## PART B — body evidence for the 4 ambiguous (READ-ONLY; nothing imported)

### 1. `the-cascades-soma-bay` → corpus `the-westin-soma-bay-golf-resort-spa` — ✅ RESOLVED (same property)
The corpus file's misleading `westin` slug is explained in its own body. Frontmatter: `formerly: "The Westin
Soma Bay Golf Resort & Spa"`. Body (quoted):
> "Este hotel exige una aclaración… **ya no debe tratarse como un Westin**. La propiedad abrió como La Résidence
> des Cascades, más tarde fue The Westin Soma Bay…, y **hoy opera como The Cascades Golf Resort, Spa & Thalasso**.
> El enlace Westin puede llevar a confusión con **The Westin Cairo Golf Resort & Spa, en Katameya Dunes, que es
> otra propiedad completamente distinta**."

Mentions: Cascades ×16, Soma Bay ×18. It explicitly distinguishes itself from `westin-cairo-golf-resort-spa`
(already imported, correctly, to the *different* Sanity doc `westin-cairo-golf-resort-and-spa`). **No conflict.**
→ **Recommend: IMPORT** on your OK.

### 2. `el-nil-dahabiya` (EN "Nour El Nil – El Nil") → ⚠ STILL AMBIGUOUS (two candidate files)
Two corpus files both describe an "El Nil" vessel:
- **(a) `nour-el-nil-dahabiya`** — title "El Nil Dahabiya: Nour El Nil, diez habitaciones y veinte viajeros";
  body "construida en 2006, con 2 Panoramic Rooms, 7 Rooms y 1 Cabin", Esna–Asuán.
- **(b) `nour-el-nil-el-nil-dahabiya`** — title **"Nour El Nil – El Nil"** (verbatim match to the Sanity EN);
  body "**la sexta dahabiya de la flota**… Seis barcos —*Assouan, Malouka, Meroe, Amirat, Adelaide y El Nil*."

The Sanity EN name matches **(b) `nour-el-nil-el-nil-dahabiya`** exactly, so (b) is the more likely intended
source — **this corrects my Batch-1b provisional map, which had pointed at (a).** But both files are titled
around "El Nil" and there is only ONE remaining Sanity doc for them, so one corpus file is surplus (possible
duplicate, or a vessel with no Sanity doc). **Need your call:** import (b) for `el-nil-dahabiya` and leave (a)
unused? (Recommended.) Or are (a) and (b) two distinct vessels needing two Sanity docs?

### 3. `sunrise-montemare-resort` → corpus `sunrise-montemare-resort-grand-select` — ✅ RESOLVED (same resort)
Body header: "**SUNRISE Montemare Resort, Sharm El Sheikh: Adults-Only**" (verbatim Sanity EN). Frontmatter title
adds the "Grand Select" sub-brand. Mentions: Montemare ×12, SUNRISE ×8. Same property; "Grand Select" is the
current sub-brand label. → **Recommend: IMPORT** on your OK.

### 4. `nour-el-nil-assouan-dahabiya` → corpus `nour-el-nil-assouan` — ✅ RESOLVED (distinct Assouan vessel)
Title "Nour El Nil Assouan: la dahabiya fundacional de la flota"; body "**La primera dahabiya de Nour El Nil:
una embarcación de 2005**… 2 Panoramic Rooms y 6 Cabins." Sanity EN "Nour El Nil Assouan: The Founding Dahabiya
of the Fleet" — exact. This is the *founding/2005* boat, **distinct** from the El Nil vessel in #2. → **Recommend:
IMPORT** on your OK.

## Summary / next step
- **3 of 4 resolved** (cascades, montemare, assouan) — clean same-property matches, ready to import on your OK.
- **1 genuinely ambiguous** (`el-nil-dahabiya`): pick source file **(b) `nour-el-nil-el-nil-dahabiya`** (title-exact)
  vs (a) `nour-el-nil-dahabiya`, and confirm whether (a) is a surplus duplicate.
- **Nothing imported for the 4 this session** (per instruction). On your sign-off I'll import the 3 resolved +
  the chosen El Nil source — closing hotels & cruises ES at 100%.
