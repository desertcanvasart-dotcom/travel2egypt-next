import assert from 'node:assert/strict';
import { lintText, loadEstablished, sentences } from '../index.mjs';

const none = { en: [], es: [], ja: [] };
const run = (t, lang, established = none) => lintText(t, lang, { established });
const rules = (r) => r.aborts.map((a) => a.rule);

// 1. Banned vocabulary — abort, all three languages, unless allow-listed.
assert.deepEqual(rules(run('A hidden gem nestled in the dunes.', 'en')), ['banned', 'banned']);
assert.deepEqual(rules(run('Una joya escondida.', 'es')), ['banned']);
assert.deepEqual(rules(run('ここは隠れた名所です。', 'ja')), ['banned']);
assert.deepEqual(rules(run('lint-allow: rich history\nA town with a rich history of trade.', 'en')), []);
assert.deepEqual(rules(run('Two real options in Esna itself.', 'en')), []);

// 2. Superlatives.
// Tier 3: abort.
assert.deepEqual(rules(run('The best price in Cairo.', 'en')), ['superlative:tier3']);
assert.deepEqual(rules(run('An unforgettable day.', 'en')), ['superlative:tier3']);
assert.deepEqual(rules(run('Un día inolvidable.', 'es')), ['superlative:tier3']);
assert.deepEqual(rules(run('業界No.1のツアー。', 'ja')), ['superlative:tier3']);
// Tier 2: our own judgement / within the itinerary → pass.
assert.equal(run('Pace: The longest day of the trip, with the most moving parts.', 'en').flags.length, 0);
assert.equal(run('For us, the finest temple on the river.', 'en').flags.length, 0);
assert.equal(run('El día más largo del viaje.', 'es').flags.length, 0);
assert.equal(run('旅でもっとも長い一日です。', 'ja').flags.length, 0);
// Tier 1: approved established fact → pass; same sentence without the entry → flag.
const est = { en: ['the largest stone structure ever built'], es: [], ja: [] };
const s = 'You stand at the base of the largest stone structure ever built.';
assert.equal(run(s, 'en', est).flags.length, 0);
assert.equal(run(s, 'en').flags.length, 1);
// Unclassified watch words → flag, never abort.
const r = run("Aswan, Egypt's southernmost city and its most relaxed.", 'en');
assert.equal(r.flags.length, 1);
assert.equal(r.aborts.length, 0);
assert.equal(run('Es el templo más antiguo de la zona.', 'es').flags.length, 1);
assert.equal(run('エジプト最古の建物。', 'ja').flags.length, 1);
// "most of" / adverbs are not superlatives.
assert.equal(run('Most of the day is spent sailing. It was most probably carved under Khafre.', 'en').flags.length, 0);

// 3. Typography.
assert.deepEqual(rules(run('Days reach 104°F in June.', 'en')), ['typography:fahrenheit']);
assert.deepEqual(rules(run('*お別れの夕食*です。', 'ja')), ['typography:ja-italics']);
assert.deepEqual(rules(run('<em>夕食</em>', 'ja')), ['typography:ja-italics']);
assert.deepEqual(rules(run('Son 60 kilometros y tres dias.', 'es')), ['typography:es-accent', 'typography:es-accent']);
assert.deepEqual(rules(run('Son 60 kilómetros y tres días.', 'es')), []);
assert.equal(run("You won't see everything.", 'en').notes[0].rule, 'typography:apostrophes');

// Sentence split keeps JA on 。 and EN on sentence ends.
assert.equal(sentences('一つ目。二つ目。', 'ja').length, 2);
assert.equal(sentences('One. Two!', 'en').length, 2);

// The established-superlatives file parses (header only → no entries yet).
assert.deepEqual(loadEstablished(new URL('../../../docs/established-superlatives.md', import.meta.url)), none);

console.log('content-lint: ok');

// Numeric gate (canon III.2).
const { figures, numericGate } = await import('../numeric-gate.mjs');
assert.deepEqual(figures('a city of twenty million people', 'en'), [20000000]);
assert.deepEqual(figures('人口2000万の都市', 'ja'), [20000000]);
assert.deepEqual(figures('rebuilt during the UNESCO rescue of the 1960s and 1970s', 'en'), [1960, 1970]);
assert.deepEqual(figures('el rescate de la UNESCO de los años sesenta y setenta', 'es'), [1960, 1970]);
assert.deepEqual(figures('1960〜70年代のユネスコ救済', 'ja'), [1960, 1970]);
assert.deepEqual(figures('desde el siglo XIV', 'es'), [14]);
assert.deepEqual(figures('since the fourteenth century', 'en'), [14]);
assert.deepEqual(figures('Fully open since 1 November 2025', 'en'), [11, 2025]);
assert.deepEqual(figures('2025年11月1日に全面開館', 'ja'), [2025, 11]);
assert.deepEqual(figures('Deluxe (Kempinski or Fairmont class) and Luxury (Four Seasons)', 'en'), []);
assert.deepEqual(figures('The tombs of Tutankhamun, Sety I and Ramses VI', 'en'), [6]);
numericGate({ a: 'Two nights, 146 metres.' }, { a: 'Dos noches, 146 metros.' }, 'es', { quiet: true });
assert.throws(() => numericGate({ a: 'About 60 km.' }, { a: 'Unos 55 km.' }, 'es', { quiet: true }), /numeric gate ABORT/);
assert.throws(() => numericGate({ a: 'Menkaure, the smallest.' }, { a: 'メンカウラー王、三基で最も小さい。' }, 'ja', { quiet: true }), /numeric gate ABORT/);
console.log('numeric gate: ok');

// Non-claims with a watch word don't flag; a real claim in the same sentence still does.
assert.equal(run('Your guide asks what matters most to you today.', 'en').flags.length, 0);
assert.equal(run('Aswan sits where the Nile narrows towards the first cataract.', 'en').flags.length, 0);
assert.equal(run('are visiting Egypt for the first time and want its essential route', 'en').flags.length, 0);
assert.equal(run('his complete burial equipment, reassembled for the first time', 'en').flags.length, 1);
assert.equal(run('初めての訪問で、カイロの要となる一日を', 'ja').flags.length, 0);
assert.equal(run('頂部近くに当初の化粧石の一部が残る唯一のピラミッドです。', 'ja').flags.length, 1);
console.log('non-claims: ok');
assert.equal(run('Después Kefrén, la única que conserva parte del revestimiento.', 'es').flags.length, 1);
console.log('es unicode: ok');
assert.equal(run('las tres pirámides se alinean en un único encuadre', 'es').flags.length, 0); console.log('un único: ok');
