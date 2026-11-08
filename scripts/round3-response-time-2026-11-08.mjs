/**
 * Fix round 3, Task A — content (2026-11-08). One response-time promise:
 * "by 8 PM Cairo time the same day, or by 10 AM the next morning, 7 days a week".
 *  - siteSettings.responseTimeShort / responseTimeFull (EN/ES/JA)
 *  - Contact "When you'll hear back" section (EN) → Full string
 *  - FAQ entries: how booking works, when the team responds, why no prices (EN/ES/JA)
 * Dry run by default; --write applies (backups → backups/round3-<id>.json).
 */
import 'dotenv/config';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { createClient } from '@sanity/client';

const c = createClient({ projectId: 'ufallvd2', dataset: 'production', apiVersion: '2024-01-01', useCdn: false, token: process.env.SANITY_PRODUCTION_API_WRITE_TOKEN });
const write = process.argv.includes('--write');
const k = () => crypto.randomBytes(6).toString('hex');

const SHORT = {
  en: 'Reply by 8 PM Cairo time or 10 AM next day',
  es: 'Respuesta antes de las 20:00 (hora de El Cairo) o a las 10:00 del día siguiente',
  ja: 'カイロ時間の当日20時または翌朝10時までに返信',
};
const FULL = {
  en: 'We reply by 8 PM Cairo time the same day, or by 10 AM the next morning, 7 days a week.',
  es: 'Respondemos antes de las 20:00 (hora de El Cairo) el mismo día, o antes de las 10:00 de la mañana siguiente, los 7 días de la semana.',
  ja: 'カイロ時間の当日20時まで、または翌朝10時までにご返信します（年中無休）。',
};
const arr = (m) => Object.entries(m).map(([lang, value]) => ({ _key: lang, _type: 'internationalizedArrayStringValue', value }));

const plan = [];
const span = (text, marks = []) => ({ _key: k(), _type: 'span', marks, text });
const para = (children) => ({ _key: k(), _type: 'block', style: 'normal', markDefs: [], children });

// 1. Contact page section 2262ae9116be (EN only)
{
  const id = 'editorial-page-contact';
  const base = 'sections[_key=="2262ae9116be"].body[_key=="en"].value';
  plan.push({ id, label: 'Contact: response line → Full string; drop the two 1 PM bullets', ops: (p) => p
    .set({ [`${base}[_key=="3771794d31cf"].children`]: [span(FULL.en)] })
    .unset([`${base}[_key=="fb791fc8fba2"]`, `${base}[_key=="3a6e472a5941"]`])
    .set({ [`${base}[_key=="f2668c1bc108"].children`]: [span('Holidays included. It’s a promise, not an aspiration — we honor it.')] }) });
}

// 2. FAQ: how booking works — replace the timing sentences only
const howBooking = [
  ['en', 'd8e3f3812272', '18108ff92564', ' Usually within 8 PM Cairo time the same day if you write before 1 PM, or by 10 AM Cairo time the next morning otherwise. Seven days a week.', ` ${FULL.en}`],
  ['es', 'opshow-does-booking-wesb3', 'opshow-does-booking-wess3', ' Normalmente antes de las 8 de la tarde (hora de El Cairo) del mismo día si el mensaje llega antes de la 1 de la tarde, o antes de las 10 de la mañana del día siguiente en caso contrario. Los siete días de la semana.', ` ${FULL.es}`],
  ['ja', 'opshow-does-booking-wjab3', 'opshow-does-booking-wjas3', 'カイロ時間の午後1時までにご連絡いただいた場合は同日の午後8時までに、それ以降の場合は翌朝10時（カイロ時間）までにお送りします。年中無休です。', FULL.ja],
];
// 3. FAQ: why we don't publish prices — "within 24 hours"
const whyPrices = [
  ['en', 'a4f0f146890a', '1b9b82112be7', 'Usually within 24 hours, often faster.', FULL.en],
  ['es', 'opswhy-dont-you-publiesb2', 'opswhy-dont-you-publiess2', 'Normalmente en 24 horas, a menudo antes.', FULL.es],
  ['ja', 'opswhy-dont-you-publijab2', 'opswhy-dont-you-publijas2', '通常24時間以内、多くの場合はそれより早くお返事します。', FULL.ja],
];
const docs = Object.fromEntries((await c.fetch(`*[_id in $ids]`, {
  ids: ['editorial-page-contact', 'faq-entry-how-does-booking-with-travel2egypt-work', 'faq-entry-why-dont-you-publish-prices-on-your-website', 'faq-entry-when-does-your-team-respond-to-inquiries'],
})).map((d) => [d._id, d]));

for (const [id, rows] of [['faq-entry-how-does-booking-with-travel2egypt-work', howBooking], ['faq-entry-why-dont-you-publish-prices-on-your-website', whyPrices]]) {
  const sets = {};
  for (const [loc, bk, sk, from, to] of rows) {
    const b = docs[id].answer.find((l) => l._key === loc).value.find((x) => x._key === bk);
    const s = b.children.find((x) => x._key === sk);
    if (!s || !s.text.includes(from)) throw new Error(`${id} ${loc}: sentence not found`);
    sets[`answer[_key=="${loc}"].value[_key=="${bk}"].children[_key=="${sk}"].text`] = s.text.replace(from, to);
  }
  plan.push({ id, label: `${id}: timing sentence → Full string (EN/ES/JA)`, ops: (p) => p.set(sets) });
}

// 4. FAQ: when does your team respond — the two 1 PM blocks → one Full-string paragraph per locale
{
  const id = 'faq-entry-when-does-your-team-respond-to-inquiries';
  const pairs = { en: ['9028dff58f79', 'f99c20108f08'], es: ['opswhen-does-your-teaesb0', 'opswhen-does-your-teaesb1'], ja: ['opswhen-does-your-teajab0', 'opswhen-does-your-teajab1'] };
  for (const [loc, [a, b]] of Object.entries(pairs)) {
    const v = docs[id].answer.find((l) => l._key === loc).value;
    if (!v.some((x) => x._key === a) || !v.some((x) => x._key === b)) throw new Error(`${id} ${loc} blocks missing`);
  }
  plan.push({ id, label: `${id}: answer → Full string (EN/ES/JA)`, ops: (p) => {
    let q = p;
    for (const [loc, [a, b]] of Object.entries(pairs)) {
      q = q.set({ [`answer[_key=="${loc}"].value[_key=="${a}"]`]: { ...para([span(FULL[loc])]), _key: a } }).unset([`answer[_key=="${loc}"].value[_key=="${b}"]`]);
    }
    return q;
  } });
}

for (const x of plan) console.log('•', x.label);
console.log('• siteSettings: responseTimeShort / responseTimeFull (EN/ES/JA)');
if (write) {
  fs.mkdirSync('backups', { recursive: true });
  for (const x of plan) {
    fs.writeFileSync(`backups/round3-${x.id}.json`, JSON.stringify(docs[x.id], null, 2));
    await x.ops(c.patch(x.id)).commit({ autoGenerateArrayKeys: false });
    console.log('patched', x.id);
  }
  await c.patch('siteSettings').set({ responseTimeShort: arr(SHORT), responseTimeFull: arr(FULL) }).commit();
  console.log('patched siteSettings');
} else console.log('dry run — pass --write');
