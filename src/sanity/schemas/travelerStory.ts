import { defineField, defineType } from 'sanity';
import { CommentIcon } from '@sanity/icons';

import { localizedPortableTextField } from './_helpers';

export const travelerStorySchema = defineType({
  name: 'travelerStory',
  title: 'Traveler story',
  type: 'document',
  icon: CommentIcon,
  description:
    'A traveler review with context — UK couple, scholarly traveler, multi-generational family, etc. Used on tour pages, destination pages, and the homepage trust strip. The audience segments enable contextual matching (first-time travelers see first-time stories, etc.).',
  fields: [
    defineField({
      name: 'travelerName',
      title: 'Traveler name',
      description: 'As it should appear on the site. Real name, not localized.',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'travelerContext',
      title: 'Traveler context',
      description:
        'Short descriptor: "UK couple, mid-50s, scholarly interest" / "Multi-generational family of 6 from California" / "Solo Japanese photographer".',
      type: 'internationalizedArrayString',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'headline',
      title: 'Headline / pull quote',
      description: 'Short. The line surfaced on cards.',
      type: 'internationalizedArrayString',
    }),
    defineField(
      localizedPortableTextField('body', {
        title: 'Story body',
        description: 'The full story / review.',
      }) as any
    ),
    defineField({
      name: 'tripCompletedDate',
      title: 'Trip completed',
      type: 'date',
    }),
    defineField({
      name: 'audienceSegment',
      title: 'Audience segments',
      description:
        'Tags used to match this story to relevant pages. A "first-time" story appears next to first-time-relevant content; a "scholarly" story next to deep-history content.',
      type: 'array',
      of: [{ type: 'string' }],
      options: {
        list: [
          { title: 'First-time visitor', value: 'first-time' },
          { title: 'Returning traveler', value: 'returning' },
          { title: 'Family with children', value: 'family' },
          { title: 'Multi-generational', value: 'multigen' },
          { title: 'Solo', value: 'solo' },
          { title: 'Couple', value: 'couple' },
          { title: 'Scholarly / history-deep', value: 'scholarly' },
          { title: 'Photographer', value: 'photographer' },
          { title: 'Adventurer', value: 'adventurer' },
          { title: 'Luxury tier', value: 'luxury' },
          { title: 'Budget tier', value: 'budget' },
          { title: 'Religious / pilgrimage', value: 'religious' },
        ],
      },
    }),
    defineField({
      name: 'relatedTour',
      title: 'Related tour',
      description: 'The trip they took, if applicable.',
      type: 'reference',
      to: [{ type: 'tour' }],
    }),
    defineField({
      name: 'relatedCities',
      title: 'Cities visited',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'city' }] }],
    }),
    defineField({
      name: 'photo',
      title: 'Traveler photo',
      description: 'Optional. Used in cards and hero placements.',
      type: 'image',
      options: { hotspot: true },
    }),
    defineField({
      name: 'sourcePlatform',
      title: 'Source platform',
      type: 'string',
      options: {
        list: [
          { title: 'Direct', value: 'direct' },
          { title: 'TripAdvisor', value: 'tripadvisor' },
          { title: 'Google', value: 'google' },
          { title: 'WhatsApp follow-up', value: 'whatsapp' },
          { title: 'Email', value: 'email' },
        ],
      },
    }),
    defineField({
      name: 'featured',
      title: 'Featured',
      description: 'Show prominently on homepage and high-traffic pages.',
      type: 'boolean',
      initialValue: false,
    }),
  ],
  preview: {
    select: {
      title: 'travelerName',
      context: 'travelerContext',
      media: 'photo',
    },
    prepare({ title, context, media }) {
      const en = Array.isArray(context)
        ? context.find((c: any) => c._key === 'en')?.value
        : context;
      return { title, subtitle: en, media };
    },
  },
});
