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
    "allSlugs": slug[]{ _key, "current": value.current },
    "summary": ${localizedField('summary', locale)},
    "overview": overview[_key == "${locale}"][0].value,
    "keyFacts": {
      "bestSeason": ${localizedField('keyFacts.bestSeason', locale)},
      "gettingThere": ${localizedField('keyFacts.gettingThere', locale)},
      "daysNeeded": ${localizedField('keyFacts.daysNeeded', locale)}
    },
    heroImage{
      ...,
      "alt": coalesce(alt[_key=="${locale}"][0].value, alt[_key=="en"][0].value),
      "caption": coalesce(caption[_key=="${locale}"][0].value, caption[_key=="en"][0].value)
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
// Tours & packages
// ──────────────────────────────────────────────

/**
 * Fields shared by the tour and package detail pages and any related-tour
 * card. Both day tours and packages live in the same `tour` document; the
 * `type` field discriminates.
 */
const tourCardProjection = (locale: Locale) => `
  _id,
  type,
  dayTourMode,
  durationDays,
  "title": ${localizedField('title', locale)},
  "slug": ${localizedSlug('slug', locale)},
  "allSlugs": slug[]{ _key, "current": value.current },
  "summary": ${localizedField('summary', locale)},
  "durationLabel": ${localizedField('durationLabel', locale)},
  "priceIndication": ${localizedField('priceIndication', locale)},
  heroImage{
    ...,
    "alt": coalesce(alt[_key=="${locale}"][0].value, alt[_key=="en"][0].value)
  },
  "cities": cities[]->{
    _id,
    "name": ${localizedField('name', locale)},
    "slug": ${localizedSlug('slug', locale)}
  },
  "theme": theme->{
    _id,
    "name": ${localizedField('name', locale)},
    "slug": ${localizedSlug('slug', locale)},
    orderRank
  }
`;

/**
 * Single tour or package by slug. Pulls everything the detail page needs:
 * body, highlights, inclusions/exclusions, itinerary, related tours,
 * related guide content, traveler stories.
 */
export const tourBySlugQuery = (locale: Locale) => groq`
  *[_type == "tour" && (
    slug[_key == "${locale}"][0].value.current == $slug ||
    (slug[_key == "${locale}"][0].value.current == null &&
     slug[_key == "en"][0].value.current == $slug)
  )][0]{
    ${tourCardProjection(locale)},
    "body": body[_key == "${locale}"][0].value,
    "highlights": coalesce(
      highlights[_key == "${locale}"][0].value,
      highlights[_key == "en"][0].value
    ),
    "inclusions": inclusions[_key == "${locale}"][0].value,
    "exclusions": exclusions[_key == "${locale}"][0].value,
    "itinerary": itinerary[_key == "${locale}"][0].value,
    gallery[]{
      ...,
      "alt": ${localizedField('alt', locale)}
    },
    "relatedTours": relatedTours[]->{
      ${tourCardProjection(locale)}
    },
    "relatedGuides": relatedGuides[]->{
      _id,
      _type,
      "title": coalesce(${localizedField('title', locale)}, ${localizedField('name', locale)}),
      "slug": ${localizedSlug('slug', locale)},
      "summary": ${localizedField('summary', locale)},
      heroImage{
        ...,
        "alt": coalesce(alt[_key=="${locale}"][0].value, alt[_key=="en"][0].value)
      },
      "parentCity": parentCity->{
        "slug": ${localizedSlug('slug', locale)}
      }
    },
    "relatedGuideArticles": *[
      _type == "guideArticle" &&
      parentCity._ref in ^.cities[]._ref
    ] | order(orderRank asc)[0...4]{
      _id,
      "_type": "guideArticle",
      "title": ${localizedField('title', locale)},
      "slug": ${localizedSlug('slug', locale)},
      "summary": ${localizedField('summary', locale)},
      heroImage{
        ...,
        "alt": coalesce(alt[_key=="${locale}"][0].value, alt[_key=="en"][0].value)
      },
      "parentCity": parentCity->{
        "slug": ${localizedSlug('slug', locale)}
      }
    },
    "relatedTravelerStories": relatedTravelerStories[]->{
      _id,
      "title": ${localizedField('title', locale)},
      "slug": ${localizedSlug('slug', locale)},
      "excerpt": ${localizedField('excerpt', locale)},
      authorName,
      authorOrigin
    },
    seo{
      "metaTitle": ${localizedField('metaTitle', locale)},
      "metaDescription": ${localizedField('metaDescription', locale)},
      ogImage
    }
  }
`;

/**
 * All day tours, ordered for listing pages. Optionally filtered by mode
 * (private/group). Pass `mode` as null to get all modes.
 */
export const allDayToursQuery = (locale: Locale) => groq`
  *[_type == "tour" && type == "dayTour"] | order(_createdAt desc){
    ${tourCardProjection(locale)}
  }
`;

/**
 * All packages, ordered for listing pages.
 */
export const allPackagesQuery = (locale: Locale) => groq`
  *[_type == "tour" && type == "package"] | order(_createdAt desc){
    ${tourCardProjection(locale)}
  }
`;

/**
 * Day tours filtered by mode (private or group). Used by the /tours
 * landing's mode filter when a mode is selected via search params.
 */
export const dayToursByModeQuery = (locale: Locale) => groq`
  *[_type == "tour" && type == "dayTour" && dayTourMode == $mode] | order(_createdAt desc){
    ${tourCardProjection(locale)}
  }
`;

/**
 * Packages grouped by theme. Returns a list of themes ordered by orderRank,
 * each with its packages nested. Themes without packages are filtered out.
 */
export const packagesByThemeQuery = (locale: Locale) => groq`
  *[_type == "theme"] | order(orderRank asc){
    _id,
    "name": ${localizedField('name', locale)},
    "slug": ${localizedSlug('slug', locale)},
    "description": ${localizedField('description', locale)},
    orderRank,
    "packages": *[_type == "tour" && type == "package" && references(^._id)] | order(durationDays asc){
      ${tourCardProjection(locale)}
    }
  }[count(packages) > 0]
`;

/**
 * Slug discovery for static generation of /tours/[slug] and /packages/[slug].
 */
export const allTourSlugsQuery = groq`
  *[_type == "tour"]{
    _id,
    type,
    "slugs": slug[]{ _key, "current": value.current }
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
