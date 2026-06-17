import { defineField, defineType } from 'sanity';
import { BookIcon } from '@sanity/icons';

import { localizedSlugField } from './_helpers';

/**
 * Field Guide — editorial reference doc for /resources/[slug].
 *
 * Designed for *prose-driven* guides — title + standfirst + intro,
 * a sequence of sections with rich body and optional structured
 * tip-rows, an optional operator note per section, closing reflection,
 * colophon. First user: "Tipping, Honestly" (No. 03).
 *
 * BESPOKE-VISUAL GUIDES STAY OUT.  The existing Pyramids (SVG
 * silhouettes), Egyptian Gods (family tree), and Arabic, Lightly
 * (RTL phrase rows with custom font) ship as one-off route components
 * because their visual register is too custom to template. Editors
 * see this doctype in Studio only for guides that fit the prose
 * shape; bespoke ones live in code.
 */
export const fieldGuideSchema = defineType({
  name: 'fieldGuide',
  title: 'Field Guide',
  type: 'document',
  icon: BookIcon,
  description:
    'Editorial Field Guide for /resources/[slug]. Use for prose-driven guides; bespoke-visual ones (Pyramids, Gods, Arabic) live in code as one-off routes.',
  groups: [
    { name: 'identity', title: 'Identity', default: true },
    { name: 'masthead', title: 'Masthead' },
    { name: 'content', title: 'Content' },
    { name: 'meta', title: 'Meta' },
  ],
  fields: [
    // ── Identity ────────────────────────────────────────────────────
    defineField({
      name: 'title',
      title: 'Title',
      description:
        'The headline prefix. The optional Title accent (next field) renders italic-gold beside it. "Tipping," + "Honestly" → "Tipping, Honestly".',
      type: 'internationalizedArrayString',
      group: 'identity',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'titleAccent',
      title: 'Title accent',
      description:
        'Italic gold word at the end of the headline. Leave blank for a plain title.',
      type: 'internationalizedArrayString',
      group: 'identity',
    }),
    defineField({
      ...localizedSlugField({
        description:
          'URL slug (kebab-case ASCII, e.g. "tipping-honestly"). EN slug is required; ES/JA fall back to EN. The page renders at /resources/[slug].',
      }),
      group: 'identity',
    } as any),
    defineField({
      name: 'seriesNumber',
      title: 'Series number',
      description: 'Editorial issue label — e.g. "No. 03". Shown in the masthead.',
      type: 'string',
      group: 'identity',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'order',
      title: 'Index order',
      description:
        'Ordering on /resources index. Lower comes first. Defaults to 100; set explicitly to override.',
      type: 'number',
      group: 'identity',
      initialValue: 100,
    }),

    // ── Masthead ────────────────────────────────────────────────────
    defineField({
      name: 'region',
      title: 'Region label',
      description: 'Right-side masthead meta — e.g. "Egypt, end to end".',
      type: 'internationalizedArrayString',
      group: 'masthead',
    }),
    defineField({
      name: 'tagSummary',
      title: 'Tag summary',
      description: 'Right-side masthead tag — e.g. "Tipping".',
      type: 'internationalizedArrayString',
      group: 'masthead',
    }),
    defineField({
      name: 'standfirstLead',
      title: 'Standfirst (lead)',
      description: 'The opening of the standfirst sentence.',
      type: 'internationalizedArrayText',
      group: 'masthead',
    }),
    defineField({
      name: 'standfirstAccent',
      title: 'Standfirst (italic accent)',
      description:
        'The italic-muted continuation that closes the standfirst. Optional.',
      type: 'internationalizedArrayText',
      group: 'masthead',
    }),

    // ── Content ─────────────────────────────────────────────────────
    defineField({
      name: 'intro',
      title: 'Intro paragraphs',
      description:
        'Editorial intro sitting above the first section. Separate paragraphs with a blank line.',
      type: 'internationalizedArrayText',
      group: 'content',
    }),
    defineField({
      name: 'sections',
      title: 'Sections',
      type: 'array',
      group: 'content',
      of: [
        {
          type: 'object',
          name: 'section',
          title: 'Section',
          fields: [
            defineField({
              name: 'title',
              title: 'Section title',
              type: 'internationalizedArrayString',
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'body',
              title: 'Body',
              description:
                'Section prose. Multiple paragraphs separated by a blank line.',
              type: 'internationalizedArrayText',
            }),
            defineField({
              name: 'tipRows',
              title: 'Tip rows',
              description:
                'Optional structured list — recipient/amount/context per row. Used in sections 2 and 3 of the Tipping guide.',
              type: 'array',
              of: [
                {
                  type: 'object',
                  name: 'tipRow',
                  fields: [
                    defineField({
                      name: 'recipient',
                      title: 'Recipient / situation',
                      type: 'internationalizedArrayString',
                      validation: (Rule) => Rule.required(),
                    }),
                    defineField({
                      name: 'amount',
                      title: 'Amount',
                      description:
                        'Universal across locales — currencies and ranges as written, e.g. "20-50 EGP" or "$30-60 USD per day per party".',
                      type: 'string',
                      validation: (Rule) => Rule.required(),
                    }),
                    defineField({
                      name: 'context',
                      title: 'Context',
                      description: 'One-line note on when and how.',
                      type: 'internationalizedArrayText',
                    }),
                  ],
                  preview: {
                    select: {
                      r: 'recipient',
                      amount: 'amount',
                    },
                    prepare({ r, amount }) {
                      const en = Array.isArray(r)
                        ? r.find((v: any) => v._key === 'en')?.value
                        : r;
                      return { title: en || '(no recipient)', subtitle: amount };
                    },
                  },
                },
              ],
            }),
            defineField({
              name: 'dishes',
              title: 'Glossary entries',
              description:
                'Optional editorial glossary — each entry has a name (the term/dish), a description, and an optional per-entry operator note. Introduced for the Egyptian Cuisine guide (No. 04); reusable for any glossary-shaped guide.',
              type: 'array',
              of: [
                {
                  type: 'object',
                  name: 'dishEntry',
                  fields: [
                    defineField({
                      name: 'name',
                      title: 'Name',
                      description:
                        'The term, dish, or item — rendered in editorial serif at the top of the entry.',
                      type: 'internationalizedArrayString',
                      validation: (Rule) => Rule.required(),
                    }),
                    defineField({
                      name: 'description',
                      title: 'Description',
                      description:
                        'The entry body. Paragraphs separated by a blank line.',
                      type: 'internationalizedArrayText',
                      validation: (Rule) => Rule.required(),
                    }),
                    defineField({
                      name: 'operatorNote',
                      title: 'Operator note',
                      description:
                        'Italic-gold commentary attached to this specific entry. Optional.',
                      type: 'internationalizedArrayText',
                    }),
                  ],
                  preview: {
                    select: { name: 'name' },
                    prepare({ name }) {
                      const en = Array.isArray(name)
                        ? name.find((v: any) => v._key === 'en')?.value
                        : name;
                      return { title: en || '(unnamed entry)' };
                    },
                  },
                },
              ],
            }),
            defineField({
              name: 'operatorNote',
              title: 'Operator note',
              description:
                'Italic-gold sidebar paragraph closing the section. Optional.',
              type: 'internationalizedArrayText',
            }),
            defineField({
              name: 'emphasized',
              title: 'Emphasize visually',
              description:
                'Tick to wrap the section in hairline rules (used for the Tipping guide\'s "Grey areas" section to signal editorial distinction).',
              type: 'boolean',
              initialValue: false,
            }),
          ],
          preview: {
            select: { title: 'title', emphasized: 'emphasized' },
            prepare({ title, emphasized }) {
              const en = Array.isArray(title)
                ? title.find((v: any) => v._key === 'en')?.value
                : title;
              return {
                title: en || '(untitled section)',
                subtitle: emphasized ? '· emphasized' : undefined,
              };
            },
          },
        },
      ],
    }),
    defineField({
      name: 'closing',
      title: 'Closing reflection',
      description:
        'The editorial close. Renders italic, set off above the colophon. Paragraphs separated by a blank line.',
      type: 'internationalizedArrayText',
      group: 'content',
    }),
    defineField({
      name: 'colophonNote',
      title: 'Colophon note',
      description: 'Small editorial signature line at the page foot.',
      type: 'internationalizedArrayString',
      group: 'content',
    }),

    // ── Meta ────────────────────────────────────────────────────────
    defineField({
      name: 'seo',
      title: 'SEO',
      type: 'seo',
      group: 'meta',
    }),
  ],
  preview: {
    select: {
      title: 'title',
      accent: 'titleAccent',
      number: 'seriesNumber',
    },
    prepare({ title, accent, number }) {
      const t = Array.isArray(title)
        ? title.find((v: any) => v._key === 'en')?.value
        : title;
      const a = Array.isArray(accent)
        ? accent.find((v: any) => v._key === 'en')?.value
        : accent;
      const composed = [t, a].filter(Boolean).join(' ');
      return {
        title: composed || 'Untitled Field Guide',
        subtitle: number,
      };
    },
  },
});
