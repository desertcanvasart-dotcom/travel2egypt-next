import { defineField, defineType } from 'sanity';
import { CalendarIcon } from '@sanity/icons';

import { localizedSlugField, localizedPortableTextField } from './_helpers';

export const wikiDynastySchema = defineType({
  name: 'wikiDynasty',
  title: 'Wiki — Dynasty',
  type: 'document',
  icon: CalendarIcon,
  description:
    'A dynasty in Egyptian history. URL: /wiki/dynasties/[slug]',
  groups: [
    { name: 'identity', title: 'Identity', default: true },
    { name: 'content', title: 'Content' },
    { name: 'connections', title: 'Connections' },
    { name: 'media', title: 'Media' },
    { name: 'meta', title: 'Meta' },
  ],
  fields: [
    defineField({
      name: 'name',
      title: 'Name',
      type: 'internationalizedArrayString',
      group: 'identity',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      ...localizedSlugField(),
      group: 'identity',
    } as any),
    defineField({
      name: 'kingdom',
      title: 'Kingdom / period grouping',
      type: 'string',
      group: 'identity',
      options: {
        list: [
          { title: 'Predynastic / Early Dynastic', value: 'predynastic' },
          { title: 'Old Kingdom', value: 'old' },
          { title: 'First Intermediate Period', value: 'first-intermediate' },
          { title: 'Middle Kingdom', value: 'middle' },
          { title: 'Second Intermediate Period', value: 'second-intermediate' },
          { title: 'New Kingdom', value: 'new' },
          { title: 'Third Intermediate Period', value: 'third-intermediate' },
          { title: 'Late Period', value: 'late' },
          { title: 'Ptolemaic Kingdom', value: 'ptolemaic' },
          { title: 'Roman Egypt', value: 'roman' },
        ],
      },
    }),
    defineField({
      name: 'period',
      title: 'Period (display)',
      description: 'Human-readable date range. E.g. "1550–1295 BCE".',
      type: 'internationalizedArrayString',
      group: 'identity',
    }),
    defineField({
      name: 'startYear',
      title: 'Start year (numeric)',
      description: 'Negative for BCE. Used for sorting and timeline rendering.',
      type: 'number',
      group: 'identity',
    }),
    defineField({
      name: 'endYear',
      title: 'End year (numeric)',
      type: 'number',
      group: 'identity',
    }),
    defineField({
      name: 'summary',
      title: 'Summary',
      type: 'internationalizedArrayText',
      group: 'content',
      validation: (Rule) => Rule.required(),
    }),
    defineField(
      localizedPortableTextField('body', {
        title: 'Body',
        description: 'Full historical depth.',
        group: 'content',
      }) as any
    ),
    defineField({
      name: 'predecessorDynasty',
      title: 'Predecessor',
      type: 'reference',
      to: [{ type: 'wikiDynasty' }],
      group: 'connections',
    }),
    defineField({
      name: 'successorDynasty',
      title: 'Successor',
      type: 'reference',
      to: [{ type: 'wikiDynasty' }],
      group: 'connections',
    }),
    defineField({
      name: 'notableRulers',
      title: 'Notable rulers',
      type: 'array',
      group: 'connections',
      of: [{ type: 'reference', to: [{ type: 'wikiPerson' }] }],
    }),
    defineField({
      name: 'notableMonuments',
      title: 'Notable monuments',
      type: 'array',
      group: 'connections',
      of: [{ type: 'reference', to: [{ type: 'wikiMonument' }] }],
    }),
    defineField({
      name: 'relatedArticles',
      title: 'Related articles',
      type: 'array',
      group: 'connections',
      of: [{ type: 'reference', to: [{ type: 'article' }] }],
    }),
    defineField({
      name: 'relatedTours',
      title: 'Related tours',
      type: 'array',
      group: 'connections',
      of: [{ type: 'reference', to: [{ type: 'tour' }] }],
    }),
    defineField({
      name: 'heroImage',
      title: 'Hero image',
      type: 'localizedImage',
      group: 'media',
    }),
    defineField({
      name: 'gallery',
      title: 'Gallery',
      type: 'array',
      group: 'media',
      of: [{ type: 'localizedImage' }],
    }),
    defineField({
      name: 'featured',
      title: 'Featured on /wiki landing',
      description:
        'Tick to surface this dynasty in the wiki landing page\'s "Browse by dynasty" preview section.',
      type: 'boolean',
      group: 'meta',
      initialValue: false,
    }),
    defineField({
      name: 'seo',
      title: 'SEO',
      type: 'seo',
      group: 'meta',
    }),
  ],
  preview: {
    select: {
      title: 'name',
      period: 'period',
      kingdom: 'kingdom',
      media: 'heroImage',
    },
    prepare({ title, period, kingdom, media }) {
      const titleEn = Array.isArray(title)
        ? title.find((t: any) => t._key === 'en')?.value
        : title;
      const periodEn = Array.isArray(period)
        ? period.find((p: any) => p._key === 'en')?.value
        : period;
      return {
        title: titleEn || 'Untitled dynasty',
        subtitle: [kingdom, periodEn].filter(Boolean).join(' · '),
        media,
      };
    },
  },
});
