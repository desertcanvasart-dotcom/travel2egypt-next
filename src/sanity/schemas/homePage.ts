import { defineField, defineType } from 'sanity';
import { HomeIcon } from '@sanity/icons';

/**
 * Homepage singleton (id: `homePage`). Holds the curated, data-driven blocks of
 * the v2 homepage that aren't pure chrome:
 *   - travellerCards  — the six "Where to begin" cells (title / dek / link)
 *   - guideCards      — the four "Egypt Travel Guide" feature cards (all → /guide)
 *   - startingPoints  — the four suggested journeys; each REFERENCES a real tour
 *                       doc (curated, never auto-filled) with editorial overrides
 *   - heroImage / heroCaption — the hero figure (tonal fallback until set)
 *
 * Hero headline + the "What we do differently" statement live in i18n messages
 * (kept verbatim). New text fields are localized; es/ja fall back to EN for now.
 */

const cardFields = [
  defineField({ name: 'title', title: 'Title', type: 'internationalizedArrayString' }),
  defineField({ name: 'dek', title: 'Dek', type: 'internationalizedArrayText' }),
  defineField({
    name: 'href',
    title: 'Link (relative path, no locale prefix)',
    description: 'e.g. /egypt-travel-packages or /guide. Leave blank to flag “no clean target”.',
    type: 'string',
  }),
];

export const homePageSchema = defineType({
  name: 'homePage',
  title: 'Homepage',
  type: 'document',
  icon: HomeIcon,
  fields: [
    defineField({
      name: 'heroImage',
      title: 'Hero image',
      description: 'The hero figure. Renders a tonal fallback until a real asset is set.',
      type: 'localizedImage',
    }),
    defineField({
      name: 'heroCaption',
      title: 'Hero image caption',
      type: 'internationalizedArrayString',
    }),
    defineField({
      name: 'travellerCards',
      title: 'Where to begin — traveller-type cells',
      description: 'Six cells: First time / Cultural / Family / Desert & quiet / In style / Coming back. Each links to a starting point.',
      type: 'array',
      of: [
        {
          type: 'object',
          name: 'travellerCard',
          fields: cardFields,
          preview: {
            select: { title: 'title' },
            prepare({ title }) {
              const en = Array.isArray(title) ? title.find((t: any) => t._key === 'en')?.value : title;
              return { title: en || 'Traveller cell' };
            },
          },
        },
      ],
    }),
    defineField({
      name: 'guideCards',
      title: 'Egypt Travel Guide — feature cards',
      description: 'Four editorial cards (How Egypt is laid out / First-trip route logic / The cities that matter / Specialist Egypt). All link to /guide.',
      type: 'array',
      of: [
        {
          type: 'object',
          name: 'guideCard',
          fields: cardFields,
          preview: {
            select: { title: 'title' },
            prepare({ title }) {
              const en = Array.isArray(title) ? title.find((t: any) => t._key === 'en')?.value : title;
              return { title: en || 'Guide card' };
            },
          },
        },
      ],
    }),
    defineField({
      name: 'startingPoints',
      title: 'Suggested starting points — curated journeys',
      description: 'Four flexible examples (NOT fixed templates, NO prices). Each MUST reference a real tour/package doc. Leave the reference empty and flag it if there is no clean match — do not invent.',
      type: 'array',
      of: [
        {
          type: 'object',
          name: 'startingPoint',
          fields: [
            defineField({
              name: 'tour',
              title: 'Journey (real tour/package)',
              type: 'reference',
              to: [{ type: 'tour' }],
              description: 'The closest real journey. The card links here.',
            }),
            defineField({ name: 'meta', title: 'Duration framing (e.g. “9–11 days”)', type: 'internationalizedArrayString' }),
            defineField({ name: 'title', title: 'Editorial title (e.g. “The First Egypt Journey”)', type: 'internationalizedArrayString' }),
            defineField({ name: 'dek', title: 'Dek', type: 'internationalizedArrayText' }),
          ],
          preview: {
            select: { title: 'title', sub: 'tour.title' },
            prepare({ title, sub }) {
              const en = Array.isArray(title) ? title.find((t: any) => t._key === 'en')?.value : title;
              return { title: en || 'Starting point', subtitle: sub ? '→ linked' : '⚠ no journey linked' };
            },
          },
        },
      ],
    }),
  ],
  preview: { prepare: () => ({ title: 'Homepage' }) },
});
