# Tour cleanup — what to do

Hi — thanks for picking this up. You don't need any background on the project.
This is a **review task**: read a spreadsheet, look at some web pages, and mark a
decision in one column. You are **not** deleting or changing anything live. When
you're done, send the spreadsheet back and the actual changes get made from your
answers.

Please don't rush — getting these right matters. Budget ~45–60 minutes.

---

## The background (30 seconds)

Our site has tour pages in three languages: English, Spanish (`/es/...`),
Japanese (`/ja/...`).

A while back the same tours got imported twice, so for some tours we now have
**two copies**:

- an **old copy** — has a nice Spanish web address but the Spanish page still
  shows **English text** (this is the bug we're fixing), and
- a **new copy** — fully and correctly translated into Spanish and Japanese.

The fix is: for each old copy that has a matching new copy, point the old web
address at the new copy and retire the old one. Some old copies have **no** new
copy — those we keep and translate later.

**Your job:** confirm which old copies truly match which new copies.

---

## The file

Open **`tour-dedup-sheet.csv`** (in this same folder) in Excel or Google Sheets.

Each row is one **old copy**. The columns:

| Column | What it means |
|---|---|
| **decision** | *(empty — you fill this in)* |
| **confidence** | My guess at how sure the match is: `HIGH`, `MED`, or `UNIQUE` |
| **action** | What will happen: `REDIRECT+UNPUBLISH` (matched) or `KEEP+TRANSLATE` (no match) |
| **old_en_title** | The old tour's English name |
| **old_en_slug** | The old tour's English web address |
| **old_es_slug** | The old tour's Spanish web address (the page showing the bug) |
| **proposed_corpus_title** | The **new copy** I think it matches |
| **proposed_corpus_en_slug** | The new copy's English web address |
| **collision** | If filled (e.g. `shared:2`), more than one old row points at this same new copy — that's expected, just double-check both |
| **old_id / new_id** | Internal IDs — ignore these |

---

## How to check a match

For a row, open these two web pages in your browser (English versions):

- Old copy:  `https://travel2egypt.org/<old_en_slug>`
- New copy:  `https://travel2egypt.org/<proposed_corpus_en_slug>`

> Example — old `mount-sinai-sunrise-trek` →
> `https://travel2egypt.org/mount-sinai-sunrise-trek` vs new
> `https://travel2egypt.org/mount-sinai-sunrise-trek-group-day-tour`.

Compare them. **Are they the same tour?** (Same destination, same kind of trip,
roughly the same itinerary. The titles and wording will differ — that's fine.
You're judging whether a customer would consider them the same product.)

---

## What to write in the `decision` column

- **`yes`** — they are the same tour. (Use this for matched rows you confirm.)
- **`no`** — they are **not** the same tour. (The old one will then be left alone
  for now instead of being merged.)
- **a different web address** — if you find a *better* matching new copy, paste
  its English slug here instead of `yes`. (To see the list of all new copies,
  look at the `proposed_corpus_en_slug` column across the sheet — every new copy
  appears there at least once.)

Go row by row:

1. **`HIGH` rows** — these should almost all be correct. Quick-check each and
   write `yes`. Only write `no` (or a better slug) if something's clearly off.
2. **`MED` rows** — look carefully; these are my less-certain guesses. Several
   are "is this short tour really the same as that longer one?" judgment calls.
   `yes`, `no`, or a better slug.
3. **`UNIQUE` rows** — these have **no** new copy; we keep and translate them.
   You don't need to match these. Just skim the names and, if you happen to
   recognise one as actually being a duplicate of a tour we already have, write
   that tour's slug in `decision`. Otherwise leave blank.

A note on **`collision`** rows: when you see e.g. `shared:2`, two old rows are
proposed to merge into the **same** new copy. That's normal (we had near-duplicate
old pages). Just make sure **both** old tours really are that same tour.

---

## When you're done

Save the file (keep it as CSV) and send it back. That's it — the redirects,
retiring the old pages, and queueing the `KEEP+TRANSLATE` ones for Spanish
translation all happen from your answers. Nothing you do here is live or
irreversible.

If you're unsure about any row, just leave a comment in the `decision` cell
(e.g. `not sure - similar but different length`) and flag it — better to ask
than to guess.

Thank you!
