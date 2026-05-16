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
import {
  travelTipCategorySchema,
  travelTipSchema,
} from './travelTip';
import { faqCategorySchema, faqEntrySchema } from './faq';
import { authorSchema, editorialCategorySchema } from './editorial';
import { articleSchema } from './article';
import { travelerStorySchema } from './travelerStory';
import { wikiDynastySchema } from './wikiDynasty';
import { wikiPersonSchema } from './wikiPerson';
import { wikiMonumentSchema } from './wikiMonument';
import { wikiDeitySchema } from './wikiDeity';
import { hotelSchema, nileCruiseSchema } from './hotelAndCruise';
import { pageSchema, legalPageSchema } from './page';
import { editorialPageSchema } from './editorialPage';
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

  // ── Tours ──
  tourSchema,
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

  // ── Informational ──
  hotelSchema,
  nileCruiseSchema,

  // ── System ──
  pageSchema,
  legalPageSchema,
  editorialPageSchema,
  trustBadgeSchema,
  siteSettingsSchema,
  conciergeLinkMapSchema,
];
