import { defineField } from 'sanity';

import { SUPPORTED_LANGUAGES } from '../lib/languages';

/**
 * Localized slug field — produces an array with one entry per language.
 * Each entry contains a Sanity slug object. Validation requires the EN slug.
 *
 * Usage:
 *   defineField(localizedSlugField({ source: 'name', maxLength: 96 }))
 */
export function localizedSlugField(options?: {
  name?: string;
  source?: string;
  maxLength?: number;
  description?: string;
}) {
  return {
    name: options?.name ?? 'slug',
    title: 'Slug per language',
    description:
      options?.description ??
      'URL slug for each locale. EN slug is required; ES and JA fall back to EN slug if blank. Edit the localized title first, then click Generate to auto-create the slug.',
    type: 'array' as const,
    of: [
      {
        type: 'object' as const,
        fields: [
          defineField({
            name: 'value',
            title: 'Slug',
            type: 'slug',
            options: {
              maxLength: options?.maxLength ?? 96,
            },
          }),
        ],
        preview: {
          select: { key: '_key', current: 'value.current' },
          prepare({ key, current }: { key?: string; current?: string }) {
            return { title: `${key?.toUpperCase()} — ${current || '(empty)'}` };
          },
        },
      },
    ],
    initialValue: SUPPORTED_LANGUAGES.map(({ id }) => ({
      _key: id,
      _type: 'object',
      value: { _type: 'slug', current: '' },
    })),
    validation: (Rule: any) =>
      Rule.required().custom((value: any) => {
        if (!value || !Array.isArray(value)) return 'Slug array is required';
        const en = value.find((v: any) => v._key === 'en');
        if (!en?.value?.current) return 'English slug is required';
        return true;
      }),
  };
}

/**
 * Localized portable-text field — produces an array of {_key, value: portableText[]}.
 */
export function localizedPortableTextField(
  name: string,
  options?: { title?: string; description?: string; group?: string }
) {
  return {
    name,
    title: options?.title ?? name,
    description: options?.description,
    type: 'array' as const,
    group: options?.group,
    of: [
      {
        type: 'object' as const,
        fields: [
          defineField({
            name: 'value',
            title: 'Body',
            type: 'array',
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
                type: 'object',
                name: 'pullQuote',
                title: 'Pull Quote',
                fields: [
                  defineField({
                    name: 'quote',
                    title: 'Quote',
                    type: 'internationalizedArrayString',
                    validation: (Rule: any) => Rule.required(),
                  }),
                  defineField({
                    name: 'attribution',
                    title: 'Attribution (optional)',
                    type: 'internationalizedArrayString',
                    description:
                      'Who said it. Leave blank for unattributed editorial highlights.',
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
              },
              {
                type: 'object',
                name: 'sideImage',
                title: 'Side Image',
                fields: [
                  defineField({
                    name: 'image',
                    title: 'Image',
                    type: 'image',
                    options: { hotspot: true },
                    validation: (Rule: any) => Rule.required(),
                  }),
                  defineField({
                    name: 'alt',
                    title: 'Alt text',
                    type: 'internationalizedArrayString',
                    validation: (Rule: any) => Rule.required(),
                  }),
                  defineField({
                    name: 'caption',
                    title: 'Caption (optional)',
                    type: 'internationalizedArrayString',
                    description:
                      'Editorial caption that appears below the side image. Italic serif, smaller than body.',
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
              },
            ],
          }),
        ],
        preview: {
          select: { key: '_key' },
          prepare({ key }: { key?: string }) {
            return { title: `${options?.title ?? name} — ${key?.toUpperCase()}` };
          },
        },
      },
    ],
  };
}
