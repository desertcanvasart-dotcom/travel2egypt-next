# Footer brand lines (fix 6)

Branch `fix/footer-brand-lines`, from `main` at `a468d88`. Not deployed. Written 2026-09-26.

## Where the text lives

| Place | What it holds | Rendered? |
|---|---|---|
| `src/components/Footer.tsx`: `SISTER_BRANDS` (name and URL) and `SISTER_BRAND_DESCRIPTIONS` (one line per brand, keyed by locale) | The footer's "Other Travel2Egypt brands" block. The block heading comes from `messages/{en,es,ja}.json` `footer.sisterBrandsLabel`. | **Yes.** This is the source of the footer text. |
| Sanity `siteSettings.sisterBrands[]` (`name`, `url`, localized `description`) | A second copy of the same three brands. `siteSettingsQuery` fetches it. | Not in the footer. Only `name` and `url` are used, in the Organization JSON-LD (`src/lib/structured-data.ts`, `subOrganization`). The `description` is not rendered anywhere. |

The change is made in `Footer.tsx`, the rendering source. The Sanity copy is **not changed**: writing it would be a live data change, and the brief says not to deploy. The Sanity copy still says "Boutique luxury, Aswan-rooted." in EN/ES/JA. It has no effect on the page, but it should be brought in line (or the footer switched to read from Sanity) so there is only one source.

## Sillage line

`T2E_FOOTER_SILLAGE_LINE` was not set, so the default is used. The site has three locales (`messages/` has en, es and ja), and all three are changed:

| Locale | Before | After |
|---|---|---|
| EN | Boutique luxury, Aswan-rooted. | Private journeys with Egyptologists. |
| ES | Lujo boutique, con raíces en Asuán. | Viajes privados con egiptólogos. |
| JA | アスワンに根ざしたブティック・ラグジュアリー | エジプト学者と巡るプライベートな旅 |

The ES and JA lines are translations of the default. They follow the existing style: ES keeps the full stop, JA has none, like the other JA brand lines. The AffordEgypt and Sawa lines, and the rest of the footer, are unchanged.

## Sawa link

- **Footer:** the link is **already `https://sawa.tours/`** on `main`. Commit `692288a` ("consistent 1993 founding date, current population, sawa.tours") changed it. There is no `sawatours.org` link left in the footer, and none was changed here.
- **Sanity:** `siteSettings.sisterBrands` (Sawa) is also `https://sawa.tours/`.
- **Rest of the repo:** the only mention of `sawatours.org` is a comment in `src/lib/conciergePrompt.ts` recording the same earlier swap.
- **Does `sawatours.org` redirect to `sawa.tours`?** Not confirmed.
  - The domain resolves in DNS (`69.46.46.20`).
  - This environment's proxy refused the connections: `http://sawatours.org/` returned 403 from the proxy, and HTTPS to both `sawatours.org` and `sawa.tours` failed at the proxy.
  - So whether it redirects is unknown. Per the brief, the link should then be `https://sawa.tours/`, which it already is.
