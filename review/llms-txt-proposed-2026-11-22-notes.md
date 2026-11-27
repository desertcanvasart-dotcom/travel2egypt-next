# llms.txt: what changed and why (22 Nov 2026)

The proposed file is `review/llms-txt-proposed-2026-11-22.txt`. It replaces `public/llms.txt` only after the owner approves. Every changed fact below comes from the live site.

| Old llms.txt | Proposed | Source on the site |
|---|---|---|
| Founder "Mostafa Hassan" | Founder Islam Hussein | /about ("Founder Islam Hussein") and /contact |
| "Founded 1995", "30 years operating tours" | Worked in Egyptian travel since 1993; registered company since 2003 (no year-count) | /about ("I started guiding visitors in 1993", "In 2003 I registered my own company"), /contact |
| "JATA, IATA, ASTA accredited" | IATA (no. 9022839), JATA and ASTA member; Ministry of Tourism licence no. 2179; ETAA member | /contact#accreditations lists JATA and IATA only; the owner confirmed ASTA membership (22 Nov), so it stays, but the Contact page should list it too |
| "Egyptology training at Cairo University" | Removed | Not stated anywhere on the site |
| Day tours at `/tours/[slug]`, packages at `/packages/[slug]` | Tours and packages at `/<name>`; hubs `/tours`, `/private-day-tours`, `/group-day-tours`, `/packages`, `/small-group-travel-packages` | These URLs now redirect to the root address |
| "Pricing is prose, not a configurable number" | "From" price per person on each page, indicative, converted from EUR | Tour pages ("Prices are indicative, converted from EUR"); structured data carries the price |
| Guides: "Cairo, Luxor, Aswan to start" | City, region and monument guides across Egypt | /guide |
| Wiki covers dynasties, pharaohs, deities | Wiki = monuments; people, dynasties and deities not open to crawlers | robots.txt disallows `/wiki/people`, `/wiki/dynasties`, `/wiki/deities`; they are not in the sitemap |
| Contact hello@travel2egypt.org | info@travel2egypt.org, WhatsApp, phone, reply promise | /contact |
| Authorship claims about one author | Removed (articles carry their own bylines) | Article pages |

## Owner's answers (22 Nov 2026)
1. **Contact email:** info@travel2egypt.org is correct.
2. **ASTA:** yes, a member. Kept in llms.txt. The Contact page still lists only JATA and IATA.
3. **Scheduled departures:** yes, we run them (small-group departures page). The About page sentence "We do not run scheduled departures" is out of date and needs changing.
4. **Wiki sections:** keep people, dynasties and deities closed to crawlers for now; they are being completed and will open later. llms.txt says so.
5. **No affiliate links, no sponsored content:** confirmed.
