import { defineField, defineType } from 'sanity';
import { CaseIcon } from '@sanity/icons';

import { MIGRATION_GROUP, localizedPortableTextField, migrationField } from './_helpers';
import { ARCHIVE_ESSAY_EXTRA_BLOCKS } from './_archiveBlocks';

/**
 * Settings doc for the BESPOKE /travel-tips reading archive (NOT an
 * ArchiveTemplate instance — travel tips are reference editorial with no
 * product facets). Holds the editorial framing: header copy, essay, an
 * optional "Start here" cornerstone tip, and an ordered list of departments
 * with intro lines. WHICH tips sit in a department comes from each tip's
 * `category` reference; this doc only orders and frames them.
 */
export const travelTipsArchiveSchema = defineType({
  name: 'travelTipsArchive',
  title: 'Travel tips archive (page)',
  type: 'document',
  icon: CaseIcon,
  description:
    'Editorial framing for /travel-tips: header, essay, an optional cornerstone tip, and ordered departments. One document.',
  groups: [
    { name: 'header', title: 'Header', default: true },
    { name: 'essay', title: 'Essay' },
    { name: 'cornerstone', title: 'Cornerstone' },
    { name: 'departments', title: 'Departments' },
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
        description: 'Editorial intro. May include a concierge note.',
        group: 'essay',
        extraBlocks: ARCHIVE_ESSAY_EXTRA_BLOCKS,
      }) as any
    ),

    defineField({
      name: 'cornerstone',
      title: 'Cornerstone ("Start here")',
      description: 'Optional. One tip to lead with — e.g. "About Egypt". Hidden on the page if empty.',
      type: 'object',
      group: 'cornerstone',
      fields: [
        defineField({ name: 'tip', title: 'Tip', type: 'reference', to: [{ type: 'travelTip' }] }),
        defineField({
          name: 'dek',
          title: 'Dek (optional)',
          description: 'Italic lead line. Falls back to the tip summary if blank.',
          type: 'internationalizedArrayText',
        }),
      ],
    }),

    defineField({
      name: 'departments',
      title: 'Departments (ordered)',
      description: 'The category sections, in display order. Each may carry an intro line. Tips appear by their category reference.',
      type: 'array',
      group: 'departments',
      of: [
        {
          type: 'object',
          name: 'department',
          fields: [
            defineField({
              name: 'category',
              title: 'Category',
              type: 'reference',
              to: [{ type: 'travelTipCategory' }],
              validation: (Rule) => Rule.required(),
            }),
            defineField({ name: 'intro', title: 'Intro', type: 'internationalizedArrayText' }),
          ],
          preview: {
            select: { cat: 'category.name.0.value', intro: 'intro.0.value' },
            prepare({ cat, intro }: { cat?: string; intro?: string }) {
              return { title: cat || 'Department', subtitle: intro };
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
      return { title: title || 'Travel tips archive', subtitle: '/travel-tips' };
    },
  },
});
