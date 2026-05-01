import { useTranslations } from 'next-intl';

import { Link } from '@/i18n/navigation';

/**
 * Concierge CTA section — dark band with sand-color accents.
 *
 * Per migration/.brand-inputs/travel2egypt-homepage-v2.html and
 * brand-inputs.md Section 7. Drop into any page where the concierge
 * conversion path makes sense (homepage, city detail, tour detail).
 *
 * `tourSlug` (optional): when present, the primary CTA links to
 *   /plan-your-tour?context=tour:<slug> and the headline label flips
 *   to the tour-context wording.
 */

interface ConciergeCTAProps {
  tourSlug?: string;
  /** Visual variant — "full" includes the three process steps; "compact" omits them for narrow contexts. */
  variant?: 'full' | 'compact';
}

export function ConciergeCTA({ tourSlug, variant = 'full' }: ConciergeCTAProps) {
  const t = useTranslations('concierge');

  const planHref = tourSlug
    ? `/plan-your-tour?context=tour:${tourSlug}`
    : '/plan-your-tour';
  const primaryLabel = tourSlug ? t('ctaTourLabel') : t('primaryCta');

  return (
    <section className="bg-night text-paper">
      <div className="relative mx-auto max-w-[920px] px-6 py-24 md:py-32">
        <p className="mb-8 font-sans text-xs font-medium uppercase tracking-[0.18em] text-sand">
          {t('eyebrow')}
        </p>
        <h2 className="mb-8 max-w-[18em] font-serif text-[clamp(2.25rem,4.5vw,3.5rem)] font-normal leading-[1.1] tracking-[-0.02em] text-paper">
          {t('headlineFirst')}{' '}
          <em className="font-serif italic text-sand">{t('headlineAccent')}</em>
        </h2>
        <p className="mb-12 max-w-[32em] text-[1.0625rem] leading-[1.7] text-paper/80">
          {t('body')}
        </p>

        {variant === 'full' && (
          <div className="mb-12 grid grid-cols-1 gap-6 border-y border-paper/15 py-10 md:grid-cols-3 md:gap-12 md:py-12">
            {[
              { num: 'i.', title: t('step1Title'), text: t('step1Text') },
              { num: 'ii.', title: t('step2Title'), text: t('step2Text') },
              { num: 'iii.', title: t('step3Title'), text: t('step3Text') },
            ].map((step) => (
              <div key={step.num}>
                <p className="mb-2 font-serif text-sm italic text-sand">
                  {step.num}
                </p>
                <h3 className="mb-2 font-serif text-xl font-medium leading-snug text-paper">
                  {step.title}
                </h3>
                <p className="text-[0.9375rem] leading-relaxed text-paper/70">
                  {step.text}
                </p>
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
          <Link href={planHref} className="btn-primary">
            <span>{primaryLabel}</span>
            <span aria-hidden>{t('ctaTrailingArrow')}</span>
          </Link>
          <a
            href="https://wa.me/+201000000000"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary"
          >
            <span>{t('secondaryCta')}</span>
            <span aria-hidden>{t('ctaTrailingArrow')}</span>
          </a>
        </div>
      </div>
    </section>
  );
}
