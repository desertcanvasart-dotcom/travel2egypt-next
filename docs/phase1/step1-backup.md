# Phase 1: Step 1 backup and verified inventory

Run 2026-09-25 against Sanity `production` (raw perspective: published docs and
drafts) and live `travel2egypt.org`. Read-only: no document was created, edited
or published, and no redirect row was added.

Reproduce with `python3 scripts/phase1-snapshot.py` (input:
`scripts/phase1-urls.json`). It overwrites `docs/phase1/inventory.csv` and the
backup folder, so re-running after edits replaces the pre-change snapshot.
Take the "before" copy from git history, not from a re-run.

## What was saved

- `docs/phase1/backup/<_id>.json`: 232 files, 6.2 MB. Every source, target,
  "keep", "update" and "compare" document, verbatim, in all three locales,
  plus the `translation.metadata` documents linking each blog post's EN, ES and JA
  versions. Drafts are saved as `drafts.<_id>.json`.
- `docs/phase1/backup/manifest.json`: `_id`, `_type`, `_rev` and `_updatedAt`
  of each saved document. Before publishing anything, compare a document's
  current `_rev` with this file to catch edits made since the backup.
- `docs/phase1/inventory.csv`: 180 rows (every brief URL × en/es/ja) with the
  real Sanity ID, the locale's actual URL, whether a draft exists, the live
  status code and the redirect target.

Images are referenced by asset ID only. Unpublishing or deleting a document
doesn't delete its image assets, so the backups are enough to restore a
document.

## Results

- **Every URL in the brief exists and is published in all three locales.**
  All 180 return 200, except `/travel-tips/telephones-in-egypt` (EN), which
  already 308s. Every blog source and target has its own ES and JA document.
- Sanity IDs match `migration/bulk-upload-log.jsonl` wherever the log has
  them.
- `/resources/tipping-honestly` has no ES/JA slug, so `/es/…` and `/ja/…`
  fall back to the EN slug (200).

## Corrections to `discovery.md`

1. **`/blog/egypt-weather-guide` exists** (`wp-post-73355-en`, plus
   `/es/blog/guia-del-tiempo-en-egipto` and `/ja/blog/ejiputo-no-tenko-gaido`).
   It's missing from the upload log because it was imported another way. Task
   17 goes ahead with it as a normal source.
2. **Telephones (Task 7):** the `travelTip` `wp-page-60914` is **still
   published in all three locales**. Only the EN URL redirects, through an
   existing map row. `/es/travel-tips/telefonos-en-egipto` and
   `/ja/travel-tips/ejiputo-de-no-denwa-riyo-nitsuite` serve the page (200),
   and it still appears in the Travel Tips index and department lists. Task 7
   needs ES/JA redirect rows to the Staying Connected ES/JA slugs, and the
   document needs unpublishing.

## The two legacy rows that send ES/JA slugs to EN pages

The ES/JA slugs are known now, so rule 7 targets are:

| Existing row | Whose slug it is | Should point to |
|---|---|---|
| `/blog/vacaciones-inolvidables-en-egipto` → `/blog/vacation-in-egypt` | ES version of the Task 14 source `vacation-in-egypt` | `/es/journeys/primera-vez-en-egipto` |
| `/blog/nairu-kuruzu-de-otozureru-rekishi-iseki` → `/blog/historical-sites-visited-by-a-nile-cruise` | JA version of the Task 10 source | `/ja/blog/ejiputo-no-nairu-kuruzu-kanzen-gaido` |

## Existing drafts on two targets (must resolve before drafting there)

Only two Phase 1 documents already have a draft. Both are targets:

- **`/guide/aswan` (`city` `wp-page-58758`, Task 16).** The draft (edited
  2026-07-19) differs from the published version only in `heroImage` (a
  different aerial Aswan photo). **The draft is older than the published
  version (2026-07-30).** Building the Task 16 content on this draft and
  publishing it would put the old hero image back. Decide whether the hero
  swap is wanted. If not, discard the draft first, then start the Phase 1 draft
  from the published version.
- **`/travel-tips/cultural-etiquette-in-egypt` (`travelTip` `wp-page-73387`,
  Task 17).** The draft is a **stale copy of the original WordPress import**:
  body about 36 KB vs 122 KB published, the old titles, and different ES/JA
  slugs (`etiqueta-cultural-en-egipto`, `ejiputo-no-bunka-to-echiketto`).
  Publishing it would revert the rewritten page and change two live URLs.
  It should be discarded before any Phase 1 draft goes on this document.

## Other findings

- **Every blog translation group has two `translation.metadata` documents**
  with identical contents (`tmeta-wp-post-N` and `translation.metadata.wp-post-N`,
  86 docs for 43 groups). Harmless for Phase 1 because the pairs agree, but
  the language switcher or document-internationalization plugin may pick either.
  Out of scope here.
- **Write access:** the injected Sanity credential accepts mutations (checked
  with `dryRun=true` on a throwaway draft ID; nothing was created). Drafting is
  technically possible from this environment.

## Next

Step 2 onwards (content merges into target drafts, then redirect rows, then
unpublishing the sources) follows the brief's per-task instructions. Those
instructions aren't in the repo; `discovery.md` and `phase1-urls.json` only
record the URL pairs and rules 7 and the "updated date" step.
