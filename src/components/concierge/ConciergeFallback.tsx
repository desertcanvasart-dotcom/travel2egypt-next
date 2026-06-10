import { useTranslations } from 'next-intl';

import { Link } from '@/i18n/navigation';
import { whatsappUrl } from '@/lib/concierge/constants';

/**
 * ConciergeFallback — the single component served for both circuit-breaker
 * triggers: `reason="locale"` (an unsupported locale, e.g. JA) and
 * `reason="disabled"` (CHAT_ENABLED is off). Renders a localized note plus the
 * two human paths — the existing /contact page and WhatsApp.
 *
 * (Per-IP rate-limit blocking will reuse this component with a third reason in
 * a later session; the two Session-1 reasons share everything but the body.)
 */
export function ConciergeFallback({ reason }: { reason: 'locale' | 'disabled' }) {
  const t = useTranslations('planYourTour');
  const body = reason === 'locale' ? t('fallbackBodyLocale') : t('fallbackBodyDisabled');
  const whatsappHref = whatsappUrl(t('fallbackWhatsappText'));

  return (
    <section className="cnc">
      <div className="cnc-fallback">
        <p className="cnc-fallback__eyebrow">{t('fallbackEyebrow')}</p>
        <h1 className="cnc-fallback__heading">{t('fallbackHeading')}</h1>
        <p className="cnc-fallback__body">{body}</p>
        <div className="cnc-fallback__actions">
          <Link href="/contact" className="btn-secondary-light">
            <span>{t('fallbackContactCta')}</span>
            <span aria-hidden>→</span>
          </Link>
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary-light"
          >
            <span>{t('fallbackWhatsappCta')}</span>
            <span aria-hidden>→</span>
          </a>
        </div>
      </div>
    </section>
  );
}
