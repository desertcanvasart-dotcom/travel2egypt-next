# B5 copy draft: first batch, the pages closest to page 1 (9 Nov 2026)

Phase B5 of `docs/product-ranking-plan-2026-11-09.md`. Each page gets the search it should win, from `docs/keyword-map-2026-11-09.md`.

**Status: LOCKED — approved by the owner 9 Nov 2026 ("Yes, apply all").** This is the locked copy (Canon Gate A): the staging script writes only strings that byte-match this file.

## How the fields show up

- **Meta title** (`seo.metaTitle`) is the browser tab and the blue link in Google. The site adds " — Travel2Egypt", so each one is kept to 45 characters or fewer, giving at most 60 in total.
- **H1** is the document title, shown on the page and on cards. It stays unless noted.
- **Intro** (`summary`) is the italic opening line under the H1.
- **Meta description** (`seo.metaDescription`) is the grey text under the link in Google, 120–155 characters. When it's empty, the intro is used and cut with "…".

Prices are left out of all copy on purpose. They render from the price data and convert per currency (Canon Part II.7).

---

### 1. Dendera and Abydos (`/dendera-and-abydos-temples-from-luxor`)

Target: *dendera and abydos temples tour*, *abydos tours*. Now at position 8–12.

- **Meta title:** now the H1, 55 characters + suffix = 70, cut off in Google.
  - **New:** Dendera and Abydos Temples Tour from Luxor
- **H1:** keep: *Dendera and Abydos Temples: A Full-Day Tour from Luxor*
- **Intro:**
  - *Now:* Two of Egypt's least-visited major temples in a single day — the Greco-Roman splendour of Dendera and the haunting mortuary complex of Abydos, both within reach of Luxor.
  - **New:** A private full day north of Luxor to two major temples: Hathor's temple at Dendera, among the best preserved in Egypt, and the Temple of Seti I at Abydos, with its King List of seventy-six names.
  - *Why:* "least-visited" is an unverified superlative (Canon II.3). The new facts come from the page's own body.
- **Meta description** (now empty):
  - **New:** Private full-day tour from Luxor to the Temple of Hathor at Dendera and the Temple of Seti I at Abydos, with its King List. About 11 hours.

### 2. Nile cruise and Hurghada (`/14-night-nile-cruise-and-hurghada-stay`)

Target: *nile cruise and stay hurghada*, *nile cruise and hurghada package*. Now at position 12–19.

- **Meta title:** now the H1, 59 characters + suffix.
  - **New:** Nile Cruise and Hurghada Stay: 14 Days
- **H1:** keep: *14-Day Nile Cruise & Hurghada: Luxor, Aswan and the Red Sea*
- **Intro:**
  - *Now:* A week on the Nile between Luxor and Aswan, then a week on the Red Sea at Hurghada — two registers in a single fortnight, deliberately uneven.
  - **New:** A Nile cruise and a Red Sea stay in one fortnight: a week on the river between Luxor and Aswan, then a week at Hurghada — two registers, deliberately uneven.
- **Meta description** (now empty):
  - **New:** A 14-day private package: a week's Nile cruise between Luxor and Aswan, then a week on the Red Sea at Hurghada, planned as one trip.

### 3. Luxor private day tours (`/luxor-private-day-tours`)

Target: *luxor day tours*, *luxor private tours*, *luxor day trip*. Now at position 16–30.

- **Meta title:**
  - *Now:* Luxor Private Day Tours
  - **New:** Luxor Private Day Tours and Day Trips
- **H1 and meta description:** keep.

**Interface text on every city day-tour page** (Luxor, Cairo, Aswan, Hurghada and the others, in all three languages). These two lines read like design notes rather than copy:

| Key | Now | New |
|---|---|---|
| `toursIntro` EN | Still bookable tours — but presented as recommendations first: what each day is best for, why it matters, and who should choose it. | Each day below can be booked as it stands or adjusted to your pace: what it is best for, why it matters, and who should choose it. |
| `toursIntro` ES | Tours que puedes reservar, pero presentados primero como recomendaciones: para qué es mejor cada día, por qué importa y a quién le conviene. | Cada día se puede reservar tal cual o adaptar a tu ritmo: para qué es mejor, por qué importa y a quién le conviene. |
| `toursIntro` JA | いずれも予約可能なツアーですが、まずはおすすめとしてご紹介します——それぞれの一日が何に向き、なぜ価値があり、誰に向いているのか。 | どの一日もそのまま予約でき、ペースに合わせた調整も可能です。それぞれの見どころ、価値、向いている方をご紹介します。 |
| `journalIntro` EN | Supporting reading that turns the page into a guide, not only a list — the context behind each day. | Background reading for each day: the history and practical context behind it. |
| `journalIntro` ES | Lecturas que convierten la página en una guía, no solo en una lista: el contexto detrás de cada día. | Lecturas para cada día: la historia y el contexto práctico que hay detrás. |
| `journalIntro` JA | このページを単なる一覧ではなくガイドに変える読み物——それぞれの一日の背景となる文脈を。 | それぞれの一日の背景にある歴史と、旅に役立つ実用情報。 |

### 4. Siwa (`/siwa-oasis-adventure-tour`)

Target: *siwa tours*, *siwa oasis tour*, *siwa trips*. Now at position 17–28.

- **Meta title:**
  - *Now:* the H1
  - **New:** Siwa Oasis Tour from Cairo: 3 Days
- **H1:**
  - *Now:* 3-Day Enchanting Siwa Oasis Adventure Tour
  - **New:** 3-Day Siwa Oasis Tour from Cairo, via El Alamein
- **Intro:**
  - *Now:* "Embark on on this 3-Day Enchanting Siwa Oasis Adventure Tour that takes you from the vibrant heart of Cairo…" (WordPress copy with a typo, cut off mid-sentence).
  - **New:** Three days from Cairo to Siwa and back: west along the Mediterranean coast past El Alamein, into the oasis near the Libyan border, and home by way of Marsa Matrouh.
- **Meta description** (now empty):
  - **New:** A private 3-day Siwa Oasis tour from Cairo: the coast road past El Alamein, the oasis near the Libyan border, and the return through Marsa Matrouh.
- ⚠️ **Content gap:** the page body ends at "Here's what your enthralling itinerary includes:" and nothing follows. There is no day-by-day plan, which makes the page thin. It needs the real itinerary from operations; I won't invent one (Canon II.6).

### 5. Essential Egypt (`/essential-egypt`)

Target: *essential egypt tour*, *8 day egypt tour*. Now at position 17–21.

- **Meta title:** now the H1, 62 characters + suffix.
  - **New:** 8-Day Essential Egypt Tour: Cairo to Luxor
- **H1 and intro:** keep.
- **Meta description** (now empty):
  - **New:** A private 8-day Egypt tour: the Giza plateau, Alexandria on the Mediterranean, Abu Simbel and Aswan, then the temples and tombs of Luxor.

### 6. Mount Sinai from Cairo (`/private-tour-2-days-1-night-trip-to-saint-catherine-from-cairo`)

Target: *mount sinai tour from cairo*, *mt sinai tours*. Now at position 3–24.

- **Meta title:**
  - *Now:* Mount Sinai and Saint Catherine's — 2-Day Private Pilgrimage from Cairo (71 + suffix, cut off)
  - **New:** Mount Sinai Tour from Cairo: 2 Days
- **H1, intro and meta description:** keep.

### 7. Sharm El Sheikh package (`/8-days-ultimate-trip-to-sharm-el-sheikh`)

Target: *sharm el sheikh travel packages*. Now at position 14–16.

- **Meta title:** now the H1, 63 characters + suffix.
  - **New:** Sharm El Sheikh Travel Package: 8 Days
- **H1 and intro:** keep.
- **Meta description** (now empty):
  - **New:** An 8-day private Sharm El Sheikh package: Ras Mohammed, the Tiran reefs and the Sinai desert interior, with a stop in Cairo on the Nile.

### 8. Romantic Egypt (`/the-romantic-egypt-tour`)

Target: *romantic egypt tours*. Now at position 11.

- **Meta title:** now the H1, 46 characters + suffix.
  - **New:** Romantic Egypt Tour: 10 Days for Two
- **H1 and intro:** keep.
- **Meta description** (now empty):
  - **New:** A private 10-day Egypt tour paced for two: Cairo, Luxor, the Nile, Aswan and Alexandria, with a felucca at Elephantine and a dinner cruise.

---

### Also proposed: WordPress placeholder titles (2 documents)

| Document | Now | New |
|---|---|---|
| `wp-post-155175-en` (blog, Egypt holidays from the UK) | Egypt holidays from uK %page% %sep% %sitename% | Egypt Holidays from the UK |
| `wp-post-172212-ja` | イギリスからエジプトへの休暇 %page% %sep% %sitename% | イギリスからエジプトへの休暇 |

## Scope

This batch is English only. The Spanish batch comes next from the keyword map's ES table: the packages hub, cruises, the romantic tour and Abu Simbel.
