import { getTranslations } from 'next-intl/server';

import type { Locale } from '@/i18n/routing';
import { Price } from '@/components/Price';
import { getAccreditations, licenceShort } from '@/lib/accreditations';
import { TRIPADVISOR_RATING, TRIPADVISOR_REVIEW_COUNT } from '@/lib/company';
import { routeModeLabel, type RouteLegRow } from '@/lib/products/routeLabels';
import { HOME_COPY, homeLocale } from '../home-sales/copy';

import { ProductLeadButton, ProductWhatsApp } from './ProductActions';
import { StickyCardShell } from './StickyCardShell';

/**
 * Product page right column (owner spec, 2026-11-11), desktop only (≥1024px),
 * under the decision panel:
 *   2. "Your route" (multi-day) — approved route legs only, every leg approved
 *   3. "Make it your own" — approved customisation options only (1–4)
 *   4. the compact sticky card — appears once 1–3 have scrolled away
 * Blocks 2 and 3 render nothing without approved data; nothing is invented.
 */

/** §2 — a restrained vertical route: stops in the serif, legs in small UI type. */
export async function YourRoute({ locale, legs }: { locale: Locale; legs: RouteLegRow[] }) {
  if (!legs.length) return null;
  const t = await getTranslations({ locale, namespace: 'productPanel' });
  // ' · ' in every language: JA names already contain '・' (コム・オンボ).
  const sep = ' · ';
  // Stop groups in order; a cruise's named stops (via) form one line.
  const items: Array<{ stop: string; leg: string | null }> = [{ stop: legs[0].from, leg: null }];
  for (const g of legs) {
    items[items.length - 1].leg = routeModeLabel(g.mode, g.nights, locale);
    if (g.via && g.via.length) items.push({ stop: g.via.join(sep), leg: '' });
    items.push({ stop: g.to, leg: null });
  }
  return (
    <section className="pdp-rc pdp-route" aria-labelledby="pdp-route-h">
      <h2 id="pdp-route-h" className="pdp-rc__h">{t('routeTitle')}</h2>
      <ol className="pdp-route__list">
        {items.map((it, i) => (
          <li key={i} className="pdp-route__stop">
            <span className="pdp-route__name">{it.stop}</span>
            {it.leg !== null && (
              <span className="pdp-route__leg">
                <span className="pdp-route__line" aria-hidden="true" />
                {it.leg && <span className="pdp-route__mode">{it.leg}</span>}
              </span>
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}

/** §3 — 1–4 approved options and "Ask about changes →" (opens the Customise dialog). */
export async function MakeItYourOwn({
  locale,
  options,
  kind,
  slug,
  title,
  durationDays,
  fromEur,
}: {
  locale: Locale;
  options: string[];
  kind: 'multi' | 'day';
  slug: string;
  title: string;
  durationDays: number | null;
  fromEur: number | null;
}) {
  const opts = options.filter(Boolean).slice(0, 4);
  if (!opts.length) return null;
  const t = await getTranslations({ locale, namespace: 'productPanel' });
  const prefill =
    kind === 'multi'
      ? { kind: 'trip' as const, tourSlug: slug, tourTitle: title, durationDays }
      : { kind: 'day_tour' as const, tourSlug: slug, tourTitle: title, priceFromEur: fromEur };
  return (
    <section className="pdp-rc pdp-own" aria-labelledby="pdp-own-h">
      <h2 id="pdp-own-h" className="pdp-rc__h">{t('optionsTitle')}</h2>
      <ul className="pdp-own__list">
        {opts.map((o, i) => (
          <li key={i}>{o}</li>
        ))}
      </ul>
      <ProductLeadButton location="product_options" prefill={prefill} className="pdp-own__ask">
        {t('askChanges')} <span aria-hidden="true">→</span>
      </ProductLeadButton>
    </section>
  );
}

/** §4 — the compact sticky card. Same primary action as the panel. */
export async function CompactStickyCard({
  locale,
  kind,
  slug,
  title,
  waHref,
  fromEur,
  durationDays,
}: {
  locale: Locale;
  kind: 'multi' | 'day';
  slug: string;
  title: string;
  waHref: string;
  fromEur: number | null;
  durationDays: number | null;
}) {
  const t = await getTranslations({ locale, namespace: 'productPanel' });
  const L = homeLocale(locale);
  const licence = licenceShort(await getAccreditations(), locale);
  const trust = [HOME_COPY[L].hero.tripadvisor(TRIPADVISOR_RATING, TRIPADVISOR_REVIEW_COUNT), licence].filter(Boolean).join(' · ');
  const prefill =
    kind === 'multi'
      ? { kind: 'trip' as const, tourSlug: slug, tourTitle: title, durationDays }
      : { kind: 'day_tour' as const, tourSlug: slug, tourTitle: title, priceFromEur: fromEur };
  return (
    <StickyCardShell label={t('stickyLabel')}>
      <p className="pdp-sticky__title">{title}</p>
      <p className="pdp-sticky__price">
        {fromEur ? (
          <>
            <span className="pdp-sticky__from">{t('from')}</span>{' '}
            <strong>
              <Price eur={fromEur} />
            </strong>{' '}
            <small>{kind === 'multi' ? t('basisPerPerson') : t('basisDay')}</small>
          </>
        ) : (
          <span>{t('priceOnRequest')}</span>
        )}
      </p>
      <ProductLeadButton location="product_sticky_card" prefill={prefill} className="pdp-btn pdp-btn--primary">
        {kind === 'multi' ? t('ctaCustomise') : t('ctaCheckDate')}
      </ProductLeadButton>
      <ProductWhatsApp href={waHref} location="product_sticky_card" tourSlug={slug} className="pdp-link pdp-sticky__wa">
        {t('ctaWhatsApp')} →
      </ProductWhatsApp>
      {trust && (
        <p className="pdp-sticky__trust">
          <span aria-hidden="true">★ </span>
          {trust}
        </p>
      )}
    </StickyCardShell>
  );
}
