/**
 * Schema registry. Every document and object type in Sanity Studio is
 * imported and exported from here, then handed to defineConfig().
 */

import { citySchema } from './city';
import { coordinatesSchema } from './coordinates';
import { guideArticleSchema } from './guideArticle';
import { localizedImageSchema } from './localizedImage';
import { portableTextSchema } from './portableText';
import { seoSchema } from './seo';
import { themeSchema } from './theme';
import { tourSchema } from './tour';
import { tourCategorySchema } from './tourCategory';
import { tourLandingSchema } from './tourLanding';
import {
  travelTipCategorySchema,
  travelTipSchema,
} from './travelTip';
import { faqCategorySchema, faqEntrySchema } from './faq';
import { authorSchema, editorialCategorySchema } from './editorial';
import { articleSchema } from './article';
import { foodArticleSchema } from './foodArticle';
import { foodHubSchema } from './foodHub';
import { travelerStorySchema } from './travelerStory';
import { wikiDynastySchema } from './wikiDynasty';
import { wikiPersonSchema } from './wikiPerson';
import { wikiMonumentSchema } from './wikiMonument';
import { wikiDeitySchema } from './wikiDeity';
import { deitySchema } from './deity';
import { fieldGuideSchema } from './fieldGuide';
import { hotelSchema, nileCruiseSchema } from './hotelAndCruise';
import { hotelsArchiveSchema } from './hotelsArchive';
import { dayToursArchiveSchema } from './dayToursArchive';
import { nileCruisesArchiveSchema } from './nileCruisesArchive';
import { travelTipsArchiveSchema } from './travelTipsArchive';
import { pageSchema, legalPageSchema } from './page';
import { editorialPageSchema } from './editorialPage';
import { homePageSchema } from './homePage';
import {
  trustBadgeSchema,
  siteSettingsSchema,
  conciergeLinkMapSchema,
} from './system';

export const schemaTypes = [
  // ── Object types (sub-objects used inside documents) ──
  seoSchema,
  coordinatesSchema,
  localizedImageSchema,
  portableTextSchema,

  // ── Editorial ──
  articleSchema,
  editorialCategorySchema,
  authorSchema,
  travelerStorySchema,

  // ── Food ──
  foodArticleSchema,
  foodHubSchema,

  // ── Tours ──
  tourSchema,
  tourCategorySchema,
  tourLandingSchema,
  themeSchema,

  // ── Geography & guides ──
  citySchema,
  guideArticleSchema,

  // ── Reference ──
  travelTipSchema,
  travelTipCategorySchema,
  faqEntrySchema,
  faqCategorySchema,

  // ── Wiki ──
  wikiDynastySchema,
  wikiPersonSchema,
  wikiMonumentSchema,
  wikiDeitySchema,

  // ── Resources (field guides) ──
  deitySchema,
  fieldGuideSchema,

  // ── Informational ──
  hotelSchema,
  nileCruiseSchema,
  hotelsArchiveSchema,
  dayToursArchiveSchema,
  nileCruisesArchiveSchema,
  travelTipsArchiveSchema,

  // ── System ──
  pageSchema,
  legalPageSchema,
  editorialPageSchema,
  trustBadgeSchema,
  siteSettingsSchema,
  conciergeLinkMapSchema,
  homePageSchema,
];
