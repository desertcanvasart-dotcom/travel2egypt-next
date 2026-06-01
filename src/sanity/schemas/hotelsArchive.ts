import { defineField, defineType } from 'sanity';
import { CaseIcon } from '@sanity/icons';

import { MIGRATION_GROUP, localizedPortableTextField, migrationField } from './_helpers';

/**
 * Archive-settings document for the /hotels landing.
 *
 * This is the per-type archive doc (the session chose per-type over a single
 * generic doc). It holds the editor-curated structure the ArchiveTemplate
 * renders: header copy, an editorial essay, an optional featured hotel, and an
 * ordered list of themed collections. The collections are deliberately
 * reference lists, NOT auto-queries — the curation is the editorial value.
 *
 * To add the next archive (tours / cruises / tips), copy this file, swap the
 * reference target type, and add a facet config in the route. See
 * src/components/archive/README.md.
 */

/**
 * Extra portable-text blocks the essay/featured body support beyond the
 * standard set: a definition list (the Hotel Grade Concept term/description
 * rows) and the reusable concierge-note aside.
 */
const DEFINITION_LIST_BLOCK = {
  type: 'object',
  name: 'definitionList',
  title: 'Definition list',
  description: 'Term + description rows — e.g. the hotel grades (Luxury, Deluxe, …).',
  fields: [
    defineField({
      name: 'items',
      title: 'Rows',
      type: 'array',
      of: [
        {
          type: 'object',
          name: 'definition',
          fields: [
            defineField({
              name: 'term',
              title: 'Term',
              type: 'internationalizedArrayString',
              validation: (Rule: any) => Rule.required(),
            }),
            defineField({
              name: 'description',
              title: 'Description',
              type: 'internationalizedArrayText',
              validation: (Rule: any) => Rule.required(),
            }),
          ],
          preview: {
            select: { term: 'term.0.value', desc: 'description.0.value' },
            prepare({ term, desc }: { term?: string; desc?: string }) {
              return { title: term || 'Definition', subtitle: desc };
            },
          },
        },
      ],
      validation: (Rule: any) => Rule.min(1),
    }),
  ],
  preview: {
    select: { items: 'items' },
    prepare({ items }: { items?: unknown[] }) {
      const n = Array.isArray(items) ? items.length : 0;
      return { title: `Definition list — ${n} row${n === 1 ? '' : 's'}` };
    },
  },
};

const CONCIERGE_NOTE_BLOCK = {
  type: 'object',
  name: 'conciergeNote',
  title: 'Concierge note',
  description: 'A short first-person aside in the concierge voice. Gold-ruled italic aside.',
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
      validation: (Rule: any) => Rule.required(),
    }),
  ],
};

const ESSAY_EXTRA_BLOCKS = [DEFINITION_LIST_BLOCK, CONCIERGE_NOTE_BLOCK];

export const hotelsArchiveSchema = defineType({
  name: 'hotelsArchive',
  title: 'Hotels archive (page)',
  type: 'document',
  icon: CaseIcon,
  description:
    'Editorial structure for the /hotels landing: header, essay, featured hotel, and themed collections. One document.',
  groups: [
    { name: 'header', title: 'Header', default: true },
    { name: 'essay', title: 'Essay' },
    { name: 'featured', title: 'Featured' },
    { name: 'collections', title: 'Collections' },
    { name: 'meta', title: 'Meta' },
    MIGRATION_GROUP,
  ],
  fields: [
    // ── Header ──
    defineField({
      name: 'kicker',
      title: 'Kicker / edition',
      description: 'Small eyebrow above the title, e.g. "Where to stay · Edition №7".',
      type: 'internationalizedArrayString',
      group: 'header',
    }),
    defineField({
      name: 'mastTitle',
      title: 'Title',
      type: 'internationalizedArrayString',
      group: 'header',
      validation: (Rule) =>
        Rule.required().custom((value: any) => {
          const en = Array.isArray(value) ? value.find((v: any) => v._key === 'en')?.value : null;
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
      description: 'Short sticky heading shown left of the essay body.',
      type: 'internationalizedArrayString',
      group: 'essay',
    }),
    defineField(
      localizedPortableTextField('essay', {
        title: 'Essay',
        description:
          'Editorial intro. Supports a definition list (the grades) and concierge notes.',
        group: 'essay',
        extraBlocks: ESSAY_EXTRA_BLOCKS,
      }) as any
    ),

    // ── Featured ──
    defineField({
      name: 'featured',
      title: 'Featured hotel',
      description: 'Optional. The one property to spotlight. Hidden on the page if empty.',
      type: 'object',
      group: 'featured',
      fields: [
        defineField({
          name: 'hotel',
          title: 'Hotel',
          type: 'reference',
          to: [{ type: 'hotel' }],
        }),
        defineField({
          name: 'dek',
          title: 'Dek (optional)',
          description: 'Italic lead line. Falls back to the hotel summary if blank.',
          type: 'internationalizedArrayText',
        }),
        defineField(
          localizedPortableTextField('body', {
            title: 'Editorial copy (optional)',
            description: 'Why we feature it. Supports an inline concierge note.',
            extraBlocks: [CONCIERGE_NOTE_BLOCK],
          }) as any
        ),
      ],
    }),

    // ── Collections ──
    defineField({
      name: 'collections',
      title: 'Themed collections',
      description:
        'Ordered, editor-curated groups. Each picks a layout variant so the page rhythm varies.',
      type: 'array',
      group: 'collections',
      of: [
        {
          type: 'object',
          name: 'themedCollection',
          fields: [
            defineField({
              name: 'kicker',
              title: 'Kicker (optional)',
              description: 'Defaults to "Collection №N" if blank.',
              type: 'internationalizedArrayString',
            }),
            defineField({
              name: 'title',
              title: 'Title',
              type: 'internationalizedArrayString',
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'intro',
              title: 'Intro',
              type: 'internationalizedArrayText',
            }),
            defineField({
              name: 'layoutVariant',
              title: 'Layout',
              type: 'string',
              options: {
                list: [
                  { title: 'Lead (1 large + 2 small)', value: 'lead' },
                  { title: 'Pair (2 wide)', value: 'pair' },
                  { title: 'Trio (3 equal)', value: 'trio' },
                ],
                layout: 'radio',
              },
              initialValue: 'trio',
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'hotels',
              title: 'Hotels',
              type: 'array',
              of: [{ type: 'reference', to: [{ type: 'hotel' }] }],
              validation: (Rule) => Rule.min(1),
            }),
          ],
          preview: {
            select: { title: 'title.0.value', variant: 'layoutVariant', hotels: 'hotels' },
            prepare({ title, variant, hotels }: { title?: string; variant?: string; hotels?: unknown[] }) {
              const n = Array.isArray(hotels) ? hotels.length : 0;
              return {
                title: title || 'Collection',
                subtitle: `${variant ?? 'trio'} · ${n} hotel${n === 1 ? '' : 's'}`,
              };
            },
          },
        },
      ],
    }),

    defineField({
      name: 'seo',
      title: 'SEO',
      type: 'seo',
      group: 'meta',
    }),
    migrationField(),
  ],
  preview: {
    select: { title: 'mastTitle.0.value' },
    prepare({ title }: { title?: string }) {
      return { title: title || 'Hotels archive', subtitle: '/hotels' };
    },
  },
});
