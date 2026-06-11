/**
 * Entity-wrap no-injection test (jsdom). Proves the post-processor's DOM-ops
 * wrapping cannot introduce markup from map data: the href is set via
 * setAttribute and the anchor text is the agent's own text via textContent —
 * neither is ever parsed as HTML. Assertions are DOM-level (re-parse the output
 * and look for real elements), not string matching. Run:
 *   `npx tsx src/lib/linkMap/__tests__/wrap.test.ts`
 */
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error - jsdom ships no bundled types (test-only dependency)
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!doctype html><body></body>');
(globalThis as { document?: unknown }).document = dom.window.document;
(globalThis as { NodeFilter?: unknown }).NodeFilter = dom.window.NodeFilter;

import { wrapEntities } from '@/lib/concierge/markdown';
import type { LinkMapEntry } from '@/lib/linkMap/resolve';

let pass = 0;
let fail = 0;
function ok(cond: boolean, label: string) {
  if (cond) pass++;
  else {
    fail++;
    console.log(`FAIL: ${label}`);
  }
}

const doc = dom.window.document;
function render(htmlIn: string, entries: LinkMapEntry[]): HTMLElement {
  const tpl = doc.createElement('template');
  tpl.innerHTML = htmlIn; // already-sanitized input in production
  wrapEntities(tpl.content, entries);
  // Re-parse the serialized output the way the browser would on innerHTML.
  const host = doc.createElement('div');
  host.innerHTML = tpl.innerHTML;
  return host;
}

const MALICIOUS_URL = '/wiki/monuments/x"><script>alert(1)</script>';

// 1) A malicious URL in the map must not create a live <script> element.
const r1 = render('<p>Visit Kom Ombo &amp; the Nubian Museum.</p>', [
  { canonicalName: 'Kom Ombo', aliases: [], url: MALICIOUS_URL },
  { canonicalName: 'Nubian Museum', aliases: [], url: '/wiki/monuments/nubian' },
]);
ok(r1.querySelectorAll('script').length === 0, 'no <script> ELEMENT created from a malicious url');
const kom = [...r1.querySelectorAll('a')].find((a) => a.textContent === 'Kom Ombo');
ok(!!kom, 'entity wrapped in an anchor');
ok(kom?.getAttribute('href') === MALICIOUS_URL, 'malicious url is the literal href value (trapped in the attribute)');
ok(kom?.getAttribute('rel') === 'noopener noreferrer' && kom?.getAttribute('target') === '_blank', 'anchor has rel + target');
ok([...r1.querySelectorAll('a')].some((a) => a.getAttribute('href') === '/wiki/monuments/nubian'), 'normal link intact');

// 2) Special chars in the MATCHED (agent) text round-trip as escaped text.
const r2 = render('<p>See Foo &amp; Bar today.</p>', [
  { canonicalName: 'Foo & Bar', aliases: [], url: '/wiki/monuments/y' },
]);
const foo = [...r2.querySelectorAll('a')].find((a) => a.getAttribute('href') === '/wiki/monuments/y');
ok(!!foo, 'special-char entity still links');
ok(foo?.textContent === 'Foo & Bar', 'anchor text is the agent text, intact and not parsed as markup');
ok(r2.querySelectorAll('script, img').length === 0, 'no stray elements introduced');

// 3) Existing links are left untouched; plain-text entities still wrap.
const r3 = render('<p><a href="/somewhere">click here</a> to see Kom Ombo.</p>', [
  { canonicalName: 'Kom Ombo', aliases: [], url: '/wiki/monuments/kom-ombo' },
]);
const existing = [...r3.querySelectorAll('a')].find((a) => a.textContent === 'click here');
ok(existing?.getAttribute('href') === '/somewhere' && !existing.getAttribute('rel'), 'existing link untouched (no rel added inside it)');
ok([...r3.querySelectorAll('a')].some((a) => a.getAttribute('href') === '/wiki/monuments/kom-ombo'), 'plain-text entity wrapped');

console.log(`\nlink-map wrap (no-injection): ${pass} passed, ${fail} failed`);
if (fail) process.exit(1);
