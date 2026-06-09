import type { Metadata } from 'next';
import { setRequestLocale, getTranslations } from 'next-intl/server';

import type { Locale } from '@/i18n/routing';
import { buildStaticMetadata } from '@/lib/seo';
import { TrustStrip } from '@/components/TrustStrip';
import { ConciergeFrame } from '@/components/concierge/ConciergeFrame';
import { JourneyIndicator } from '@/components/concierge/JourneyIndicator';
import { ChatContainer } from '@/components/concierge/ChatContainer';
import { ConciergeFallback } from '@/components/concierge/ConciergeFallback';
import '@/styles/concierge.css';

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'planYourTour' });
  return buildStaticMetadata({
    locale: locale as Locale,
    path: '/plan-your-tour',
    title: t('metaTitle'),
    description: t('metaDescription'),
  });
}

/**
 * /plan-your-tour — AI concierge (Session 1: static shell + circuit breaker).
 *
 * Gate order (per build brief):
 *   1. CHAT_ENABLED off  → fallback(disabled), all locales. Default OFF —
 *      the single go-live lever; set CHAT_ENABLED=true to expose the shell.
 *   2. locale ∉ {en, es} → fallback(locale).
 *   3. en / es           → the concierge shell.
 *
 * The site-wide TravelAgency JSON-LD is inherited from the layout; no
 * page-specific structured data is added.
 */
export default async function Page({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const lc = locale as Locale;

  const chatEnabled = process.env.CHAT_ENABLED === 'true';
  if (!chatEnabled) return <ConciergeFallback reason="disabled" />;
  if (lc !== 'en' && lc !== 'es') return <ConciergeFallback reason="locale" />;

  const t = await getTranslations({ locale, namespace: 'planYourTour' });
  return (
    <div className="cnc">
      <ConciergeFrame />
      <JourneyIndicator />
      <div className="cnc-trust">
        <TrustStrip label={t('trustLabel')} yearsLabel={t('trustYearsLabel')} />
      </div>
      <ChatContainer />
    </div>
  );
}
