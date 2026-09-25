import { defineField } from 'sanity';

/**
 * Shared field builders for the 3-page tour system (journey-1/2/3 designs).
 *
 * These extend tourLanding (L2 subcategory) and tour (L3 single) with the
 * structured fields the approved designs need. Object types are inlined (not
 * registered) to mirror the existing `highlights`/`days` pattern — no schema
 * registry changes required.
 *
 * Localized bullet lists reuse the established `{ _key: locale, value: [..] }`
 * shape (see tour.highlights), so the frontend coalesces with
 * `coalesce(field[_key==$locale][0].value, field[_key=="en"][0].value)`.
 */

/**
 * A localized list of short strings (bullets). One row per locale, each
 * holding an array of strings. Matches the existing `highlights` pattern.
 */
export function localizedStringListField(
  name: string,
  options: { title: string; description?: string; group?: string }
) {
  return defineField({
    name,
    title: options.title,
    description: options.description,
    type: 'array',
    group: options.group,
    of: [
      {
        type: 'object',
        fields: [
          defineField({
            name: 'value',
            title: `${options.title} (per locale)`,
            type: 'array',
            of: [{ type: 'string' }],
          }),
        ],
        preview: {
          select: { key: '_key', count: 'value' },
          prepare({ key, count }: { key?: string; count?: unknown[] }) {
            return {
              title: `${options.title} — ${key?.toUpperCase() ?? '?'}`,
              subtitle: `${Array.isArray(count) ? count.length : 0} items`,
            };
          },
        },
      },
    ],
  });
}

/** {label, value} row — the L2 hero facts card + L3 effort list. */
const labelValueObject = (nameHint: string) => ({
  type: 'object' as const,
  fields: [
    defineField({ name: 'label', title: 'Label', type: 'internationalizedArrayString', validation: (R: any) => R.required() }),
    defineField({ name: 'value', title: 'Value', type: 'internationalizedArrayString', validation: (R: any) => R.required() }),
  ],
  preview: {
    select: { label: 'label.0.value', value: 'value.0.value' },
    prepare({ label, value }: { label?: string; value?: string }) {
      return { title: value || nameHint, subtitle: label };
    },
  },
});

/* =====================================================================
 * LEVEL 2 — tourLanding fields
 * =================================================================== */

/** Hero facts card — up to four label/value rows. */
export const landingFactsField = defineField({
  name: 'facts',
  title: 'Hero facts card',
  description: 'Up to four quick facts shown in the hero card (Best for, Group size, Ideal stay, Best season).',
  type: 'array',
  group: 'content',
  of: [labelValueObject('Fact')],
  validation: (R) => R.max(4),
});

/** Hero card note + editor byline block. */
export const landingHeroNoteField = defineField({
  name: 'heroNote',
  title: 'Hero card note',
  description: 'Short note under the facts card (e.g. "Written as an editorial guide first…").',
  type: 'internationalizedArrayText',
  group: 'content',
});

export const landingBylineField = defineField({
  name: 'editorByline',
  title: 'Editor byline (intro aside)',
  description: 'The sticky aside beside the editorial intro.',
  type: 'object',
  group: 'content',
  fields: [
    defineField({ name: 'kicker', title: 'Kicker', type: 'internationalizedArrayString' }),
    defineField({ name: 'heading', title: 'Heading', type: 'internationalizedArrayString' }),
    defineField({ name: 'intro', title: 'Intro', type: 'internationalizedArrayText' }),
    defineField({ name: 'mini', title: 'Mini note', type: 'internationalizedArrayText' }),
  ],
});

/** Optional mood chooser — 3 cards. Omitted on the page when empty. */
export const landingMoodChooserField = defineField({
  name: 'moodChooser',
  title: 'Mood chooser (optional)',
  description: 'Flagship-only. Three cards that branch by the kind of day. Leave empty to omit the section.',
  type: 'object',
  group: 'content',
  fields: [
    defineField({ name: 'heading', title: 'Section heading', type: 'internationalizedArrayString' }),
    defineField({ name: 'intro', title: 'Section intro', type: 'internationalizedArrayText' }),
    defineField({
      name: 'cards',
      title: 'Cards',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            defineField({ name: 'eyebrow', title: 'Eyebrow', type: 'internationalizedArrayString' }),
            defineField({ name: 'title', title: 'Title', type: 'internationalizedArrayString', validation: (R: any) => R.required() }),
            defineField({ name: 'body', title: 'Body', type: 'internationalizedArrayText' }),
            localizedStringListField('bullets', { title: 'Bullets' }),
            defineField({ name: 'jumpLabel', title: 'Jump label', type: 'internationalizedArrayString', description: 'e.g. "See the reef days ↓"' }),
            defineField({ name: 'image', title: 'Image', type: 'localizedImage' }),
          ],
          preview: { select: { title: 'title.0.value' }, prepare: ({ title }: any) => ({ title: title || 'Mood card' }) },
        },
      ],
      validation: (R) => R.max(3),
    }),
  ],
});

/** Optional orientation block — drive-time spine + effort framing. */
export const landingOrientationField = defineField({
  name: 'orientation',
  title: 'Orientation block (optional)',
  description: 'Flagship-only. Real drive-times from the hotel base + effort framing. Leave empty to omit.',
  type: 'object',
  group: 'content',
  fields: [
    defineField({ name: 'baseLabel', title: 'Base label', type: 'internationalizedArrayString', description: 'e.g. "From your hotel base"' }),
    defineField({ name: 'baseName', title: 'Base name', type: 'internationalizedArrayString', description: 'e.g. "Sharm El-Sheikh"' }),
    defineField({
      name: 'stops',
      title: 'Stops',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            defineField({ name: 'name', title: 'Name', type: 'internationalizedArrayString', validation: (R: any) => R.required() }),
            defineField({ name: 'sub', title: 'Sub-label', type: 'internationalizedArrayString' }),
            defineField({ name: 'time', title: 'Drive time', type: 'internationalizedArrayString', description: 'e.g. "~1 hr"' }),
            defineField({ name: 'effort', title: 'Effort tag', type: 'internationalizedArrayString', description: 'e.g. "Easy", "Signature"' }),
          ],
          preview: { select: { name: 'name.0.value', time: 'time.0.value' }, prepare: ({ name, time }: any) => ({ title: name || 'Stop', subtitle: time }) },
        },
      ],
    }),
    defineField({ name: 'copyKicker', title: 'Copy kicker', type: 'internationalizedArrayString' }),
    defineField({ name: 'copyHeading', title: 'Copy heading', type: 'internationalizedArrayString' }),
    defineField({ name: 'copyBody', title: 'Copy body', type: 'internationalizedArrayText' }),
    defineField({
      name: 'effort',
      title: 'Effort list',
      type: 'array',
      of: [labelValueObject('Effort row')],
    }),
  ],
});

/** Per-tour editorial label + "why" line, keyed to a tour in the list. */
export const landingTourNotesField = defineField({
  name: 'tourPresentation',
  title: 'Tour editorial labels (optional)',
  description: 'Per-tour editorial label + "why" line for the tours grid. Match a tour to give it an "Editor\'s pick"-style tag and a one-line reason.',
  type: 'array',
  group: 'related',
  of: [
    {
      type: 'object',
      fields: [
        defineField({ name: 'tour', title: 'Tour', type: 'reference', to: [{ type: 'tour' }], validation: (R: any) => R.required() }),
        defineField({ name: 'label', title: 'Label', type: 'internationalizedArrayString', description: 'e.g. "Editor\'s pick", "Best first day"' }),
        defineField({ name: 'featured', title: 'Featured (large card)', type: 'boolean', initialValue: false }),
        defineField({ name: 'why', title: 'Why line', type: 'internationalizedArrayText', description: 'One italic line — who should choose this day.' }),
      ],
      preview: { select: { label: 'label.0.value', title: 'tour.title.0.value' }, prepare: ({ label, title }: any) => ({ title: title || 'Tour', subtitle: label }) },
    },
  ],
});

/** Journal reads for the L2 "Read before you choose" section. */
export const landingJournalField = defineField({
  name: 'journalRefs',
  title: 'Journal reads (optional)',
  description: 'Supporting articles for the "Read before you choose" section. Leave empty to omit.',
  type: 'array',
  group: 'related',
  of: [
    { type: 'reference', name: 'postRef', to: [{ type: 'article' }] },
    { type: 'reference', name: 'guideRef', to: [{ type: 'guideArticle' }] },
  ],
  validation: (R) => R.max(3),
});

/* =====================================================================
 * LEVEL 3 — tour fields
 * =================================================================== */

/** Meta-row extras (group size / effort / departs). */
export const tourMetaFields = [
  defineField({ name: 'groupSize', title: 'Group size (meta)', type: 'internationalizedArrayString', group: 'classification', description: 'Meta row. e.g. "Max 10 guests" or "Private — your party only".' }),
  defineField({ name: 'effortLevel', title: 'Effort (meta)', type: 'internationalizedArrayString', group: 'classification', description: 'Meta row. e.g. "Moderate–demanding".' }),
  defineField({ name: 'departsFrom', title: 'Departs (meta)', type: 'internationalizedArrayString', group: 'classification', description: 'Meta row. e.g. "Sharm · Dahab".' }),
  defineField({ name: 'priceFrom', title: 'From price (number)', type: 'number', group: 'pricing', description: 'Numeric "from" price (per person), e.g. 1290. Currency is EUR, applied by the renderer — do NOT type a symbol. Falls back to the first price tier.' }),
];

/** Hour-by-hour timeline (distinct from the multi-day `days[]`). */
export const tourTimelineField = defineField({
  name: 'timeline',
  title: 'The day, hour by hour',
  description: 'Time block + description rows for single-day tours (L3 timeline).',
  type: 'array',
  group: 'itinerary',
  of: [
    {
      type: 'object',
      fields: [
        defineField({ name: 'time', title: 'Time', type: 'internationalizedArrayString', description: 'e.g. "Midnight", "Before dawn"', validation: (R: any) => R.required() }),
        defineField({ name: 'description', title: 'Description', type: 'internationalizedArrayText', validation: (R: any) => R.required() }),
      ],
      preview: { select: { time: 'time.0.value', d: 'description.0.value' }, prepare: ({ time, d }: any) => ({ title: time || 'Step', subtitle: d }) },
    },
  ],
});

/** Inline concierge note + included/excluded bullet lists + audience notes. */
export const tourBodyExtraFields = [
  defineField({ name: 'conciergeNote', title: 'Inline concierge note', type: 'internationalizedArrayText', group: 'content', description: 'Gold-ruled italic aside placed after the timeline.' }),
  localizedStringListField('includedItems', { title: 'Included', group: 'itinerary', description: 'Bullet list — what the price covers.' }),
  localizedStringListField('notIncludedItems', { title: 'Not included', group: 'itinerary', description: 'Bullet list — what it does not cover.' }),
  defineField({ name: 'accessNoteTitle', title: 'Access note title', type: 'internationalizedArrayString', group: 'content', description: 'e.g. "A note on 2026 access". Optional.' }),
  defineField({ name: 'accessNote', title: 'Access note body', type: 'internationalizedArrayText', group: 'content' }),
  defineField({ name: 'audienceNoteTitle', title: 'Audience note title', type: 'internationalizedArrayString', group: 'content', description: 'e.g. "Who it\'s for — and who should skip it".' }),
  defineField({ name: 'audienceNote', title: 'Audience note body', type: 'internationalizedArrayText', group: 'content' }),
];

/** Decision rail — shape of the day, price tiers, trust. */
export const tourShapeField = defineField({
  name: 'shapeOfDay',
  title: 'Shape of the day (rail)',
  description: 'Decision-rail summary card.',
  type: 'object',
  group: 'itinerary',
  fields: [
    defineField({ name: 'where', title: 'Where', type: 'internationalizedArrayText' }),
    defineField({ name: 'duration', title: 'Duration', type: 'internationalizedArrayString' }),
    defineField({ name: 'character', title: 'Character', type: 'internationalizedArrayText' }),
  ],
});

export const tourPriceTiersField = defineField({
  name: 'priceTiers',
  title: 'Price tiers (rail)',
  description: 'Base / +Entrance / +Camel style tiers. Indicative only — final quote on inquiry.',
  type: 'array',
  group: 'pricing',
  of: [
    {
      type: 'object',
      fields: [
        defineField({ name: 'name', title: 'Tier name', type: 'internationalizedArrayString', validation: (R: any) => R.required() }),
        defineField({ name: 'sub', title: 'Sub-label', type: 'internationalizedArrayString' }),
        defineField({ name: 'price', title: 'Price (number)', type: 'number', description: 'Numeric price, e.g. 1290. Currency is EUR, applied by the renderer — no symbol.', validation: (R: any) => R.required() }),
        defineField({ name: 'unit', title: 'Unit', type: 'internationalizedArrayString', description: 'e.g. "pp"' }),
      ],
      preview: { select: { name: 'name.0.value', price: 'price' }, prepare: ({ name, price }: any) => ({ title: name || 'Tier', subtitle: price != null ? `€${price}` : '' }) },
    },
  ],
});

export const tourPriceNoteField = defineField({
  name: 'priceNote',
  title: 'Price honesty note (rail)',
  type: 'internationalizedArrayText',
  group: 'pricing',
  description: 'The small note under the price tiers (why entrance is separate, final quote on inquiry).',
});

export const tourSingleSupplementField = defineField({
  name: 'singleSupplement',
  title: 'Single supplement (amount)',
  type: 'number',
  group: 'pricing',
  description:
    'Single-supplement amount, same currency as the From price. Renders a "Single supplement · from {value}" row in the package price card (symbol taken from the From price).',
});

export const tourTrustFields = [
  localizedStringListField('trustSignals', { title: 'Trust signals', group: 'related', description: 'Why-book-with-us bullets in the rail.' }),
  defineField({ name: 'accreditations', title: 'Accreditations line', type: 'internationalizedArrayString', group: 'related', description: 'e.g. "ETAA · IATA · ASTA — Egyptian-operated since 1993".' }),
];

/** L3 related weave — "From the Journal" column. */
export const tourJournalField = defineField({
  name: 'journalRefs',
  title: 'Journal reads (related weave)',
  description: 'Articles for the "From the Journal" column of the related weave.',
  type: 'array',
  group: 'related',
  of: [{ type: 'reference', to: [{ type: 'article' }] }],
  validation: (R) => R.max(3),
});
