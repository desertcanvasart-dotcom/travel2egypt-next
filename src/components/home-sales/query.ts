import { groq } from 'next-sanity';
import { guidePriceParam, guidePricedParam } from '@/sanity/lib/guidePrice';

import { EN_SLUG, LOCAL_SLUG, PRODUCTS_BY_SLUGS_FILTER } from '@/lib/products/bySlug';

/**
 * One batched read for every product the sales homepage shows, in $locale.
 * Products are matched by EN slug (config keys); `href` is this language's
 * slug. Inclusions are locale-strict so an ES/JA card never shows English.
 */
export const salesHomeQuery = groq`{
  "home": *[_type == "homePage"][0]{
    heroImage{ ..., "alt": coalesce(alt[_key==$locale][0].value, alt[_key=="en"][0].value, "") },
    "heroCaption": coalesce(heroCaption[_key==$locale][0].value, heroCaption[_key=="en"][0].value, "")
  },
  "products": *[${PRODUCTS_BY_SLUGS_FILTER}]{
    "slug": ${EN_SLUG},
    "href": ${LOCAL_SLUG},
    "title": coalesce(title[_key==$locale][0].value, title[_key=="en"][0].value, ""),
    type,
    "priceFrom": ${guidePriceParam},
    "guidePriced": ${guidePricedParam},
    durationDays,
    durationHours,
    "included": includedItems[_key==$locale][0].value[0...3],
    heroImage{ ..., "alt": coalesce(alt[_key==$locale][0].value, alt[_key=="en"][0].value, "") }
  },
  "responseTime": *[_type == "siteSettings"][0]{
    "short": coalesce(responseTimeShort[_key==$locale][0].value, responseTimeShort[_key=="en"][0].value, ""),
    "full": coalesce(responseTimeFull[_key==$locale][0].value, responseTimeFull[_key=="en"][0].value, "")
  },
  "accreditations": *[_type == "siteSettings"][0]{ ministryLicenceNumber, etaaMember, iataNumber },
  // The cheapest PRICED 7-day dahabiya product. The panel shows its price and
  // duration and links to it, so the figure always equals the landing page.
  "dahabiya": *[_type == "tour" && !(_id in path("drafts.**")) && type == "package"
    && durationDays == 7 && priceFrom > 0
    && slug[_key=="en"][0].value.current match "*dahabiya*"] | order(priceFrom asc)[0]{
      "slug": slug[_key=="en"][0].value.current,
      "href": coalesce(slug[_key==$locale][0].value.current, slug[_key=="en"][0].value.current),
      "title": coalesce(title[_key==$locale][0].value, title[_key=="en"][0].value, ""),
      "priceFrom": ${guidePriceParam},
      durationDays
    }
}`;

export interface SalesProduct {
  /** EN slug (config key). */
  slug: string;
  /** This language's slug, for links. */
  href: string;
  title: string;
  type?: string;
  priceFrom?: number | null;
  /** ES/JA: the price is the Spanish/Japanese-speaking-guide price. */
  guidePriced?: boolean | null;
  durationDays?: number | null;
  durationHours?: number | null;
  included?: string[] | null;
  heroImage?: { asset?: unknown; alt?: string } | null;
}

export interface SalesHomeData {
  home: { heroImage?: { asset?: unknown; alt?: string } | null; heroCaption?: string } | null;
  products: SalesProduct[];
  dahabiya: { slug: string; href: string; title: string; priceFrom: number; durationDays?: number | null } | null;
  responseTime?: { short?: string; full?: string } | null;
  accreditations?: { ministryLicenceNumber?: string | null; etaaMember?: boolean | null; iataNumber?: string | null } | null;
}
