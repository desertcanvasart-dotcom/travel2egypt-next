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
    defineField({ name: 'title', title: 'Short title', type: 'string', validation: (R) => R.required() }),
    defineField({ name: 'overnight', title: 'Night (place) — empty on the departure day', type: 'string' }),
    defineField({ name: 'source', title: 'Source sentence (exact quote from the page)', type: 'text', rows: 2 }),
    defineField({ name: 'needsReview', title: 'Title needs review', type: 'boolean', initialValue: true }),
    defineField({ name: 'overnightNeedsReview', title: 'Night needs review', type: 'boolean', initialValue: true }),
  ],
  preview: {
    select: { day: 'day', title: 'title', overnight: 'overnight', lang: 'lang', r1: 'needsReview', r2: 'overnightNeedsReview' },
    prepare: ({ day, title, overnight, lang, r1, r2 }) => ({
      title: `Day ${day} · ${title ?? ''}`,
      subtitle: `${lang ?? '?'} · ${overnight || 'Departure'}${r1 === false && r2 === false ? '' : ' · needs review'}`,
    }),
  },
});
