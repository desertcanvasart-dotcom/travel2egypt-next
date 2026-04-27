import { defineField, defineType } from 'sanity';
import { EarthGlobeIcon } from '@sanity/icons';

import { MIGRATION_GROUP, migrationField } from './_helpers';
import { portableTextBlocks } from './portableText';

const REGIONS = [
  { title: 'Lower Egypt (Delta & Cairo)', value: 'lower-egypt' },
  { title: 'Upper Egypt (Luxor / Aswan)', value: 'upper-egypt' },
  { title: 'Red Sea coast', value: 'red-sea' },
  { title: 'Sinai Peninsula', value: 'sinai' },
  { title: 'Western Desert (Siwa, Oases)', value: 'western-desert' },
  { title: 'Mediterranean coast', value: 'mediterranean' },
];

export const citySchema = defineType({
  name: 'city',
  title: 'City',
  type: 'document',
  icon: EarthGlobeIcon,
  groups: [
    { name: 'content', title: 'Content', default: true },
    { name: 'guide', title: 'Guide content' },
    { name: 'media', title: 'Media' },
    { name: 'meta', title: 'Meta' },
    MIGRATION_GROUP,
  ],
  fields: [
    defineField({
      name: 'name',
      title: 'Name',
      description: 'The city name in each language. "Cairo" / "El Cairo" / "カイロ".',
      type: 'internationalizedArrayString',
      group: 'content',
      validation: (Rule) =>
        Rule.required().custom((value: any) => {
          if (!value || !Array.isArray(value)) return 'Name is required';
          const en = value.find((v: any) => v._key === 'en');
          if (!en?.value) return 'English name is required';
          return true;
        }),
    }),
    defineField({
      name: 'slug',
      title: 'Slug per language',
      description:
        'URL slug for each locale. EN slug is required; ES and JA fall back to EN if blank. Slugs auto-generate from the localized name on first save but can be edited.',
      type: 'array',
      group: 'content',
      of: [
        {
          type: 'object',
          fields: [
            defineField({
              name: 'value',
              title: 'Slug',
              type: 'slug',
              options: { maxLength: 96 },
            }),
          ],
          preview: {
            select: { key: '_key', current: 'value.current' },
            prepare({ key, current }) {
              return { title: `${key?.toUpperCase()} — ${current || '(empty)'}` };
            },
          },
        },
      ],
      validation: (Rule) =>
        Rule.required().custom((value: any) => {
          if (!value || !Array.isArray(value)) return 'Slug array is required';
          const en = value.find((v: any) => v._key === 'en');
          if (!en?.value?.current) return 'English slug is required';
          return true;
        }),
    }),
    defineField({
      name: 'region',
      title: 'Region',
      type: 'string',
      group: 'content',
      options: { list: REGIONS, layout: 'dropdown' },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'orderRank',
      title: 'Display order',
      description: 'Lower numbers appear first. Used on the /guide landing page.',
      type: 'number',
      group: 'meta',
      initialValue: 100,
    }),
    defineField({
      name: 'coordinates',
      title: 'Coordinates',
      type: 'coordinates',
      group: 'content',
    }),
    defineField({
      name: 'summary',
      title: 'Summary',
      description: 'One or two sentences. Shown on cards and in lists.',
      type: 'internationalizedArrayText',
      group: 'content',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'overview',
      title: 'Guide overview',
      description:
        'The main body of /guide/[city]. Operator-grade depth — what to know about this city in real terms.',
      type: 'array',
      group: 'guide',
      of: [
        {
          type: 'object',
          fields: [
            { ...portableTextBlocks, name: 'value' },
          ],
          preview: {
            select: { key: '_key' },
            prepare({ key }) {
              return { title: `Overview — ${key?.toUpperCase()}` };
            },
          },
        },
      ],
    }),
    defineField({
      name: 'keyFacts',
      title: 'Key facts',
      type: 'object',
      group: 'guide',
      fields: [
        defineField({
          name: 'bestSeason',
          title: 'Best season to visit',
          type: 'internationalizedArrayString',
        }),
        defineField({
          name: 'gettingThere',
          title: 'Getting there',
          type: 'internationalizedArrayString',
        }),
        defineField({
          name: 'daysNeeded',
          title: 'Days needed',
          type: 'internationalizedArrayString',
        }),
      ],
    }),
    defineField({
      name: 'placesToGo',
      title: 'Places To Go',
      description:
        'Monuments and sites associated with this destination. Pulled from Egypt Wiki — same documents that appear under /wiki/monuments. Surfaced in the city sidebar under "Places To Go" using their visitorInfo field.',
      type: 'array',
      group: 'guide',
      of: [{ type: 'reference', to: [{ type: 'wikiMonument' }] }],
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
      name: 'seo',
      title: 'SEO',
      type: 'seo',
      group: 'meta',
    }),
    migrationField(),
  ],
  preview: {
    select: {
      title: 'name',
      region: 'region',
      media: 'heroImage',
    },
    prepare({ title, region, media }) {
      const en = Array.isArray(title)
        ? title.find((t: any) => t._key === 'en')?.value
        : title;
      return {
        title: en || 'Untitled city',
        subtitle: region ? region.replace(/-/g, ' ') : '',
        media,
      };
    },
  },
});
