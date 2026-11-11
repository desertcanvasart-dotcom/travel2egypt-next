import type { ReactNode } from 'react';

import { Price } from '@/components/Price';
import { JourneyImage } from '@/components/tour-system/JourneyImage';
import { LeadButton } from '@/components/leads/LeadProvider';
import type { LeadPrefill } from '@/components/leads/LeadForm';
import type { LeadSource } from '@/lib/leads/schema';
import type { JourneyKey } from '@/lib/journeys/registry';

import { HOME_COPY, type HomeLocale } from './copy';
import { TrackedLink } from './TrackedLink';
import type { SalesProduct } from './query';

/**
 * The homepage "Egypt tours" product card, shared with the packages hub
 * (2026-11-09) so both show the same card: image, badge, title, duration and
 * route line, from price, price-basis line, View tour and Customise. Styles
 * live in home-sales.css under `.lvl-sales`; a page that reuses the card wraps
 * it in an element with that class.
 *
 * The small-group hub (2026-11-10) uses the same card with its additions:
 * a badge and price basis of its own, extra lines under the price
 * (departures, group size), and a primary "Ask for dates" action that
 * replaces Customise and comes before View tour.
 */
export function TourCard({
  slug,
  p,
  locale,
  listName,
  source = 'tour_card',
  route,
  why,
  journey,
  anchorId,
  badge,
  basis,
  extra,
  primary,
  trackParams,
}: {
  /** EN slug — the config key for the card's badge and route copy. */
  slug: string;
  p: SalesProduct;
  locale: HomeLocale;
  /** GA4 item_list_name for select_item. */
  listName: string;
  source?: LeadSource;
  /** Route line when the slug has no homepage copy (journey cards). */
  route?: string | null;
  /** The owner-approved "why it suits" line (journey cards). */
  why?: string | null;
  /** Journey the card sits on: Customise opens with its style question. */
  journey?: JourneyKey;
  /** DOM id (journey days selector scrolls to and highlights the card). */
  anchorId?: string;
  /** Badge text when the slug has no homepage copy (small-group region). */
  badge?: string | null;
  /** Price-basis line override (small-group: "per person, shared"). */
  basis?: string;
  /** Lines under the price (small-group: next departures, group size). */
  extra?: ReactNode;
  /** A primary request button before View tour, replacing Customise. */
  primary?: {
    label: string;
    prefill: LeadPrefill;
    openEvent?: { name: 'form_open'; params: Record<string, string> };
  };
  /** Extra GA4 params on select_item (e.g. type: 'small_group'). */
  trackParams?: Record<string, string>;
}) {
  const c = HOME_COPY[locale];
  const card = c.tours.cards[slug];
  const href = `/${p.href}`;
  const badgeText = card?.badge ?? badge;
  const duration =
    p.type === 'dayTour' ? (p.durationHours ? c.hours(p.durationHours) : null) : p.durationDays ? c.days(p.durationDays) : null;
  return (
    <li className="pcard" id={anchorId} data-days={p.durationDays ?? undefined}>
      <TrackedLink href={href} listName={listName} itemId={slug} params={trackParams} className="pcard-img">
        <JourneyImage
          image={p.heroImage}
          alt={p.heroImage?.alt || p.title}
          className=""
          sizes="(max-width:620px) 85vw, (max-width:980px) 45vw, 380px"
          widthHint={760}
          ratio={3 / 2}
        />
        {badgeText && <span className="badge">{badgeText}</span>}
      </TrackedLink>
      <div className="pcard-body">
        <h3>
          <TrackedLink href={href} listName={listName} itemId={slug} params={trackParams}>
            {p.title}
          </TrackedLink>
        </h3>
        <p className="route">
          {duration && <span className="dur">{duration}</span>} {card?.route ?? route}
        </p>
        {why && <p className="why">{why}</p>}
        {p.priceFrom ? (
          <p className="price">
            <span className="price-from">{c.from(<Price eur={p.priceFrom} />)}</span>
            <span className="price-basis">
              {basis ?? c.tours.basis}
              {p.guidePriced && c.guideNote ? `${locale === 'ja' ? '・' : ', '}${c.guideNote}` : ''}
            </span>
          </p>
        ) : (
          <p className="price">
            <span className="price-basis">{c.priceOnRequest}</span>
          </p>
        )}
        {extra}
        {primary ? (
          <div className="pcard-actions">
            <LeadButton
              source={source}
              prefill={primary.prefill}
              itemListName={listName}
              itemParams={trackParams}
              openEvent={primary.openEvent}
              className="btn-outline btn-solid"
            >
              {primary.label}
            </LeadButton>
            <TrackedLink href={href} listName={listName} itemId={slug} params={trackParams} className="link">
              {c.tours.view}
            </TrackedLink>
          </div>
        ) : (
          <div className="pcard-actions">
            <TrackedLink href={href} listName={listName} itemId={slug} className="link">
              {c.tours.view}
            </TrackedLink>
            <LeadButton
              source={source}
              prefill={{ kind: 'trip', tourSlug: slug, tourTitle: p.title, durationDays: p.durationDays, journey }}
              itemListName={listName}
              className="btn-outline"
            >
              {c.tours.customise}
            </LeadButton>
          </div>
        )}
      </div>
    </li>
  );
}
