import { defineField, defineType } from 'sanity';
import { FolderIcon } from '@sanity/icons';

import {
  MIGRATION_GROUP,
  localizedPortableTextField,
  localizedSlugField,
  migrationField,
} from './_helpers';

/**
 * Top-level tour-category hub. One doc per (type × tourMode) cell, four total:
 *
 *   private-day-tour    → /private-day-tours/
 *   group-day-tour      → /group-day-tours/                  (URL preserved; UI label says "Small Group")
 *   private-package     → /egypt-travel-packages/
 *   group-package       → /small-group-travel-packages/
 *
 * The EN slug for each must match the legacy WP URL (it's locked there to
 * preserve SEO). The `key` field is the internal discriminator used by
 * routing and by `tourLanding` to filter its sub-grouping axis.
 */
export const tourCategorySchema = defineType({
  name: 'tourCategory',
  title: 'Tour category hub',
  type: 'document',
  icon: FolderIcon,
  description:
    'The four top-level tour hubs: Private Day Tours, Small Group Day Tours, Egypt Travel Packages, Small Group Travel Packages. URL slugs are locked to legacy WP slugs to preserve search equity.',
  groups: [
    { name: 'classification', title: 'Classification', default: true },
    { name: 'content', title: 'Content' },
    { name: 'media', title: 'Media' },
    { name: 'meta', title: 'Meta' },
    MIGRATION_GROUP,
  ],
  fields: [
    defineField({
      name: 'key',
      title: 'Category key',
      description:
        'Internal discriminator. Determines which (type × tourMode) tours roll up here, and which sub-grouping axis the page uses.',
      type: 'string',
      group: 'classification',
      options: {
        list: [
          { title: 'Private Day Tours', value: 'private-day-tour' },
          { title: 'Small Group Day Tours', value: 'group-day-tour' },
          { title: 'Private Multi-day Packages', value: 'private-package' },
          { title: 'Small Group Multi-day Packages', value: 'group-package' },
        ],
        layout: 'radio',
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'subAxis',
      title: 'Sub-grouping axis',
      description:
        'How tours in this category are grouped on the landing page. day tours → destination city; private packages → theme; group packages → traveler origin region.',
      type: 'string',
      group: 'classification',
      options: {
        list: [
          { title: 'Destination city', value: 'destination-city' },
          { title: 'Package theme', value: 'theme' },
          { title: 'Traveler origin region', value: 'origin-region' },
        ],
        layout: 'radio',
      },
      validation: (Rule) => Rule.required(),
    }),
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
        'URL slug. EN must match the legacy WP URL — do not change without a redirect plan.',
    } as any),
    defineField({
      name: 'summary',
      title: 'Summary',
      description: 'One sentence shown on hub cards and meta description fallback.',
      type: 'internationalizedArrayText',
      group: 'content',
    }),
    defineField(
      localizedPortableTextField('intro', {
        title: 'Intro',
        description: 'Editorial body shown above the listing on the hub page.',
        group: 'content',
      }) as any,
    ),
    defineField(
      localizedPortableTextField('faq', {
        title: 'FAQ',
        description: 'Optional FAQ section shown below the listing.',
        group: 'content',
      }) as any,
    ),
    defineField({
      name: 'heroImage',
      title: 'Hero image',
      type: 'localizedImage',
      group: 'media',
    }),
    defineField({
      name: 'seo',
      title: 'SEO',
      type: 'seo',
      group: 'meta',
    }),
    migrationField(),
  ],
  preview: {
    select: {
      title: 'title',
      key: 'key',
      slug: 'slug',
      media: 'heroImage',
    },
    prepare({ title, key, slug, media }) {
      const en = Array.isArray(title)
        ? title.find((t: any) => t._key === 'en')?.value
        : title;
      const enSlug = Array.isArray(slug)
        ? slug.find((s: any) => s._key === 'en')?.value?.current
        : undefined;
      return {
        title: en || `Tour category — ${key ?? '?'}`,
        subtitle: enSlug ? `${key}  ·  /${enSlug}` : key,
        media,
      };
    },
  },
});
