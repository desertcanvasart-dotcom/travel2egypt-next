import { defineField, defineType } from 'sanity';
import { ComposeIcon } from '@sanity/icons';

import { MIGRATION_GROUP, migrationField } from './_helpers';

/**
 * Editorial article — the heart of the journal.
 *
 * Unlike most other types, articles use DOCUMENT-LEVEL i18n via the
 * @sanity/document-internationalization plugin. This means each language
 * version is a separate document, and the documents are linked through the
 * plugin's reference field.
 *
 * Why document-level here:
 *  - Editorial content diverges between locales. A piece on Ramadan in Cairo
 *    for a JA audience is genuinely different from one for an ES audience.
 *  - Some articles will exist in only one language, which is fine.
 *  - Translators work on a single document at a time, not on dozens of
 *    interleaved fields.
 *
 * The `language` field is added automatically by the plugin. We only need to
 * declare it here and the plugin handles the linking UI.
 */
export const articleSchema = defineType({
  name: 'article',
  title: 'Article',
  type: 'document',
  icon: ComposeIcon,
  description:
    'Editorial article (journal post). One document per language. Use the language switcher in the document header to navigate or create translations.',
  groups: [
    { name: 'content', title: 'Content', default: true },
    { name: 'related', title: 'Related' },
    { name: 'media', title: 'Media' },
    { name: 'meta', title: 'Meta' },
    MIGRATION_GROUP,
  ],
  fields: [
    // Added by the document-internationalization plugin — declare so it shows.
    defineField({
      name: 'language',
      title: 'Language',
      type: 'string',
      readOnly: true,
      hidden: true,
    }),
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      group: 'content',
      validation: (Rule) => Rule.required().max(120),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      group: 'content',
      options: { source: 'title', maxLength: 96 },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'deck',
      title: 'Standfirst',
      description: 'Short editorial subtitle. One sentence, sets the tone.',
      type: 'text',
      group: 'content',
      rows: 3,
    }),
    defineField({
      name: 'category',
      title: 'Category',
      type: 'reference',
      to: [{ type: 'editorialCategory' }],
      group: 'content',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'author',
      title: 'Author',
      type: 'reference',
      to: [{ type: 'author' }],
      group: 'content',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'publishedAt',
      title: 'Published at',
      type: 'datetime',
      group: 'content',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'featured',
      title: 'Featured',
      description:
        'Tick to surface this article in the journal landing page\'s featured slot. Only one featured article displays at a time — most-recent featured wins.',
      type: 'boolean',
      group: 'content',
      initialValue: false,
    }),
    defineField({
      name: 'updatedAt',
      title: 'Updated at',
      description: 'Optional. Show "Updated" label when present.',
      type: 'datetime',
      group: 'content',
    }),
    defineField({
      name: 'body',
      title: 'Body',
      description: 'Full article. The body uses the standard portable text editor with operator-note callouts.',
      type: 'array',
      group: 'content',
      of: [
        { type: 'block' },
        {
          type: 'image',
          options: { hotspot: true },
          fields: [
            defineField({ name: 'alt', type: 'string' }),
            defineField({ name: 'caption', type: 'string' }),
          ],
        },
        {
          name: 'operatorNote',
          type: 'object',
          title: 'Operator note',
          fields: [
            defineField({
              name: 'tone',
              type: 'string',
              options: {
                list: [
                  { title: 'Honest take', value: 'honest' },
                  { title: 'Watch out', value: 'caution' },
                  { title: 'Insider tip', value: 'insider' },
                  { title: 'Worth knowing', value: 'context' },
                ],
              },
              initialValue: 'honest',
            }),
            defineField({
              name: 'body',
              type: 'array',
              of: [{ type: 'block' }],
            }),
          ],
        },
        {
          name: 'conciergeNote',
          type: 'object',
          title: 'Concierge note',
          icon: ComposeIcon,
          description:
            'A short first-person aside in the concierge voice — practical guidance the reader can act on. Renders as a gold-ruled italic aside inside the article.',
          fields: [
            defineField({
              name: 'body',
              title: 'Note',
              type: 'array',
              of: [
                {
                  type: 'block',
                  styles: [{ title: 'Paragraph', value: 'normal' }],
                  marks: {
                    decorators: [
                      { title: 'Bold', value: 'strong' },
                      { title: 'Italic', value: 'em' },
                    ],
                    annotations: [],
                  },
                },
              ],
              validation: (Rule) => Rule.required(),
            }),
          ],
          preview: {
            select: { body: 'body' },
            prepare({ body }: { body?: Array<{ children?: Array<{ text?: string }> }> }) {
              const text = body?.[0]?.children?.map((c) => c.text).join('') ?? '';
              return {
                title: text ? `“${text.slice(0, 60)}…”` : 'Concierge note',
                subtitle: 'Concierge note',
              };
            },
          },
        },
      ],
    }),
    defineField({
      name: 'heroImage',
      title: 'Hero image',
      type: 'image',
      group: 'media',
      options: { hotspot: true },
      fields: [
        defineField({ name: 'alt', type: 'string' }),
        defineField({ name: 'caption', type: 'string' }),
        defineField({ name: 'credit', type: 'string' }),
      ],
    }),
    defineField({
      name: 'relatedArticles',
      title: 'Related articles',
      type: 'array',
      group: 'related',
      of: [{ type: 'reference', to: [{ type: 'article' }] }],
    }),
    defineField({
      name: 'relatedTours',
      title: 'Related tours',
      type: 'array',
      group: 'related',
      of: [{ type: 'reference', to: [{ type: 'tour' }] }],
    }),
    defineField({
      name: 'relatedCities',
      title: 'Related cities',
      type: 'array',
      group: 'related',
      of: [{ type: 'reference', to: [{ type: 'city' }] }],
    }),
    defineField({
      name: 'seo',
      title: 'SEO',
      type: 'object',
      group: 'meta',
      fields: [
        defineField({ name: 'metaTitle', type: 'string' }),
        defineField({ name: 'metaDescription', type: 'text', rows: 3 }),
        defineField({
          name: 'ogImage',
          type: 'image',
          options: { hotspot: true },
        }),
      ],
    }),
    migrationField(),
  ],
  preview: {
    select: {
      title: 'title',
      author: 'author.name',
      lang: 'language',
      media: 'heroImage',
    },
    prepare({ title, author, lang, media }) {
      return {
        title,
        subtitle: `${lang?.toUpperCase() || '—'}${author ? ` · ${author}` : ''}`,
        media,
      };
    },
  },
});
