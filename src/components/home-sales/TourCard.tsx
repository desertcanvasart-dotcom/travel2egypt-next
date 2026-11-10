import { Price } from '@/components/Price';
import { JourneyImage } from '@/components/tour-system/JourneyImage';
import { LeadButton } from '@/components/leads/LeadProvider';
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
}) {
  const c = HOME_COPY[locale];
  const card = c.tours.cards[slug];
  const href = `/${p.href}`;
  const duration =
    p.type === 'dayTour' ? (p.durationHours ? c.hours(p.durationHours) : null) : p.durationDays ? c.days(p.durationDays) : null;
  return (
    <li className="pcard" id={anchorId} data-days={p.durationDays ?? undefined}>
      <TrackedLink href={href} listName={listName} itemId={slug} className="pcard-img">
        <JourneyImage
          image={p.heroImage}
          alt={p.heroImage?.alt || p.title}
          className=""
          sizes="(max-width:620px) 85vw, (max-width:980px) 45vw, 380px"
          widthHint={760}
          ratio={3 / 2}
        />
        {card?.badge && <span className="badge">{card.badge}</span>}
      </TrackedLink>
      <div className="pcard-body">
        <h3>
          <TrackedLink href={href} listName={listName} itemId={slug}>
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
            <span className="price-basis">{c.tours.basis}</span>
          </p>
        ) : (
          <p className="price">
            <span className="price-basis">{c.priceOnRequest}</span>
          </p>
        )}
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
      </div>
    </li>
  );
}
