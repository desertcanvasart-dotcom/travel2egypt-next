import { defineField, defineType } from 'sanity';
import { HomeIcon } from '@sanity/icons';

import { localizedSlugField, localizedPortableTextField } from './_helpers';

export const wikiMonumentSchema = defineType({
  name: 'wikiMonument',
  title: 'Wiki — Monument',
  type: 'document',
  icon: HomeIcon,
  description:
    'Temples, tombs, pyramids, mortuary temples, and other monuments. URL: /wiki/monuments/[slug]',
  groups: [
    { name: 'identity', title: 'Identity', default: true },
    { name: 'location', title: 'Location' },
    { name: 'history', title: 'History' },
    { name: 'content', title: 'Content' },
    { name: 'visiting', title: 'Visiting' },
    { name: 'connections', title: 'Connections' },
    { name: 'media', title: 'Media' },
    { name: 'meta', title: 'Meta' },
  ],
  fields: [
    defineField({
      name: 'name',
      title: 'Name',
      description:
        'Full name. "Temple of Hatshepsut at Deir el-Bahari" / "Templo de Hatshepsut en Deir el-Bahari".',
      type: 'internationalizedArrayString',
      group: 'identity',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      ...localizedSlugField(),
      group: 'identity',
    } as any),
    defineField({
      name: 'monumentType',
      title: 'Type',
      type: 'string',
      group: 'identity',
      options: {
        list: [
          { title: 'Temple', value: 'temple' },
          { title: 'Mortuary temple', value: 'mortuary-temple' },
          { title: 'Tomb', value: 'tomb' },
          { title: 'Rock-cut tomb', value: 'rock-cut-tomb' },
          { title: 'Pyramid', value: 'pyramid' },
          { title: 'Shrine', value: 'shrine' },
          { title: 'Fortress', value: 'fortress' },
          { title: 'Palace', value: 'palace' },
          { title: 'Obelisk', value: 'obelisk' },
          { title: 'Colossus / statue', value: 'colossus' },
          { title: 'Necropolis', value: 'necropolis' },
          { title: 'Other', value: 'other' },
        ],
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'city',
      title: 'City',
      type: 'reference',
      to: [{ type: 'city' }],
      group: 'location',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'preciseLocation',
      title: 'Precise location',
      description:
        'Within the city. E.g. "West Bank, Luxor" / "Valley of the Kings" / "Giza Plateau".',
      type: 'internationalizedArrayString',
      group: 'location',
    }),
    defineField({
      name: 'coordinates',
      title: 'Coordinates',
      type: 'coordinates',
      group: 'location',
    }),
    defineField({
      name: 'builtBy',
      title: 'Built / commissioned by',
      type: 'array',
      group: 'history',
      of: [{ type: 'reference', to: [{ type: 'wikiPerson' }] }],
    }),
    defineField({
      name: 'builtDuring',
      title: 'Built during (dynasty)',
      type: 'reference',
      to: [{ type: 'wikiDynasty' }],
      group: 'history',
    }),
    defineField({
      name: 'buriedHere',
      title: 'Buried here',
      description: 'For tombs only — who was interred.',
      type: 'array',
      group: 'history',
      of: [{ type: 'reference', to: [{ type: 'wikiPerson' }] }],
      hidden: ({ document }) =>
        !['tomb', 'rock-cut-tomb', 'pyramid', 'mortuary-temple', 'necropolis'].includes(
          document?.monumentType as string
        ),
    }),
    defineField({
      name: 'dedicatedTo',
      title: 'Dedicated to (deities)',
      description: 'For temples — which deities the monument was built to honor.',
      type: 'array',
      group: 'history',
      of: [{ type: 'reference', to: [{ type: 'wikiDeity' }] }],
      hidden: ({ document }) =>
        !['temple', 'shrine', 'mortuary-temple'].includes(
          document?.monumentType as string
        ),
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
        title: 'History & architecture',
        description: 'Historical and architectural depth.',
        group: 'content',
      }) as any
    ),
    defineField(
      localizedPortableTextField('visitorInfo', {
        title: 'Visitor info',
        description:
          'Operational specifics for travelers: opening hours, photography permits, accessibility, what most visitors miss, what to skip. Operator-grade detail.',
        group: 'visiting',
      }) as any
    ),
    defineField({
      name: 'relatedMonuments',
      title: 'Related monuments',
      type: 'array',
      group: 'connections',
      of: [{ type: 'reference', to: [{ type: 'wikiMonument' }] }],
    }),
    defineField({
      name: 'relatedTours',
      title: 'Related tours',
      type: 'array',
      group: 'connections',
      of: [{ type: 'reference', to: [{ type: 'tour' }] }],
    }),
    defineField({
      name: 'relatedArticles',
      title: 'Related articles',
      type: 'array',
      group: 'connections',
      of: [{ type: 'reference', to: [{ type: 'article' }] }],
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
  ],
  preview: {
    select: {
      title: 'name',
      type: 'monumentType',
      city: 'city.name',
      media: 'heroImage',
    },
    prepare({ title, type, city, media }) {
      const titleEn = Array.isArray(title)
        ? title.find((t: any) => t._key === 'en')?.value
        : title;
      const cityEn = Array.isArray(city)
        ? city.find((c: any) => c._key === 'en')?.value
        : city;
      return {
        title: titleEn || 'Untitled monument',
        subtitle: [type, cityEn].filter(Boolean).join(' · '),
        media,
      };
    },
  },
});
