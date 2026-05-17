# About — page copy (FINAL v2)

> **Replaces previous about-prep.md.** Operator-authored copy. More personal, 
> more specific, more honest. Acknowledges the realities of the scale-back 
> (Syrian war, post-2011 tourism shift, health-required choices) instead of 
> glossing them. /why-choose-us is killed and folds into this page; old 
> URL will redirect to /about at WP cutover (Tier 4B work, not this session).

## Metadata

- **Intended URL**: `/about` — replaces existing session-38 about content
- **Type**: Editorial page via `editorialPage` schema (kind: `about`)
- **Action**: UPDATE existing `editorial-page-about` doc in Sanity (do NOT 
  create new doc — replace body content of the existing one)
- **Build session**: TBD
- **Locale strategy**: EN-only at first ship; ES + JA via batched translation pass
- **Status**: FINAL — ready for build session
- **Component**: Uses `<EditorialPageView>` (no change from session 38)

## Brand facts referenced (locked)

- Islam in Egyptian travel since 1993 (started age 20 as a guide)
- Travel2Egypt company registered 2003
- Previously operated branches in Tokyo, Damascus, Amman
- Damascus closed (Syrian war), Amman closed (became difficult to justify)
- Post-2011 tourism economy shift drove model rethink
- Health-related choices factored into scale-back decision
- Now: online-only, founder-led, ~130 distinct trips/year, customized only
- Team: Egyptologist guides, drivers, ops staff in Cairo + Aswan + Luxor
- ETAA licensed
- Aswan personal origin (Nile half-block from house, granite hills, Nubian neighbors on Elephantine, felucca captains knew his father)
- 1980s Aswan childhood

## Key positioning shift from previous About

| Previous version | New version |
|---|---|
| "Thirty years of Egypt, focused into a small company..." | Same theme but earned through specific narrative |
| Generic accreditation list (all 4) | Only ETAA mentioned in body (the operational one) |
| Closing "Islam Hussein, Travel2Egypt" | "Islam Hussein, Founder, Travel2Egypt" |
| 4 "What this means" bullets | Implicit — woven through the narrative |
| Credentials section | None — body voice carries credibility |

---

## Hero section

**Heading:**

About

**Subhead:** *(none — opening paragraph carries the lede)*

**Hero CTA:** *(none — closing CTA only)*

---

## Section 1: An Aswan childhood

I grew up in Aswan in the 1980s. The Nile was a half-block from our door, 
and the granite hills above the city were where children went when they 
wanted to be alone. I learned the cataracts before I learned arithmetic. 
The Nubian families on Elephantine Island were our neighbors, and the 
felucca captains knew my father by name.

---

## Section 2: Thirty years of work

I started guiding visitors in 1993. I was twenty, and I knew the temples 
better than the textbook. The first group I took to Philae had no idea 
what they were looking at, and by the end of the morning I understood 
something that has shaped the next thirty years of my work: most people 
arrive in Egypt with the wrong expectations. The country they have read 
about and the country they are standing in are not the same place. Part 
of the work of a guide — and later, a tour operator — is to gently bridge 
that distance.

By the late 1990s I was running marketing for a Cairo-based operator. In 
2003 I registered my own company, Travel2Egypt. Over the next decade we 
opened branches in Tokyo, Damascus, and Amman. We had staff in four 
countries and routes that ran across the Middle East.

---

## Section 3: A deliberate decision

Then several things happened at once. The Syrian war closed our Damascus 
office. The Jordan branch became difficult to justify. The Egyptian 
tourism economy shifted under our feet during the years after 2011, and 
the model that had worked at scale stopped working. Around the same time, 
my health required me to make some choices about how to spend my time.

I made a deliberate decision to step back to a smaller operation. 
Online-only. Founder-led. The travelers we work with now reach me 
directly. The trips we plan are not pulled from a catalog. The guides we 
use are people I have known for fifteen or twenty years.

---

## Section 4: How we work now

The team photograph above is most of the people who actually deliver 
these trips: Egyptologist guides, drivers, operations staff in Cairo and 
Aswan and Luxor. We are licensed by the Egyptian Travel Agents 
Association, which most travelers will not care about, but which matters 
when something goes wrong on the ground. In thirty years of work in 
Egyptian tourism, the things that go wrong are not the things you can 
prepare for in advance. They are handled by people who know the country, 
the regulations, and each other.

Travel2Egypt now operates at a deliberately small scale. We plan roughly 
a hundred and thirty distinct trips a year, almost all of them built 
around the specific traveler rather than fitted to a template. We do not 
run scheduled departures. We do not bulk-book hotels. We do not sell 
add-ons. The work is closer to what a private travel adviser does than 
what an online tour platform does, and it produces a different kind of 
trip.

---

## Section 5: An invitation

What we do is plan journeys in Egypt and walk travelers through them. The 
journal is where we share what we have learned about traveling in this 
country well. The tour pages show some of what we currently offer, though 
most trips begin as a conversation rather than as a booking. When you are 
ready to talk through a trip of your own, you can reach me directly.

— Islam Hussein, Founder, Travel2Egypt

**Bottom CTA:**

`[Reach me on WhatsApp]` → wa.me/201158011600 with pre-fill: "Hi Islam, 
I read your About page and would like to start a conversation about a 
trip to Egypt."

---

## Editorial decisions log

| Item | Decision |
|---|---|
| Voice | First-person singular ("I grew up", "I made a deliberate decision"), shifts to plural for company ("we plan", "our Damascus office"). Reflects founder-led reality. |
| Pacing | Slow, essayistic. Longer sentences than About v1. Reads more like a letter than marketing copy. |
| Acknowledgment of scale-back | Explicit. Names the Syrian war, the Jordan justification problem, the post-2011 tourism shift, and the health factor. This honesty earns more trust than evasion would. |
| Health acknowledgment | "My health required me to make some choices about how to spend my time" — minimal, dignified, no detail. Operator's call on framing. |
| Tokyo/Damascus/Amman vs Tokyo/Syria/Jordan | City names instead of country names. More specific, more honest about scope. |
| Specific number (~130 trips/year) | Concrete operational claim. Replaces vague "boutique scale" hand-waving. |
| ETAA-only in body | Other accreditations live in footer tagline + JSON-LD. Body voice doesn't need a credentials checklist. |
| "Most travelers will not care about [ETAA]" | Direct acknowledgment that accreditations are inside-baseball. Then explains why it matters anyway. Operator-grade specificity. |
| "Things that go wrong are not the things you can prepare for in advance" | Earned insight from 30 years. Distinguishes from generic "we handle problems" claims. |
| Operational "do not"s (no scheduled departures, no bulk-book, no add-ons) | Specific commitments. Easier to verify than vague "personalized service" claims. |
| Photo reference | Body says "the team photograph above" — implies image at top of section 4. Build needs to handle (see build notes). |
| Signature | "Islam Hussein, Founder, Travel2Egypt" — adds "Founder" title (more formal than session 38). |
| No "Credentials" section | Removed. Replaced by inline ETAA reference. JATA/IATA/ASTA still in footer + structured data. |
| Cross-links | Body mentions "the journal" (→ /blog) and "the tour pages" (→ /tours). Build links these inline. |
| Why-choose-us section | None. The "why us" content is woven through the narrative (operational specifics in Section 4, deliberate scale-back framing in Section 3). |
| Sister brands | No mention. Soléi + AffordEgypt belong in footer strip only. |
| Length | ~580 words. Longer than About v1 (~450 words). Earned by the narrative. |

---

## Notes for build session

1. **UPDATE existing Sanity doc** — the `editorial-page-about` doc was 
   created in session 38. This session REPLACES its body content, not 
   creates a new doc. Same `_id`, same slug, same kind. Just new body PT.

2. **Hero changes**:
   - Old heading: "In the heart of Egypt"
   - New heading: "About"
   - Old subhead: "Thirty years of Egyptian travel, focused into a small 
     company that answers to one person."
   - New subhead: NONE (opening paragraph carries the lede)
   - Old hero CTA: WhatsApp button
   - New hero CTA: NONE (closing CTA only)

3. **Section structure changes**:
   - Old: 5 sections (Aswan childhood, Thirty years of Egypt, What this 
     means, Credentials, Invitation)
   - New: 5 sections (Aswan childhood, Thirty years of work, A deliberate 
     decision, How we work now, Invitation)
   - Schema doesn't need changes — same section pattern, different content.

4. **Markdown → portable text conversion**:
   - Preserve paragraph breaks exactly (the operator's pacing matters)
   - Preserve italic for any emphasis (none in current draft, but check)
   - "felucca", "Elephantine", "cataracts", "Philae" — proper nouns, no 
     special treatment
   - Em-dashes: preserve "—" as em-dash, not "--" or "-"

5. **Team photo handling — STOP gate**:
   - Section 4 begins "The team photograph above is most of the people who 
     actually deliver these trips..."
   - At build time, ONE of:
     - (a) Operator provides team photo before build → place at top of 
       Section 4 (preferred)
     - (b) Build with placeholder image + flag photo upload as Tier 3 
       editorial backlog
     - (c) Edit body to remove "above" reference if no photo coming soon: 
       "The people who actually deliver these trips are Egyptologist 
       guides, drivers, operations staff..."
   - Build pre-flight surfaces this for operator decision before importing.

6. **Cross-links to add inline**:
   - "the journal" → /blog (or /journal if that's the correct route)
   - "the tour pages" → /tours
   - Both link in Section 5
   - Build session verifies these routes exist and adds the links

7. **Bottom CTA**:
   - Single WhatsApp button: "Reach me on WhatsApp"
   - URL: wa.me/201158011600
   - Pre-fill: "Hi Islam, I read your About page and would like to start 
     a conversation about a trip to Egypt."

8. **SEO meta update needed** (translation namespace):
   - Old EN title: "About Travel2Egypt | 30 Years of Egyptian Travel"
   - New EN title: "About Travel2Egypt | Founder Islam Hussein"
   - Old EN desc: focused on accreditations + structure
   - New EN desc: "Travel2Egypt is a small, founder-led tour operator 
     based in Cairo. Islam Hussein started guiding in 1993 and registered 
     the company in 2003. Online-only, deliberately small scale, about 
     130 customized trips a year."

9. **/why-choose-us decision**:
   - Confirmed: page is NOT built as a Next.js route. Folds into /about.
   - WP redirect: `/why-choose-us` → `/about` (added to WP→Next.js redirect 
     map for Tier 4B work, not this session)
   - Update `migration/legacy-page-audit.md` if it exists to record this 
     decision

10. **Update TODO**: Tier 2B (/why-choose-us) is REMOVED from the queue. 
    This is good — one fewer Tier 2 session.

11. **Locale fallback**: EN content. ES/JA fall back to EN body until 
    translations land. The new copy is significantly different from v1; 
    ES/JA translations from session 38 (if they existed at all — they 
    were placeholders) need to be redone.

12. **Don't break the previous merge**: this is an UPDATE to existing 
    content, not a new build. The session-38 work is preserved structurally; 
    only body content changes.

---

## SEO meta (translation namespace, updated)

| Locale | Title | Description |
|---|---|---|
| EN | About Travel2Egypt \| Founder Islam Hussein | Travel2Egypt is a small, founder-led tour operator based in Cairo. Islam Hussein started guiding in 1993 and registered the company in 2003. Online-only, deliberately small scale, about 130 customized trips a year. |
| ES | (placeholder — translation review) | (placeholder — translation review) |
| JA | (placeholder — translation review) | (placeholder — translation review) |

---

*Updated copy finalized. Replaces about-prep.md v1 from session 38. Build 
session updates existing editorial-page-about Sanity doc with new body 
content. /why-choose-us removed from Tier 2 queue — redirects to /about 
at WP cutover.*
