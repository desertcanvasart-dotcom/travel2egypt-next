import assert from 'node:assert/strict';
import { canonicalContentHref } from '../canonical-content-href';
import repairs from '../../../migration/seo-repairs-2026-09-22.json';
import { redirects } from '../../../migration/redirect-map.generated';

assert.equal(canonicalContentHref('https://travel2egypt.org/restaurants-in-zamalek/?utm_source=guide#dinner'), '/blog/restaurants-in-zamalek?utm_source=guide#dinner');
assert.equal(canonicalContentHref('/es/guide/suez/suez-temperature-trends'), '/es/guide/suez/clima-en-suez');
assert.equal(canonicalContentHref('/tours/the-grand-islamic-day-tour/'), '/the-grand-islamic-day-tour');
assert.equal(canonicalContentHref('https://travel2egypt.org/es/packages/crucero-por-el-nilo?x=1#dia-2'), '/es/crucero-por-el-nilo?x=1#dia-2');
assert.equal(canonicalContentHref('/tours'), '/tours', 'bare /tours is not a legacy tour URL');
assert.equal(canonicalContentHref('/tours/a/b'), '/tours/a/b', 'nested paths are not tour slugs');
for (const href of [undefined, '', '#section', 'mailto:team@example.com', '/not-reviewed', 'https://example.com/restaurants-in-zamalek/', '//example.com/restaurants-in-zamalek/', 'https://travel2egypt.org.example.com/restaurants-in-zamalek/', '/%invalid']) {
  assert.equal(canonicalContentHref(href), href, `leave unreviewed URL unchanged: ${href}`);
}
const sources = new Map(redirects.map((row) => [row.source, row.destination]));
for (const row of repairs.redirects) {
  assert.equal(sources.get(row.source), row.destination, `audited rule drift: ${row.source}`);
  assert.ok(!sources.has(row.destination), `audited destination became a redirect: ${row.destination}`);
  assert.equal(canonicalContentHref(`https://travel2egypt.org${encodeURI(row.source)}/?ref=test#section`), `${row.destination}?ref=test#section`);
}
for (const route of repairs.restoredRoutes) assert.ok(!sources.has(route), `redirect shadows a live route: ${route}`);
console.log(`Audited content links passed (${repairs.redirects.length} aliases, ${repairs.restoredRoutes.length} restored routes, external URLs unchanged).`);
