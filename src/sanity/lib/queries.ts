/**
 * GROQ queries for the site.
 *
 * Pattern:
 *  - All queries take a `locale` parameter.
 *  - Localized fields are projected with EN fallback via the helpers in i18n.ts.
 *  - References are resolved with `->` and project the localized fields they need.
 *  - Slugs are queried by EN slug (the canonical), with locale-specific slugs
 *    used only for URL generation in `getLocalizedHref`.
 */

import { groq } from 'next-sanity';

import type { Locale } from '@/i18n/routing';

import { localizedField, localizedSlug } from './i18n';

// ──────────────────────────────────────────────
// City guide
// ──────────────────────────────────────────────

/**
 * Single city guide page query. Pulls overview, key facts, sub-articles,
 * related tours, hero image — everything the /guide/[citySlug] page renders.
 */
export const cityBySlugQuery = (locale: Locale) => groq`
  *[_type == "city" && (
    slug[_key == "${locale}"][0].value.current == $slug ||
    (slug[_key == "${locale}"][0].value.current == null &&
     slug[_key == "en"][0].value.current == $slug)
  )][0]{
    _id,
    region,
    coordinates,
    "name": ${localizedField('name', locale)},
    "slug": ${localizedSlug('slug', locale)},
    "summary": ${localizedField('summary', locale)},
    "overview": overview[_key == "${locale}"][0].value,
    "keyFacts": {
      "bestSeason": ${localizedField('keyFacts.bestSeason', locale)},
      "gettingThere": ${localizedField('keyFacts.gettingThere', locale)},
      "daysNeeded": ${localizedField('keyFacts.daysNeeded', locale)}
    },
    heroImage{
      ...,
      "alt": ${localizedField('heroImage.alt', locale)},
      "caption": ${localizedField('heroImage.caption', locale)}
    },
    "subArticles": *[_type == "guideArticle" && references(^._id)] | order(orderRank asc){
      _id,
      "title": ${localizedField('title', locale)},
      "slug": ${localizedSlug('slug', locale)},
      "summary": ${localizedField('summary', locale)},
      heroImage
    },
    "relatedTours": *[_type == "tour" && references(^._id)] | order(_createdAt desc)[0...6]{
      _id,
      type,
      durationDays,
      "title": ${localizedField('title', locale)},
      "slug": ${localizedSlug('slug', locale)},
      "summary": ${localizedField('summary', locale)},
      "durationLabel": ${localizedField('durationLabel', locale)},
      heroImage
    },
    seo{
      "metaTitle": ${localizedField('metaTitle', locale)},
      "metaDescription": ${localizedField('metaDescription', locale)},
      ogImage
    }
  }
`;

/**
 * All cities — for the /guide landing page and for sitemap generation.
 */
export const allCitiesQuery = (locale: Locale) => groq`
  *[_type == "city"] | order(orderRank asc){
    _id,
    region,
    "name": ${localizedField('name', locale)},
    "slug": ${localizedSlug('slug', locale)},
    "summary": ${localizedField('summary', locale)},
    heroImage
  }
`;

// ──────────────────────────────────────────────
// Site settings (singleton)
// ──────────────────────────────────────────────

export const siteSettingsQuery = (locale: Locale) => groq`
  *[_type == "siteSettings"][0]{
    "siteName": ${localizedField('siteName', locale)},
    "tagline": ${localizedField('tagline', locale)},
    contact,
    socialLinks,
    sisterBrands[]{
      name,
      url,
      logo,
      "description": ${localizedField('description', locale)}
    },
    "defaultTrustBadges": defaultTrustBadges[]->{
      _id,
      name,
      "label": ${localizedField('label', locale)},
      image,
      linkUrl
    }
  }
`;

// ──────────────────────────────────────────────
// Slug discovery (for static generation)
// ──────────────────────────────────────────────

export const allCitySlugsQuery = groq`
  *[_type == "city"]{
    "slugs": slug[]{ _key, "current": value.current }
  }
`;
