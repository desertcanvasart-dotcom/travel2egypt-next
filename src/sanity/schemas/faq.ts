import { defineField, defineType } from 'sanity';
import { CommentIcon, TagIcon } from '@sanity/icons';

import { localizedSlugField, localizedPortableTextField } from './_helpers';

export const faqCategorySchema = defineType({
  name: 'faqCategory',
  title: 'FAQ category',
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

/**
 * Inline Q&A item for the commercial landings' `faq` arrays (tourLanding /
 * tourCategory). Structured — unlike the /faq page's standalone faqEntry
 * docs, these live inside the landing document — so the page can emit
 * FAQPage rich-result markup (s47 checklist C13).
 */
export const landingFaqItemSchema = defineType({
  name: 'landingFaqItem',
  title: 'FAQ item',
  type: 'object',
  icon: CommentIcon,
  fields: [
    defineField({
      name: 'question',
      title: 'Question',
      type: 'internationalizedArrayString',
      validation: (Rule) => Rule.required(),
    }),
    defineField(
      localizedPortableTextField('answer', {
        title: 'Answer',
      }) as any
    ),
  ],
  preview: {
    select: { title: 'question' },
    prepare({ title }) {
      const en = Array.isArray(title)
        ? title.find((t: any) => t._key === 'en')?.value
        : title;
      return { title: en || 'Untitled question' };
    },
  },
});

export const faqEntrySchema = defineType({
  name: 'faqEntry',
  title: 'FAQ entry',
  type: 'document',
  icon: CommentIcon,
  fields: [
    defineField({
      name: 'question',
      title: 'Question',
      type: 'internationalizedArrayString',
      validation: (Rule) => Rule.required(),
    }),
    defineField(
      localizedPortableTextField('answer', {
        title: 'Answer',
      }) as any
    ),
    defineField({
      name: 'category',
      title: 'Category',
      type: 'reference',
      to: [{ type: 'faqCategory' }],
    }),
    defineField({
      name: 'relatedArticles',
      title: 'Related editorial',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'article' }] }],
    }),
    defineField({
      name: 'orderRank',
      title: 'Display order within category',
      type: 'number',
      initialValue: 100,
    }),
  ],
  preview: {
    select: { title: 'question' },
    prepare({ title }) {
      const en = Array.isArray(title)
        ? title.find((t: any) => t._key === 'en')?.value
        : title;
      return { title: en || 'Untitled question' };
    },
  },
});
