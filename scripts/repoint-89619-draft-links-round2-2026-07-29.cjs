/**
 * Round 2 — hand-curated repoints for 9 of the 17 unresolved raw links in
 * drafts.wp-page-89619 (owner-requested 2026-07-29). Each target verified
 * against production Sanity (unique 1:1 topic match) and validated HTTP 200
 * on the dev server before writing. The remaining 8 have no new-site home
 * (topics only exist inside broader pages / off-catalogue West Bank tour).
 *
 * Usage: node <script> --dev-base http://localhost:3000 [--apply]
 */
const fs = require('fs');
const { createClient } = require('@sanity/client');
require('dotenv').config();

const APPLY = process.argv.includes('--apply');
const baseArg = process.argv.indexOf('--dev-base');
const DEV = baseArg > -1 ? process.argv[baseArg + 1] : 'http://localhost:3000';
const ID = 'drafts.wp-page-89619';

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: 'production',
  apiVersion: '2024-12-01',
  token: process.env.SANITY_PRODUCTION_API_WRITE_TOKEN,
  useCdn: false,
});

const CURATED = {
  // legacy ES topic slugs renamed on the new site — resolved via the EN sibling doc
  'https://travel2egypt.org/es/guia-de-viaje-de-el-cairo/bazar-khan-al-khalili/': '/es/guide/el-cairo/khan-el-khalili',
  'https://travel2egypt.org/es/guia-de-viaje-de-el-cairo/sinagoga-ben-ezra/': '/es/guide/el-cairo/la-sinagoga-de-ben-ezra',
  'https://travel2egypt.org/es/guia-de-viaje-de-luxor/templo-de-madinat-habu/': '/es/guide/luxor/medinet-habu',
  'https://travel2egypt.org/es/guia-de-viaje-de-asuan/': '/es/guide/asuan',
  'https://travel2egypt.org/es/propinas-en-egipto/': '/es/travel-tips/propinas-en-egipto-como-funciona-de-verdad-el-baksheesh',
  'https://travel2egypt.org/es/crucero-de-4-dias-por-el-lago-nasser-desde-abu-simble/': '/es/explorador-del-lago-nasser-crucero-de-4-dias-de-abu-simbel-a-asuan',
  'https://travel2egypt.org/es/guia-de-viaje-del-oasis-de-bahariya/sabores-del-oasis-degustacion-del-patrimonio-culinario-del-oasis-de-bahariya/': '/es/guide/bahariya/gastronomia-en-el-oasis-de-bahariya',
  'https://travel2egypt.org/al-gouna-travel-guide/culinary-journey/': '/guide/al-gouna/traditional-food-in-al-gouna',
  // generic dahabiya page → the dahabiya cruise landing
  'http://travel2egypt.org/dahabiya-nile-cruise-2/': '/authentic-dahabiya-nile-cruise',
  // round 3 — resolved via old-site 301 chase to renamed slugs (2026-07-29):
  // "cisjordania" = mistranslated Luxor WEST BANK; old WP 301s to the renamed
  // ES tour URL, whose redirect chain lands on the group day tour below.
  'https://travel2egypt.org/es/10-dias-en-la-ruta-de-los-sonadores-del-nilo/': '/es/nile-dreamer-10-dias-con-el-nilo-como-eje-del-viaje',
  'https://travel2egypt.org/es/guia-de-viaje-de-taba/guia-de-viaje-estacional-de-taba-como-encontrar-el-momento-perfecto-para-visitarla/': '/es/guide/taba/condiciones-climaticas-de-taba',
  'https://travel2egypt.org/es/maravillas-de-cisjordania-el-gran-recorrido-por-cisjordania/': '/es/la-gran-orilla-occidental-de-luxor-excursion-en-grupo',
};

function* rawLinks(node, path) {
  if (!node || typeof node !== 'object') return;
  if (Array.isArray(node)) {
    for (let i = 0; i < node.length; i++) {
      const ch = node[i];
      const seg = ch && typeof ch === 'object' && ch._key ? `[_key=="${ch._key}"]` : `[${i}]`;
      yield* rawLinks(ch, path + seg);
    }
    return;
  }
  if (typeof node.href === 'string' && node.href.includes('travel2egypt.org')) yield { path, href: node.href };
  for (const [k, v] of Object.entries(node)) {
    if (k === 'href') continue;
    yield* rawLinks(v, `${path}.${k}`);
  }
}

async function main() {
  for (const t of [...new Set(Object.values(CURATED))]) {
    const res = await fetch(DEV + t, { redirect: 'follow' });
    console.log(res.status, t);
    if (res.status !== 200) { console.error('ABORT: target not 200 on dev.'); process.exit(1); }
  }
  const draft = await client.getDocument(ID);
  const all = [...rawLinks(draft, '')];
  const hits = all.filter((h) => CURATED[h.href]);
  console.log(`curated hits: ${hits.length}/9 | other raw links in draft: ${all.length - hits.length}`);
  hits.forEach((h) => console.log(' ', h.href, '→', CURATED[h.href]));

  if (!APPLY) { console.log('\nDry run — re-run with --apply.'); return; }

  fs.writeFileSync(__dirname + '/../backups/repoint-89619-draft-links-round2-rollback-2026-07-29.json', JSON.stringify(draft, null, 2));
  let patch = client.patch(ID);
  for (const h of hits) patch = patch.set({ [`${h.path}.href`.replace(/^\./, '')]: CURATED[h.href] });
  await patch.commit();
  console.log('Patched. Verifying…');
  const after = await client.getDocument(ID);
  const remaining = [...rawLinks(after, '')];
  console.log('raw links remaining:', remaining.length, '(expected', all.length - hits.length + ')');
  remaining.forEach((l) => console.log(' ', l.href));
}

main().catch((e) => { console.error(e); process.exit(1); });
