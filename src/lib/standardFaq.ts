import type { LandingFaqItem } from '@/components/tour-system/LandingFaq';

/**
 * Standard FAQs shown on every tour page and every day-tour hub, after any
 * page-specific FAQs (owner-locked copy 2026-11-14,
 * review/content/tour-faq-and-reviews-2026-11-14-en.md; facts: owner
 * 2026-11-14 + the /terms page). One source, so 228 pages can't drift.
 * EN only until the ES/JA versions are approved.
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

export function standardFaq(locale: string): LandingFaqItem[] {
  return locale === 'en' ? EN : [];
}

/** Page FAQs first, then the standard set (skipping any same-question duplicate). */
export function withStandardFaq(items: LandingFaqItem[] | null | undefined, locale: string): LandingFaqItem[] {
  const own = items ?? [];
  const seen = new Set(own.map((i) => (i.question ?? '').trim().toLowerCase()));
  return [...own, ...standardFaq(locale).filter((i) => !seen.has((i.question ?? '').trim().toLowerCase()))];
}
