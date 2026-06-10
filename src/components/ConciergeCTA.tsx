import { useTranslations } from 'next-intl';

import { Link } from '@/i18n/navigation';

/**
 * Concierge CTA section — dark band with sand-color accents.
 *
 * Per migration/.brand-inputs/travel2egypt-homepage-v2.html and
 * brand-inputs.md Section 7. Drop into any page where the concierge
 * conversion path makes sense (homepage, city detail, tour detail).
 *
 * `tourSlug` (optional): when present, the primary CTA label flips to the
 *   tour-context wording, and (chat enabled) the slug rides along as ?tour=
 *   so the concierge opens with that tour's context.
 *
 * `chatEnabled` (S3): the circuit breaker, passed down by server-component
 *   parents via isChatEnabled() — CHAT_ENABLED must stay server-side, so
 *   this component never reads env itself. true → /plan-your-tour;
 *   false/omitted → /contact (fail-safe). One lever flips the chat surface
 *   and every CTA across the site together.
 */

const WHATSAPP_HREF =
  'https://wa.me/201158011600?text=' +
  encodeURIComponent("Hi Travel2Egypt, I'd like to talk about planning a trip.");

interface ConciergeCTAProps {
  tourSlug?: string;
  /** Circuit breaker — from a server parent's isChatEnabled(). Defaults to false (CTA → /contact). */
  chatEnabled?: boolean;
  /** Visual variant — "full" includes the three process steps; "compact" omits them for narrow contexts. */
  variant?: 'full' | 'compact';
  /**
   * Optional, already-localized primary-CTA label override — e.g. "Talk to
   * our concierge about Cairo". Takes precedence over the tour/default label.
   */
  contextLabel?: string;
}

export function ConciergeCTA({
  tourSlug,
  chatEnabled = false,
  variant = 'full',
  contextLabel,
}: ConciergeCTAProps) {
  const t = useTranslations('concierge');

  const planHref = chatEnabled
    ? tourSlug
      ? `/plan-your-tour?tour=${encodeURIComponent(tourSlug)}`
      : '/plan-your-tour'
    : '/contact';
  const primaryLabel = contextLabel ?? (tourSlug ? t('ctaTourLabel') : t('primaryCta'));

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
            href={WHATSAPP_HREF}
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
