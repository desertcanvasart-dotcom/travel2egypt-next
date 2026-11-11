import assert from 'node:assert/strict';

import { trimMetaDescription as trim } from '../meta-description';

// 1. Short and clean → unchanged.
assert.equal(trim('Private Egypt tours, priced openly.', 'en'), 'Private Egypt tours, priced openly.');
assert.equal(trim('  extra   spaces  ', 'en'), 'extra spaces');
assert.equal(trim(null, 'en'), '');

// 2. Long → last complete sentence within 155.
const long =
  'The Black Pyramid at Dahshur was built for Amenemhat III. Its mudbrick core slumped almost at once, and the king moved his burial to Hawara instead. Today the ruin is a dark stump on the desert edge that most visitors only see from afar.';
const out = trim(long, 'en');
assert.ok(out.length <= 155, `length ${out.length}`);
assert.equal(out, 'The Black Pyramid at Dahshur was built for Amenemhat III. Its mudbrick core slumped almost at once, and the king moved his burial to Hawara instead.');

// A sentence that ends too early (< min) is not used; whole-word cut instead.
const noGoodSentence =
  'Short one. ' + 'Then a very long clause that keeps going without a full stop for well over one hundred and fifty five characters so that the cut must fall on a word';
const w = trim(noGoodSentence, 'en');
assert.ok(w.endsWith('…') && w.length <= 155 && !/\s…$/.test(w), w);
assert.ok(!/\bwor…$/.test(w));

// Mid-word migration cut at 240 → never ends mid-word.
const cut240 =
  'Located in Zawyet el-Aryan, the Layer Pyramid is commonly attributed to Khaba and is one of three Old Kingdom pyramids found in this area between Giza and Abusir, with the other two being the Be';
assert.ok(cut240.length > 155);
const k = trim(cut240, 'en');
assert.ok(k.length <= 155);
assert.ok(!k.endsWith('Be') && !k.endsWith('Be…'), k);

// Abbreviations are not sentence ends.
const abbr =
  'Built c. 1850 BC under Amenemhat III, the pyramid sits beside the Red Pyramid of Sneferu and the Bent Pyramid, which together frame the royal necropolis of Dahshur today.';
assert.ok(!trim(abbr, 'en').startsWith('Built c.') || trim(abbr, 'en').length > 9);

// An already-truncated text ending in "…" prefers a complete sentence.
const ell = 'Abu Simbel rises from the sands of Nubia near the border with Sudan. Towering statues and intricate carvings tell a story of legacy and kingship…';
assert.equal(trim(ell, 'en'), 'Abu Simbel rises from the sands of Nubia near the border with Sudan.');

// Spanish behaves like English.
assert.ok(trim('Explora los misterios del Nilo. '.repeat(8), 'es').length <= 155);

// 3. Japanese: 110 limit, 。 as sentence end.
const ja =
  'ヌビアの黄金の砂丘から堂々とそびえ立つアブ・シンベルは、エジプトの南端に位置する古代世界で最も驚異的な記念碑の一つです。圧倒的な像、精緻な彫刻、そして卓越した工学がここに集まり、力強い物語を語りかけます。それは遺産、野望、神聖な王権の物語です。';
const j = trim(ja, 'ja');
assert.ok(j.length <= 110, `ja length ${j.length}`);
assert.ok(j.endsWith('。'), j);

// Japanese with no 。 in range → cut at 、 with …
const jaNoStop = 'エジプト伝統料理を味わえる人気レストラン、レトロなインテリアと、モロヘイヤスープやブドウの葉の詰め物など、クラシックなメニューで、エジプトの家庭の味を気軽に楽しめる、地元の人にも旅行者にも愛される一軒、カイロ中心部の便利な立地';
const jn = trim(jaNoStop, 'ja');
assert.ok(jn.length <= 110 && jn.endsWith('…'), jn);

// A sentence end inside quotation marks is not used.
const quoted = 'Explora los misterios y los hechos en nuestra guía "¿Hay cocodrilos en el río Nilo? Guía de viaje Wādī Al Natron", que incluye consejos sobre la vida salvaje y el viaje.';
const qo = trim(quoted, 'es');
assert.ok(!qo.endsWith('Nilo?'), qo);
assert.ok(qo.length <= 155, qo);

// Spanish era abbreviations are not sentence ends.
const era = 'El complejo-mausoleo del sultán Qaytbay en el Cementerio Norte fue construido entre 1470 y 1474 d. C. y es una de las obras más refinadas del arte mameluco tardío en El Cairo.';
assert.ok(!trim(era, 'es').endsWith(' d.'), trim(era, 'es'));

// A long text never falls under 100 when a fuller cut is possible.
const longSp = 'La Mezquita de Mohamed Alí es el edificio visualmente más dominante de El Cairo. Domina la Ciudadela desde su construcción en el siglo XIX y su silueta se ve desde casi toda la ciudad…';
assert.ok(trim(longSp, 'es').length >= 100, trim(longSp, 'es'));

console.log('meta-description: all assertions passed');
