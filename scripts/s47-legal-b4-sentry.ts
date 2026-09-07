/**
 * s47 B4 — name Sentry as a processor + soften the cookie policy's absolute
 * "no traffic measurement of any kind" claim, BEFORE SENTRY_DSN goes live
 * (the cookie policy's own "Changes" clause promises exactly that ordering).
 * Cloudinary: owner confirmed 2026-09-07 it is not used — not named.
 *
 * Facts the copy relies on (src/instrumentation-client.ts, sentry.*.config.ts,
 * src/lib/monitoring/sentryScrub.ts): DSN-gated; sendDefaultPii:false; no
 * Replay; cookieless; tracesSampleRate 0.1 default; beforeSend drops user
 * context, cookies, bodies, headers, query strings, redacts emails/phones.
 * MAY capture: stack traces, page URL (no query), status codes/timings,
 * browser/OS.
 *
 * Edits (all three locales, published docs, keys preserved via raw client):
 *  cookie policy `legal-cookie-policy`
 *   1. bullet a862d3aab5ff ("Analytics platforms — …of any kind") softened
 *   2. NEW section "Error monitoring: Sentry" (h2 + 2 ¶) inserted after the
 *      abuse-prevention paragraph, before "A preference we keep in your browser"
 *   3. EN/ES block 2621cb3dd9fc: the "What a cookie is" section had lost its
 *      definition sentences (JA still has them) — restored from the JA text
 *   4. lastUpdated → 2026-09-07
 *  privacy policy `legal-privacy-policy`
 *   5. NEW "Error monitoring." paragraph under "Usage data", after the
 *      concierge-hash paragraph
 *   6. lastUpdated → 2026-09-07
 * Guarded (dataset, drafts, anchors, idempotent). Rollback to backups/ first.
 * Usage: npx tsx scripts/s47-legal-b4-sentry.ts [--apply]
 */
import { createClient } from '@sanity/client';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
dotenv.config({ path: '.env' });

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION,
  token: process.env.SANITY_PRODUCTION_API_WRITE_TOKEN,
  useCdn: false,
});
const APPLY = process.argv.includes('--apply');
const COOKIE = 'legal-cookie-policy';
const PRIVACY = 'legal-privacy-policy';
const DATE = '2026-09-07';
type L = 'en' | 'es' | 'ja';
const LOCALES: L[] = ['en', 'es', 'ja'];

const span = (key: string, text: string, marks: string[] = []) => ({
  _key: key, _type: 'span', marks, text,
});
const block = (key: string, style: 'h2' | 'normal', text: string, extra: Record<string, unknown> = {}) => ({
  _key: key, _type: 'block', style, markDefs: [], children: [span(`${key}0`, text)], ...extra,
});

// 1. softened analytics bullet ------------------------------------------------
const ANALYTICS_CHILDREN: Record<L, unknown[]> = {
  en: [
    span('19f180e269fd', 'Analytics platforms', ['strong']),
    span('566e7cb5a6d7', ' — no Google Analytics, no Hotjar, no session-recording tool, and no audience or marketing measurement of any kind, named or unnamed. (The one technical monitoring tool we run is described under “Error monitoring” above — it is not an analytics platform and cannot be used to follow you.)'),
  ],
  es: [
    span('a862d3aab5ff0', 'Plataformas de analítica: ni Google Analytics, ni Hotjar, ni herramientas de grabación de sesiones, ni ninguna medición de audiencia o de marketing, sea cual sea, identificada o no. (La única herramienta técnica de supervisión que utilizamos se describe más arriba, en «Supervisión de errores»: no es una plataforma de analítica y no puede utilizarse para seguirle.)'),
  ],
  ja: [
    span('a862d3aab5ff0', 'アナリティクスプラットフォーム：Google Analytics も Hotjar も、セッション記録ツールも、名称の有無を問わず、いかなる種類のオーディエンス測定・マーケティング測定ツールも使用いたしません。（当社が使用する唯一の技術的な監視ツールについては、上記の「エラー監視」で説明しております。これはアナリティクスプラットフォームではなく、お客さまを追跡するために使用することはできません。）'),
  ],
};

// 2. new cookie-policy section --------------------------------------------------
const COOKIE_ANCHOR: Record<L, string> = { en: 's8eng', es: 's8esg', ja: 'jadraft09' };
const COOKIE_SECTION: Record<L, { h: string; p1: string; p2: string }> = {
  en: {
    h: 'Error monitoring: Sentry',
    p1: 'To find out when something on the site breaks, we use Sentry, an error-monitoring service. If a page fails to load or a feature throws an error, a technical report — the error message, the page it happened on, and your browser and operating system type — is sent to Sentry so we can fix it. A small sample of ordinary page loads (about one in ten) also sends timing information, so we can see whether pages are slow.',
    p2: 'Sentry sets no cookies and stores nothing in your browser. Your IP address is not attached to any report, and personal details — names, email addresses, phone numbers, anything you type — are scrubbed from every report before it leaves the site. It cannot be used to recognise you between visits or across other websites, and it is not an analytics or advertising tool: it tells us that a page broke, not who you are. Sentry acts on our behalf under contract and is named in our Privacy Policy.',
  },
  es: {
    h: 'Supervisión de errores: Sentry',
    p1: 'Para saber cuándo algo falla en el sitio, utilizamos Sentry, un servicio de supervisión de errores. Si una página no se carga o una función produce un error, se envía a Sentry un informe técnico (el mensaje de error, la página en la que se produjo y el tipo de navegador y sistema operativo) para que podamos corregirlo. Una pequeña muestra de las cargas de página habituales (aproximadamente una de cada diez) envía también información de tiempos, para que podamos comprobar si las páginas son lentas.',
    p2: 'Sentry no establece cookies ni almacena nada en su navegador. Su dirección IP no se adjunta a ningún informe, y los datos personales (nombres, direcciones de correo electrónico, números de teléfono, cualquier cosa que usted escriba) se eliminan de cada informe antes de que salga del sitio. No puede utilizarse para reconocerle entre visitas ni en otros sitios web, y no es una herramienta de analítica ni de publicidad: nos indica que una página falló, no quién es usted. Sentry actúa en nuestro nombre en virtud de un contrato y figura en nuestra Política de Privacidad.',
  },
  ja: {
    h: 'エラー監視：Sentry',
    p1: 'サイトのどこかで不具合が発生したことを把握するため、当社はエラー監視サービスである Sentry を使用しております。ページが読み込めなかったり、機能がエラーを起こしたりした場合、技術的なレポート（エラーメッセージ、発生したページ、ブラウザおよびOSの種類）が Sentry に送信され、当社が修正できるようにします。また、通常のページ読み込みのごく一部（およそ10回に1回）について、ページの表示が遅くなっていないかを確認するための所要時間の情報も送信されます。',
    p2: 'Sentry はクッキーを設定せず、お客さまのブラウザに何も保存しません。お客さまのIPアドレスがレポートに添付されることはなく、個人情報（氏名、メールアドレス、電話番号、お客さまが入力された内容）は、レポートがサイトから送信される前にすべて除去されます。訪問をまたいでお客さまを識別したり、他のウェブサイトで追跡したりするために使用することはできず、アナリティクスや広告のツールでもありません——ページに不具合があったことを当社に知らせるものであり、お客さまが誰であるかを知らせるものではありません。Sentry は契約に基づき当社に代わって処理を行う事業者であり、当社のプライバシーポリシーに記載しております。',
  },
};

// 3. restore the "What a cookie is" definition (EN/ES) --------------------------
const COOKIE_DEF: Partial<Record<L, string>> = {
  en: 'A cookie is a small text file that a website stores in your browser. Cookies can do simple, useful jobs, such as remembering a choice you have made. They can also be used to follow people around the web. We use cookies only for that first, plain kind of job — never to follow you.',
  es: 'Una cookie es un pequeño archivo de texto que un sitio web guarda en su navegador. Las cookies pueden cumplir tareas sencillas y útiles, como recordar una elección que usted ha hecho. También pueden utilizarse para seguir a las personas por la web. Utilizamos cookies únicamente para ese primer tipo de tarea, sencillo y útil; nunca para seguirle.',
};
const COOKIE_DEF_TAIL: Partial<Record<L, string>> = {
  en: 'We use cookies only for that first, plain kind of job — never to follow you.',
  es: 'Utilizamos cookies únicamente para ese primer tipo de tarea, sencillo y útil; nunca para seguirle.',
};

// 5. privacy-policy paragraph ----------------------------------------------------
const PRIVACY_ANCHOR: Record<L, string> = { en: 's8enk', es: 's8esk', ja: 'jadraft20' };
const PRIVACY_PARA: Record<L, string> = {
  en: 'Error monitoring. We use Sentry, an error-monitoring service, to learn when a page fails or a feature throws an error. It receives a technical report (the error, the page, and your browser and operating system type) and, for about one in ten page loads, timing information. Your IP address is not attached to these reports, personal details are scrubbed from them before they leave the site, and Sentry sets no cookies. Sentry acts as our processor under contract and may store this data outside Egypt — see “International data transfers.” Full detail is in our Cookie Policy.',
  es: 'Supervisión de errores. Utilizamos Sentry, un servicio de supervisión de errores, para saber cuándo una página falla o una función produce un error. Recibe un informe técnico (el error, la página y el tipo de navegador y sistema operativo) y, en aproximadamente una de cada diez cargas de página, información de tiempos. Su dirección IP no se adjunta a estos informes, los datos personales se eliminan de ellos antes de que salgan del sitio y Sentry no establece cookies. Sentry actúa como encargado del tratamiento en nuestro nombre en virtud de un contrato y puede almacenar estos datos fuera de Egipto; véase «Transferencias internacionales de datos». Encontrará todos los detalles en nuestra Política de Cookies.',
  ja: 'エラー監視。当社は、ページの不具合や機能のエラーを把握するため、エラー監視サービスである Sentry を使用しております。Sentry は技術的なレポート（エラー、発生したページ、ブラウザおよびOSの種類）を受け取り、ページ読み込みのおよそ10回に1回については所要時間の情報も受け取ります。お客様のIPアドレスがこれらのレポートに添付されることはなく、個人情報はレポートがサイトから送信される前に除去され、Sentry はクッキーを設定しません。Sentry は契約に基づき当社に代わって処理を行う処理者であり、これらのデータをエジプト国外で保管することがあります——「国際的なデータ移転」をご参照ください。詳細は当社のクッキーポリシーに記載しております。',
};

type Doc = { _id: string; lastUpdated?: string; body: { _key: L; value: any[] }[] };
const loc = (d: Doc, l: L) => d.body.find((b) => b._key === l)?.value ?? [];
const blk = (d: Doc, l: L, key: string) => loc(d, l).find((b) => b._key === key);
const path = (l: L, key: string) => `body[_key=="${l}"].value[_key=="${key}"]`;

async function main() {
  if (process.env.NEXT_PUBLIC_SANITY_DATASET !== 'production') throw new Error('Refusing: dataset is not production');
  const docs = await client.fetch<Doc[]>(`*[_id in [$c, $p, "drafts." + $c, "drafts." + $p]]{_id, lastUpdated, body}`, { c: COOKIE, p: PRIVACY });
  const drafts = docs.filter((d) => d._id.startsWith('drafts.'));
  if (drafts.length) throw new Error(`Refusing: drafts exist: ${drafts.map((d) => d._id).join(', ')}`);
  const cookie = docs.find((d) => d._id === COOKIE)!;
  const privacy = docs.find((d) => d._id === PRIVACY)!;
  if (!cookie || !privacy) throw new Error('Refusing: a legal doc is missing');

  const plan: string[] = [];
  const tx = client.transaction();

  for (const l of LOCALES) {
    // cookie: 1. analytics bullet
    const a = blk(cookie, l, 'a862d3aab5ff');
    if (!a) throw new Error(`cookie ${l}: analytics bullet missing`);
    const aText = a.children.map((c: any) => c.text).join('');
    if (!/Hotjar/.test(aText)) throw new Error(`cookie ${l}: analytics bullet anchor text unexpected`);
    if (/Sentry|Error monitoring|Supervisión de errores|エラー監視/.test(aText)) plan.push(`cookie ${l}: analytics bullet already softened — skip`);
    else { tx.patch(COOKIE, (p) => p.set({ [`${path(l, 'a862d3aab5ff')}.children`]: ANALYTICS_CHILDREN[l] })); plan.push(`cookie ${l}: analytics bullet softened`); }

    // cookie: 2. new section
    const anchor = blk(cookie, l, COOKIE_ANCHOR[l]);
    if (!anchor) throw new Error(`cookie ${l}: anchor ${COOKIE_ANCHOR[l]} missing`);
    const next = loc(cookie, l)[loc(cookie, l).indexOf(anchor) + 1];
    if (next?._key !== '94b0c5ca7301') throw new Error(`cookie ${l}: block after anchor is ${next?._key}, expected 94b0c5ca7301`);
    if (blk(cookie, l, `b4${l}h`)) plan.push(`cookie ${l}: Sentry section already present — skip`);
    else {
      const s = COOKIE_SECTION[l];
      tx.patch(COOKIE, (p) => p.insert('after', path(l, COOKIE_ANCHOR[l]), [
        block(`b4${l}h`, 'h2', s.h), block(`b4${l}p1`, 'normal', s.p1), block(`b4${l}p2`, 'normal', s.p2),
      ]));
      plan.push(`cookie ${l}: Sentry section (h2 + 2¶) inserted after ${COOKIE_ANCHOR[l]}`);
    }

    // cookie: 3. definition restore (en/es)
    if (COOKIE_DEF[l]) {
      const d = blk(cookie, l, '2621cb3dd9fc');
      if (!d) throw new Error(`cookie ${l}: definition block missing`);
      const dText = d.children.map((c: any) => c.text).join('');
      if (dText === COOKIE_DEF_TAIL[l] && d.children.length === 1) {
        tx.patch(COOKIE, (p) => p.set({ [`${path(l, '2621cb3dd9fc')}.children[0].text`]: COOKIE_DEF[l] }));
        plan.push(`cookie ${l}: "What a cookie is" definition restored`);
      } else plan.push(`cookie ${l}: definition block not in the truncated state — skip`);
    }

    // privacy: 5. paragraph
    const pa = blk(privacy, l, PRIVACY_ANCHOR[l]);
    if (!pa) throw new Error(`privacy ${l}: anchor ${PRIVACY_ANCHOR[l]} missing`);
    const pnext = loc(privacy, l)[loc(privacy, l).indexOf(pa) + 1];
    if (pnext?._key !== 'e591421bc49b') throw new Error(`privacy ${l}: block after anchor is ${pnext?._key}, expected e591421bc49b`);
    if (blk(privacy, l, `b4${l}pp`)) plan.push(`privacy ${l}: Sentry paragraph already present — skip`);
    else {
      tx.patch(PRIVACY, (p) => p.insert('after', path(l, PRIVACY_ANCHOR[l]), [block(`b4${l}pp`, 'normal', PRIVACY_PARA[l])]));
      plan.push(`privacy ${l}: Sentry paragraph inserted after ${PRIVACY_ANCHOR[l]}`);
    }
  }
  tx.patch(COOKIE, (p) => p.set({ lastUpdated: DATE }));
  tx.patch(PRIVACY, (p) => p.set({ lastUpdated: DATE }));
  plan.push(`both docs: lastUpdated ${cookie.lastUpdated}/${privacy.lastUpdated} → ${DATE}`);

  console.log(`[${APPLY ? 'APPLY' : 'DRY-RUN'}]`);
  for (const line of plan) console.log('  ' + line);
  if (!APPLY) return;

  const rb = `backups/s47-legal-b4-rollback-${DATE}.json`;
  fs.mkdirSync('backups', { recursive: true });
  fs.writeFileSync(rb, JSON.stringify({ at: new Date().toISOString(), docs: [cookie, privacy] }, null, 2));
  console.log(`  rollback -> ${rb}`);
  const res = await tx.commit();
  console.log(`  committed tx ${res.transactionId}`);

  const after = await client.fetch(
    `*[_id in [$c, $p]]{_id, lastUpdated, "blocks": {"en": count(body[_key=="en"].value), "es": count(body[_key=="es"].value), "ja": count(body[_key=="ja"].value)}, "sentryMentions": {"en": count(body[_key=="en"].value[children[].text match "*Sentry*"]), "es": count(body[_key=="es"].value[children[].text match "*Sentry*"]), "ja": count(body[_key=="ja"].value[children[].text match "*Sentry*"])}}`,
    { c: COOKIE, p: PRIVACY },
  );
  console.log(JSON.stringify(after, null, 2));
}

main().catch((e) => { console.error(e.message); process.exit(1); });
