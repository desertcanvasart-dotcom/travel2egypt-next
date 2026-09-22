import assert from 'node:assert/strict';
import { finalizeSitemap } from '../sitemap-policy';
import { redirects } from '../../../migration/redirect-map.generated';

const source = redirects[0].source;
const oldUrl = `https://travel2egypt.org${source}`;
const live = 'https://travel2egypt.org/guide/cairo';
const translated = 'https://travel2egypt.org/es/guide/el-cairo';
const result = finalizeSitemap([
  { url: oldUrl },
  { url: live, alternates: { languages: { en: live, es: translated, ja: oldUrl, 'x-default': live } } },
  { url: translated, alternates: { languages: { en: live, es: translated, ja: 'https://travel2egypt.org/hidden' } } },
]);
assert.deepEqual(result.map((entry) => entry.url), [live, translated]);
assert.deepEqual(result[0].alternates?.languages, { en: live, es: translated, 'x-default': live });
assert.deepEqual(result[1].alternates?.languages, { en: live, es: translated });
const unicode = redirects.find((r) => /[^\x00-\x7f]/.test(r.source));
assert.ok(unicode);
assert.deepEqual(finalizeSitemap([{ url: `https://travel2egypt.org${encodeURI(unicode.source)}` }]), []);
console.log('Sitemap policy passed: redirect sources and absent alternates excluded, live translations preserved.');
