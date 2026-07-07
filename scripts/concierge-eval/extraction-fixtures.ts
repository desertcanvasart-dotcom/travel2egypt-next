/**
 * Gate-2 extraction fixtures (Harness Layer 2). FIXED transcripts through the
 * real `extractBrief()` — unlike the replay suite, the input never varies, so
 * failures here are pure extraction regressions (model drift, prompt edit,
 * normalization bug), not conversation-behavior changes.
 *
 * Deliberately DIFFERENT content from the three few-shot examples inside
 * EXTRACTION_PROMPT — scoring the model on its own worked examples would
 * measure memorization, not extraction.
 *
 * Run each fixture N times (--reps) to surface variance: a field that flips
 * between reps is a reliability problem even when the average looks fine.
 */
import type { ExtractionFixture } from './types';

export const EXTRACTION_FIXTURES: ExtractionFixture[] = [
  {
    id: 'x-honeymoon-complete',
    locale: 'en',
    description: 'Complete honeymoon lead — names, email, window, length, avoidances.',
    transcript: [
      { role: 'user', content: "We're getting married in September and thinking Egypt for the honeymoon — around 12 days in early November." },
      { role: 'assistant', content: 'Congratulations! Early November is a lovely window — warm days, cooler evenings, and the summer crowds gone. Are you drawn more to the temples and the river, or would you want sea days worked in as well?' },
      { role: 'user', content: "Mostly the river and the temples. We'd want it romantic, not a big boat — and we both get seasick easily so nothing choppy. My fiancé is allergic to shellfish." },
      { role: 'assistant', content: 'Then a small dahabiya between Luxor and Aswan is the natural heart of it — river sailing is glassy-calm, nothing like open water. Before I pass this to our team, may I have your names and a good email?' },
      { role: 'user', content: 'Sofia Andersson and Erik Lund, sofia.andersson@example.se, and my mobile is +46 70 555 0182. We fly out of Stockholm.' },
      { role: 'assistant', content: 'Perfect, Sofia. I have everything I need — your brief is on its way to the team, and they will come back to you by 8 p.m. Cairo time today.' },
    ],
    expectComplete: true,
    assertions: [
      { path: 'visitor.name', op: 'contains', value: 'sofia' },
      { path: 'visitor.email', op: 'equals', value: 'sofia.andersson@example.se' },
      { path: 'visitor.phone', op: 'contains', value: '0182' },
      { path: 'visitor.origin_city', op: 'contains', value: 'stockholm' },
      { path: 'trip.travelers_count', op: 'equals', value: 2 },
      { path: 'trip.length_days', op: 'equals', value: 12 },
      { path: 'trip.dates_window', op: 'contains', value: 'november' },
      { path: 'trip.destinations', op: 'includes', value: 'luxor' },
      { path: 'constraints.dietary', op: 'contains', value: 'shellfish' },
      { path: 'follow_up_window', op: 'contains', value: '8 p.m' },
      { path: 'brief_summary', op: 'nonNull' },
    ],
  },
  {
    id: 'x-browser-incomplete',
    locale: 'en',
    description: 'Early browser, no contact, no dates — complete:false, no invention.',
    transcript: [
      { role: 'user', content: 'How far ahead do people usually book Egypt trips?' },
      { role: 'assistant', content: 'For the cooler months — October through April — three to six months ahead keeps the best guides and boats open to you. Is there a season you are circling?' },
      { role: 'user', content: 'Not really, still daydreaming. The white desert photos looked amazing though.' },
      { role: 'assistant', content: 'The White Desert is otherworldly — chalk formations that glow at dusk, and a night camping under more stars than seems reasonable. When the daydream firms up, I would be glad to shape it.' },
    ],
    expectComplete: false,
    assertions: [
      { path: 'visitor.name', op: 'isNull' },
      { path: 'visitor.email', op: 'isNull' },
      { path: 'trip.travelers_count', op: 'isNull' },
      { path: 'trip.length_days', op: 'isNull' },
      { path: 'preferences.interests', op: 'includes', value: 'desert' },
      { path: 'follow_up_window', op: 'isNull' },
    ],
  },
  {
    id: 'x-phone-whatsapp',
    locale: 'en',
    description: 'Phone-first contact with WhatsApp preference — preferred_contact enum.',
    transcript: [
      { role: 'user', content: 'Group of 6 university friends, mid-June, one week, tight-ish budget. Cairo plus either Luxor or the coast.' },
      { role: 'assistant', content: 'June is hot but very workable with early starts — and it is the best-value season by far. With one week I would weigh Cairo plus Luxor for the history, or Cairo plus Dahab if the group wants water. Which way does the group lean?' },
      { role: 'user', content: "History. Luxor. I'm Karim, reach me on WhatsApp at +20 100 555 0134 — I check email maybe once a week, karim.h@example.com if you must." },
      { role: 'assistant', content: 'Noted, Karim — WhatsApp it is. Before I pass this to our team, anything the group absolutely wants included?' },
      { role: 'user', content: 'Hot air balloon over Luxor. Non-negotiable.' },
      { role: 'assistant', content: 'A fine non-negotiable. The team has everything it needs — they will come back to you on WhatsApp by 10 a.m. Cairo time tomorrow.' },
    ],
    expectComplete: true,
    assertions: [
      { path: 'visitor.phone', op: 'contains', value: '0134' },
      { path: 'visitor.preferred_contact', op: 'equals', value: 'whatsapp' },
      { path: 'trip.travelers_count', op: 'equals', value: 6 },
      { path: 'preferences.must_see', op: 'includes', value: 'balloon' },
      { path: 'preferences.comfort_level', op: 'nonNull' },
    ],
  },
  {
    id: 'x-es-display-language',
    locale: 'es',
    description: 'Spanish transcript — display fields stay Spanish, structure stays stable.',
    transcript: [
      { role: 'user', content: 'Hola, somos una familia de cinco, dos adultos y tres niños de 8, 11 y 14. Pensamos en las vacaciones de agosto, unos nueve días.' },
      { role: 'assistant', content: 'Agosto con niños funciona mejor de lo que se suele pensar: madrugones, sombra al mediodía y piscina por la tarde. ¿Qué les ilusiona más — las pirámides, el río o el mar Rojo?' },
      { role: 'user', content: 'Las pirámides y bucear en el mar Rojo. Mi hijo mayor es celíaco, eso sí. Nada de mercados con mucha gente, mi mujer los odia.' },
      { role: 'assistant', content: 'Perfecto: El Cairo primero y luego el mar Rojo, con cocina sin gluten avisada en cada hotel. Antes de pasarle el encargo al equipo, ¿me das tu nombre y un correo?' },
      { role: 'user', content: 'Claro: Andrés Molina, andres.molina@example.mx, mi celular es +52 55 5555 0147. Escribimos desde Ciudad de México.' },
      { role: 'assistant', content: 'Gracias, Andrés. El equipo tiene todo lo que necesita — te responderán antes de las 10h, hora de El Cairo, mañana.' },
    ],
    expectComplete: true,
    assertions: [
      { path: 'visitor.email', op: 'equals', value: 'andres.molina@example.mx' },
      { path: 'trip.travelers_count', op: 'equals', value: 5 },
      { path: 'constraints.dietary', op: 'nonNull' },
      // ES display directive: visitor-shown free text should be Spanish.
      { path: 'preferences.must_avoid', op: 'includes', value: 'mercado' },
      { path: 'trip.dates_window', op: 'contains', value: 'agosto' },
    ],
  },
  {
    id: 'x-contact-no-trip',
    locale: 'en',
    description: 'Email present but zero trip substance — complete must be FALSE.',
    // Calibration run 2026-07-03 (2/2 reps): the extractor returned
    // complete:true here despite rule 5. RESOLVED same day (owner decision:
    // code enforcement) — passesCompletenessRule() in briefExtraction.ts now
    // forces complete:false deterministically, so this fixture gates again.
    transcript: [
      { role: 'user', content: 'Can you email me a brochure? mark.t@example.com' },
      { role: 'assistant', content: 'We work a little differently — no brochures, but a conversation that ends with a plan shaped to you. What kind of trip is on your mind, and roughly when?' },
      { role: 'user', content: 'No idea yet honestly. Just collecting options.' },
    ],
    expectComplete: false,
    assertions: [
      { path: 'visitor.email', op: 'equals', value: 'mark.t@example.com' },
      { path: 'trip.destinations', op: 'equals', value: [] },
      { path: 'trip.dates_window', op: 'isNull' },
    ],
  },
  {
    id: 'x-no-invention',
    locale: 'en',
    description: 'Sparse but complete — absent fields must stay null (no plausible filling).',
    transcript: [
      { role: 'user', content: 'One week, just me, sometime in March. Mostly Luxor. I want to sketch the temples — I am an illustrator.' },
      { role: 'assistant', content: 'A week of drawing in Luxor is a wonderful brief — quiet corners of Karnak at opening time, Medinet Habu in the late light. Before I pass this to our team, your name and a good email?' },
      { role: 'user', content: 'Ana Duarte, ana.duarte@example.pt, phone +351 912 555 034.' },
      { role: 'assistant', content: 'Thank you, Ana. I have everything I need — the team will come back to you by 8 p.m. Cairo time.' },
    ],
    expectComplete: true,
    assertions: [
      { path: 'visitor.name', op: 'contains', value: 'duarte' },
      { path: 'trip.travelers_count', op: 'equals', value: 1 },
      { path: 'trip.length_days', op: 'equals', value: 7 },
      // Nothing was said about any of these — inventing them is the failure mode.
      { path: 'visitor.nationality', op: 'isNull' },
      { path: 'constraints.dietary', op: 'isNull' },
      { path: 'constraints.mobility', op: 'isNull' },
      { path: 'trip.international_flights', op: 'isNull' },
    ],
  },
];
