# Food article — pre-publish checklist

Publishing a food article is a **human act in Studio** — the importer only ever
writes drafts. Before publishing any `foodArticle` (and its locale siblings),
walk this list. It lives in the repo so the requirements travel with the content.

## Every article, every locale

- [ ] **Bump `updatedAt`** to the publish date on each locale being published.
      (JA *requires* `updatedAt` — it drives the `最終更新` line; EN/ES optional
      but set it when the content is final.)
- [ ] **Hero image + license verified.** A hero must be a real photograph (the
      no-AI-food-imagery rule is absolute). If the image is licensed/attributed
      (e.g. Creative Commons), the license must permit **commercial use**
      (CC BY, CC BY-SA, or public domain — **never** NC or ND variants), and the
      required attribution must be rendered via the `heroCredit` field. Confirm
      the credit string is present and correct.
- [ ] **Heading levels** — top-level section heads are `##` (h2) in every locale
      (see `README.md`). Re-check after any late edits.

## Route-format articles only (`format: route`)

- [ ] **`tour` + `lastVerified` are present.** A route article names venues; it
      must carry a `tour` reference and a `lastVerified` date before publish.
      (The schema enforces these are route-only and forbidden elsewhere — this
      checklist is the reminder that route pieces actually *carry* them.)

## Japanese (first JA publish, and after JA edits)

- [ ] **Native-JA reviewer pass** over (a) the full glossary — including the
      `fesikh` reviewer note (シ vs スィ) and any other flagged terms — and
      (b) the article's JA body text. This precedes **any** first JA publish.
- [ ] **Live 3-locale visual check via preview mode** (drafts aren't public, so
      use the preview flag): confirm on the rendered JA page —
  - [ ] gold `■` prefix on every h2 section head,
  - [ ] `· · ·` divider before each h2 after the first,
  - [ ] katakana glosses appear **first-mention only** (e.g. サヤディーヤ（sayadeya）
        on the first occurrence, plain thereafter),
  - [ ] `最終更新：YYYY年M月` line derived from `updatedAt`.
- [ ] Spot-check EN and ES render cleanly through the shared body (no ornaments,
      no stray `■`/`· · ·` in the prose).

## Internationalization joiner (`tmeta.<slug>`)

- [ ] **Confirm `strengthenOnPublish` actually strengthens.** The importer writes
      the `translation.metadata` joiner with **weak** references
      (`_weak: true` + `_strengthenOnPublish: { type: 'foodArticle' }`) because
      it points at draft-only translations. At the **first real Studio publish**,
      verify the plugin converts those weak refs to strong ones — don't assume the
      hint works end-to-end. Check the published joiner's refs lost `_weak`.
