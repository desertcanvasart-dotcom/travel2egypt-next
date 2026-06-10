import type { Metadata } from 'next';
import { setRequestLocale, getTranslations } from 'next-intl/server';

import type { Locale } from '@/i18n/routing';
import { isChatEnabled } from '@/lib/concierge/chatEnabled';
import { resolveTourContext } from '@/lib/concierge/tourContext';
import { buildStaticMetadata } from '@/lib/seo';
import { TrustStrip } from '@/components/TrustStrip';
import { ConciergeFrame } from '@/components/concierge/ConciergeFrame';
import { JourneyIndicator } from '@/components/concierge/JourneyIndicator';
import { ChatContainer } from '@/components/concierge/ChatContainer';
import { ConciergeFallback } from '@/components/concierge/ConciergeFallback';
import '@/styles/concierge.css';

interface Props {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ tour?: string | string[]; resume_error?: string | string[] }>;
}

/**
 * Force per-request rendering (S3 decision 6). The (site) layout sets
 * `revalidate = 60` for the whole group; without this override the breaker
 * gate and ?tour= would be baked at ISR-revalidate time instead of
 * evaluated per request. This is the one route that must flip instantly.
 */
export const dynamic = 'force-dynamic';

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
 * /plan-your-tour — AI concierge (S1 shell, S3 functional chat).
 *
 * Gate order (per build brief):
 *   1. CHAT_ENABLED off  → fallback(disabled), all locales. The single
 *      go-live/rollback lever.
 *   2. locale ∉ {en, es} → fallback(locale).
 *   3. en / es           → the chat.
 *
 * Reading `searchParams` makes this route PER-REQUEST DYNAMIC (S3 decision
 * 6, deliberate): the breaker flips instantly here instead of trailing the
 * 60 s ISR window, and the route is genuinely dynamic by nature (per-visitor
 * chat, per-URL tour context). `?tour=` is user-controlled — it resolves
 * against Sanity or degrades silently to the default opening.
 *
 * The site-wide TravelAgency JSON-LD is inherited from the layout; no
 * page-specific structured data is added.
 */
export default async function Page({ params, searchParams }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const lc = locale as Locale;

  if (!isChatEnabled()) return <ConciergeFallback reason="disabled" />;
  if (lc !== 'en' && lc !== 'es') return <ConciergeFallback reason="locale" />;

  const { tour, resume_error } = await searchParams;
  const rawTourSlug = typeof tour === 'string' ? tour : null;
  const tourContext = rawTourSlug ? await resolveTourContext(rawTourSlug, lc) : null;
  const resumeError = resume_error === '1';

  const t = await getTranslations({ locale, namespace: 'planYourTour' });
  return (
    <div className="cnc">
      <ConciergeFrame />
      <JourneyIndicator />
      <div className="cnc-trust">
        <TrustStrip label={t('trustLabel')} yearsLabel={t('trustYearsLabel')} />
      </div>
      <ChatContainer
        locale={lc as 'en' | 'es'}
        tourSlug={tourContext?.slug ?? null}
        tourTitle={tourContext?.title ?? null}
        resumeError={resumeError}
      />
    </div>
  );
}
