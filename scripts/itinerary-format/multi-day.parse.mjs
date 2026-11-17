/**
 * Parses an owner's locked multi-day file (EN/ES/JA, same structure as the
 * 4-Day Nile Cruise files) into the multi-day itinerary fields, per config:
 *   { locked: {en,es,ja}, stayKeys: [...], jaSites: {day: [names]} } Every reader-visible string
 * comes from the files as written; the parser only splits them. The ⚑ marks
 * (the owner's own review flags) and the "More about this stop →" pointer
 * lines are not copy and are dropped.
 */
import { readFileSync } from 'node:fs';

const ROOT = new URL('../../', import.meta.url);

const SEG = {
  en: { Morning: 'morning', Midday: 'midday', Afternoon: 'afternoon', Evening: 'evening', 'Early morning': 'morning' },
  es: { Mañana: 'morning', Mediodía: 'midday', Tarde: 'afternoon', Noche: 'evening', 'A primera hora': 'morning' },
  ja: { 午前: 'morning', 昼: 'midday', 午後: 'afternoon', 夜: 'evening', 早朝: 'morning' },
};
// Headings that differ from the standard word for their period are kept as written.
const SEG_HEADING = { en: ['Early morning'], es: ['A primera hora'], ja: ['早朝'] };
const ROW = {
  en: { 'The day': 'sites', Overnight: 'overnight', Meals: 'meals', Travel: 'travel', Pace: 'pace' },
  es: { 'El día': 'sites', Noche: 'overnight', Comidas: 'meals', Traslados: 'travel', Ritmo: 'pace' },
  ja: { この日の見学: 'sites', 宿泊: 'overnight', 食事: 'meals', 移動: 'travel', ペース: 'pace' },
};
const MEAL = { en: { breakfast: 'breakfast', lunch: 'lunch', dinner: 'dinner' }, es: { desayuno: 'breakfast', almuerzo: 'lunch', cena: 'dinner' }, ja: { 朝食: 'breakfast', 昼食: 'lunch', 夕食: 'dinner' } };
const SEE_DAY = { en: /[:,] see Day (\d+)$/, es: /[:,] ver día (\d+)$/, ja: /[：、](\d+)日目をご参照ください$/ };

const clean = (s) => s.replace(/\s*⚑\s*/g, ' ').replace(/[ \t]+$/gm, '').trim();
const sections = (md) => md.split(/\n## /).slice(1).map((s) => { const [h, ...rest] = s.split('\n'); return { h: h.trim(), text: rest.join('\n') }; });
const paras = (t) => t.split(/\n\s*\n/).map((p) => p.trim()).filter((p) => p && p !== '---');
const bullets = (t) => t.split('\n').filter((l) => l.startsWith('- ')).map((l) => clean(l.slice(2)));
/** "**Label:** value" / "**ラベル：** value" */
const labelled = (line) => { const m = line.match(/^\*\*(.+?)[:：]\*\*\s*(.*)$/); return m ? [m[1].trim(), clean(m[2])] : null; };

export function parse(lang, { locked, stayKeys, jaSites = {} }) {
  const LOCKED = locked;
  const JA_SITES = jaSites;
  const md = readFileSync(new URL(LOCKED[lang], ROOT), 'utf8');
  const title = clean(md.match(/^# (.+)$/m)[1]);
  const [panel, opening, why, daysSec, stay, incl, forYou, mine] = sections(md);
  if (!mine) throw new Error(`${lang}: expected 8 sections`);
  const sep = lang === 'ja' ? '・' : ' · ';

  // Days section: optional note, the day blocks, then the closing line.
  const parts = daysSec.text.split(/\n### /);
  const head = parts[0];
  const noteM = head.match(/^>\s*\*\*(.+?)\*\*\s*(.+)$/m);
  const daysNote = noteM ? { lead: clean(noteM[1]), text: clean(noteM[2]) } : null;
  let closingLine = null;
  const days = parts.slice(1).map((chunk, idx) => {
    const lines = chunk.split('\n');
    const h = lines[0].trim(); // "Day 1 · Aswan" / "1日目・アスワン"
    const place = clean(h.replace(/^(Day|Día)\s*\d+\s*·\s*/, '').replace(/^\d+日目・/, ''));
    const day = idx + 1;
    let rest = lines.slice(1).join('\n');
    // Closing line after the last day (after a --- rule).
    const cut = rest.split(/\n---\n/);
    if (cut.length > 1) {
      const tail = paras(cut.slice(1).join('\n')).filter((p) => !p.startsWith('>'));
      if (tail.length) closingLine = clean(tail[tail.length - 1].replace(/^\*(.*)\*$/, '$1'));
      rest = cut[0];
    }
    const ps = paras(rest);
    const titleLine = clean(ps.shift().replace(/^\*\*(.*)\*\*\s*(⚑)?$/, '$1'));
    const segments = [];
    const body = [];
    const rows = {};
    const optional = [];
    for (const p of ps) {
      if (p.startsWith('>')) continue; // "More about this stop →" pointer
      const pl = p.split('\n');
      if (labelled(pl[0]) && ROW[lang][labelled(pl[0])[0]]) {
        for (const l of pl) { const lv = labelled(l); if (lv && ROW[lang][lv[0]]) rows[ROW[lang][lv[0]]] = lv[1]; }
        continue;
      }
      if (/^\*\*(Optional|Optional on this day|Opcional|オプション)[:：]\*\*$/.test(pl[0])) { optional.push(...bullets(p)); continue; }
      const sm = lang === 'ja' ? p.match(/^\*\*(.+?)\*\*\s+([\s\S]+)$/) : p.match(/^\*\*(.+?)\.\*\*\s+([\s\S]+)$/);
      if (sm && SEG[lang][sm[1]]) {
        segments.push({ label: SEG[lang][sm[1]], ...(SEG_HEADING[lang].includes(sm[1]) ? { heading: sm[1] } : {}), text: clean(sm[2]) });
        continue;
      }
      body.push(clean(p));
    }
    if (segments.length && body.length) throw new Error(`${lang} day ${day}: mixed segments and body`);
    const sites = lang === 'ja' && JA_SITES[day] ? JA_SITES[day] : rows.sites.split(lang === 'ja' ? '・' : ' · ').map((s) => s.trim());
    if (sites.join(lang === 'ja' ? '・' : ' · ') !== rows.sites) throw new Error(`${lang} day ${day}: site split does not match the file`);
    const meals = rows.meals.split(sep).map((m) => {
      const mm = m.trim().match(/^(.+?)\s*[（(](.+)[）)]$/) ?? [null, m.trim(), null];
      const meal = MEAL[lang][mm[1].toLowerCase()];
      if (!meal) throw new Error(`${lang} day ${day}: unknown meal "${m}"`);
      return { meal, ...(mm[2] ? { note: mm[2] } : {}) };
    });
    return {
      day, place, title: titleLine,
      ...(segments.length ? { segments } : { body }),
      sites, overnight: rows.overnight === '—' ? null : rows.overnight, meals, travel: rows.travel, pace: rows.pace, optional,
    };
  });

  const sub = (t) => {
    // "**Header**" followed by "- " bullets, repeated.
    const out = [];
    for (const blk of t.split(/\n(?=\*\*)/)) { const m = blk.match(/^\*\*(.+?)\*\*/); if (m) out.push({ h: m[1], items: bullets(blk) }); }
    return out;
  };
  const stayRows = paras(stay.text).map(labelled).filter(Boolean);
  const STAY_KEYS = stayKeys;
  if (stayRows.length !== STAY_KEYS.length) throw new Error(`${lang}: expected ${STAY_KEYS.length} stay rows, found ${stayRows.length}`);
  const [inc, exc] = sub(incl.text);
  const [fit, worth] = sub(forYou.text);
  const mineP = mine.text.split('\n').map((l) => l.trim()).filter(Boolean);

  // Not-included rows: "…: see Day 4" becomes a link to that day (the page adds the words).
  const excluded = exc.items.map((text) => { const m = text.match(SEE_DAY[lang]); return m ? { text: text.replace(SEE_DAY[lang], ''), seeDay: Number(m[1]) } : { text }; });

  return {
    title,
    panel: Object.fromEntries(paras(panel.text).flatMap((p) => p.split('\n')).map(labelled).filter(Boolean)),
    opening: clean(paras(opening.text)[0]),
    whyRoute: clean(paras(why.text)[0]),
    daysNote,
    days,
    closingLine,
    stayAndTravel: Object.fromEntries(STAY_KEYS.map((k, i) => [k, stayRows[i][1]])),
    included: inc.items,
    excluded,
    fitFor: fit.items,
    worthKnowing: worth.items,
    makeItYoursIntro: clean(mineP[0]),
    options: mineP.filter((l) => l.startsWith('- ')).map((l) => clean(l.slice(2))),
  };
}
