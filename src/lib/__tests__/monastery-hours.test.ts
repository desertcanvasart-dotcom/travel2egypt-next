import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  MONASTERY_HOURS_TOKEN, hoursSentence, isMonasteryOpen, upcomingHolidays, saintCatherineMonastery, formatClosure,
} from '../../data/monastery-hours';

// 1. The sentence the data builds is the owner's locked wording, word for word: the
//    locked copy's line = the marker's expansion (the repo copy holds the marker).
const B = 'review/locked/2-day-mount-sinai-and-saint-catherine-from-cairo';
const OWNER = {
  en: 'The monastery receives visitors from 08:45 to 11:30. On Fridays it opens only from 10:45 to 11:30, and its museum is closed. It’s closed on Sundays and on the Orthodox holidays in its published calendar.',
  es: 'El monasterio recibe visitas de 08:45 a 11:30. Los viernes solo abre de 10:45 a 11:30, y su museo está cerrado. Cierra los domingos y en las fiestas ortodoxas de su calendario publicado.',
  ja: '修道院の見学時間は08:45〜11:30です。金曜日は10:45〜11:30のみで、博物館は閉館します。日曜日と、修道院が公表している暦の正教会の祝日は閉館です。',
} as const;
for (const [l, file] of [['en', `${B}.md`], ['es', `${B}-es.md`], ['ja', `${B}-ja.md`]] as const) {
  assert.equal(hoursSentence(l), OWNER[l], `${l}: hours sentence drifted from the owner's wording`);
  const md = readFileSync(file, 'utf8');
  assert.ok(md.includes(MONASTERY_HOURS_TOKEN), `${l}: locked copy has no monastery marker`);
  assert.ok(!md.includes(OWNER[l]), `${l}: locked copy still types the hours out`);
}

// 2. The 2027 list is the monastery's calendar (published 17/03/2026): every date falls on
//    the weekday the calendar prints beside it, and none is a Sunday.
const PRINTED: Record<string, string> = {
  '01-06': 'Wed', '01-07': 'Thu', '01-14': 'Thu', '01-18': 'Mon', '01-19': 'Tue', '01-20': 'Wed', '01-27': 'Wed',
  '02-15': 'Mon', '03-15': 'Mon', '03-16': 'Tue', '03-17': 'Wed',
  '04-07': 'Wed', '04-24': 'Sat', '04-28': 'Wed', '04-29': 'Thu', '04-30': 'Fri',
  '05-01': 'Sat', '05-03': 'Mon', '05-05': 'Wed', '06-09': 'Wed', '06-10': 'Thu', '06-21': 'Mon',
  '07-12': 'Mon', '08-19': 'Thu', '08-28': 'Sat', '09-21': 'Tue', '09-27': 'Mon', '10-25': 'Mon',
  '12-04': 'Sat', '12-06': 'Mon', '12-07': 'Tue', '12-08': 'Wed', '12-09': 'Thu',
};
const y2027 = saintCatherineMonastery.holidays[2027];
assert.equal(y2027.length, Object.keys(PRINTED).length);
for (const iso of y2027) {
  const wd = new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-GB', { weekday: 'short', timeZone: 'UTC' });
  assert.equal(wd, PRINTED[iso.slice(5)], `${iso} is a ${wd}, the calendar says ${PRINTED[iso.slice(5)]}`);
}

// 3. Open / closed.
assert.equal(isMonasteryOpen('2027-01-06'), false); // holiday
assert.equal(isMonasteryOpen('2027-01-10'), false); // Sunday
assert.equal(isMonasteryOpen('2027-01-08'), true); // a Friday (late opening, still open)
assert.equal(isMonasteryOpen('2027-11-15'), true); // November has no holidays

// 4. Only this year and later are listed.
assert.deepEqual(upcomingHolidays(new Date('2026-11-18')).map((h) => h.year), [2027]);
assert.deepEqual(upcomingHolidays(new Date('2028-01-02')).map((h) => h.year), []);

// 5. Dates read naturally in each language.
assert.equal(formatClosure('2027-01-06', 'en'), 'Wed 6 Jan');
assert.ok(formatClosure('2027-01-06', 'ja').startsWith('1月6日'));
console.log('monastery-hours: ok');
