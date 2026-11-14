// Owner-approved 2026-11-14 ("Approve, publish both"):
// review/content/christmas-new-year-page-2026-11-14-es-ja.md
// Adds ES + JA to the published Christmas landing + theme, and links the ES/JA
// winter guides to it. node scripts/christmas-new-year-es-ja-2026-11-14.mjs [--apply]
// Gates: verbatim pre-flight against the approved file; numeric gate vs EN.
import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { createClient } from '@sanity/client';

const c = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_PRODUCTION_API_WRITE_TOKEN,
  useCdn: false,
});
const apply = process.argv.includes('--apply');
const LOCKED = readFileSync('review/content/christmas-new-year-page-2026-11-14-es-ja.md', 'utf8');
if (!LOCKED.includes('APPROVED by owner')) { console.error('file not approved'); process.exit(1); }

const L = {
  es: {
    slug: 'navidad-y-ano-nuevo-en-egipto',
    theme: 'Navidad y Año Nuevo',
    metaTitle: 'Navidad y Año Nuevo en Egipto: viajes y salidas en fechas festivas',
    metaDescription: 'Pasa la Navidad y el Año Nuevo en Egipto: salidas en grupo reducido desde el 23 de diciembre, o un viaje privado en tus propias fechas. Reserva pronto: es la quincena con más demanda del año.',
    title: 'Navidad y Año Nuevo en Egipto',
    summary: 'La quincena entre Navidad y Año Nuevo es la de más demanda del año en Egipto. No es un motivo para evitarla, sino para reservar pronto. El clima es el más agradable, los cruceros por el Nilo están en plena temporada y diez días bastan para El Cairo, el río y Asuán.',
    whyHeading: 'Por qué Egipto en Navidad',
    why: [
      'El invierno es la estación que vuelve Egipto más fácil de mirar: baja el calor, y la meseta de Guiza, Karnak y el Valle de los Reyes se pueden entender en lugar de soportar.',
      'La contrapartida es la gente. Diciembre y enero son meses de mucha demanda: hoteles, cruceros y guías se llenan, y las dahabiyas más buscadas son las primeras en agotarse.',
      'La Navidad propia de Egipto llega después. El 7 de enero se celebra la Navidad copta. Si estás en El Cairo esos días, el Cairo copto gana profundidad, pero es un momento de culto, no un espectáculo turístico.',
    ],
    faq: [
      ['¿Con cuánta antelación hay que reservar un viaje de Navidad a Egipto?', 'Con al menos 60 días de antelación para Navidad y Año Nuevo. En esta quincena, hoteles, cruceros y guías son lo primero que se llena. Si faltan menos días, pregúntanos igualmente: la disponibilidad es limitada, pero no siempre se ha agotado.'],
      ['¿Los precios son más altos en Navidad y Año Nuevo?', 'Sí. Navidad, Año Nuevo y Semana Santa son fechas de temporada alta en Egipto. Las salidas programadas en esas fechas suelen costar un 30 % más. Los viajes privados también se encarecen en esas mismas fechas.'],
      ['¿Hay cena de gala en Nochebuena o Nochevieja?', 'La mayoría de los hoteles egipcios celebran una cena de gala en Nochebuena (24 de diciembre) y en Nochevieja, y es obligatoria: se cobra aparte de la habitación, sin excepciones. En un crucero por el Nilo, la cena de gala está incluida en el precio. Conviene tener en cuenta esa diferencia al comparar una estancia en hotel con un crucero en estas fechas.'],
      ['¿Es diciembre buena época para un crucero por el Nilo?', 'Sí. El invierno es la temporada natural para un crucero por el Nilo. Barcos y muelles están más concurridos, así que conviene confirmar con antelación el barco, la cabina y los horarios de visita. Para un Nilo más pausado, las dahabiyas también navegan en invierno, pero las mejores opciones suelen reservarse pronto.'],
      ['¿Qué es la Navidad copta?', 'El 7 de enero se celebra la Navidad de la Iglesia ortodoxa copta de Egipto, con oficios en iglesias de todo el país, entre ellas la catedral de San Marcos en Abasiya. Es una celebración religiosa, no un espectáculo turístico: conviene vestir y comportarse como en cualquier lugar de culto.'],
      ['¿Podemos hacer un viaje más corto en estas fechas?', 'Sí. Un viaje privado puede empezar cualquier día. Dinos de cuántos días dispones y lo organizamos a tu medida.'],
    ],
    guideLink: 'Salidas de Navidad y Año Nuevo →',
    guide: { id: 'wp-post-155581-es', after: '00000000007b' },
    alt: 'Un camello con gorro rojo de Papá Noel y borlas de colores en una playa del Mar Rojo al atardecer',
  },
  ja: {
    slug: 'kurisumasu-to-nenmatsu-nenshi-no-ejiputo',
    theme: 'クリスマスと年末年始',
    metaTitle: 'クリスマスと年末年始のエジプト：ホリデーシーズンのツアーと出発日',
    metaDescription: 'クリスマスと年末年始をエジプトで。12月23日からの少人数グループ出発、またはご希望の日程でのプライベート旅行。1年でいちばん混み合う時期なので、早めのご予約を。',
    title: 'クリスマスと年末年始のエジプト',
    summary: 'クリスマスから年明けまでの2週間は、エジプトで1年でいちばん混み合う時期です。避ける理由ではなく、早めに予約する理由です。気候はいちばん過ごしやすく、ナイルクルーズは本格シーズン。10日間あれば、カイロ、ナイル川、アスワンを巡れます。',
    whyHeading: 'クリスマスにエジプトを選ぶ理由',
    why: [
      '冬は、エジプトを最も見やすくする季節です。暑さが下がり、ギザの台地、カルナック、王家の谷を、暑さに耐えるのではなく、じっくり読み解けます。',
      'その代わり、混雑があります。12月から1月はピークシーズンで、ホテルも船もガイドも埋まり、人気のダハビーヤから先に満席になります。',
      'エジプト自身のクリスマスは少し遅れてやってきます。1月7日は、エジプトのコプト正教会のクリスマスです。この時期にカイロにいるなら、コプト・カイロを訪れる意味は少し深くなります。ただし観光イベントではなく、礼拝の時です。',
    ],
    faq: [
      ['エジプトのクリスマス旅行は、いつまでに予約すべきですか？', 'クリスマスと年末年始は、少なくとも60日前までのご予約をおすすめします。この2週間は、ホテル、船、ガイドから先に埋まります。それより直前でも、まずはご相談ください。空きは限られますが、なくなっているとは限りません。'],
      ['クリスマスと年末年始は料金が高くなりますか？', 'はい。クリスマス、年末年始、イースターはエジプトのピークシーズンです。この時期の定期出発ツアーは通常30％高くなります。プライベート旅行も同じ時期は料金が上がります。'],
      ['クリスマスイブや大晦日にガラディナーはありますか？', 'エジプトのホテルの多くは、クリスマスイブ（12月24日）と大晦日にガラディナーを開催し、参加は必須です。客室料金とは別に、例外なく請求されます。ナイルクルーズの場合、ガラディナーはクルーズ料金に含まれています。この時期にホテル滞在とクルーズを比べるときは、この違いを知っておくと役立ちます。'],
      ['12月はナイルクルーズに向いていますか？', 'はい。冬はナイルクルーズの本格シーズンです。船や船着き場は混み合うため、船、客室、見学時間を事前に確認しましょう。より静かなナイルを望むなら、ダハビーヤも冬に運航していますが、人気の船は早く埋まります。'],
      ['コプト・クリスマスとは何ですか？', '1月7日は、エジプトのコプト正教会のクリスマスです。アッバシーヤの聖マルコ大聖堂をはじめ、各地の教会で礼拝が行われます。観光イベントではなく宗教行事ですので、礼拝の場にふさわしい服装と振る舞いを心がけてください。'],
      ['年末年始に短めの旅行はできますか？', 'はい。プライベート旅行はどの日からでも始められます。お休みの日数をお知らせいただければ、それに合わせて組み立てます。'],
    ],
    guideLink: 'クリスマスと年末年始の出発日 →',
    guide: { id: 'wp-post-172231-ja', after: '000000000077' },
    alt: '赤いサンタ帽と色とりどりの房飾りをつけたラクダが、夕暮れの紅海の浜辺に立つ',
  },
};
const NUMS = {
  es: ['23 de diciembre', '60 días', '30 %', '24 de diciembre', '7 de enero', 'diez días'],
  ja: ['12月23日', '60日', '30％', '12月24日', '1月7日', '10日間'],
};

// ── Pre-flight: verbatim + numeric gate ────────────────────────────────
let bad = 0;
for (const [loc, x] of Object.entries(L)) {
  const strings = [x.metaTitle, x.metaDescription, x.title, x.summary, x.whyHeading, ...x.why, ...x.faq.flat(), x.guideLink, x.slug, x.theme];
  for (const s of strings) if (!LOCKED.includes(s)) { console.error(`PRE-FLIGHT MISMATCH [${loc}]: ${s}`); bad++; }
  const all = strings.join(' ');
  for (const n of NUMS[loc]) if (!all.includes(n)) { console.error(`NUMERIC GATE [${loc}]: missing ${n}`); bad++; }
}
if (bad) process.exit(1);
console.log('pre-flight + numeric gate: OK (es, ja)');

const ID = 'tourLanding.christmas-and-new-year-in-egypt';
const d = await c.getDocument(ID);
if (!d) throw new Error('landing not published');
if (await c.getDocument(`drafts.${ID}`)) throw new Error('landing has a draft — resolve first');
let k = 0;
const block = (loc, text, style = 'normal') => ({
  _key: `${loc}b${(k++).toString(36)}`, _type: 'block', style, markDefs: [],
  children: [{ _key: `${loc}s${(k++).toString(36)}`, _type: 'span', marks: [], text }],
});
const add = (arr, loc, value, type) => [...(arr ?? []).filter((i) => i._key !== loc), { _key: loc, ...(type ? { _type: type } : {}), value }];

const p = {};
p.title = d.title; p.summary = d.summary; p.intro = d.intro; p.slug = d.slug;
p['seo.metaTitle'] = d.seo.metaTitle; p['seo.metaDescription'] = d.seo.metaDescription;
p['heroImage.alt'] = d.heroImage.alt;
p.faq = d.faq.map((f) => ({ ...f }));
for (const [loc, x] of Object.entries(L)) {
  p.title = add(p.title, loc, x.title, 'internationalizedArrayStringValue');
  p.summary = add(p.summary, loc, x.summary, 'internationalizedArrayStringValue');
  p.intro = add(p.intro, loc, [block(loc, x.whyHeading, 'h2'), ...x.why.map((t) => block(loc, t))]);
  p.slug = add(p.slug, loc, { _type: 'slug', current: x.slug }, 'object');
  p['seo.metaTitle'] = add(p['seo.metaTitle'], loc, x.metaTitle, 'internationalizedArrayStringValue');
  p['seo.metaDescription'] = add(p['seo.metaDescription'], loc, x.metaDescription, 'internationalizedArrayTextValue');
  p['heroImage.alt'] = add(p['heroImage.alt'], loc, x.alt, 'object');
  p.faq = p.faq.map((f, i) => ({
    ...f,
    question: add(f.question, loc, x.faq[i][0], 'internationalizedArrayStringValue'),
    answer: add(f.answer, loc, [block(loc, x.faq[i][1])]),
  }));
}
const themePatch = {
  name: [...(await c.getDocument('theme-christmas-new-year')).name.filter((n) => n._key === 'en'), { _key: 'es', value: L.es.theme }, { _key: 'ja', value: L.ja.theme }],
};

const tx = c.transaction().patch(ID, (q) => q.set(p)).patch('theme-christmas-new-year', (q) => q.set(themePatch));
// Winter guides (ES/JA): link after their Coptic Christmas section.
for (const [loc, x] of Object.entries(L)) {
  const g = await c.getDocument(x.guide.id);
  if (await c.getDocument(`drafts.${x.guide.id}`)) throw new Error(`${x.guide.id} has a draft`);
  if (JSON.stringify(g.body).includes(`"_ref":"${ID}"`)) { console.log(`${x.guide.id}: link already present`); continue; }
  if (!g.body.some((b) => b._key === x.guide.after)) throw new Error(`${x.guide.id}: anchor missing`);
  tx.patch(x.guide.id, (q) => q.insert('after', `body[_key=="${x.guide.after}"]`, [{
    _key: `xmaslink${loc}`, _type: 'block', style: 'normal',
    markDefs: [{ _key: `xmasref${loc}`, _type: 'internalLink', reference: { _type: 'reference', _ref: ID } }],
    children: [{ _key: `xmasspan${loc}`, _type: 'span', marks: [`xmasref${loc}`], text: x.guideLink }],
  }]));
  console.log(`${x.guide.id}: + "${x.guideLink}" after ${x.guide.after}`);
}
console.log(`landing: es/ja added to title, summary, intro, slug, seo, hero alt, ${p.faq.length} FAQs; theme names es/ja`);
if (!apply) { console.log('dry run — pass --apply'); process.exit(0); }
console.log('committed', (await tx.commit()).transactionId);
