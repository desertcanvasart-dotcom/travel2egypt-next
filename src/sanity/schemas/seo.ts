import { defineField, defineType } from 'sanity';
import { SearchIcon } from '@sanity/icons';

export const seoSchema = defineType({
  name: 'seo',
  title: 'SEO',
  type: 'object',
  icon: SearchIcon,
  fields: [
    defineField({
      name: 'metaTitle',
      title: 'Meta title',
      description:
        'Title for search engines and social cards. Falls back to the document title if blank. Aim for under 60 characters per locale.',
      type: 'internationalizedArrayString',
    }),
    defineField({
      name: 'metaDescription',
      title: 'Meta description',
      description: 'Description for search results. 150–160 characters works best.',
      type: 'internationalizedArrayText',
    }),
    defineField({
      name: 'ogImage',
      title: 'Social share image',
      description:
        'Image used when this page is shared on social media. Optional — defaults to the hero image.',
      type: 'image',
      options: { hotspot: true },
    }),
    defineField({
      name: 'noIndex',
      title: 'Hide from search engines',
      description: 'Tick this to add a noindex tag. Use sparingly.',
      type: 'boolean',
      initialValue: false,
    }),
  ],
});
