/**
 * Master plan for the final triage clearance. Assembles:
 *  - CURATED body re-points (hand-verified against Sanity, this session)
 *  - kind-resolved topics (minus 3 keyword false-positives)
 *  - redirect rows for EVERYTHING (curated targets; city-guide fallback for
 *    ambiguous topics; packages/day-tours index for unmatched tours)
 *  - strips + the mailto fix
 * Emits: final-repoint-plan.json, redirect-rows.json, final-strips.json
 */
const fs = require('fs');
const kindRes = require('./kind-resolution.json');

const CURATED = {
  '/es/vista-de-las-piramides-excursion-de-un-dia-a-el-cairo-en-avion-desde-sharm-el-sheikh': '/es/dia-completo-a-el-cairo-en-avion-desde-sharm-el-sheij',
  '/es/egipto-con-una-feluca-tradicional': '/es/velas-en-el-nilo-viaje-privado-de-diez-dias-en-faluca-de-asuan-a-luxor',
  '/es/velas-del-nilo-explora-egipto-con-una-feluca-tradicional': '/es/velas-en-el-nilo-viaje-privado-de-diez-dias-en-faluca-de-asuan-a-luxor',
  '/es/el-corazon-espiritual-de-el-cairo-excursion-islamica-de-un-dia-por-el-cairo': '/es/tour-privado-por-el-cairo-islamico-ciudadela-mezquitas-y-jan-el-jalili',
  '/es/el-nil-elegance-crucero-de-7-dias-dahabiya-por-el-nilo': '/es/el-nil-elegance-siete-dias-de-luxor-a-asuan',
  '/es/patrimonio-mediterraneo-excursion-privada-de-2-dias-a-alejandria-desde-el-cairo': '/es/alejandria-en-un-dia-desde-el-cairo-catacumbas-columnas-y-costa-mediterranea',
  '/es/las-orillas-del-tiempo-excursion-de-un-dia-a-esna-y-el-kab-desde-luxor': '/es/esna-y-el-kab-desde-luxor',
  '/es/la-experiencia-del-espectaculo-de-luz-y-sonido-de-giza': '/es/el-espectaculo-de-luz-y-sonido-de-guiza-una-velada-en-las-piramides',
  '/es/dinastias-del-desierto-excursion-de-6-dias-a-los-grandes-faraones-y-el-desierto-blanco': '/es/faraones-y-desierto-blanco-viaje-privado-de-seis-dias-de-el-cairo-al-sahara',
  '/es/majestad-de-los-templos-excursion-privada-a-los-templos-de-karnak-y-luxor': '/es/karnak-templo-de-luxor-y-museo-de-luxor',
  '/es/abu-simble-y-el-antiguo-egipto': '/es/abu-simbel-y-el-antiguo-egipto-en-10-dias',
  '/es/arenas-de-la-historia-descubrimiento-del-grupo-de-templos-de-dendera-y-abydos-desde-hurghada': '/es/templos-de-dendera-y-abidos-desde-hurghada',
  '/es/espectaculo-de-luz-y-sonido-en-el-templo-de-karnak-de-luxor': '/es/luz-y-sonido-en-karnak',
  '/es/espectaculo-de-luz-y-sonido-en-el-templo-de-philae-de-asuan': '/es/luz-y-sonido-en-el-templo-de-philae',
  '/es/de-safaga-a-luxor-exploracion-de-un-dia-de-la-ciudad-antigua': '/es/de-safaga-a-luxor-dia-completo-entre-templos-tumbas-y-colosos',
  '/es/egipto-y-el-mar-rojo': '/es/egypt-and-the-red-sea',
  '/ja/エジプトと紅海': '/ja/egypt-and-the-red-sea',
  '/es/escapada-a-el-cairo': '/es/escapada-de-fin-de-semana-a-el-cairo-3-dias-en-la-capital',
  '/cairo-city-break': '/cairo-weekend-city-break-2-nights-3-days',
  '/es/el-elegante-recorrido-por-el-cairo': '/es/el-cairo-elegante-4-dias-entre-la-ciudad-antigua-y-la-ciudad-viva',
  '/the-elegant-cairo-tour': '/the-elegant-cairo-4-days-tour',
  '/es/crucero-integral-de-13-dias-por-el-nilo-de-el-cairo-a-luxor': '/es/pasaje-real-del-nilo-crucero-de-13-dias-de-el-cairo-a-luxor',
  '/es/nilo-elegance-crucero-de-ida-y-vuelta-de-11-dias-por-el-cairo-y-el-nilo': '/es/el-cairo-y-el-nilo-en-11-dias-ida-y-vuelta-piramides-rio-luxor',
  '/es/los-secretos-de-minya-excursion-de-2-dias-a-minya-desde-el-cairo': '/es/minia-en-dos-dias-desde-el-cairo',
  '/es/salida-elegante-traslado-al-aeropuerto-internacional-de-el-cairo': '/es/traslado-privado-del-hotel-al-aeropuerto-de-el-cairo',
  '/es/llegada-sin-contratiempos-traslado-del-aeropuerto-de-el-cairo-al-hotel': '/es/traslado-privado-del-aeropuerto-de-el-cairo-al-hotel',
  '/es/oasis-de-fayoum-con-las-piramides-de-meydum-y-hawara': '/es/oasis-de-fayoum-piramides-de-meidum-y-hawara-jornada-completa',
  '/es/oasis-misteriosos-y-el-nilo': '/es/oasis-y-nilo-en-13-dias',
  '/es/egipto-para-observar-aves': '/es/corredor-egipcio-viaje-privado-de-observacion-de-aves-de-nueve-dias-de-el-cairo-a-las-cataratas',
  '/es/vacaciones-de-lujo-en-egipto': '/es/egypt-luxury-holidays',
  '/ja/エジプト・ラグジュアリーホリデー': '/ja/egypt-luxury-holidays',
  '/es/vacaciones-en-familia-en-egipto': '/es/egypt-family-holidays',
  '/es/viaje-de-10-dias-a-egipto-inolvidable': '/es/egipto-en-10-dias-el-cairo-alejandria-luxor-asuan-y-el-nilo',
  '/best-of-egypt-2': '/8-days-best-of-egypt-tour-package',
  '/9-day-prestigious-egypt-vacation-from-turkey': '/9-days-egypt-prestigious-vacation',
  '/9-day-prestigious-egypt-vacation-from-australia': '/9-days-egypt-prestigious-vacation',
  '/luxor-and-nile-cruise-vacation-15-day': '/15-day-luxor-nile-cruise-vacation',
  '/ancient-egypt-and-the-red-sea-tour': '/egypt-and-the-red-sea',
  '/luxor-group-day-tour-adventure-from-hurghada': '/luxor-highlights-group-day-tour-from-hurghada',
  '/marriott-mena-house-stay-of-distinction': '/hotels/marriott-mena-house-hotel-cairo',
  '/grand-nile-tower-hotel-cairo': '/hotels/hilton-cairo-grand-nile',
  '/es/grand-nile-tower-hotel-el-cairo': '/es/hotels/hilton-cairo-grand-nile',
  '/al-tabuna-camp-el-dakhla-oasis': '/hotels/al-tabuna-camp-dakhla-oasis',
  '/es/safari-taziry-ecolodge-siwa': '/es/hotels/taziry-ecolodge-siwa-safari',
  '/es/consejos-para-las-familias': '/es/travel-tips/viajar-a-egipto-con-ninos-el-dia-a-dia-practico',
  '/es/mujer-viajera-sola-en-egipto': '/es/travel-tips/viajar-sola-a-egipto-el-panorama-real',
  '/es/horario-y-dias-festivos': '/es/travel-tips/horarios-y-dias-festivos-en-egipto',
  '/es/el-tiempo-en-egipto': '/es/travel-tips/el-clima-de-egipto-zonas-climaticas-estaciones-y-cuando-visitar',
  '/es/negociacion-en-egipto': '/es/travel-tips/el-regateo-en-egipto-la-cultura-que-hay-detras-del-trato',
  '/es/consejos-para-viajar-a-egipto': '/es/travel-tips',
  '/month-by-month-guide-to-egypt': '/travel-tips/egypt-weather-guide',
  '/egypt-travel-faqs': '/faq',
  '/es/la-antigua-ciudad-de-pelusium': '/es/guide/al-arish/la-antigua-ciudad-de-pelusio',
  '/es/el-pequeno-templo-de-abu-simbel': '/es/guide/abu-simbel/el-templo-pequeno-de-abu-simbel',
  '/es/clima-en-abu-simble': '/es/guide/abu-simbel/clima-y-mejor-epoca-para-visitar-abu-simbel',
  '/ja/カイロの天気と気温': '/ja/guide/kairo/kairo-no-tenki-to-kion',
  '/ja/カイロの移動手段ガイド': '/ja/guide/kairo/kairo-shinai-no-ido-gaido',
  '/ja/アブ・シンベルの天気予報': '/ja/guide/abu-shinberu/abu-shin-beru-no-tenki-to-besuto-shizun',
  '/ja/アブ・シンベルへの交通手段': '/ja/guide/abu-shinberu/abu-shin-beru-e-no-iki-kata',
  '/ja/アブ・シンベルの宿泊オプション': '/ja/guide/abu-shinberu/abu-shin-beru-no-hoteru-to-shukuhaku',
  '/ja/エスナの天候情報': '/ja/guide/esuna/esuna-no-tenko-joho',
  '/ja/エスナの宿泊先': '/ja/guide/esuna/esuna-no-shukuhaku-saki',
  '/es/33-cosas-increibles-que-hacer-en-hurghada': '/es/guide/hurghada/actividades-en-hurghada',
  '/es/precios-de-las-entradas-para-las-atracciones-del-desierto-occidental': '/es/guide/siwa/ticket-prices-for-attractions-in-siwa',
  '/es/precios-de-las-entradas-para-las-atracciones-en-el-mar-rojo-y-el-sinai': '/es/guide/el-cairo/precios-de-las-entradas-a-las-atracciones-de-el-cairo',
  '/es/planifica-tu-viaje': '/es/plan-your-tour',
  '/trip-request': '/plan-your-tour',
  '/es/programas-de-viaje-por-egipto': '/es/egypt-travel-packages',
  '/cultural-immersions': '/journeys/the-cultural-traveller',
  '/es/inmersiones-culturales': '/es/journeys/el-viajero-cultural',
  '/es/egipto-los-mejores-hoteles-y-cruceros-por-el-nilo': '/es/nile-cruises',
};
const CATEGORY_ROWS = { '/category/lifestyle': '/blog', '/category/luxury-stay': '/blog' };
const STRIP_PATHS = new Set(['/es/mi-cuenta', '/my-account', '/es/home/experiencias']);
const KIND_FALSE_POSITIVES = new Set([
  '/es/las-orillas-del-tiempo-excursion-de-un-dia-a-esna-y-el-kab-desde-luxor',
  '/es/llegada-sin-contratiempos-traslado-del-aeropuerto-de-el-cairo-al-hotel',
  '/es/arenas-de-la-historia-descubrimiento-del-grupo-de-templos-de-dendera-y-abydos-desde-hurghada',
]);

const norm = (p) => decodeURIComponent(p);
const all = [...kindRes.kindResolved, ...kindRes.cityFallback, ...kindRes.tourFallback, ...kindRes.other];

const repoints = [];   // body edits (exact targets only)
const rows = [];       // redirect rows (everything except mailto/strips/blog-ok)
const strips = [];
const seenPaths = new Set();

for (const e of all) {
  const p = norm(e.path);
  if (seenPaths.has(p + '|' + e.url)) continue;
  seenPaths.add(p + '|' + e.url);

  if (p === '/mailto:info@travel2egypt.org') continue;         // separate content fix
  if (p === '/blog' || p === '/private-day-tours' || p === '/group-day-tours' || p === '/tours/private-tour-dendera-and-abydos-by-bus') continue; // already resolve on new site
  if (STRIP_PATHS.has(p)) { strips.push({ url: e.url, path: p, count: e.count }); continue; }
  if (CATEGORY_ROWS[p]) { rows.push({ from: p, to: CATEGORY_ROWS[p], klass: 'category' }); continue; }

  const curated = CURATED[p];
  if (curated) {
    repoints.push({ url: e.url, path: p, count: e.count, to: curated, method: 'curated' });
    rows.push({ from: p, to: curated, klass: 'curated' });
    continue;
  }
  if (kindRes.kindResolved.includes(e) && !KIND_FALSE_POSITIVES.has(p)) {
    repoints.push({ url: e.url, path: p, count: e.count, to: e.to, method: 'kind' });
    rows.push({ from: p, to: e.to, klass: 'kind' });
    continue;
  }
  if (kindRes.cityFallback.includes(e)) {
    rows.push({ from: p, to: e.to, klass: 'cityFallback' });
    continue;
  }
  // tour fallback / other → packages vs day-tours index heuristic
  const loc = e.locale || (p.startsWith('/es/') ? 'es' : p.startsWith('/ja/') ? 'ja' : 'en');
  const prefix = loc === 'en' ? '' : '/' + loc;
  const dayish = /excursion|day-tour|traslado|espectaculo|higaeri|snorkel|coche-privado|deitsua/.test(p);
  const multiish = /dias|days|crucero|paquete|vacacion|epopeya|nichikan|kuruzu/.test(p);
  const to = dayish && !multiish ? `${prefix}/private-day-tours` : `${prefix}/egypt-travel-packages`;
  rows.push({ from: p, to, klass: 'tourFallback' });
}

const sum = (a) => a.reduce((s, x) => s + (x.count || 0), 0);
console.log('repoints:', repoints.length, 'URLs /', sum(repoints), 'instances');
console.log('redirect rows:', rows.length, '| by class:', JSON.stringify(rows.reduce((m, r) => (m[r.klass] = (m[r.klass] || 0) + 1, m), {})));
console.log('strips:', strips.length, 'URLs /', sum(strips), 'instances');
fs.writeFileSync(__dirname + '/final-repoint-plan.json', JSON.stringify(repoints, null, 2));
fs.writeFileSync(__dirname + '/redirect-rows.json', JSON.stringify(rows, null, 2));
fs.writeFileSync(__dirname + '/final-strips.json', JSON.stringify(strips, null, 2));
