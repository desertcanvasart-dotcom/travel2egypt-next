'use client';

import type { JourneyKey } from '@/lib/journeys/registry';
import dynamic from 'next/dynamic';
import { useCallback, useEffect, useRef, useState } from 'react';

import { track } from '@/lib/analytics';
import { WHATSAPP_LINK, whatsappUrl } from '@/lib/concierge/constants';
import { LeadForm } from '@/components/leads/LeadForm';
import { useLead } from '@/components/leads/LeadProvider';
import type { LinkMapEntry } from '@/lib/linkMap/resolve';

/**
 * /plan-your-tour (owner spec "Planning page rebuild", 2026-11-08): three ways
 * to start — the itinerary form (default), WhatsApp, the AI concierge. The
 * choice lives in the URL hash (#form, #whatsapp, #concierge) so each can be
 * linked. The concierge bundle is fetched only the first time card 3 is
 * chosen (next/dynamic, client-only), never on the default view.
 */
const ChatContainer = dynamic(
  () => import('@/components/concierge/ChatContainer').then((m) => m.ChatContainer),
  { ssr: false, loading: () => <p className="plan-loading" aria-busy="true" /> },
);

type View = 'form' | 'whatsapp' | 'concierge';

export interface PlanCopy {
  optionsLabel: string;
  card1Title: string;
  card1Line: string;
  card2Title: string;
  card2Line: string;
  card3Title: string;
  card3Line: string;
  conciergeLangNote: string;
  thanksHeading: string;
  thanksUrgent: string;
  waText: string;
}

export function PlanOptions({
  locale,
  copy,
  tour,
  chat,
  journey,
}: {
  locale: 'en' | 'es' | 'ja';
  copy: PlanCopy;
  /** Resolved ?tour= product for the form (EN slug, localized title). */
  tour: { slug: string; title: string; durationDays: number | null } | null;
  /** ?journey= (key or EN page slug): "Interested in: {label}" + its style question. */
  journey?: JourneyKey | null;
  /** Concierge props, or null where it isn't offered (JA, or chat switched off). */
  chat: {
    locale: 'en' | 'es';
    tourSlug: string | null;
    tourTitle: string | null;
    resumeError: boolean;
    linkMap: LinkMapEntry[];
    /** ?q= from the floating concierge panel: pre-fills the chat input. */
    initialInput: string | null;
  } | null;
}) {
  const { responseTime } = useLead();
  const [view, setView] = useState<View>('form');
  const [chatMounted, setChatMounted] = useState(false);
  const conciergeOpened = useRef(false);
  const waHref = whatsappUrl(copy.waText);

  const show = useCallback(
    (next: View, opts: { push?: boolean } = {}) => {
      const v: View = next === 'concierge' && !chat ? 'form' : next;
      setView(v);
      if (v === 'concierge') {
        setChatMounted(true);
        if (!conciergeOpened.current) {
          conciergeOpened.current = true;
          track('concierge_open', { location: 'plan_page', ...(chat?.tourSlug ? { tour: chat.tourSlug } : {}) });
        }
      }
      // Let the mobile sticky bar re-check (it hides over the form / chat).
      setTimeout(() => window.dispatchEvent(new Event('t2e:plan-view')), 50);
      if (opts.push !== false) {
        // Keep ?tour= (and any UTMs); only the hash changes. No reload.
        const url = `${window.location.pathname}${window.location.search}#${v}`;
        window.history.replaceState(window.history.state, '', url);
      }
    },
    [chat],
  );

  // Initial view from the hash; one page-view event.
  useEffect(() => {
    const h = window.location.hash.replace('#', '');
    const initial: View = h === 'concierge' || h === 'whatsapp' || h === 'form' ? h : 'form';
    show(initial, { push: false });
    track('view_plan_page', { entry_tour: tour?.slug ?? '', default_view: 'form', locale });
    const onHash = () => {
      const x = window.location.hash.replace('#', '');
      if (x === 'concierge' || x === 'whatsapp' || x === 'form') show(x, { push: false });
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pick = (v: View) => {
    track('select_plan_option', { option: v, locale });
    show(v);
  };

  return (
    <section className="plan-start" aria-label={copy.optionsLabel}>
      <div className={chat ? 'plan-cards' : 'plan-cards plan-cards--two'} role="group" aria-label={copy.optionsLabel}>
        <button
          type="button"
          className={view === 'form' ? 'plan-card on' : 'plan-card'}
          aria-pressed={view === 'form'}
          aria-controls="plan-panel"
          onClick={() => pick('form')}
        >
          <span className="plan-card__title">{copy.card1Title}</span>
          <span className="plan-card__line">{copy.card1Line}</span>
        </button>
        <a
          className={view === 'whatsapp' ? 'plan-card on' : 'plan-card'}
          href={waHref}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => {
            track('select_plan_option', { option: 'whatsapp', locale });
            track('contact', { method: 'whatsapp', location: 'plan_page', ...(tour ? { tour: tour.slug } : {}) });
          }}
        >
          <span className="plan-card__title">{copy.card2Title}</span>
          <span className="plan-card__line">{copy.card2Line}</span>
        </a>
        {chat && (
          <button
            type="button"
            className={view === 'concierge' ? 'plan-card on' : 'plan-card'}
            aria-pressed={view === 'concierge'}
            aria-controls="plan-panel"
            onClick={() => pick('concierge')}
          >
            <span className="plan-card__title">{copy.card3Title}</span>
            <span className="plan-card__line">{copy.card3Line}</span>
          </button>
        )}
      </div>
      {!chat && copy.conciergeLangNote && <p className="plan-note">{copy.conciergeLangNote}</p>}

      <div id="plan-panel" className="plan-panel">
        {/* #whatsapp opened from a link: the same card, as a button (a new tab
            can't be opened without a click). */}
        {view === 'whatsapp' && (
          <div className="plan-wa">
            <a
              className="plan-wa__btn"
              href={waHref}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => track('contact', { method: 'whatsapp', location: 'plan_page' })}
            >
              WhatsApp +20 155 177 2258 →
            </a>
          </div>
        )}

        <span data-end-form hidden />
        <div id="plan-form" hidden={view === 'concierge'} className="plan-form">
          <LeadForm
            source="plan_page"
            locale={locale}
            tone="light"
            prefill={
              tour || journey
                ? {
                    kind: 'trip',
                    ...(tour ? { tourSlug: tour.slug, tourTitle: tour.title, durationDays: tour.durationDays } : {}),
                    ...(journey ? { journey } : {}),
                  }
                : undefined
            }
            renderDone={() => (
              <div className="plan-done" role="status">
                <p className="plan-done__title">{copy.thanksHeading}</p>
                <p>
                  {responseTime.full}
                  {locale === 'ja' ? '' : ' '}
                  {copy.thanksUrgent}
                </p>
                <a className="plan-wa__btn" href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer">
                  WhatsApp +20 155 177 2258
                </a>
              </div>
            )}
          />
        </div>

        {chat && chatMounted && (
          <div hidden={view !== 'concierge'} className="plan-chat">
            <ChatContainer
              locale={chat.locale}
              tourSlug={chat.tourSlug}
              tourTitle={chat.tourTitle}
              resumeError={chat.resumeError}
              linkMap={chat.linkMap}
              onSendDates={() => show('form')}
              initialInput={chat.initialInput}
            />
          </div>
        )}
      </div>
    </section>
  );
}
