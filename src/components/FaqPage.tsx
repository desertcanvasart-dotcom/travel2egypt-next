import { useTranslations } from 'next-intl';

import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { Body } from '@/components/Body';

import { FaqHashOpener } from './FaqHashOpener';

interface FaqEntry {
  _id: string;
  question?: string;
  answer?: unknown;
}

export interface FaqCategory {
  _id: string;
  name?: string;
  slug?: string;
  entries?: FaqEntry[];
}

interface Props {
  locale: Locale;
  categories: FaqCategory[];
}

const WHATSAPP_HREF =
  'https://wa.me/201158011600?text=' +
  encodeURIComponent('Hi Travel2Egypt, I have a question about planning a trip.');

/** Derive a stable anchor id from question text — faqEntry has no slug field. */
function anchorId(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

/**
 * FAQ page — categories rendered as headed groups, each entry a native
 * <details>/<summary> accordion. Deep-linkable: every category heading and
 * every entry carries an id, and <FaqHashOpener> opens the targeted entry
 * on load. Native accordion means it works without JS; only the deep-link
 * auto-open needs the client.
 */
export function FaqPage({ locale, categories }: Props) {
  const t = useTranslations('faq');

  return (
    <article>
      <FaqHashOpener />

      {/* Hero */}
      <header className="border-b border-line bg-cream-warm/40">
        <div className="mx-auto max-w-3xl px-6 py-20 text-center">
          <h1 className="mb-6 font-serif text-5xl font-medium leading-tight text-ink md:text-6xl">
            {t('heroHeading')}
          </h1>
          <p className="mx-auto max-w-2xl font-serif text-xl italic leading-relaxed text-ink-soft">
            {t('heroSubhead')}
          </p>
        </div>
      </header>

      {/* Intro */}
      <section className="mx-auto max-w-3xl px-6 pt-12">
        <p className="text-base leading-relaxed text-ink-soft">
          For deeper guidance on specific topics — transportation, regional
          itineraries, what to eat — see our{' '}
          <Link href="/travel-tips" className="text-orange underline underline-offset-2">
            Travel Tips
          </Link>{' '}
          and{' '}
          <Link href="/guide" className="text-orange underline underline-offset-2">
            Travel Guide
          </Link>{' '}
          sections. For questions about your own trip, the fastest path is to
          write us directly — we respond within hours, seven days a week.
        </p>
      </section>

      {/* Categories + entries */}
      <section className="mx-auto max-w-3xl px-6 py-12">
        {categories.map((cat) => (
          <div key={cat._id} className="mb-14 last:mb-0">
            <h2
              id={cat.slug}
              className="mb-4 scroll-mt-24 font-serif text-3xl font-medium text-ink"
            >
              {cat.name}
            </h2>
            <div className="border-t border-line">
              {(cat.entries ?? []).map((entry) => {
                const id = entry.question ? anchorId(entry.question) : entry._id;
                return (
                  <details
                    key={entry._id}
                    id={id}
                    className="group scroll-mt-24 border-b border-line"
                  >
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 font-serif text-lg font-medium text-ink [&::-webkit-details-marker]:hidden">
                      <span>{entry.question}</span>
                      <span
                        aria-hidden
                        className="shrink-0 text-2xl leading-none text-ink-soft transition-transform duration-200 group-open:rotate-45"
                      >
                        +
                      </span>
                    </summary>
                    <div className="prose-editorial max-w-none pb-6">
                      <Body value={entry.answer} locale={locale} />
                    </div>
                  </details>
                );
              })}
            </div>
          </div>
        ))}
      </section>

      {/* Bottom CTA */}
      <section className="border-t border-line bg-cream-warm/40">
        <div className="mx-auto max-w-3xl px-6 py-16 text-center">
          <p className="mb-6 font-serif text-2xl italic text-ink-soft">
            {t('bottomCtaPretext')}
          </p>
          <a
            href={WHATSAPP_HREF}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block rounded-full bg-orange px-6 py-3 text-sm font-medium text-paper transition-colors hover:bg-orange-deep"
          >
            {t('bottomCtaLabel')}
          </a>
        </div>
      </section>
    </article>
  );
}
