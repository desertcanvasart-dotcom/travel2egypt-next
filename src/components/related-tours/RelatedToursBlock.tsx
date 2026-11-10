import { Link } from '@/i18n/navigation';
import { Price } from '@/components/Price';
import { JourneyImage } from '@/components/tour-system/JourneyImage';
import type { ArticleTour } from '@/lib/articleTours';
import { whatsappUrl } from '@/lib/concierge/constants';

import { TourRequestButton, TourViewLink } from './RelatedTourActions';
import '@/styles/related-tours.css';

/**
 * Priced tour cards inside articles and guides (fix round 3, Task C).
 * variant="inline" → compact horizontal row inside the body;
 * variant="end"    → full-width section before the footer, followed by the
 *                    one-line concierge link (which replaces the large
 *                    concierge section on these pages).
 * Renders nothing for fewer than one product (callers enforce ≥ 2 for the
 * automatic end block).
 */

const COPY = {
  en: {
    private: 'Private day tour', group: 'Small-group day tour', multi: 'Multi-day tour',
    hours: (n: number) => `${n} hours`, days: (n: number) => `${n} days`,
    from: 'from', perPerson: 'per person', basis: 'per person, 2 sharing, 4★/5★ hotels',
    check: 'Check this date', customise: 'Customise', view: 'View tour',
    concierge: 'Not sure yet? Get advice from our Egypt travel specialists →',
  },
  es: {
    private: 'Tour privado de un día', group: 'Tour de un día en grupo reducido', multi: 'Viaje de varios días',
    hours: (n: number) => `${n} horas`, days: (n: number) => `${n} días`,
    from: 'desde', perPerson: 'por persona', basis: 'por persona, en habitación doble, hoteles de 4★/5★',
    check: 'Consultar esta fecha', customise: 'Personalizar', view: 'Ver viaje',
    concierge: '¿Aún no lo tienes claro? Pide consejo a nuestros especialistas en Egipto →',
  },
  ja: {
    private: 'プライベート日帰りツアー', group: '少人数グループ日帰りツアー', multi: '周遊ツアー',
    hours: (n: number) => `${n}時間`, days: (n: number) => `${n}日間`,
    from: '', perPerson: '1名様あたり', basis: '2名1室利用時の1名様料金・4つ星／5つ星ホテル',
    check: 'この日付で確認', customise: 'カスタマイズ', view: '詳細を見る',
    // Japanese pages carry no concierge links (house rule): WhatsApp instead.
    concierge: 'まだ迷っていますか？WhatsAppで相談する →',
    whatsappText: 'こんにちは。エジプト旅行の計画について相談したいです。',
  },
} as const;

export function RelatedToursBlock({
  heading,
  products,
  variant,
  locale,
  articleSlug,
}: {
  heading: string;
  products: ArticleTour[];
  variant: 'inline' | 'end';
  locale: string;
  articleSlug: string;
}) {
  // Drop unresolved references / unpriced entries defensively.
  products = (products ?? []).filter((p): p is ArticleTour => Boolean(p && p.slug && p.priceFrom));
  if (!products.length) return null;
  const t = COPY[(locale in COPY ? locale : 'en') as keyof typeof COPY];
  const listName = variant === 'inline' ? 'article_inline' : 'article_end';

  const cards = (
    <ul className={`rt-cards rt-cards--${variant}`}>
      {products.map((p) => {
        const isDay = p.type === 'dayTour';
        const typeLabel = isDay ? (p.tourMode === 'group' ? t.group : t.private) : t.multi;
        const duration = isDay ? (p.durationHours ? t.hours(p.durationHours) : null) : p.durationDays ? t.days(p.durationDays) : null;
        return (
          <li className="rt-card" key={p._id}>
            <TourViewLink listName={listName} articleSlug={articleSlug} tourSlug={p.slug} className="rt-img">
              <JourneyImage
                image={p.heroImage}
                alt={p.heroImage?.alt || p.title}
                className=""
                sizes={variant === 'inline' ? '(max-width:700px) 80vw, 260px' : '(max-width:700px) 85vw, 380px'}
                widthHint={variant === 'inline' ? 520 : 760}
                ratio={3 / 2}
              />
            </TourViewLink>
            <div className="rt-body">
              <p className="rt-meta">{[typeLabel, duration].filter(Boolean).join(' · ')}</p>
              <h3 className="rt-title">
                <TourViewLink listName={listName} articleSlug={articleSlug} tourSlug={p.slug}>
                  {p.title}
                </TourViewLink>
              </h3>
              {p.priceFrom ? (
                <p className="rt-price">
                  <span className="rt-from">
                    {t.from && `${t.from} `}
                    <Price eur={p.priceFrom} />
                    {locale === 'ja' ? '〜' : ''}
                  </span>
                  <span className="rt-basis">{isDay ? t.perPerson : t.basis}</span>
                </p>
              ) : null}
              <div className="rt-actions">
                <TourRequestButton
                  listName={listName}
                  articleSlug={articleSlug}
                  tourSlug={p.slug}
                  tourTitle={p.title}
                  type={p.type}
                  durationDays={p.durationDays}
                  priceFromEur={p.priceFrom}
                  label={isDay ? t.check : t.customise}
                  className="rt-btn"
                />
                <TourViewLink listName={listName} articleSlug={articleSlug} tourSlug={p.slug} className="rt-view">
                  {t.view}
                </TourViewLink>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );

  if (variant === 'inline') {
    return (
      <aside className="rt-block rt-block--inline not-prose" aria-label={heading}>
        <p className="rt-heading">{heading}</p>
        {cards}
      </aside>
    );
  }
  return (
    <section className="rt-block rt-block--end" aria-labelledby={`rt-end-${articleSlug}`}>
      <div className="rt-wrap">
        <h2 id={`rt-end-${articleSlug}`} className="rt-heading">
          {heading}
        </h2>
        {cards}
        <p className="rt-concierge">
          {'whatsappText' in t ? (
            <a href={whatsappUrl(t.whatsappText)} target="_blank" rel="noopener noreferrer">
              {t.concierge}
            </a>
          ) : (
            <Link href="/plan-your-tour">{t.concierge}</Link>
          )}
        </p>
      </div>
    </section>
  );
}
