import { defineField } from 'sanity';

import { SUPPORTED_LANGUAGES } from '../lib/languages';
import { linkAnnotations } from './portableText';

/**
 * Field group used by the WP migration tooling. Add this to the `groups` array
 * of any schema that should track WordPress provenance, and add the
 * `migrationField()` to its `fields` array.
 */
export const MIGRATION_GROUP = { name: 'migration', title: 'Migration metadata' };

/**
 * A single nested `migration` object that carries WordPress provenance for a
 * Sanity document. Populated by `scripts/wp-import.ts`. Most sub-fields are
 * read-only; `reviewFlag` is editable so editors can clear it after review.
 *
 * GROQ examples:
 *   *[migration.wpId == 243401][0]
 *   *[migration.reviewFlag == "section-needs-assignment"]
 */
export function migrationField() {
  return defineField({
    name: 'migration',
    title: 'Migration metadata',
    type: 'object',
    group: 'migration',
    description:
      'Provenance from the WordPress migration. Read-only except `reviewFlag`, which editors may clear after addressing the issue.',
    fields: [
      defineField({
        name: 'wpId',
        title: 'WP ID',
        type: 'number',
        readOnly: true,
      }),
      defineField({
        name: 'wpUrl',
        title: 'WP URL',
        type: 'string',
        readOnly: true,
        description: 'Original full URL on travel2egypt.org. Used for redirect-map lookups and internal-link relinking.',
      }),
      defineField({
        name: 'wpModifiedAt',
        title: 'WP modified at',
        type: 'datetime',
        readOnly: true,
      }),
      defineField({
        name: 'wpTemplate',
        title: 'WP template',
        type: 'string',
        readOnly: true,
      }),
      defineField({
        name: 'migratedAt',
        title: 'Migrated at',
        type: 'datetime',
        readOnly: true,
        description: 'Timestamp of the most recent importer run that wrote this doc.',
      }),
      defineField({
        name: 'source',
        title: 'Source',
        type: 'string',
        readOnly: true,
        description: 'Always "wp-import" for now.',
      }),
      defineField({
        name: 'reviewFlag',
        title: 'Review flag',
        type: 'string',
        description:
          'Set by the importer when this doc needs editor attention. Clear after review. Known values: "section-needs-assignment", "unclassified-as-article", "service-deferred", "interactive-tool", "promotional-marketing", "locale-orphan", "keyfacts-mining-failed", "hreflang-broken", "table-flattened".',
      }),
      defineField({
        name: 'deckNeedsReview',
        title: 'Deck needs review',
        type: 'boolean',
        description:
          'Set true when the deck was hard-capped during migration cleanup (ends mid-sentence with ellipsis). Editorial should rewrite the deck and untick this. Filter in Studio with *[migration.deckNeedsReview == true].',
      }),
      defineField({
        name: 'wpAuthorId',
        title: 'WP author ID',
        type: 'number',
        readOnly: true,
        description: 'Original WordPress author user ID. Preserved so editorial can later reassign legacy-archive articles to real authors in bulk.',
      }),
      defineField({
        name: 'wpAuthorSlug',
        title: 'WP author slug',
        type: 'string',
        readOnly: true,
      }),
      defineField({
        name: 'wpCategorySlugs',
        title: 'WP category slugs',
        type: 'array',
        of: [{ type: 'string' }],
        readOnly: true,
        description: 'Original WordPress category slugs. Used by the two-bucket heuristic that mapped this doc to a Sanity editorialCategory.',
      }),
      defineField({
        name: 'cityResolution',
        title: 'City resolution source',
        type: 'string',
        readOnly: true,
        description: 'Tour mapper only. How the cities[] array was derived. One of "override", "full-slug-scan", "default-cairo".',
      }),
      defineField({
        name: 'themeMatchedPattern',
        title: 'Theme heuristic pattern',
        type: 'string',
        readOnly: true,
        description: 'Tour mapper only. Slug-keyword pattern that picked the theme ref, or "fallback" if no rule matched. Drives the Step 5 audit report.',
      }),
      defineField({
        name: 'matrixViolation',
        title: 'Matrix violation',
        type: 'object',
        readOnly: true,
        description: 'Tour mapper only. Set on group day tours assigned to cities outside the allowed-cities set. Operator clears after editorial review.',
        fields: [
          defineField({ name: 'reason', type: 'string' }),
          defineField({ name: 'cities', type: 'array', of: [{ type: 'string' }] }),
        ],
      }),
      defineField({
        name: 'durationDaysSource',
        title: 'Duration days source',
        type: 'string',
        readOnly: true,
        description: 'Tour mapper only. How durationDays was resolved: slug-leading | slug-anywhere | title | daytour-default | package-placeholder. The package-placeholder value (default 7) flags this doc for Step 5 operator review.',
      }),
    ],
  });
}

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
  options?: {
    title?: string;
    description?: string;
    group?: string;
    /**
     * Extra block members appended to the per-locale body's `of` array — e.g.
     * the archive essay passes `definitionList` and `conciergeNote`. Existing
     * callers omit it and keep the standard block set unchanged.
     */
    extraBlocks?: any[];
  }
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
              // Declare the link annotations the body data already carries
              // (internalLink/externalLink markDefs from the WP import and the
              // mention-linker) so Studio renders and edits them.
              { type: 'block', marks: { annotations: linkAnnotations } },
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
              {
                type: 'object',
                name: 'gallery',
                title: 'Image Gallery',
                fields: [
                  defineField({
                    name: 'images',
                    title: 'Images',
                    type: 'array',
                    of: [
                      {
                        type: 'image',
                        options: { hotspot: true },
                        fields: [
                          defineField({ name: 'alt', type: 'string' }),
                          defineField({ name: 'caption', type: 'string' }),
                        ],
                      },
                    ],
                    validation: (Rule: any) => Rule.min(2).error('Add at least two images.'),
                  }),
                  defineField({
                    name: 'columns',
                    title: 'Columns',
                    type: 'string',
                    options: {
                      list: [
                        { title: 'Two across', value: '2' },
                        { title: 'Three across (default)', value: '3' },
                      ],
                    },
                    initialValue: '3',
                  }),
                ],
                preview: {
                  select: { images: 'images', media: 'images.0' },
                  prepare({ images, media }: { images?: any[]; media?: any }) {
                    const n = Array.isArray(images) ? images.length : 0;
                    return { title: `Gallery — ${n} image${n === 1 ? '' : 's'}`, media };
                  },
                },
              },
              {
                type: 'object',
                name: 'operatorNote',
                title: 'Operator note',
                description:
                  'Honest aside in the operator voice. Renders as a visually distinct callout.',
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
                preview: {
                  select: { tone: 'tone' },
                  prepare({ tone }: { tone?: string }) {
                    return { title: `Operator note — ${tone ?? 'honest'}` };
                  },
                },
              },
              ...(options?.extraBlocks ?? []),
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
