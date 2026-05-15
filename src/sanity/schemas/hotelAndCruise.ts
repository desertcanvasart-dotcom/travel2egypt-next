import { defineField, defineType } from 'sanity';
import { HomeIcon, CalendarIcon } from '@sanity/icons';

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
    { name: 'route', title: 'Route & schedule' },
    { name: 'itinerary', title: 'Itinerary' },
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
      name: 'poweredBy',
      title: 'Powered by',
      description:
        'Propulsion methods. Multi-select for hybrid vessels (e.g., a dahabiya with sail and auxiliary motor).',
      type: 'array',
      group: 'identity',
      of: [
        {
          type: 'string',
          options: {
            list: [
              { title: 'Engine', value: 'engine' },
              { title: 'Wind (sail)', value: 'wind' },
              { title: 'Steam', value: 'steam' },
            ],
          },
        },
      ],
      options: { layout: 'tags' },
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

    // ── Route & schedule ────────────────────────────
    defineField({
      name: 'departureCity',
      title: 'Departure city',
      description: 'Where the cruise originates.',
      type: 'reference',
      to: [{ type: 'city' }],
      group: 'route',
    }),
    defineField({
      name: 'returnCity',
      title: 'Return city',
      description:
        'Where the cruise ends. Often the same as the departure city for round-trip itineraries.',
      type: 'reference',
      to: [{ type: 'city' }],
      group: 'route',
    }),
    defineField({
      name: 'durationNights',
      title: 'Duration (nights)',
      type: 'number',
      group: 'route',
      validation: (Rule) => Rule.positive().integer(),
    }),
    defineField({
      name: 'departureWeekdays',
      title: 'Departure weekdays',
      description: 'Fixed weekdays the cruise departs (for weekly recurring schedules).',
      type: 'array',
      group: 'route',
      of: [
        {
          type: 'string',
          options: {
            list: [
              { title: 'Monday', value: 'mon' },
              { title: 'Tuesday', value: 'tue' },
              { title: 'Wednesday', value: 'wed' },
              { title: 'Thursday', value: 'thu' },
              { title: 'Friday', value: 'fri' },
              { title: 'Saturday', value: 'sat' },
              { title: 'Sunday', value: 'sun' },
            ],
          },
        },
      ],
      options: { layout: 'tags' },
    }),
    defineField({
      name: 'specificDepartureDates',
      title: 'Specific departure dates',
      description:
        'For variable or seasonal schedules. Use in addition to or instead of weekly weekdays.',
      type: 'array',
      group: 'route',
      of: [{ type: 'date' }],
    }),

    // ── Itinerary ────────────────────────────
    defineField({
      name: 'itinerary',
      title: 'Itinerary',
      description: 'Day-by-day breakdown of the cruise journey.',
      type: 'array',
      group: 'itinerary',
      of: [
        {
          type: 'object',
          name: 'cruiseDay',
          title: 'Day',
          fields: [
            defineField({
              name: 'dayNumber',
              title: 'Day number',
              type: 'number',
              validation: (Rule) => Rule.required().min(1).integer(),
            }),
            defineField({
              name: 'title',
              title: 'Day title',
              description: 'e.g. "Embark in Luxor — Sail to Esna"',
              type: 'internationalizedArrayString',
            }),
            defineField({
              name: 'cities',
              title: 'Ports / cities visited this day',
              type: 'array',
              of: [{ type: 'reference', to: [{ type: 'city' }] }],
            }),
            defineField(
              localizedPortableTextField('morning', {
                title: 'Morning',
                description: 'Morning sailing/excursion narrative.',
              }) as any
            ),
            defineField({
              name: 'lunch',
              title: 'Lunch',
              description: 'Onboard or shore lunch context.',
              type: 'internationalizedArrayString',
            }),
            defineField(
              localizedPortableTextField('afternoon', {
                title: 'Afternoon',
                description: 'Afternoon sailing/excursion narrative.',
              }) as any
            ),
            defineField({
              name: 'meals',
              title: 'Meals included',
              description: 'e.g. "Breakfast, Lunch, Dinner".',
              type: 'internationalizedArrayString',
            }),
            defineField({
              name: 'overnight',
              title: 'Overnight',
              description: 'Where the vessel is moored or sailing for the night.',
              type: 'internationalizedArrayString',
            }),
            defineField({
              name: 'highlights',
              title: 'Day highlights',
              type: 'array',
              of: [
                {
                  type: 'object',
                  fields: [
                    defineField({
                      name: 'value',
                      title: 'Day highlights (per locale)',
                      type: 'array',
                      of: [{ type: 'string' }],
                    }),
                  ],
                  preview: {
                    select: { key: '_key', count: 'value' },
                    prepare({ key, count }: any) {
                      return {
                        title: `Day highlights — ${key?.toUpperCase()}`,
                        subtitle: `${count?.length || 0} items`,
                      };
                    },
                  },
                },
              ],
            }),
          ],
          preview: {
            select: {
              dayNumber: 'dayNumber',
              title: 'title',
            },
            prepare(selection: { dayNumber?: number; title?: Array<{ _key: string; value?: string }> }) {
              const { dayNumber, title } = selection;
              const en = Array.isArray(title) ? title.find((t) => t._key === 'en')?.value : undefined;
              return {
                title: `Day ${dayNumber ?? '?'}${en ? ` — ${en}` : ''}`,
                media: CalendarIcon,
              };
            },
          },
        },
      ],
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
