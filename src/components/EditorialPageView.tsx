import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { Body } from '@/components/Body';

interface CtaLink {
  label?: string;
  href?: string;
}

export interface EditorialDoc {
  heroHeading?: string;
  heroSubhead?: string;
  heroPrimaryCta?: CtaLink;
  heroSecondaryCta?: CtaLink;
  sections?: Array<{ _key: string; heading?: string; body?: unknown }>;
  ribbonBody?: string;
  ribbonCta?: CtaLink;
  bottomCtaHeading?: string;
  bottomCtaBody?: string;
  bottomCtaPrimary?: CtaLink;
  bottomCtaSecondary?: CtaLink;
}

interface Props {
  locale: Locale;
  doc: EditorialDoc | null;
}

/**
 * Generic renderer for editorialPage entities. Suitable for content-only
 * pages without dynamic data sections (Responsible Travel, About, How We
 * Plan, etc.). Hotel Grade Concept has its own bespoke renderer because
 * it interleaves tier columns with the editorial copy.
 *
 * Visual rhythm: hero → editorial sections → optional ribbon → bottom CTA.
 * Sections render at max-width 3xl (reading-optimized); hero + bottom CTA
 * expand wider for visual contrast.
 */
export function EditorialPageView({ locale, doc }: Props) {
  if (!doc) return null;

  const ctaIsExternal = (href?: string) =>
    Boolean(href && /^(https?:)?\/\//.test(href));

  function renderCta(cta: CtaLink | undefined, variant: 'primary' | 'secondary') {
    if (!cta?.href || !cta?.label) return null;
    const cls =
      variant === 'primary'
        ? 'rounded-full bg-orange px-6 py-3 text-sm font-medium text-paper transition-colors hover:bg-orange-deep'
        : 'rounded-full border border-ink px-6 py-3 text-sm font-medium text-ink transition-colors hover:bg-ink hover:text-paper';
    if (cta.href.startsWith('#')) {
      return <a href={cta.href} className={cls}>{cta.label}</a>;
    }
    if (ctaIsExternal(cta.href)) {
      return (
        <a href={cta.href} target="_blank" rel="noopener noreferrer" className={cls}>
          {cta.label}
        </a>
      );
    }
    return <Link href={cta.href} className={cls}>{cta.label}</Link>;
  }

  return (
    <article>
      {/* Hero */}
      <header className="border-b border-line bg-cream-warm/40">
        <div className="mx-auto max-w-3xl px-6 py-20 text-center">
          {doc.heroHeading && (
            <h1 className="mb-6 font-serif text-5xl font-medium leading-tight text-ink md:text-6xl">
              {doc.heroHeading}
            </h1>
          )}
          {doc.heroSubhead && (
            <p className="mx-auto max-w-2xl font-serif text-xl italic leading-relaxed text-ink-soft">
              {doc.heroSubhead}
            </p>
          )}
          {(doc.heroPrimaryCta?.href || doc.heroSecondaryCta?.href) && (
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              {renderCta(doc.heroPrimaryCta, 'primary')}
              {renderCta(doc.heroSecondaryCta, 'secondary')}
            </div>
          )}
        </div>
      </header>

      {/* Editorial sections */}
      {doc.sections && doc.sections.length > 0 && (
        <section className="mx-auto max-w-3xl px-6 py-16">
          {doc.sections.map((s) => (
            <div key={s._key} className="mb-16 last:mb-0">
              {s.heading && (
                <h2 className="mb-6 font-serif text-3xl font-medium text-ink">{s.heading}</h2>
              )}
              {Boolean(s.body) && (
                <div className="prose-editorial max-w-none">
                  <Body value={s.body} locale={locale} />
                </div>
              )}
            </div>
          ))}
        </section>
      )}

      {/* Mid-page ribbon (only when populated) */}
      {doc.ribbonBody && (
        <aside className="bg-orange py-10 text-paper">
          <div className="mx-auto flex max-w-5xl flex-col items-center gap-6 px-6 text-center sm:flex-row sm:justify-between sm:text-left">
            <p className="max-w-2xl font-serif text-lg italic leading-relaxed">
              {doc.ribbonBody}
            </p>
            {renderCta(doc.ribbonCta, 'secondary')}
          </div>
        </aside>
      )}

      {/* Bottom CTA */}
      {(doc.bottomCtaHeading || doc.bottomCtaBody || doc.bottomCtaPrimary?.href) && (
        <section className="border-t border-line bg-cream-warm/40">
          <div className="mx-auto max-w-3xl px-6 py-20 text-center">
            {doc.bottomCtaHeading && (
              <h2 className="mb-4 font-serif text-3xl font-medium text-ink md:text-4xl">
                {doc.bottomCtaHeading}
              </h2>
            )}
            {doc.bottomCtaBody && (
              <p className="mx-auto mb-10 max-w-2xl font-serif text-lg italic leading-relaxed text-ink-soft">
                {doc.bottomCtaBody}
              </p>
            )}
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              {renderCta(doc.bottomCtaPrimary, 'primary')}
              {renderCta(doc.bottomCtaSecondary, 'secondary')}
            </div>
          </div>
        </section>
      )}
    </article>
  );
}
