import { groq } from 'next-sanity';

/** One batched read for every product the English sales homepage shows. */
export const salesHomeQuery = groq`{
  "home": *[_type == "homePage"][0]{
    heroImage{ ..., "alt": coalesce(alt[_key=="en"][0].value, "") },
    "heroCaption": coalesce(heroCaption[_key=="en"][0].value, "")
  },
  "products": *[_type == "tour" && !(_id in path("drafts.**")) && slug[_key=="en"][0].value.current in $slugs]{
    "slug": slug[_key=="en"][0].value.current,
    "title": coalesce(title[_key=="en"][0].value, ""),
    type,
    priceFrom,
    durationDays,
    durationHours,
    "included": includedItems[_key=="en"][0].value[0...3],
    heroImage{ ..., "alt": coalesce(alt[_key=="en"][0].value, "") }
  },
  "responseTime": *[_type == "siteSettings"][0]{
    "short": coalesce(responseTimeShort[_key=="en"][0].value, ""),
    "full": coalesce(responseTimeFull[_key=="en"][0].value, "")
  },
  "accreditations": *[_type == "siteSettings"][0]{ ministryLicenceNumber, etaaMember, iataNumber },
  // The cheapest PRICED 7-day dahabiya product. The panel shows its price and
  // duration and links to it, so the figure always equals the landing page.
  "dahabiya": *[_type == "tour" && !(_id in path("drafts.**")) && type == "package"
    && durationDays == 7 && priceFrom > 0
    && slug[_key=="en"][0].value.current match "*dahabiya*"] | order(priceFrom asc)[0]{
      "slug": slug[_key=="en"][0].value.current,
      "title": coalesce(title[_key=="en"][0].value, ""),
      priceFrom,
      durationDays
    }
}`;

export interface SalesProduct {
  slug: string;
  title: string;
  type?: string;
  priceFrom?: number | null;
  durationDays?: number | null;
  durationHours?: number | null;
  included?: string[] | null;
  heroImage?: { asset?: unknown; alt?: string } | null;
}

export interface SalesHomeData {
  home: { heroImage?: { asset?: unknown; alt?: string } | null; heroCaption?: string } | null;
  products: SalesProduct[];
  dahabiya: { slug: string; title: string; priceFrom: number; durationDays?: number | null } | null;
  responseTime?: { short?: string; full?: string } | null;
  accreditations?: { ministryLicenceNumber?: string | null; etaaMember?: boolean | null; iataNumber?: string | null } | null;
}
