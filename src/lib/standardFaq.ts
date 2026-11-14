import type { LandingFaqItem } from '@/components/tour-system/LandingFaq';

/**
 * Standard FAQs shown on every tour page and every day-tour hub, after any
 * page-specific FAQs (owner-locked copy 2026-11-14,
 * review/content/tour-faq-and-reviews-2026-11-14-en.md; facts: owner
 * 2026-11-14 + the /terms page). One source, so 228 pages can't drift.
 * ES/JA approved 2026-11-14.
 */
const TERMS = '/terms#cancellation-by-the-traveller';

let k = 0;
const span = (text: string, marks: string[] = []) => ({ _key: `sfs${k++}`, _type: 'span', text, marks });
const block = (children: unknown[], markDefs: unknown[] = []) => ({ _key: `sfb${k++}`, _type: 'block', style: 'normal', markDefs, children });

const EN: LandingFaqItem[] = [
  {
    _key: 'std-faq-included',
    question: 'What’s included in the tour?',
    answer: [block([span('Every tour includes transport in a modern air-conditioned car, a guide, the entrance fees for the sites on the itinerary, and one bottle of mineral water per person. Meals are included where the tour description says so.')])],
  },
  {
    _key: 'std-faq-order',
    question: 'Can we change the order of the sites?',
    answer: [block([span('Sometimes, and it should be for a reason, but we’re very open to requests. Tell us what you’d like and we’ll do our best to accommodate it.')])],
  },
  {
    _key: 'std-faq-cancellation',
    question: 'What is your cancellation policy?',
    answer: [
      block(
        [
          span('Cancellation follows our '),
          span('Terms and Conditions', ['sfterms1']),
          span('. The fees depend on how close to departure you cancel, and the full schedule is in the '),
          span('Terms and Conditions', ['sfterms2']),
          span('.'),
        ],
        [
          { _key: 'sfterms1', _type: 'externalLink', href: TERMS },
          { _key: 'sfterms2', _type: 'externalLink', href: TERMS },
        ],
      ),
    ],
  },
];

function locFaq(
  q: [string, string, string],
  a1: string,
  a2: string,
  c: { before: string; link: string; mid: string; after: string; href: string },
  prefix: string,
): LandingFaqItem[] {
  return [
    { _key: `std-faq-included-${prefix}`, question: q[0], answer: [block([span(a1)])] },
    { _key: `std-faq-order-${prefix}`, question: q[1], answer: [block([span(a2)])] },
    {
      _key: `std-faq-cancellation-${prefix}`,
      question: q[2],
      answer: [
        block(
          [span(c.before), span(c.link, [`${prefix}t1`]), span(c.mid), span(c.link, [`${prefix}t2`]), span(c.after)],
          [
            { _key: `${prefix}t1`, _type: 'externalLink', href: c.href },
            { _key: `${prefix}t2`, _type: 'externalLink', href: c.href },
          ],
        ),
      ],
    },
  ];
}

// ES/JA: owner-approved 2026-11-14, review/content/duration-hubs-and-faq-2026-11-14-es-ja.md
const ES = locFaq(
  ['¿Qué incluye el tour?', '¿Podemos cambiar el orden de las visitas?', '¿Cuál es la política de cancelación?'],
  'Todos los tours incluyen transporte en un coche moderno con aire acondicionado, guía, las entradas a los lugares del itinerario y una botella de agua mineral por persona. Las comidas están incluidas cuando la descripción del tour lo indica.',
  'A veces, y debe haber un motivo, pero estamos muy abiertos a tus peticiones. Dinos qué te gustaría y haremos lo posible por adaptarnos.',
  {
    before: 'La cancelación se rige por nuestros ',
    link: 'Términos y condiciones',
    mid: '. Los gastos dependen de la antelación con la que canceles, y el calendario completo está en los ',
    after: '.',
    href: '/es/terms#cancelacion-por-parte-del-viajero',
  },
  'es',
);

const JA = locFaq(
  ['ツアーには何が含まれていますか？', '見学の順番を変えられますか？', 'キャンセル規定を教えてください。'],
  'すべてのツアーに、エアコン付きの新しい車での送迎、ガイド、旅程に含まれる見どころの入場料、お一人様1本のミネラルウォーターが含まれます。食事は、ツアーの説明に記載がある場合に含まれます。',
  '変更することもあり、その場合は理由があるのが前提ですが、ご要望には積極的にお応えしています。ご希望をお知らせいただければ、できる限り対応します。',
  {
    before: 'キャンセルは当社の',
    link: '利用規約',
    mid: 'に従います。料金は出発日までの日数によって異なり、詳しくは',
    after: 'に記載しています。',
    href: '/ja/terms#section-6',
  },
  'ja',
);

export function standardFaq(locale: string): LandingFaqItem[] {
  return locale === 'es' ? ES : locale === 'ja' ? JA : EN;
}

/** Page FAQs first, then the standard set (skipping any same-question duplicate). */
export function withStandardFaq(items: LandingFaqItem[] | null | undefined, locale: string): LandingFaqItem[] {
  const own = items ?? [];
  const seen = new Set(own.map((i) => (i.question ?? '').trim().toLowerCase()));
  return [...own, ...standardFaq(locale).filter((i) => !seen.has((i.question ?? '').trim().toLowerCase()))];
}
