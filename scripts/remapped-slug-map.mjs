#!/usr/bin/env node
/**
 * Phase 3 Batch 1b — explicit corpus-slug → Sanity-slug map for the title-matched
 * voids (hotels + cruises). READ-ONLY: validates each pairing by printing Sanity EN
 * name vs corpus ES title + confidence. NO writes. For human sign-off before import.
 */
import { createClient } from '@sanity/client';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
const env = Object.fromEntries(fs.readFileSync('.env', 'utf8').split('\n').filter((l) => l.includes('=') && !l.trim().startsWith('#')).map((l) => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; }));
const c = createClient({ projectId: env.NEXT_PUBLIC_SANITY_PROJECT_ID, dataset: env.NEXT_PUBLIC_SANITY_DATASET, apiVersion: '2024-12-01', token: env.SANITY_STAGING_API_WRITE_TOKEN, useCdn: false, perspective: 'published' });
const HOME = os.homedir();

// sanitySlug -> { corpus: <corpus frontmatter slug>, conf: 'HIGH'|'AMBIGUOUS' }
const MAP = {
  hotel: {
    'sharm-el-sheikh-fayrouz-resort': { corpus: 'fayrouz-resort-sharm-el-sheikh', conf: 'HIGH' },
    'renaissance-sharm-el-sheikh-resort': { corpus: 'renaissance-sharm-el-sheikh', conf: 'HIGH' },
    'cairo-marriott-hotel-and-omar-khayyam-casino': { corpus: 'cairo-marriott-hotel-casino', conf: 'HIGH' },
    'maritim-jolie-ville-kings-island-luxor': { corpus: 'maritim-jolie-ville-kings-island-hotel', conf: 'HIGH' },
    'cairo-hotel-pyramids': { corpus: 'cairo-pyramids-hotel', conf: 'HIGH' },
    'hurghada-marriott-red-sea-resort': { corpus: 'hurghada-marriott-resort', conf: 'HIGH' },
    'marriott-mena-house-hotel-cairo': { corpus: 'marriott-mena-house-hotel', conf: 'HIGH' },
    'hilton-alexandria-corniche-hotel': { corpus: 'hilton-alexandria-corniche', conf: 'HIGH' },
    'helnan-palestine-hotel-alexandria': { corpus: 'helnan-royal-palestine-hotel-montazah-gardens', conf: 'HIGH' },
    'the-four-seasons-hotel-san-stephano': { corpus: 'the-four-seasons-san-stefano', conf: 'HIGH' },
    'royal-maxim-palace-kempinski-cairo': { corpus: 'royal-maxim-palace-kempinski', conf: 'HIGH' },
    'four-seasons-hotel-cairo-nile-plaza': { corpus: 'four-seasons-nile-plaza-hotel', conf: 'HIGH' },
    'four-seasons-hotel-cairo-first-residence': { corpus: 'four-seasons-first-residence', conf: 'HIGH' },
    'westin-cairo-golf-resort-and-spa': { corpus: 'westin-cairo-golf-resort-spa', conf: 'HIGH' },
    'badawiya-hotel-el-dakhla-oasis': { corpus: 'badawiya-dakhla-hotel', conf: 'HIGH' },
    'sol-y-mar-pioneers-hotel-al-kharga-oasis': { corpus: 'sol-y-mar-pioneers-al-kharga', conf: 'HIGH' },
    'steigenberger-nile-palace-luxor-hotel': { corpus: 'steigenberger-nile-palace-hotel', conf: 'HIGH' },
    'movenpick-resort-spa-el-gouna': { corpus: 'm-venpick-resort-spa-el-gouna', conf: 'HIGH' },
    'the-nile-ritz-carlton': { corpus: 'the-nile-ritz-carlton-hotel', conf: 'HIGH' },
    'movenpick-resort-aswan': { corpus: 'm-venpick-resort-aswan', conf: 'HIGH' },
    'sunrise-montemare-resort': { corpus: 'sunrise-montemare-resort-grand-select', conf: 'AMBIGUOUS' },
    'the-cascades-soma-bay': { corpus: 'the-westin-soma-bay-golf-resort-spa', conf: 'AMBIGUOUS' },
  },
  nileCruise: {
    'swiss-inn-radamis-ii-nile-cruise': { corpus: 'swiss-inn-radamis-ii', conf: 'HIGH' },
    'm-s-amwaj-livingstone-nile-cruise': { corpus: 'm-s-amwaj-livingstone', conf: 'HIGH' },
    'sonesta-amirat-dahabiya': { corpus: 'amirat-dahabiya', conf: 'HIGH' },
    'nour-el-nil-meroe-dahabiya': { corpus: 'meroe-dahabiya', conf: 'HIGH' },
    'movenpick-prince-abbas-cruise': { corpus: 'm-venpick-prince-abbas', conf: 'HIGH' },
    'm-s-steigenberger-omar-el-khayam': { corpus: 'm-s-omar-el-khayam', conf: 'HIGH' },
    'm-s-steigenberger-minerva-nile-cruise': { corpus: 'm-s-minerva-nile-cruise', conf: 'HIGH' },
    'm-s-sonesta-st-george-nile-cruise': { corpus: 'm-s-sonesta-st-george', conf: 'HIGH' },
    'movenpick-ms-hamees-nile-cruise': { corpus: 'm-venpick-m-s-hamees', conf: 'HIGH' },
    'movenpick-ms-darakum-nile-cruise': { corpus: 'm-venpick-m-s-darakum', conf: 'HIGH' },
    'movenpick-ms-royal-lotus-nile-cruise': { corpus: 'm-venpick-m-s-royal-lotus', conf: 'HIGH' },
    'movenpick-ms-sun-ray-nile-cruise': { corpus: 'm-venpick-m-s-sun-ray', conf: 'HIGH' },
    'm-s-steigenberger-legacy-nile-cruise': { corpus: 'steigenberger-legacy-nile-cruise', conf: 'HIGH' },
    'm-s-alexander-the-great-nile-cruise': { corpus: 'y-s-alexander-the-great', conf: 'HIGH' },
    'm-s-sonesta-star-goddess-nile-cruise': { corpus: 'm-s-sonesta-star-goddess', conf: 'HIGH' },
    'movenpick-sb-feddya-dahabiya': { corpus: 'sb-feddya-dahabiya', conf: 'HIGH' },
    'm-s-mayfair': { corpus: 'm-s-mayfair-nile-cruise', conf: 'HIGH' },
    'adelaide-dahabiya': { corpus: 'adela-de-dahabiya', conf: 'HIGH' },
    'nour-el-nil-assouan-dahabiya': { corpus: 'nour-el-nil-assouan', conf: 'AMBIGUOUS' },
    'el-nil-dahabiya': { corpus: 'nour-el-nil-dahabiya', conf: 'AMBIGUOUS' },
  },
};

const DIRS = { hotel: path.join(HOME, 'Downloads/All 3 langs/es/hotels'), nileCruise: path.join(HOME, 'Downloads/All 3 langs/es/cruises') };
const norm = (s) => (s || '').toLowerCase().replace(/^0+/, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
function parseFm(file) { const txt = fs.readFileSync(file, 'utf8'); const fm = (txt.match(/^---\n([\s\S]*?)\n---/) || [])[1] || ''; const get = (k) => { const m = fm.match(new RegExp('^' + k + ':\\s*(.*)$', 'm')); return m ? (m[1].trim().replace(/^["']|["']$/g, '').trim() || null) : null; }; return { slug: get('slug'), title: get('title'), description: get('description') }; }
function indexDir(dir) { const o = {}; for (const f of fs.readdirSync(dir)) { if (!f.endsWith('.md')) continue; const fm = parseFm(path.join(dir, f)); if (fm.slug) o[norm(fm.slug)] = { ...fm, fname: f }; } return o; }
const idx = { hotel: indexDir(DIRS.hotel), nileCruise: indexDir(DIRS.nileCruise) };

for (const [type, label] of [['hotel', 'HOTELS'], ['nileCruise', 'CRUISES']]) {
  console.log(`\n##################### ${label} #####################`);
  const slugs = Object.keys(MAP[type]);
  const enNames = await c.fetch(`*[_type==$type && !(_id in path("drafts.**")) && slug[_key=="en"][0].value.current in $s]{"slug":slug[_key=="en"][0].value.current,"en":name[_key=="en"][0].value}`, { type, s: slugs });
  const enBySlug = Object.fromEntries(enNames.map((d) => [d.slug, d.en]));
  for (const conf of ['HIGH', 'AMBIGUOUS']) {
    const rows = slugs.filter((s) => MAP[type][s].conf === conf);
    console.log(`\n----- ${conf} (${rows.length}) -----`);
    for (const s of rows) {
      const m = MAP[type][s];
      const rec = idx[type][norm(m.corpus)];
      const ok = rec ? '✓file' : '✗MISSING-FILE';
      console.log(`• ${s}\n   Sanity EN : ${enBySlug[s] || '(NOT FOUND IN SANITY)'}\n   corpus    : ${m.corpus}  [${ok}]\n   ES title  : ${rec ? rec.title : '—'}`);
    }
  }
}
console.log('\n[READ-ONLY] map only — no writes.');
