# Phase 3 — hotels/cruises ES CLOSED (final 4 ambiguous imported)

Branch `feat/localization-sweep`. Writer: `scripts/import-es-ambiguous-write.mjs` (additive, es key only,
fill-where-null, en/ja untouched, raw @sanity/client).

## Imported (explicit signed-off pairings)
| Sanity slug | ← corpus file | name[es] |
|---|---|---|
| the-cascades-soma-bay | the-westin-soma-bay-golf-resort-spa | The Cascades Golf Resort, Spa & Thalasso, Soma Bay |
| sunrise-montemare-resort | sunrise-montemare-resort-grand-select | SUNRISE Montemare Resort Grand Select: Hadaba, arrecife y zonas adultas |
| nour-el-nil-assouan-dahabiya | nour-el-nil-assouan | Nour El Nil Assouan: la dahabiya fundacional de la flota |
| el-nil-dahabiya | nour-el-nil-el-nil-dahabiya (file b, exact EN match) | Nour El Nil – El Nil |

## Verification
- All 4: es name+summary populated; **en & ja byte-identical** (kana intact); 0 overwrites.
- Rendered each in ES (localhost:3000) → all 200, localized H1.
- **Remaining hotel/cruise ES name+summary gaps = 0 / 0 / 0 / 0.** Hotels & cruises ES fully closed.
- Cumulative across Batch 1 + 1b + this: **120 docs imported** (72 hotels + 48 cruises).

## Flag (read-only — nothing created): unused El Nil file
`nour-el-nil-dahabiya` ("El Nil Dahabiya: …diez habitaciones…2006") is a **DUPLICATE** of the El Nil vessel
just imported from `nour-el-nil-el-nil-dahabiya`. Evidence: both are the "El Nil" boat operated by Nour El Nil,
same Esna–Asuán dahabiya, ~10 rooms/20 travellers; file (b) explicitly lists the 6-boat fleet
(Assouan, Malouka, Meroe, Amirat, Adelaide, El Nil) — all already covered. (a) is an older spec-style write-up,
(b) the newer brand-voice version matching the Sanity EN. **Not a distinct vessel; no missing Sanity page.**
Surplus corpus file — safe to ignore.
