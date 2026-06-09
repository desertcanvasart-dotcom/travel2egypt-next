/**
 * Read-only verification: print the JSON-LD that would render on key
 * pages, using real Sanity data. Used to eyeball the structured-data
 * output during the implementation pass.
 *
 *   npx tsx scripts/verify-jsonld-output.ts
 */

import 'dotenv/config';
import { createClient } from '@sanity/client';
import {
  buildOrganizationSchema,
  buildFounderPersonSchema,
  buildTouristTripSchema,
  buildHotelSchema,
  buildCruiseTouristTripSchema,
  buildGuideArticleSchema,
  buildWebSiteSchema,
} from '../src/lib/structured-data';

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'production',
  apiVersion: '2024-12-01',
  token: process.env.SANITY_API_WRITE_TOKEN,
  useCdn: false,
});

const locale = 'en' as const;

async function main() {
  console.log('━━ Organization (root layout) ━━');
  const settings = await client.fetch<any>(`*[_type=="siteSettings"][0]{
    "siteName": siteName[_key=="en"][0].value,
    "tagline": tagline[_key=="en"][0].value,
    defaultOgImage,
    logo,
    address,
    knowsAbout,
    contact,
    socialLinks,
    founder{ name, jobTitle, description, birthPlace, knowsLanguage,
      alumniOf[]{name,url},
      hasCredential[]{credentialCategory,name,recognizedBy{name,url}},
      sameAs
    },
    sisterBrands[]{name,url}
  }`);
  console.log(JSON.stringify(buildOrganizationSchema(settings ?? {}), null, 2));

  console.log('\n━━ Founder Person ━━');
  console.log(JSON.stringify(buildFounderPersonSchema(settings?.founder ?? null), null, 2));

  console.log('\n━━ WebSite (homepage) ━━');
  console.log(JSON.stringify(buildWebSiteSchema({ siteName: settings?.siteName, tagline: settings?.tagline }, locale), null, 2));

  console.log('\n━━ TouristTrip — sample group package ━━');
  const groupPkg = await client.fetch<any>(`*[_type=="tour" && tourMode=="group" && type=="package"][0]{
    _id, type, tourMode, durationDays, originRegion, basePrice, peakUpliftPct, maxGroup,
    "title": title[_key=="en"][0].value,
    "slug": slug[_key=="en"][0].value.current,
    "summary": summary[_key=="en"][0].value,
    heroImage,
    "cities": cities[]->{ "name": name[_key=="en"][0].value }
  }`);
  if (groupPkg) {
    console.log(JSON.stringify(buildTouristTripSchema({
      title: groupPkg.title, slug: groupPkg.slug, type: groupPkg.type,
      tourMode: groupPkg.tourMode, summary: groupPkg.summary,
      durationDays: groupPkg.durationDays, basePrice: groupPkg.basePrice,
      peakUpliftPct: groupPkg.peakUpliftPct, maxGroup: groupPkg.maxGroup,
      originRegion: groupPkg.originRegion, heroImage: groupPkg.heroImage,
      cities: groupPkg.cities,
    }, locale), null, 2));
  }

  console.log('\n━━ TouristTrip — sample private day tour ━━');
  const privDay = await client.fetch<any>(`*[_type=="tour" && tourMode=="private" && type=="dayTour"][0]{
    _id, type, tourMode, durationDays, basePrice, peakUpliftPct, maxGroup, originRegion,
    "title": title[_key=="en"][0].value,
    "slug": slug[_key=="en"][0].value.current,
    "summary": summary[_key=="en"][0].value,
    heroImage,
    "cities": cities[]->{ "name": name[_key=="en"][0].value }
  }`);
  if (privDay) {
    console.log(JSON.stringify(buildTouristTripSchema({
      title: privDay.title, slug: privDay.slug, type: privDay.type,
      tourMode: privDay.tourMode, summary: privDay.summary,
      durationDays: privDay.durationDays, basePrice: privDay.basePrice,
      peakUpliftPct: privDay.peakUpliftPct, maxGroup: privDay.maxGroup,
      heroImage: privDay.heroImage, cities: privDay.cities,
    }, locale), null, 2));
  }

  console.log('\n━━ Hotel — sample ━━');
  const hotel = await client.fetch<any>(`*[_type=="hotel"][0]{
    _id, category, starRating,
    "name": name[_key=="en"][0].value,
    "slug": slug[_key=="en"][0].value.current,
    "summary": summary[_key=="en"][0].value,
    heroImage,
    "city": city->{ "name": name[_key=="en"][0].value }
  }`);
  if (hotel) {
    console.log(JSON.stringify(buildHotelSchema({
      name: hotel.name, slug: hotel.slug, summary: hotel.summary,
      heroImage: hotel.heroImage, category: hotel.category,
      starRating: hotel.starRating, city: hotel.city,
    }, locale), null, 2));
  }

  console.log('\n━━ Nile cruise — sample ━━');
  const cruise = await client.fetch<any>(`*[_type=="nileCruise"][0]{
    _id, type, tier, capacity, durationNights,
    "name": name[_key=="en"][0].value,
    "slug": slug[_key=="en"][0].value.current,
    "summary": summary[_key=="en"][0].value,
    heroImage,
    "departureCity": departureCity->{ "name": name[_key=="en"][0].value },
    "returnCity": returnCity->{ "name": name[_key=="en"][0].value },
    "itineraryCities": itinerary[].cities[]->{ "name": name[_key=="en"][0].value }
  }`);
  if (cruise) {
    console.log(JSON.stringify(buildCruiseTouristTripSchema({
      name: cruise.name, slug: cruise.slug, summary: cruise.summary,
      heroImage: cruise.heroImage, vesselType: cruise.type, tier: cruise.tier,
      capacity: cruise.capacity, durationNights: cruise.durationNights,
      departureCity: cruise.departureCity, returnCity: cruise.returnCity,
      itineraryCities: cruise.itineraryCities,
    }, locale), null, 2));
  }

  console.log('\n━━ Guide article — Article variant ━━');
  const guideArt = await client.fetch<any>(`*[_type=="guideArticle" && kind != "attraction"][0]{
    _id, kind, monumentType, preciseLocation, coordinates,
    "title": title[_key=="en"][0].value,
    "slug": slug[_key=="en"][0].value.current,
    "summary": summary[_key=="en"][0].value,
    heroImage,
    "parentCityName": parentCity->name[_key=="en"][0].value,
    "citySlug": parentCity->slug[_key=="en"][0].value.current
  }`);
  if (guideArt) {
    console.log(JSON.stringify(buildGuideArticleSchema({
      kind: guideArt.kind, title: guideArt.title, slug: guideArt.slug,
      citySlug: guideArt.citySlug, parentCityName: guideArt.parentCityName,
      summary: guideArt.summary, heroImage: guideArt.heroImage,
    }, locale), null, 2));
  }

  console.log('\n━━ Guide article — TouristAttraction variant ━━');
  const guideAttr = await client.fetch<any>(`*[_type=="guideArticle" && kind == "attraction"][0]{
    _id, kind, monumentType, preciseLocation, coordinates,
    "title": title[_key=="en"][0].value,
    "slug": slug[_key=="en"][0].value.current,
    "summary": summary[_key=="en"][0].value,
    heroImage,
    "parentCityName": parentCity->name[_key=="en"][0].value,
    "citySlug": parentCity->slug[_key=="en"][0].value.current
  }`);
  if (guideAttr) {
    console.log(JSON.stringify(buildGuideArticleSchema({
      kind: guideAttr.kind, title: guideAttr.title, slug: guideAttr.slug,
      citySlug: guideAttr.citySlug, parentCityName: guideAttr.parentCityName,
      summary: guideAttr.summary, heroImage: guideAttr.heroImage,
      coordinates: guideAttr.coordinates, monumentType: guideAttr.monumentType,
      preciseLocation: guideAttr.preciseLocation,
    }, locale), null, 2));
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
