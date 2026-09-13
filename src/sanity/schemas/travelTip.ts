import { defineField, defineType } from 'sanity';
import { HelpCircleIcon, TagIcon } from '@sanity/icons';

import { localizedSlugField, localizedPortableTextField } from './_helpers';
import { DEFINITION_LIST_BLOCK } from './_archiveBlocks';

export const travelTipCategorySchema = defineType({
  name: 'travelTipCategory',
  title: 'Travel tip category',
  type: 'document',
  icon: TagIcon,
  fields: [
    defineField({
      name: 'name',
      title: 'Name',
      type: 'internationalizedArrayString',
      validation: (Rule) => Rule.required(),
    }),
    defineField(localizedSlugField() as any),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'internationalizedArrayText',
    }),
    defineField({
      name: 'orderRank',
      title: 'Display order',
      type: 'number',
      initialValue: 100,
    }),
  ],
  preview: {
    select: { title: 'name' },
    prepare({ title }) {
      const en = Array.isArray(title)
        ? title.find((t: any) => t._key === 'en')?.value
        : title;
      return { title: en || 'Untitled category' };
    },
  },
});

export const travelTipSchema = defineType({
  name: 'travelTip',
  title: 'Travel tip',
  type: 'document',
  icon: HelpCircleIcon,
  description:
    'Practical, factual travel tips (visa, currency, dress, tipping, safety, etc.). URL: /travel-tips/[slug]',
  groups: [
    { name: 'content', title: 'Content', default: true },
    { name: 'media', title: 'Media' },
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
      name: 'category',
      title: 'Category',
      type: 'reference',
      to: [{ type: 'travelTipCategory' }],
      group: 'content',
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
        group: 'content',
        // Provider comparison rows (staying-connected-in-egypt) use the shared
        // definitionList block; declare it so Studio can render and edit it.
        extraBlocks: [DEFINITION_LIST_BLOCK],
      }) as any
    ),
    defineField({
      name: 'relatedTips',
      title: 'Related tips',
      type: 'array',
      group: 'content',
      of: [{ type: 'reference', to: [{ type: 'travelTip' }] }],
    }),
    defineField({
      name: 'heroImage',
      title: 'Hero image',
      type: 'localizedImage',
      group: 'media',
    }),
    defineField({
      name: 'featured',
      title: 'Featured on travel-tips landing',
      description:
        'When checked, this tip appears in the featured strip on the /travel-tips index page.',
      type: 'boolean',
      initialValue: false,
      group: 'meta',
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
      return { title: en || 'Untitled tip', media };
    },
  },
});
