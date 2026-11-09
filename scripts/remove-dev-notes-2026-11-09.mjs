// One-off (2026-11-09): remove editor/revision notes that were published as
// visible body text. Backs up the touched EN bodies first.
import 'dotenv/config';
import fs from 'node:fs';
import { createClient } from '@sanity/client';
const c = createClient({ projectId: 'ufallvd2', dataset: 'production', apiVersion: '2024-01-01', useCdn: false, token: process.env.SANITY_PRODUCTION_API_WRITE_TOKEN });
const WRITE = process.argv.includes('--write');
// [docId, firstNoteIndex, lastNoteIndex (inclusive), expected first-note text]
const CUTS = [
  ['guideArticle.luxor.el-khokha', 104, 147, 'Notes on judgment calls:'],
  ['guideArticle.luxor.ramesseum', 149, 189, 'Notes on judgment calls:'],
  ['guideArticle.luxor.sheikh-abd-el-qurna', 133, 146, 'Cluster cross-references locked:'],
  ['guideArticle.qena.nectanebo-mammisi', 66, 71, 'What you should know about this piece:'],
];
const txt = (b) => (b.children || []).map((x) => x.text).join('');
const backup = {};
for (const [id, a, z, first] of CUTS) {
  const ids = [id, `drafts.${id}`];
  for (const did of ids) {
    const doc = await c.fetch(`*[_id==$did][0]{_id, "en": body[_key=="en"][0].value}`, { did });
    if (!doc) continue;
    backup[did] = doc.en;
    const i = doc.en.findIndex((b) => txt(b) === first);
    if (i < 0) { console.log(did, 'first note not found — skip'); continue; }
    const pubLen = a; // notes start at `a` in published
    const span = z - a;
    const keys = doc.en.slice(i, i + span + 1).map((b) => b._key);
    // sanity: everything from i to end of span must be note text, and the block before is the Created line
    console.log(did, 'remove', keys.length, 'blocks from', i, '| before:', txt(doc.en[i - 1]).slice(0, 60), '| last:', txt(doc.en[i + span]).slice(0, 60));
    if (WRITE) await c.patch(did).unset(keys.map((k) => `body[_key=="en"].value[_key=="${k}"]`)).commit();
  }
}
// Hotel: one visitor-facing sentence carried "before publishing or booking".
const H = 'wp-page-64025';
for (const did of [H, `drafts.${H}`]) {
  const doc = await c.fetch(`*[_id==$did][0]{"en": body[_key=="en"][0].value}`, { did });
  if (!doc) continue;
  const b = doc.en.find((x) => txt(x).includes('should be confirmed before publishing or booking'));
  if (!b) { console.log(did, 'hotel sentence not found'); continue; }
  const span = b.children.find((x) => x.text.includes('before publishing or booking'));
  backup[`${did}#${b._key}`] = b;
  console.log(did, 'hotel: rewrite span', span._key);
  if (WRITE) await c.patch(did).set({ [`body[_key=="en"].value[_key=="${b._key}"].children[_key=="${span._key}"].text`]: span.text.replace('before publishing or booking', 'before booking') }).commit();
}
if (WRITE) fs.writeFileSync('migration/dev-notes-2026-11-09/backup.json', JSON.stringify(backup, null, 1));
console.log(WRITE ? 'WRITTEN' : 'dry run');
