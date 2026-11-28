/**
 * Owner, 28 Nov 2026: going inside the Red Pyramid is always an extra ticket (as on the Memphis,
 * Saqqara & Dahshur day tours). The 4-day Cairo (/4-day-history-culture-escape, wp-page-153242)
 * included it; this patch makes it an extra in EN/ES/JA: Day 3 text, sights row, Day 3 optional,
 * Included → Not included. Locked copy updated to match (review/locked/4-day-cairo-pyramids-gem-old-cairo*.md).
 *   node --env-file=.env scripts/itinerary-format/cairo-4day-red-pyramid-extra-2026-11-28.mjs [--apply]
 */
import { createClient } from '@sanity/client';
import { writeRollback } from '../lib/content-gates.mjs';
const ID = 'wp-page-153242';
const c = createClient({ projectId: 'ufallvd2', dataset: 'production', apiVersion: '2024-01-01', token: process.env.SANITY_PRODUCTION_API_WRITE_TOKEN, useCdn: false });
const L = {
  en: { day: 'jwfcq3m9iy', from: 'You go inside the Red Pyramid.', to: 'You can go inside the Red Pyramid with an extra ticket.', site: 'Red Pyramid', opt: 'Inside the Red Pyramid at Dahshur: extra ticket', ex: 'Inside the Red Pyramid at Dahshur: extra ticket' },
  es: { day: 'c4g-es-3', from: 'Entras en la Pirámide Roja.', to: 'Puedes entrar en la Pirámide Roja con una entrada aparte.', site: 'Pirámide Roja', opt: 'Interior de la Pirámide Roja en Dahshur: entrada aparte', ex: 'Interior de la Pirámide Roja en Dahshur: entrada aparte' },
  ja: { day: 'eigpvn8yc6', from: '赤いピラミッドの内部にも入ります。', to: '赤いピラミッドの内部へは、別途入場券で入ることができます。', site: '赤いピラミッド', opt: 'ダハシュールの赤いピラミッドの内部：別途入場券', ex: 'ダハシュールの赤いピラミッドの内部：別途入場券' },
};
const d = await c.getDocument(ID);
if (await c.getDocument(`drafts.${ID}`)) throw new Error('draft exists');
const tx = c.transaction();
for (const [lang, x] of Object.entries(L)) {
  const day = d.itineraryDays.find((k) => k._key === x.day);
  const span = day.body.find((b) => b._key === 'p2').children.find((s) => s._key === 's2b');
  const base = c.patch(ID);
  if (span.text.includes(x.from)) base.set({ [`itineraryDays[_key=="${x.day}"].body[_key=="p2"].children[_key=="s2b"].text`]: span.text.replace(x.from, x.to) });
  else if (!span.text.includes(x.to)) throw new Error(`${lang}: Day 3 text not found`);
  base.set({ [`itineraryDays[_key=="${x.day}"].sites[_key=="site6"].name`]: x.site });
  if (d.inclusions.some((i) => i._key === `c4g-in-${lang}-8`)) base.unset([`inclusions[_key=="c4g-in-${lang}-8"]`]);
  if (!(day.optional ?? []).some((o) => o.text === x.opt)) base.set({ [`itineraryDays[_key=="${x.day}"].optional`]: [...(day.optional ?? []), { _key: 'o-redpyr', _type: 'dayOptional', text: x.opt }] });
  tx.patch(base);

  if (!d.exclusions.some((e) => e.text === x.ex)) tx.patch(c.patch(ID).insert('after', `exclusions[_key=="c4g-ex-${lang}-5"]`, [{ ...d.exclusions.find((e) => e._key === `c4g-ex-${lang}-5`), _key: `c4g-ex-${lang}-redpyr`, text: x.ex }]));
  console.log(lang, 'planned');
}
if (!process.argv.includes('--apply')) { console.log(JSON.stringify(tx.serialize()).slice(0, 1500)); process.exit(0); }
await writeRollback(c, [ID], 'before-red-pyramid-extra');
await tx.commit();
const a = await c.getDocument(ID);
console.log('left in inclusions:', a.inclusions.filter((i) => /Red Pyramid|Pirámide Roja|赤いピラミッド/.test(i.text)).length, '· exclusions:', a.exclusions.filter((i) => /Red Pyramid|Pirámide Roja|赤いピラミッド/.test(i.text)).length);
