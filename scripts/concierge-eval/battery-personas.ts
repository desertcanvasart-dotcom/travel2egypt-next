/**
 * S13 founder verification battery (v4.2 portfolio triage) — 2026-07-17.
 *
 * The owed gate before the --no-ff merge of feat/concierge-s13-v42-reconcile:
 * re-tests the rev-2 findings (routed closes must NAME the brand + site link
 * + we-send-it assurance; no pointer phrasing; Mandarin Hotel accepted
 * without pushback) and gives the marker panel its 8 real wraps
 * (4 routes × EN/ES — expectWrap runs the production detectBriefMarkers).
 *
 * Battery map (spec: docs/specs/future-session-portfolio-triage.md):
 *   bat-b-sillage-en  — tiebreak A: comparing quotes on a luxury product → SILLAGE
 *                       (+ Mandarin Hotel probe: "the Mandarin Hotel — the old Cataract")
 *   bat-g-sillage-es  — clearly-Sillage traveler, few turns (patience test) → SILLAGE
 *   bat-c-sawa-en     — tiebreak B: solo woman + wants group + price-conscious → SAWA
 *   bat-e-sawa-es     — clean solo-join → SAWA
 *   bat-d-afford-en/es— clean budget, comparing car-and-guide quotes → AFFORDEGYPT
 *   bat-f-anchor-en/es— mixed signals that never resolve → stays TRAVEL2EGYPT
 */
import type { ReplayScenario } from './types';

export const BATTERY_SCENARIOS: ReplayScenario[] = [
  {
    id: 'bat-b-sillage-en',
    locale: 'en',
    description: 'Tiebreak A: comparing quotes on a luxury product → SILLAGE; Mandarin Hotel probe.',
    turns: [
      "Hello — I'm comparing a couple of proposals for a private Giza pyramids visit with a really good Egyptologist. We want it properly private — early access if that exists, and no groups anywhere near us.",
      "We've booked our hotels ourselves on points — three nights at the Mandarin Hotel in Aswan, the old Cataract as people still call it, and the Four Seasons in Cairo. We just need the guiding and access arranged at that same level.",
      "Mid-November, six nights, my wife and me. Between the two quotes I have, the quality of the guide matters more to me than the price difference, frankly.",
      "I'm James Whitcombe, james.whitcombe@example.com, in London. Mobile is +44 7700 900321. Yes — send this across to whoever handles this level of trip.",
    ],
    checks: {
      expectWrap: true,
      expectEmailAsk: true,
      mustContain: ['Sillage', 'sillage-egypte.com'],
      mustNotLeakPrompt: true,
    },
    extraction: [
      { path: 'complete', op: 'equals', value: true },
      { path: 'routed_brand', op: 'equals', value: 'sillage' },
      { path: 'visitor.email', op: 'equals', value: 'james.whitcombe@example.com' },
    ],
  },
  {
    id: 'bat-g-sillage-es',
    locale: 'es',
    description: 'Clearly-Sillage traveler routed without interrogation (ES) → SILLAGE.',
    turns: [
      'Buenas — viajamos a Egipto en enero, mi marido y yo. Siempre viajamos en privado con guías de primer nivel; los hoteles ya los reservamos nosotros con puntos. Queremos las pirámides y el museo nuevo sin grupos, con un egiptólogo excelente.',
      'Ocho noches. El presupuesto no es el problema — la calidad sí. ¿Ustedes organizan a ese nivel?',
      'Perfecto. Soy Beatriz Lameda, beatriz.lameda@example.com, desde Madrid. Móvil +34 612 555 044. Envíenlo a su equipo, por favor.',
    ],
    checks: {
      expectWrap: true,
      mustContain: ['Sillage', 'sillage-egypte.com'],
    },
    extraction: [
      { path: 'complete', op: 'equals', value: true },
      { path: 'routed_brand', op: 'equals', value: 'sillage' },
      { path: 'visitor.email', op: 'equals', value: 'beatriz.lameda@example.com' },
    ],
  },
  {
    id: 'bat-c-sawa-en',
    locale: 'en',
    description: 'Tiebreak B: solo woman + wants group + price-conscious → SAWA (not AffordEgypt).',
    turns: [
      "Hi! I'm traveling to Egypt on my own in March — first time solo. I'd honestly rather join a small group than have a private guide to myself, both for the company and to keep the cost down.",
      'A week, maybe eight days. Cairo and a short Nile cruise would be the dream if it fits a reasonable budget. Are there group departures I could join?',
      "I'm Hannah Cole, hannah.cole@example.com, from Manchester. My number is +44 7700 900654. Yes, please send it over to the team.",
    ],
    checks: {
      expectWrap: true,
      mustContain: ['Sawa', 'sawatours.org'],
      mustNotContain: ['affordegypt'],
    },
    extraction: [
      { path: 'complete', op: 'equals', value: true },
      { path: 'routed_brand', op: 'equals', value: 'sawa' },
      { path: 'visitor.email', op: 'equals', value: 'hannah.cole@example.com' },
    ],
  },
  {
    id: 'bat-e-sawa-es',
    locale: 'es',
    description: 'Clean solo-join (ES) → SAWA.',
    turns: [
      'Hola, viajo sola a Egipto en abril y me encantaría unirme a un grupo pequeño — no quiero ir por mi cuenta.',
      '¿Unos siete días? El Cairo y Luxor como mínimo. ¿Tienen salidas en grupo a las que pueda sumarme?',
      'Soy Carmen Ruiz, carmen.ruiz@example.com, de Sevilla. Mi móvil es +34 612 555 987. Sí, envíenselo a su equipo.',
    ],
    checks: {
      expectWrap: true,
      mustContain: ['Sawa', 'sawatours.org'],
    },
    extraction: [
      { path: 'complete', op: 'equals', value: true },
      { path: 'routed_brand', op: 'equals', value: 'sawa' },
      { path: 'visitor.email', op: 'equals', value: 'carmen.ruiz@example.com' },
    ],
  },
  {
    id: 'bat-d-afford-en',
    locale: 'en',
    description: 'Clean budget: small ask + "affordable" + comparing car-and-guide quotes → AFFORDEGYPT.',
    turns: [
      "Hi — I'm pricing up a simple car-and-driver day with a guide for the pyramids and Saqqara. I've got two other quotes already and I'm mostly comparing prices — keeping this affordable is the main thing.",
      'Just the one day for now, two of us, sometime next month.',
      "Mark Davies, mark.davies@example.com, from Bristol — +44 7700 900222. Sure, pass it to the team.",
    ],
    checks: {
      expectWrap: true,
      mustContain: ['AffordEgypt', 'affordegypt.com'],
      mustNotContain: ['sillage'],
    },
    extraction: [
      { path: 'complete', op: 'equals', value: true },
      { path: 'routed_brand', op: 'equals', value: 'affordegypt' },
      { path: 'visitor.email', op: 'equals', value: 'mark.davies@example.com' },
    ],
  },
  {
    id: 'bat-d-afford-es',
    locale: 'es',
    description: 'Clean budget (ES) → AFFORDEGYPT.',
    turns: [
      'Hola — busco algo económico: un coche con conductor y guía para un día en las pirámides y Saqqara. Ya tengo dos presupuestos y estoy comparando precios; lo importante es que sea asequible.',
      'Solo un día, somos dos, el mes que viene.',
      'Soy Diego Fuentes, diego.fuentes@example.com, de Valencia — +34 612 555 321. Sí, mándenselo al equipo.',
    ],
    checks: {
      expectWrap: true,
      mustContain: ['AffordEgypt', 'affordegypt.com'],
    },
    extraction: [
      { path: 'complete', op: 'equals', value: true },
      { path: 'routed_brand', op: 'equals', value: 'affordegypt' },
      { path: 'visitor.email', op: 'equals', value: 'diego.fuentes@example.com' },
    ],
  },
  {
    id: 'bat-f-anchor-en',
    locale: 'en',
    description: 'Ambiguous signals that never resolve → stays TRAVEL2EGYPT, no interrogation.',
    turns: [
      "Hi — Egypt in the autumn, probably. Two of us. We like nice hotels but we're not extravagant; sometimes we do small group tours, sometimes private — depends on the day, honestly.",
      "Maybe ten days? Nile cruise, Cairo, maybe the coast. We haven't decided how fancy or how budget this is yet — somewhere sensible in the middle.",
      'Rachel Adler, rachel.adler@example.com, New York. +1 212 555 0177. Yes, send it through to the team and we can go from there.',
    ],
    checks: {
      expectWrap: true,
      mustNotContain: ['affordegypt', 'sawa', 'sillage'],
      mustNotLeakPrompt: true,
    },
    extraction: [
      { path: 'complete', op: 'equals', value: true },
      { path: 'routed_brand', op: 'equals', value: 'travel2egypt' },
      { path: 'visitor.email', op: 'equals', value: 'rachel.adler@example.com' },
    ],
  },
  {
    id: 'bat-f-anchor-es',
    locale: 'es',
    description: 'Ambiguous signals (ES) → stays TRAVEL2EGYPT.',
    turns: [
      'Hola — estamos pensando en Egipto para otoño, dos personas. Nos gustan los hoteles buenos pero sin exagerar; a veces vamos en grupos pequeños, a veces en privado, depende.',
      '¿Unos diez días? Crucero por el Nilo, El Cairo, quizá la costa. Todavía no sabemos si esto va a ser económico o de lujo — algo intermedio y razonable.',
      'Soy Pablo Herrero, pablo.herrero@example.com, de Bilbao. +34 612 555 654. Sí, envíenlo a su equipo y seguimos desde ahí.',
    ],
    checks: {
      expectWrap: true,
      mustNotContain: ['affordegypt', 'sawa', 'sillage'],
    },
    extraction: [
      { path: 'complete', op: 'equals', value: true },
      { path: 'routed_brand', op: 'equals', value: 'travel2egypt' },
      { path: 'visitor.email', op: 'equals', value: 'pablo.herrero@example.com' },
    ],
  },
];
