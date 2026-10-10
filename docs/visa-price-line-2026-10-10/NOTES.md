# Stale-claim pass: GEM opening date and visa price (2026-10-10)

## Visa: `/travel-tips/passport-and-visa` (`wp-page-60911`), edited
The EN and ES opening sentences said the airport bank counter sells visa stickers "for exactly thirty US dollars". The $30 fee has applied since 1 March 2026. But since 1 August 2026, Cairo airport has also been piloting a digital visa on arrival with a QR code, costing $36 ($30 plus a $6 issuance charge). So "exactly" no longer holds for every arrival. The price is removed from that scene-setting sentence, and nothing else changed. The JA body was not touched.

- EN: "...looking for the small bank counter that sells visa stickers."
- ES: "...buscando el pequeño mostrador del banco que vende los sellos de visado."
- Patched the published doc with `ifRevisionID` `I3z6540U8Hkd6LbcFYJnYz`, giving new rev `txIIGYqY4cWJMKfC4tG58i`. The pre-edit copy is `wp-page-60911-before.json`.

## GEM: no edit
`/blog/1-day-giza-pyramids-itinerary` and `/blog/where-is-tutankhamun-now` say the GEM "opened formally/officially on 1 November 2025". That is correct: the inauguration ceremony was 1 Nov 2025, and the museum opened to the public on 4 Nov. The Phase 1 flag came from the ES Cairo page disagreeing, not from the date being wrong.

## For the owner
- The page has no line on the Cairo QR-code pilot. The JA section still describes paying $30 cash at the Cairo bank counter. Reports differ on whether Cairo is now card-only, so this needs a decision.

## Follow-up the same day: Cairo QR-code paragraph added (owner request)
- EN: new block `qr2026en01`, after the cash note (`000000000017`).
- ES: new block `qr2026es01`, after `000000000019`.
- JA: new blocks `qr2026ja01` (a ▸ label) and `qr2026ja02`, at the end of the アライバルビザ section, before 方法❷.
- The "updated" footer lines were changed to October 2026 in all three languages.
- Rev `txIIGYqY4cWJMKfC4tG58i` became `txIIGYqY4cWJMKfC4tGoz0`. The pre-edit copy is `wp-page-60911-before-qr.json`. To roll back, unset the four `qr2026*` keys and restore the footers.
- Facts stated: pilot at Cairo International since 1 Aug 2026; QR code requested via the official portal, the app or the arrival-hall kiosks; requests from 48 h before departure, in flight or after landing; code valid 48 h; $36 = $30 + $6 issuing charge, paid electronically; paper sticker still sold during the pilot; other airports use the sticker only; e-Visa holders unaffected.
- Left out on purpose because sources disagree: the portal address (visaonarrival.gov.eg vs apps.visaonarrival.gov.eg) and whether Cairo is card-only.
