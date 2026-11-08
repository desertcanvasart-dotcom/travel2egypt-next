import assert from 'node:assert/strict';
import { evaluate, parse } from 'groq-js';
import { NextRequest } from 'next/server';
import middleware from '../../middleware';
import { slugLookupQuery, sitemapDocsQuery } from '../../sanity/lib/queries';

const localizedSlug = (en: string, es?: string, ja?: string) =>
  Object.entries({ en, es, ja }).filter(([, value]) => value).map(([key, value]) =>
    ({ _key: key, value: { _type: 'slug', current: value } }));
const dataset = [
  ...(['en', 'es', 'ja'] as const).map((language) => ({
    _id: `article-${language}`, _type: 'article', language,
    slug: { _type: 'slug', current: `${language}-restaurant` },
  })),
  { _id: 'drafts.article', _type: 'article', language: 'en', slug: { current: 'draft-only' } },
  { _id: 'tour', _type: 'tour', slug: localizedSlug('tour-en', 'tour-es', 'tour-ja') },
  { _id: 'monument', _type: 'wikiMonument', slug: localizedSlug('monument-en') },
  { _id: 'collision-article', _type: 'article', language: 'en', slug: { current: 'tour-en' } },
  { _id: 'hidden', _type: 'guideArticle', hidden: true, slug: localizedSlug('hidden') },
  { _id: 'noindex-tour', _type: 'tour', seo: { noIndex: true }, slug: localizedSlug('noindex-tour') },
  { _id: 'noindex-article', _type: 'article', seo: { noIndex: true }, language: 'en', slug: { current: 'noindex-article' } },
];

async function query(source: string, params = {}) {
  return (await evaluate(parse(source), { dataset, params })).get();
}

async function main() {
  for (const locale of ['en', 'es', 'ja'] as const) {
    const result = await query(slugLookupQuery(locale), { slug: `${locale}-restaurant` });
    assert.equal(result?._id, `article-${locale}`, `root article resolves in ${locale}`);
    assert.equal((await query(slugLookupQuery(locale), { slug: `tour-${locale}` }))?._id, 'tour');
    assert.equal((await query(slugLookupQuery(locale), { slug: 'monument-en' }))?._id, 'monument', 'EN fallback remains available');
    const response = await middleware(new NextRequest(`https://travel2egypt.org/${locale === 'en' ? '' : `${locale}/`}wiki/monuments/monument-${locale}`, {
      headers: { host: 'travel2egypt.org' },
    }));
    assert.equal(response.headers.get('link'), null, 'middleware must not invent CMS language URLs');
    assert.equal(response.headers.get('x-robots-tag'), null, 'production stays indexable');
  }
  assert.equal(await query(slugLookupQuery('ja'), { slug: 'en-restaurant' }), null, 'articles do not cross language boundaries');
  assert.equal(await query(slugLookupQuery('en'), { slug: 'draft-only' }), null, 'drafts stay excluded');
  assert.equal(await query(slugLookupQuery('en'), { slug: 'missing' }), null);
  assert.equal((await query(slugLookupQuery('en'), { slug: 'tour-en' }))?._id, 'tour', 'tour wins a slug collision');
  const sitemap = await query(sitemapDocsQuery);
  const ids = [...sitemap.localizedDocs, ...sitemap.articles].map((doc: { _id: string }) => doc._id);
  for (const id of ['hidden', 'noindex-tour', 'noindex-article', 'drafts.article']) assert.ok(!ids.includes(id), `${id} must not enter sitemap`);
  assert.ok(ids.includes('tour') && ids.includes('article-en'), 'published indexable documents remain');
  console.log('Migration routing passed: EN/ES/JA article and tour lookup, language isolation, drafts, collision precedence, middleware headers, sitemap visibility.');
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
