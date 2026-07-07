import { defineArrayMember, defineField, defineType } from 'sanity';
import { BlockContentIcon, ImageIcon, LinkIcon } from '@sanity/icons';

/**
 * The reusable rich-text body. Used inside internationalized-array fields so
 * each locale can have its own portable-text body.
 *
 * Includes:
 *  - Standard text styles (paragraph, h2, h3, blockquote)
 *  - Lists
 *  - Inline links — internal (to other docs) and external
 *  - Images with caption + alt
 *  - "Operator note" callout — used for the brand voice's honest asides
 *
 * The wiki, editorial articles, tour body, city overview, and most other
 * long-form fields all use this same block content shape. A future
 * enhancement: allow embedding wikiPerson / wikiMonument cards inline so
 * editors can drop "see more on Hatshepsut" inline references.
 */
/**
 * Inline link annotations shared by every rich-text body. Also used by
 * `localizedPortableTextField` in _helpers.ts: guide-article body DATA has
 * carried internalLink/externalLink markDefs since the WP import, but that
 * field's schema never declared them, so Studio rendered the text without
 * any link styling and editors could not see or edit the links.
 */
export const linkAnnotations = [
  {
    name: 'externalLink',
    title: 'External link',
    type: 'object',
    icon: LinkIcon,
    fields: [
      defineField({
        name: 'href',
        title: 'URL',
        type: 'url',
        validation: (Rule) => Rule.uri({ scheme: ['http', 'https', 'mailto', 'tel'] }),
      }),
      defineField({
        name: 'newTab',
        title: 'Open in new tab',
        type: 'boolean',
        initialValue: true,
      }),
    ],
  },
  {
    name: 'internalLink',
    title: 'Internal link',
    type: 'object',
    icon: LinkIcon,
    fields: [
      defineField({
        name: 'reference',
        title: 'Linked document',
        type: 'reference',
        to: [
          { type: 'city' },
          { type: 'guideArticle' },
          { type: 'tour' },
          { type: 'travelTip' },
          { type: 'article' },
          { type: 'wikiPerson' },
          { type: 'wikiMonument' },
          { type: 'wikiDynasty' },
          { type: 'wikiDeity' },
          { type: 'hotel' },
          { type: 'nileCruise' },
        ],
      }),
    ],
  },
];

export const portableTextBlocks = defineField({
  name: 'body',
  title: 'Body',
  type: 'array',
  of: [
    defineArrayMember({
      type: 'block',
      styles: [
        { title: 'Paragraph', value: 'normal' },
        { title: 'Heading 2', value: 'h2' },
        { title: 'Heading 3', value: 'h3' },
        { title: 'Heading 4', value: 'h4' },
        { title: 'Quote', value: 'blockquote' },
      ],
      lists: [
        { title: 'Bullet', value: 'bullet' },
        { title: 'Numbered', value: 'number' },
      ],
      marks: {
        decorators: [
          { title: 'Bold', value: 'strong' },
          { title: 'Italic', value: 'em' },
          { title: 'Underline', value: 'underline' },
        ],
        annotations: linkAnnotations,
      },
    }),
    defineArrayMember({
      type: 'image',
      icon: ImageIcon,
      options: { hotspot: true },
      fields: [
        defineField({
          name: 'alt',
          title: 'Alt text',
          type: 'internationalizedArrayString',
        }),
        defineField({
          name: 'caption',
          title: 'Caption',
          type: 'internationalizedArrayString',
        }),
      ],
    }),
    defineArrayMember({
      name: 'pullQuote',
      title: 'Pull Quote',
      type: 'object',
      fields: [
        defineField({
          name: 'quote',
          title: 'Quote',
          type: 'internationalizedArrayString',
          validation: (Rule) => Rule.required(),
        }),
        defineField({
          name: 'attribution',
          title: 'Attribution (optional)',
          type: 'internationalizedArrayString',
          description:
            'Who said it. Leave blank for unattributed editorial highlights. Examples: "Local legend," "Travel folklore," "An 18th-century traveler," or a specific name.',
        }),
        defineField({
          name: 'style',
          title: 'Style',
          type: 'string',
          options: {
            list: [
              { title: 'Literary (default)', value: 'literary' },
              { title: 'Historical', value: 'historical' },
              { title: 'Traveler voice', value: 'traveler' },
            ],
          },
          initialValue: 'literary',
        }),
      ],
      preview: {
        select: {
          quote: 'quote.0.value',
          attribution: 'attribution.0.value',
        },
        prepare({ quote, attribution }: { quote?: string; attribution?: string }) {
          return {
            title: quote ? `"${quote.slice(0, 60)}..."` : 'Pull quote',
            subtitle: attribution || '—',
          };
        },
      },
    }),
    defineArrayMember({
      name: 'sideImage',
      title: 'Side Image',
      type: 'object',
      fields: [
        defineField({
          name: 'image',
          title: 'Image',
          type: 'image',
          options: { hotspot: true },
          validation: (Rule) => Rule.required(),
        }),
        defineField({
          name: 'alt',
          title: 'Alt text',
          type: 'internationalizedArrayString',
          validation: (Rule) => Rule.required(),
        }),
        defineField({
          name: 'caption',
          title: 'Caption (optional)',
          type: 'internationalizedArrayString',
          description:
            'Editorial caption that appears below the side image. Italic serif, smaller than body. Used for atmospheric framing, not literal description of the photo.',
        }),
        defineField({
          name: 'alignment',
          title: 'Alignment',
          type: 'string',
          options: {
            list: [
              { title: 'Right (default)', value: 'right' },
              { title: 'Left', value: 'left' },
            ],
          },
          initialValue: 'right',
        }),
      ],
      preview: {
        select: {
          media: 'image',
          caption: 'caption.0.value',
        },
        prepare({ media, caption }: { media?: any; caption?: string }) {
          return {
            title: caption || 'Side image',
            media,
          };
        },
      },
    }),
    defineArrayMember({
      name: 'operatorNote',
      title: 'Operator note',
      type: 'object',
      icon: BlockContentIcon,
      description:
        'Use for honest asides in the operator voice: "we don\'t recommend Alexandria for first-time visitors because…" Renders as a visually distinct callout.',
      fields: [
        defineField({
          name: 'tone',
          title: 'Tone',
          type: 'string',
          options: {
            list: [
              { title: 'Honest take', value: 'honest' },
              { title: 'Watch out', value: 'caution' },
              { title: 'Insider tip', value: 'insider' },
              { title: 'Worth knowing', value: 'context' },
            ],
            layout: 'radio',
          },
          initialValue: 'honest',
        }),
        defineField({
          name: 'body',
          title: 'Note',
          type: 'array',
          of: [{ type: 'block', styles: [{ title: 'Paragraph', value: 'normal' }] }],
        }),
      ],
    }),
    defineArrayMember({
      name: 'conciergeNote',
      title: 'Concierge note',
      type: 'object',
      icon: BlockContentIcon,
      description:
        'A short first-person aside in the concierge voice — practical guidance the reader can act on ("If you only fly once, fly at the start of your Cairo days"). Renders as a gold-ruled italic aside inside the article.',
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
    }),
  ],
});

/**
 * Standalone document used by tests and to anchor the type system.
 * Most usage is by referencing `portableTextBlocks` inline.
 */
export const portableTextSchema = defineType({
  name: 'portableText',
  title: 'Portable Text',
  type: 'object',
  fields: [portableTextBlocks],
});
