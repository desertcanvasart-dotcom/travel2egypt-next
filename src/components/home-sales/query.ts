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
    heroImage{ ..., "alt": coalesce(alt[_key=="en"][0].value, "") }
  },
  "dahabiyaFromEur": math::min(*[_type == "tour" && !(_id in path("drafts.**")) && type == "package"
    && durationDays == 7 && priceFrom > 0
    && slug[_key=="en"][0].value.current match "*dahabiya*"].priceFrom)
}`;

export interface SalesProduct {
  slug: string;
  title: string;
  type?: string;
  priceFrom?: number | null;
  durationDays?: number | null;
  durationHours?: number | null;
  heroImage?: { asset?: unknown; alt?: string } | null;
}

export interface SalesHomeData {
  home: { heroImage?: { asset?: unknown; alt?: string } | null; heroCaption?: string } | null;
  products: SalesProduct[];
  dahabiyaFromEur: number | null;
}
