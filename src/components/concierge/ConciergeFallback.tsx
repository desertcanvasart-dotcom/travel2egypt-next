import { useTranslations } from 'next-intl';

import { Link } from '@/i18n/navigation';
import { whatsappUrl } from '@/lib/concierge/constants';

/**
 * ConciergeFallback — the single component served for the chat-unavailable
 * triggers: `reason="locale"` (an unsupported locale, e.g. JA), `"disabled"`
 * (CHAT_ENABLED is off), and `"rate_limited"` (the S7 per-IP hard block).
 * Renders a localized note plus the two human paths — the existing /contact
 * page and WhatsApp. The reasons share everything but the body.
 *
 * Server-safe and client-safe (no server-only imports): the page renders it
 * for locale/disabled; ChatContainer renders it client-side on a per-IP 429.
 */
export function ConciergeFallback({ reason }: { reason: 'locale' | 'disabled' | 'rate_limited' }) {
  const t = useTranslations('planYourTour');
  const body =
    reason === 'locale'
      ? t('fallbackBodyLocale')
      : reason === 'rate_limited'
        ? t('fallbackBodyRateLimited')
        : t('fallbackBodyDisabled');
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
