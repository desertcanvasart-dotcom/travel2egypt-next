import type { ReactNode } from 'react';

import { Price } from '@/components/Price';
import { JourneyImage } from '@/components/tour-system/JourneyImage';
import { LeadButton } from '@/components/leads/LeadProvider';
import type { LeadSource } from '@/lib/leads/schema';

import { TrackedLink } from './TrackedLink';

/**
 * The homepage day-tour card, shared with the day-tour hubs (2026-11-09):
 * image, label line, optional city, title (links to the product), optional
 * one-line description, "from {price} per person" (or "Price on request"),
 * optional inclusions, and Check this date (the day-tour dialog, pre-filled,
 * with the estimate line). Styles: `.lvl-sales .dcard` in home-sales.css.
 */
export interface DayTourCardProduct {
  /** EN slug (stable id for analytics and the lead). */
  slug: string;
  /** This language's slug, for links. */
  href: string;
  title: string;
  priceFrom?: number | null;
  heroImage?: { asset?: unknown; alt?: string } | null;
}

export function DayTourCard({
  p,
  meta,
  city,
  summary,
  included,
  listName,
  source,
  checkLabel,
  fromPerPerson,
  priceOnRequest,
  hub,
  displayTitle,
  guideNote,
}: {
  p: DayTourCardProduct;
  /** Shorter card title (homepage labels); the lead keeps the full title. */
  displayTitle?: string;
  /** Label line, e.g. "Private · 9 hours". */
  meta: string;
  city?: string;
  summary?: string | null;
  included?: string[] | null;
  /** GA4 item_list_name for select_item. */
  listName: string;
  source: LeadSource;
  checkLabel: string;
  fromPerPerson: (price: ReactNode) => ReactNode;
  priceOnRequest: string;
  /** Hub slug, when the card sits on a day-tour hub (analytics + lead). */
  hub?: string;
  /** ES/JA: shown under the price when it includes the guide-language supplement. */
  guideNote?: string | null;
}) {
  const href = `/${p.href}`;
  const shown = displayTitle ?? p.title;
  return (
    <li className="dcard">
      <TrackedLink href={href} listName={listName} itemId={p.slug} className="dcard-img">
        <JourneyImage
          image={p.heroImage}
          alt={p.heroImage?.alt || shown}
          className=""
          sizes="(max-width:980px) 90vw, 380px"
          widthHint={700}
          ratio={16 / 10}
        />
      </TrackedLink>
      <div className="dcard-body">
        <p className="meta">{meta}</p>
        {city && <p className="dcard-city">{city}</p>}
        <h3>
          <TrackedLink href={href} listName={listName} itemId={p.slug}>
            {shown}
          </TrackedLink>
        </h3>
        {summary && <p className="dcard-desc">{summary}</p>}
        <p className="price">
          {p.priceFrom ? (
            <>
              <span className="price-from">{fromPerPerson(<Price eur={p.priceFrom} />)}</span>
              {guideNote && <span className="price-basis">{guideNote}</span>}
            </>
          ) : (
            <span className="price-basis">{priceOnRequest}</span>
          )}
        </p>
        {included && included.length > 0 && (
          <ul className="incl">
            {included.slice(0, 3).map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
        )}
        <LeadButton
          source={source}
          prefill={{ kind: 'day_tour', tourSlug: p.slug, tourTitle: p.title, priceFromEur: p.priceFrom, ...(hub ? { hub } : {}) }}
          itemListName={listName}
          openEvent={hub ? { name: 'form_open', params: { location: 'hub_card', hub } } : undefined}
          className="btn-outline"
        >
          {checkLabel}
        </LeadButton>
      </div>
    </li>
  );
}
