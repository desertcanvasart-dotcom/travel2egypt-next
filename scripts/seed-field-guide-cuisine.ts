/**
 * Seed Field Guide No. 04 — "Egypt, On a Plate" — into Sanity.
 *
 * Now trilingual (EN/ES/JA). The original EN body stayed authoritative
 * for the first publish; the ES and JA bodies were added later from
 * editor-provided markdown — translator's choice on a few entry names
 * (Mahallabia → Muhallabia/ムハッラビーヤ, Cairo → El Cairo/カイロ, etc.)
 * is preserved on the locale side.
 *
 *   pnpm tsx scripts/seed-field-guide-cuisine.ts
 *   pnpm tsx scripts/seed-field-guide-cuisine.ts --commit
 */

import { config as loadEnv } from 'dotenv';
import path from 'node:path';
import { createClient, type SanityClient } from '@sanity/client';

loadEnv({ path: path.resolve(process.cwd(), '.env') });

const DATASET = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production';
const PROJECT_ID = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'ufallvd2';
const DOC_ID = 'fieldGuide-egyptian-cuisine';

const commit = process.argv.includes('--commit');

function die(msg: string): never {
  console.error(`✖ ${msg}`);
  process.exit(1);
}

function getClient(): SanityClient {
  const isProd = DATASET === 'production';
  const token = isProd
    ? process.env.SANITY_PRODUCTION_API_WRITE_TOKEN ||
      process.env.SANITY_API_WRITE_TOKEN
    : process.env.SANITY_STAGING_API_WRITE_TOKEN ||
      process.env.SANITY_API_WRITE_TOKEN;
  if (!token) die(`No write token in env for dataset "${DATASET}"`);
  return createClient({
    projectId: PROJECT_ID,
    dataset: DATASET,
    apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2024-12-01',
    token,
    useCdn: false,
  });
}

// ── i18n shape helpers ──────────────────────────────────────────────────
type Tri = { en: string; es: string; ja: string };
const tri = (t: Tri) => [
  { _key: 'en', value: t.en },
  { _key: 'es', value: t.es },
  { _key: 'ja', value: t.ja },
];
const enSlug = (current: string) => [
  { _key: 'en', value: { _type: 'slug' as const, current } },
];

// ── Intro ───────────────────────────────────────────────────────────────
const INTRO: Tri = {
  en: `Egyptian cuisine is one of the oldest continuously cooked food traditions in the world — the staple of fava beans (ful) appears in pharaonic tomb paintings, koshari combines ingredients that trace different empires' arrivals, and the bread (aish) is still baked in the same shape it was thousands of years ago. Most travelers eat the wrong version of all of it.

The wrong version isn't bad food. It's hotel buffet food, tourist-strip food, the safe-bet international menus that exist because operators assume foreigners want them. What follows is the short list of what to seek out instead, where to find it, and how to eat it the way Egyptians do.`,
  es: `La cocina egipcia es una de las tradiciones culinarias vivas más antiguas del mundo —el plato base de habas (ful) aparece ya en pinturas de tumbas faraónicas, el koshari combina ingredientes que rastrean la llegada de distintos imperios, y el pan (eish) sigue horneándose con la misma forma que hace miles de años. La mayoría de los viajeros come la versión equivocada de todo ello.

La versión equivocada no es mala comida. Es el bufé del hotel, la comida de las zonas turísticas, las cartas internacionales a prueba de error que existen porque los operadores asumen que los extranjeros las quieren. Lo que sigue es la lista corta de qué buscar, dónde encontrarlo, y cómo comerlo como lo hacen los egipcios.`,
  ja: `エジプト料理は、世界で最も古い、途切れることなく調理され続けてきた食の伝統のひとつです——主食であるそら豆（フール）はファラオ時代の墓の壁画に登場し、コシャリは異なる帝国の到来をたどれる食材を組み合わせ、パン（アイシュ）はいまも数千年前と同じ形で焼かれています。たいていの旅行者は、そのすべての間違った版を食べることになります。

その間違った版とは、まずい料理のことではありません。それはホテルのビュッフェの料理、観光客通りの料理、運営側が外国人はこれを欲しがるはずだと想定している、無難な国際メニューのことです。以下は、その代わりに何を求めるべきか、どこでそれを見つけるか、そしてエジプトの人びとと同じように食べる方法についての、短いリストです。`,
};

// ── Glossary entries (per section) ──────────────────────────────────────
type Entry = {
  name: Tri;
  description: Tri;
  operatorNote?: Tri;
};

const FIRST_24H: Entry[] = [
  {
    name: { en: 'Koshari', es: 'Koshari', ja: 'コシャリ' },
    description: {
      en: `Egypt's national dish. Rice, macaroni, lentils, chickpeas, fried onions, tomato sauce, garlic vinegar. Eaten by mixing everything thoroughly before the first bite, then adding the chili oil (shaṭṭa) and garlic vinegar to taste. Vegan by accident. Cheap by design — invented during British occupation as a way to combine available imported and local ingredients.`,
      es: `El plato nacional de Egipto. Arroz, macarrones, lentejas, garbanzos, cebolla frita, salsa de tomate, vinagre de ajo. Se come mezclando todo a fondo antes del primer bocado, y luego añadiendo aceite de chile (shatta) y vinagre de ajo al gusto. Vegano por accidente. Barato por diseño —inventado durante la ocupación británica como forma de combinar los ingredientes locales e importados disponibles.`,
      ja: `エジプトの国民食です。米、マカロニ、レンズ豆、ひよこ豆、揚げ玉ねぎ、トマトソース、にんにくビネガー。最初のひと口の前に全体をよく混ぜてから、チリオイル（シャッタ）とにんにくビネガーをお好みで足していただきます。図らずもヴィーガン仕様です。意図して安価です——イギリス占領下に、入手できた輸入食材と地元食材を組み合わせる方法として生まれました。`,
    },
    operatorNote: {
      en: `Koshari Abou Tarek in downtown Cairo is the canonical version, but most neighborhood koshari shops are excellent. Avoid hotel restaurant versions — they're usually a flattened approximation.`,
      es: `Koshari Abou Tarek, en el centro de El Cairo, es la versión canónica, pero la mayoría de las tiendas de koshari de barrio son excelentes. Evite las versiones del restaurante del hotel —suelen ser una versión aproximada, no la real.`,
      ja: `カイロのダウンタウンにあるコシャリ・アブー・タレクが定番中の定番ですが、街の近所のコシャリ店の多くも素晴らしいです。ホテルのレストランの版は避けてください——たいていは風味だけ似せた近似で、本物ではありません。`,
    },
  },
  {
    name: { en: 'Ful medames', es: 'Ful medames', ja: 'フール・メダメス' },
    description: {
      en: `Slow-cooked fava beans, served with olive oil, lemon, cumin, and bread. Breakfast staple eaten by scooping with bread, not a spoon.`,
      es: `Habas cocinadas a fuego lento, servidas con aceite de oliva, limón, comino y pan. Plato básico del desayuno, se come mojando pan, no con cuchara.`,
      ja: `じっくりと煮込んだそら豆を、オリーブオイル、レモン、クミン、パンとともに供します。朝食の定番で、スプーンではなく、パンですくっていただきます。`,
    },
    operatorNote: {
      en: `Ful is breakfast food. Order it at a ful and falafel place in the morning, with fresh aish baladi bread, eggs, and tahini on the side.`,
      es: `El ful es comida de desayuno. Pídalo a primera hora de la mañana, con pan recién horneado, huevos y tahini al lado.`,
      ja: `フールは朝食の食べ物です。朝早くに、焼きたてのパン、卵、タヒニを添えて注文してください。`,
    },
  },
  {
    name: { en: 'Aish baladi', es: 'Aish baladi', ja: 'アイシュ・バラディ' },
    description: {
      en: `Egyptian flatbread. The word aish literally means "life" in Egyptian Arabic. Eaten with everything.`,
      es: `El pan plano egipcio. La palabra aish significa literalmente "vida" en árabe egipcio. Se come con todo.`,
      ja: `エジプトのフラットブレッドです。アイシュという語は、エジプトのアラビア語で文字どおり「いのち」を意味します。何にでも合わせていただきます。`,
    },
    operatorNote: {
      en: `The bread you'll be served at any decent local restaurant is the bread Egyptians have eaten for thousands of years. Hotel bread is not. Seek out the local version.`,
      es: `Coma el pan caliente —es el pan que el país ha horneado durante miles de años. No se lo lleve, pero sí coma la versión local.`,
      ja: `パンは温かいうちに食べてください——これは国がこの数千年食べ続けてきたパンです。持ち帰らずに、その場で地元の版を味わってください。`,
    },
  },
];

const STAPLES: Entry[] = [
  {
    name: { en: "Ta'meya", es: "Ta'meya", ja: 'ターメイヤ' },
    description: {
      en: `Egyptian falafel, made with fava beans (not chickpeas like Levantine falafel). Bright green inside.`,
      es: `El falafel egipcio, hecho con habas (no garbanzos como el falafel levantino). Verde brillante por dentro.`,
      ja: `エジプト版のファラフェルです。レヴァントのファラフェルがひよこ豆を使うのに対し、こちらはそら豆を使います。中はきれいな緑色です。`,
    },
    operatorNote: {
      en: `The fava-bean base is what makes ta'meya distinctly Egyptian. Levantine falafel is also delicious but it's not the same dish.`,
      es: `La base de habas es lo que hace que el ta'meya sea distintivamente egipcio; el falafel levantino también es delicioso, pero no es el mismo plato.`,
      ja: `そら豆の生地こそが、ターメイヤをエジプトのものとして区別する核です。レヴァントのファラフェルもおいしいですが、同じ料理ではありません。`,
    },
  },
  {
    name: { en: 'Molokhia', es: 'Molokhia', ja: 'モロヘイヤ' },
    description: {
      en: `Soup of finely chopped jute leaves, garlic, coriander, meat or chicken. Slightly thick, slightly slimy texture (this is intentional).`,
      es: `Sopa de hojas de yute finamente picadas, ajo, cilantro, carne o pollo. Textura ligeramente espesa y ligeramente gelatinosa (es intencional).`,
      ja: `細かく刻んだジュート（モロヘイヤ）の葉、にんにく、コリアンダー、肉あるいは鶏のスープです。やや粘り気のある、少しとろっとした食感は意図的なものです。`,
    },
    operatorNote: {
      en: `The texture takes getting used to. Many travelers love it on the second try. Don't form an opinion on the first bite.`,
      es: `La textura requiere acostumbrarse. Muchos viajeros la aman al segundo intento. No se forme una opinión con el primer bocado.`,
      ja: `食感には慣れが必要です。多くの旅行者は二度目で好きになります。最初のひと口で判断しないでください。`,
    },
  },
  {
    name: { en: 'Mahshi', es: 'Mahshi', ja: 'マハシ' },
    description: {
      en: `Stuffed vegetables — cabbage leaves, vine leaves, zucchini, peppers — filled with seasoned rice. Home cooking; restaurant versions are often inferior.`,
      es: `Vegetales rellenos —hojas de col, hojas de parra, calabacines, pimientos— rellenos de arroz sazonado. Cocina de casa; las versiones de restaurante suelen ser inferiores.`,
      ja: `詰めものをした野菜です——キャベツの葉、ぶどうの葉、ズッキーニ、ピーマンに、味つけした米を詰めます。家庭料理であり、レストランの版はしばしば劣ります。`,
    },
    operatorNote: {
      en: `The best mahshi is in Egyptian homes. If your guide invites you to lunch, accept.`,
      es: `El mejor mahshi está en las casas egipcias. Si su guía le invita a comer, acepte.`,
      ja: `最高のマハシはエジプトの家庭にあります。ガイドが昼食に招いてくれたなら、ぜひお受けください。`,
    },
  },
  {
    name: { en: 'Bamya', es: 'Bamya', ja: 'バミヤ' },
    description: {
      en: `Okra stew, usually with tomato and meat. A standard weekday lunch at home and a fixture on every neighborhood menu.`,
      es: `Estofado de okra, normalmente con tomate y carne. Almuerzo estándar entre semana en casa y un fijo en cualquier carta de barrio.`,
      ja: `オクラのシチューです。たいていはトマトと肉とともに煮込まれます。家庭の平日昼食の定番であり、近所の食堂の常連メニューです。`,
    },
  },
  {
    name: { en: 'Fatta', es: 'Fatta', ja: 'ファッタ' },
    description: {
      en: `Celebration dish of rice, bread soaked in broth, meat, and a tomato-garlic-vinegar sauce. Served at weddings, religious holidays, and other special occasions — not casual fare.`,
      es: `Plato de celebración con arroz, pan empapado en caldo, carne y una salsa de tomate-ajo-vinagre. Se sirve en bodas, fiestas religiosas y otras ocasiones especiales —no es comida corriente.`,
      ja: `祝いの料理です。米、出汁にひたしたパン、肉、トマト・にんにく・ビネガーのソースから成ります。結婚式、宗教の祝日、その他の特別な機会に供されるもので、日常の食事ではありません。`,
    },
  },
  {
    name: { en: 'Hawawshi', es: 'Hawawshi', ja: 'ハワーウシ' },
    description: {
      en: `Spiced ground meat baked inside aish baladi bread until the crust crisps. A Cairo specialty, eaten by hand and best straight from the oven.`,
      es: `Carne molida especiada horneada dentro de pan aish baladi hasta que la corteza queda crujiente. Especialidad cairota, se come con la mano y mejor recién salida del horno.`,
      ja: `スパイスを効かせた挽き肉を、アイシュ・バラディの中に入れて、外側がぱりっとなるまで焼き上げます。カイロの名物で、手でいただくのが流儀。窯から出したばかりが最良です。`,
    },
  },
];

const BREAD_GRAINS_DAIRY: Entry[] = [
  {
    name: { en: 'Aish baladi', es: 'Aish baladi', ja: 'アイシュ・バラディ' },
    description: {
      en: `The whole-wheat flatbread covered above — the everyday Egyptian bread, eaten with breakfast, lunch, and dinner.`,
      es: `El pan plano integral mencionado arriba —el pan egipcio de todos los días, se come en el desayuno, la comida y la cena.`,
      ja: `上で触れた全粒粉のフラットブレッドです——エジプトの日常のパンで、朝食、昼食、夕食、すべてに合わせていただきます。`,
    },
  },
  {
    name: { en: 'Aish shami', es: 'Aish shami', ja: 'アイシュ・シャーミ' },
    description: {
      en: `Levantine-style white pita. Also common, especially in Cairo restaurants that lean toward a regional menu.`,
      es: `Pita blanca al estilo levantino. También común, especialmente en restaurantes cairotas con carta regional.`,
      ja: `レヴァント風の白いピタです。これもよく見かけますが、特にカイロで、より地域的なメニューを持つ店で出されます。`,
    },
  },
  {
    name: { en: 'Gibna domiati', es: 'Gibna domiati', ja: 'ジブナ・ドミアティ' },
    description: {
      en: `Soft white cheese named for the Nile Delta city of Damietta. Mild, slightly salty, served at breakfast with bread and olives.`,
      es: `Queso blanco suave que toma el nombre de la ciudad de Damietta, en el delta del Nilo. Suave, ligeramente salado, se sirve en el desayuno con pan y aceitunas.`,
      ja: `ナイル・デルタの都市、ダミエッタにちなんで名づけられた、柔らかい白いチーズです。穏やかで、わずかに塩味があり、朝食にパンとオリーブとともに供されます。`,
    },
  },
  {
    name: { en: 'Mish', es: 'Mish', ja: 'ミシュ' },
    description: {
      en: `Fermented cheese, traditionally preserved in clay jars for months. Sharp, pungent, and an acquired taste — but a real one once acquired.`,
      es: `Queso fermentado, tradicionalmente conservado en tinajas de arcilla durante meses. Fuerte, picante y un gusto adquirido —pero un gusto auténtico una vez adquirido.`,
      ja: `発酵させたチーズです。伝統的には粘土の壺で何ヶ月も保存されます。鋭く、強烈で、慣れの要る味です——ただし、慣れれば本物の味です。`,
    },
    operatorNote: {
      en: `Mish is the kind of thing Egyptian grandmothers make at home. Most restaurants don't serve it. If a family offers it to you, try a little.`,
      es: `El mish es la comida que las abuelas egipcias hacen en casa. La mayoría de los restaurantes no lo sirven. Si una familia se lo ofrece, pruébelo.`,
      ja: `ミシュは、エジプトの祖母たちが家庭で作る食べ物です。たいていのレストランでは供されません。家族から差し出されたなら、ぜひ試してみてください。`,
    },
  },
  {
    name: { en: 'Labneh', es: 'Labneh', ja: 'ラブネ' },
    description: {
      en: `Strained yogurt, served at breakfast with olive oil, za'atar, and bread. The standard Levantine breakfast spread is alive and well in Egypt too.`,
      es: `Yogur escurrido, servido en el desayuno con aceite de oliva, zaatar y pan. La clásica preparación levantina del desayuno también está viva en Egipto.`,
      ja: `水切りしたヨーグルトです。朝食に、オリーブオイル、ザータル、パンとともに供されます。定番のレヴァントの朝食の組み合わせは、エジプトでも健在です。`,
    },
  },
];

const DRINKS: Entry[] = [
  {
    name: { en: 'Karkadeh', es: 'Karkadeh', ja: 'カルカデ' },
    description: {
      en: `Hibiscus tea, served hot in winter and iced in summer. Egypt's most distinctive drink — deep red, tart, and slightly floral.`,
      es: `Té de hibisco, servido caliente en invierno y frío en verano. La bebida más distintiva de Egipto —rojo intenso, ácida y ligeramente floral.`,
      ja: `ハイビスカスティーです。冬には温かく、夏には冷たくして供されます。エジプトの最も特徴的な飲みものです——深い赤で、酸味があり、わずかに花の香りがします。`,
    },
    operatorNote: {
      en: `Karkadeh is also slightly blood-pressure-lowering, so go easy in heat.`,
      es: `El karkadeh también baja ligeramente la tensión arterial, así que no abuse.`,
      ja: `カルカデにはわずかに血圧を下げる作用もありますので、飲みすぎにはご注意を。`,
    },
  },
  {
    name: { en: 'Sahlab', es: 'Sahlab', ja: 'サハラブ' },
    description: {
      en: `Hot, thick, milky drink made from orchid tuber starch, topped with cinnamon, coconut, and chopped nuts. A winter drink, sold from carts on cold evenings.`,
      es: `Bebida caliente, espesa y lechosa hecha con almidón de tubérculo de orquídea, espolvoreada con canela, coco y nueces picadas. Bebida de invierno; se vende en carritos en las noches frías.`,
      ja: `温かく、とろりとして乳のように白い飲みもので、蘭の塊茎のでんぷんから作ります。シナモン、ココナッツ、刻んだナッツが上に乗せられます。冬の飲みもので、寒い夜に屋台で売られます。`,
    },
    operatorNote: {
      en: `Don't expect sahlab outside the cold months. It's seasonal in a way many travelers don't realize.`,
      es: `No espere encontrar sahlab fuera de los meses fríos. Es estacional de una forma que muchos viajeros no notan.`,
      ja: `寒い季節の外では、サハラブを期待しないでください。多くの旅行者が気づかない仕方で、季節限定です。`,
    },
  },
  {
    name: { en: 'Sobia', es: 'Sobia', ja: 'ソビア' },
    description: {
      en: `Coconut-and-rice drink, often associated with Ramadan. Sweet, creamy, served cold from large copper urns at iftar.`,
      es: `Bebida de coco y arroz, asociada a menudo con el Ramadán. Dulce, cremosa, servida fría en grandes urnas de cobre en el iftar.`,
      ja: `ココナッツと米の飲みものです。ラマダンとよく結びつけられます。甘く、クリーミーで、イフタールの席で大きな銅の壺から冷やして注がれます。`,
    },
  },
  {
    name: { en: 'Asab', es: 'Asab', ja: 'アサブ' },
    description: {
      en: `Fresh sugar cane juice, pressed at street stands. Sweet, grassy, and at its best from a clean stand on a hot afternoon.`,
      es: `Zumo de caña de azúcar recién prensado en los puestos callejeros. Dulce, herbáceo, y en su mejor forma desde un puesto limpio en una tarde calurosa.`,
      ja: `搾りたてのサトウキビジュースです。屋台で絞られます。甘く、青い香りがあり、暑い午後に清潔な屋台で飲む一杯が最良です。`,
    },
    operatorNote: {
      en: `Watch the stand press it in front of you. The clean stands are obvious; trust your eyes.`,
      es: `Mire la máquina antes de pedirlo. Los puestos limpios se notan; fíese del olfato.`,
      ja: `注文する前に、機械を一度よく見てください。清潔な屋台は見ればわかります。嗅覚を信じてください。`,
    },
  },
  {
    name: { en: 'Shai', es: 'Shai', ja: 'シャイ' },
    description: {
      en: `Egyptian tea. Black, brewed strong, served in small glasses with significant sugar — unless you specify bidūn sukkar (without sugar). Drunk everywhere, all day.`,
      es: `Té egipcio. Negro, hecho fuerte, servido en vasitos con bastante azúcar —a menos que se pida bedun sukkar (sin azúcar). Se bebe en todas partes, todo el día.`,
      ja: `エジプトの紅茶です。黒く、濃く、小さなグラスにかなりの砂糖を入れて供されます——bedun sukkar（砂糖なし）と特に頼まないかぎり。あらゆる場所で、一日中、飲まれます。`,
    },
  },
  {
    name: { en: 'Ahwa', es: 'Ahwa', ja: 'アフワ' },
    description: {
      en: `Turkish coffee. Ordered by sweetness level: sāda (no sugar), ʿar-rīḥa (lightly sweet), mazbūṭ (medium), ziyāda (very sweet).`,
      es: `Café turco. Se pide por nivel de dulzura: sada (sin azúcar), ariha (ligeramente dulce), mazbut (medio) y ziyada (muy dulce).`,
      ja: `トルコ風コーヒーです。甘さで注文します——サダ（砂糖なし）、アリーハ（軽め）、マズブート（中くらい）、ジヤダ（甘め）。`,
    },
    operatorNote: {
      en: `Mazbūṭ is the safe default if you're unsure.`,
      es: `Pídalo como ahwa ariha si no está seguro.`,
      ja: `迷ったときは、アフワ・アリーハと頼んでください。`,
    },
  },
];

const SWEETS: Entry[] = [
  {
    name: { en: 'Basbousa', es: 'Basbousa', ja: 'バスブーサ' },
    description: {
      en: `Semolina cake soaked in sugar syrup, often topped with coconut and a single almond. Dense, sweet, and reliably good across the country.`,
      es: `Bizcocho de sémola empapado en jarabe de azúcar, a menudo cubierto de coco y una sola almendra. Denso, dulce, y consistentemente bueno en todo el país.`,
      ja: `シロップにひたしたセモリナ・ケーキです。たいていはココナッツと一粒のアーモンドが上に乗ります。密度があり、甘く、国中どこでも安定しておいしいものです。`,
    },
  },
  {
    name: { en: 'Konafa', es: 'Konafa', ja: 'コナーファ' },
    description: {
      en: `Thin pastry strands wrapped around a sweet filling — cheese, cream, or nuts — and soaked in syrup. The cheese version is the classic and the one most travelers underrate.`,
      es: `Hebras de masa filo envueltas alrededor de un relleno dulce —queso, crema o nueces— y empapadas en jarabe. La versión de queso es la clásica y la que más subestiman los viajeros.`,
      ja: `細い麺状の生地で、甘い具材——チーズ、クリーム、ナッツのいずれか——を包み、シロップにひたしたお菓子です。チーズ版が定番で、多くの旅行者が過小評価しているものです。`,
    },
  },
  {
    name: { en: 'Umm Ali', es: 'Umm Ali', ja: 'ウンム・アリー' },
    description: {
      en: `Bread pudding with milk, nuts, and raisins. The apocryphal story: named after a sultan's wife who celebrated a rival's death by ordering this dish distributed across Egypt.`,
      es: `Budín de pan con leche, nueces y pasas. La historia apócrifa: lleva el nombre de la esposa de un sultán que celebró la muerte de una rival ordenando que se distribuyera este plato por todo Egipto.`,
      ja: `ミルク、ナッツ、レーズンを使ったパンプディングです。伝えられる話によれば、あるサルタンの妻が、ライバルの死を祝うために、この料理をエジプト中に配るよう命じたことに因んで名づけられたといいます。`,
    },
    operatorNote: {
      en: `The story is probably apocryphal. The pudding is real and excellent.`,
      es: `La historia es probablemente apócrifa. El budín es real y excelente.`,
      ja: `話はおそらく作り話です。プディングは本物で、素晴らしいものです。`,
    },
  },
  {
    name: { en: 'Mahallabia', es: 'Muhallabia', ja: 'ムハッラビーヤ' },
    description: {
      en: `Milk pudding scented with rose water and topped with pistachios. Cooler and lighter than the syrup-soaked sweets — a good close to a heavy meal.`,
      es: `Pudín de leche perfumado con agua de rosas y cubierto de pistachos. Más ligero y fresco que los dulces empapados en jarabe —un buen cierre para una comida pesada.`,
      ja: `ローズウォーターで香りづけしたミルクプディングで、上にピスタチオが乗ります。シロップで重くなったお菓子よりも、軽くて涼やかです——重い食事の締めにふさわしいものです。`,
    },
  },
  {
    name: { en: 'Roz bi laban', es: 'Roz bi laban', ja: 'ロズ・ビ・ラバン' },
    description: {
      en: `Rice pudding. The home-kitchen dessert. Served warm or cold, dusted with cinnamon.`,
      es: `Arroz con leche. El postre de cocina casera. Se sirve caliente o frío, espolvoreado con canela.`,
      ja: `ライス・プディングです。家庭の台所のデザートです。温かくても冷たくてもよく、シナモンが上にふられます。`,
    },
  },
];

const WHERE_TO_EAT: Entry[] = [
  {
    name: { en: 'Cairo', es: 'El Cairo', ja: 'カイロ' },
    description: {
      en: `Koshari (Abou Tarek and the neighborhood shops), hawawshi from a Cairo bakery, and the full breakfast spread — ful, ta'meya, eggs, gibna, fresh aish baladi. The downtown koshari counters and the old-quarter ful and falafel shops are the canonical experiences.`,
      es: `Koshari (Abou Tarek y las tiendas de barrio), hawawshi (de una panadería cairota), y el desayuno de ful —ful, ta'meya, huevos, gibna, aish baladi recién horneado. Los mostradores de koshari del centro y las tiendas de ful y falafel de los barrios antiguos son las experiencias canónicas.`,
      ja: `コシャリ（アブー・タレクと近所の店）、ハワーウシ（カイロのパン屋から）、そしてフールの朝食一式——フール、ターメイヤ、卵、ジブナ、焼きたてのアイシュ・バラディ。ダウンタウンのコシャリ・カウンターと旧市街のフールとファラフェルの店が、定番中の定番です。`,
    },
  },
  {
    name: { en: 'Alexandria', es: 'Alejandría', ja: 'アレクサンドリア' },
    description: {
      en: `Seafood. The Mediterranean coast tradition is distinct from inland Egypt — fish grilled whole with cumin, garlic, and lemon, eaten with bread and tahini at simple harbour-side restaurants.`,
      es: `Pescado y marisco. La tradición mediterránea es distinta de la del Egipto interior —pescado entero a la parrilla con cebolla, ajo y limón, comido con pan y ensaladas en restaurantes sencillos junto al puerto.`,
      ja: `シーフードです。地中海沿岸の伝統は、内陸エジプトとははっきり異なります——丸ごとの魚を玉ねぎ、にんにく、レモンとともにグリルし、港沿いの素朴な店でパンとサラダとともに食べます。`,
    },
  },
  {
    name: { en: 'Aswan and Upper Egypt', es: 'Asuán y el Alto Egipto', ja: 'アスワンと上エジプト' },
    description: {
      en: `Nubian cuisine — distinct from the rest of Egypt. Slow-cooked stews, freshwater fish from the Nile, and hibiscus (karkadeh) which is particularly associated with Aswan.`,
      es: `Cocina nubia —distinta del resto de Egipto. Estofados a fuego lento, pescado de agua dulce del Nilo, y el hibisco (karkadeh) que está particularmente asociado con Asuán.`,
      ja: `ヌビア料理です——エジプトのほかとは別ものです。じっくりと煮込むシチュー、ナイル川の淡水魚、そしてアスワンと特に強く結びつくハイビスカス（カルカデ）。`,
    },
  },
  {
    name: { en: 'Siwa', es: 'Siwa', ja: 'シーワ' },
    description: {
      en: `Desert cuisine. Dates, olives, and abud — a date-stuffed bread baked in the embers of a wood fire. Lamb is the meat of choice; tea and karkadeh are the social rhythm.`,
      es: `Cocina del desierto. Dátiles, aceitunas y abod —pan relleno de dátiles horneado en las brasas de un fuego de leña. El cordero es la carne de elección; el té y el karkadeh marcan el ritmo social.`,
      ja: `砂漠の料理です。デーツ、オリーブ、そしてアボッド——薪火の燠で焼いた、デーツを詰めたパンです。羊肉が選ばれる肉で、お茶とカルカデが社交のリズムを刻みます。`,
    },
  },
];

const DIETARY: Entry[] = [
  {
    name: { en: 'Vegetarian and vegan', es: 'Vegetariano y vegano', ja: 'ベジタリアンとヴィーガン' },
    description: {
      en: `Easier than most travelers expect. Koshari, ful, ta'meya, vegetarian mahshi, meatless molokhia, and the entire bread-cheese-labneh breakfast spread are vegetarian or veganizable. Egypt has a long Coptic tradition of meatless fasting cooking that translates directly into everyday options.`,
      es: `Más fácil de lo que la mayoría de los viajeros esperan. El koshari, el ful, el ta'meya, el mahshi vegetariano, la molokhia sin carne, y todo el desayuno de pan-queso-labneh son vegetarianos o adaptables a vegano. Egipto tiene una larga tradición copta de cocina sin carne durante el ayuno que se traslada directamente a las opciones de todos los días.`,
      ja: `多くの旅行者が予想するより容易です。コシャリ、フール、ターメイヤ、肉なしのマハシ、肉なしのモロヘイヤ、そしてパン・チーズ・ラブネの朝食一式は、ベジタリアン、またはヴィーガン化が可能です。エジプトには、断食期間中の肉なし料理を作るコプトの長い伝統があり、それが日常の選択肢に直接つながっています。`,
    },
  },
  {
    name: { en: 'Halal', es: 'Halal', ja: 'ハラル' },
    description: {
      en: `Assumed default. Most restaurants outside the hotel zones are halal without needing to be advertised as such.`,
      es: `Asumido por defecto. La mayoría de los restaurantes fuera de las zonas hoteleras son halal sin necesidad de anunciarlo.`,
      ja: `デフォルトで想定されています。ホテル地区の外にあるレストランの大半は、特に表示しなくてもハラルです。`,
    },
  },
  {
    name: { en: 'Pork', es: 'Cerdo', ja: '豚肉' },
    description: {
      en: `Rare. Available in some hotel restaurants and in Christian-area delis, but not on standard menus.`,
      es: `Raro. Disponible en algunos restaurantes de hotel y en charcuterías de zonas cristianas, pero no en las cartas habituales.`,
      ja: `珍しいものです。一部のホテルのレストランや、キリスト教徒地区のデリで入手できますが、通常のメニューには載りません。`,
    },
  },
  {
    name: { en: 'Alcohol', es: 'Alcohol', ja: 'アルコール' },
    description: {
      en: `Available in licensed restaurants, hotels, and tourist zones — not in most local eateries. Egyptian beer (Stella, Sakara) and Egyptian wine (Omar Khayyam, Grand Marquis) exist and are decent.`,
      es: `Disponible en restaurantes con licencia, hoteles y zonas turísticas —no en la mayoría de los locales locales. La cerveza egipcia (Stella, Sakara) y el vino egipcio (Omar Khayyam, Grand Marquis) existen y son decentes.`,
      ja: `ライセンスのあるレストラン、ホテル、観光地区では入手できます——大半の地元食堂では入手できません。エジプトのビール（ステラ、サカラ）とエジプトのワイン（オマール・ハイヤーム、グラン・マルキ）が存在し、そこそこ良いものです。`,
    },
  },
  {
    name: { en: 'Tap water', es: 'Agua del grifo', ja: '水道水' },
    description: {
      en: `Don't drink it. Bottled water is universal and cheap. Ice in tourist restaurants is generally fine; skip it in street-food contexts.`,
      es: `No la beba. El agua embotellada es universal y barata. El hielo en restaurantes turísticos suele estar bien; evítelo en contextos de comida callejera.`,
      ja: `飲まないでください。ボトル入りの水はあらゆる場所にあり、安価です。観光向けのレストランの氷はおおむね大丈夫ですが、ストリートフードの文脈では避けてください。`,
    },
  },
];

// ── Closing ─────────────────────────────────────────────────────────────
const CLOSING: Tri = {
  en: `Egyptian food rewards the traveler who treats it as a cuisine rather than a buffet. The hotel version is usually a flattened approximation; the real version is in the neighborhood ful shop, the downtown koshari counter, the family lunch you're invited to halfway through your trip.

The list above is a starting point. The good version is found by asking your guide where they actually eat — and trusting the answer.`,
  es: `La comida egipcia recompensa al viajero que la trata como una cocina y no como un bufé. La versión del hotel suele ser una aproximación aplanada; la versión real está en la tienda de ful del barrio, en el mostrador de koshari del centro, en la comida familiar a la que le invitan a mitad del viaje.

Lo de arriba es un punto de partida. La versión buena se encuentra preguntando a su guía dónde come realmente —y fiándose de la respuesta.`,
  ja: `エジプトの食は、それを「ビュッフェ」ではなく「料理」として扱う旅行者に応えてくれます。ホテル版はたいてい平準化された近似であり、本物の版は、近所のフール店、ダウンタウンのコシャリ・カウンター、そして旅の半ばに招かれる家族の昼食の中にあります。

以上はあくまで出発点です。本物の版は、ガイドが本当に通う場所を尋ね、その答えを信じることで見つかります。`,
};

// ── Section frames + titles ─────────────────────────────────────────────
type SectionDef = {
  key: string;
  title: Tri;
  body: Tri;
  entries: Entry[];
  emphasized: boolean;
};

const SECTIONS: SectionDef[] = [
  {
    key: 'first24h',
    title: {
      en: 'What to eat in your first 24 hours',
      es: 'Qué comer en las primeras 24 horas',
      ja: '最初の24時間に食べるべきもの',
    },
    body: {
      en: `The single most important advice in this guide. Most travelers' first food experience in Egypt is a hotel buffet, which is unrepresentative of the cuisine. Three things to seek out on Day 1 instead.`,
      es: `El consejo más importante de esta guía. La primera experiencia gastronómica de la mayoría de los viajeros en Egipto es el bufé del hotel, que no es representativo de la cocina. Tres cosas que buscar el primer día en su lugar:`,
      ja: `このガイドの中で、最も大事な助言です。たいていの旅行者にとって、エジプトでの最初の食事体験はホテルのビュッフェですが、それはこの料理の代表的な姿ではありません。その代わりに、初日に求めるべき三つのものです。`,
    },
    entries: FIRST_24H,
    emphasized: true,
  },
  {
    key: 'staples',
    title: {
      en: 'The staples',
      es: 'Los platos cotidianos',
      ja: '日常の主菜',
    },
    body: {
      en: `The dishes that recur across regions and meals. None of them are tourist food; all of them are how Egyptians actually eat.`,
      es: `Los platos que se repiten en regiones y comidas. Ninguno de ellos es comida para turistas, y todos son la forma real en que comen los egipcios.`,
      ja: `地域や食事を越えてくり返し登場する料理です。どれも観光客向けの料理ではなく、すべてがエジプトの人びとの実際の食卓そのものです。`,
    },
    entries: STAPLES,
    emphasized: false,
  },
  {
    key: 'breadGrainsDairy',
    title: {
      en: 'Bread, grains, and dairy',
      es: 'Pan: pan y más',
      ja: 'パン、そしてもっとパン',
    },
    body: {
      en: `The everyday foundation. The bread is the bread the country has eaten for thousands of years; the cheeses are mostly fresh, mostly white, mostly served with bread and oil.`,
      es: `La base de todos los días. El pan es el pan que el país ha comido durante miles de años; los quesos son en su mayoría frescos, en su mayoría blancos, en su mayoría servidos con pan y aceite.`,
      ja: `毎日の土台です。このパンは、この国が数千年食べ続けてきたパンであり、チーズはたいていフレッシュで、たいてい白く、たいていパンとオイルとともに供されます。`,
    },
    entries: BREAD_GRAINS_DAIRY,
    emphasized: false,
  },
  {
    key: 'drinks',
    title: {
      en: 'Drinks',
      es: 'Bebidas',
      ja: '飲みもの',
    },
    body: {
      en: `The drinks worth seeking out — hot and cold, sweet and bitter, every-day and seasonal.`,
      es: `Las bebidas que merece la pena buscar —calientes y frías, dulces y amargas, de cada día y estacionales.`,
      ja: `求める価値のある飲みもの——温かいものと冷たいもの、甘いものと苦いもの、日常のものと季節のもの。`,
    },
    entries: DRINKS,
    emphasized: false,
  },
  {
    key: 'sweets',
    title: {
      en: 'Sweets',
      es: 'Dulces',
      ja: '甘いもの',
    },
    body: {
      en: `The dessert tradition is substantial. This is a short list of the ones most worth pursuing — soaked syrup pastries, milk puddings, and one bread pudding with a story attached.`,
      es: `La tradición de dulces es importante. Esta es una lista corta de los que más merecen la pena —pasteles empapados en jarabe, pudines de leche, y un budín de pan con historia.`,
      ja: `デザートの伝統は厚いものです。これは、最も追う価値のあるものの短いリストです——シロップにひたしたパストリー、ミルクプディング、そして物語を背負ったパンプディング。`,
    },
    entries: SWEETS,
    emphasized: false,
  },
  {
    key: 'whereToEat',
    title: {
      en: 'What to eat where',
      es: 'Qué comer dónde',
      ja: 'どこで何を食べるか',
    },
    body: {
      en: `A brief pairing of dishes with the cities and regions where they're notable. Most of Egyptian cuisine is national, but a handful of dishes belong to a place.`,
      es: `Un breve emparejamiento de platos con las ciudades y regiones en las que destacan. La mayor parte de la cocina egipcia es nacional, pero un puñado de platos pertenece a un lugar.`,
      ja: `料理と、それらが目立つ街や地域との、ささやかな組み合わせです。エジプトの料理の大半は全国的なものですが、いくつかの料理は特定の場所に属しています。`,
    },
    entries: WHERE_TO_EAT,
    emphasized: false,
  },
  {
    key: 'dietary',
    title: {
      en: 'Dietary notes for travelers',
      es: 'Notas dietéticas para viajeros',
      ja: '旅行者向けの食事注記',
    },
    body: {
      en: `The practical section — what's easy, what's not, and what to skip.`,
      es: `La versión práctica —qué es fácil, qué no, y qué evitar.`,
      ja: `実際的な版です——何が容易か、何がそうでないか、何を避けるべきか。`,
    },
    entries: DIETARY,
    emphasized: false,
  },
];

// ── Document assembly ──────────────────────────────────────────────────
const dishes = (specs: Entry[], keyPrefix: string) =>
  specs.map((d, i) => ({
    _key: `${keyPrefix}-${i}`,
    _type: 'dishEntry',
    name: tri(d.name),
    description: tri(d.description),
    operatorNote: d.operatorNote ? tri(d.operatorNote) : undefined,
  }));

const doc = {
  _id: DOC_ID,
  _type: 'fieldGuide',
  title: tri({ en: 'Egypt,', es: 'Egipto,', ja: 'エジプト、' }),
  titleAccent: tri({ en: 'On a Plate', es: 'en un plato', ja: '皿の上に' }),
  slug: enSlug('egyptian-cuisine'),
  seriesNumber: 'No. 04',
  order: 40,
  region: tri({
    en: 'Egypt, end to end',
    es: 'Egipto, de un extremo a otro',
    ja: 'エジプト全土',
  }),
  tagSummary: tri({
    en: 'Egyptian Cuisine',
    es: 'Cocina egipcia',
    ja: 'エジプト料理',
  }),
  standfirstLead: tri({
    en: 'Egyptian food is older than the Pharaohs.',
    es: 'La comida egipcia es más antigua que los faraones.',
    ja: 'エジプトの食はファラオよりも古いものです。',
  }),
  standfirstAccent: tri({
    en: "Here's what to seek out, how to eat it properly, and where the good version is found.",
    es: 'Esto es lo que buscar, cómo comerlo bien, y dónde se encuentra la versión buena.',
    ja: '何を求めるべきか、どう食べるべきか、そして本物の版はどこで見つかるかを、ここにまとめます。',
  }),
  intro: tri(INTRO),
  sections: SECTIONS.map((s) => ({
    _key: s.key,
    _type: 'section',
    title: tri(s.title),
    body: tri(s.body),
    dishes: dishes(s.entries, s.key),
    emphasized: s.emphasized,
  })),
  closing: tri(CLOSING),
  colophonNote: tri({
    en: 'Field guide · the good version is found by asking · ask your guide where they actually eat',
    es: 'Guía de campo · la versión buena se encuentra preguntando · pregúntele a su guía dónde come realmente',
    ja: 'フィールドガイド · 本物の版は問うことで見つかる · ガイドが実際に通う場所を尋ねよ',
  }),
  seo: {
    metaTitle: tri({
      en: 'Egypt, On a Plate — A Working Glossary of Egyptian Food',
      es: 'Egipto, en un plato — Travel2Egypt Field Guide',
      ja: 'エジプト、皿の上に — Travel2Egypt Field Guide',
    }),
    metaDescription: tri({
      en: "Egyptian food is older than the Pharaohs. Here's what to seek out, how to eat it properly, and where the good version is found.",
      es: 'La comida egipcia es más antigua que los faraones. Esto es lo que buscar, cómo comerlo bien, y dónde se encuentra la versión buena.',
      ja: 'エジプトの食はファラオよりも古いものです。何を求めるべきか、どう食べるべきか、そして本物の版はどこで見つかるかを、ここにまとめます。',
    }),
  },
};

async function run() {
  const mode = commit ? 'COMMIT' : 'DRY-RUN';
  console.log(`\n— Egypt, On a Plate seed (${mode}) —`);
  console.log(`  dataset:   ${DATASET}`);
  console.log(`  doc:       ${DOC_ID}`);
  console.log(`  slug:      egyptian-cuisine`);
  console.log(`  sections:  ${doc.sections.length}`);
  const totalDishes = doc.sections.reduce(
    (n, s) => n + ((s as any).dishes?.length ?? 0),
    0,
  );
  console.log(`  entries:   ${totalDishes}`);
  console.log(`  languages: en, es, ja\n`);

  if (!commit) {
    console.log(`(dry-run — re-run with --commit to write)`);
    return;
  }

  const client = getClient();
  await client.createOrReplace(doc as any);
  console.log(`  ✓ ${DOC_ID}`);
  console.log(`\nDone.`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
