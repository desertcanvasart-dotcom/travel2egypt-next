/**
 * Owner decision (10 Nov 2026, "Yes, change all"): Alexander's visit to the
 * Siwa oracle is dated 332 BC site-wide. Changes "331 BC" / "331 a. C." /
 * "紀元前331年" to 332 wherever the mention is about the Siwa visit or oracle.
 * Mentions about the founding of Alexandria (a separate event, kept as 331 BC)
 * are left alone. Published documents and Studio drafts are both updated.
 * Writes a backup and a full change list first.
 * Usage (from the repo root): node scripts/alexander-siwa-332bc.mjs [--apply]
 */
import 'dotenv/config';
import fs from 'node:fs';
import { createClient } from '@sanity/client';

const APPLY = process.argv.includes('--apply');
const c = createClient({ projectId: 'ufallvd2', dataset: 'production', apiVersion: '2024-01-01', useCdn: false, token: process.env.SANITY_PRODUCTION_API_WRITE_TOKEN });

const HIT = /331( ?BC| ?BCE| a\. ?C\.)|紀元前331年/g;
const SIWA = /Siwa|シワ|oracle|oráculo|神託|Amun|Amón|アメン|Aghurmi|Ammon|Zeus|divine legitimacy|legitimidad divina|cross(ed)? the desert|cruzó el desierto|砂漠を越え|primer viaje a Egipto|first trip to Egypt|初めて訪れた/i;
const FOUNDING = /fund(ó|ada|ado|ar|ación)|found(ed|ing|ation)|建設|創建|築|eligió el emplazamiento|chose the site|この地を選んだ|Rhacotis|ラコティス|ラクティス/i;

const docs = await c.fetch(`*[!(_type in ["sanity.imageAsset","sanity.fileAsset"])]`);
const changes = [], kept = [];
let tx = c.transaction(), n = 0;
const backup = [];
for (const doc of docs) {
  let touched = false;
  const walk = (o) => {
    if (Array.isArray(o)) { o.forEach((v, i) => { if (typeof v === 'string') o[i] = fix(v); else walk(v); }); return; }
    if (!o || typeof o !== 'object') return;
    for (const k of Object.keys(o)) {
      if (k.startsWith('_') && k !== '_key') continue;
      if (typeof o[k] === 'string') o[k] = fix(o[k]); else walk(o[k]);
    }
  };
  const fix = (s) => s.replace(HIT, (m, _g, off) => {
    const at = typeof off === 'number' ? off : s.indexOf(m);
    const win = s.slice(Math.max(0, at - 160), at + 120);
    const ctx = win.replace(/\s+/g, ' ');
    // The founding of Alexandria (331 BC) stays: founding wording right around
    // the date marks it, even when the same sentence also mentions Siwa.
    // ("the 1203 founding of Shali" is about Shali, not Alexandria.)
    const near = s.slice(Math.max(0, at - 80), at + 35).replace(/founding of Shali/gi, '');
    if (FOUNDING.test(near) || (!SIWA.test(win) && FOUNDING.test(win))) { kept.push({ id: doc._id, ctx }); return m; }
    touched = true;
    const to = m.replace('331', '332');
    changes.push({ id: doc._id, type: doc._type, from: m, to, ctx });
    return to;
  });
  const copy = JSON.parse(JSON.stringify(doc));
  walk(copy);
  if (!touched) continue;
  backup.push(doc);
  const set = {};
  for (const k of Object.keys(copy)) if (!k.startsWith('_') && JSON.stringify(copy[k]) !== JSON.stringify(doc[k])) set[k] = copy[k];
  tx = tx.patch(c.patch(doc._id).set(set)); n++;
}
fs.mkdirSync('docs/alexander-332bc', { recursive: true });
fs.writeFileSync('docs/alexander-332bc/backup-2026-11-10.json', JSON.stringify(backup, null, 1));
const rows = changes.map((x) => `| \`${x.id}\` | ${x.type} | ${x.from} → ${x.to} | ${x.ctx.replace(/\|/g, '/')} |`);
const keptRows = kept.map((x) => `| \`${x.id}\` | ${x.ctx.replace(/\|/g, '/')} |`);
fs.writeFileSync('docs/alexander-332bc/changes-2026-11-10.md',
  `# Alexander's Siwa visit → 332 BC (10 Nov 2026)\n\nOwner decision: "Yes, change all". ${changes.length} mentions in ${n} documents (published and Studio drafts) changed from 331 to 332. ${kept.length} mentions of the founding of Alexandria are left at 331 BC, because that is a separate event.\n\n## Changed\n\n| Document | Type | Change | Context |\n|---|---|---|---|\n${rows.join('\n')}\n\n## Left at 331 BC (founding of Alexandria)\n\n| Document | Context |\n|---|---|\n${keptRows.join('\n')}\n`);
console.log(`${changes.length} mentions in ${n} documents → 332; ${kept.length} Alexandria-founding mentions kept at 331`);
console.log('changed docs:', [...new Set(changes.map((x) => x.id))].join(', '));
if (APPLY && n) { const r = await tx.commit({ autoGenerateArrayKeys: false }); console.log('committed', r.results.length, 'docs'); }
else console.log('(dry run — pass --apply)');
