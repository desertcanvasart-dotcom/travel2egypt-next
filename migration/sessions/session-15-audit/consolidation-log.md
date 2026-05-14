# Country-Variant Consolidation Log — Session 15

## Summary

`consolidateCountryVariants` (B3) detected **11 clusters** totaling **55 country-variant slugs** that collapsed to 11 canonical docs. Each canonical received an `EN_SLUG_OVERRIDES_BY_WP_ID` entry so its imported EN slug is the consolidated form (suffix-stripped). Each dropped variant got a cluster-level redirect into `migration/redirect-map.csv` pointing to the canonical slug.

| Metric | Value |
|---|---|
| Clusters | 11 |
| Canonical docs | 11 |
| Dropped variants | 55 |
| Cluster-level redirects emitted | 55 |
| Per-doc canonical redirects (gap #2 fix) | 11 |
| EN_SLUG_OVERRIDES applied | 12 (11 B3 canonicals + 1 interpunct fix) |

## Cluster-by-cluster detail

### 1. `11-day-luxor-to-cairo-egypt-nile-cruise-vacation` (4 → 1)

- Canonical: `wp-page-160477` — slug `11-day-luxor-to-cairo-egypt-nile-cruise-vacation`
- Dropped variants (3):
  - `wp-page-218448` germany    `11-day-luxor-to-cairo-egypt-nile-cruise-vacation-from-germany`
  - `wp-page-161093` spain      `11-day-luxor-to-cairo-egypt-nile-cruise-vacation-from-spain`
  - `wp-page-160803` turkey     `11-day-luxor-to-cairo-egypt-nile-cruise-vacation-from-turkey`

### 2. `9-day-prestigious-egypt-vacation` (7 → 1)

- Canonical: `wp-page-160139` — slug `9-day-prestigious-egypt-vacation`
- Dropped variants (6):
  - `wp-page-218432` germany    `9-day-prestigious-egypt-vacation-from-germany`
  - `wp-page-161079` spain      `9-day-prestigious-egypt-vacation-from-spain`
  - `wp-page-160965` usa        `9-day-prestigious-egypt-vacation-from-usa`
  - `wp-page-160788` turkey     `9-day-prestigious-egypt-vacation-from-turkey`
  - `wp-page-160491` canada     `9-day-prestigious-egypt-vacation-from-canada`
  - `wp-page-160324` australia  `9-day-prestigious-egypt-vacation-from-australia`

### 3. `bahariya-and-siwa-oasis-vacation` (7 → 1)

- Canonical: `wp-page-160129` — slug `bahariya-and-siwa-oasis-vacation`
- Dropped variants (6):
  - `wp-page-161593` germany    `bahariya-and-siwa-oasis-vacation-from-germany`
  - `wp-page-161111` spain      `bahariya-and-siwa-oasis-vacation-from-spain`
  - `wp-page-160953` usa        `bahariya-and-siwa-oasis-vacation-from-usa`
  - `wp-page-160776` turkey     `bahariya-and-siwa-oasis-vacation-from-turkey`
  - `wp-page-160503` canada     `bahariya-and-siwa-oasis-vacation-from-canada`
  - `wp-page-160312` australia  `bahariya-and-siwa-oasis-vacation-from-australia`

### 4. `10-day-romantic-egypt-travel-deals` (6 → 1)

- Canonical: `wp-page-160116` — slug `10-day-romantic-egypt-travel-deals`
- Dropped variants (5):
  - `wp-page-161561` germany    `10-day-romantic-egypt-travel-deals-from-germany`
  - `wp-page-160918` usa        `10-day-romantic-egypt-travel-deals-from-usa`
  - `wp-page-160767` turkey     `10-day-romantic-egypt-travel-deals-from-turkey`
  - `wp-page-160516` canada     `10-day-romantic-egypt-travel-deals-from-canada`
  - `wp-page-160277` australia  `10-day-romantic-egypt-travel-deals-from-australia`

### 5. `8-day-customized-aswan-travel-deal` (7 → 1)

- Canonical: `wp-page-160107` — slug `8-day-customized-aswan-travel-deal`
- Dropped variants (6):
  - `wp-page-161535` germany    `8-day-customized-aswan-travel-deal-from-germany`
  - `wp-page-161192` spain      `8-day-customized-aswan-travel-deal-from-spain`
  - `wp-page-160906` usa        `8-day-customized-aswan-travel-deal-from-usa`
  - `wp-page-160742` turkey     `8-day-customized-aswan-travel-deal-from-turkey`
  - `wp-page-160611` canada     `8-day-customized-aswan-travel-deal-from-canada`
  - `wp-page-160261` australia  `8-day-customized-aswan-travel-deal-from-australia`

### 6. `18-day-grand-egypt-holiday-package` (7 → 1)

- Canonical: `wp-page-160096` — slug `18-day-grand-egypt-holiday-package`
- Dropped variants (6):
  - `wp-page-161513` germany    `18-day-grand-egypt-holiday-package-from-germany`
  - `wp-page-161143` spain      `18-day-grand-egypt-holiday-package-from-spain`
  - `wp-page-160894` usa        `18-day-grand-egypt-holiday-package-from-usa`
  - `wp-page-160732` turkey     `18-day-grand-egypt-holiday-package-from-turkey`
  - `wp-page-160597` canada     `18-day-grand-egypt-holiday-package-from-canada`
  - `wp-page-160234` australia  `18-day-grand-egypt-holiday-package-from-australia`

### 7. `8-day-egypt-holiday-package` (6 → 1)

- Canonical: `wp-page-160072` — slug `8-day-egypt-holiday-package`
- Dropped variants (5):
  - `wp-page-161486` germany    `8-day-egypt-holiday-package-from-germany`
  - `wp-page-161128` spain      `8-day-egypt-holiday-package-from-spain`
  - `wp-page-160877` usa        `8-day-egypt-holiday-package-from-usa`
  - `wp-page-160716` turkey     `8-day-egypt-holiday-package-from-turkey`
  - `wp-page-160581` canada     `8-day-egypt-holiday-package-from-canada`

### 8. `4-day-cairo-travel-package` (6 → 1)

- Canonical: `wp-page-160059` — slug `4-day-cairo-travel-package`
- Dropped variants (5):
  - `wp-page-161448` germany    `4-day-cairo-travel-package-from-germany`
  - `wp-page-161041` spain      `4-day-cairo-travel-package-from-spain`
  - `wp-page-160863` usa        `4-day-cairo-travel-package-from-usa`
  - `wp-page-160696` turkey     `4-day-cairo-travel-package-from-turkey`
  - `wp-page-160571` canada     `4-day-cairo-travel-package-from-canada`

### 9. `14-day-egypt-tour-package` (6 → 1)

- Canonical: `wp-page-160044` — slug `14-day-egypt-tour-package-for-families`
- Dropped variants (5):
  - `wp-page-161359` germany    `14-day-egypt-tour-package-from-germany-for-families`
  - `wp-page-161017` spain      `14-day-egypt-tour-package-from-spain-for-families`
  - `wp-page-160846` usa        `14-day-egypt-tour-package-from-usa-for-families`
  - `wp-page-160682` turkey     `14-day-egypt-tour-package-from-turkey-for-families`
  - `wp-page-160553` canada     `14-day-egypt-tour-package-from-canada-for-families`

### 10. `luxor-to-cairo-egypt-nile-cruise-vacation` (2 → 1)

- Canonical: `wp-page-160357` — slug `luxor-to-cairo-egypt-nile-cruise-vacation`
- Dropped variants (1):
  - `wp-page-160943` usa        `luxor-to-cairo-egypt-nile-cruise-vacation-from-usa`

### 11. `egypt-tours` (8 → 1)

- Canonical: `wp-page-158052` — slug `egypt-tours`
- Dropped variants (7):
  - `wp-page-161314` germany    `egypt-tours-from-germany`
  - `wp-page-160983` spain      `egypt-tours-from-spain`
  - `wp-page-160833` usa        `egypt-tours-from-usa`
  - `wp-page-160669` turkey     `egypt-tours-from-turkey`
  - `wp-page-160423` canada     `egypt-tours-from-canada`
  - `wp-page-160172` australia  `egypt-tours-from-australia`
  - `wp-page-160026` india      `egypt-tours-from-india`


## Unconsolidated country-suffix singletons (5)

Per the deferred decision at sub-step 4c.1, these docs have a `-from-{country}` suffix but don't fit a clean cluster pattern. They imported with their raw WP slugs (country suffix preserved in the URL).

| _id | slug | reason no cluster |
|---|---|---|
| `wp-page-160149` | `egypt-nile-cruise-vacation-from-india` | India singleton; no other country variants of this base |
| `wp-page-160182` | `luxury-14-day-egypt-tour-package-from-australia-for-families` | Australia singleton with `luxury-` prefix; no peers |
| `wp-page-160197` | `egypt-escape-4-day-cairo-travel-package-from-australia` | Australia singleton with `egypt-escape-` prefix; no peers |
| `wp-page-160209` | `8-day-sharm-el-sheikh-holiday-package-from-australia` | Australia singleton; no Sharm-el-Sheikh peers |
| `wp-page-160630` | `10-day-romantic-egypt-deals-from-spain` | Possible base-name typo vs existing cluster `10-day-romantic-egypt-travel-deals` (note missing "travel" word) |

**Operator action**: per-doc decision in Studio:
1. **Keep as standalone** — legitimate single-market product
2. **Manual consolidate** — add EN_SLUG_OVERRIDES + redirect entries by hand
3. **Unpublish** — if WP source was a typo / duplicate

## Methodology note

The B3 regex `/-from-(germany|spain|usa|the-uk|canada|australia|india|turkey|united-kingdom)(-for-families)?$/i` was extended at sub-step 4c.1 (commit cf54455) to handle the `-for-families` qualifier suffix after the initial dry-run surfaced the family cluster. Future qualifiers can be added to the `COUNTRY_QUALIFIERS` array in `scripts/wp-import/mappers/tour.ts`.
