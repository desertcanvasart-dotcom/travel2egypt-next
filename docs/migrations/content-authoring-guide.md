# Travel2Egypt — Content Authoring Guide

For the team preparing source files for bulk import into Sanity.

This guide defines the file structure, naming conventions, metadata, and process. Following it ensures the bulk-import tooling can read every file correctly and produce well-formed Sanity documents without manual cleanup.

---

## 1. Top-level folder structure

```
content/
├── destinations/        # All city/destination content
│   ├── <city-slug>/
│   │   ├── <page-slug>.<locale>.md
│   │   └── _images/
│   └── ...
├── tours/               # Tour content (later phase)
├── hotels/              # Hotel content (later phase)
├── cruises/             # Nile cruise content (later phase)
├── travel-tips/         # Travel tips (later phase)
└── _assets/             # Cross-cutting images (logos, hero artwork, etc.)
```

**Phase 4 immediate scope is `destinations/`.** Other content types follow the same conventions; their folders activate as their authoring batches are ready.

---

## 2. City-slug list (under `destinations/`)

Each destination becomes one subfolder. City slugs are lowercase, hyphenated. Use **exactly** these slugs:

```
abu-simbel
akhmim
alexandria
al-arish
al-fayoum
al-gouna
al-minya
al-quseir
al-wadi-al-gadid
aswan
asyut
bahariya-oasis
baris
beni-suef
cairo
dahab
dakhla-oasis
edfu
esna
farafra-oasis
giza
hurghada
ismailia
kharga-oasis
kom-ombo
luxor
marsa-alam
marsa-matruh
nuweiba
port-said
qena
ras-sudr
rosetta-rasheed
safaga
saint-catherine
sharm-el-sheikh
siwa-oasis
sohag
suez
taba
wadi-al-natron
```

Final URL pattern: `travel2egypt.org/guide/<city-slug>/<page-slug>/`
Example: `travel2egypt.org/guide/luxor/valley-of-the-kings/`

---

## 3. File naming convention

```
<page-slug>.<locale>.md
```

Three locales per page concept — one file each:

```
valley-of-the-kings.en.md
valley-of-the-kings.es.md
valley-of-the-kings.ja.md
```

Locales: `en`, `es`, `ja` only (no `en-US`, `es-ES`, etc.)

Page slugs: lowercase, hyphenated, no special characters. Match the slug captured in the inventory CSV exactly — the slug is load-bearing for redirect mapping.

---

## 4. Front-matter (YAML at top of every file)

Every `.md` file starts with YAML front-matter, then a blank line, then the markdown body:

```markdown
---
slug: valley-of-the-kings
city: luxor
kind: attraction
locale: en
title: "Valley of the Kings"
description: "The royal necropolis of the New Kingdom pharaohs across the Nile from Luxor."
heroImage: ./images/valley-of-the-kings-hero.jpg
publishedAt: 2026-05-20
---

Body content starts here as standard markdown.
```

### Required fields

| Field | Purpose | Example |
|---|---|---|
| `slug` | URL slug for this page (load-bearing — must match inventory CSV) | `valley-of-the-kings` |
| `city` | Destination this page belongs to (must match city-slug list above) | `luxor` |
| `kind` | Page type — controls UI variant and discovery (see §5 below) | `attraction` |
| `locale` | Language of this file's body content | `en`, `es`, or `ja` |
| `title` | Page title (used as `<h1>`, page title, og:title) | `"Valley of the Kings"` |
| `description` | Meta description (~155 chars; SEO snippet) | `"..."` |
| `publishedAt` | Intended publish date (ISO format: `YYYY-MM-DD`) | `2026-05-20` |

### Optional fields

| Field | Purpose |
|---|---|
| `heroImage` | Hero image path (relative to file, in `./images/` subfolder) |
| `excerpt` | Card/summary text shown on listing pages |
| `keywords` | List of keywords for internal search |
| `lastUpdated` | If reviewed/refreshed after initial author date |

### Format rules

- Strings with special characters (commas, colons, quotes): wrap in double quotes
- Dates: always ISO format (`2026-05-20`)
- `heroImage` paths: relative, prefixed with `./images/`
- `slug` and `city`: lowercase, hyphenated only — no uppercase, no underscores, no spaces

---

## 5. The `kind` field — required values

Pick exactly one per page. The bulk-import tooling rejects unknown values.

| Value | Use for | Example |
|---|---|---|
| `parent` | The destination's main travel-guide page (one per city) | `luxor-travel-guide` (slug) |
| `signature` | "Only here in X" page — what makes this destination unique | `only-here-in-luxor` |
| `attraction` | Specific monument, beach, valley, site, named place | `valley-of-the-kings` |
| `transport-to` | How to get to this destination | `how-to-reach-luxor` |
| `transport-around` | Getting around within the destination | `navigating-luxor` |
| `accommodation` | Where to stay / hotels overview | `top-hotels-in-luxor` |
| `food` | What to eat / restaurants / cuisine | `traditional-food-in-luxor` |
| `tours` | Tours and activities available | `top-tours-in-luxor` |
| `events` | Festivals, annual events, cultural calendar | `luxor-cultural-events` |
| `climate` | Weather, best time to visit | `luxor-climate` |
| `heritage` | History, ancient past, cultural background | `luxor-ancient-past` |
| `overview` | Places-to-go / general overview pages | `places-to-go-in-luxor` |

If a page doesn't fit any of these, **stop and ask** — don't invent a new `kind`.

---

## 6. Body content (the markdown part)

Standard CommonMark / GitHub Flavored Markdown:

- `# H1` — **don't use**; the `title` front-matter field becomes the H1
- `## H2`, `### H3`, `#### H4` — section headings (use freely)
- `**bold**`, `*italic*`, `~~strikethrough~~`
- `[link text](https://example.com)` — external links
- `[link text](/guide/luxor/valley-of-the-kings)` — internal links (use full path)
- `![alt text](./images/photo.jpg)` — images (see §7)
- Bullet lists, numbered lists, blockquotes — standard
- ` ```code blocks``` ` — for any code snippets

**Avoid**:
- Inline HTML (the import will strip it; if you need formatting markdown doesn't support, ask)
- Tables that exceed standard markdown — complex layouts should be discussed
- WordPress shortcodes (`[shortcode]...[/shortcode]`) — these get imported as literal text

---

## 7. Images

### Storage
Per-city images live in `content/destinations/<city>/images/`:

```
content/destinations/luxor/
├── valley-of-the-kings.en.md
├── valley-of-the-kings.es.md
├── valley-of-the-kings.ja.md
└── images/
    ├── valley-of-the-kings-hero.jpg
    ├── valley-of-the-kings-tomb-detail.jpg
    └── ...
```

### Reference syntax in markdown
Use relative paths from the `.md` file:

```markdown
![Tomb of Ramesses VI interior](./images/valley-of-the-kings-tomb-detail.jpg)
```

### Image guidelines
- Format: JPEG for photos, PNG for graphics with transparency, WebP if you have it
- Dimensions: hero images ≥1920×1080, in-body images ≥1200px wide
- Naming: `<page-slug>-<descriptor>.<ext>` (lowercase, hyphenated)
- Alt text: meaningful description in the language of the file (not "image of...")
- Cross-locale image reuse: the same image filename can appear in EN/ES/JA files; the import tool dedupes

The bulk-import tool uploads images to Sanity's CDN and rewrites references automatically. Don't preflight-upload images yourself.

---

## 8. "Several pages per source doc" — splitting rule

If your existing DOCX or working document contains multiple distinct pages of content (e.g., one Word doc covering both `valley-of-the-kings` and `temple-of-hatshepsut`), **split it before saving as `.md`**:

- One `.md` file per Sanity page concept
- One Sanity page = one URL = one source file (per locale)

Don't use delimiters within a single file to indicate page breaks. The tool reads file = doc, full stop.

---

## 9. DOCX → MD conversion

For source content currently in DOCX:

### Recommended tool
[Pandoc](https://pandoc.org/) — handles DOCX → MD cleanly:

```bash
pandoc input.docx -o output.md --wrap=none --extract-media=./images
```

`--wrap=none` keeps paragraphs as single lines (better for diffing and Sanity portable text).
`--extract-media` pulls embedded images out of the DOCX into a folder.

### After conversion
- Open the `.md` in a text editor and add the YAML front-matter
- Verify headings converted correctly (Pandoc usually does)
- Check that lists, links, and emphasis survived
- Move extracted images to the proper `images/` folder and rename
- Update image references in the markdown to match new filenames

If you're authoring fresh (not converting), skip this section — write directly in markdown.

---

## 10. Quality checklist before submitting a file

Before considering a file "ready," verify:

- [ ] Filename follows `<page-slug>.<locale>.md`
- [ ] Lives in correct `destinations/<city>/` folder
- [ ] Front-matter present with all required fields
- [ ] `slug`, `city`, `locale`, `kind` are exact (lowercase, hyphenated, from the approved list)
- [ ] `title` and `description` set
- [ ] No `# H1` heading in the body (front-matter `title` handles it)
- [ ] Body uses only supported markdown
- [ ] Images stored in `images/` subfolder, referenced relatively
- [ ] No inline HTML or WordPress shortcodes
- [ ] If translation: EN file exists for the same `slug` (no orphan ES/JA files without an EN counterpart)

---

## 11. Translation parallel rule

For multi-locale content:

- **EN is canonical.** Author EN first as the reference.
- ES and JA must use **identical** `slug`, `city`, and `kind` in front-matter (only `locale`, `title`, `description`, and body content differ).
- ES/JA translators work from the EN file as source.
- If EN is updated after ES/JA are translated, flag the translators for sync.

If you're launching trilingual (per the locked decision), the ES and JA files must exist alongside EN at import time. Missing-locale files are flagged at import for follow-up.

---

## 12. What NOT to do

- ❌ Don't put files anywhere other than `content/destinations/<city>/`
- ❌ Don't use uppercase or spaces in slugs or city names
- ❌ Don't invent new `kind` values
- ❌ Don't include `# H1` in body — the `title` field handles it
- ❌ Don't paste from Word with inline styling — convert via Pandoc first
- ❌ Don't combine multiple pages in one file
- ❌ Don't create files for pages that aren't in the approved inventory CSV (talk to the operator first if you think there should be more)
- ❌ Don't manually upload images to Sanity — the tool handles it
- ❌ Don't use WordPress shortcodes

---

## 13. Example file (full)

`content/destinations/luxor/valley-of-the-kings.en.md`:

```markdown
---
slug: valley-of-the-kings
city: luxor
kind: attraction
locale: en
title: "Valley of the Kings"
description: "The royal necropolis of the New Kingdom pharaohs, cut into the limestone cliffs across the Nile from Luxor."
heroImage: ./images/valley-of-the-kings-hero.jpg
publishedAt: 2026-05-20
---

For five centuries — from the 16th to the 11th century BC — Egypt's New Kingdom pharaohs were buried in tombs cut deep into the rock of a narrow desert wadi west of Thebes. The Valley of the Kings holds at least 65 tombs, and almost certainly more still undiscovered.

## What you'll see

The tombs follow a remarkably consistent plan...

### Tutankhamun's tomb (KV62)

Discovered intact by Howard Carter in 1922...

## Planning your visit

The standard ticket admits you to three tombs of your choice from a rotating list...

## Practical notes

- The site is open 6 AM to 5 PM, 7 days a week
- Photography requires a separate permit purchased on entry
- Bring water; no shops inside the gates
```

---

## 14. Questions or edge cases

If you encounter a situation this guide doesn't cover — a page that doesn't fit any `kind`, a content type that needs a structure not described here, an image larger than expected, a locale variant that diverges substantially from EN — **stop and ask**. The bulk-import tool is strict by design; ad-hoc deviations create migration mess.

Open questions go to the operator, who clarifies with the migration team.
