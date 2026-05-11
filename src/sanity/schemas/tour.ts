import { defineField, defineType } from 'sanity';
import { CalendarIcon, EarthGlobeIcon } from '@sanity/icons';

import {
  MIGRATION_GROUP,
  localizedPortableTextField,
  localizedSlugField,
  migrationField,
} from './_helpers';

export const tourSchema = defineType({
  name: 'tour',
  title: 'Tour',
  type: 'document',
  icon: EarthGlobeIcon,
  description:
    'Day tours and multi-day packages. Both share this schema. The "Type" field discriminates between them and reveals fields appropriate to each.',
  groups: [
    { name: 'classification', title: 'Type & classification', default: true },
    { name: 'content', title: 'Content' },
    { name: 'itinerary', title: 'Itinerary & details' },
    { name: 'pricing', title: 'Pricing' },
    { name: 'related', title: 'Related content' },
    { name: 'media', title: 'Media' },
    { name: 'meta', title: 'Meta' },
    MIGRATION_GROUP,
  ],
  fields: [
    // ── Classification ────────────────────────────
    defineField({
      name: 'type',
      title: 'Type',
      type: 'string',
      group: 'classification',
      options: {
        list: [
          { title: 'Day tour', value: 'dayTour' },
          { title: 'Package (multi-day)', value: 'package' },
        ],
        layout: 'radio',
      },
      initialValue: 'dayTour',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'dayTourMode',
      title: 'Day tour mode',
      description:
        'Only applies to day tours. Private = exclusive for the booking party. Group = shared with other travelers.',
      type: 'string',
      group: 'classification',
      options: {
        list: [
          { title: 'Private', value: 'private' },
          { title: 'Group', value: 'group' },
        ],
        layout: 'radio',
      },
      hidden: ({ document }) => document?.type !== 'dayTour',
      validation: (Rule) =>
        Rule.custom((value, context) => {
          if (
            context.document?.type === 'dayTour' &&
            !value
          ) {
            return 'Day tours require a mode (private or group)';
          }
          return true;
        }),
    }),
    defineField({
      name: 'theme',
      title: 'Package theme',
      description: 'Required for packages. Optional for day tours.',
      type: 'reference',
      to: [{ type: 'theme' }],
      group: 'classification',
      hidden: ({ document }) => document?.type !== 'package',
      validation: (Rule) =>
        Rule.custom((value, context) => {
          if (context.document?.type === 'package' && !value) {
            return 'Packages require a theme';
          }
          return true;
        }),
    }),
    defineField({
      name: 'cities',
      title: 'Cities',
      description:
        'Cities visited or operated from. Day tours typically have one; packages have many.',
      type: 'array',
      group: 'classification',
      of: [{ type: 'reference', to: [{ type: 'city' }] }],
      validation: (Rule) => Rule.required().min(1),
    }),
    defineField({
      name: 'durationDays',
      title: 'Duration (days)',
      description: 'For day tours: 1. For packages: total days.',
      type: 'number',
      group: 'classification',
      validation: (Rule) => Rule.required().min(1).max(60),
    }),
    defineField({
      name: 'durationLabel',
      title: 'Duration label',
      description:
        'Human-readable duration shown on cards and headers. E.g. "Full day, ~9 hours" or "8 days / 7 nights".',
      type: 'internationalizedArrayString',
      group: 'classification',
    }),

    // ── Content ────────────────────────────
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
    } as any),
    defineField({
      name: 'summary',
      title: 'Summary',
      description: 'One or two sentences. Shown on cards and search results.',
      type: 'internationalizedArrayText',
      group: 'content',
      validation: (Rule) => Rule.required(),
    }),
    defineField(
      localizedPortableTextField('body', {
        title: 'Body',
        description: 'Editorial description of the tour. Operator-quality detail.',
        group: 'content',
      }) as any
    ),

    // ── Itinerary & details ────────────────────────────
    defineField({
      name: 'days',
      title: 'Itinerary days',
      description:
        'Day-by-day tour itinerary. Mapper populates dayNumber, title, cities, morning, lunch, and afternoon; operator enriches the remaining fields during editorial pass.',
      type: 'array',
      group: 'itinerary',
      hidden: ({ document }) => (document as { dayTourMode?: string })?.dayTourMode === 'private',
      of: [
        {
          type: 'object',
          name: 'tourDay',
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
              description: 'e.g. "Arrival in Cairo" or "Felucca to Aswan"',
              type: 'internationalizedArrayString',
            }),
            defineField({
              name: 'cities',
              title: 'Cities visited this day',
              type: 'array',
              of: [{ type: 'reference', to: [{ type: 'city' }] }],
            }),
            defineField(
              localizedPortableTextField('morning', {
                title: 'Morning',
                description: 'Morning activity narrative. Migrated from WP source where applicable; operator may enrich.',
              }) as any
            ),
            defineField({
              name: 'lunch',
              title: 'Lunch',
              description: 'Lunch context — typically a restaurant name or short description.',
              type: 'internationalizedArrayString',
            }),
            defineField(
              localizedPortableTextField('afternoon', {
                title: 'Afternoon',
                description: 'Afternoon activity narrative.',
              }) as any
            ),
            defineField({
              name: 'meals',
              title: 'Meals included',
              description: 'e.g. "Breakfast, Dinner". Operator-authored.',
              type: 'internationalizedArrayString',
            }),
            defineField({
              name: 'accommodation',
              title: 'Accommodation',
              description: 'Hotel or cruise name for the night. Operator-authored.',
              type: 'internationalizedArrayString',
            }),
            defineField({
              name: 'highlights',
              title: 'Day highlights',
              description: 'Short list of what makes this day distinctive. Operator-authored.',
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
            defineField({
              name: 'transport',
              title: 'Transport',
              description: 'e.g. "Flight to Aswan; private car to hotel". Operator-authored.',
              type: 'internationalizedArrayString',
            }),
            defineField({
              name: 'suggestedActivities',
              title: 'Suggested activities',
              description: 'Optional add-ons or recommendations for free time. Operator-authored.',
              type: 'array',
              of: [
                {
                  type: 'object',
                  fields: [
                    defineField({
                      name: 'value',
                      title: 'Suggested activities (per locale)',
                      type: 'array',
                      of: [{ type: 'string' }],
                    }),
                  ],
                  preview: {
                    select: { key: '_key', count: 'value' },
                    prepare({ key, count }: any) {
                      return {
                        title: `Suggested activities — ${key?.toUpperCase()}`,
                        subtitle: `${count?.length || 0} items`,
                      };
                    },
                  },
                },
              ],
            }),
            defineField({
              name: 'paceRating',
              title: 'Pace rating',
              description: '1 (relaxed) to 5 (intense). Operator-authored.',
              type: 'number',
              validation: (Rule) => Rule.min(1).max(5).integer(),
            }),
            defineField({
              name: 'photoSpots',
              title: 'Photo spots',
              description: 'Notable photo opportunities for the day. Operator-authored.',
              type: 'array',
              of: [
                {
                  type: 'object',
                  fields: [
                    defineField({
                      name: 'value',
                      title: 'Photo spots (per locale)',
                      type: 'array',
                      of: [{ type: 'string' }],
                    }),
                  ],
                  preview: {
                    select: { key: '_key', count: 'value' },
                    prepare({ key, count }: any) {
                      return {
                        title: `Photo spots — ${key?.toUpperCase()}`,
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
      name: 'highlights',
      title: 'Highlights',
      description: 'Bullet experience moments — what the visitor will actually do.',
      type: 'array',
      group: 'itinerary',
      of: [
        {
          type: 'object',
          fields: [
            defineField({
              name: 'value',
              title: 'Highlights (per locale)',
              type: 'array',
              of: [{ type: 'string' }],
            }),
          ],
          preview: {
            select: { key: '_key', count: 'value' },
            prepare({ key, count }: any) {
              return {
                title: `Highlights — ${key?.toUpperCase()}`,
                subtitle: `${count?.length || 0} items`,
              };
            },
          },
        },
      ],
    }),
    defineField(
      localizedPortableTextField('inclusions', {
        title: 'Inclusions',
        description: "What's included in the tour.",
        group: 'itinerary',
      }) as any
    ),
    defineField(
      localizedPortableTextField('exclusions', {
        title: 'Exclusions',
        description: "What's not included.",
        group: 'itinerary',
      }) as any
    ),
    defineField(
      localizedPortableTextField('itinerary', {
        title: 'Legacy itinerary (deprecated)',
        description:
          'Deprecated freeform itinerary PT. Superseded by Itinerary days above. Kept temporarily so production tours keep rendering during the frontend transition; do not edit on new tours.',
        group: 'itinerary',
      }) as any
    ),

    // ── Pricing (consultation-only — indicative direction only) ────────────────────
    defineField({
      name: 'priceIndication',
      title: 'Indicative pricing',
      description:
        'Optional. Rough pricing direction shown on the tour page. Format like: "from €75 per person, depending on group size and inclusions". This is not a transactional price — final pricing comes from the concierge conversation.',
      type: 'internationalizedArrayString',
      group: 'pricing',
    }),

    // ── Related ────────────────────────────
    defineField({
      name: 'relatedTours',
      title: 'Related tours',
      type: 'array',
      group: 'related',
      of: [{ type: 'reference', to: [{ type: 'tour' }] }],
    }),
    defineField({
      name: 'relatedGuides',
      title: 'Related guide content',
      type: 'array',
      group: 'related',
      of: [
        { type: 'reference', name: 'cityRef', to: [{ type: 'city' }] },
        { type: 'reference', name: 'guideArticleRef', to: [{ type: 'guideArticle' }] },
      ],
    }),
    defineField({
      name: 'relatedTravelerStories',
      title: 'Traveler stories',
      description: 'Reviews from travelers who took this tour.',
      type: 'array',
      group: 'related',
      of: [{ type: 'reference', to: [{ type: 'travelerStory' }] }],
    }),

    // ── Media ────────────────────────────
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

    // ── Meta ────────────────────────────
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
      type: 'type',
      mode: 'dayTourMode',
      duration: 'durationDays',
      media: 'heroImage',
    },
    prepare({ title, type, mode, duration, media }) {
      const en = Array.isArray(title)
        ? title.find((t: any) => t._key === 'en')?.value
        : title;
      const typeLabel =
        type === 'package'
          ? `Package · ${duration}d`
          : `Day tour${mode ? ` (${mode})` : ''}`;
      return {
        title: en || 'Untitled tour',
        subtitle: typeLabel,
        media,
      };
    },
  },
});
