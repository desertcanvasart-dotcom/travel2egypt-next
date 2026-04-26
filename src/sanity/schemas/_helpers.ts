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
          defineField({ name: '_key', type: 'string', hidden: true }),
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
          defineField({ name: '_key', type: 'string', hidden: true }),
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
