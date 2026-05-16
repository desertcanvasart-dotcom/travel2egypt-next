import { defineField, defineType } from 'sanity';
import { ComposeIcon } from '@sanity/icons';

import { localizedSlugField, localizedPortableTextField } from './_helpers';

/**
 * Editorial pages — long-form, voice-driven copy that lives in Sanity so
 * the operator can edit without code deploys. Differs from `page` (which
 * is generic CMS content) and `legalPage` (Terms/Privacy — short policy
 * docs). Editorial pages have a richer section model: hero, ribbon,
 * multiple body sections, CTAs.
 *
 * The frontend looks the doc up by `kind` (locale-invariant) rather than
 * slug — same pattern as legalPage. Slug is per-locale for SEO URLs.
 *
 * First instance: Hotel Grade Concept (session 34). Future candidates:
 * About, How We Plan Trips, anything heavier than a single-block policy.
 */
export const editorialPageSchema = defineType({
  name: 'editorialPage',
  title: 'Editorial page',
  type: 'document',
  icon: ComposeIcon,
  description:
    'Long-form editorial pages like Hotel Grade Concept, About, How We Plan. Hero + structured body sections + ribbon + CTAs.',
  groups: [
    { name: 'identity', title: 'Identity', default: true },
    { name: 'hero', title: 'Hero' },
    { name: 'body', title: 'Body sections' },
    { name: 'ribbon', title: 'Mid-page ribbon' },
    { name: 'cta', title: 'Bottom CTA' },
    { name: 'meta', title: 'Meta' },
  ],
  fields: [
    defineField({
      name: 'kind',
      title: 'Kind',
      description:
        'Locale-invariant identifier the frontend queries by. Add new values when shipping new editorial pages.',
      type: 'string',
      group: 'identity',
      options: {
        list: [
          { title: 'Hotel Grade Concept', value: 'hotel-grade-concept' },
          { title: 'Responsible Travel', value: 'responsible-travel' },
          { title: 'Contact', value: 'contact' },
          { title: 'About', value: 'about' },
          { title: 'How We Plan', value: 'how-we-plan' },
          { title: 'Other', value: 'other' },
        ],
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'title',
      title: 'Title (admin label)',
      description: 'Shown in Studio lists. Not used in page rendering.',
      type: 'string',
      group: 'identity',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      ...localizedSlugField(),
      group: 'identity',
    } as any),

    // ── Hero ───────────────────────────────────────
    defineField({
      name: 'heroHeading',
      title: 'Hero heading',
      type: 'internationalizedArrayString',
      group: 'hero',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'heroSubhead',
      title: 'Hero subhead',
      type: 'internationalizedArrayText',
      group: 'hero',
    }),
    defineField({
      name: 'heroPrimaryCta',
      title: 'Hero primary CTA',
      type: 'object',
      group: 'hero',
      fields: [
        defineField({ name: 'label', title: 'Label', type: 'internationalizedArrayString' }),
        defineField({ name: 'href', title: 'URL', type: 'string', description: 'Site-internal path (e.g. /contact) or an external URL (e.g. a WhatsApp deep link)' }),
      ],
    }),
    defineField({
      name: 'heroSecondaryCta',
      title: 'Hero secondary CTA',
      type: 'object',
      group: 'hero',
      fields: [
        defineField({ name: 'label', title: 'Label', type: 'internationalizedArrayString' }),
        defineField({ name: 'href', title: 'URL', type: 'string' }),
      ],
    }),

    // ── Body sections ─────────────────────────────
    defineField({
      name: 'sections',
      title: 'Body sections',
      description:
        'Ordered editorial sections. Each renders as a heading + portable-text body. Add as many as the page needs.',
      type: 'array',
      group: 'body',
      of: [
        {
          type: 'object',
          name: 'section',
          fields: [
            defineField({
              name: 'heading',
              title: 'Heading',
              type: 'internationalizedArrayString',
              validation: (Rule) => Rule.required(),
            }),
            defineField(
              localizedPortableTextField('body', { title: 'Body' }) as any
            ),
          ],
          preview: {
            select: { heading: 'heading' },
            prepare({ heading }: any) {
              const en = Array.isArray(heading)
                ? heading.find((h: any) => h._key === 'en')?.value
                : heading;
              return { title: en || 'Untitled section' };
            },
          },
        },
      ],
    }),

    // ── Mid-page ribbon ───────────────────────────
    defineField({
      name: 'ribbonBody',
      title: 'Ribbon copy',
      description: 'Short persuasion line shown in the orange band between body sections and the dynamic tier columns.',
      type: 'internationalizedArrayText',
      group: 'ribbon',
    }),
    defineField({
      name: 'ribbonCta',
      title: 'Ribbon CTA',
      type: 'object',
      group: 'ribbon',
      fields: [
        defineField({ name: 'label', title: 'Label', type: 'internationalizedArrayString' }),
        defineField({ name: 'href', title: 'URL', type: 'string' }),
      ],
    }),

    // ── Bottom CTA ────────────────────────────────
    defineField({
      name: 'bottomCtaHeading',
      title: 'Bottom CTA heading',
      type: 'internationalizedArrayString',
      group: 'cta',
    }),
    defineField({
      name: 'bottomCtaBody',
      title: 'Bottom CTA body',
      type: 'internationalizedArrayText',
      group: 'cta',
    }),
    defineField({
      name: 'bottomCtaPrimary',
      title: 'Bottom CTA — primary',
      type: 'object',
      group: 'cta',
      fields: [
        defineField({ name: 'label', title: 'Label', type: 'internationalizedArrayString' }),
        defineField({ name: 'href', title: 'URL', type: 'string' }),
      ],
    }),
    defineField({
      name: 'bottomCtaSecondary',
      title: 'Bottom CTA — secondary',
      type: 'object',
      group: 'cta',
      fields: [
        defineField({ name: 'label', title: 'Label', type: 'internationalizedArrayString' }),
        defineField({ name: 'href', title: 'URL', type: 'string' }),
      ],
    }),

    // ── Meta ──────────────────────────────────────
    defineField({
      name: 'seo',
      title: 'SEO',
      type: 'seo',
      group: 'meta',
    }),
    defineField({
      name: 'lastUpdated',
      title: 'Last updated',
      type: 'date',
      group: 'meta',
    }),
  ],
  preview: {
    select: { title: 'title', kind: 'kind', lastUpdated: 'lastUpdated' },
    prepare({ title, kind, lastUpdated }) {
      return {
        title: title || 'Untitled editorial page',
        subtitle: [kind, lastUpdated].filter(Boolean).join(' · '),
      };
    },
  },
});
