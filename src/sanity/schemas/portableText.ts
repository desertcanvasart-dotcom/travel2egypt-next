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
        annotations: [
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
                validation: (Rule) =>
                  Rule.uri({ scheme: ['http', 'https', 'mailto', 'tel'] }),
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
        ],
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
