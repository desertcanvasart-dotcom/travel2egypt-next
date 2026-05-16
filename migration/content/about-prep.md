# About — page copy (FINAL)

> Polished editorial copy for the About page. Built on locked brand facts 
> (1993 personal entry / 2003 company registration / Aswan origin / 
> Tokyo-Syria-Jordan history / online-focused strategic downsize). All 
> claims defensible and operator-verified.

## Metadata

- **Intended URL**: `/about` (matches Footer link, previously 404 per session 37 carry-forward)
- **Type**: Editorial page via `editorialPage` schema (extends `kind` enum with `about`)
- **Build session**: TBD — Tier 1C, last item before Tier 1 closes
- **Locale strategy**: EN-only at first ship; ES + JA via batched translation pass
- **Status**: FINAL — ready for build session
- **Component**: Uses `<EditorialPageView>` (bonus from session 36)
- **Pattern reference**: /responsible-travel + /contact (sessions 36 + 37)

## Brand facts (locked — reflected in copy below)

- Islam in Egyptian travel: since 1993 (32+ years, started as guide)
- Career arc: guide → marketing manager → company owner
- Travel2Egypt company: registered 2003
- Previously operated branches in Tokyo, Syria, Jordan; Syria + Jordan closed
- Strategic downsize to online-only boutique model
- Cairo-headquartered; Aswan personal origin (Siwa = Soléi only, not T2E copy)
- Accreditations: JATA, IATA, ASTA, ETAA — all real
- Languages: English, Spanish, Japanese, Finnish, Arabic
- Response window: 8 PM Cairo same day (inquiry before 1 PM) / 10 AM Cairo next morning. 7 days/week.

---

## Hero section

**Heading:**

In the heart of Egypt

**Subhead:**

Thirty years of Egyptian travel, focused into a small company that answers 
to one person.

**CTAs:**

`[Talk to us on WhatsApp]` (wa.me/201158011600)

---

## Section: An Aswan childhood

I was born in Aswan, where the Nile narrows through granite and palms, 
refusing to be ordinary. As a child, those waters were a presence more than 
a thing — the granite holding heat after sunset, Nubian houses painted in 
colours the desert shouldn't allow, a riverbank where everyone knew 
everyone. My toy boat, uneven and sun-bleached, drifted in a current older 
than any country.

One afternoon a felucca passed, full of visitors. Cameras up, faces eager. 
I wanted to call out — to tell them what they were missing. The names of 
the islands. Which side of the Nile the morning light favours. The tales 
only a child raised on that riverbank could know. I had no English then. 
I hummed a Nubian tune instead.

That moment is, in a way, why I do what I do.

---

## Section: Thirty years of Egypt

I've spent 32 years working in Egyptian travel. I started in 1993 as a 
tour guide. Over the years that grew into marketing, then operations, then 
running a company with branches in Tokyo, Syria, and Jordan — serving 
travelers from markets that demand very different things from Egypt.

**Travel2Egypt has operated as a registered company since 2003.** After two 
decades of expansion, I made a deliberate decision: focus the operation. 
Smaller, online-first, founder-led. The Syria and Jordan branches closed. 
What remained was what mattered most — the direct relationships with 
travelers, the depth of local supplier knowledge that takes decades to 
build, and the freedom to choose how I work.

The result is a company that's smaller than it once was, but more focused. 
Every trip we organize is touched by someone who's spent 30 years figuring 
out what makes Egypt trips succeed and fail.

---

## Section: What this means for your trip

**Itineraries built around you, not us.** Most Egypt itineraries follow 
the same beats — pyramids, temples, a cruise, a souk. The photographs look 
identical because the routes are identical. We plan around how you 
actually want to move — slow or fast, deep or wide, alone or with family.

**Operators we'd send our own families to.** The Nile cruise captain we 
trust. The hotel that still has rooms with character. The driver who knows 
which mosque opens early and which one rewards the wait.

**The real story, not the postcard.** Every monument has two stories — 
the one for visitors, and the one that makes the stones come alive. 
You'll hear the second.

**Direct lines, fast answers.** When you write to us, you reach the 
operator. Not a junior in a call center. We respond within hours, seven 
days a week — by 8 PM Cairo time if you write before 1 PM, by 10 AM the 
next morning otherwise.

---

## Section: Credentials

We're members of:

- **JATA** — Japan Association of Travel Agents
- **IATA** — International Air Transport Association
- **ASTA** — American Society of Travel Advisors
- **ETAA** — Egyptian Travel Agents Association

We work in English, Spanish, Japanese, Finnish, and Arabic — because Egypt 
is most generous when you arrive on its own terms.

---

## Section: An invitation

From Aswan, where the Nile is most itself, to Cairo, where the city is 
loudest. From Elephantine's gardens to Kalabsha's silence. From a Nubian 
dinner to the back rooms of the souks.

Come see Egypt with someone who's lived its magic — not as a tourist with 
a checklist, but as a traveller meeting a country.

— Islam Hussein, Travel2Egypt

**Bottom CTA:**

`[Talk to us on WhatsApp]` (wa.me/201158011600 with pre-fill: "Hi 
Travel2Egypt, I read your About page and would like to start planning a 
trip.")

---

## Editorial decisions log

| Item | Decision |
|---|---|
| Opening | Aswan childhood + felucca scene + toy boat. Specific, sensory, distinctive. Avoids generic "founded by passionate traveler" framing. |
| 32-year framing | Lead with personal expertise (1993) not company age (2003). Personal depth is the stronger credential and harder to fake. |
| Tokyo/Syria/Jordan history | Included as past-tense achievement, not current operation. Shows international operational depth without overclaiming current scale. |
| Strategic downsize narrative | Reframed honestly as "deliberate decision to focus" — not as retreat or scale-down. Health context kept private. |
| "Smaller than it once was, but more focused" | Direct acknowledgment of the operational reality. More credible than pretending nothing changed. |
| 4 accreditations | Full list: JATA, IATA, ASTA, ETAA. The full set is a strong trust signal especially for the Japan market. |
| 5 languages | English, Spanish, Japanese, Finnish, Arabic — concrete, verifiable. |
| Response window in About copy | Repeats the commitment from /contact. Reinforces operational seriousness. |
| Removed: "since 2020" | Wrong — operator confirmed company registered 2003. |
| Removed: Siwa reference | Siwa = Soléi only; never in T2E brand copy. |
| Removed: "Over 10,000 tours delivered" | Not currently in copy. Add if operator can verify this number is current. |
| Removed: "11pm WhatsApp availability" | Generic claim. Replaced with the specific response-window commitment (8 PM / 10 AM) which is operationally honest. |
| Closing signature | "Islam Hussein, Travel2Egypt" — full name + company. Personal accountability. |
| CTA approach | Single WhatsApp CTA, consistent with /responsible-travel + /contact pattern from sessions 36/37. |

---

## Notes for build session

1. **Schema extension**: extend `editorialPage` schema `kind` enum to include 
   `about`. One-line addition (same pattern as session 34 / 36 / 37).

2. **Sanity import**: single `editorialPage` doc with stable ID 
   `editorial-page-about`. EN locale fully populated; ES + JA slots present 
   but blank (frontend falls back to EN).

3. **Frontend route**: `/[locale]/about` using `<EditorialPageView>` 
   component (the bonus from session 36, also used by /contact in session 37). 
   No bespoke component needed.

4. **WhatsApp CTA**: hero + bottom both link to wa.me/201158011600 with 
   pre-fill messages. Hero pre-fill: "Hi Travel2Egypt, I'd like to start 
   planning a trip." Bottom pre-fill: "Hi Travel2Egypt, I read your About 
   page and would like to start planning a trip."

5. **Footer cleanup dependency**: after /about ships, the Footer "About" 
   column has all 4 functional links (blog, about, responsible-travel, 
   contact). Tier 1D footer final-pass session can audit + close.

6. **Sitemap entry**: add `/about` to sitemap.ts at priority 0.7 (slightly 
   higher than editorial pages like /responsible-travel because /about is a 
   top-level company page). Match the pattern from session 37 /contact 
   addition.

7. **Translation keys**: `about.metaTitle` + `about.metaDescription` for 
   the page meta. ES + JA placeholder translations, flagged for batched 
   review.

8. **Verification reminder**: this is the first build session AFTER the 
   brand facts were locked. The build agent should treat the brand-facts 
   block in the session prompt as authoritative and not let any drift from 
   prior project memory contaminate the copy.

9. **Cross-link opportunities** (optional polish, not blocking):
   - "felucca" → /nile-cruises (when feluccas are surfaced) or /guide/aswan
   - "Cairo" mention → /guide/cairo when guide article exists
   - "Aswan" mention → /guide/aswan when guide article exists
   - Soléi or AffordEgypt mention → would not appear in About (sister 
     brands are footer-only references)

10. **About page is NOT the place to mention** Soléi or AffordEgypt sister 
    brands. They have their own positioning and live in the footer's 
    sister-brand strip. About is exclusively the Travel2Egypt story.

---

## SEO meta (translation namespace)

| Locale | Title | Description |
|---|---|---|
| EN | About Travel2Egypt \| 30 Years of Egyptian Travel | Egyptian-run, Cairo-headquartered. Founded by Islam Hussein, in Egyptian travel since 1993. JATA, IATA, ASTA, ETAA accredited. Founder-led, online-focused, intimate scale. |
| ES | (placeholder — translation review) | (placeholder — translation review) |
| JA | (placeholder — translation review) | (placeholder — translation review) |

---

*Polished copy finalized. Build pending session trigger. Once shipped, 
Footer About column will have all 4 functional links and Tier 1 closes.*
