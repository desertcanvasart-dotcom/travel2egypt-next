import { defineField } from 'sanity';

/**
 * Portable-text blocks shared by archive-settings essays (hotels, day tours,
 * and future archives). Passed to `localizedPortableTextField({ extraBlocks })`:
 *
 *  - definitionList: term + description rows — the Hotel Grade Concept grades,
 *    the private-day-tour tiers, etc. Rendered by the `definitionList` case in
 *    components/Body.tsx.
 *  - conciergeNote: a short first-person aside in the concierge voice. Rendered
 *    by the `conciergeNote` case in components/Body.tsx.
 */

export const DEFINITION_LIST_BLOCK = {
  type: 'object',
  name: 'definitionList',
  title: 'Definition list',
  description: 'Term + description rows — e.g. the hotel grades or the day-tour tiers.',
  fields: [
    defineField({
      name: 'items',
      title: 'Rows',
      type: 'array',
      of: [
        {
          type: 'object',
          name: 'definition',
          fields: [
            defineField({
              name: 'term',
              title: 'Term',
              type: 'internationalizedArrayString',
              validation: (Rule: any) => Rule.required(),
            }),
            defineField({
              name: 'description',
              title: 'Description',
              type: 'internationalizedArrayText',
              validation: (Rule: any) => Rule.required(),
            }),
          ],
          preview: {
            select: { term: 'term.0.value', desc: 'description.0.value' },
            prepare({ term, desc }: { term?: string; desc?: string }) {
              return { title: term || 'Definition', subtitle: desc };
            },
          },
        },
      ],
      validation: (Rule: any) => Rule.min(1),
    }),
  ],
  preview: {
    select: { items: 'items' },
    prepare({ items }: { items?: unknown[] }) {
      const n = Array.isArray(items) ? items.length : 0;
      return { title: `Definition list — ${n} row${n === 1 ? '' : 's'}` };
    },
  },
};

export const CONCIERGE_NOTE_BLOCK = {
  type: 'object',
  name: 'conciergeNote',
  title: 'Concierge note',
  description: 'A short first-person aside in the concierge voice. Gold-ruled italic aside.',
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
      validation: (Rule: any) => Rule.required(),
    }),
  ],
};

/** Convenience: the standard archive-essay extra block set. */
export const ARCHIVE_ESSAY_EXTRA_BLOCKS = [DEFINITION_LIST_BLOCK, CONCIERGE_NOTE_BLOCK];
