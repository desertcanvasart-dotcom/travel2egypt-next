import { defineField, defineType } from 'sanity';
import { TagIcon } from '@sanity/icons';

import { localizedSlugField } from './_helpers';

export const themeSchema = defineType({
  name: 'theme',
  title: 'Package theme',
  type: 'document',
  icon: TagIcon,
  description:
    'Top-level packaging themes: Egypt In Depth, Egypt Family Holidays, Luxury, Hassle-Free, etc. Used to group packages and to drive theme landing pages.',
  fields: [
    defineField({
      name: 'name',
      title: 'Name',
      type: 'internationalizedArrayString',
      validation: (Rule) => Rule.required(),
    }),
    defineField(localizedSlugField() as any),
    defineField({
      name: 'orderRank',
      title: 'Display order',
      type: 'number',
      initialValue: 100,
    }),
    defineField({
      name: 'description',
      title: 'Description',
      description:
        'One paragraph. Drives the /packages/[theme] landing page intro and shows on theme cards.',
      type: 'internationalizedArrayText',
    }),
    defineField({
      name: 'heroImage',
      title: 'Hero image',
      type: 'localizedImage',
    }),
    defineField({
      name: 'seo',
      title: 'SEO',
      type: 'seo',
    }),
  ],
  preview: {
    select: { title: 'name', media: 'heroImage' },
    prepare({ title, media }) {
      const en = Array.isArray(title)
        ? title.find((t: any) => t._key === 'en')?.value
        : title;
      return { title: en || 'Untitled theme', media };
    },
  },
});
