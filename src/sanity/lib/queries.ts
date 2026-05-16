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

import {
  localizedField,
  localizedSlug,
  portableTextBodyProjection,
  articleBodyMarkProjection,
} from './i18n';

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
    "overview": ${portableTextBodyProjection('overview', locale)},
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
      section,
      "title": ${localizedField('title', locale)},
      "slug": ${localizedSlug('slug', locale)},
      "summary": ${localizedField('summary', locale)},
      heroImage
    },
    "placesToGo": placesToGo[]->{
      _id,
      "name": ${localizedField('name', locale)},
      "slug": ${localizedSlug('slug', locale)},
      "summary": ${localizedField('summary', locale)},
      "visitorInfo": ${portableTextBodyProjection('visitorInfo', locale)},
      monumentType,
      heroImage{
        ...,
        "alt": coalesce(alt[_key=="${locale}"][0].value, alt[_key=="en"][0].value)
      }
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
 * Single guide article (leaf page) by parent-city slug + article slug.
 * Pulls article body + the same sidebar dataset as the parent city, so the
 * leaf page can render the same nav widget the city page does.
 */
export const guideArticleBySlugQuery = (locale: Locale) => groq`
  *[_type == "guideArticle" && (
    slug[_key == "${locale}"][0].value.current == $slug ||
    (slug[_key == "${locale}"][0].value.current == null &&
     slug[_key == "en"][0].value.current == $slug)
  ) && (
    parentCity->slug[_key == "${locale}"][0].value.current == $citySlug ||
    (parentCity->slug[_key == "${locale}"][0].value.current == null &&
     parentCity->slug[_key == "en"][0].value.current == $citySlug)
  )][0]{
    _id,
    section,
    "title": ${localizedField('title', locale)},
    "slug": ${localizedSlug('slug', locale)},
    "allSlugs": slug[]{ _key, "current": value.current },
    "summary": ${localizedField('summary', locale)},
    "body": ${portableTextBodyProjection('body', locale)},
    heroImage{
      ...,
      "alt": coalesce(alt[_key=="${locale}"][0].value, alt[_key=="en"][0].value)
    },
    "parentCity": parentCity->{
      _id,
      "name": ${localizedField('name', locale)},
      "slug": ${localizedSlug('slug', locale)},
      "allSlugs": slug[]{ _key, "current": value.current },
      "subArticles": *[_type == "guideArticle" && references(^._id)] | order(orderRank asc){
        _id,
        section,
        "title": ${localizedField('title', locale)},
        "slug": ${localizedSlug('slug', locale)},
        "summary": ${localizedField('summary', locale)}
      },
      "placesToGo": placesToGo[]->{
        _id,
        "name": ${localizedField('name', locale)},
        "slug": ${localizedSlug('slug', locale)},
        "summary": ${localizedField('summary', locale)},
        "visitorInfo": ${portableTextBodyProjection('visitorInfo', locale)},
        monumentType
      }
    },
    "relatedTours": relatedTours[]->{
      _id, type, durationDays,
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

export const allGuideArticleSlugsQuery = groq`
  *[_type == "guideArticle"]{
    _id,
    "slugs": slug[]{ _key, "current": value.current },
    "parentCitySlugs": parentCity->slug[]{ _key, "current": value.current }
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
  tourMode,
  durationDays,
  durationHours,
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
    "body": ${portableTextBodyProjection('body', locale)},
    "highlights": coalesce(
      highlights[_key == "${locale}"][0].value,
      highlights[_key == "en"][0].value
    ),
    "inclusions": ${portableTextBodyProjection('inclusions', locale)},
    "exclusions": ${portableTextBodyProjection('exclusions', locale)},
    "days": days[]{
      dayNumber,
      "title": ${localizedField('title', locale)},
      "cities": cities[]->{
        _id,
        "name": ${localizedField('name', locale)},
        "slug": ${localizedSlug('slug', locale)}
      },
      "morning": ${portableTextBodyProjection('morning', locale)},
      "lunch": ${localizedField('lunch', locale)},
      "afternoon": ${portableTextBodyProjection('afternoon', locale)},
      "meals": ${localizedField('meals', locale)},
      "accommodation": ${localizedField('accommodation', locale)},
      "transport": ${localizedField('transport', locale)},
      "paceRating": paceRating,
      "highlights": coalesce(
        highlights[_key == "${locale}"][0].value,
        highlights[_key == "en"][0].value
      ),
      "suggestedActivities": coalesce(
        suggestedActivities[_key == "${locale}"][0].value,
        suggestedActivities[_key == "en"][0].value
      ),
      "photoSpots": coalesce(
        photoSpots[_key == "${locale}"][0].value,
        photoSpots[_key == "en"][0].value
      )
    },
    gallery[]{
      ...,
      "alt": ${localizedField('alt', locale)},
      "caption": ${localizedField('caption', locale)},
      credit
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
  *[_type == "tour" && type == "dayTour" && tourMode == $mode] | order(_createdAt desc){
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
// Hotel — list + detail + slug discovery
// ──────────────────────────────────────────────

const hotelCardProjection = (locale: Locale) => `
  _id,
  category,
  starRating,
  "name": ${localizedField('name', locale)},
  "slug": ${localizedSlug('slug', locale)},
  "allSlugs": slug[]{ _key, "current": value.current },
  "summary": ${localizedField('summary', locale)},
  heroImage{
    ...,
    "alt": coalesce(alt[_key=="${locale}"][0].value, alt[_key=="en"][0].value)
  },
  "city": city->{
    _id,
    "name": ${localizedField('name', locale)},
    "slug": ${localizedSlug('slug', locale)}
  }
`;

export const allHotelsQuery = (locale: Locale) => groq`
  *[_type == "hotel"] | order(coalesce(starRating, 0) desc, name asc){
    ${hotelCardProjection(locale)}
  }
`;

export const hotelBySlugQuery = (locale: Locale) => groq`
  *[_type == "hotel" && (
    slug[_key == "${locale}"][0].value.current == $slug ||
    (slug[_key == "${locale}"][0].value.current == null &&
     slug[_key == "en"][0].value.current == $slug)
  )][0]{
    ${hotelCardProjection(locale)},
    "body": ${portableTextBodyProjection('body', locale)},
    "operatorNotes": ${portableTextBodyProjection('operatorNotes', locale)},
    gallery[]{
      ...,
      "alt": ${localizedField('alt', locale)}
    },
    "relatedTours": relatedTours[]->{
      ${tourCardProjection(locale)}
    },
    seo{
      "metaTitle": ${localizedField('metaTitle', locale)},
      "metaDescription": ${localizedField('metaDescription', locale)},
      ogImage
    }
  }
`;

export const allHotelSlugsQuery = groq`
  *[_type == "hotel"]{
    _id,
    "slugs": slug[]{ _key, "current": value.current }
  }
`;

// ──────────────────────────────────────────────
// Nile cruise — list + detail + slug discovery
// ──────────────────────────────────────────────

const cruiseCardProjection = (locale: Locale) => `
  _id,
  type,
  tier,
  capacity,
  poweredBy,
  durationNights,
  "name": ${localizedField('name', locale)},
  "slug": ${localizedSlug('slug', locale)},
  "allSlugs": slug[]{ _key, "current": value.current },
  "summary": ${localizedField('summary', locale)},
  heroImage{
    ...,
    "alt": coalesce(alt[_key=="${locale}"][0].value, alt[_key=="en"][0].value)
  }
`;

export const allCruisesQuery = (locale: Locale) => groq`
  *[_type == "nileCruise"] | order(name asc){
    ${cruiseCardProjection(locale)}
  }
`;

export const cruiseBySlugQuery = (locale: Locale) => groq`
  *[_type == "nileCruise" && (
    slug[_key == "${locale}"][0].value.current == $slug ||
    (slug[_key == "${locale}"][0].value.current == null &&
     slug[_key == "en"][0].value.current == $slug)
  )][0]{
    ${cruiseCardProjection(locale)},
    "body": ${portableTextBodyProjection('body', locale)},
    "operatorNotes": ${portableTextBodyProjection('operatorNotes', locale)},
    departureWeekdays,
    specificDepartureDates,
    "departureCity": departureCity->{
      _id,
      "name": ${localizedField('name', locale)},
      "slug": ${localizedSlug('slug', locale)}
    },
    "returnCity": returnCity->{
      _id,
      "name": ${localizedField('name', locale)},
      "slug": ${localizedSlug('slug', locale)}
    },
    "itinerary": itinerary[]{
      dayNumber,
      "title": ${localizedField('title', locale)},
      "cities": cities[]->{
        _id,
        "name": ${localizedField('name', locale)},
        "slug": ${localizedSlug('slug', locale)}
      },
      "morning": ${portableTextBodyProjection('morning', locale)},
      "lunch": ${localizedField('lunch', locale)},
      "afternoon": ${portableTextBodyProjection('afternoon', locale)},
      "meals": ${localizedField('meals', locale)},
      "overnight": ${localizedField('overnight', locale)},
      "highlights": coalesce(
        highlights[_key == "${locale}"][0].value,
        highlights[_key == "en"][0].value
      )
    },
    gallery[]{
      ...,
      "alt": ${localizedField('alt', locale)}
    },
    "relatedTours": relatedTours[]->{
      ${tourCardProjection(locale)}
    },
    seo{
      "metaTitle": ${localizedField('metaTitle', locale)},
      "metaDescription": ${localizedField('metaDescription', locale)},
      ogImage
    }
  }
`;

export const allCruiseSlugsQuery = groq`
  *[_type == "nileCruise"]{
    _id,
    "slugs": slug[]{ _key, "current": value.current }
  }
`;

// ──────────────────────────────────────────────
// Wiki — shared projections
// ──────────────────────────────────────────────

/**
 * Compact wiki-card projection: just enough for cards on listing pages and
 * cross-reference lists. Each wiki type's card looks slightly different
 * (a person shows reign, a monument shows city/type, a deity shows
 * domain) — the page can read whichever fields it needs.
 */
const wikiCardProjection = (locale: Locale) => `
  _id,
  _type,
  "name": ${localizedField('name', locale)},
  "slug": ${localizedSlug('slug', locale)},
  "summary": ${localizedField('summary', locale)},
  heroImage{
    ...,
    "alt": coalesce(alt[_key=="${locale}"][0].value, alt[_key=="en"][0].value)
  },
  // Type-specific extras (null when the type doesn't have them):
  kingdom,
  "period": ${localizedField('period', locale)},
  role,
  "reignDisplay": ${localizedField('reignDisplay', locale)},
  monumentType,
  "preciseLocation": ${localizedField('preciseLocation', locale)},
  "city": city->{
    _id,
    "name": ${localizedField('name', locale)},
    "slug": ${localizedSlug('slug', locale)}
  },
  "domain": ${localizedField('domain', locale)}
`;

// ──────────────────────────────────────────────
// Wiki — Dynasty
// ──────────────────────────────────────────────

export const allDynastiesQuery = (locale: Locale) => groq`
  *[_type == "wikiDynasty"] | order(coalesce(startYear, 9999) asc){
    ${wikiCardProjection(locale)},
    startYear,
    endYear,
    featured
  }
`;

/**
 * Featured-first ordering for the wiki landing's preview sections.
 * Editors mark items with `featured: true`; we return them first, then
 * fall through to the type's default order. The landing page slices the
 * top N for each section.
 */
export const featuredDynastiesQuery = (locale: Locale) => groq`
  *[_type == "wikiDynasty"] | order(coalesce(featured, false) desc, coalesce(startYear, 9999) asc){
    ${wikiCardProjection(locale)},
    startYear,
    endYear,
    featured
  }
`;

export const dynastyBySlugQuery = (locale: Locale) => groq`
  *[_type == "wikiDynasty" && (
    slug[_key == "${locale}"][0].value.current == $slug ||
    (slug[_key == "${locale}"][0].value.current == null &&
     slug[_key == "en"][0].value.current == $slug)
  )][0]{
    ${wikiCardProjection(locale)},
    "allSlugs": slug[]{ _key, "current": value.current },
    startYear,
    endYear,
    "body": ${portableTextBodyProjection('body', locale)},
    "predecessorDynasty": predecessorDynasty->{ ${wikiCardProjection(locale)} },
    "successorDynasty": successorDynasty->{ ${wikiCardProjection(locale)} },
    "notableRulers": notableRulers[]->{ ${wikiCardProjection(locale)} },
    "notableMonuments": notableMonuments[]->{ ${wikiCardProjection(locale)} },
    "relatedTours": relatedTours[]->{
      _id, type, tourMode, durationDays,
      "title": ${localizedField('title', locale)},
      "slug": ${localizedSlug('slug', locale)},
      "summary": ${localizedField('summary', locale)},
      "durationLabel": ${localizedField('durationLabel', locale)},
      heroImage{
        ...,
        "alt": coalesce(alt[_key=="${locale}"][0].value, alt[_key=="en"][0].value)
      }
    },
    "reverseRulers": *[_type == "wikiPerson" && dynasty._ref == ^._id] | order(reignStartYear asc){
      ${wikiCardProjection(locale)}
    },
    "reverseMonuments": *[_type == "wikiMonument" && builtDuring._ref == ^._id]{
      ${wikiCardProjection(locale)}
    },
    seo{
      "metaTitle": ${localizedField('metaTitle', locale)},
      "metaDescription": ${localizedField('metaDescription', locale)},
      ogImage
    }
  }
`;

// ──────────────────────────────────────────────
// Wiki — Person
// ──────────────────────────────────────────────

export const allPeopleQuery = (locale: Locale) => groq`
  *[_type == "wikiPerson"] | order(coalesce(reignStartYear, 9999) asc){
    ${wikiCardProjection(locale)},
    reignStartYear,
    reignEndYear,
    featured,
    "dynasty": dynasty->{
      _id,
      "name": ${localizedField('name', locale)},
      "slug": ${localizedSlug('slug', locale)}
    }
  }
`;

export const featuredPeopleQuery = (locale: Locale) => groq`
  *[_type == "wikiPerson"] | order(coalesce(featured, false) desc, coalesce(reignStartYear, 9999) asc){
    ${wikiCardProjection(locale)},
    featured,
    reignStartYear,
    reignEndYear
  }
`;

export const personBySlugQuery = (locale: Locale) => groq`
  *[_type == "wikiPerson" && (
    slug[_key == "${locale}"][0].value.current == $slug ||
    (slug[_key == "${locale}"][0].value.current == null &&
     slug[_key == "en"][0].value.current == $slug)
  )][0]{
    ${wikiCardProjection(locale)},
    "allSlugs": slug[]{ _key, "current": value.current },
    alternateNames,
    reignStartYear,
    reignEndYear,
    "body": ${portableTextBodyProjection('body', locale)},
    "dynasty": dynasty->{ ${wikiCardProjection(locale)} },
    "predecessor": predecessor->{ ${wikiCardProjection(locale)} },
    "successor": successor->{ ${wikiCardProjection(locale)} },
    "spouse": spouse[]->{ ${wikiCardProjection(locale)} },
    "parents": parents[]->{ ${wikiCardProjection(locale)} },
    "children": children[]->{ ${wikiCardProjection(locale)} },
    "notableMonuments": notableMonuments[]->{ ${wikiCardProjection(locale)} },
    "burialSite": burialSite->{ ${wikiCardProjection(locale)} },
    "relatedTours": relatedTours[]->{
      _id, type,
      "title": ${localizedField('title', locale)},
      "slug": ${localizedSlug('slug', locale)},
      "summary": ${localizedField('summary', locale)},
      "durationLabel": ${localizedField('durationLabel', locale)},
      heroImage{
        ...,
        "alt": coalesce(alt[_key=="${locale}"][0].value, alt[_key=="en"][0].value)
      }
    },
    "reverseBuilt": *[_type == "wikiMonument" && ^._id in builtBy[]._ref]{
      ${wikiCardProjection(locale)}
    },
    "reverseBuriedHere": *[_type == "wikiMonument" && ^._id in buriedHere[]._ref]{
      ${wikiCardProjection(locale)}
    },
    seo{
      "metaTitle": ${localizedField('metaTitle', locale)},
      "metaDescription": ${localizedField('metaDescription', locale)},
      ogImage
    }
  }
`;

// ──────────────────────────────────────────────
// Wiki — Monument
// ──────────────────────────────────────────────

export const allMonumentsQuery = (locale: Locale) => groq`
  *[_type == "wikiMonument"] | order(city->orderRank asc, name asc){
    ${wikiCardProjection(locale)},
    featured
  }
`;

export const featuredMonumentsQuery = (locale: Locale) => groq`
  *[_type == "wikiMonument"] | order(coalesce(featured, false) desc, city->orderRank asc, name asc){
    ${wikiCardProjection(locale)},
    featured
  }
`;

export const monumentBySlugQuery = (locale: Locale) => groq`
  *[_type == "wikiMonument" && (
    slug[_key == "${locale}"][0].value.current == $slug ||
    (slug[_key == "${locale}"][0].value.current == null &&
     slug[_key == "en"][0].value.current == $slug)
  )][0]{
    ${wikiCardProjection(locale)},
    "allSlugs": slug[]{ _key, "current": value.current },
    coordinates,
    "body": ${portableTextBodyProjection('body', locale)},
    "visitorInfo": ${portableTextBodyProjection('visitorInfo', locale)},
    "builtBy": builtBy[]->{ ${wikiCardProjection(locale)} },
    "builtDuring": builtDuring->{ ${wikiCardProjection(locale)} },
    "buriedHere": buriedHere[]->{ ${wikiCardProjection(locale)} },
    "dedicatedTo": dedicatedTo[]->{ ${wikiCardProjection(locale)} },
    "relatedMonuments": relatedMonuments[]->{ ${wikiCardProjection(locale)} },
    "relatedTours": relatedTours[]->{
      _id, type,
      "title": ${localizedField('title', locale)},
      "slug": ${localizedSlug('slug', locale)},
      "summary": ${localizedField('summary', locale)},
      "durationLabel": ${localizedField('durationLabel', locale)},
      heroImage{
        ...,
        "alt": coalesce(alt[_key=="${locale}"][0].value, alt[_key=="en"][0].value)
      }
    },
    "reversePersonBurialSite": *[_type == "wikiPerson" && burialSite._ref == ^._id]{
      ${wikiCardProjection(locale)}
    },
    "reverseRelatedMonuments": *[_type == "wikiMonument" && ^._id in relatedMonuments[]._ref && _id != ^._id]{
      ${wikiCardProjection(locale)}
    },
    seo{
      "metaTitle": ${localizedField('metaTitle', locale)},
      "metaDescription": ${localizedField('metaDescription', locale)},
      ogImage
    }
  }
`;

// ──────────────────────────────────────────────
// Wiki — Deity
// ──────────────────────────────────────────────

export const allDeitiesQuery = (locale: Locale) => groq`
  *[_type == "wikiDeity"] | order(name asc){
    ${wikiCardProjection(locale)},
    featured
  }
`;

export const featuredDeitiesQuery = (locale: Locale) => groq`
  *[_type == "wikiDeity"] | order(coalesce(featured, false) desc, name asc){
    ${wikiCardProjection(locale)},
    featured
  }
`;

export const deityBySlugQuery = (locale: Locale) => groq`
  *[_type == "wikiDeity" && (
    slug[_key == "${locale}"][0].value.current == $slug ||
    (slug[_key == "${locale}"][0].value.current == null &&
     slug[_key == "en"][0].value.current == $slug)
  )][0]{
    ${wikiCardProjection(locale)},
    "allSlugs": slug[]{ _key, "current": value.current },
    alternateNames,
    "body": ${portableTextBodyProjection('body', locale)},
    "iconography": ${portableTextBodyProjection('iconography', locale)},
    "primaryCultCenters": primaryCultCenters[]->{
      _id,
      "name": ${localizedField('name', locale)},
      "slug": ${localizedSlug('slug', locale)},
      "summary": ${localizedField('summary', locale)},
      heroImage
    },
    "associatedMonuments": associatedMonuments[]->{ ${wikiCardProjection(locale)} },
    "associatedDeities": associatedDeities[]->{ ${wikiCardProjection(locale)} },
    "reverseDedicatedMonuments": *[_type == "wikiMonument" && ^._id in dedicatedTo[]._ref]{
      ${wikiCardProjection(locale)}
    },
    "reverseAssociatedDeities": *[_type == "wikiDeity" && ^._id in associatedDeities[]._ref && _id != ^._id]{
      ${wikiCardProjection(locale)}
    },
    seo{
      "metaTitle": ${localizedField('metaTitle', locale)},
      "metaDescription": ${localizedField('metaDescription', locale)},
      ogImage
    }
  }
`;

// ──────────────────────────────────────────────
// Wiki — slug discovery for static generation
// ──────────────────────────────────────────────

export const allWikiSlugsQuery = groq`
  *[_type in ["wikiDynasty", "wikiPerson", "wikiMonument", "wikiDeity"]]{
    _id,
    _type,
    "slugs": slug[]{ _key, "current": value.current }
  }
`;

// ──────────────────────────────────────────────
// Articles (document-level i18n via @sanity/document-internationalization).
//
// Each translation is a separate doc with a `language` field. Slugs are
// per-document (not localized arrays). For listing/by-slug, we filter
// by `language == $locale` directly. If no doc exists in the requested
// locale we fall back to the EN doc.
// ──────────────────────────────────────────────

const articleCardProjection = `
  _id,
  language,
  title,
  "slug": slug.current,
  deck,
  publishedAt,
  updatedAt,
  featured,
  heroImage{ ..., "alt": alt },
  "category": category->{
    _id,
    "name": coalesce(name[_key==language][0].value, name[_key=="en"][0].value),
    "slug": coalesce(slug[_key==language][0].value.current, slug[_key=="en"][0].value.current)
  },
  "author": author->{
    _id,
    name,
    slug,
    "role": coalesce(role[_key==language][0].value, role[_key=="en"][0].value),
    photo
  }
`;

export const articlesByLanguageQuery = groq`
  *[_type == "article" && language == $locale && !(_id in path("drafts.**"))]
    | order(publishedAt desc){
    ${articleCardProjection}
  }
`;

export const featuredArticlesQuery = groq`
  *[_type == "article" && language == $locale && !(_id in path("drafts.**"))]
    | order(publishedAt desc)[0...6]{
    ${articleCardProjection}
  }
`;

/**
 * The single article to surface in the journal landing's lead slot.
 * Most-recent article with featured == true; falls back to most-recent
 * overall if nothing is featured.
 */
export const featuredLeadArticleQuery = groq`
  coalesce(
    *[_type == "article" && language == $locale && featured == true && !(_id in path("drafts.**"))]
      | order(publishedAt desc)[0]{ ${articleCardProjection} },
    *[_type == "article" && language == $locale && !(_id in path("drafts.**"))]
      | order(publishedAt desc)[0]{ ${articleCardProjection} }
  )
`;

/**
 * Articles for /blog/category/[slug]. Handles two URL shapes via the OR
 * inside the predicate:
 *
 *   1. $slug matches a leaf category — `article.category` (the leaf) has
 *      that slug in the current locale (EN fallback).
 *   2. $slug matches a root bucket — `article.category->parent` (the root)
 *      has that slug in the current locale (EN fallback). All articles
 *      under the bucket return as a single feed.
 *
 * Replaces a prior version where `&&` / `||` precedence was wrong and the
 * EN-fallback clause matched any article with a null current-locale slug,
 * regardless of category. The new form parenthesizes the per-row predicate.
 */
export const articlesByCategorySlugQuery = groq`
  *[
    _type == "article"
    && language == $locale
    && !(_id in path("drafts.**"))
    && (
      coalesce(
        category->slug[_key==$locale][0].value.current,
        category->slug[_key=="en"][0].value.current
      ) == $slug
      ||
      coalesce(
        category->parent->slug[_key==$locale][0].value.current,
        category->parent->slug[_key=="en"][0].value.current
      ) == $slug
    )
  ] | order(publishedAt desc){
    ${articleCardProjection}
  }
`;

export const articleBySlugQuery = groq`
  *[_type == "article" && slug.current == $slug && language == $locale][0]{
    ${articleCardProjection},
    "body": body[]{
      ...,
      markDefs[]{
        ...,
        _type == "internalLink" => {
          ...,
          "ref": reference->{
            _type,
            "tourType": select(_type == "tour" => type, null),
            "slug": select(
              _type == "article" => slug.current,
              coalesce(slug[_key==$locale][0].value.current, slug[_key=="en"][0].value.current)
            ),
            "parentCitySlug": select(
              _type == "guideArticle" => coalesce(
                parentCity->slug[_key==$locale][0].value.current,
                parentCity->slug[_key=="en"][0].value.current
              ),
              null
            )
          }
        }
      }
    },
    "categoryDescription": category->{
      "description": coalesce(description[_key==^.language][0].value, description[_key=="en"][0].value)
    },
    "authorBio": author->{
      "bio": coalesce(bio[_key==^.^.language][0].value, bio[_key=="en"][0].value)
    },
    "relatedArticles": relatedArticles[]->{
      ${articleCardProjection}
    },
    "relatedTours": relatedTours[]->{
      _id, type,
      "title": coalesce(title[_key==^.language][0].value, title[_key=="en"][0].value),
      "slug": coalesce(slug[_key==^.language][0].value.current, slug[_key=="en"][0].value.current),
      "summary": coalesce(summary[_key==^.language][0].value, summary[_key=="en"][0].value),
      "durationLabel": coalesce(durationLabel[_key==^.language][0].value, durationLabel[_key=="en"][0].value),
      heroImage
    },
    "relatedCities": relatedCities[]->{
      _id,
      "name": coalesce(name[_key==^.language][0].value, name[_key=="en"][0].value),
      "slug": coalesce(slug[_key==^.language][0].value.current, slug[_key=="en"][0].value.current),
      heroImage
    },
    seo
  }
`;

export const allArticleSlugsQuery = groq`
  *[_type == "article" && !(_id in path("drafts.**"))]{
    _id,
    language,
    "slug": slug.current
  }
`;

export const allCategorySlugsQuery = groq`
  *[_type == "editorialCategory"]{
    _id,
    "slugs": slug[]{ _key, "current": value.current }
  }
`;

export const categoryBySlugQuery = (locale: Locale) => groq`
  *[_type == "editorialCategory" && (
    slug[_key == "${locale}"][0].value.current == $slug ||
    (slug[_key == "${locale}"][0].value.current == null &&
     slug[_key == "en"][0].value.current == $slug)
  )][0]{
    _id,
    "name": ${localizedField('name', locale)},
    "slug": ${localizedSlug('slug', locale)},
    "description": ${localizedField('description', locale)},
    heroImage,
    "parent": parent->{
      _id,
      "name": ${localizedField('name', locale)},
      "slug": ${localizedSlug('slug', locale)}
    },
    seo{
      "metaTitle": ${localizedField('metaTitle', locale)},
      "metaDescription": ${localizedField('metaDescription', locale)},
      ogImage
    }
  }
`;

export const allCategoriesQuery = (locale: Locale) => groq`
  *[_type == "editorialCategory"] | order(orderRank asc){
    _id,
    "name": ${localizedField('name', locale)},
    "slug": ${localizedSlug('slug', locale)},
    "description": ${localizedField('description', locale)}
  }
`;

/** Root buckets only (no parent). Used by the /blog primary nav. */
export const categoryRootsQuery = (locale: Locale) => groq`
  *[_type == "editorialCategory" && !defined(parent)] | order(orderRank asc, name[_key=="en"][0].value asc){
    _id,
    "name": ${localizedField('name', locale)},
    "slug": ${localizedSlug('slug', locale)},
    "description": ${localizedField('description', locale)}
  }
`;

/** Leaves under a given parent root, keyed by parent _id. */
export const categoryLeavesByParentIdQuery = (locale: Locale) => groq`
  *[_type == "editorialCategory" && parent._ref == $parentId] | order(name[_key=="en"][0].value asc){
    _id,
    "name": ${localizedField('name', locale)},
    "slug": ${localizedSlug('slug', locale)}
  }
`;

// ──────────────────────────────────────────────
// Travel tips — categorized practical guidance (visa, currency, dress, …).
// Flat URL `/travel-tips/[slug]`; categories surface as anchor sections on
// the index. travelTip uses internationalized-array slugs (field-level i18n).
// ──────────────────────────────────────────────

export const allTravelTipCategoriesQuery = (locale: Locale) => groq`
  *[_type == "travelTipCategory"] | order(orderRank asc, name[_key=="${locale}"][0].value asc){
    _id,
    "name": ${localizedField('name', locale)},
    "slug": ${localizedSlug('slug', locale)},
    "description": ${localizedField('description', locale)},
    orderRank,
    "tipCount": count(*[_type == "travelTip" && references(^._id)])
  }
`;

export const allTravelTipsQuery = (locale: Locale) => groq`
  *[_type == "travelTip"] | order(category->orderRank asc, title[_key=="${locale}"][0].value asc){
    _id,
    "title": ${localizedField('title', locale)},
    "slug": ${localizedSlug('slug', locale)},
    "summary": ${localizedField('summary', locale)},
    featured,
    category->{
      _id,
      "name": ${localizedField('name', locale)},
      "slug": ${localizedSlug('slug', locale)}
    },
    heroImage
  }
`;

export const featuredTravelTipsQuery = (locale: Locale) => groq`
  *[_type == "travelTip" && featured == true] | order(category->orderRank asc, title[_key=="${locale}"][0].value asc){
    _id,
    "title": ${localizedField('title', locale)},
    "slug": ${localizedSlug('slug', locale)},
    "summary": ${localizedField('summary', locale)},
    category->{
      "name": ${localizedField('name', locale)},
      "slug": ${localizedSlug('slug', locale)}
    },
    heroImage
  }
`;

export const travelTipBySlugQuery = (locale: Locale) => groq`
  *[_type == "travelTip" && (
    slug[_key == "${locale}"][0].value.current == $slug ||
    (slug[_key == "${locale}"][0].value.current == null &&
     slug[_key == "en"][0].value.current == $slug)
  )][0]{
    _id,
    "title": ${localizedField('title', locale)},
    "slug": ${localizedSlug('slug', locale)},
    "allSlugs": slug[]{ _key, "current": value.current },
    "summary": ${localizedField('summary', locale)},
    "body": ${portableTextBodyProjection('body', locale)},
    featured,
    category->{
      _id,
      "name": ${localizedField('name', locale)},
      "slug": ${localizedSlug('slug', locale)}
    },
    "relatedTips": relatedTips[]->{
      _id,
      "title": ${localizedField('title', locale)},
      "slug": ${localizedSlug('slug', locale)},
      "summary": ${localizedField('summary', locale)},
      category->{
        "name": ${localizedField('name', locale)},
        "slug": ${localizedSlug('slug', locale)}
      },
      heroImage
    },
    heroImage{
      ...,
      "alt": coalesce(alt[_key=="${locale}"][0].value, alt[_key=="en"][0].value),
      "caption": coalesce(caption[_key=="${locale}"][0].value, caption[_key=="en"][0].value)
    },
    seo{
      "metaTitle": ${localizedField('metaTitle', locale)},
      "metaDescription": ${localizedField('metaDescription', locale)},
      ogImage
    }
  }
`;

export const allTravelTipSlugsQuery = groq`
  *[_type == "travelTip"]{
    "slugs": slug[]{ _key, "current": value.current }
  }
`;

// ──────────────────────────────────────────────
// Sitemap — every public-facing doc with its slugs and updated time.
// Articles use document-level i18n (one doc per language with a plain
// slug); all other types use internationalized-array slugs.
// ──────────────────────────────────────────────

export const sitemapDocsQuery = groq`
  {
    "localizedDocs": *[_type in [
      "city", "guideArticle", "tour", "travelTip", "faqEntry",
      "wikiPerson", "wikiMonument", "wikiDynasty", "wikiDeity",
      "hotel", "nileCruise", "page", "legalPage"
    ] && !(_id in path("drafts.**"))]{
      _id,
      _type,
      _updatedAt,
      "slugs": slug[]{ _key, "current": value.current },
      "tourType": select(_type == "tour" => type, null),
      "parentCitySlugs": select(
        _type == "guideArticle" => parentCity->slug[]{ _key, "current": value.current },
        null
      )
    },
    "articles": *[_type == "article" && !(_id in path("drafts.**"))]{
      _id,
      language,
      "slug": slug.current,
      _updatedAt
    }
  }
`;

// ──────────────────────────────────────────────
// Site settings (singleton)
// ──────────────────────────────────────────────

export const siteSettingsQuery = (locale: Locale) => groq`
  *[_type == "siteSettings"][0]{
    "siteName": ${localizedField('siteName', locale)},
    "tagline": ${localizedField('tagline', locale)},
    defaultOgImage,
    logo,
    address,
    knowsAbout,
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

// ──────────────────────────────────────────────
// Legal pages — fetched by `kind` (the enum is stable across locales,
// unlike the per-locale slug). One thin query supports all four pages.
// ──────────────────────────────────────────────

export const legalPageByKindQuery = (locale: Locale) => groq`
  *[_type == "legalPage" && kind == $kind][0]{
    _id,
    kind,
    "title": ${localizedField('title', locale)},
    "slug": ${localizedSlug('slug', locale)},
    "allSlugs": slug[]{ _key, "current": value.current },
    lastUpdated,
    "body": ${portableTextBodyProjection('body', locale)}
  }
`;
