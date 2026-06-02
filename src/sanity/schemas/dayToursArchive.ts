import { defineField, defineType } from 'sanity';
import { CaseIcon } from '@sanity/icons';

import { MIGRATION_GROUP, localizedPortableTextField, migrationField } from './_helpers';
import { ARCHIVE_ESSAY_EXTRA_BLOCKS, CONCIERGE_NOTE_BLOCK } from './_archiveBlocks';

/**
 * Archive-settings document for the /private-day-tours landing — the second
 * ArchiveTemplate instance, mirroring hotelsArchive. Adds a `navigator`: the
 * "choose by destination" city grid, each entry pointing at an existing
 * tourLanding city sub-page.
 *
 * References target `tour`; curation (featured + collections + navigator) is
 * editor-driven, not auto-query. See src/components/archive/README.md.
 */
export const dayToursArchiveSchema = defineType({
  name: 'dayToursArchive',
  title: 'Day tours archive (page)',
  type: 'document',
  icon: CaseIcon,
  description:
    'Editorial structure for /private-day-tours: header, tier essay, featured tour, themed collections, and the city navigator. One document.',
  groups: [
    { name: 'header', title: 'Header', default: true },
    { name: 'essay', title: 'Essay' },
    { name: 'featured', title: 'Featured' },
    { name: 'collections', title: 'Collections' },
    { name: 'navigator', title: 'Navigator' },
    { name: 'meta', title: 'Meta' },
    MIGRATION_GROUP,
  ],
  fields: [
    // ── Header ──
    defineField({ name: 'kicker', title: 'Kicker / edition', type: 'internationalizedArrayString', group: 'header' }),
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
    defineField({ name: 'tagline', title: 'Tagline', type: 'internationalizedArrayText', group: 'header' }),

    // ── Essay ──
    defineField({
      name: 'essayHeading',
      title: 'Essay heading',
      type: 'internationalizedArrayString',
      group: 'essay',
    }),
    defineField({
      name: 'editorByline',
      title: 'Essay byline (sticky aside)',
      description: 'The sticky aside beside the philosophy essay (journey-1 design): a kicker, a one-line heading, and a short framing note.',
      type: 'object',
      group: 'essay',
      fields: [
        defineField({ name: 'kicker', title: 'Kicker', type: 'internationalizedArrayString' }),
        defineField({ name: 'heading', title: 'Heading', type: 'internationalizedArrayString' }),
        defineField({ name: 'intro', title: 'Intro', type: 'internationalizedArrayText' }),
      ],
    }),
    defineField(
      localizedPortableTextField('essay', {
        title: 'Essay',
        description: 'Editorial intro. Supports a definition list (the tiers) and concierge notes.',
        group: 'essay',
        extraBlocks: ARCHIVE_ESSAY_EXTRA_BLOCKS,
      }) as any
    ),

    // ── Featured ──
    defineField({
      name: 'featured',
      title: 'Featured tour',
      description: 'Optional. The day we would choose. Hidden on the page if empty.',
      type: 'object',
      group: 'featured',
      fields: [
        defineField({ name: 'tour', title: 'Tour', type: 'reference', to: [{ type: 'tour' }] }),
        defineField({
          name: 'dek',
          title: 'Dek (optional)',
          description: 'Italic lead line. Falls back to the tour summary if blank.',
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

    defineField({
      name: 'editorsPicks',
      title: "Editor's picks (lead + 2)",
      description: "Journey-1 \"Days we'd build a trip around\" section. First tour renders as the large lead card, the next two as side cards. Leave empty to omit the section.",
      type: 'array',
      group: 'featured',
      of: [{ type: 'reference', to: [{ type: 'tour' }] }],
      validation: (Rule) => Rule.max(3),
    }),

    // ── Collections ──
    defineField({
      name: 'collections',
      title: 'Themed collections',
      description: 'Ordered, editor-curated groups. Each picks a layout variant.',
      type: 'array',
      group: 'collections',
      of: [
        {
          type: 'object',
          name: 'themedCollection',
          fields: [
            defineField({ name: 'kicker', title: 'Kicker (optional)', type: 'internationalizedArrayString' }),
            defineField({
              name: 'title',
              title: 'Title',
              type: 'internationalizedArrayString',
              validation: (Rule) => Rule.required(),
            }),
            defineField({ name: 'intro', title: 'Intro', type: 'internationalizedArrayText' }),
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
              name: 'tours',
              title: 'Tours',
              type: 'array',
              of: [{ type: 'reference', to: [{ type: 'tour' }] }],
              validation: (Rule) => Rule.min(1),
            }),
          ],
          preview: {
            select: { title: 'title.0.value', variant: 'layoutVariant', tours: 'tours' },
            prepare({ title, variant, tours }: { title?: string; variant?: string; tours?: unknown[] }) {
              const n = Array.isArray(tours) ? tours.length : 0;
              return { title: title || 'Collection', subtitle: `${variant ?? 'trio'} · ${n} tour${n === 1 ? '' : 's'}` };
            },
          },
        },
      ],
    }),

    // ── Navigator (choose by destination) ──
    defineField({
      name: 'navigator',
      title: 'City navigator',
      description: 'The "choose by destination" grid. Each entry links to a city sub-page.',
      type: 'object',
      group: 'navigator',
      fields: [
        defineField({ name: 'heading', title: 'Heading', type: 'internationalizedArrayString' }),
        defineField({ name: 'intro', title: 'Intro', type: 'internationalizedArrayText' }),
        defineField({
          name: 'items',
          title: 'Cities',
          type: 'array',
          of: [
            {
              type: 'object',
              name: 'navigatorCity',
              fields: [
                defineField({
                  name: 'landing',
                  title: 'City sub-page',
                  type: 'reference',
                  to: [{ type: 'tourLanding' }],
                  validation: (Rule) => Rule.required(),
                }),
                defineField({
                  name: 'note',
                  title: 'One-liner',
                  type: 'internationalizedArrayString',
                }),
              ],
              preview: {
                select: { city: 'landing.destinationCity.name.0.value', note: 'note.0.value' },
                prepare({ city, note }: { city?: string; note?: string }) {
                  return { title: city || 'City', subtitle: note };
                },
              },
            },
          ],
        }),
      ],
    }),

    defineField({ name: 'seo', title: 'SEO', type: 'seo', group: 'meta' }),
    migrationField(),
  ],
  preview: {
    select: { title: 'mastTitle.0.value' },
    prepare({ title }: { title?: string }) {
      return { title: title || 'Day tours archive', subtitle: '/private-day-tours' };
    },
  },
});
