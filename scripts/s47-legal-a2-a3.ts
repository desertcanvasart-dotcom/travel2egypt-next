/**
 * Session 47 legal edits — checklist A2 + A3-remainder (PRODUCTION).
 *
 * A2 — privacy policy vs cookie policy contradiction on analytics:
 *   the privacy policy claims "operate and analyse", a "Website analytics:
 *   up to 26 months" retention row, and "IT and analytics providers" — no
 *   analytics exist and the cookie policy says so explicitly. Remove all
 *   three (×3 locales): drop "and analyse" from the cookies paragraph,
 *   unset the 26-month retention row, narrow the sharing row to "IT
 *   providers".
 *
 * A3 remainder — the switcher-set t2e_ccy currency cookie (code half merged
 *   2319468: cookie now written ONLY on an explicit pick) must be named in
 *   the cookie policy's exhaustive list. Adds a full per-cookie section
 *   ("The currency cookie: t2e_ccy") between the NEXT_LOCALE and
 *   t2e_session_id sections, mirroring the NEXT_LOCALE section's shape, plus
 *   a "Change your currency" choice bullet, and folds t2e_ccy into the
 *   "Clear the cookies" / "Block cookies entirely" bullets.
 *
 * Consistency fixes surfaced by the same pass (the cookie policy's cookie
 * count went stale when t2e_session_id was added in s8, and goes staler now):
 *   - JA intro "1つのクッキー", JA "クッキーは1つのみ", JA H2 "唯一のクッキー",
 *     ES/JA "la única cookie que establecemos / 唯一のクッキーです" — all
 *     count-free now.
 *   - JA consent record name: consent-v1 → consent-v2 (code: src/lib/consent.tsx).
 *   - ES "Block cookies" bullet had drifted from EN (didn't mention the
 *     concierge) — realigned while adding currency.
 *   - "Changes to this policy" ×3: "more than remember your language" →
 *     "beyond what this policy describes" (future-proof; already imprecise
 *     since s8).
 *
 * lastUpdated → 2026-08-18 on both docs.
 *
 * Every edit is GUARDED (current text must equal the expected "from"; on
 * drift it skips and reports, never forces). Inserts are idempotent (skipped
 * when the new _key already exists). Full backup of both docs → backups/.
 * Write mechanics per house rules: unsets and sets and each insert go in
 * SEPARATE commits (set+unset in one patch silently drops the unset;
 * chained .unset() calls replace each other).
 *
 *   Dry run (default): npx tsx scripts/s47-legal-a2-a3.ts
 *   Apply:             npx tsx scripts/s47-legal-a2-a3.ts --apply
 */
import 'dotenv/config';
import { createClient } from '@sanity/client';
import { writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';

const APPLY = process.argv.includes('--apply');
const PUBLISH_DATE = '2026-08-18';

const token =
  process.env.SANITY_PRODUCTION_API_WRITE_TOKEN || process.env.SANITY_API_WRITE_TOKEN;
if (!token) {
  console.error('Missing SANITY_PRODUCTION_API_WRITE_TOKEN / SANITY_API_WRITE_TOKEN');
  process.exit(1);
}

const c = createClient({
  projectId: 'ufallvd2',
  dataset: 'production',
  apiVersion: '2024-12-01',
  token,
  useCdn: false,
});

const PRIVACY = 'legal-privacy-policy';
const COOKIE = 'legal-cookie-policy';

// ---------------------------------------------------------------------------
// Guarded span-text replacements.
// ---------------------------------------------------------------------------
interface SpanEdit {
  docId: string;
  locale: string;
  block: string;
  span: string;
  note: string;
  from: string;
  to: string;
}

const SPAN_EDITS: SpanEdit[] = [
  // --- A2: privacy policy — "operate and analyse" → "operate" ---
  {
    docId: PRIVACY, locale: 'en', block: '475e3410e0b5', span: 'b9d0053c26ae',
    note: 'A2 drop "and analyse"',
    from: 'We use cookies and similar technologies to operate and analyse the Service. Full details are in our Cookie Policy.',
    to: 'We use cookies and similar technologies to operate the Service. Full details are in our Cookie Policy.',
  },
  {
    docId: PRIVACY, locale: 'es', block: '475e3410e0b5', span: '475e3410e0b50',
    note: 'A2 drop "y analizar"',
    from: 'Utilizamos cookies y tecnologías similares para operar y analizar el Servicio. Encontrará todos los detalles en nuestra Política de Cookies.',
    to: 'Utilizamos cookies y tecnologías similares para operar el Servicio. Encontrará todos los detalles en nuestra Política de Cookies.',
  },
  {
    docId: PRIVACY, locale: 'ja', block: '475e3410e0b5', span: '475e3410e0b50',
    note: 'A2 drop 分析',
    from: '当社は、本サービスを運営し、分析するために、クッキーおよび類似の技術を使用します。詳細は、当社のクッキーポリシーに記載されています。',
    to: '当社は、本サービスを運営するために、クッキーおよび類似の技術を使用します。詳細は、当社のクッキーポリシーに記載されています。',
  },
  // --- A2: privacy policy — "IT and analytics providers" → "IT providers" ---
  {
    docId: PRIVACY, locale: 'en', block: '5878ca694338', span: '7ad3252d7460',
    note: 'A2 sharing row (bold lead)',
    from: 'IT and analytics providers',
    to: 'IT providers',
  },
  {
    docId: PRIVACY, locale: 'es', block: '5878ca694338', span: '5878ca6943380',
    note: 'A2 sharing row',
    from: 'Proveedores de servicios informáticos y de analítica que actúan por cuenta nuestra en virtud de contratos escritos.',
    to: 'Proveedores de servicios informáticos que actúan por cuenta nuestra en virtud de contratos escritos.',
  },
  {
    docId: PRIVACY, locale: 'ja', block: '5878ca694338', span: '5878ca6943380',
    note: 'A2 sharing row',
    from: '書面による契約に基づき当社のために業務を行う IT および分析サービスの提供者。',
    to: '書面による契約に基づき当社のために業務を行う IT サービスの提供者。',
  },

  // --- A3: cookie policy — fold t2e_ccy into "Clear the cookies" ---
  {
    docId: COOKIE, locale: 'en', block: 'cef0c133a5b0', span: 'dd0fb3fe30dc',
    note: 'A3 clear-cookies list',
    from: 'Clear the cookies. Your browser settings let you view and delete cookies, including NEXT_LOCALE and t2e_session_id, at any time. The site keeps working either way.',
    to: 'Clear the cookies. Your browser settings let you view and delete cookies, including NEXT_LOCALE, t2e_ccy, and t2e_session_id, at any time. The site keeps working either way.',
  },
  {
    docId: COOKIE, locale: 'es', block: 'cef0c133a5b0', span: 'cef0c133a5b00',
    note: 'A3 clear-cookies list',
    from: 'Eliminar las cookies. Los ajustes de su navegador le permiten ver y eliminar las cookies, incluidas NEXT_LOCALE y t2e_session_id, en cualquier momento. El sitio sigue funcionando en cualquier caso.',
    to: 'Eliminar las cookies. Los ajustes de su navegador le permiten ver y eliminar las cookies, incluidas NEXT_LOCALE, t2e_ccy y t2e_session_id, en cualquier momento. El sitio sigue funcionando en cualquier caso.',
  },
  {
    docId: COOKIE, locale: 'ja', block: 'cef0c133a5b0', span: 'cef0c133a5b0s0',
    note: 'A3 clear-cookies list',
    from: 'クッキーを削除する。お客さまのブラウザの設定により、NEXT_LOCALE および t2e_session_id を含むクッキーをいつでも表示および削除することができます。いずれの場合もサイトは引き続き動作いたします。',
    to: 'クッキーを削除する。お客さまのブラウザの設定により、NEXT_LOCALE、t2e_ccy および t2e_session_id を含むクッキーをいつでも表示および削除することができます。いずれの場合もサイトは引き続き動作いたします。',
  },
  // --- A3: cookie policy — "Block cookies entirely" two → three things ---
  {
    docId: COOKIE, locale: 'en', block: 'bfd751175b4e', span: '2a0e9a64d182',
    note: 'A3 block-cookies bullet',
    from: " You can set your browser to refuse cookies. Two things stop working: your language choice won't be remembered between visits, and the AI concierge won't be able to keep a conversation going — everything else is unaffected.",
    to: ' You can set your browser to refuse cookies. Three things stop working: your language and currency choices won’t be remembered between visits, and the AI concierge won’t be able to keep a conversation going — everything else is unaffected.',
  },
  {
    docId: COOKIE, locale: 'es', block: 'bfd751175b4e', span: 'bfd751175b4e0',
    note: 'A3 block-cookies bullet (also realigns drifted ES to EN)',
    from: 'Bloquear las cookies por completo. Puede configurar su navegador para que rechace las cookies. El único efecto en este caso es que su elección de idioma no se recordará entre visitas.',
    to: 'Bloquear las cookies por completo. Puede configurar su navegador para que rechace las cookies. Tres cosas dejarán de funcionar: su elección de idioma y de moneda no se recordará entre visitas, y el concierge con IA no podrá mantener la continuidad de la conversación; todo lo demás no se verá afectado.',
  },
  {
    docId: COOKIE, locale: 'ja', block: 'bfd751175b4e', span: 'bfd751175b4es0',
    note: 'A3 block-cookies bullet',
    from: 'クッキーを完全にブロックする。お客さまはブラウザを設定してクッキーを拒否することができます。この場合、2つの機能が利用できなくなります。ご訪問の間にお客さまの言語選択が記憶されなくなること、そしてAIコンシェルジュが会話を継続できなくなることです——それ以外の機能には影響がありません。',
    to: 'クッキーを完全にブロックする。お客さまはブラウザを設定してクッキーを拒否することができます。この場合、3つの機能が利用できなくなります。ご訪問の間にお客さまの言語および通貨の選択が記憶されなくなること、そしてAIコンシェルジュが会話を継続できなくなることです——それ以外の機能には影響がありません。',
  },

  // --- Consistency: stale cookie-count claims (predate/worsen with t2e_ccy) ---
  {
    docId: COOKIE, locale: 'ja', block: '1d8962c97cfa', span: '1d8962c97cfa0',
    note: 'JA intro "1つのクッキー" → count-free',
    from: 'Travel2Egyptは、コンサルテーションを重視した旅行会社です。当社はエジプトへのプライベート旅行を企画し、旅行者の皆さまと直接お話ししながらプランを練り上げてまいります。本ポリシーでは、当社ウェブサイトが使用する1つのクッキー、当社がお客さまのブラウザに保存する1つの設定、そして同様に重要な点として、当社が意図的に使用しないことを選択したトラッキング技術について説明いたします。',
    to: 'Travel2Egyptは、コンサルテーションを重視した旅行会社です。当社はエジプトへのプライベート旅行を企画し、旅行者の皆さまと直接お話ししながらプランを練り上げてまいります。本ポリシーでは、当社ウェブサイトが使用するクッキー、当社がお客さまのブラウザに保存する1つの設定、そして同様に重要な点として、当社が意図的に使用しないことを選択したトラッキング技術について説明いたします。',
  },
  {
    docId: COOKIE, locale: 'ja', block: '2621cb3dd9fc', span: '2621cb3dd9fc0',
    note: 'JA "クッキーは1つのみ" → count-free (+ EN\'s "never to follow you")',
    from: 'クッキーとは、ウェブサイトがお客さまのブラウザに保存する小さなテキストファイルです。クッキーは、お客さまが選択した設定を記憶するといった、単純で便利な役割を果たすことができます。また、ウェブ上で人々を追跡するために使用されることもあります。当社が使用するクッキーは1つのみであり、前者の役割のためだけに使用しております。',
    to: 'クッキーとは、ウェブサイトがお客さまのブラウザに保存する小さなテキストファイルです。クッキーは、お客さまが選択した設定を記憶するといった、単純で便利な役割を果たすことができます。また、ウェブ上で人々を追跡するために使用されることもあります。当社が使用するクッキーは、前者の役割のためだけのものであり、お客さまを追跡するために使用することは決してありません。',
  },
  {
    docId: COOKIE, locale: 'ja', block: 'e5f95f23c8ab', span: 'e5f95f23c8ab0',
    note: 'JA H2 "唯一のクッキー" → matches EN "The language cookie"',
    from: '当社が使用する唯一のクッキー：NEXT_LOCALE',
    to: '言語のクッキー：NEXT_LOCALE',
  },
  {
    docId: COOKIE, locale: 'es', block: '5246ffc58de8', span: '5246ffc58de80',
    note: 'ES drop "la única cookie que establecemos"',
    from: 'Para qué sirve: para recordar su preferencia de idioma. Se trata de una cookie funcional: hace que el sitio sea más cómodo de usar y es la única cookie que establecemos.',
    to: 'Para qué sirve: para recordar su preferencia de idioma. Se trata de una cookie funcional: hace que el sitio sea más cómodo de usar.',
  },
  {
    docId: COOKIE, locale: 'ja', block: '5246ffc58de8', span: '5246ffc58de80',
    note: 'JA drop "唯一のクッキーです"',
    from: '目的：お客さまの言語設定を記憶するためです。これは機能性クッキーであり、サイトをより便利にご利用いただくためのものです。また、これが当社の設定する唯一のクッキーです。',
    to: '目的：お客さまの言語設定を記憶するためです。これは機能性クッキーであり、サイトをより便利にご利用いただくためのものです。',
  },
  {
    docId: COOKIE, locale: 'ja', block: '69cf18939e08', span: '69cf18939e080',
    note: 'JA consent-v1 → consent-v2 (code: src/lib/consent.tsx STORAGE_KEY)',
    from: 'お客さまが初回ご訪問の際に表示されるクッキー通知を閉じられると、当社は consent-v1 という名前の記録を保存し、すべてのページで通知が繰り返し表示されないようにいたします。この記録には、お客さまが通知を閉じた日付と、将来のトラッキング設定カテゴリ用のプレースホルダーが保存されます。これらは追跡するものが何もないため、現在すべて「オフ」に設定されています。当社は約1年後にこの通知を更新いたします。この記録がお客さまのブラウザの外に出ることは決してありません。',
    to: 'お客さまが初回ご訪問の際に表示されるクッキー通知を閉じられると、当社は consent-v2 という名前の記録を保存し、すべてのページで通知が繰り返し表示されないようにいたします。この記録には、お客さまが通知を閉じた日付と、将来のトラッキング設定カテゴリ用のプレースホルダーが保存されます。これらは追跡するものが何もないため、現在すべて「オフ」に設定されています。当社は約1年後にこの通知を更新いたします。この記録がお客さまのブラウザの外に出ることは決してありません。',
  },
  // --- Consistency: concierge intro's "second cookie" ordinal is stale now
  //     that the currency section sits between it and NEXT_LOCALE ---
  {
    docId: COOKIE, locale: 'en', block: 's8en2', span: 's8en3',
    note: 'concierge intro "a second cookie" → "another cookie"',
    from: 'If you use our AI concierge — the planning chat at /plan-your-tour, available in English and Spanish — we set a second cookie, t2e_session_id, so your conversation stays continuous as you move between pages or return later. We set it only when you start a conversation; if you never use the concierge, it is never set.',
    to: 'If you use our AI concierge — the planning chat at /plan-your-tour, available in English and Spanish — we set another cookie, t2e_session_id, so your conversation stays continuous as you move between pages or return later. We set it only when you start a conversation; if you never use the concierge, it is never set.',
  },
  {
    docId: COOKIE, locale: 'es', block: 's8es2', span: 's8es3',
    note: 'concierge intro "una segunda cookie" → "otra cookie"',
    from: 'Si usa nuestro concierge con IA —el chat de planificación en /plan-your-tour, disponible en inglés y español—, establecemos una segunda cookie, t2e_session_id, para que su conversación se mantenga al cambiar de página o al volver más tarde. La establecemos únicamente cuando usted inicia una conversación; si nunca utiliza el concierge, nunca se establece.',
    to: 'Si usa nuestro concierge con IA —el chat de planificación en /plan-your-tour, disponible en inglés y español—, establecemos otra cookie, t2e_session_id, para que su conversación se mantenga al cambiar de página o al volver más tarde. La establecemos únicamente cuando usted inicia una conversación; si nunca utiliza el concierge, nunca se establece.',
  },
  {
    docId: COOKIE, locale: 'ja', block: 'jadraft02', span: 'jadraft02s0',
    note: 'concierge intro 「2つ目のクッキー」→「もう1つのクッキー」',
    from: 'AIコンシェルジュ（/plan-your-tour の旅行プランニングチャット、英語およびスペイン語でご利用いただけます）をご利用になる場合、ページ間を移動されたり後日再訪問されたりしても会話が継続するよう、当社は2つ目のクッキー t2e_session_id を設定いたします。このクッキーは、お客さまが会話を開始された場合にのみ設定され、コンシェルジュをご利用にならない場合は設定されません。',
    to: 'AIコンシェルジュ（/plan-your-tour の旅行プランニングチャット、英語およびスペイン語でご利用いただけます）をご利用になる場合、ページ間を移動されたり後日再訪問されたりしても会話が継続するよう、当社はもう1つのクッキー t2e_session_id を設定いたします。このクッキーは、お客さまが会話を開始された場合にのみ設定され、コンシェルジュをご利用にならない場合は設定されません。',
  },
  // --- Consistency: "Changes to this policy" future-proofed ×3 ---
  {
    docId: COOKIE, locale: 'en', block: '546893395b18', span: '17df09f48f51',
    note: 'changes clause future-proof',
    from: 'If we ever add a technology that does more than remember your language, we will update this policy — and the cookie notice — before that technology goes live. The “What we deliberately don’t use” list above would be the first thing to change. The “Last updated” date at the top shows when this policy last changed.',
    to: 'If we ever add a technology that goes beyond what this policy describes, we will update this policy — and the cookie notice — before that technology goes live. The “What we deliberately don’t use” list above would be the first thing to change. The “Last updated” date at the top shows when this policy last changed.',
  },
  {
    docId: COOKIE, locale: 'es', block: '546893395b18', span: '546893395b180',
    note: 'changes clause future-proof',
    from: 'Si alguna vez añadimos una tecnología que haga algo más que recordar su idioma, actualizaremos esta política, y el aviso de cookies, antes de que dicha tecnología entre en funcionamiento. La lista «Lo que deliberadamente no utilizamos» anterior sería lo primero en cambiar. La fecha de «Última actualización» que figura en la parte superior indica cuándo se modificó esta política por última vez.',
    to: 'Si alguna vez añadimos una tecnología que vaya más allá de lo descrito en esta política, actualizaremos esta política, y el aviso de cookies, antes de que dicha tecnología entre en funcionamiento. La lista «Lo que deliberadamente no utilizamos» anterior sería lo primero en cambiar. La fecha de «Última actualización» que figura en la parte superior indica cuándo se modificó esta política por última vez.',
  },
  {
    docId: COOKIE, locale: 'ja', block: '546893395b18', span: '546893395b180',
    note: 'changes clause future-proof',
    from: '当社が今後、お客さまの言語を記憶する以上の機能を持つ技術を追加する場合には、その技術が稼働を開始する前に、本ポリシーおよびクッキー通知を更新いたします。上記の「当社が意図的に使用しないもの」のリストが、最初に変更される箇所となります。本ポリシーが最後に変更された時期は、冒頭の「最終更新日」に示されています。',
    to: '当社が今後、本ポリシーに記載された範囲を超える技術を追加する場合には、その技術が稼働を開始する前に、本ポリシーおよびクッキー通知を更新いたします。上記の「当社が意図的に使用しないもの」のリストが、最初に変更される箇所となります。本ポリシーが最後に変更された時期は、冒頭の「最終更新日」に示されています。',
  },
];

// ---------------------------------------------------------------------------
// Guarded block removals (A2: the 26-month analytics retention row).
// ---------------------------------------------------------------------------
interface BlockUnset {
  docId: string;
  locale: string;
  block: string;
  expectText: string;
}

const BLOCK_UNSETS: BlockUnset[] = [
  { docId: PRIVACY, locale: 'en', block: '633b4f4c0e96', expectText: 'Website analytics: up to 26 months.' },
  { docId: PRIVACY, locale: 'es', block: '633b4f4c0e96', expectText: 'Analítica del sitio web: hasta 26 meses.' },
  { docId: PRIVACY, locale: 'ja', block: '633b4f4c0e96', expectText: 'ウェブサイトの分析データ：最長26か月間。' },
];

// ---------------------------------------------------------------------------
// Idempotent block inserts (A3: the t2e_ccy section + choices bullet).
// New-block shape mirrors each locale's existing conventions: EN bullets use
// a bold lead span + listItem:'bullet'; ES/JA per-cookie sections are plain
// single-span paragraphs (the pre-s8 localized convention).
// ---------------------------------------------------------------------------
type PTBlock = {
  _type: 'block';
  _key: string;
  style: string;
  listItem?: string;
  markDefs: never[];
  children: { _type: 'span'; _key: string; marks: string[]; text: string }[];
};

const blk = (
  key: string,
  style: string,
  spans: [string, string[], string][],
  listItem?: string,
): PTBlock => ({
  _type: 'block',
  _key: key,
  style,
  ...(listItem ? { listItem } : {}),
  markDefs: [],
  children: spans.map(([k, marks, text]) => ({ _type: 'span', _key: k, marks, text })),
});

interface Insert {
  docId: string;
  locale: string;
  position: 'before' | 'after';
  anchor: string;
  note: string;
  blocks: PTBlock[];
}

const INSERTS: Insert[] = [
  {
    docId: COOKIE, locale: 'en', position: 'before', anchor: 's8en0',
    note: 'EN t2e_ccy section (before the concierge-cookie H2)',
    blocks: [
      blk('s47en0', 'h2', [['s47en0a', [], 'The currency cookie: t2e_ccy']]),
      blk('s47en1', 'normal', [['s47en1a', [],
        'Prices on the site can be shown in a handful of currencies. If you pick one with the currency switcher in the site header, we save that choice in a cookie named t2e_ccy, so prices open in your currency the next time you visit. We set it only when you pick a currency yourself — on your first visit we may suggest one based on your country, but that suggestion is applied on the page only, and nothing is stored until you choose.']]),
      blk('s47en2', 'normal', [
        ['s47en2a', ['strong'], 'What it stores:'],
        ['s47en2b', [], ' a three-letter currency code — EUR, USD, GBP, AUD, CAD, or JPY. Nothing else, and nothing that identifies you.'],
      ], 'bullet'),
      blk('s47en3', 'normal', [
        ['s47en3a', ['strong'], 'Who sets it:'],
        ['s47en3b', [], ' us, directly. It is a first-party cookie — no other company can see or read it.'],
      ], 'bullet'),
      blk('s47en4', 'normal', [
        ['s47en4a', ['strong'], 'How long it lasts:'],
        ['s47en4b', [], ' one year, after which it expires on its own. Picking a currency again refreshes it.'],
      ], 'bullet'),
      blk('s47en5', 'normal', [
        ['s47en5a', ['strong'], 'What it is for:'],
        ['s47en5b', [], ' remembering your currency preference. This is a functional cookie — it makes the site more convenient to use.'],
      ], 'bullet'),
    ],
  },
  {
    docId: COOKIE, locale: 'es', position: 'before', anchor: 's8es0',
    note: 'ES t2e_ccy section',
    blocks: [
      blk('s47es0', 'h2', [['s47es0a', [], 'La cookie de moneda: t2e_ccy']]),
      blk('s47es1', 'normal', [['s47es1a', [],
        'Los precios del sitio pueden mostrarse en varias monedas. Si usted elige una con el selector de moneda de la cabecera del sitio, guardamos esa elección en una cookie denominada t2e_ccy, de modo que los precios aparezcan en su moneda la próxima vez que lo visite. Solo la establecemos cuando usted mismo elige una moneda: en su primera visita podemos sugerirle una según su país, pero esa sugerencia se aplica únicamente en la página y no se guarda nada hasta que usted elija.']]),
      blk('s47es2', 'normal', [['s47es2a', [],
        'Qué almacena: un código de moneda de tres letras (EUR, USD, GBP, AUD, CAD o JPY). Nada más, y nada que le identifique a usted.']]),
      blk('s47es3', 'normal', [['s47es3a', [],
        'Quién la establece: nosotros, directamente. Es una cookie propia (de origen): ninguna otra empresa puede verla ni leerla.']]),
      blk('s47es4', 'normal', [['s47es4a', [],
        'Cuánto dura: un año, transcurrido el cual caduca por sí sola. Volver a elegir una moneda la renueva.']]),
      blk('s47es5', 'normal', [['s47es5a', [],
        'Para qué sirve: para recordar su preferencia de moneda. Se trata de una cookie funcional: hace que el sitio sea más cómodo de usar.']]),
    ],
  },
  {
    docId: COOKIE, locale: 'ja', position: 'before', anchor: 'jadraft01',
    note: 'JA t2e_ccy section',
    blocks: [
      blk('s47ja0', 'h2', [['s47ja0a', [], '通貨のクッキー：t2e_ccy']]),
      blk('s47ja1', 'normal', [['s47ja1a', [],
        '本サイトの料金は、複数の通貨で表示することができます。お客さまがサイトのヘッダーにある通貨切り替え機能で通貨を選択されると、当社はその選択を t2e_ccy という名前のクッキーに保存いたします。これにより、次回ご訪問の際も料金がお客さまの通貨で表示されます。このクッキーは、お客さまご自身が通貨を選択された場合にのみ設定されます——初回ご訪問の際、お客さまの国に基づいて通貨をご提案することがありますが、この提案はページ上で適用されるのみであり、お客さまが選択されるまで何も保存されません。']]),
      blk('s47ja2', 'normal', [['s47ja2a', [],
        '保存される内容：3文字の通貨コード（EUR、USD、GBP、AUD、CAD、または JPY）です。それ以外のものは保存されず、お客さまを特定する情報も一切含まれません。']]),
      blk('s47ja3', 'normal', [['s47ja3a', [],
        '設定する主体：当社が直接設定いたします。これはファーストパーティクッキーであり、他のいかなる企業もこれを閲覧したり読み取ったりすることはできません。']]),
      blk('s47ja4', 'normal', [['s47ja4a', [],
        '保存期間：1年間で、その後自動的に有効期限が切れます。再度通貨を選択されると、有効期限が更新されます。']]),
      blk('s47ja5', 'normal', [['s47ja5a', [],
        '目的：お客さまの通貨設定を記憶するためです。これは機能性クッキーであり、サイトをより便利にご利用いただくためのものです。']]),
    ],
  },
  {
    docId: COOKIE, locale: 'en', position: 'after', anchor: '60b531dbd147',
    note: 'EN "Change your currency" choice bullet',
    blocks: [
      blk('s47en6', 'normal', [
        ['s47en6a', ['strong'], 'Change your currency.'],
        ['s47en6b', [], ' Use the currency switcher in the site header; the cookie updates to match your new choice.'],
      ], 'bullet'),
    ],
  },
  {
    docId: COOKIE, locale: 'es', position: 'after', anchor: '60b531dbd147',
    note: 'ES "Cambiar de moneda" choice bullet',
    blocks: [
      blk('s47es6', 'normal', [['s47es6a', [],
        'Cambiar de moneda. Utilice el selector de moneda en la cabecera del sitio; la cookie se actualizará para reflejar su nueva elección.']]),
    ],
  },
  {
    docId: COOKIE, locale: 'ja', position: 'after', anchor: '60b531dbd147',
    note: 'JA 通貨を変更する choice bullet',
    blocks: [
      blk('s47ja6', 'normal', [['s47ja6a', [],
        '通貨を変更する。サイトのヘッダーにある通貨切り替え機能をご利用ください。クッキーはお客さまの新しい選択に合わせて更新されます。']]),
    ],
  },
];

const DATE_BUMPS = [COOKIE, PRIVACY];

// ---------------------------------------------------------------------------

const spanPath = (loc: string, blk2: string, span: string) =>
  `body[_key=="${loc}"].value[_key=="${blk2}"].children[_key=="${span}"].text`;

async function spanText(e: { docId: string; locale: string; block: string; span: string }) {
  return c.fetch<string | null>(
    `*[_id==$id][0].body[_key==$loc][0].value[_key==$blk][0].children[_key==$span][0].text`,
    { id: e.docId, loc: e.locale, blk: e.block, span: e.span },
  );
}

async function blockText(docId: string, locale: string, block: string) {
  return c.fetch<string | null>(
    `*[_id==$id][0].body[_key==$loc][0].value[_key==$blk][0].children[].text`,
    { id: docId, loc: locale, blk: block },
  ).then((parts) => (Array.isArray(parts) ? parts.join('') : parts));
}

async function blockExists(docId: string, locale: string, block: string) {
  return c.fetch<boolean>(
    `count(*[_id==$id][0].body[_key==$loc][0].value[_key==$blk]) > 0`,
    { id: docId, loc: locale, blk: block },
  );
}

async function main() {
  console.log(`\n=== S47 legal A2 + A3 — ${APPLY ? 'APPLY' : 'DRY RUN'} ===\n`);

  // 0. Refuse to run over pre-existing drafts (publishing later would sweep them).
  const drafts = await c.fetch<string[]>(
    `*[_id in ["drafts.${PRIVACY}","drafts.${COOKIE}"]]._id`,
  );
  if (drafts.length) {
    console.error(`ABORT: pre-existing drafts would be affected: ${drafts.join(', ')}`);
    process.exit(1);
  }

  // 1. Full backup (rollback artifact).
  const backup = await c.fetch(`*[_id in $ids]`, { ids: [PRIVACY, COOKIE] });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = path.join(process.cwd(), 'backups');
  mkdirSync(backupDir, { recursive: true });
  const backupPath = path.join(backupDir, `s47-legal-a2-a3-rollback-${stamp}.json`);
  writeFileSync(backupPath, JSON.stringify(backup, null, 2));
  console.log(`Backup of ${backup.length} docs → ${path.relative(process.cwd(), backupPath)}\n`);

  let planned = 0;
  let done = 0;
  let skipped = 0;

  // 2. Guarded block unsets — ONE combined unset per doc, its own commit
  //    (set+unset in one patch drops the unset; chained unsets replace).
  const unsetsByDoc = new Map<string, string[]>();
  console.log('— Block removals —');
  for (const u of BLOCK_UNSETS) {
    const label = `${u.docId} [${u.locale}] ${u.block}`;
    const exists = await blockExists(u.docId, u.locale, u.block);
    if (!exists) { console.log(`  • DONE  ${label} — already removed`); done++; continue; }
    const text = await blockText(u.docId, u.locale, u.block);
    if (text !== u.expectText) {
      console.log(`  ✗ SKIP  ${label} — text drifted: ${JSON.stringify(String(text).slice(0, 80))}`);
      skipped++; continue;
    }
    console.log(`  ✓ UNSET ${label}: ${JSON.stringify(u.expectText)}`);
    planned++;
    const paths = unsetsByDoc.get(u.docId) ?? [];
    paths.push(`body[_key=="${u.locale}"].value[_key=="${u.block}"]`);
    unsetsByDoc.set(u.docId, paths);
  }
  if (APPLY) {
    for (const [docId, paths] of unsetsByDoc) {
      await c.patch(docId).unset(paths).commit();
      console.log(`  committed ${paths.length} unsets on ${docId}`);
    }
  }

  // 3. Guarded span edits — one combined set commit per doc.
  console.log('\n— Span edits —');
  const setsByDoc = new Map<string, Record<string, string>>();
  for (const e of SPAN_EDITS) {
    const label = `${e.docId} [${e.locale}] ${e.block}/${e.span} (${e.note})`;
    const current = await spanText(e);
    if (current === null || current === undefined) {
      console.log(`  ✗ SKIP  ${label} — span not found`); skipped++; continue;
    }
    if (current === e.to) { console.log(`  • DONE  ${label}`); done++; continue; }
    if (current !== e.from) {
      console.log(`  ✗ SKIP  ${label} — drifted:`);
      console.log(`          have: ${JSON.stringify(current.slice(0, 100))}`);
      skipped++; continue;
    }
    console.log(`  ✓ EDIT  ${label}`);
    console.log(`          - ${JSON.stringify(e.from)}`);
    console.log(`          + ${JSON.stringify(e.to)}`);
    planned++;
    const sets = setsByDoc.get(e.docId) ?? {};
    sets[spanPath(e.locale, e.block, e.span)] = e.to;
    setsByDoc.set(e.docId, sets);
  }
  if (APPLY) {
    for (const [docId, sets] of setsByDoc) {
      const rev = await c.fetch<string>(`*[_id==$id][0]._rev`, { id: docId });
      await c.patch(docId).ifRevisionId(rev).set(sets).commit({ autoGenerateArrayKeys: false });
      console.log(`  committed ${Object.keys(sets).length} sets on ${docId}`);
    }
  }

  // 4. Idempotent inserts — each in its OWN commit, explicit keys preserved.
  console.log('\n— Inserts —');
  for (const ins of INSERTS) {
    const label = `${ins.docId} [${ins.locale}] ${ins.note}`;
    const already = await blockExists(ins.docId, ins.locale, ins.blocks[0]._key);
    if (already) { console.log(`  • DONE  ${label} — ${ins.blocks[0]._key} already present`); done++; continue; }
    const anchorOk = await blockExists(ins.docId, ins.locale, ins.anchor);
    if (!anchorOk) { console.log(`  ✗ SKIP  ${label} — anchor ${ins.anchor} not found`); skipped++; continue; }
    console.log(`  ✓ INSERT ${label} — ${ins.blocks.length} block(s) ${ins.position} ${ins.anchor}`);
    for (const b of ins.blocks) {
      console.log(`          [${b._key}] ${b.style}${b.listItem ? '/' + b.listItem : ''}: ${b.children.map((s) => s.text).join('').slice(0, 90)}`);
    }
    planned++;
    if (APPLY) {
      await c
        .patch(ins.docId)
        .insert(ins.position, `body[_key=="${ins.locale}"].value[_key=="${ins.anchor}"]`, ins.blocks)
        .commit({ autoGenerateArrayKeys: false });
      console.log(`  committed insert on ${ins.docId}`);
    }
  }

  // 5. lastUpdated bumps.
  console.log('\n— Date bumps —');
  for (const id of DATE_BUMPS) {
    const cur = await c.fetch<string>(`*[_id==$id][0].lastUpdated`, { id });
    if (cur === PUBLISH_DATE) { console.log(`  • DONE  ${id} lastUpdated already ${PUBLISH_DATE}`); done++; continue; }
    console.log(`  ✓ DATE  ${id} lastUpdated ${cur} → ${PUBLISH_DATE}`);
    planned++;
    if (APPLY) await c.patch(id).set({ lastUpdated: PUBLISH_DATE }).commit();
  }

  console.log(
    `\n${APPLY ? 'Applied' : 'Dry run complete'}: ${planned} planned, ${done} already done, ${skipped} skipped.` +
      (APPLY ? '' : ' Re-run with --apply to write.') + '\n',
  );
  if (skipped > 0) process.exitCode = 2;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
