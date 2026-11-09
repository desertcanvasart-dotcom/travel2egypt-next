# Plan: getting tour, package and cruise pages to rank (9 Nov 2026)

## Where we start (Ahrefs, 9 Nov)

- **Organic traffic is about 583 a month, down from 3,500–4,000 in 2025.** It slid from October 2025 (before the migration), recovered in April–May 2026, then fell again from August.
- **All of that traffic goes to informational pages:** guides, blog and wiki. **No tour, package or cruise page gets meaningful search traffic.** The best one gets 6 visits, for "what time is it in cairo". The homepage gets 5.
- **Spanish is the biggest search market** (24% of traffic), then Egypt (15%), the US (14%) and the UK (6%).
- **DR is 22**, with 965 referring domains. The real links are good (Wikipedia, eldiario.es, World Nomads, Egyptian Streets); this year's surge is mostly spam that Google ignores.
- **AI assistants cite the site 540 times** across 221 pages, so the content works as a reference.
- **The on-page basics are already done.** Product titles and headings are descriptive ("7-Day Egypt Tour: Cairo, the Nile Cruise, Luxor and Aswan"), product markup is in place, pages are fast and cached (#185/#186), and hubs are priced (#177/#178).
- **The main gaps are links:**
  1. Ranking content barely points to products. Blog articles link to **0** products, even the Sphinx article that ranks for "great sphinx of giza" (450 searches a month).
  2. Some guide pages link to the wrong products. Tawila Island (a Hurghada-area island) links to El Gouna temple tours; the Black Pyramid (Dahshur) links to a 15-day cruise.
  3. Nothing tells Google which page should win each commercial search.
  4. There are few external links to commercial pages, so DR 22 can't compete for terms like "Nile cruise".

## The plan

### Phase A: quick wins (no decisions needed, about 1–2 days)

1. **Recover broken backlinks.** Ahrefs' *Broken backlinks* report lists external links that point at old addresses now returning 404. Each one gets a redirect to the right new page, which recovers authority we already earned. This is the same method as the earlier redirect rounds, hand-edited, with the integrity test.
2. **Add tour blocks to blog articles.** Use the same priced, "Check this date" product block the guides already have, chosen by the article's city or topic. Start with the 30 articles that have traffic, then the rest.
3. **Fix mismatched guide links.** Audit the tour blocks on the 50 guide and wiki pages with the most traffic, so each points to the product a reader of that page would actually book.

### Phase B: one target search per commercial page (needs your OK on Ahrefs credits)

4. **Build a keyword map.** For each language, list about 20 commercial searches and assign each to exactly **one** page, so no two pages compete. A first draft:

   | Search (EN) | Page |
   |---|---|
   | egypt tour packages / private egypt tours | `/egypt-travel-packages` |
   | nile cruise / nile cruise luxor aswan | `/nile-cruises` |
   | 7 day egypt tour | the 7-Day package |
   | 10 day egypt tour | one of the two 10-day packages (pick one) |
   | giza pyramids tour / pyramids and GEM tour | the Giza + GEM day tour |
   | cairo day tours / luxor day tours / aswan day tours | the city day-tour hubs |
   | dahabiya cruise | the dahabiya landing |

   The Spanish list would cover terms like "viaje a Egipto", "crucero por el Nilo", "excursiones en El Cairo" and "tour privado Egipto". Japanese is smaller and lower priority.

   Volumes and difficulty come from Ahrefs Keywords Explorer, which uses your plan's credits, or from Search Console, which is free.

5. **Align each page to its search.** Mostly small edits:
   - **Title:** lead with the term, e.g. "Nile Cruises from Luxor to Aswan | Ships & Dahabiyas".
   - **First paragraph:** answer the search directly, with price and duration.
   - **FAQ block:** 3–5 real questions from Search Console or "People also ask", with FAQ markup.
   - All of it goes through your copy approval, as with the meta descriptions.

### Phase C: help Google recrawl (about 1 hour, in Search Console)

6. **In Search Console:**
   - Resubmit the sitemap.
   - Request indexing for the 20–30 mapped pages.
   - Confirm old addresses show as "Page with redirect", not "Not found".
   - Read the Search Console clicks trend for the last 16 months, the real numbers behind Ahrefs' estimate, to confirm which pages lost the most.

### Phase D: authority for commercial pages (ongoing, owner-led)

7. **Build 5–10 relevant links a quarter to the hubs and top products.** Good sources are travel press, Spanish-language travel media (your strongest market), tourism partners, the sister brands, and guest pieces that cite the guides. Point them at commercial pages, not the blog.

### Measuring

- **Ahrefs Rank Tracker** (already in your account): track the ~40 mapped searches (EN + ES), checked monthly.
- **Search Console:** clicks and impressions to tour, package and cruise pages.
- **Baseline today:** about 0 product-page clicks. A realistic first goal is mapped pages on page 1–2 for the long-tail terms ("10 day egypt private tour", "giza pyramids and gem private tour") within 2–3 months. The head terms ("nile cruise") take longer and need Phase D.

## Order I'd recommend

**A1** (broken backlinks) → **A2** (blog tour blocks) → **A3** (guide link fixes) → **B4** (keyword map, after your OK on credits) → **B5** (page alignment, your copy approval) → **C6** (Search Console, about 15 minutes of your time with me reading along) → **D7** (ongoing).
