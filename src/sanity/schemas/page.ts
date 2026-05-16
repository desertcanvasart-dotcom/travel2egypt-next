import { defineField, defineType } from 'sanity';
import { DocumentIcon, MasterDetailIcon } from '@sanity/icons';

import { localizedSlugField, localizedPortableTextField } from './_helpers';

export const pageSchema = defineType({
  name: 'page',
  title: 'Page',
  type: 'document',
  icon: MasterDetailIcon,
  description:
    'Generic editorial page (About, Why Travel2Egypt, Contact intro, etc.). For pages that do not fit a more specific type.',
  groups: [
    { name: 'content', title: 'Content', default: true },
    { name: 'meta', title: 'Meta' },
  ],
  fields: [
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
      name: 'summary',
      title: 'Summary',
      type: 'internationalizedArrayText',
      group: 'content',
    }),
    defineField(
      localizedPortableTextField('body', {
        title: 'Body',
        group: 'content',
      }) as any
    ),
    defineField({
      name: 'heroImage',
      title: 'Hero image',
      type: 'localizedImage',
      group: 'content',
    }),
    defineField({
      name: 'seo',
      title: 'SEO',
      type: 'seo',
      group: 'meta',
    }),
  ],
  preview: {
    select: { title: 'title', media: 'heroImage' },
    prepare({ title, media }) {
      const en = Array.isArray(title)
        ? title.find((t: any) => t._key === 'en')?.value
        : title;
      return { title: en || 'Untitled page', media };
    },
  },
});

export const legalPageSchema = defineType({
  name: 'legalPage',
  title: 'Legal page',
  type: 'document',
  icon: DocumentIcon,
  description: 'Privacy, terms, AI disclosure, cookie policy. Legal review per locale required.',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'internationalizedArrayString',
      validation: (Rule) => Rule.required(),
    }),
    defineField(localizedSlugField() as any),
    defineField({
      name: 'kind',
      title: 'Kind',
      type: 'string',
      options: {
        list: [
          { title: 'Privacy policy', value: 'privacy' },
          { title: 'Terms & conditions', value: 'terms' },
          { title: 'Cookie policy', value: 'cookies' },
          { title: 'Disclaimer', value: 'disclaimer' },
          { title: 'AI disclosure', value: 'ai-disclosure' },
          { title: 'Other', value: 'other' },
        ],
      },
    }),
    defineField(
      localizedPortableTextField('body', { title: 'Body' }) as any
    ),
    defineField({
      name: 'lastUpdated',
      title: 'Last updated',
      type: 'date',
    }),
    defineField({
      name: 'legalReviewStatus',
      title: 'Legal review status',
      description: 'Track whether each locale has been reviewed by counsel.',
      type: 'object',
      fields: [
        defineField({ name: 'en', title: 'EN reviewed', type: 'boolean', initialValue: false }),
        defineField({ name: 'es', title: 'ES reviewed', type: 'boolean', initialValue: false }),
        defineField({ name: 'ja', title: 'JA reviewed', type: 'boolean', initialValue: false }),
      ],
    }),
  ],
  preview: {
    select: { title: 'title', kind: 'kind' },
    prepare({ title, kind }) {
      const en = Array.isArray(title)
        ? title.find((t: any) => t._key === 'en')?.value
        : title;
      return { title: en || 'Untitled legal page', subtitle: kind };
    },
  },
});
