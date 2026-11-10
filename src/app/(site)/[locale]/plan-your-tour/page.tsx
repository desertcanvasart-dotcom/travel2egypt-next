import { Fragment } from 'react';
import type { Metadata } from 'next';
import { groq } from 'next-sanity';
import { setRequestLocale, getTranslations } from 'next-intl/server';

import type { Locale } from '@/i18n/routing';
import { isChatEnabled } from '@/lib/concierge/chatEnabled';
import { loadResolvedLinkMap } from '@/lib/linkMap/loader';
import { resolveTourContext } from '@/lib/concierge/tourContext';
import { buildStaticMetadata } from '@/lib/seo';
import { client } from '@/sanity/lib/client';
import { siteSettingsQuery } from '@/sanity/lib/queries';
import { iataItem, licenceShort } from '@/lib/accreditations';
import { TRIPADVISOR_RATING, TRIPADVISOR_REVIEW_COUNT } from '@/lib/company';
import { HOME_COPY, homeLocale } from '@/components/home-sales/copy';
import { TrustStrip } from '@/components/TrustStrip';
import { PlanOptions } from '@/components/plan/PlanOptions';
import { JOURNEY_KEYS, JOURNEYS } from '@/lib/journeys/registry';
import '@/styles/concierge.css';
import '@/styles/lead-form.css';
import '@/styles/plan-page.css';

interface Props {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ tour?: string | string[]; resume_error?: string | string[]; q?: string | string[]; journey?: string | string[] }>;
}

/**
 * Per-request rendering (S3 decision 6): ?tour= and the CHAT_ENABLED breaker
 * are evaluated per request, not baked at ISR time.
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

/** ?tour= for the form: matched on any language's slug; EN slug is the lead key. */
const planTourQuery = groq`*[_type == "tour" && !(_id in path("drafts.**")) && (
    slug[_key == $locale][0].value.current == $slug || slug[_key == "en"][0].value.current == $slug
  )][0]{
    "slug": slug[_key == "en"][0].value.current,
    "title": coalesce(title[_key == $locale][0].value, title[_key == "en"][0].value),
    durationDays,
    type
  }`;

function plausibleSlug(raw: string | null): raw is string {
  return !!raw && /^[a-z0-9][a-z0-9-]{1,98}[a-z0-9]$/i.test(raw);
}

/**
 * /plan-your-tour — form-first planning page (owner spec "Planning page
 * rebuild", 2026-11-08). The itinerary form is the default; WhatsApp and the
 * AI concierge are offered alongside. The concierge itself is unchanged and
 * loads only when chosen; JA (unsupported by the concierge) shows no
 * concierge option. The site-wide TravelAgency JSON-LD comes from the layout;
 * this page adds no structured data.
 */
export default async function Page({ params, searchParams }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const lc = locale as Locale;
  const hl = homeLocale(locale);

  const { tour, resume_error, q, journey: journeyParam } = await searchParams;
  // ?journey= accepts the journey key ("family") or its EN page slug ("travelling-as-a-family").
  const jp = typeof journeyParam === 'string' ? journeyParam : null;
  const journey = jp ? (JOURNEY_KEYS.find((k) => k === jp || JOURNEYS[k].path === `/journeys/${jp}`) ?? null) : null;
  // A question from the floating concierge panel; plain text, length-capped.
  const question = typeof q === 'string' ? q.replace(/\s+/g, ' ').trim().slice(0, 500) || null : null;
  const rawSlug = typeof tour === 'string' ? tour : null;

  const chatLocale = lc === 'en' || lc === 'es' ? lc : null;
  const chatOn = isChatEnabled() && chatLocale !== null;

  const [settings, formTour, tourContext, linkMap, t] = await Promise.all([
    client.fetch<{
      responseTimeFull?: string | null;
      responseTimeShort?: string | null;
      ministryLicenceNumber?: string | null;
      etaaMember?: boolean | null;
      iataNumber?: string | null;
    } | null>(siteSettingsQuery(lc)),
    plausibleSlug(rawSlug)
      ? client
          .fetch<{ slug: string | null; title: string | null; durationDays?: number | null; type?: string | null } | null>(
            planTourQuery,
            { slug: rawSlug, locale: lc },
          )
          .catch(() => null)
      : Promise.resolve(null),
    chatOn && rawSlug ? resolveTourContext(rawSlug, lc) : Promise.resolve(null),
    chatOn ? loadResolvedLinkMap(lc) : Promise.resolve([]),
    getTranslations({ locale, namespace: 'planYourTour' }),
  ]);

  const steps = [
    { num: '01', title: t('step1Title'), desc: t('step1Line') },
    { num: '02', title: t('step2Title'), desc: t('step2Line') },
    { num: '03', title: t('step3Title'), desc: settings?.responseTimeShort ?? '' },
  ];
  const tourForForm =
    formTour?.slug && formTour.title
      ? { slug: formTour.slug, title: formTour.title, durationDays: formTour.durationDays ?? null }
      : null;
  const waText = tourForForm ? t('waPlanTourText', { title: tourForForm.title }) : t('waPlanText');

  return (
    <div className="cnc plan-page">
      {/* 2.1 Hero */}
      <section className="cnc-frame plan-hero">
        <p className="cnc-frame__eyebrow">{t('heroEyebrow')}</p>
        <h1 className="cnc-frame__heading">{t('heroH1')}</h1>
        <p className="cnc-frame__subheading">{t('heroSub')}</p>
        {settings?.responseTimeFull && <p className="plan-hero__response">{settings.responseTimeFull}</p>}
      </section>

      {/* 2.2–2.4 Three ways to start + the content area */}
      <PlanOptions
        locale={hl}
        tour={tourForForm}
        journey={journey}
        copy={{
          optionsLabel: t('optionsLabel'),
          card1Title: t('card1Title'),
          card1Line: t('card1Line'),
          card2Title: t('card2Title'),
          card2Line: t('card2Line'),
          card3Title: t('card3Title'),
          card3Line: t('card3Line'),
          conciergeLangNote: t('conciergeLangNote'),
          thanksHeading: t('thanksHeading'),
          thanksUrgent: t('thanksUrgent'),
          waText,
        }}
        chat={
          chatOn && chatLocale
            ? {
                locale: chatLocale,
                tourSlug: tourContext?.slug ?? null,
                tourTitle: tourContext?.title ?? null,
                resumeError: resume_error === '1',
                linkMap,
                initialInput: question,
              }
            : null
        }
      />

      {/* 2.5 How it works */}
      <section className="cnc-journey">
        <div className="cnc-journey__inner">
          {steps.map((step, i) => (
            <Fragment key={step.num}>
              <div className="cnc-journey__step">
                <span className="cnc-journey__num" aria-hidden>
                  {step.num}
                </span>
                <span className="cnc-journey__title">{step.title}</span>
                <span className="cnc-journey__desc">{step.desc}</span>
              </div>
              {i < steps.length - 1 && <span className="cnc-journey__connector" aria-hidden />}
            </Fragment>
          ))}
        </div>
      </section>

      {/* 2.6 Trust strip */}
      <div className="cnc-trust">
        <TrustStrip
          heading={t('trustHeading')}
          tripadvisor={HOME_COPY[hl].hero.tripadvisor(TRIPADVISOR_RATING, TRIPADVISOR_REVIEW_COUNT)}
          tripadvisorAria={t('trustTripadvisorAria')}
          items={[licenceShort(settings, lc), t('trustGuiding'), iataItem(settings)]}
        />
      </div>
    </div>
  );
}
