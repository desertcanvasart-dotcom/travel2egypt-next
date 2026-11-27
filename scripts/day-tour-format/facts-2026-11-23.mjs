/**
 * Three site-wide facts, settled by the owner on 23 Nov 2026:
 *   1. Red Pyramid height 105 m (the site said 104 m in 3 documents).
 *   2. Memphis founded around 3100 BC (wp-page-87840 said 3000 BC; every other page already says 3100).
 *   3. The Royal Mummies Hall holds 22 mummies (the page said "twenty" in the essay and gave no number in the day).
 *
 * Only text runs that name the subject (Red Pyramid / Menes / the Royal Mummies Hall) are touched, only the figure
 * changes, and every change is printed. Drafts of the same documents get the same edit. Rollback snapshots first.
 *
 *   node --env-file=<.env> scripts/day-tour-format/facts-2026-11-23.mjs           # dry run
 *   node --env-file=<.env> scripts/day-tour-format/facts-2026-11-23.mjs --apply
 */
import { createClient } from '@sanity/client';
import { writeRollback } from '../lib/content-gates.mjs';

const apply = process.argv.includes('--apply');
const client = createClient({ projectId: 'ufallvd2', dataset: 'production', apiVersion: '2024-01-01', useCdn: false, token: process.env.SANITY_PRODUCTION_API_WRITE_TOKEN ?? process.env.SANITY_API_WRITE_TOKEN });

/** [docIds, subject test on the text run, [[find, replace], ...]] — each find must be present in a run to count. */
const JOBS = [
  {
    name: 'Red Pyramid 104 → 105 m',
    ids: ['guideArticle.giza.the-red-pyramid-of-sneferu', 'tour.memphis-saqqara-and-dahshur-group-day-tour', 'wp-page-69918'],
    subject: /Red Pyramid|Pirámide Roja|pirámide Roja|赤い?ピラミッド/,
    fixes: [[/\b104 (metres|meters|metros)\b/g, '105 $1'], [/104メートル/g, '105メートル']],
  },
  {
    name: 'Memphis 3000 → 3100 BC',
    ids: ['wp-page-87840'],
    subject: /Menes|Menfis|Memphis|メネス|メンフィス/,
    fixes: [[/\b3000 BC\b/g, '3100 BC'], [/\b3000 a\. C\./g, '3100 a. C.'], [/紀元前3000年/g, '紀元前3100年']],
  },
  {
    name: 'Royal mummies: 22',
    ids: ['tour.nmec-royal-mummies-old-cairo'],
    subject: /mummies|momias|ミイラ/i,
    fixes: [
      [/where twenty royal mummies lie/g, 'where twenty-two royal mummies lie'],
      [/Twenty rulers — kings and queens/g, 'Twenty-two rulers — kings and queens'],
      [/donde veinte momias reales reposan/g, 'donde veintidós momias reales reposan'],
      [/Veinte gobernantes —reyes y reinas/g, 'Veintidós gobernantes —reyes y reinas'],
      [/二十体の王家のミイラ/g, '二十二体の王家のミイラ'],
      [/二十名の統治者/g, '二十二名の統治者'],
      [/^The mummies of New Kingdom kings and queens, moved here/g, 'The mummies of New Kingdom kings and queens, twenty-two in all, moved here'],
      [/^Las momias de reyes y reinas del Imperio Nuevo, trasladadas aquí/g, 'Las momias de reyes y reinas del Imperio Nuevo, veintidós en total, trasladadas aquí'],
      [/新王国時代の王や王妃のミイラが、墓を思わせる/g, '新王国時代の王や王妃の22体のミイラが、墓を思わせる'],
    ],
  },
];

const seg = (k, i, o) => (o && typeof o === 'object' && !Array.isArray(o) && o._key ? `[_key=="${o._key}"]` : `[${i}]`);
/** Every [path, string] where the string sits in a text run (key 'text' or 'value' or a plain string field). */
function runs(o, path = '', out = []) {
  if (Array.isArray(o)) o.forEach((x, i) => runs(x, `${path}${typeof x === 'object' && x?._key ? `[_key=="${x._key}"]` : `[${i}]`}`, out));
  else if (o && typeof o === 'object') for (const [k, v] of Object.entries(o)) {
    if (k === '_type' || k === '_id' || k === '_rev' || k === 'source' || k === 'slug' || k === 'migration') continue;
    if (typeof v === 'string') { if (k !== '_key') out.push([path ? `${path}.${k}` : k, v]); } else runs(v, path ? `${path}.${k}` : k, out);
  }
  return out;
}

const plan = [];
for (const job of JOBS) {
  for (const base of job.ids) for (const id of [base, `drafts.${base}`]) {
    const doc = await client.getDocument(id);
    if (!doc) { if (id === base) throw new Error(`${id} not found`); continue; }
    for (const [path, text] of runs(doc)) {
      if (!job.subject.test(text)) continue;
      let after = text;
      for (const [find, to] of job.fixes) after = after.replace(find, to);
      if (after !== text) plan.push({ job: job.name, id, path, before: text, after });
    }
  }
}
const clip = (s, i) => s.slice(Math.max(0, i - 60), i + 80).replace(/\s+/g, ' ');
for (const p of plan) {
  const i = [...p.after].findIndex((ch, k) => ch !== p.before[k]);
  console.log(`${p.job.padEnd(26)} ${p.id.padEnd(58)} ${p.path.slice(0, 60)}\n   − …${clip(p.before, i)}…\n   + …${clip(p.after, i)}…`);
}
const per = {};
for (const p of plan) per[p.job] = (per[p.job] ?? 0) + 1;
console.log('\nchanges by job:', per, ' total', plan.length);
if (!apply) { console.log('dry run (pass --apply to write production)'); process.exit(0); }

const ids = [...new Set(plan.map((p) => p.id))];
await writeRollback(client, ids, 'facts-2026-11-23');
const tx = client.transaction();
for (const p of plan) tx.patch(p.id, (q) => q.set({ [p.path]: p.after }));
await tx.commit();
console.log(`APPLIED: ${plan.length} text runs in ${ids.length} documents`);
