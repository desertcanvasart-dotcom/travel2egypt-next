/**
 * Fix round 3 — content for Task B (Cairo guide meta/intro) and Task C
 * (priced tour blocks on the Cairo guide and /blog/egypt-package-deals).
 * The fields are new (round-3 code renders them), so writing early is safe.
 * Dry run by default; --write to apply. Backups → backups/round3-<id>.json
 */
import 'dotenv/config';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { createClient } from '@sanity/client';

const c = createClient({ projectId: 'ufallvd2', dataset: 'production', apiVersion: '2024-01-01', useCdn: false, token: process.env.SANITY_PRODUCTION_API_WRITE_TOKEN });
const write = process.argv.includes('--write');
const k = () => crypto.randomBytes(6).toString('hex');
const i18n = (type, m) => Object.entries(m).map(([lang, value]) => ({ _key: lang, _type: type, value }));
const str = (m) => i18n('internationalizedArrayStringValue', m);
const txt = (m) => i18n('internationalizedArrayTextValue', m);

async function refsBySlug(slugs) {
  const rows = await c.fetch(`*[_type=="tour" && !(_id in path("drafts.**")) && slug[_key=="en"][0].value.current in $slugs]{_id, "s": slug[_key=="en"][0].value.current, priceFrom}`, { slugs });
  return slugs.map((s) => {
    const r = rows.find((x) => x.s === s);
    if (!r) throw new Error(`product not found: ${s}`);
    if (!(r.priceFrom > 0)) throw new Error(`product has no price: ${s}`);
    return { _key: k(), _type: 'reference', _ref: r._id };
  });
}

// ---- Cairo guide (city doc, all locales in one document)
const CAIRO = 'wp-page-83284';
const cairoSet = {
  seo: {
    _type: 'seo',
    metaTitle: str({
      en: 'Cairo Travel Guide: Where to Go & How Long to Stay | Travel2Egypt',
      es: 'Guía de El Cairo: qué ver y cuántos días quedarse | Travel2Egypt',
      ja: 'カイロ旅行ガイド：見どころと滞在日数の目安 | Travel2Egypt',
    }),
  },
  seoDescription: txt({
    en: 'Cairo travel guide from local guides: Islamic and Coptic Cairo, Downtown, the Grand Egyptian Museum, how many days you need, and how to get around.',
    es: 'Guía de El Cairo escrita por guías locales: El Cairo islámico y copto, el centro, el Gran Museo Egipcio, cuántos días hacen falta y cómo moverse.',
    ja: '現地ガイドによるカイロ旅行ガイド。イスラーム地区とコプト地区、ダウンタウン、大エジプト博物館、必要な日数、市内の移動手段まで。',
  }),
  dek: txt({
    en: 'Several cities pressed into one: where to go in Cairo, how long to give it, and how to get around.',
    es: 'Varias ciudades en una: qué ver en El Cairo, cuánto tiempo dedicarle y cómo moverse.',
    ja: 'いくつもの都市が重なり合う街、カイロ。どこを訪ね、何日かけ、どう移動するか。',
  }),
  inlineTours: await refsBySlug(['pyramids-of-giza-and-grand-egyptian-museum', 'private-tour-memphis-saqqara-citadel-and-khan-el-khalili-bazaar', 'islamic-cairo-day-tour']),
  inlineAfterHeading: str({ en: 'How Long To Stay', es: '■ Cuánto tiempo quedarse', ja: '■ 滞在日数' }),
  inlineHeading: str({ en: 'Three ways to spend a day in Cairo with a guide', es: 'Tres formas de pasar un día en El Cairo con guía', ja: 'ガイドと過ごすカイロの1日、3つのプラン' }),
  endTours: await refsBySlug(['4-day-history-culture-escape', '4-days-city-break', 'cairo-alexandria-city-break-5-days']),
  endHeading: str({ en: 'Make Cairo the trip', es: 'Haga de El Cairo el viaje', ja: 'カイロを旅の主役に' }),
};

// ---- /blog/egypt-package-deals (one article document per language)
const pkg = await refsBySlug(['epic-egyptian-escape-a-7-day-adventure-from-pyramids-to-pharaohs', '10-days-nile-dreamer-tour-experience', '10-day-egypt-travel-journey-through-history']);
const BLOG = {
  'wp-post-153058-en': { inlineAfterHeading: 'How many days', inlineHeading: 'Three packages, three trip lengths', endHeading: 'Start from one of these and change anything' },
  'wp-post-154308-es': { inlineAfterHeading: 'Cuántos días hacen falta', inlineHeading: 'Tres paquetes, tres duraciones de viaje', endHeading: 'Empiece por uno de estos y cambie lo que quiera' },
  'wp-post-167192-ja': { inlineAfterHeading: '何日必要か', inlineHeading: '3つのパッケージ、3つの旅の長さ', endHeading: 'ここから選んで、自由にアレンジ' },
};

console.log('Cairo city', CAIRO, Object.keys(cairoSet).join(', '));
for (const [id, v] of Object.entries(BLOG)) console.log('blog', id, JSON.stringify(v));
if (write) {
  fs.mkdirSync('backups', { recursive: true });
  const cairo = await c.fetch(`*[_id==$id][0]`, { id: CAIRO });
  fs.writeFileSync(`backups/round3-${CAIRO}.json`, JSON.stringify(cairo, null, 2));
  await c.patch(CAIRO).set(cairoSet).commit({ autoGenerateArrayKeys: true });
  console.log('patched', CAIRO);
  for (const [id, v] of Object.entries(BLOG)) {
    const d = await c.fetch(`*[_id==$id][0]`, { id });
    fs.writeFileSync(`backups/round3-${id}.json`, JSON.stringify(d, null, 2));
    const refs = (arr) => arr.map((r) => ({ ...r, _key: k() }));
    await c.patch(id).set({ ...v, inlineTours: refs(pkg), endTours: refs(pkg) }).commit();
    console.log('patched', id);
  }
} else console.log('dry run — pass --write');
