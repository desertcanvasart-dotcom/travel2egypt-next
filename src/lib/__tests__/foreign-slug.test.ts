import assert from 'node:assert/strict';
import { evaluate, parse } from 'groq-js';
import { client } from '../../sanity/lib/client';
import { findForeignSlugTarget, pickForeignTarget } from '../foreign-slug';

const fs = (en: string | null, es: string | null, ja: string | null) =>
  [
    ['en', en],
    ['es', es],
    ['ja', ja],
  ]
    .filter(([, v]) => v)
    .map(([k, v]) => ({ _key: k as string, value: { current: v as string } }));

// Shapes copied from production docs (2026-11-21).
const dataset = [
  { _id: 'tour.karnak', _type: 'tour', slug: fs('day-tour-to-karnak-luxor-temples-luxor-museum', 'karnak-templo-de-luxor-y-museo-de-luxor', 'karunakku') },
  { _id: 'tour.adelaide', _type: 'tour', slug: fs('adelaide-dahabiya-nile-cruise', 'la-adelaide-siete-dias', 'aderaido') },
  { _id: 'tour.en-only', _type: 'tour', slug: fs('en-only-tour', null, null) },
  { _id: 'landing.hub', _type: 'tourLanding', slug: fs(null, 'hub-solo-es', null) },
  { _id: 'cruise.amwaj', _type: 'nileCruise', slug: fs('m-s-amwaj-livingstone-nile-cruise', 'm-s-amwaj-livingstone-nile-cruise', 'm-s-amuwajiribingusuton') },
  { _id: 'city.qena', _type: 'city', slug: fs('qena', 'qena', 'kena') },
  { _id: 'city.siwa', _type: 'city', slug: fs('siwa-oasis', 'siwa', 'shiwa-oashisu') },
  { _id: 'city.taba', _type: 'city', slug: fs('taba', 'taba', 'taba') },
  { _id: 'city.kom-ombo', _type: 'city', slug: fs('kom-ombo', 'kom-ombo', 'komu-ombo') },
  { _id: 'ga.dakrour', _type: 'guideArticle', parentCity: { _ref: 'city.siwa' }, slug: fs('dakrour-mountain', 'montana-dakrour', 'dakururu-san') },
  { _id: 'ga.pharaoh', _type: 'guideArticle', parentCity: { _ref: 'city.taba' }, slug: fs('pharaoh-island', 'la-isla-del-faraon', 'farao-to') },
  { _id: 'ga.khnum', _type: 'guideArticle', parentCity: { _ref: 'city.kom-ombo' }, slug: fs('khnum-temple', 'templo-de-khnum-2', 'kunumu-shinden') },
  { _id: 'ga.hidden', _type: 'guideArticle', hidden: true, parentCity: { _ref: 'city.taba' }, slug: fs('hidden-en', 'hidden-es', null) },
  // Same leaf under two cities: only the requested city decides.
  { _id: 'ga.museum-siwa', _type: 'guideArticle', parentCity: { _ref: 'city.siwa' }, slug: fs('museum', 'museo', null) },
  { _id: 'ga.museum-taba', _type: 'guideArticle', parentCity: { _ref: 'city.taba' }, slug: fs('museum', 'museo', null) },
  { _id: 'mon.khnum', _type: 'wikiMonument', slug: fs('the-temple-of-khnum-at-esna', 'templo-de-khnum-2', 'クヌム神殿') },
  { _id: 'tip.fees', _type: 'travelTip', slug: fs('attractions-entrance-fees', 'entradas-a-los-monumentos', 'nyujo-ryo') },
  // Collision across types at the root: ambiguous → no redirect.
  { _id: 'tour.dup', _type: 'tour', slug: fs('dup-en', 'shared-foreign', null) },
  { _id: 'mon.dup', _type: 'wikiMonument', slug: fs('dup-mon', null, 'shared-foreign') },
  // Per-language articles linked by translation.metadata.
  { _id: 'art.itin.en', _type: 'article', language: 'en', slug: { current: 'the-best-egypt-travel-itineraries' } },
  { _id: 'art.itin.es', _type: 'article', language: 'es', slug: { current: 'los-mejores-itinerarios-de-viaje-por-egipto' } },
  { _id: 'art.nubian.es', _type: 'article', language: 'es', slug: { current: 'dormir-junto-al-nilo' } },
  { _id: 'drafts.art.x', _type: 'article', language: 'es', slug: { current: 'borrador' } },
  {
    _id: 'tm.itin',
    _type: 'translation.metadata',
    translations: [
      { _key: 'en', value: { _ref: 'art.itin.en' } },
      { _key: 'es', value: { _ref: 'art.itin.es' } },
    ],
  },
  { _id: 'food.es', _type: 'foodArticle', language: 'es', slug: { current: 'sayadeya-es' } },
  { _id: 'food.en', _type: 'foodArticle', language: 'en', slug: { current: 'sayadeya' } },
  {
    _id: 'tm.food',
    _type: 'translation.metadata',
    translations: [
      { _key: 'en', value: { _ref: 'food.en' } },
      { _key: 'es', value: { _ref: 'food.es' } },
    ],
  },
];

async function main() {
  // Pure decision rules.
  const one = { id: 'a', pathByLocale: { en: '/x', es: '/x-es' }, ownLocales: ['es' as const] };
  assert.deepEqual(pickForeignTarget([one], { locale: 'en', path: '/x-es' }), { locale: 'en', href: '/x' });
  assert.equal(pickForeignTarget([one], { locale: 'en', path: '/x' }), null, 'never the requested path');
  assert.equal(pickForeignTarget([one], { locale: 'es', path: '/x-es/' }), null, 'trailing slash is the same path');
  assert.deepEqual(pickForeignTarget([one, { ...one }], { locale: 'en', path: '/x-es' }), { locale: 'en', href: '/x' }, 'same doc twice is one doc');
  assert.equal(pickForeignTarget([one, { ...one, id: 'b' }], { locale: 'en', path: '/x-es' }), null, 'ambiguous');
  assert.equal(pickForeignTarget([], { locale: 'en', path: '/x' }), null, 'nothing found');
  assert.deepEqual(
    pickForeignTarget([{ id: 'a', pathByLocale: { es: '/solo' }, ownLocales: ['es'] }], { locale: 'ja', path: '/solo' }),
    { locale: 'es', href: '/solo' },
    'no version in the requested locale → slug’s own locale',
  );
  assert.equal(
    pickForeignTarget([{ id: 'a', pathByLocale: { ja: '/%E3%83%A2' }, ownLocales: ['ja'] }], { locale: 'ja', path: '/モ' }),
    null,
    'encoded and decoded forms are the same path',
  );

  const originalFetch = client.fetch;
  let calls = 0;
  try {
    client.fetch = (async (query: string, params: Record<string, unknown>) => {
      calls++;
      return (await evaluate(parse(query), { dataset, params })).get();
    }) as typeof client.fetch;
    const t = (route: Parameters<typeof findForeignSlugTarget>[0], locale: string, ...segs: string[]) =>
      findForeignSlugTarget(route, locale, segs);

    // Root (tours) — ES slug with no prefix → EN canonical.
    assert.deepEqual(await t('root', 'en', 'karnak-templo-de-luxor-y-museo-de-luxor'), { locale: 'en', href: '/day-tour-to-karnak-luxor-temples-luxor-museum' });
    assert.deepEqual(await t('root', 'ja', 'karnak-templo-de-luxor-y-museo-de-luxor'), { locale: 'ja', href: '/karunakku' });
    // Tour with no ES slug: /es/<en slug> renders (EN fallback) — that IS the canonical.
    assert.deepEqual(await t('root', 'ja', 'en-only-tour'), null, 'renders already; same path → no redirect');
    // Hub only in ES: no copy in EN → its own locale.
    assert.deepEqual(await t('root', 'en', 'hub-solo-es'), { locale: 'es', href: '/hub-solo-es' });
    // Root article in the wrong language → /blog in the requested locale.
    assert.deepEqual(await t('root', 'en', 'los-mejores-itinerarios-de-viaje-por-egipto'), { locale: 'en', href: '/blog/the-best-egypt-travel-itineraries' });
    assert.equal(await t('root', 'en', 'shared-foreign'), null, 'two docs share the slug → 404');
    assert.equal(await t('root', 'en', 'garbage-path-xyz'), null);
    assert.equal(await t('root', 'en', 'a', 'b'), null, 'multi-segment catch-all paths are not looked up');

    // Blog (per-language docs).
    assert.deepEqual(await t('article', 'en', 'los-mejores-itinerarios-de-viaje-por-egipto'), { locale: 'en', href: '/blog/the-best-egypt-travel-itineraries' });
    assert.deepEqual(await t('article', 'ja', 'los-mejores-itinerarios-de-viaje-por-egipto'), { locale: 'es', href: '/blog/los-mejores-itinerarios-de-viaje-por-egipto' }, 'no JA sibling → ES');
    assert.deepEqual(await t('article', 'ja', 'dormir-junto-al-nilo'), { locale: 'es', href: '/blog/dormir-junto-al-nilo' }, 'no translation.metadata at all');
    assert.equal(await t('article', 'en', 'borrador'), null, 'drafts are never targets');
    assert.deepEqual(await t('foodArticle', 'en', 'sayadeya-es'), { locale: 'en', href: '/food/sayadeya' });

    // Cruises (+ dahabiya tours under /nile-cruises).
    assert.deepEqual(await t('nileCruise', 'en', 'm-s-amuwajiribingusuton'), { locale: 'en', href: '/nile-cruises/m-s-amwaj-livingstone-nile-cruise' });
    assert.deepEqual(await t('nileCruise', 'es', 'adelaide-dahabiya-nile-cruise'), { locale: 'es', href: '/la-adelaide-siete-dias' });

    // Guide cities and articles — both segments localize.
    assert.deepEqual(await t('city', 'es', 'kena'), { locale: 'es', href: '/guide/qena' });
    assert.deepEqual(await t('city', 'ja', 'qena'), { locale: 'ja', href: '/guide/kena' });
    assert.deepEqual(await t('city', 'ja', 'kom-ombo'), { locale: 'ja', href: '/guide/komu-ombo' });
    assert.deepEqual(await t('guideArticle', 'en', 'taba', 'la-isla-del-faraon'), { locale: 'en', href: '/guide/taba/pharaoh-island' });
    assert.deepEqual(await t('guideArticle', 'es', 'taba', 'farao-to'), { locale: 'es', href: '/guide/taba/la-isla-del-faraon' });
    assert.deepEqual(await t('guideArticle', 'ja', 'siwa', 'montana-dakrour'), { locale: 'ja', href: '/guide/shiwa-oashisu/dakururu-san' });
    assert.deepEqual(await t('guideArticle', 'es', 'siwa-oasis', 'montana-dakrour'), { locale: 'es', href: '/guide/siwa/montana-dakrour' }, 'right leaf, wrong city segment');
    assert.deepEqual(await t('guideArticle', 'es', 'taba', 'museum'), { locale: 'es', href: '/guide/taba/museo' }, 'shared leaf narrowed by city');
    assert.equal(await t('guideArticle', 'es', 'luxor', 'museum'), null, 'shared leaf, unknown city → ambiguous');
    assert.equal(await t('guideArticle', 'es', 'taba', 'hidden-en'), null, 'hidden guide articles are not targets');

    // Wiki: the ES slug also belongs to a guide article, but only monuments count here.
    assert.deepEqual(await t('wikiMonument', 'en', 'templo-de-khnum-2'), { locale: 'en', href: '/wiki/monuments/the-temple-of-khnum-at-esna' });
    assert.deepEqual(await t('travelTip', 'en', 'entradas-a-los-monumentos'), { locale: 'en', href: '/travel-tips/attractions-entrance-fees' });

    // Guards that never reach Sanity.
    const before = calls;
    assert.equal(await t('root', 'en', 'wp-login.php'), null);
    assert.equal(await t('root', 'xx', 'karnak-templo-de-luxor-y-museo-de-luxor'), null);
    assert.equal(calls, before, 'bot noise and unknown locales cost no Sanity request');

    // Any error → normal 404.
    client.fetch = (async () => {
      throw new Error('offline');
    }) as typeof client.fetch;
    const consoleError = console.error;
    console.error = () => {};
    try {
      assert.equal(await t('root', 'en', 'karnak-templo-de-luxor-y-museo-de-luxor'), null);
    } finally {
      console.error = consoleError;
    }
  } finally {
    client.fetch = originalFetch;
  }
  console.log('Foreign-slug redirects passed: tours, hubs, articles, food, cruises, guide cities + articles, wiki, tips, ambiguity, errors.');
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
