/**
 * rankByTopic (A2/A3, 2026-11-09): article tour blocks pick products that
 * match the article's topic, its own city, then shorter trips.
 * Run: npx tsx src/lib/__tests__/article-tours-rank.test.ts
 */
import assert from 'node:assert/strict';

import { rankByTopic, type ArticleTour } from '../articleTours';

const CAIRO = 'cairo-id';
const GIZA = 'giza-id';
const tour = (slug: string, type: string, durationDays: number | null, cities: string[]) => ({
  p: { _id: slug, slug, title: slug.replace(/-/g, ' '), type, durationDays, priceFrom: 100 } as ArticleTour,
  enSlug: slug,
  firstCity: cities[0],
  cityRefs: cities,
});

// Newest first, as the query returns them.
const rows = [
  tour('alexandria-day-trip-from-cairo', 'dayTour', null, [CAIRO]),
  tour('13-day-nile-cruise-from-cairo-to-luxor', 'package', 13, [CAIRO, GIZA]),
  tour('egyptian-museum-and-bazaar', 'dayTour', null, [CAIRO]),
  tour('pyramids-of-giza-and-sphinx', 'dayTour', null, [CAIRO]),
];

// Sphinx article → pyramids tour first; the 13-day cruise last.
const sphinx = rankByTopic(rows, 'Guardian of Time: Exploring the Great Sphinx of Giza', [GIZA]).map((p) => p.slug);
assert.equal(sphinx[0], 'pyramids-of-giza-and-sphinx');
assert.equal(sphinx.at(-1), '13-day-nile-cruise-from-cairo-to-luxor');

// Bazaar article → bazaar tour first.
assert.equal(rankByTopic(rows, "A visit to Cairo's Khan el-Khalili market", [CAIRO])[0].slug, 'egyptian-museum-and-bazaar');

// Nothing matches → own-city day tours before the long package, newest first.
const plain = rankByTopic(rows, 'Something unrelated', [CAIRO]).map((p) => p.slug);
assert.deepEqual(plain, [
  'alexandria-day-trip-from-cairo',
  'egyptian-museum-and-bazaar',
  'pyramids-of-giza-and-sphinx',
  '13-day-nile-cruise-from-cairo-to-luxor',
]);

// Own city beats a nearby city's product on equal topic match.
const near = rankByTopic(
  [tour('island-snorkeling-from-hurghada', 'dayTour', null, ['hurghada-id']), tour('island-boat-trip', 'dayTour', null, ['gouna-id'])],
  'Tawila Island',
  ['gouna-id'],
);
assert.equal(near[0].slug, 'island-boat-trip');

console.log('article-tours-rank: all assertions passed');
