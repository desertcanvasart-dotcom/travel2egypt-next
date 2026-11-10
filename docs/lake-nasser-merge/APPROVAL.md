# Lake Nasser merge: changes for approval (10 Nov 2026)

**Status: APPROVED by the owner 10 Nov 2026 ("Approve, option B (€)"): prices stored as €750 / €1,390.**

- The new copy is staged as Sanity **drafts** of the three surviving posts. The public site reads published documents only.
- The "Faris Hussein" author document exists, but nothing published points to it yet.

The locked copy is in `docs/lake-nasser-merge/` (copied byte-for-byte from the owner's files).

## 1. Surviving post: new content (Sanity)

| Locale | Document | URL (unchanged) |
|---|---|---|
| EN | `wp-post-145378-en` | `/blog/lake-nasser-cruise` |
| ES | `wp-post-155359-es` | `/es/blog/por-que-elegir-un-crucero-por-el-lago-nasser` |
| JA | `wp-post-170181-ja` | `/ja/blog/naseru-ko-kuruzu-to-wa-nani-ka` |

For each locale:
- **Copy:** title, standfirst (`deck`) and body come from the locked file. Each body has 77 blocks: 14 H2s, a 9-item bulleted list and 14 bold labels.
  - The byline line is not in the body.
  - The FAQ is not in the body either. It goes into the new structured `faq` field, 5 items per locale.
- **Author:** `Travel2Egypt Archive` → **Faris Hussein** (new author document `author.faris-hussein`). The archive box and its disclaimer therefore disappear from this article only.
- **Category:** already **Nile Cruise**, so unchanged.
- **Dates:** published stays **3 September 2024**. `updatedAt` = **10 November 2026**.
- **Hero image and alt text:** unchanged.
- **SEO title and description:** exactly as specified. The site appends " — Travel2Egypt" automatically, which matches every other page, rather than " | Travel2Egypt".

**Script:** `scripts/lake-nasser-merge-content.mjs`. Its pre-flight checks that every text run byte-matches the locked files.

**Checked on a local preview of the drafts:**
- All three locales render the new title, the standfirst, "By Faris Hussein", both dates ("Last updated November 10, 2026" / "Última actualización: 10 de noviembre de 2026" / 「最終更新日：2026年11月10日」), the bulleted list and the FAQ section.
- The table of contents has 15 entries, including "Frequently asked questions".
- No archive box.
- Reading time: EN 14 min, ES 15 min.
- The FAQPage markup (5 questions, `inLanguage`) is byte-identical to the visible FAQ text.

## 2. Code (this PR)

- `article` schema: new optional `faq` field (question + answer).
- Article template:
  - **Structured FAQ section** after the body: an H2 plus one H3 per question, built from the `faq` field.
  - **Table of contents and reading time:** the FAQ is added to both.
  - **`FAQPage` JSON-LD** comes from the same items, so the visible FAQ and the markup cannot drift.
  - **Header:** published date, plus "Last updated {date}" when an update is later than publication. This is reusable: 9 other articles already have `updatedAt` and will show the line too.
- `buildFAQSchema`: optional `inLanguage`.
- `buildArticleSchema`: the author `url` is dropped. It pointed to `/about/<author-slug>`, which doesn't exist on this site (404) for any author. Faris has no author page.
- Messages: `blog.lastUpdated` and `blog.faqHeading` in EN/ES/JA, using the FAQ heading from the locked copy.

## 3. Redirects (this PR)

| From | To |
|---|---|
| `/blog/lake-nasser-cruises` | `/blog/lake-nasser-cruise` |
| `/es/blog/lago-nasser` | `/es/blog/por-que-elegir-un-crucero-por-el-lago-nasser` |
| `/ja/blog/naseru-ko-kuruzu-no-erabikata` | `/ja/blog/naseru-ko-kuruzu-to-wa-nani-ka` |
| `/lake-nasser-cruises` (old WordPress) | `/blog/lake-nasser-cruise` |
| `/es/lago-nasser` (old WordPress) | `/es/blog/por-que-elegir-un-crucero-por-el-lago-nasser` |
| `/ja/naseru-ko-kuruzu-no-erabikata` (old WordPress) | `/ja/blog/naseru-ko-kuruzu-to-wa-nani-ka` |

**Chain fixed:** `/ja/blog/naseru-ko-ejiputo-no-kakure-ta-boken-to-shizukesa-no-hoseki` used to redirect to the retired JA post. It now goes straight to the surviving JA post. There were no other rows pointing at the retired URLs.

**Note on status code:** the site's redirect map is served by Next.js as **308** (permanent), which is how every redirect on the site works. Google treats 308 exactly like 301. A trailing-slash variant takes one extra hop, because of the site's trailing-slash rule.

`test:redirect-map-integrity`: 5,967 rows, 0 duplicates, 0 self-loops, 0 chains.

## 4. Retire the old post (Sanity, after the deploy)

- The three retired documents (`wp-post-144896-en`, `wp-post-155635-es`, `wp-post-170183-ja`) are **unpublished**: kept as drafts and recoverable in Studio, with the published version deleted. That removes them from listings, Read Next, related, search and the sitemap.
- Their two translation-metadata documents link only the retired posts to each other, and hold strong references that would block the unpublish, so they're deleted.
- A full backup is written first.
- **Script:** `scripts/lake-nasser-merge-retire.mjs`. It refuses to run while any other document still references the retired posts.

## 5. Internal links (Sanity) — 55 changes in 52 documents

Every link or reference to the retired post, in all three languages, goes straight to the surviving post in the same language. That covers relative and absolute links, with or without a trailing slash, plus the 5 inline document references. Drafts are included.

- **No code, navigation or `llms.txt` links the retired URLs.** The only matches are old migration CSVs and manifests in the repo, which are records, not live links.
- **Script:** `scripts/lake-nasser-merge-links.mjs`. Report: `docs/lake-nasser-merge-links-2026-11-10.json`.

| Document | Type | Kind | Old | New |
|---|---|---|---|---|
| `drafts.wp-page-57848` | guideArticle | link | `/blog/lake-nasser-cruises` | `/blog/lake-nasser-cruise` |
| `drafts.wp-page-57848` | guideArticle | link | `/es/blog/lago-nasser` | `/es/blog/por-que-elegir-un-crucero-por-el-lago-nasser` |
| `drafts.wp-page-86853` | hotel | link | `/es/blog/lago-nasser` | `/es/blog/por-que-elegir-un-crucero-por-el-lago-nasser` |
| `guideArticle.cairo.church-of-st-barbara` | guideArticle | link | `/es/blog/lago-nasser` | `/es/blog/por-que-elegir-un-crucero-por-el-lago-nasser` |
| `guideArticle.cairo.mosque-madrassa-of-umm-sultan-shaaban` | guideArticle | link | `/es/blog/lago-nasser` | `/es/blog/por-que-elegir-un-crucero-por-el-lago-nasser` |
| `guideArticle.qena.the-temple-of-hathor` | guideArticle | link | `/es/blog/lago-nasser` | `/es/blog/por-que-elegir-un-crucero-por-el-lago-nasser` |
| `guideArticle.saint-catherine.mosque-of-al-hakim-be-amr-allah` | guideArticle | link | `/es/blog/lago-nasser` | `/es/blog/por-que-elegir-un-crucero-por-el-lago-nasser` |
| `wp-page-156550` | tour | link | `/es/blog/lago-nasser` | `/es/blog/por-que-elegir-un-crucero-por-el-lago-nasser` |
| `wp-page-56930` | guideArticle | link | `/blog/lake-nasser-cruises` | `/blog/lake-nasser-cruise` |
| `wp-page-57848` | guideArticle | link | `/blog/lake-nasser-cruises` | `/blog/lake-nasser-cruise` |
| `wp-page-57848` | guideArticle | link | `/es/blog/lago-nasser` | `/es/blog/por-que-elegir-un-crucero-por-el-lago-nasser` |
| `wp-page-57881` | wikiMonument | reference | `wp-post-144896-en` | `wp-post-145378-en` |
| `wp-page-58693` | guideArticle | link | `/es/blog/lago-nasser` | `/es/blog/por-que-elegir-un-crucero-por-el-lago-nasser` |
| `wp-page-58798` | guideArticle | link | `/es/blog/lago-nasser` | `/es/blog/por-que-elegir-un-crucero-por-el-lago-nasser` |
| `wp-page-59212` | guideArticle | link | `/blog/lake-nasser-cruises` | `/blog/lake-nasser-cruise` |
| `wp-page-59212` | guideArticle | link | `/es/blog/lago-nasser` | `/es/blog/por-que-elegir-un-crucero-por-el-lago-nasser` |
| `wp-page-59230` | wikiMonument | reference | `wp-post-144896-en` | `wp-post-145378-en` |
| `wp-page-59345` | guideArticle | link | `/es/blog/lago-nasser` | `/es/blog/por-que-elegir-un-crucero-por-el-lago-nasser` |
| `wp-page-59423` | guideArticle | link | `/es/blog/lago-nasser` | `/es/blog/por-que-elegir-un-crucero-por-el-lago-nasser` |
| `wp-page-59478` | guideArticle | link | `/es/blog/lago-nasser` | `/es/blog/por-que-elegir-un-crucero-por-el-lago-nasser` |
| `wp-page-59629` | guideArticle | link | `/es/blog/lago-nasser` | `/es/blog/por-que-elegir-un-crucero-por-el-lago-nasser` |
| `wp-page-59704` | guideArticle | link | `/es/blog/lago-nasser` | `/es/blog/por-que-elegir-un-crucero-por-el-lago-nasser` |
| `wp-page-59734` | guideArticle | link | `/es/blog/lago-nasser` | `/es/blog/por-que-elegir-un-crucero-por-el-lago-nasser` |
| `wp-page-59749` | guideArticle | link | `/blog/lake-nasser-cruises` | `/blog/lake-nasser-cruise` |
| `wp-page-60207` | guideArticle | link | `/es/blog/lago-nasser` | `/es/blog/por-que-elegir-un-crucero-por-el-lago-nasser` |
| `wp-page-60229` | guideArticle | link | `/es/blog/lago-nasser` | `/es/blog/por-que-elegir-un-crucero-por-el-lago-nasser` |
| `wp-page-60381` | guideArticle | link | `/es/blog/lago-nasser` | `/es/blog/por-que-elegir-un-crucero-por-el-lago-nasser` |
| `wp-page-60388` | guideArticle | link | `/es/blog/lago-nasser` | `/es/blog/por-que-elegir-un-crucero-por-el-lago-nasser` |
| `wp-page-60439` | guideArticle | link | `/es/blog/lago-nasser` | `/es/blog/por-que-elegir-un-crucero-por-el-lago-nasser` |
| `wp-page-60484` | guideArticle | link | `/es/blog/lago-nasser` | `/es/blog/por-que-elegir-un-crucero-por-el-lago-nasser` |
| `wp-page-60487` | guideArticle | link | `/es/blog/lago-nasser` | `/es/blog/por-que-elegir-un-crucero-por-el-lago-nasser` |
| `wp-page-60564` | guideArticle | link | `/es/blog/lago-nasser` | `/es/blog/por-que-elegir-un-crucero-por-el-lago-nasser` |
| `wp-page-60582` | guideArticle | link | `/es/blog/lago-nasser` | `/es/blog/por-que-elegir-un-crucero-por-el-lago-nasser` |
| `wp-page-60747` | wikiMonument | link | `/es/blog/lago-nasser` | `/es/blog/por-que-elegir-un-crucero-por-el-lago-nasser` |
| `wp-page-69918` | wikiMonument | link | `/es/blog/lago-nasser` | `/es/blog/por-que-elegir-un-crucero-por-el-lago-nasser` |
| `wp-page-69924` | wikiMonument | link | `/es/blog/lago-nasser` | `/es/blog/por-que-elegir-un-crucero-por-el-lago-nasser` |
| `wp-page-75745` | guideArticle | link | `/es/blog/lago-nasser` | `/es/blog/por-que-elegir-un-crucero-por-el-lago-nasser` |
| `wp-page-76518` | wikiMonument | link | `/es/blog/lago-nasser` | `/es/blog/por-que-elegir-un-crucero-por-el-lago-nasser` |
| `wp-page-78152` | guideArticle | link | `/es/blog/lago-nasser` | `/es/blog/por-que-elegir-un-crucero-por-el-lago-nasser` |
| `wp-page-78361` | guideArticle | link | `/blog/lake-nasser-cruises` | `/blog/lake-nasser-cruise` |
| `wp-page-78448` | guideArticle | link | `/es/blog/lago-nasser` | `/es/blog/por-que-elegir-un-crucero-por-el-lago-nasser` |
| `wp-page-86858` | guideArticle | link | `/es/blog/lago-nasser` | `/es/blog/por-que-elegir-un-crucero-por-el-lago-nasser` |
| `wp-page-86911` | guideArticle | link | `/es/blog/lago-nasser` | `/es/blog/por-que-elegir-un-crucero-por-el-lago-nasser` |
| `wp-page-87001` | guideArticle | link | `/es/blog/lago-nasser` | `/es/blog/por-que-elegir-un-crucero-por-el-lago-nasser` |
| `wp-page-87064` | guideArticle | link | `/es/blog/lago-nasser` | `/es/blog/por-que-elegir-un-crucero-por-el-lago-nasser` |
| `wp-page-87387` | guideArticle | link | `/es/blog/lago-nasser` | `/es/blog/por-que-elegir-un-crucero-por-el-lago-nasser` |
| `wp-page-87637` | tour | link | `/es/blog/lago-nasser` | `/es/blog/por-que-elegir-un-crucero-por-el-lago-nasser` |
| `wp-page-87739` | guideArticle | link | `/es/blog/lago-nasser` | `/es/blog/por-que-elegir-un-crucero-por-el-lago-nasser` |
| `wp-page-88555` | tour | link | `/es/blog/lago-nasser` | `/es/blog/por-que-elegir-un-crucero-por-el-lago-nasser` |
| `wp-page-96604` | wikiMonument | link | `/es/blog/lago-nasser` | `/es/blog/por-que-elegir-un-crucero-por-el-lago-nasser` |
| `wp-page-96618` | guideArticle | link | `/es/blog/lago-nasser` | `/es/blog/por-que-elegir-un-crucero-por-el-lago-nasser` |
| `wp-page-96626` | wikiMonument | link | `/es/blog/lago-nasser` | `/es/blog/por-que-elegir-un-crucero-por-el-lago-nasser` |
| `wp-post-144338-es` | article | reference | `wp-post-155635-es` | `wp-post-155359-es` |
| `wp-post-164256-ja` | article | reference | `wp-post-170183-ja` | `wp-post-170181-ja` |
| `wp-post-97294-en` | article | reference | `wp-post-144896-en` | `wp-post-145378-en` |

## 6. Tour prices: ⚠️ decision needed

Prices are stored in **EUR** (`priceFrom`) and shown in each visitor's currency at the live ECB rate (today EUR→USD 1.1193). The Explorer is **already €750** in Sanity, which is why it shows $840.

| Tour | Now | Option A: "$ as written" | Option B: "the figures are EUR" |
|---|---|---|---|
| Lake Nasser Explorer, 4 days | €750 (≈$839) | €670 → **$750** | €750 → $839 (unchanged) |
| 5-Day Lake Nasser Cruise | €186 (≈$208) | €1,242 → **$1,390** | €1,390 → ≈$1,556 |
| Four Days on Lake Nasser | €550 (≈$616) | unchanged | unchanged |

- **Option A:** the USD figure moves slightly with the exchange rate after today.
- **Either way:** the basis stays "per person, 2 sharing". The tour pages' Offer JSON-LD is computed from the same stored price, so it follows automatically.
- **Script:** `scripts/lake-nasser-merge-prices.mjs --mode=usd|eur`.

## 7. After approval: publish order

1. Merge this PR and wait for the deploy (template, FAQ, redirects).
2. Content: apply to the published documents and discard the staged drafts.
3. Links: run the links script.
4. Retire: run the retire script.
5. Prices: apply the chosen option.
6. Verify the live pages:
   - copy, author, dates and category
   - `curl -I` on each retired URL
   - JSON-LD validation (Schema.org validator)
   - tour cards
   - sitemap
   - Read Next
7. Request indexing for the three surviving URLs in Search Console.
