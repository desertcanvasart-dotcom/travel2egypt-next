import assert from 'node:assert/strict';
import { NextRequest } from 'next/server';
import { unstable_doesMiddlewareMatch } from 'next/experimental/testing/server';
import middleware, { config } from '../../middleware';
import { redirects } from '../../../migration/redirect-map.generated';

async function main() {
  const removed = [
    '/fi', '/fi/', '/fi/category/places-in-egypt-fi/',
    '/fi/egyptin-hieroglyfien-ymmartaminen', '/fi/old-page.html',
    '/fi/category/test?resume=invalid', '/?s=Safari%20in%20lake%20nasser',
    '/es?s=Lake%252BNasser', '/es/?s=', '/ja/?s=%7Bsearch_term_string%7D',
    '/en?s=old-search',
  ];
  const retained = [
    '/', '/es', '/ja', '/guide', '/es/guide', '/ja/guide',
    '/first-time-in-egypt', '/financial', '/?utm_source=test',
    '/es?search=egypt', '/guide?s=unrelated-parameter',
  ];
  for (const path of [...removed, ...retained]) {
    assert.equal(unstable_doesMiddlewareMatch({ config, nextConfig: {}, url: path }), true, path);
    const response = await middleware(new NextRequest(`https://travel2egypt.org${path}`, {
      headers: { host: 'travel2egypt.org' },
    }));
    if (removed.includes(path)) {
      assert.equal(response.status, 410, path);
      assert.equal(response.headers.get('location'), null, path);
      assert.match(response.headers.get('content-type') ?? '', /text\/html/, path);
      assert.match(await response.text(), /This page has been removed/, path);
    } else {
      assert.notEqual(response.status, 410, path);
      assert.equal(response.headers.get('x-robots-tag'), null, path);
    }
  }
  // next.config redirects run before middleware: none may intercept /fi.
  assert.equal(redirects.some(({ source }) => source === '/fi' || source.startsWith('/fi/')), false);
  console.log(`Retired-content regression checks passed (${removed.length} removed, ${retained.length} retained).`);
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
