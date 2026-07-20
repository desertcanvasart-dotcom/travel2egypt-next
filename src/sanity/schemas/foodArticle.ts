import { defineField, defineType } from 'sanity';
import { BasketIcon } from '@sanity/icons';

import { MIGRATION_GROUP, migrationField } from './_helpers';
import { FOOD_GLOSSARY_OPTIONS } from '../../data/food-glossary';

/**
 * Food article — the Food section's single editorial content type.
 *
 * Like `article` (and unlike most types), food articles use DOCUMENT-LEVEL
 * i18n via @sanity/document-internationalization: one document per language,
 * linked by a `translation.metadata` doc. Editorial food content genuinely
 * diverges across locales (a JA safety piece is written for the JA reader),
 * and pieces may exist in only one language during the EN→JA→ES stagger.
 *
 * Four franchises share this type, distinguished by `format`:
 *  - biography    — dish biographies (evergreen flagships)
 *  - generations  — interview pieces (rare, photography-heavy)
 *  - route        — city food routes (editorial twins of bookable day tours)
 *  - practical    — evergreen guides (safety, vegetarian, …)
 *
 * Venue policy is enforced in the schema: only `route` articles may name
 * venues, so only `route` carries `tour` (the bookable twin) and
 * `lastVerified` (the annual accuracy-review date). Evergreen formats carry no
 * venue fields at all — recommendations live in prose at neighbourhood level.
 */

const FORMAT_OPTIONS = [
  { title: 'Dish biography', value: 'biography' },
  { title: 'Generations (interview)', value: 'generations' },
  { title: 'City food route', value: 'route' },
  { title: 'Practical guide', value: 'practical' },
];

const REGION_OPTIONS = [
  { title: 'Cairo', value: 'cairo' },
  { title: 'Alexandria, the Coast & the Canal', value: 'alexandria-coast' },
  { title: 'The Nile South (Luxor · Aswan · Nubia)', value: 'nile-south' },
  { title: 'The Oases & Sinai', value: 'oases-sinai' },
  // Non-geographic bucket for country-wide practical guides (safety,
  // vegetarian, …) that have no single region. Keeps `region` required while
  // never forcing a national guide into a false geographic home. The hub
  // renders these in a separate "Egypt-wide / practical" band.
  { title: 'Egypt-wide (practical, no single region)', value: 'all-egypt' },
];

/** True only for the `route` format — used by the venue-policy validators. */
function isRoute(context: unknown): boolean {
  return (context as { parent?: { format?: string } })?.parent?.format === 'route';
}

export const foodArticleSchema = defineType({
  name: 'foodArticle',
  title: 'Food article',
  type: 'document',
  icon: BasketIcon,
  description:
    'A Food-section article. One document per language (use the language switcher in the header to create translations). The franchise is set by "Format".',
  groups: [
    { name: 'content', title: 'Content', default: true },
    { name: 'related', title: 'Related' },
    { name: 'media', title: 'Media' },
    { name: 'meta', title: 'Meta' },
    MIGRATION_GROUP,
  ],
  fields: [
    // Injected by the document-internationalization plugin — declared so it shows.
    defineField({
      name: 'language',
      title: 'Language',
      type: 'string',
      readOnly: true,
      hidden: true,
    }),
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      group: 'content',
      validation: (Rule) => Rule.required().max(120),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      description: 'Shared English slug across all locales (the corpus convention).',
      type: 'slug',
      group: 'content',
      options: { source: 'title', maxLength: 96 },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'format',
      title: 'Format',
      description: 'Which of the four Food franchises this is. Drives the template and the venue policy.',
      type: 'string',
      group: 'content',
      options: { list: FORMAT_OPTIONS, layout: 'radio' },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'region',
      title: 'Region',
      description: 'Where it sits in the hub index. "Alexandria, the Coast & the Canal" spans the canal cities (Port Said, Suez).',
      type: 'string',
      group: 'content',
      options: { list: REGION_OPTIONS, layout: 'dropdown' },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'deck',
      title: 'Standfirst',
      description: 'Short editorial subtitle. One sentence, sets the tone.',
      type: 'text',
      group: 'content',
      rows: 3,
    }),
    defineField({
      name: 'author',
      title: 'Author',
      type: 'reference',
      to: [{ type: 'author' }],
      group: 'content',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'publishedAt',
      title: 'Published at',
      type: 'datetime',
      group: 'content',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'updatedAt',
      title: 'Updated at',
      description: 'Optional. Drives the "Updated" / JA 最終更新 label when present.',
      type: 'datetime',
      group: 'content',
    }),
    defineField({
      name: 'featured',
      title: 'Featured',
      description: 'Surface in the Food hub featured slot. Most-recent featured wins.',
      type: 'boolean',
      group: 'content',
      initialValue: false,
    }),
    defineField({
      name: 'dishes',
      title: 'Dishes / ingredients',
      description:
        'Glossary keys for the dishes this piece covers. Pick from the transliteration glossary (src/data/food-glossary.ts). Add a new dish there first if it is missing.',
      type: 'array',
      group: 'content',
      of: [{ type: 'string', options: { list: FOOD_GLOSSARY_OPTIONS } }],
      options: { layout: 'tags' },
    }),

    // ── Route-only (venue policy): the bookable twin + accuracy review date ──
    defineField({
      name: 'tour',
      title: 'Bookable tour (route only)',
      description: 'The day tour this route is the editorial twin of. Powers the "Plan this with us" cross-link. Route articles only.',
      type: 'reference',
      to: [{ type: 'tour' }],
      group: 'content',
      hidden: ({ parent }) => (parent as { format?: string })?.format !== 'route',
      validation: (Rule) =>
        Rule.custom((value, context) => {
          if (isRoute(context)) return value ? true : 'Route articles must link their bookable tour.';
          return value ? 'Only route articles may set a tour — evergreen formats name no venues.' : true;
        }),
    }),
    defineField({
      name: 'lastVerified',
      title: 'Venues last verified (route only)',
      description: 'Date the named venues were last checked. Surfaced discreetly on the page and queried by the annual accuracy review. Route articles only.',
      type: 'date',
      group: 'content',
      hidden: ({ parent }) => (parent as { format?: string })?.format !== 'route',
      validation: (Rule) =>
        Rule.custom((value, context) => {
          if (isRoute(context)) return value ? true : 'Route articles must record when venues were last verified.';
          return value ? 'Only route articles carry a verification date — evergreen formats name no venues.' : true;
        }),
    }),

    // ── Body — mirrors the article body block set (doc-per-locale, plain strings) ──
    defineField({
      name: 'body',
      title: 'Body',
      description: 'Long-form literary prose with plain section headers. Operator/concierge callouts and pull-quotes available; the 8-point reporting formula never surfaces as structure.',
      type: 'array',
      group: 'content',
      of: [
        { type: 'block' },
        {
          type: 'image',
          options: { hotspot: true },
          fields: [
            defineField({ name: 'alt', type: 'string' }),
            defineField({ name: 'caption', type: 'string' }),
          ],
        },
        {
          name: 'operatorNote',
          type: 'object',
          title: 'Operator note',
          fields: [
            defineField({
              name: 'tone',
              type: 'string',
              options: {
                list: [
                  { title: 'Honest take', value: 'honest' },
                  { title: 'Watch out', value: 'caution' },
                  { title: 'Insider tip', value: 'insider' },
                  { title: 'Worth knowing', value: 'context' },
                ],
              },
              initialValue: 'honest',
            }),
            defineField({ name: 'body', type: 'array', of: [{ type: 'block' }] }),
          ],
        },
        {
          name: 'conciergeNote',
          type: 'object',
          title: 'Concierge note',
          description: 'Short first-person aside in the concierge voice. Gold-ruled italic aside.',
          fields: [
            defineField({
              name: 'body',
              title: 'Note',
              type: 'array',
              of: [
                {
                  type: 'block',
                  styles: [{ title: 'Paragraph', value: 'normal' }],
                  marks: {
                    decorators: [
                      { title: 'Bold', value: 'strong' },
                      { title: 'Italic', value: 'em' },
                    ],
                    annotations: [],
                  },
                },
              ],
              validation: (Rule) => Rule.required(),
            }),
          ],
        },
        {
          name: 'pullQuote',
          type: 'object',
          title: 'Pull quote',
          description: 'A large editorial highlight. Used chiefly by generations (interview) pieces.',
          fields: [
            defineField({
              name: 'quote',
              title: 'Quote',
              type: 'text',
              rows: 2,
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'attribution',
              title: 'Attribution (optional)',
              type: 'string',
              description: 'Who said it. Leave blank for unattributed editorial highlights.',
            }),
            defineField({
              name: 'style',
              title: 'Style',
              type: 'string',
              options: {
                list: [
                  { title: 'Literary (default)', value: 'literary' },
                  { title: 'Historical', value: 'historical' },
                  { title: 'Traveler voice', value: 'traveler' },
                ],
              },
              initialValue: 'literary',
            }),
          ],
          preview: {
            select: { quote: 'quote', attribution: 'attribution' },
            prepare({ quote, attribution }: { quote?: string; attribution?: string }) {
              return {
                title: quote ? `“${quote.slice(0, 60)}…”` : 'Pull quote',
                subtitle: attribution || '—',
              };
            },
          },
        },
      ],
    }),

    // ── Media ──
    defineField({
      name: 'heroImage',
      title: 'Hero image',
      type: 'image',
      group: 'media',
      options: { hotspot: true },
      fields: [
        defineField({ name: 'alt', type: 'string' }),
        defineField({ name: 'caption', type: 'string' }),
        defineField({ name: 'credit', type: 'string' }),
      ],
    }),

    // ── Related ──
    defineField({
      name: 'relatedFood',
      title: 'Related food articles',
      type: 'array',
      group: 'related',
      of: [{ type: 'reference', to: [{ type: 'foodArticle' }] }],
    }),
    defineField({
      name: 'relatedTours',
      title: 'Related tours',
      type: 'array',
      group: 'related',
      of: [{ type: 'reference', to: [{ type: 'tour' }] }],
    }),
    defineField({
      name: 'relatedCities',
      title: 'Related cities',
      type: 'array',
      group: 'related',
      of: [{ type: 'reference', to: [{ type: 'city' }] }],
    }),

    // ── Meta ──
    defineField({
      name: 'seo',
      title: 'SEO',
      type: 'object',
      group: 'meta',
      fields: [
        defineField({ name: 'metaTitle', type: 'string' }),
        defineField({ name: 'metaDescription', type: 'text', rows: 3 }),
        defineField({ name: 'ogImage', type: 'image', options: { hotspot: true } }),
      ],
    }),
    migrationField(),
  ],
  preview: {
    select: { title: 'title', format: 'format', region: 'region', lang: 'language', media: 'heroImage' },
    prepare({ title, format, region, lang, media }) {
      const bits = [lang?.toUpperCase() || '—', format, region].filter(Boolean);
      return { title, subtitle: bits.join(' · '), media };
    },
  },
});
