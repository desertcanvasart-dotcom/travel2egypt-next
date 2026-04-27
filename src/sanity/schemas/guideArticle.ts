import { defineField, defineType } from 'sanity';
import { DocumentTextIcon } from '@sanity/icons';

import {
  MIGRATION_GROUP,
  localizedPortableTextField,
  localizedSlugField,
  migrationField,
} from './_helpers';

export const guideArticleSchema = defineType({
  name: 'guideArticle',
  title: 'Guide article',
  type: 'document',
  icon: DocumentTextIcon,
  description:
    'A topical sub-article under a city guide (e.g. Cairo > Transport, Cairo > Food). URL: /guide/[city]/[sub-slug]',
  groups: [
    { name: 'content', title: 'Content', default: true },
    { name: 'media', title: 'Media' },
    { name: 'meta', title: 'Meta' },
    MIGRATION_GROUP,
  ],
  fields: [
    defineField({
      name: 'parentCity',
      title: 'Parent city',
      type: 'reference',
      to: [{ type: 'city' }],
      group: 'content',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'title',
      title: 'Title',
      type: 'internationalizedArrayString',
      group: 'content',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      ...localizedSlugField(),
      group: 'content',
    } as any),
    defineField({
      name: 'section',
      title: 'Section',
      type: 'string',
      group: 'content',
      options: {
        list: [
          { title: 'Introducing', value: 'introducing' },
          { title: 'Plan Your Trip', value: 'plan-your-trip' },
          { title: 'While You Are There', value: 'while-you-are-there' },
          { title: 'Places To Go', value: 'places-to-go' },
          { title: 'Others', value: 'others' },
        ],
        layout: 'radio',
      },
      description:
        'The sidebar grouping this article appears under on the parent city page. Non-clickable rendering hint only. Note: "Places To Go" is normally populated via wikiMonument references on the parent city (city.placesToGo), not by guideArticle documents — the value exists here only for migration compatibility.',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'orderRank',
      title: 'Display order within city',
      type: 'number',
      group: 'meta',
      initialValue: 100,
    }),
    defineField({
      name: 'summary',
      title: 'Summary',
      description: 'One sentence shown in city-page listings.',
      type: 'internationalizedArrayText',
      group: 'content',
    }),
    defineField(
      localizedPortableTextField('body', {
        title: 'Body',
        description: 'Full article content per locale.',
        group: 'content',
      }) as any
    ),
    defineField({
      name: 'heroImage',
      title: 'Hero image',
      type: 'localizedImage',
      group: 'media',
    }),
    defineField({
      name: 'relatedTours',
      title: 'Related tours',
      type: 'array',
      group: 'content',
      of: [{ type: 'reference', to: [{ type: 'tour' }] }],
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
      title: 'title',
      city: 'parentCity.name',
      media: 'heroImage',
    },
    prepare({ title, city, media }) {
      const titleEn = Array.isArray(title)
        ? title.find((t: any) => t._key === 'en')?.value
        : title;
      const cityEn = Array.isArray(city)
        ? city.find((c: any) => c._key === 'en')?.value
        : city;
      return {
        title: titleEn || 'Untitled',
        subtitle: cityEn ? `Under: ${cityEn}` : 'No parent city',
        media,
      };
    },
  },
});
