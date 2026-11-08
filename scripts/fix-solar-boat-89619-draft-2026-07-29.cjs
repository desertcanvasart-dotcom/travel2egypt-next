/**
 * Solar Boat stale-claim fix for drafts.wp-page-89619 (owner-requested
 * 2026-07-29, follow-up to the 8-tour published fix).
 *
 * The owner's WIP rewrite has NO GEM stop anywhere (day-9 = "The Giza
 * Pyramids and Vibrant Cairo Markets"), so — Elegant Cairo precedent —
 * the "tour of the Solar Boat Museum" visit promise is REMOVED from the
 * day-9 morning entry in all 3 locales, not rewritten into a GEM visit
 * the itinerary doesn't include. Draft only; published already fixed.
 *
 * Usage: node <script> [--apply]
 */
const fs = require('fs');
const { createClient } = require('@sanity/client');
require('dotenv').config();

const APPLY = process.argv.includes('--apply');
const ID = 'drafts.wp-page-89619';
const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: 'production',
  apiVersion: '2024-12-01',
  token: process.env.SANITY_PRODUCTION_API_WRITE_TOKEN,
  useCdn: false,
});

const EN_BASE = 'days[_key=="day-9"].morning[_key=="en"].value[_key=="000000000004"]';
const ES_BASE = 'days[_key=="day-9"].morning[_key=="es"].value[_key=="00000000000b"]';
const JA_BASE = 'days[_key=="day-9"].morning[_key=="ja"].value[_key=="000000000007"]';

const EN_OLD = ", the last surviving wonder of the ancient world. As you gaze up at the towering structures, the sheer scale and historical depth are bound to leave you in awe. Enhance your visit with a tour of the Solar Boat Museum, where you'll see the remarkably preserved vessel intended to carry the pharaoh into the afterlife.";
const EN_NEW = ', the last surviving wonder of the ancient world. As you gaze up at the towering structures, the sheer scale and historical depth are bound to leave you in awe.';
const JA_OLD = 'から。目の前にそびえ立つ巨大な構造物を見上げながら、その壮大さと歴史の重みに圧倒されることでしょう。さらに、ファラオの来世への旅を支えた神秘的な遺産、';
const JA_NEW = 'から。目の前にそびえ立つ巨大な構造物を見上げながら、その壮大さと歴史の重みに圧倒されることでしょう。';

async function main() {
  const draft = await client.getDocument(ID);
  if (!draft) { console.error('ABORT: draft no longer exists.'); process.exit(1); }
  console.log('draft _updatedAt:', draft._updatedAt, '(expected 2026-07-18T00:18:10Z — abort if newer and re-inspect)');
  if (draft._updatedAt !== '2026-07-18T00:18:10Z') {
    console.error('ABORT: draft changed since inspection — re-verify block structure first.');
    process.exit(1);
  }

  const day9 = draft.days.find((x) => x._key === 'day-9');
  const en = day9.morning.find((m) => m._key === 'en').value.find((b) => b._key === '000000000004');
  const es = day9.morning.find((m) => m._key === 'es').value.find((b) => b._key === '00000000000b');
  const ja = day9.morning.find((m) => m._key === 'ja').value.find((b) => b._key === '000000000007');

  const enSpan = en.children.find((s) => s._key === '000000000003');
  const jaSpan = ja.children.find((s) => s._key === '000000000004');
  if (enSpan.text !== EN_OLD) { console.error('ABORT: EN span text drifted.'); process.exit(1); }
  if (jaSpan.text !== JA_OLD) { console.error('ABORT: JA span text drifted.'); process.exit(1); }
  const esKeys = es.children.map((s) => s._key).join(',');
  if (!esKeys.includes('000000000006,000000000007,000000000009,00000000000a')) {
    console.error('ABORT: ES span layout drifted:', esKeys); process.exit(1);
  }

  const sets = {
    [`${EN_BASE}.children[_key=="000000000003"].text`]: EN_NEW,
    [`${JA_BASE}.children[_key=="000000000004"].text`]: JA_NEW,
  };
  const unsets = [
    // ES: trailing "\n" + "Mejora tu visita…" + linked "Museo de la Barca Solar" + tail
    `${ES_BASE}.children[_key=="000000000006"]`,
    `${ES_BASE}.children[_key=="000000000007"]`,
    `${ES_BASE}.children[_key=="000000000009"]`,
    `${ES_BASE}.children[_key=="00000000000a"]`,
    `${ES_BASE}.markDefs[_key=="000000000008"]`, // the boat-museum link
    // JA: "太陽の船博物館" strong span + "を訪れ…" tail
    `${JA_BASE}.children[_key=="000000000005"]`,
    `${JA_BASE}.children[_key=="000000000006"]`,
  ];

  console.log('sets:', Object.keys(sets).length, '| unsets:', unsets.length, '(one combined unset call)');
  if (!APPLY) { console.log('Dry run OK — re-run with --apply.'); return; }

  fs.writeFileSync(__dirname + '/../backups/solar-boat-89619-draft-rollback-2026-07-29.json', JSON.stringify(draft, null, 2));
  await client.patch(ID).set(sets).unset(unsets).commit();
  console.log('Patched. Verifying…');

  const after = await client.getDocument(ID);
  const s = JSON.stringify(after);
  const stale = (s.match(/Solar Boat|Barca Solar|Barco Solar|太陽の船/gi) || []);
  console.log('remaining boat mentions in draft:', stale.length, stale);
  const d9 = after.days.find((x) => x._key === 'day-9');
  for (const loc of ['en', 'es', 'ja']) {
    const m = d9.morning.find((x) => x._key === loc);
    console.log(loc.toUpperCase() + ':', m.value.map((b) => (b.children || []).map((sp) => sp.text).join('')).join(' | '));
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
