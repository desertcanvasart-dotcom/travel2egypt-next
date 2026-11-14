# Tour page upgrades — plan for owner approval (2026-11-14)

**Status: AWAITING OWNER DECISIONS.** Nothing has been written.

## What the audit found

| Area | Today | Gap |
|---|---|---|
| Structured data | All 210 tours emit `TouristTrip` with `offers` (price); hubs emit `ItemList` | ✓ Good. Nothing to fix. |
| Price on page | Shown on tours and hubs | ✓ |
| **Price in the Google snippet** | Not in titles or descriptions | Click rate on tour searches is **0.2%**. Searchers can't see a price until they click. |
| **FAQs on hubs** | 4 of 29 hubs (Nile cruise holidays, dahabiya, family, adventure) | **25 hubs have none**, including Luxor/Cairo private and small-group day tours |
| **FAQs on tours** | Not possible: the `tour` type has no FAQ field | 210 tours |
| **Reviews** | **0** review documents in Sanity; homepage reviews on hold | No reviews anywhere on tour pages |
| **Duplicate tours** | ~8 near-identical pairs | They split rankings for the same searches |

## U1 — "From $X" in tour snippets (code only, no new copy)

Add the price that's already on the page to the end of each tour's meta description. It's rendered from the price data in each visitor's currency, never typed by hand (Canon II §7):

- EN: `… From $85 per person.`
- ES: `… Desde 78 € por persona.`
- JA: `… 1名様あたり¥13,000から。`

Applies to all 200 tours that have a price; tours without one stay unchanged. Hub descriptions get the lowest price in the hub: "Luxor private day tours from $X."

**Decision 1:** approve this wording and its placement at the end of the description? (Titles stay price-free, so they don't change every time exchange rates move.)

## U2 — FAQs

**U2a (code):**
- Add the existing FAQ component and its FAQ rich-result markup to **tour** pages.
- Add a FAQ field to the `tour` type. This reuses the hub FAQ item type, so no new design is needed.

**U2b (content): needs facts only you can confirm.** Canon II §6 bans invented facts, and the data layer doesn't hold answers to most buyer questions. For example, `inclusions` is empty on the Luxor private day tours I sampled. So the plan is: I draft the questions and every answer I can source, and you confirm the rest.

Pilot: the 4 hubs with the most Search Console demand.
- Luxor private day tours
- Cairo private day tours
- Luxor small group day tours
- Cairo small group day tours

5–6 questions each. Proposed questions (taken from what people search for):

| Question | Source for the answer | Needs you? |
|---|---|---|
| What's included (guide, transport, entry tickets, lunch, water)? | Tour data where present | **Yes**: confirm the standard inclusions |
| Is the guide a licensed Egyptologist? | The hub copy already says "licensed Egyptologist guide" | No |
| Where do you pick up from, and at what time? | — | **Yes** |
| What is the cancellation policy? | /terms page | Check it matches what you actually offer |
| How big are the small groups? | Hub copy: "no more than ten" | No |
| Best time of day / season to visit? | Climate pages (verified) | No |
| Can we change the order or add a site? | — | **Yes** |

**Decision 2:** approve the pilot, and answer the four **Yes** rows in a sentence each? I'll then draft full FAQ copy into a locked review file for your sign-off.

## U3 — Reviews

There are no reviews in the system, and the Canon rules out writing any. Real reviews are the biggest trust signal that competitors show and we don't.

**Decision 3:** where are your genuine reviews? Options:
- **(a)** TripAdvisor
- **(b)** Google Business Profile
- **(c)** past-client emails/WhatsApp you can share, with permission
- **(d)** none yet. Then set up a post-trip review request first.

Once there's a real source, I'll add a "What travellers say" block to tour and hub pages. Note: Google no longer shows star ratings in results for a company's reviews of itself. The value is on-page trust and conversion, not stars in search.

## U4 — Merge duplicate tours

These pairs look like the same product listed twice. Merging means keeping one page, unpublishing the other, and adding a 301 redirect (same process as the June dedup).

| # | Keep? | Duplicate? |
|---|---|---|
| 1 | `desert-oasis-2-day-bahariya-oasis-private-tour-from-cairo` | `private-tour-2-day-trip-to-bahariya-oasis` |
| 2 | `mount-sinai-pilgrimage-2-day-trip-to-saint-catherine-from-cairo` | `private-tour-2-days-1-night-trip-to-saint-catherine-from-cairo` |
| 3 | `private-tour-memphis-saqqara-citadel-and-khan-el-khalili-bazaar` | `memphis-saqqara-citadel-khan-tour` |
| 4 | `egyptian-museum-citadel-and-khan-el-khalili-bazaar` | `egyptian-museum-and-bazaar-tour` |
| 5 | `dendera-and-abydos-temples-from-luxor` | `dendera-and-abydos-temples-day-tour` |
| 6 | `hurghada-quad-bike-tour` | `desert-quad-bike-safari-to-bedouin-village-from-hurghada` |
| 7 | 7-day dahabiya, 4 packages: `7-days-dahabiya-nile-cruise-from-aswan-to-luxor`, `7-days-luxor-to-aswan-dahabiya-cruise`, `7-days-luxury-dahabiya-cruise-on-the-nile`, `7-days-luxury-dahabiya-nile-cruise` (Meroe) | Boat-specific ones (Meroe) should stay separate. The generic ones probably merge. |

Pairs that only reverse direction (Luxor→Aswan vs Aswan→Luxor) or start from a different city are **not** listed. Those are real separate searches.

**Decision 4:** for each row, confirm "same product → merge into the left one", or "different, keep both". Before any merge, I'll check prices, inclusions and Search Console data for each pair so the page that ranks better is the one kept.

## Order once approved
1. U1 + U2a in one PR (code). Live within a day.
2. U2b pilot FAQs, after your answers. Then roll out to the other hubs and the top tours.
3. U4 merges, after your per-pair confirmation.
4. U3 once there's a real review source.
