/**
 * Kom Ombo accommodation (wp-page-78376) — ES/JA parity build + EN debris cleanup.
 * Owner-approved locked copy (kom-ombo-parity-copy.md) implemented verbatim.
 *
 * EN: surgical cleanup — delete lead keyword-H2, "Your Tailored Journey Awaits"
 *   CTA, pending image, "Egypt's Finest Stays" footer; strip 4 decorative
 *   travel2egypt.org links (keep the bold name marks); clear debris summary;
 *   retitle. Property/cruise/tips content otherwise untouched. Standfirst is
 *   already a body block carrying Aswan/Luxor links (confirmed) — kept as-is.
 * ES + JA: FULL rebuild from the old 7-block generic version to match EN's
 *   reframed structure, re-authored. JA preserves the temple-article internal
 *   link. No decorative links anywhere; only internal guide links.
 * Fields: create seo.metaDescription (doc had none); set titles; clear summaries.
 * Hero: NOT changed — sibling temple article has no heroImage to borrow;
 *   flagged back as unresolved (do not source a photo).
 *
 * STAGING ONLY. Run (dry): npx tsx scripts/komombo-parity-stage.ts
 *              (stage): APPLY=1 npx tsx scripts/komombo-parity-stage.ts
 */
import { createClient } from '@sanity/client';
import { config as loadEnv } from 'dotenv';
import { writeFileSync, mkdirSync } from 'node:fs';
loadEnv();

const APPLY = process.env.APPLY === '1';
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;
if (dataset !== 'production') throw new Error(`Refusing to run against "${dataset}".`);
const token = process.env.SANITY_PRODUCTION_API_WRITE_TOKEN || process.env.SANITY_API_WRITE_TOKEN;
if (APPLY && !process.env.SANITY_PRODUCTION_API_WRITE_TOKEN) { console.error('APPLY=1 needs SANITY_PRODUCTION_API_WRITE_TOKEN'); process.exit(1); }
const client = createClient({ projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!, dataset, apiVersion: '2024-12-01', useCdn: false, token });

const ID = 'wp-page-78376';
const ASWAN = 'wp-page-58758', LUXOR = 'wp-page-58877', TEMPLE = 'guideArticle.kom-ombo.the-temple-of-kom-ombo';
const bt = (b: any) => (b._type === 'block' ? (b.children ?? []).map((c: any) => c.text ?? '').join('') : `[${b._type}]`);

// ---------- block builders ----------
let seq = 0;
const k = (p: string) => `kp_${p}_${seq++}`;
const plain = (style: string, text: string) => ({ _type: 'block', _key: k('p'), style, markDefs: [], children: [{ _type: 'span', _key: k('s'), text, marks: [] }] });
const propBullet = (name: string, desc: string) => ({
  _type: 'block', _key: k('pb'), style: 'normal', listItem: 'bullet', level: 1, markDefs: [],
  children: [{ _type: 'span', _key: k('n'), text: name, marks: ['strong'] }, { _type: 'span', _key: k('br'), text: '\n', marks: [] }, { _type: 'span', _key: k('d'), text: desc, marks: [] }],
});
const labelBullet = (label: string, sepDesc: string) => ({
  _type: 'block', _key: k('lb'), style: 'normal', listItem: 'bullet', level: 1, markDefs: [],
  children: [{ _type: 'span', _key: k('l'), text: label, marks: ['strong'] }, { _type: 'span', _key: k('d'), text: sepDesc, marks: [] }],
});
// standfirst body block with internal links on given substrings
function linked(text: string, links: Array<[string, string]>) {
  const ranges = links.map(([sub, ref]) => ({ start: text.indexOf(sub), end: text.indexOf(sub) + sub.length, ref, sub })).filter((r) => r.start >= 0).sort((a, b) => a.start - b.start);
  const children: any[] = []; const markDefs: any[] = []; let cur = 0;
  for (const r of ranges) {
    if (r.start > cur) children.push({ _type: 'span', _key: k('s'), text: text.slice(cur, r.start), marks: [] });
    const mk = k('lnk'); markDefs.push({ _type: 'internalLink', _key: mk, reference: { _type: 'reference', _ref: r.ref } });
    children.push({ _type: 'span', _key: k('s'), text: r.sub, marks: [mk] }); cur = r.end;
  }
  if (cur < text.length) children.push({ _type: 'span', _key: k('s'), text: text.slice(cur), marks: [] });
  return { _type: 'block', _key: k('sf'), style: 'normal', markDefs, children };
}

// ---------- ES body ----------
const esBody = [
  linked("¿Buscas hoteles en Kom Ombo? No vas a encontrar ninguno en el propio pueblo — y eso no es motivo para perdérselo. Kom Ombo es uno de los rincones menos conocidos del Alto Egipto, célebre por su raro templo doble dedicado a Sobek y a Horus. Ya llegues en un crucero por el Nilo o en una excursión de un día desde Asuán o Luxor, el templo a orillas del río tiene un ambiente que se queda contigo.", [['Asuán', ASWAN], ['Luxor', LUXOR]]),
  plain('h2', 'Dónde dormir cerca de Kom Ombo'),
  plain('normal', 'Aunque el pueblo de Kom Ombo no tiene hoteles, está justo entre Asuán (50 km al sur) y Luxor (170 km al norte) — dos ciudades con una oferta de alojamiento amplia. Alojarte en cualquiera de las dos te da hoteles cómodos, con Kom Ombo como una parada fácil en el camino.'),
  plain('h3', 'Alojamiento de lujo en Asuán'),
  propBullet('Sofitel Legend Old Cataract Aswan', 'Un hotel histórico con vistas al Nilo, célebre por su encanto colonial, sus interiores suntuosos y un servicio impecable. Perfecto si buscas lujo con profundidad cultural.'),
  propBullet('The Zen Wellness Resort', 'Un retiro a unos 40 minutos de Kom Ombo, pensado para desconectar: tratamientos de spa, jardines frondosos y una cocina centrada en el bienestar. Un buen contraste después de un día de templos.'),
  plain('h3', 'Comodidad de gama media'),
  propBullet('Tolip Aswan Hotel', 'Una opción sólida y asequible, con vistas al Nilo, habitaciones amplias y una ubicación central que facilita el traslado a Kom Ombo.'),
  propBullet('Basma Hotel Aswan', 'En lo alto de una colina, con vistas panorámicas, decoración de inspiración nubia y una hospitalidad cercana. Ideal para grupos pequeños y viajeros interesados en la cultura.'),
  plain('h3', 'Opciones económicas y experiencias locales'),
  plain('normal', 'Si viajas con un presupuesto más ajustado, las pensiones de Asuán y Luxor ofrecen estancias limpias y acogedoras, a menudo con toques de la cultura nubia y comida casera. En Kom Ombo no hay hoteles formales, y aunque a veces alguna casa local ofrece alojamiento básico para mochileros, la mayoría prefiere la comodidad de Asuán, Luxor o un crucero.'),
  plain('h2', 'A flote: cruceros por el Nilo que paran en Kom Ombo'),
  plain('normal', 'La forma más habitual de conocer Kom Ombo es en un crucero por el Nilo — casi todos los itinerarios incluyen una parada justo junto al templo. Es viaje, alojamiento y visitas guiadas, todo en uno.'),
  labelBullet('Cruceros de lujo', ': Guías privados, comidas de alta cocina, servicios de spa — pensados para parejas y familias.'),
  labelBullet('Cruceros en dahabiya (ecológicos)', ': Embarcaciones más pequeñas y a vela, para un ritmo íntimo y pausado.'),
  labelBullet('Cruceros estándar', ': Opciones prácticas, con pensión completa y visitas a los templos ya programadas.'),
  plain('normal', 'Elijas el que elijas, bajar del barco para recorrer Kom Ombo al amanecer o al atardecer es de esas cosas que se quedan contigo.'),
  plain('h2', 'Consejos prácticos para visitar Kom Ombo'),
  labelBullet('Planifica con antelación', ': Los hoteles de Asuán se llenan en temporada alta (octubre–abril). Reserva pronto.'),
  labelBullet('Traslados privados', ': Se pueden organizar traslados a medida desde Asuán o Luxor, con paradas para hacer turismo por el camino.'),
  labelBullet('Mejor momento para ir', ': Temprano por la mañana o al atardecer, cuando hace menos calor, hay menos gente y la luz es mejor.'),
];

// ---------- JA body (temple link in standfirst) ----------
const jaBody = [
  linked("コム・オンボでホテルをお探しですか？町そのものには見つかりません——けれど、それを理由に諦める必要はありません。コム・オンボは上エジプトの穴場のひとつ。ソベクとホルスに捧げられた、珍しい二柱神殿で知られています。ナイル川クルーズで訪れるにせよ、アスワンやルクソールからの日帰りにせよ、川辺に立つこの神殿の空気は、記憶に残ります。", [['二柱神殿', TEMPLE], ['アスワン', ASWAN], ['ルクソール', LUXOR]]),
  plain('h2', 'コム・オンボ周辺で泊まる'),
  plain('normal', 'コム・オンボの町にホテルはありませんが、アスワン（南へ50km）とルクソール（北へ170km）のちょうど中間にあります。どちらの街にも、宿の選択肢は豊富です。どちらかに泊まれば快適に過ごしながら、コム・オンボを道中の気軽な立ち寄り先にできます。'),
  plain('h3', 'アスワンの高級ステイ'),
  propBullet('Sofitel Legend Old Cataract Aswan', 'ナイルを見渡す歴史あるホテル。植民地時代の趣と豪華な内装、行き届いたサービスで知られています。贅沢と文化的な深みを求める旅に。'),
  propBullet('The Zen Wellness Resort', 'コム・オンボから車で約40分、寛ぐために作られたリゾート。スパトリートメント、緑豊かな庭園、ウェルネスを意識した食事。神殿巡りのあとの、心地よい切り替えに。'),
  plain('h3', 'ミッドレンジの快適さ'),
  propBullet('Tolip Aswan Hotel', '手頃で安心な選択肢。ナイルの眺め、広々とした客室、そしてコム・オンボへの移動にも便利な中心部の立地。'),
  propBullet('Basma Hotel Aswan', '丘の上に立ち、パノラマの眺めとヌビア様式の内装、温かいもてなしが魅力。少人数のグループや、文化に関心のある旅行者に向いています。'),
  plain('h3', '手頃な選択肢と地元の体験'),
  plain('normal', '予算を抑えたい旅行者には、アスワンやルクソールのゲストハウスが清潔で居心地よく、ヌビア文化の趣や家庭料理を味わえることもあります。コム・オンボ自体に正式なホテルはなく、まれに地元の家がバックパッカー向けの簡素な宿を提供することもありますが、多くの旅行者はアスワンやルクソール、あるいはクルーズの快適さを選びます。'),
  plain('h2', '水上で過ごす——コム・オンボに寄港するナイル川クルーズ'),
  plain('normal', 'コム・オンボを知る最も一般的な方法は、ナイル川クルーズです。ほとんどの旅程が、神殿のすぐそばへの寄港を含んでいます。移動、宿泊、ガイド付き観光がひとつになったスタイルです。'),
  labelBullet('ラグジュアリークルーズ', '：専属ガイド、こだわりの食事、スパサービス——カップルやご家族に。'),
  labelBullet('エコ・ダハビーヤクルーズ', '：小型の帆船で、ゆったりとした親密な船旅を。'),
  labelBullet('スタンダードクルーズ', '：実用的でオールインクルーシブ、神殿観光もあらかじめ組まれています。'),
  plain('normal', 'どれを選んでも、夜明けや夕暮れに船を降りてコム・オンボを歩く時間は、格別なものになります。'),
  plain('h2', 'コム・オンボ観光の実用ヒント'),
  labelBullet('早めの計画を', '：アスワンのホテルはハイシーズン（10月〜4月）に満室になりがちです。早めの予約を。'),
  labelBullet('専用の送迎', '：アスワンやルクソールから、観光を挟んだ専用の送迎を手配できます。'),
  labelBullet('訪れるベストな時間帯', '：早朝か夕方が、涼しく、人も少なく、光も美しくおすすめです。'),
];

const META_TITLE = { en: 'Where to Stay in Kom Ombo', es: 'Dónde Alojarse en Kom Ombo', ja: 'コム・オンボの宿泊先ガイド' };
const META_DESC = {
  en: 'Kom Ombo has no hotels of its own — Aswan and Luxor are the base, and most travellers see the temple from a cruise deck anyway.',
  es: 'Kom Ombo no tiene hoteles propios — Asuán y Luxor son la base, y la mayoría de los viajeros ve el templo desde la cubierta de un crucero.',
  ja: 'コム・オンボ自体にはホテルがありません。拠点になるのはアスワンとルクソール。そして多くの旅行者は、クルーズ船のデッキから神殿を眺めることになります。',
};

// EN surgical edits
const EN_DELETE = ['000000000001', '00000000004b', '00000000004f', '000000000052', '000000000053', '000000000055', '000000000057', '000000000059'];
const EN_DELINK: Array<[string, string]> = [['00000000001c', '000000000018'], ['000000000021', '00000000001d'], ['000000000033', '000000000030'], ['000000000046', '000000000043']];

async function main() {
  console.log(`=== ${APPLY ? 'APPLY' : 'DRY RUN'}: ${ID} Kom Ombo parity + EN cleanup ===\n`);
  const pub: any = await client.getDocument(ID);
  if (await client.getDocument(`drafts.${ID}`)) throw new Error('draft exists');
  const doc = JSON.parse(JSON.stringify(pub));
  const bodyOf = (l: string) => doc.body.find((b: any) => b._key === l);

  // EN
  const en = bodyOf('en');
  const delSet = new Set(EN_DELETE);
  en.value = en.value.filter((b: any) => !delSet.has(b._key));
  for (const [blockKey, mdKey] of EN_DELINK) {
    const b = en.value.find((x: any) => x._key === blockKey);
    if (!b) throw new Error(`EN delink block ${blockKey} missing`);
    b.markDefs = (b.markDefs ?? []).filter((m: any) => m._key !== mdKey);
    for (const c of b.children ?? []) c.marks = (c.marks ?? []).filter((m: string) => m !== mdKey);
  }
  // ES / JA full replace
  bodyOf('es').value = esBody;
  bodyOf('ja').value = jaBody;

  // fields
  doc.title = (['en', 'es', 'ja'] as const).map((l) => ({ _key: l, _type: 'internationalizedArrayStringValue', value: META_TITLE[l] }));
  doc.summary = [];
  doc.seo = { ...(doc.seo ?? {}), metaDescription: (['en', 'es', 'ja'] as const).map((l) => ({ _key: l, _type: 'internationalizedArrayTextValue', value: META_DESC[l] })) };

  // report
  console.log('block counts (orig -> new):');
  for (const l of ['en', 'es', 'ja']) console.log(`  ${l}: ${pub.body.find((b: any) => b._key === l).value.length} -> ${bodyOf(l).value.length}`);
  console.log('\nEN debris gone?', ['Your Tailored Journey', "Egypt's Finest Stays", 'Where to Stay When Visiting'].map((s) => `${s.slice(0, 20)}=${!en.value.some((b: any) => bt(b).includes(s))}`).join(' '));
  console.log('EN decorative t2e links remaining:', en.value.flatMap((b: any) => (b.markDefs || []).filter((m: any) => /travel2egypt/.test(m.href || ''))).length, '(should be 0)');
  console.log('EN property names still bold+present:', ['Sofitel Legend', 'Tolip Aswan', 'Basma Hotel'].every((n) => en.value.some((b: any) => bt(b).includes(n))));
  for (const l of ['es', 'ja']) {
    const sf = bodyOf(l).value[0];
    const h2 = bodyOf(l).value.filter((b: any) => b.style === 'h2').length;
    const h3 = bodyOf(l).value.filter((b: any) => b.style === 'h3').length;
    const ext = bodyOf(l).value.flatMap((b: any) => (b.markDefs || []).filter((m: any) => m._type === 'externalLink')).length;
    const intl = bodyOf(l).value.flatMap((b: any) => (b.markDefs || []).filter((m: any) => m._type === 'internalLink').map((m: any) => m.reference?._ref));
    console.log(`  ${l}: blocks=${bodyOf(l).value.length} h2=${h2} h3=${h3} externalLinks=${ext} standfirstInternalLinks=[${intl.join(',')}]`);
  }
  console.log('titles:', doc.title.map((t: any) => `${t._key}="${t.value}"`).join(' '));
  console.log('summary cleared:', JSON.stringify(doc.summary), '| seo.metaDesc keys:', doc.seo.metaDescription.map((m: any) => m._key).join(','));

  if (!APPLY) { console.log('\nDRY RUN — re-run with APPLY=1.'); return; }
  mkdirSync('backups', { recursive: true });
  writeFileSync('backups/komombo-parity-stage-rollback-2026-07-10.json', JSON.stringify(pub, null, 2));
  doc._id = `drafts.${ID}`;
  await client.createOrReplace(doc);
  console.log(`\n✓ staged drafts.${ID} — NOT published.`);
}
main().catch((e) => { console.error(e); process.exit(1); });
