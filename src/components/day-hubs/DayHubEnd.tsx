import { getTranslations } from 'next-intl/server';

import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { LeadForm } from '@/components/leads/LeadForm';
import { isChatEnabled } from '@/lib/concierge/chatEnabled';
import { WHATSAPP_LINK } from '@/lib/concierge/constants';

/**
 * Day-tour hub end block (2026-11-09): the homepage's inline itinerary form,
 * source=day_tour_hub, hub={page slug}. City hubs pre-fill the notes with the
 * city. JA shows no concierge link.
 */
export async function DayHubEnd({
  locale,
  hub,
  city,
  responseTimeFull,
}: {
  locale: Locale;
  hub: string;
  /** City hubs only. */
  city?: string;
  responseTimeFull?: string | null;
}) {
  const t = await getTranslations({ locale, namespace: 'dayHub' });
  const isJa = locale === 'ja';
  const conciergeOn = !isJa && isChatEnabled();
  return (
    <section className="dh-end" id="itinerary" aria-labelledby="h-dh-end">
      <div className="lvl-home lvl-sales">
        <div className="plan sales-close">
          <div className="wrap close-grid">
            <div>
              <span className="kicker">{t('endKicker')}</span>
              <h2 id="h-dh-end">{city ? t('endTitleCity', { city }) : t('endTitle')}</h2>
              <p className="sub">
                {t('endLine')}
                {isJa ? '' : ' '}
                {responseTimeFull}
              </p>
              <ul className="close-alt">
                <li>
                  {t('chat')}
                  {isJa ? '' : ' '}
                  <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer">
                    WhatsApp +20 155 177 2258
                  </a>
                </li>
                {conciergeOn && (
                  <li>
                    {t('exploring')} <Link href="/plan-your-tour">{t('concierge')}</Link>
                  </li>
                )}
              </ul>
            </div>
            <LeadForm
              source="day_tour_hub"
              tone="dark"
              headingId="h-dh-end"
              locale={locale}
              prefill={{ hub, ...(city ? { notes: t('notesCity', { city }) } : {}) }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
