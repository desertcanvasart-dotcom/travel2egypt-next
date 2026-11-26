/**
 * Karnak Sound & Light: the owner's answers to the two open items (22 Nov): a child is under 12, and
 * students need a valid student card on the night. Panel row label + one "Worth knowing" line, EN/ES/JA.
 *
 *   node --env-file=<.env> scripts/day-tour-format/karnak-child-student-2026-11-22.mjs [--apply]
 */
import { createClient } from '@sanity/client';
import { writeRollback } from '../lib/content-gates.mjs';

const ID = 'tour.sound-light-show-at-karnak-temple-in-luxor';
const client = createClient({ projectId: 'ufallvd2', dataset: 'production', apiVersion: '2024-01-01', token: process.env.SANITY_PRODUCTION_API_WRITE_TOKEN ?? process.env.SANITY_API_WRITE_TOKEN, useCdn: false });
const apply = process.argv.includes('--apply');
const NEW = {
  en: { from: 'Children and students', to: 'Children under 12 and students', add: 'Students need to show a valid student card on the night.' },
  es: { from: 'Niños y estudiantes', to: 'Niños menores de 12 años y estudiantes', add: 'Los estudiantes deben presentar un carné de estudiante válido esa noche.' },
  ja: { from: 'お子様・学生', to: '12歳未満のお子様・学生', add: '学生料金をご利用の方は、当日、有効な学生証をご提示ください。' },
};
const doc = await client.getDocument(ID);
if (!doc) throw new Error('doc not found');
if (await client.getDocument(`drafts.${ID}`)) throw new Error('draft exists');
const next = JSON.parse(JSON.stringify(doc.dayTourIntro));
let changed = 0;
for (const l of ['en', 'es', 'ja']) {
  const row = next.find((r) => r.lang === l); if (!row) throw new Error(`${l} intro missing`);
  const pr = row.panelRows.find((r) => r.label === NEW[l].from || r.label === NEW[l].to); if (!pr) throw new Error(`${l} child row missing`);
  if (pr.label !== NEW[l].to) { pr.label = NEW[l].to; changed++; console.log(`CHANGE ${l} panel label → ${NEW[l].to}`); } else console.log(`already ${l} panel label`);
  if (!row.worthKnowing.includes(NEW[l].add)) { row.worthKnowing.push(NEW[l].add); changed++; console.log(`CHANGE ${l} worthKnowing + ${NEW[l].add}`); } else console.log(`already ${l} worthKnowing`);
}
if (apply && changed) { await writeRollback(client, [ID], 'before-karnak-child-student'); await client.patch(ID).set({ dayTourIntro: next }).commit(); console.log('APPLIED'); }
else if (!apply) console.log(`dry run, ${changed} change(s)`);
