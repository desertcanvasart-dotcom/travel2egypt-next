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
        defineField({ name: 'arrival', title: 'Arriving and leaving', type: 'text', rows: 2 }),
        defineField({ name: 'everyDay', title: 'Every day', type: 'text', rows: 2 }),
        defineField({ name: 'water', title: 'On the water', type: 'text', rows: 2 }),
      ],
    }),
    defineField({ name: 'pickup', title: 'Panel: Pickup (e.g. "from your hotel in Luxor")', type: 'string' }),
    defineField({
      name: 'panelRows',
      title: 'Panel rows, label and text as in the locked copy (replace Pickup / Ends when set)',
      type: 'array',
      of: [{ type: 'object', name: 'labelledRow', fields: [defineField({ name: 'label', type: 'string' }), defineField({ name: 'text', type: 'text', rows: 2 })] }],
    }),
    defineField({
      name: 'stayRows',
      title: 'Your stay and travel rows, label and text as in the locked copy (replace the fixed rows when set)',
      type: 'array',
      of: [{ type: 'object', name: 'labelledRow', fields: [defineField({ name: 'label', type: 'string' }), defineField({ name: 'text', type: 'text', rows: 2 })] }],
    }),
    defineField({ name: 'ends', title: 'Panel: Ends (e.g. "in Aswan, at your hotel…")', type: 'string' }),
    defineField({
      name: 'daysNote',
      title: 'Note above the days (e.g. "Your ship sets the exact order.")',
      type: 'object',
      fields: [
        defineField({ name: 'lead', title: 'Lead (bold)', type: 'string' }),
        defineField({ name: 'text', title: 'Text', type: 'text', rows: 3 }),
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

/**
 * Day-tour format (owner brief, 2026-11-16): "Your day" as periods of stops.
 * One row per period and language, in order. Times only where the product
 * text gives them. Renders only when every period and the day-tour intro in
 * that language are approved.
 */
export const dayTourPeriodSchema = defineType({
  name: 'dayTourPeriod',
  title: 'Part of the day',
  type: 'object',
  fields: [
    defineField({ name: 'lang', title: 'Language', type: 'string', options: { list: LANGS, layout: 'radio', direction: 'horizontal' }, validation: (R) => R.required() }),
    defineField({ name: 'period', title: 'Period', type: 'string', options: { list: ['morning', 'midday', 'afternoon', 'evening'] }, validation: (R) => R.required() }),
    defineField({ name: 'periodLabel', title: 'Area / label (e.g. "The Giza Plateau")', type: 'string' }),
    defineField({
      name: 'stops',
      title: 'Stops',
      type: 'array',
      of: [
        {
          type: 'object',
          name: 'dayTourStop',
          fields: [
            defineField({ name: 'time', title: 'Time (only if the product text gives it, e.g. "09:00", "17:00–18:00")', type: 'string' }),
            defineField({ name: 'title', title: 'Stop', type: 'string', validation: (R) => R.required() }),
            defineField({ name: 'glanceLabel', title: 'Short name for "Your day at a glance" (defaults to the stop)', type: 'string' }),
            defineField({ name: 'skipGlance', title: 'Leave out of "Your day at a glance" (e.g. the optional-extras stop)', type: 'boolean' }),
            defineField({ name: 'text', title: 'Text (1–3 sentences)', type: 'text', rows: 3 }),
            defineField({
              name: 'sites',
              title: 'Sites',
              type: 'array',
              of: [
                {
                  type: 'object',
                  name: 'dayTourSite',
                  fields: [
                    defineField({ name: 'name', title: 'Name', type: 'string', validation: (R) => R.required() }),
                    defineField({ name: 'guideRef', title: 'Guide / wiki page', type: 'reference', to: [{ type: 'guideArticle' }, { type: 'wikiMonument' }, { type: 'travelTip' }], weak: true }),
                  ],
                },
              ],
            }),
            defineField({ name: 'includedNote', title: 'Included inside-visit line (e.g. "Inside a pyramid (included). …")', type: 'string' }),
            defineField({
              name: 'optional',
              title: 'Optional extras at this point of the day',
              type: 'array',
              of: [
                {
                  type: 'object',
                  name: 'dayTourOptional',
                  fields: [
                    defineField({ name: 'text', title: 'Text (as shown)', type: 'string', validation: (R) => R.required() }),
                    defineField({ name: 'cost', title: 'Cost', type: 'string', options: { list: [{ title: 'Extra ticket', value: 'extraTicket' }, { title: 'Extra cost', value: 'extraCost' }] } }),
                    defineField({ name: 'note', title: 'Note (e.g. the approved camel welfare line)', type: 'string' }),
                  ],
                },
              ],
            }),
          ],
          preview: { select: { time: 'time', title: 'title' }, prepare: ({ time, title }) => ({ title: [time, title].filter(Boolean).join(' · ') }) },
        },
      ],
    }),
    defineField({ name: 'source', title: 'Sources', type: 'text', rows: 2 }),
    defineField({ name: 'needsReview', title: 'Needs review (the day-tour layout is hidden while on)', type: 'boolean', initialValue: true }),
  ],
  preview: {
    select: { lang: 'lang', period: 'period', label: 'periodLabel', review: 'needsReview' },
    prepare: ({ lang, period, label, review }) => ({ title: [period, label].filter(Boolean).join(' · '), subtitle: `${lang ?? '?'}${review === false ? '' : ' · needs review'}` }),
  },
});

export const dayTourIntroSchema = defineType({
  name: 'dayTourIntro',
  title: 'Day-tour intro',
  type: 'object',
  fields: [
    defineField({ name: 'lang', title: 'Language', type: 'string', options: { list: LANGS, layout: 'radio', direction: 'horizontal' }, validation: (R) => R.required() }),
    defineField({ name: 'opening', title: 'Opening (2–3 sentences, no heading)', type: 'text', rows: 3 }),
    defineField({ name: 'whyThisOrder', title: 'Why the day runs this way', type: 'text', rows: 4 }),
    defineField({ name: 'pickupTime', title: 'Pickup time (only if the product text gives it)', type: 'string' }),
    defineField({ name: 'pickupLine', title: 'Pickup row, the whole line as written (outside Cairo and Giza, e.g. "06:00 from your hotel in Aswan")', type: 'string' }),
    defineField({ name: 'flightsLine', title: 'Flights row, the whole line as written (plane day trips, e.g. "not included; the fare depends on the date and availability")', type: 'string' }),
    defineField({ name: 'returnTime', title: 'Return time (field, e.g. "17:00–18:00"; only if the product text gives it)', type: 'string' }),
    defineField({ name: 'returnNote', title: 'Back: qualifier after the time (e.g. "depending on your hotel\'s location"). Legacy rows may hold the whole line.', type: 'string' }),
    defineField({
      name: 'lunch',
      title: 'Lunch',
      type: 'object',
      fields: [
        defineField({ name: 'status', title: 'Status', type: 'string', options: { list: [{ title: 'Included', value: 'included' }, { title: 'Not included', value: 'notIncluded' }, { title: 'Unknown', value: 'unknown' }] } }),
        defineField({ name: 'text', title: 'Panel text (e.g. "included, at a local restaurant")', type: 'string' }),
      ],
    }),
    defineField({ name: 'fitFor', title: 'A good fit if you…', type: 'array', of: [{ type: 'string' }] }),
    defineField({ name: 'worthKnowing', title: 'Worth knowing', type: 'array', of: [{ type: 'string' }] }),
    defineField({ name: 'closingLine', title: 'Closing line (italic)', type: 'string' }),
    defineField({ name: 'closingRef', title: 'Essay block the closing line is (its _key; kept out of the expander)', type: 'string' }),
    defineField({
      name: 'skipRefs',
      title: 'Essay blocks left out of "More about this day" (their _key), e.g. a concierge mention on the JA page',
      type: 'array',
      of: [{ type: 'string' }],
    }),
    defineField({ name: 'source', title: 'Sources', type: 'text', rows: 3 }),
    defineField({ name: 'needsReview', title: 'Needs review (the day-tour layout is hidden while on)', type: 'boolean', initialValue: true }),
  ],
  preview: {
    select: { lang: 'lang', review: 'needsReview', opening: 'opening' },
    prepare: ({ lang, review, opening }) => ({ title: `Day-tour intro — ${lang ?? '?'}`, subtitle: `${review === false ? 'approved' : 'needs review'} · ${opening ?? ''}` }),
  },
});
