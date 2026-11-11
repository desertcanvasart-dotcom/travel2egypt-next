/**
 * 2026-11-09 — owner: the Giza/Memphis/Saqqara private tour has nothing to do
 * with the Grand Egyptian Museum; remove every mention from its text.
 * Removes the "Grand Egyptian Museum" H4 + its paragraph (EN/ES/JA) and the
 * GEM sentence after the camel-ride line (EN only; ES/JA never had it).
 * Backup → backups/remove-gem-<id>.json. Dry run unless --write.
 */
import 'dotenv/config';
import fs from 'node:fs';
import { createClient } from '@sanity/client';

const c = createClient({ projectId: 'ufallvd2', dataset: 'production', apiVersion: '2024-01-01', useCdn: false, token: process.env.SANITY_PRODUCTION_API_WRITE_TOKEN });
const ID = 'tour.private-tour-pyramids-of-giza-sphinx-memphis-and-saqqara';
const REMOVE = { en: ['000000000035', '000000000037'], es: ['000000000037', '000000000039'], ja: ['00000000003b', '00000000003d'] };
const CAMEL = { key: '000000000049', from: ' The concierge can advise whether to add the GEM as a separate stop, given how close it sits to the plateau.' };

const d = await c.getDocument(ID);
const unset = [];
for (const [loc, keys] of Object.entries(REMOVE)) {
  const blocks = d.body.find((b) => b._key === loc).value;
  for (const k of keys) {
    const b = blocks.find((x) => x._key === k);
    const txt = b.children.map((s) => s.text).join('');
    if (!/Grand Egyptian Museum|Gran Museo Egipcio|大エジプト博物館/.test(txt)) throw new Error(`${loc}/${k} is not the GEM block`);
    unset.push(`body[_key=="${loc}"].value[_key=="${k}"]`);
  }
}
const camel = d.body.find((b) => b._key === 'en').value.find((x) => x._key === CAMEL.key);
const span = camel.children.find((s) => s.text.includes(CAMEL.from));
if (!span) throw new Error('camel sentence not found');
const spanPath = `body[_key=="en"].value[_key=="${CAMEL.key}"].children[_key=="${span._key}"].text`;
const newText = span.text.replace(CAMEL.from, '');

console.log('unset', unset);
console.log('set', spanPath, '→', newText);
if (!process.argv.includes('--write')) { console.log('dry run'); process.exit(0); }
fs.mkdirSync('backups', { recursive: true });
fs.writeFileSync(`backups/remove-gem-${ID}.json`, JSON.stringify(d, null, 2));
await c.patch(ID).unset(unset).set({ [spanPath]: newText }).commit();
const after = JSON.stringify(await c.getDocument(ID));
console.log('written; remaining GEM mentions:', (after.match(/Grand Egyptian Museum|\bGEM\b|Gran Museo Egipcio|大エジプト博物館/g) || []).length);
