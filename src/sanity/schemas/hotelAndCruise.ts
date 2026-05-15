import { defineField, defineType } from 'sanity';
import { HomeIcon } from '@sanity/icons';

import {
  MIGRATION_GROUP,
  localizedPortableTextField,
  localizedSlugField,
  migrationField,
} from './_helpers';

const HOTEL_CATEGORIES = [
  { title: 'Standard', value: 'standard' },
  { title: 'Deluxe', value: 'deluxe' },
  { title: 'Luxury', value: 'luxury' },
  { title: 'Boutique', value: 'boutique' },
];

export const hotelSchema = defineType({
  name: 'hotel',
  title: 'Hotel',
  type: 'document',
  icon: HomeIcon,
  description: 'Specific hotels we recommend or work with. City-based with category. URL: /hotels/[slug]',
  groups: [
    { name: 'identity', title: 'Identity', default: true },
    { name: 'content', title: 'Content' },
    { name: 'media', title: 'Media' },
    { name: 'meta', title: 'Meta' },
    MIGRATION_GROUP,
  ],
  fields: [
    defineField({
      name: 'name',
      title: 'Hotel name',
      description:
        'Per-locale name. EN is the brand/canonical form; ES and JA may diverge (translation, transliteration, or SEO-tuned variants). EN is required; other locales fall back to EN if blank.',
      type: 'internationalizedArrayString',
      group: 'identity',
      validation: (Rule) =>
        Rule.required().custom((value: any) => {
          if (!Array.isArray(value)) return 'Name is required';
          const en = value.find((v: any) => v._key === 'en');
          if (!en?.value) return 'English name is required';
          return true;
        }),
    }),
    defineField({
      ...localizedSlugField({ source: 'name' }),
      group: 'identity',
    } as any),
    defineField({
      name: 'city',
      title: 'City',
      type: 'reference',
      to: [{ type: 'city' }],
      group: 'identity',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'category',
      title: 'Category',
      type: 'string',
      group: 'identity',
      options: { list: HOTEL_CATEGORIES, layout: 'dropdown' },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'starRating',
      title: 'Star rating',
      type: 'number',
      group: 'identity',
      validation: (Rule) => Rule.min(1).max(5),
    }),
    defineField({
      name: 'summary',
      title: 'Summary',
      type: 'internationalizedArrayText',
      group: 'content',
      validation: (Rule) => Rule.required(),
    }),
    defineField(
      localizedPortableTextField('body', {
        title: 'Description',
        group: 'content',
      }) as any
    ),
    defineField(
      localizedPortableTextField('operatorNotes', {
        title: 'Operator notes',
        description:
          "Honest take — what we tell clients about staying here. Use the operator-note callouts liberally.",
        group: 'content',
      }) as any
    ),
    defineField({
      name: 'relatedTours',
      title: 'Related tours',
      description: 'Tours where we typically recommend this hotel.',
      type: 'array',
      group: 'content',
      of: [{ type: 'reference', to: [{ type: 'tour' }] }],
    }),
    defineField({
      name: 'heroImage',
      title: 'Hero image',
      type: 'localizedImage',
      group: 'media',
    }),
    defineField({
      name: 'gallery',
      title: 'Gallery',
      type: 'array',
      group: 'media',
      of: [{ type: 'localizedImage' }],
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
      title: 'name',
      city: 'city.name',
      category: 'category',
      stars: 'starRating',
      media: 'heroImage',
    },
    prepare({ title, city, category, stars, media }) {
      const titleEn = Array.isArray(title)
        ? title.find((t: any) => t._key === 'en')?.value
        : title;
      const cityEn = Array.isArray(city)
        ? city.find((c: any) => c._key === 'en')?.value
        : city;
      const stars_ = stars ? '★'.repeat(stars) : '';
      return {
        title: titleEn || 'Untitled hotel',
        subtitle: [cityEn, category, stars_].filter(Boolean).join(' · '),
        media,
      };
    },
  },
});

export const nileCruiseSchema = defineType({
  name: 'nileCruise',
  title: 'Nile cruise',
  type: 'document',
  icon: HomeIcon,
  description: 'Cruise ships and dahabiyas operating on the Nile. URL: /nile-cruises/[slug]',
  groups: [
    { name: 'identity', title: 'Identity', default: true },
    { name: 'content', title: 'Content' },
    { name: 'media', title: 'Media' },
    { name: 'meta', title: 'Meta' },
    MIGRATION_GROUP,
  ],
  fields: [
    defineField({
      name: 'name',
      title: 'Vessel name',
      description:
        'Per-locale name. EN is the brand/canonical form; ES and JA may diverge (translation, transliteration, or SEO-tuned variants). EN is required; other locales fall back to EN if blank.',
      type: 'internationalizedArrayString',
      group: 'identity',
      validation: (Rule) =>
        Rule.required().custom((value: any) => {
          if (!Array.isArray(value)) return 'Name is required';
          const en = value.find((v: any) => v._key === 'en');
          if (!en?.value) return 'English name is required';
          return true;
        }),
    }),
    defineField({
      ...localizedSlugField({ source: 'name' }),
      group: 'identity',
    } as any),
    defineField({
      name: 'type',
      title: 'Type',
      type: 'string',
      group: 'identity',
      options: {
        list: [
          { title: 'Cruise ship', value: 'cruise-ship' },
          { title: 'Dahabiya', value: 'dahabiya' },
          { title: 'Felucca', value: 'felucca' },
        ],
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'tier',
      title: 'Tier',
      type: 'string',
      group: 'identity',
      options: {
        list: [
          { title: 'Standard', value: 'standard' },
          { title: 'Deluxe', value: 'deluxe' },
          { title: 'Luxury', value: 'luxury' },
          { title: 'Boutique', value: 'boutique' },
        ],
      },
    }),
    defineField({
      name: 'capacity',
      title: 'Capacity (cabins)',
      type: 'number',
      group: 'identity',
    }),
    defineField({
      name: 'summary',
      title: 'Summary',
      type: 'internationalizedArrayText',
      group: 'content',
      validation: (Rule) => Rule.required(),
    }),
    defineField(
      localizedPortableTextField('body', {
        title: 'Description',
        group: 'content',
      }) as any
    ),
    defineField(
      localizedPortableTextField('operatorNotes', {
        title: 'Operator notes',
        description: 'Honest take on this vessel.',
        group: 'content',
      }) as any
    ),
    defineField({
      name: 'relatedTours',
      title: 'Packages featuring this vessel',
      type: 'array',
      group: 'content',
      of: [{ type: 'reference', to: [{ type: 'tour' }] }],
    }),
    defineField({
      name: 'heroImage',
      title: 'Hero image',
      type: 'localizedImage',
      group: 'media',
    }),
    defineField({
      name: 'gallery',
      title: 'Gallery',
      type: 'array',
      group: 'media',
      of: [{ type: 'localizedImage' }],
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
      title: 'name',
      type: 'type',
      tier: 'tier',
      capacity: 'capacity',
      media: 'heroImage',
    },
    prepare({ title, type, tier, capacity, media }) {
      const titleEn = Array.isArray(title)
        ? title.find((t: any) => t._key === 'en')?.value
        : title;
      return {
        title: titleEn || 'Untitled vessel',
        subtitle: [type, tier, capacity ? `${capacity} cabins` : null]
          .filter(Boolean)
          .join(' · '),
        media,
      };
    },
  },
});
