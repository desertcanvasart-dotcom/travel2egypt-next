# wp-import test fixtures

## `inventory.sample.csv`

Minimal fixture covering the three `§5.2` redirect-map regenerator rules:

| Row | Disposition | Sanity doc present? | Expected target | Rule |
|---|---|---|---|---|
| `valley-of-the-kings-luxor` | `migrate` | yes (fixture lookup says so) | `/guide/luxor/valley-of-the-kings` | a (specific) |
| `hidden-tomb-of-foobar` | `migrate` | no | `/guide/luxor` | b (parent fallback) |
| `cultural-tours-in-taba` | `redirect-to-parent` | n/a | `/guide/taba` | c (parent) |

The real inventory CSV at `migration/content/destination-pages-inventory.csv`
is operator-maintained and gitignored. This fixture exists so the regenerator's
rule engine has deterministic test inputs.

Schema expected by `readInventoryCsv`:

```
legacy_url,destination,slug,disposition,locale
```

Extra columns (e.g. `Best New URL` from per-destination xlsx) are tolerated and
ignored — operator can extend the real CSV freely.

Exercised by `scripts/wp-import/__tests__/redirect-map-regenerate.test.ts`
(run via `npm run test:redirect-map-regenerate`).
