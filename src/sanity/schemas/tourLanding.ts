import { defineField, defineType } from 'sanity';
import { FolderIcon } from '@sanity/icons';

import {
  MIGRATION_GROUP,
  localizedPortableTextField,
  localizedSlugField,
  migrationField,
} from './_helpers';
import { ARCHIVE_ESSAY_EXTRA_BLOCKS } from './_archiveBlocks';

/**
 * Tour sub-category landing page. Sits one level under tourCategory and
 * lists the tours that share its (category × sub-axis) value. 28 total:
 *
 *   private-day-tour × destination-city  ×  9 cities  =  9 pages
 *   group-day-tour   × destination-city  ×  6 cities  =  6 pages
 *   private-package  × theme             × 10 themes  = 10 pages
 *   group-package    × origin-region     ×  3 regions =  3 pages
 *
 * EN slugs are locked to legacy WP URLs where one exists. The discriminator
 * fields (`destinationCity`, `themeRef`, `originRegion`) are mutually
 * exclusive — exactly one must be set, matching the parent category's
 * subAxis. Validation enforces this.
 */
export const tourLandingSchema = defineType({
  name: 'tourLanding',
  title: 'Tour landing (sub-category)',
  type: 'document',
  icon: FolderIcon,
  description:
    'Sub-category landing pages (e.g. "Cairo Private Day Tours", "Egypt Luxury Holidays", "Egypt Group Tours from Japan"). Each is filtered by city, theme, or origin region depending on its parent category.',
  groups: [
    { name: 'classification', title: 'Classification', default: true },
    { name: 'content', title: 'Content' },
    { name: 'related', title: 'Related tours' },
    { name: 'media', title: 'Media' },
    { name: 'meta', title: 'Meta' },
    MIGRATION_GROUP,
  ],
  fields: [
    defineField({
      name: 'category',
      title: 'Parent category',
      description: 'Which top-level tour-category hub this landing rolls up to.',
      type: 'reference',
      to: [{ type: 'tourCategory' }],
      group: 'classification',
      validation: (Rule) => Rule.required(),
    }),

    // ── Discriminator: exactly ONE of these is set ───────────────
    defineField({
      name: 'destinationCity',
      title: 'Destination city',
      description: 'Set when the parent category groups by destination (day tours).',
      type: 'reference',
      to: [{ type: 'city' }],
      group: 'classification',
    }),
    defineField({
      name: 'themeRef',
      title: 'Theme',
      description: 'Set when the parent category groups by theme (private packages).',
      type: 'reference',
      to: [{ type: 'theme' }],
      group: 'classification',
    }),
    defineField({
      name: 'originRegion',
      title: 'Traveler origin region',
      description: 'Set when the parent category groups by origin (group packages).',
      type: 'string',
      group: 'classification',
      options: {
        list: [
          { title: 'Japan & East Asia', value: 'japan-east-asia' },
          { title: 'USA & Canada', value: 'usa-canada' },
          { title: 'UK & Europe', value: 'uk-europe' },
        ],
        layout: 'radio',
      },
    }),

    // ── Content ───────────────────────────────────────────────────
    defineField({
      name: 'title',
      title: 'Title',
      type: 'internationalizedArrayString',
      group: 'content',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      ...localizedSlugField(),
      group: 'content',
      description:
        'URL slug. EN locked to legacy WP slug where one exists (preserves SEO).',
    } as any),
    defineField({
      name: 'summary',
      title: 'Summary',
      description: 'One sentence shown on cards and meta description fallback.',
      type: 'internationalizedArrayText',
      group: 'content',
    }),
    defineField(
      localizedPortableTextField('intro', {
        title: 'Intro',
        description:
          'Editorial body shown above the tour listing. Supports a concierge note and a definition list.',
        group: 'content',
        extraBlocks: ARCHIVE_ESSAY_EXTRA_BLOCKS,
      }) as any,
    ),
    defineField({
      name: 'ctaContext',
      title: 'Concierge CTA context (optional)',
      description:
        'Overrides the concierge CTA button label on this landing. Falls back to a city-derived label (e.g. "Talk to our concierge about Sharm El-Sheikh").',
      type: 'internationalizedArrayString',
      group: 'content',
    }),
    defineField(
      localizedPortableTextField('faq', {
        title: 'FAQ',
        description: 'Optional FAQ section shown below the listing.',
        group: 'content',
      }) as any,
    ),

    // ── Related ──────────────────────────────────────────────────
    defineField({
      name: 'relatedTours',
      title: 'Featured tours (manual order)',
      description:
        'Optional. When set, overrides the default auto-filtered list — tours appear in this order. Leave empty to auto-list all matching tours alphabetically.',
      type: 'array',
      group: 'related',
      of: [{ type: 'reference', to: [{ type: 'tour' }] }],
    }),

    // ── Media ────────────────────────────────────────────────────
    defineField({
      name: 'heroImage',
      title: 'Hero image',
      type: 'localizedImage',
      group: 'media',
    }),

    // ── Meta ─────────────────────────────────────────────────────
    defineField({
      name: 'seo',
      title: 'SEO',
      type: 'seo',
      group: 'meta',
    }),
    migrationField(),
  ],

  /**
   * Cross-field validation: enforce that exactly one discriminator
   * field is set, and it matches the parent category's subAxis.
   * Without this rule, an editor could create incoherent docs.
   */
  validation: (Rule) =>
    Rule.custom((doc: any) => {
      if (!doc) return true;
      const setCount =
        (doc.destinationCity ? 1 : 0) +
        (doc.themeRef ? 1 : 0) +
        (doc.originRegion ? 1 : 0);
      if (setCount === 0) {
        return 'Set exactly one of: destination city, theme, or origin region.';
      }
      if (setCount > 1) {
        return 'Set exactly one discriminator — the others must remain empty.';
      }
      return true;
    }),

  preview: {
    select: {
      title: 'title',
      slug: 'slug',
      city: 'destinationCity.name',
      theme: 'themeRef.name',
      region: 'originRegion',
      media: 'heroImage',
    },
    prepare({ title, slug, city, theme, region, media }) {
      const en = Array.isArray(title)
        ? title.find((t: any) => t._key === 'en')?.value
        : title;
      const enSlug = Array.isArray(slug)
        ? slug.find((s: any) => s._key === 'en')?.value?.current
        : undefined;
      const cityEn = Array.isArray(city)
        ? city.find((t: any) => t._key === 'en')?.value
        : city;
      const themeEn = Array.isArray(theme)
        ? theme.find((t: any) => t._key === 'en')?.value
        : theme;
      const axis = cityEn ?? themeEn ?? region ?? '?';
      const subtitle = enSlug ? `${axis}  ·  /${enSlug}` : axis;
      return {
        title: en || 'Untitled landing',
        subtitle,
        media,
      };
    },
  },
});
