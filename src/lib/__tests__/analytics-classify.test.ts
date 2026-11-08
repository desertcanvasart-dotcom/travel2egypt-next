/**
 * classifyLink — which clicked links count as conversions.
 * Run: npx tsx src/lib/__tests__/analytics-classify.test.ts
 */
import assert from 'node:assert/strict';
import { classifyLink } from '../analytics';

const page = 'https://travel2egypt.org/es/guide/luxor';
const ev = (href: string) => classifyLink(href, page)?.event ?? null;

assert.equal(ev('https://wa.me/201551772258'), 'whatsapp_click');
assert.equal(ev('https://wa.me/201551772258?text=Hola%20ref%20ABC'), 'whatsapp_click');
assert.equal(
  classifyLink('https://wa.me/201551772258?text=ref%20ABC', page)?.params.link_url,
  'https://wa.me/201551772258',
  'prefilled text (may carry session ref) is stripped'
);
assert.equal(ev('https://api.whatsapp.com/send?phone=2015'), 'whatsapp_click');
assert.equal(ev('whatsapp://send?phone=2015'), 'whatsapp_click');
assert.equal(ev('mailto:info@travel2egypt.org?subject=Hi'), 'email_click');
assert.equal(classifyLink('mailto:a@b.c?subject=x', page)?.params.link_url, 'mailto:a@b.c');
assert.equal(ev('MAILTO:a@b.c'), 'email_click');
assert.equal(ev('tel:+20225758925'), 'phone_click');
assert.equal(ev('/plan-your-tour'), 'plan_tour_click');
assert.equal(ev('/es/plan-your-tour?tour=luxor-day'), 'plan_tour_click');
assert.equal(classifyLink('/plan-your-tour?tour=x', page)?.params.tour, 'x');
assert.equal(ev('https://travel2egypt.org/ja/plan-your-tour/'), 'plan_tour_click');
assert.equal(ev('https://evil.example/plan-your-tour'), null, 'other origins are not concierge entries');
assert.equal(ev('/plan-your-tour-guide'), null);
assert.equal(ev('/contact'), null);
assert.equal(ev('https://www.whatsapp.com/'), null, 'WhatsApp homepage is not a chat');
assert.equal(ev(''), null);
assert.equal(ev('#top'), null);

console.log('analytics-classify: all assertions passed');
