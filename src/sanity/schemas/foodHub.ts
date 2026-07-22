import { defineField, defineType } from 'sanity';
import { BasketIcon } from '@sanity/icons';

import { MIGRATION_GROUP, localizedPortableTextField } from './_helpers';
import { ARCHIVE_ESSAY_EXTRA_BLOCKS } from './_archiveBlocks';

/**
 * Food hub — the "Eat Your Way Down the Nile" landing at /food. One document.
 *
 * Field-level i18n (like the other archive settings docs), NOT document-level:
 * the hub is a single settings doc with locale-keyed fields. v1 is deliberately
 * simple — header + intro essay + an optional featured spotlight. The
 * region-organised index is a RENDER-TIME query over `foodArticle.region`, so
 * there are no hand-curated collections here (that is the deliberate v1 choice;
 * add curated collections later if the section outgrows a plain region list).
 *
 * `publishedLocales` gates the localized hub shells: EN is always live; ES/JA
 * are toggled on manually once ≥3 localized spokes exist. A locale not listed
 * falls back to the EN hub (never a 404).
 */
export const foodHubSchema = defineType({
  name: 'foodHub',
  title: 'Food hub (page)',
  type: 'document',
  icon: BasketIcon,
  description:
    'Editorial structure for the /food landing ("Eat Your Way Down the Nile"): header, intro essay, optional featured article. The region index is generated from the food articles. One document.',
  groups: [
    { name: 'header', title: 'Header', default: true },
    { name: 'essay', title: 'Essay' },
    { name: 'featured', title: 'Featured' },
    { name: 'meta', title: 'Meta' },
    MIGRATION_GROUP,
  ],
  fields: [
    // ── Header ──
    defineField({
      name: 'kicker',
      title: 'Kicker / edition',
      description: 'Small eyebrow above the title, e.g. "The Food Section · Edition №1".',
      type: 'internationalizedArrayString',
      group: 'header',
    }),
    defineField({
      name: 'mastTitle',
      title: 'Title',
      description: 'Working title: "Eat Your Way Down the Nile".',
      type: 'internationalizedArrayString',
      group: 'header',
      validation: (Rule) =>
        Rule.required().custom((value: unknown) => {
          const en = Array.isArray(value)
            ? (value as Array<{ _key: string; value?: string }>).find((v) => v._key === 'en')?.value
            : null;
          return en ? true : 'English title is required';
        }),
    }),
    defineField({
      name: 'tagline',
      title: 'Tagline',
      description: 'Italic standfirst under the title.',
      type: 'internationalizedArrayText',
      group: 'header',
    }),

    // ── Essay ──
    defineField({
      name: 'essayHeading',
      title: 'Essay heading',
      description: 'Short sticky heading shown left of the intro essay (~600 words).',
      type: 'internationalizedArrayString',
      group: 'essay',
    }),
    defineField(
      localizedPortableTextField('essay', {
        title: 'Intro essay',
        description: 'The ~600-word intro. Supports a definition list and concierge notes.',
        group: 'essay',
        extraBlocks: ARCHIVE_ESSAY_EXTRA_BLOCKS,
      }) as never
    ),

    // ── Featured ──
    defineField({
      name: 'featured',
      title: 'Featured article',
      description: 'Optional. The one Food piece to spotlight at the top of the hub. Hidden if empty.',
      type: 'object',
      group: 'featured',
      fields: [
        defineField({
          name: 'article',
          title: 'Article',
          type: 'reference',
          to: [{ type: 'foodArticle' }],
        }),
        defineField({
          name: 'dek',
          title: 'Dek (optional)',
          description: 'Italic lead line. Falls back to the article standfirst if blank.',
          type: 'internationalizedArrayText',
        }),
      ],
    }),

    // ── Publish gating ──
    defineField({
      name: 'publishedLocales',
      title: 'Live locales',
      description:
        'Which localized hub shells are live. EN is always live. Add "es"/"ja" only once ≥3 localized spokes exist — a locale not listed falls back to the EN hub.',
      type: 'array',
      group: 'header',
      of: [{ type: 'string' }],
      options: {
        list: [
          { title: 'English', value: 'en' },
          { title: 'Spanish', value: 'es' },
          { title: 'Japanese', value: 'ja' },
        ],
      },
      initialValue: ['en'],
    }),

    defineField({
      name: 'seo',
      title: 'SEO',
      type: 'seo',
      group: 'meta',
    }),
  ],
  preview: {
    select: { title: 'mastTitle.0.value' },
    prepare({ title }: { title?: string }) {
      return { title: title || 'Food hub', subtitle: '/food' };
    },
  },
});
