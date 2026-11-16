import { defineField, defineType } from 'sanity';

/**
 * Review-gated product facts (product page template, 2026-11-09).
 * Extracted from each product's own text — never invented — with the exact
 * source sentence kept for the owner's review. The site shows an item only
 * once `needsReview` is false.
 */
const LANGS = [
  { title: 'English', value: 'en' },
  { title: 'Spanish', value: 'es' },
  { title: 'Japanese', value: 'ja' },
];

export const productFactSchema = defineType({
  name: 'productFact',
  title: 'Item',
  type: 'object',
  fields: [
    defineField({ name: 'lang', title: 'Language', type: 'string', options: { list: LANGS, layout: 'radio', direction: 'horizontal' }, validation: (R) => R.required() }),
    defineField({ name: 'text', title: 'Item', type: 'string', validation: (R) => R.required() }),
    defineField({ name: 'source', title: 'Source sentence (exact quote from the page)', type: 'text', rows: 2 }),
    defineField({
      name: 'seeSection',
      title: 'Points to a page section (Not included only, e.g. Abu Simbel → Make it yours)',
      description: 'Day links ("see Day 2") come from the days\' "Optional on this day" items; use this only for an extra that has no day.',
      type: 'string',
      options: { list: [{ title: 'Make it yours', value: 'make-it-yours' }] },
    }),
    defineField({ name: 'needsReview', title: 'Needs review (hidden on the site while on)', type: 'boolean', initialValue: true }),
  ],
  preview: {
    select: { text: 'text', lang: 'lang', review: 'needsReview' },
    prepare: ({ text, lang, review }) => ({ title: text, subtitle: `${lang ?? '?'}${review === false ? '' : ' · needs review'}` }),
  },
});

export const itineraryDaySchema = defineType({
  name: 'itineraryDay',
  title: 'Day',
  type: 'object',
  fields: [
    defineField({ name: 'lang', title: 'Language', type: 'string', options: { list: LANGS, layout: 'radio', direction: 'horizontal' }, validation: (R) => R.required() }),
    defineField({ name: 'day', title: 'Day', type: 'number', validation: (R) => R.required().min(1) }),
    defineField({ name: 'place', title: 'Place (e.g. "Cairo", "Cairo → sleeper train", "On the Nile")', type: 'string' }),
    defineField({ name: 'title', title: 'Title (what happens, plain)', type: 'string', validation: (R) => R.required() }),
    defineField({
      name: 'body',
      title: 'Day paragraph(s)',
      description: 'Editorial paragraph(s), 60–120 words. Leave empty when the day uses Morning / Afternoon / Evening segments.',
      type: 'array',
      of: [{ type: 'block', styles: [{ title: 'Normal', value: 'normal' }], lists: [] }],
    }),
    defineField({
      name: 'segments',
      title: 'Morning / Midday / Afternoon / Evening (long days only)',
      description: 'Only where the source describes a sequence of 3+ stops in one day.',
      type: 'array',
      of: [
        {
          type: 'object',
          name: 'daySegment',
          fields: [
            defineField({
              name: 'label',
              title: 'Part of the day',
              type: 'string',
              options: { list: ['morning', 'midday', 'afternoon', 'evening'] },
            }),
            defineField({ name: 'heading', title: 'Heading override (e.g. "Morning: the West Bank")', type: 'string' }),
            defineField({ name: 'text', title: 'Text', type: 'text', rows: 4, validation: (R) => R.required() }),
          ],
          preview: { select: { title: 'heading', label: 'label', subtitle: 'text' }, prepare: ({ title, label, subtitle }) => ({ title: title || label, subtitle }) },
        },
      ],
    }),
    defineField({
      name: 'sites',
      title: 'The day (sites, in order)',
      type: 'array',
      of: [
        {
          type: 'object',
          name: 'daySite',
          fields: [
            defineField({ name: 'name', title: 'Name', type: 'string', validation: (R) => R.required() }),
            defineField({
              name: 'guideRef',
              title: 'Guide / wiki page (empty = shown without a link)',
              type: 'reference',
              to: [{ type: 'guideArticle' }, { type: 'wikiMonument' }, { type: 'travelTip' }],
              weak: true,
            }),
          ],
          preview: { select: { title: 'name', ref: 'guideRef._ref' }, prepare: ({ title, ref }) => ({ title, subtitle: ref ? 'linked' : 'no link' }) },
        },
      ],
    }),
    defineField({ name: 'overnight', title: 'Overnight (e.g. "Cairo hotel", "Sleeper train", "Nile cruise ship") — empty on the departure day', type: 'string' }),
    defineField({
      name: 'meals',
      title: 'Meals',
      type: 'array',
      of: [
        {
          type: 'object',
          name: 'dayMeal',
          fields: [
            defineField({ name: 'meal', title: 'Meal', type: 'string', options: { list: ['breakfast', 'lunch', 'dinner'] }, validation: (R) => R.required() }),
            defineField({ name: 'label', title: 'Shown instead of the meal word (e.g. "farewell dinner")', type: 'string' }),
            defineField({ name: 'note', title: 'Note in brackets (e.g. "on the train")', type: 'string' }),
          ],
          preview: { select: { meal: 'meal', label: 'label', note: 'note' }, prepare: ({ meal, label, note }) => ({ title: label || meal, subtitle: note }) },
        },
      ],
    }),
    defineField({ name: 'travel', title: 'Travel', type: 'string' }),
    defineField({ name: 'pace', title: 'Pace (only from a statement in the essay)', type: 'string' }),
    defineField({
      name: 'optional',
      title: 'Optional on this day (extras, never in the price)',
      type: 'array',
      of: [
        {
          type: 'object',
          name: 'dayOptional',
          fields: [
            defineField({ name: 'text', title: 'Text (as shown)', type: 'string', validation: (R) => R.required() }),
            defineField({ name: 'cost', title: 'Cost', type: 'string', options: { list: [{ title: 'Extra ticket', value: 'extraTicket' }, { title: 'Extra cost', value: 'extraCost' }] } }),
            defineField({ name: 'exclusionRef', title: 'Not-included row it belongs to (its _key)', type: 'string' }),
          ],
          preview: { select: { title: 'text', subtitle: 'cost' } },
        },
      ],
    }),
    defineField({
      name: 'narrativeRefs',
      title: '"More about this stop": essay blocks (their _key in the body, this language)',
      type: 'array',
      of: [{ type: 'string' }],
    }),
    defineField({ name: 'continuesInDay', title: 'Essay passage for this day sits under Day… (shows "Continues in Day n")', type: 'number' }),
    defineField({ name: 'source', title: 'Source sentence (exact quote from the page)', type: 'text', rows: 2 }),
    defineField({
      name: 'needsReview',
      title: 'Day needs review',
      description: 'The new day layout renders only when every day and the journey intro in this language are approved.',
      type: 'boolean',
      initialValue: true,
    }),
    defineField({ name: 'overnightNeedsReview', title: 'Overnight needs review (the panel Nights count uses approved overnights)', type: 'boolean', initialValue: true }),
  ],
  preview: {
    select: { day: 'day', title: 'title', overnight: 'overnight', lang: 'lang', r1: 'needsReview', r2: 'overnightNeedsReview' },
    prepare: ({ day, title, overnight, lang, r1, r2 }) => ({
      title: `Day ${day} · ${title ?? ''}`,
      subtitle: `${lang ?? '?'} · ${overnight || 'Departure'}${r1 === false && r2 === false ? '' : ' · needs review'}`,
    }),
  },
});

/**
 * Route leg (product page right column, 2026-11-11): how the traveller moves
 * between two stops. Stops are places; the mode is the transport (a "Nile
 * cruise" is a leg, never a stop). One row per leg and language, in order.
 * "Your route" and the panel's Route row render only when every leg of the
 * product in that language is approved.
 */
export const routeLegSchema = defineType({
  name: 'routeLeg',
  title: 'Leg',
  type: 'object',
  fields: [
    defineField({ name: 'lang', title: 'Language', type: 'string', options: { list: LANGS, layout: 'radio', direction: 'horizontal' }, validation: (R) => R.required() }),
    defineField({ name: 'from', title: 'From (place)', type: 'string', validation: (R) => R.required() }),
    defineField({ name: 'to', title: 'To (place)', type: 'string', validation: (R) => R.required() }),
    defineField({
      name: 'via',
      title: 'Stops on the way (e.g. Kom Ombo, Edfu on a cruise) — only if the product text names them on this leg',
      type: 'array',
      of: [{ type: 'string' }],
    }),
    defineField({
      name: 'mode',
      title: 'Transport',
      type: 'string',
      options: {
        list: [
          { title: 'Overnight sleeper train', value: 'sleeper_train' },
          { title: 'Train', value: 'train' },
          { title: 'Flight', value: 'flight' },
          { title: 'Nile cruise', value: 'nile_cruise' },
          { title: 'Dahabiya', value: 'dahabiya' },
          { title: 'Felucca', value: 'felucca' },
          { title: 'By road', value: 'road' },
          { title: 'Boat', value: 'boat' },
        ],
      },
      validation: (R) => R.required(),
    }),
    defineField({ name: 'nights', title: 'Nights on this leg (only if the text states it)', type: 'number' }),
    defineField({ name: 'source', title: 'Source sentence(s) (exact quote from the page)', type: 'text', rows: 2 }),
    defineField({ name: 'needsReview', title: 'Needs review (hidden on the site while on)', type: 'boolean', initialValue: true }),
  ],
  preview: {
    select: { from: 'from', to: 'to', mode: 'mode', lang: 'lang', review: 'needsReview' },
    prepare: ({ from, to, mode, lang, review }) => ({ title: `${from ?? '?'} → ${to ?? '?'}`, subtitle: `${lang ?? '?'} · ${mode ?? ''}${review === false ? '' : ' · needs review'}` }),
  },
});

/**
 * Journey intro (multi-day itinerary format, 2026-11-16): the product-level
 * sections around the numbered days. One row per language; the new layout
 * renders in a language only when this row and every day are approved.
 */
export const itineraryIntroSchema = defineType({
  name: 'itineraryIntro',
  title: 'Journey intro',
  type: 'object',
  fields: [
    defineField({ name: 'lang', title: 'Language', type: 'string', options: { list: LANGS, layout: 'radio', direction: 'horizontal' }, validation: (R) => R.required() }),
    defineField({ name: 'opening', title: 'Opening (2–3 sentences, no heading)', type: 'text', rows: 3 }),
    defineField({ name: 'whyRoute', title: 'Why this route works', type: 'text', rows: 5 }),
    defineField({
      name: 'whyRouteRefs',
      title: 'Essay blocks under "More about this route" (their _key in the body)',
      description: 'The essay\'s introduction, kept unchanged so no essay text leaves the page.',
      type: 'array',
      of: [{ type: 'string' }],
    }),
    defineField({ name: 'closingLine', title: 'Closing line (italic, after the days)', type: 'string' }),
    defineField({ name: 'closingRef', title: 'Essay block the closing line is (its _key)', type: 'string' }),
    defineField({
      name: 'stayAndTravel',
      title: 'Your stay and travel',
      type: 'object',
      fields: [
        defineField({ name: 'hotels', title: 'Hotels', type: 'text', rows: 2 }),
        defineField({ name: 'river', title: 'On the Nile', type: 'text', rows: 2 }),
        defineField({ name: 'train', title: 'Sleeper train', type: 'text', rows: 2 }),
        defineField({ name: 'flight', title: 'Flight', type: 'text', rows: 2 }),
        defineField({ name: 'camp', title: 'Camp', type: 'text', rows: 2 }),
        defineField({ name: 'road', title: 'By road', type: 'text', rows: 2 }),
        defineField({ name: 'everyDay', title: 'Every day', type: 'text', rows: 2 }),
      ],
    }),
    defineField({ name: 'fitFor', title: 'A good fit if you…', type: 'array', of: [{ type: 'string' }] }),
    defineField({ name: 'worthKnowing', title: 'Worth knowing', type: 'array', of: [{ type: 'string' }] }),
    defineField({ name: 'makeItYoursIntro', title: 'Make it yours: one line before the options', type: 'string' }),
    defineField({ name: 'source', title: 'Sources (where each sentence comes from)', type: 'text', rows: 3 }),
    defineField({ name: 'needsReview', title: 'Needs review (the new layout is hidden while on)', type: 'boolean', initialValue: true }),
  ],
  preview: {
    select: { lang: 'lang', review: 'needsReview', opening: 'opening' },
    prepare: ({ lang, review, opening }) => ({ title: `Journey intro — ${lang ?? '?'}`, subtitle: `${review === false ? 'approved' : 'needs review'} · ${opening ?? ''}` }),
  },
});
