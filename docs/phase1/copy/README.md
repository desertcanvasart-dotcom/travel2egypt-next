# Phase 1 locked copy

Each folder here is the reviewed copy for **one Sanity document's draft**.
`scripts/phase1/stage.py` turns a folder into `drafts.<doc id>`. It never
publishes, and it refuses to write unless every gate passes.

```
docs/phase1/copy/<tNN>-<short-name>/
  spec.json        what to change (see stage.py's docstring)
  body.md          article body (blog posts: one document per language)
  body.en.md …     localized body (travelTip, guideArticle)
  overview.en.md … city guide page body (city)
```

## Workflow

1. Export the current text: `python3 scripts/phase1/stage.py export <doc id> > <folder>/body.md`
   (add `--locale es` for one locale of a localized document; strip the first
   `<!-- … -->` line). Export sources the same way to read them.
2. Edit the copy. Blocks you don't touch are kept byte-identical in Sanity.
3. `python3 scripts/phase1/stage.py check <folder>` until it prints `✓ dry run ok`.
4. Only the Phase 1 lead runs `stage.py write`.

## Markdown rules (one block per line)

- `## Heading`, `### Subheading`, paragraphs, `- bullet`, `1. numbered`, `> quote`.
- `**bold**`, `*italic*`. Escape a literal `*`, `[`, `]` or `<` with `\`.
- Links: write the **EN path in every locale's file**, e.g. `[police escorts](/blog/police-escorts-in-egypt)`.
  The stager links the ES/JA file to the ES/JA document, and code routes
  (`/nile-cruises`, `/egypt-travel-packages`) to their localized paths. An
  unknown path, or a locale with no version of the linked post, fails the check.
  Don't link to Phase 1 source URLs that are being redirected.
- `[VERIFY: what needs checking]` placeholders are written literally, in English, in every locale.
- `::: keep KEY` keeps an existing non-text block (image, definition list).
  `::: keep DOC_ID:KEY` reuses a block from another document listed in
  `spec.json` `pools`, e.g. an image from a source post. Don't add new images.
- `::: note honest|caution|insider|context` … `:::` adds an operator note
  (plain paragraphs only). Allowed in blog `article` bodies and city
  `overview`. Not allowed in travelTip or guideArticle bodies.

## House rules (docs/content-canon.md is binding)

- British English in EN (travellers, colour, centre, metres, programme).
- No invented facts: prices, hours, dates, access, statistics, names of
  facilities go in as `[VERIFY: …]` unless moved verbatim from an existing page.
- ES/JA are natural reworkings of the same content. Every figure must match EN
  exactly. JA uses full-width punctuation and no italics.
- Banned: nestled, hidden gem, must-visit/must-see as filler, breathtaking,
  bucket-list, vibrant tapestry, look no further, "Explore…/Embark on…" openers.
- Meta descriptions: 155 characters or fewer, written for the target keyword.
