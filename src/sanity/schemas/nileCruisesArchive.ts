import { defineField, defineType } from 'sanity';
import { CaseIcon } from '@sanity/icons';

import { MIGRATION_GROUP, localizedPortableTextField, migrationField } from './_helpers';
import { ARCHIVE_ESSAY_EXTRA_BLOCKS, CONCIERGE_NOTE_BLOCK } from './_archiveBlocks';

/**
 * Archive-settings document for /nile-cruises — the third ArchiveTemplate
 * instance. Mirrors hotelsArchive/dayToursArchive (header, essay, featured,
 * collections). No navigator (cruises aren't browsed by city). References
 * target `nileCruise`; curation is editor-driven. See
 * src/components/archive/README.md.
 */
export const nileCruisesArchiveSchema = defineType({
  name: 'nileCruisesArchive',
  title: 'Nile cruises archive (page)',
  type: 'document',
  icon: CaseIcon,
  description:
    'Editorial structure for /nile-cruises: header, vessel-type essay, featured cruise, and vessel-grouped collections. One document.',
  groups: [
    { name: 'header', title: 'Header', default: true },
    { name: 'essay', title: 'Essay' },
    { name: 'featured', title: 'Featured' },
    { name: 'collections', title: 'Collections' },
    { name: 'meta', title: 'Meta' },
    MIGRATION_GROUP,
  ],
  fields: [
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

    defineField({ name: 'essayHeading', title: 'Essay heading', type: 'internationalizedArrayString', group: 'essay' }),
    defineField(
      localizedPortableTextField('essay', {
        title: 'Essay',
        description: 'Editorial intro. Supports a definition list (the vessel types) and concierge notes.',
        group: 'essay',
        extraBlocks: ARCHIVE_ESSAY_EXTRA_BLOCKS,
      }) as any
    ),

    defineField({
      name: 'featured',
      title: 'Featured cruise',
      description: 'Optional. The one we would book ourselves. Hidden on the page if empty.',
      type: 'object',
      group: 'featured',
      fields: [
        defineField({ name: 'cruise', title: 'Cruise', type: 'reference', to: [{ type: 'nileCruise' }] }),
        defineField({
          name: 'dek',
          title: 'Dek (optional)',
          description: 'Italic lead line. Falls back to the cruise summary if blank.',
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
      name: 'collections',
      title: 'Themed collections',
      description: 'Ordered, editor-curated groups (grouped by vessel). Each picks a layout variant.',
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
              name: 'cruises',
              title: 'Cruises',
              type: 'array',
              of: [{ type: 'reference', to: [{ type: 'nileCruise' }] }],
              validation: (Rule) => Rule.min(1),
            }),
          ],
          preview: {
            select: { title: 'title.0.value', variant: 'layoutVariant', cruises: 'cruises' },
            prepare({ title, variant, cruises }: { title?: string; variant?: string; cruises?: unknown[] }) {
              const n = Array.isArray(cruises) ? cruises.length : 0;
              return { title: title || 'Collection', subtitle: `${variant ?? 'trio'} · ${n} cruise${n === 1 ? '' : 's'}` };
            },
          },
        },
      ],
    }),

    defineField({ name: 'seo', title: 'SEO', type: 'seo', group: 'meta' }),
    migrationField(),
  ],
  preview: {
    select: { title: 'mastTitle.0.value' },
    prepare({ title }: { title?: string }) {
      return { title: title || 'Nile cruises archive', subtitle: '/nile-cruises' };
    },
  },
});
