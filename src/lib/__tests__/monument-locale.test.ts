import assert from 'node:assert/strict';
import { evaluate, parse } from 'groq-js';
import { NextRequest } from 'next/server';
import { GET } from '../../app/api/locale-resolve/monument/route';
import { client } from '../../sanity/lib/client';
import { resolveLocalizedPathname } from '../../components/LocaleSwitcher';

async function main() {
  const originalFetch = client.fetch;
  const browserFetch = globalThis.fetch;
  const slugs = [
    { _key: 'en', value: { current: 'mosque' } },
    { _key: 'es', value: { current: 'mezquita' } },
    { _key: 'ja', value: { current: 'モスク' } },
  ];
  const dataset = [{ _id: 'mosque', _type: 'wikiMonument', slug: slugs }];
  try {
    client.fetch = (async (query: string, params: Record<string, unknown>) =>
      (await evaluate(parse(query), { dataset, params })).get()) as typeof client.fetch;
    globalThis.fetch = (async (url: string) => GET(new NextRequest(`https://travel2egypt.org${url}`))) as typeof fetch;
    assert.equal(await resolveLocalizedPathname('/wiki/monuments/mosque', 'en', 'es'), '/wiki/monuments/mezquita');
    assert.equal(await resolveLocalizedPathname('/wiki/monuments/mezquita', 'es', 'ja'), '/wiki/monuments/モスク');
    assert.equal(await resolveLocalizedPathname('/wiki/monuments/モスク', 'ja', 'en'), '/wiki/monuments/mosque');
    assert.equal(await resolveLocalizedPathname('/wiki/monuments/%E3%83%A2%E3%82%B9%E3%82%AF', 'ja', 'en'), '/wiki/monuments/mosque');
    assert.equal(await resolveLocalizedPathname('/wiki/monuments/missing', 'en', 'es'), '/wiki/monuments');
    assert.equal((await GET(new NextRequest('https://travel2egypt.org/api/locale-resolve/monument?fromLocale=xx&fromSlug=mosque&toLocale=es'))).status, 400);
    globalThis.fetch = async () => { throw new Error('offline'); };
    assert.equal(await resolveLocalizedPathname('/wiki/monuments/mosque', 'en', 'ja'), '/wiki/monuments');
    assert.equal(await resolveLocalizedPathname('/about', 'en', 'en'), '/about');
  } finally {
    client.fetch = originalFetch;
    globalThis.fetch = browserFetch;
  }
  console.log('Monument switching passed: translated slugs, reverse lookup, missing page, invalid locale, network failure.');
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
