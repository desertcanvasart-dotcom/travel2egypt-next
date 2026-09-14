/**
 * Repoint the 61 raw travel2egypt.org markDef hrefs in drafts.wp-page-89619
 * (owner-requested 2026-07-29; drafts were out of scope for the corpus sweep).
 *
 * Resolution order (same as the 2026-07-17 sweep): redirect-map row >
 * migration.wpUrl exact > unique per-locale slug > old-site 301 chase.
 * Every distinct target is validated (final HTTP 200, redirects followed)
 * against the local dev server before anything is written. Unresolved URLs
 * are left untouched and reported. href strings only, _key-addressed.
 *
 * Usage: node <script> [--apply] [--dev-base http://localhost:PORT]
 */
const fs = require('fs');
const { createClient } = require('@sanity/client');
require('dotenv').config();

const APPLY = process.argv.includes('--apply');
const baseArg = process.argv.indexOf('--dev-base');
const DEV = baseArg > -1 ? process.argv[baseArg + 1] : 'http://localhost:51116';
const ID = 'drafts.wp-page-89619';

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: 'production',
  apiVersion: '2024-12-01',
  token: process.env.SANITY_PRODUCTION_API_WRITE_TOKEN,
  useCdn: false,
});

function norm(u) {
  let s = String(u).trim();
  s = s.replace(/^https?:\/\/(www\.)?travel2egypt\.org/i, '');
  s = s.split('#')[0].split('?')[0];
  try { s = decodeURIComponent(s); } catch {}
  if (!s.startsWith('/')) s = '/' + s;
  if (s.length > 1 && s.endsWith('/')) s = s.slice(0, -1);
  return s.toLowerCase();
}
const urlLocale = (p) => (p.startsWith('/es/') || p === '/es') ? 'es' : (p.startsWith('/ja/') || p === '/ja') ? 'ja' : 'en';

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

function routeFor(doc, locale) {
  const slugFor = (locKey) => (doc.slugs || []).find((s) => s._key === locKey)?.current;
  const pick = () => slugFor(locale) || slugFor('en');
  const prefix = locale === 'en' ? '' : `/${locale}`;
  const citySlug = () =>
    (doc.citySlugs || []).find((s) => s._key === locale)?.current ||
    (doc.citySlugs || []).find((s) => s._key === 'en')?.current;
  switch (doc._type) {
    case 'guideArticle': { const c = citySlug(); const s = pick(); return c && s ? `${prefix}/guide/${c}/${s}` : null; }
    case 'city': { const s = pick(); return s ? `${prefix}/guide/${s}` : null; }
    case 'tour': case 'tourLanding': case 'editorialPage': { const s = pick(); return s ? `${prefix}/${s}` : null; }
    case 'travelTip': { const s = pick(); return s ? `${prefix}/travel-tips/${s}` : null; }
    case 'nileCruise': { const s = pick(); return s ? `${prefix}/nile-cruises/${s}` : null; }
    case 'hotel': { const s = pick(); return s ? `${prefix}/hotels/${s}` : null; }
    case 'article': { const s = doc.flatSlug; return s ? `${prefix}/blog/${s}` : null; }
    default: return null;
  }
}

async function probeOldSite(path) {
  try {
    const res = await fetch('https://travel2egypt.org' + path + '/', { method: 'HEAD', redirect: 'manual' });
    if (res.status === 301 || res.status === 308) {
      const loc = res.headers.get('location') || '';
      if (/travel2egypt\.org/.test(loc)) return norm(loc);
    }
  } catch {}
  return null;
}

async function validateTarget(path) {
  try {
    const res = await fetch(DEV + path, { redirect: 'follow' });
    return res.status;
  } catch (e) { return 'ERR:' + e.message; }
}

async function main() {
  const draft = await client.getDocument(ID);
  if (!draft) { console.error('ABORT: draft gone.'); process.exit(1); }
  console.log('draft _updatedAt:', draft._updatedAt);

  const links = [...rawLinks(draft, '')];
  console.log('raw links found:', links.length);

  // redirect map
  const csv = fs.readFileSync(__dirname + '/../migration/redirect-map.csv', 'utf8');
  const mapFrom = new Map();
  for (const line of csv.split('\n').slice(1)) {
    const cols = line.split(',');
    if (cols[0] && cols[1]) mapFrom.set(norm(cols[0]), cols[1]);
  }

  // Sanity lookups
  const docs = await client.fetch(`
    *[!(_id in path('drafts.**')) && _type in ['guideArticle','city','tour','tourLanding','editorialPage','travelTip','nileCruise','hotel','article'] && hidden != true]{
      _id, _type, "wpUrl": migration.wpUrl,
      "slugs": slug[]{_key, "current": value.current},
      "flatSlug": slug.current, "language": language,
      "citySlugs": parentCity->slug[]{_key, "current": value.current}
    }`);
  const byWp = new Map(); const bySlug = new Map();
  for (const d of docs) {
    if (d.wpUrl) { const k = norm(d.wpUrl); (byWp.get(k) || byWp.set(k, []).get(k)).push(d); }
    for (const s of d.slugs || []) {
      if (!s.current) continue;
      const k = `${s._key}:${s.current.toLowerCase()}`;
      (bySlug.get(k) || bySlug.set(k, []).get(k)).push(d);
    }
    if (d.flatSlug) {
      const k = `${d.language || 'en'}:${d.flatSlug.toLowerCase()}`;
      (bySlug.get(k) || bySlug.set(k, []).get(k)).push(d);
    }
  }

  // Resolve each distinct URL
  const distinct = [...new Set(links.map((l) => l.href))];
  const resolution = new Map(); // href -> {to, method} | null
  for (const href of distinct) {
    const p = norm(href);
    const loc = urlLocale(p);
    let to = null, method = null;
    if (mapFrom.has(p)) { to = mapFrom.get(p); method = 'redirectMap'; }
    else if (byWp.has(p)) {
      const cands = byWp.get(p);
      const byLang = cands.length > 1 ? cands.filter((c) => (c.language || 'en') === loc) : cands;
      if (byLang.length === 1) { to = routeFor(byLang[0], loc); method = 'wpUrl'; }
    }
    if (!to) {
      const seg = p.split('/').filter(Boolean).pop();
      const cands = [...new Map((bySlug.get(`${loc}:${seg}`) || []).map((c) => [c._id, c])).values()];
      if (cands.length === 1) { to = routeFor(cands[0], loc); method = 'slug'; }
    }
    if (!to) {
      const chased = await probeOldSite(p);
      if (chased && chased !== p) {
        if (mapFrom.has(chased)) { to = mapFrom.get(chased); method = 'oldSite301+map'; }
        else {
          const seg = chased.split('/').filter(Boolean).pop();
          const loc2 = urlLocale(chased);
          const cands = [...new Map((bySlug.get(`${loc2}:${seg}`) || []).map((c) => [c._id, c])).values()];
          if (cands.length === 1) { to = routeFor(cands[0], loc2); method = 'oldSite301+slug'; }
        }
      }
    }
    resolution.set(href, to ? { to, method } : null);
  }

  // Validate distinct targets on dev
  const targets = [...new Set([...resolution.values()].filter(Boolean).map((r) => r.to))];
  console.log('validating', targets.length, 'distinct targets against', DEV, '…');
  const status = new Map();
  for (const t of targets) status.set(t, await validateTarget(t));
  const bad = [...status.entries()].filter(([, s]) => s !== 200);
  if (bad.length) { console.log('\nTargets failing validation (their links will be HELD):'); bad.forEach(([t, s]) => console.log(' ', s, t)); }

  // Plan
  const plan = []; const held = [];
  for (const l of links) {
    const r = resolution.get(l.href);
    if (r && status.get(r.to) === 200) plan.push({ path: `${l.path}.href`.replace(/^\./, ''), old: l.href, to: r.to, method: r.method });
    else held.push({ href: l.href, reason: r ? `target ${r.to} → ${status.get(r.to)}` : 'UNRESOLVED' });
  }
  const byMethod = plan.reduce((m, p) => ((m[p.method] = (m[p.method] || 0) + 1), m), {});
  console.log(`\nRepoint plan: ${plan.length}/${links.length} links | by method:`, JSON.stringify(byMethod));
  for (const p of plan) console.log('  ', norm(p.old), '→', p.to, `(${p.method})`);
  if (held.length) { console.log('\nHELD (untouched):'); held.forEach((h) => console.log(' ', h.href, '—', h.reason)); }

  if (!APPLY) { console.log('\nDry run — re-run with --apply.'); return; }

  fs.writeFileSync(__dirname + '/../backups/repoint-89619-draft-links-rollback-2026-07-29.json', JSON.stringify(draft, null, 2));
  let patch = client.patch(ID);
  for (const p of plan) patch = patch.set({ [p.path]: p.to });
  await patch.commit();
  console.log('Patched. Verifying…');

  const after = await client.getDocument(ID);
  const remaining = [...rawLinks(after, '')];
  console.log('raw links remaining:', remaining.length, '(expected', held.length + ')');
  remaining.forEach((l) => console.log(' ', l.href));
}

main().catch((e) => { console.error(e); process.exit(1); });
