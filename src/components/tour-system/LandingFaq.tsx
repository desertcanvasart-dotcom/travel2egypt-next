import { getTranslations } from 'next-intl/server';

import { Body } from '@/components/Body';
import { JsonLd } from '@/components/JsonLd';
import { buildFAQSchema } from '@/lib/structured-data';
import type { Locale } from '@/i18n/routing';

/**
 * Structured FAQ section for the commercial landings (tourLanding /
 * tourCategory `faq` arrays — s47 checklist C13). One component for every
 * landing view so the visible Q&A and the FAQPage JSON-LD can never drift:
 * the schema is derived from exactly the items rendered (Google requires
 * marked-up FAQ content to be visible on the page).
 *
 * Renders nothing when the array is empty — the section (and its markup)
 * appears only once an editor authors items in the Studio.
 */

export interface LandingFaqItem {
  _key: string;
  question?: string | null;
  /** Locale-resolved Portable Text (projected server-side). */
  answer?: unknown[] | null;
}

/** Flatten a projected Portable Text answer to plain text for JSON-LD. */
function answerPlainText(answer: unknown[] | null | undefined): string {
  if (!Array.isArray(answer)) return '';
  return answer
    .map((block) => {
      const children = (block as { children?: Array<{ text?: string }> }).children;
      if (!Array.isArray(children)) return '';
      return children.map((c) => c.text ?? '').join('');
    })
    .filter(Boolean)
    .join('\n\n')
    .trim();
}

export async function LandingFaq({
  items,
  locale,
}: {
  items?: LandingFaqItem[] | null;
  locale: Locale;
}) {
  const list = (items ?? []).filter(
    (i) => i.question?.trim() && Array.isArray(i.answer) && i.answer.length > 0
  );
  if (list.length === 0) return null;

  const t = await getTranslations('landingFaq');
  const schema = buildFAQSchema(
    list.map((i) => ({
      question: i.question!.trim(),
      answer: answerPlainText(i.answer),
    }))
  );

  return (
    <section className="mx-auto max-w-7xl px-6 py-16" aria-labelledby="landing-faq-heading">
      <JsonLd data={schema} />
      <h2
        id="landing-faq-heading"
        className="mb-8 font-serif text-3xl font-medium text-ink"
      >
        {t('heading')}
      </h2>
      <dl className="max-w-3xl">
        {list.map((i) => (
          <div key={i._key} className="mb-8 border-b border-rule pb-8 last:border-b-0">
            <dt className="mb-3 font-serif text-xl font-medium text-ink">{i.question}</dt>
            <dd className="prose-editorial">
              <Body value={i.answer as never} locale={locale} />
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
