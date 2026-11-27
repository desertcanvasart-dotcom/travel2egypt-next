import type { ReactNode } from 'react';
import { getTranslations } from 'next-intl/server';

import type { Locale } from '@/i18n/routing';
import { client } from '@/sanity/lib/client';
import { siteSettingsQuery } from '@/sanity/lib/queries';
import { isChatEnabled } from '@/lib/concierge/chatEnabled';
import { Price } from '@/components/Price';
import { Link } from '@/i18n/navigation';
import { journeysForProduct } from '@/lib/journeys/data';
import { JOURNEYS, JOURNEY_UI, journeyLocale } from '@/lib/journeys/registry';
import { CurrencyNote } from '@/components/CurrencyNote';

import {
  ProductConciergeLink,
  ProductLeadButton,
  ProductSawaLink,
  ProductWhatsApp,
} from './ProductActions';
import '@/styles/product-page.css';

/**
 * Product page template (owner spec, 2026-11-09): a decision panel directly
 * under the H1 + dek (sticky right column from 1024px), the review-gated
 * Included block, and the end block. Rows render only
 * when Sanity holds the data — no fact is ever filled in or guessed here.
 */

export interface PanelFact {
  label: string;
  value: ReactNode;
}

interface Common {
  locale: Locale;
  slug: string;
  title: string;
  waHref: string;
  /** ES/JA price includes the guide-language supplement (PR #167). */
  guidePriced?: boolean | null;
  /** Group tours booked on Sawa (27 Nov 2026): the booking button links there instead of the form. */
  sawaUrl?: string | null;
}

/** "Includes a Spanish-/Japanese-speaking guide" — only when the price does. */
function GuideNote({ on, note }: { on?: boolean | null; note: string }) {
  return on && note ? <p className="price-note price-note--guide">{note}</p> : null;
}

async function responseShort(locale: Locale): Promise<string> {
  const s = await client.fetch<{ responseTimeShort?: string | null } | null>(siteSettingsQuery(locale));
  return s?.responseTimeShort ?? '';
}

/** The concierge is offered only where it exists: EN/ES with the chat on. */
export function conciergeAvailable(locale: Locale): boolean {
  return isChatEnabled() && (locale === 'en' || locale === 'es');
}

function Facts({ facts, className = '' }: { facts: PanelFact[]; className?: string }) {
  const rows = facts.filter((f) => f.value !== null && f.value !== undefined && f.value !== '');
  if (rows.length === 0) return null;
  return (
    <dl className={`pdp-facts ${className}`.trim()}>
      {rows.map((f) => (
        <div key={f.label}>
          <dt>{f.label}</dt>
          <dd>{f.value}</dd>
        </div>
      ))}
    </dl>
  );
}

function FromRow({ fromEur, basis, onRequest, note, sep = ' · ' }: { fromEur: number | null; basis: string; onRequest: string; note?: string; sep?: string }) {
  return fromEur ? (
    <span className="pdp-from">
      <strong>
        <Price eur={fromEur} />
      </strong>
      <small>{note ? `${basis}${sep}${note}` : basis}</small>
    </span>
  ) : (
    <span className="pdp-from pdp-from--req">{onRequest}</span>
  );
}

/** §1 — multi-day tours and packages. */
export async function MultiDayPanel({
  locale,
  slug,
  title,
  waHref,
  facts,
  fromEur,
  durationDays,
  tiers,
  extra,
  enSlug,
  guidePriced,
  heroed = false,
  notes,
}: Common & {
  facts: PanelFact[];
  fromEur: number | null;
  durationDays: number | null;
  tiers?: Array<{ name?: string; sub?: string; price?: number; unit?: string }>;
  /** e.g. the group package's next-departure card. */
  extra?: ReactNode;
  /** EN slug — for the journey "Part of" line (Phase A §7.5). */
  enSlug?: string;
  /** Packages, 2026-11-15: Type, Duration, From and the CTAs live in the
   *  hero (DayHeroFacts variant="multi"); the panel keeps the rest (route,
   *  nights, character, group facts, tiers, supplement, departures). */
  heroed?: boolean;
  /** Extra rows under the tiers (single supplement, price note). */
  notes?: ReactNode;
}) {
  const t = await getTranslations({ locale, namespace: 'productPanel' });
  const ts = await getTranslations({ locale, namespace: 'tourSystem' });
  const rt = await responseShort(locale);
  const prefill = { kind: 'trip' as const, tourSlug: slug, tourTitle: title, durationDays };
  if (heroed) {
    const rows = facts.filter((f) => f.value !== null && f.value !== undefined && f.value !== '');
    const tierRows = (tiers ?? []).filter((x) => x.name || typeof x.price === 'number');
    if (rows.length === 0 && tierRows.length === 0 && !extra && !notes) {
      return <PartOfJourneys enSlug={enSlug} locale={locale} />;
    }
    return (
      <aside id="pdp-panel" className="pdp-panel pdp-panel--rest" aria-label={t('panelLabel')}>
        <Facts facts={rows} className="pdp-facts--details" />
        <PartOfJourneys enSlug={enSlug} locale={locale} />
        {tierRows.length > 0 && (
          <ul className="pdp-tiers">
            {tierRows.map((tier, i) => (
              <li key={i}>
                <span>
                  {tier.name}
                  {tier.sub && <small>{tier.sub}</small>}
                </span>
                <span>
                  <Price eur={tier.price} />
                  {tier.unit && <small> {tier.unit}</small>}
                </span>
              </li>
            ))}
          </ul>
        )}
        {notes}
        {extra && <div className="pdp-extra">{extra}</div>}
      </aside>
    );
  }
  return (
    <aside id="pdp-panel" className="pdp-panel" aria-label={t('panelLabel')}>
      <Facts facts={facts} className="pdp-facts--details" />
      <PartOfJourneys enSlug={enSlug} locale={locale} />
      <div className="pdp-price">
      <Facts facts={[{ label: t('from'), value: <FromRow fromEur={fromEur} basis={t('basisPerPerson')} onRequest={t('priceOnRequest')} /> }]} />
      {tiers && tiers.length > 0 && (
        <ul className="pdp-tiers">
          {tiers.map((tier, i) => (
            <li key={i}>
              <span>
                {tier.name}
                {tier.sub && <small>{tier.sub}</small>}
              </span>
              <span>
                <Price eur={tier.price} />
                {tier.unit && <small> {tier.unit}</small>}
              </span>
            </li>
          ))}
        </ul>
      )}
      <GuideNote on={guidePriced && !!fromEur} note={ts('guidePriceNote')} />
      {fromEur ? <CurrencyNote note={ts('priceCurrencyNote')} /> : null}
      </div>
      {extra && <div className="pdp-extra">{extra}</div>}
      <div className="pdp-actions">
        <ProductLeadButton location="product_panel" prefill={prefill} className="pdp-btn pdp-btn--primary">
          {t('ctaCustomise')}
        </ProductLeadButton>
        <ProductWhatsApp href={waHref} location="product_panel" tourSlug={slug} className="pdp-btn pdp-btn--ghost">
          {t('ctaWhatsApp')}
        </ProductWhatsApp>
        {conciergeAvailable(locale) && (
          <ProductConciergeLink tourSlug={slug} className="pdp-link">
            {t('ctaConcierge')}
          </ProductConciergeLink>
        )}
      </div>
      {rt && <p className="pdp-rt">{rt}</p>}
    </aside>
  );
}

/**
 * Day tours, hero facts (owner decision 2026-11-15, tour-page Phase 1): the
 * decision panel's Type, Duration, From-price and CTAs moved into the hero,
 * right of the italic intro, without a card (small-caps labels, hairline
 * dividers). The CTA opens the existing pop-up form (form_open, location
 * product_hero). Below 1024px one compact line + a full-width button.
 */
export async function DayHeroFacts({
  locale,
  slug,
  title,
  waHref,
  facts,
  fromEur,
  guidePriced,
  mobileLine,
  variant = 'day',
  durationDays = null,
  fromNote,
  basis,
  afterFrom = [],
  sawaUrl = null,
}: Common & {
  facts: PanelFact[];
  /** Day-tour format: shown after the per-person basis (e.g. "price depends on group size"). */
  fromNote?: string;
  /** Overrides the basis after the price (per-car products: "per car, each way"). */
  basis?: string;
  /** Day-tour format: rows under From (children, pickup, back, lunch, guide language). */
  afterFrom?: PanelFact[];
  fromEur: number | null;
  /** e.g. "Full day · Private" for the compact phone line. */
  mobileLine: string;
  /** 'multi' = packages (2026-11-15): per-person basis, "Customise this
   *  trip" CTA and the trip prefill, same layout as the day tours. */
  variant?: 'day' | 'multi';
  durationDays?: number | null;
}) {
  const t = await getTranslations({ locale, namespace: 'productPanel' });
  const ts = await getTranslations({ locale, namespace: 'tourSystem' });
  const rt = await responseShort(locale);
  const multi = variant === 'multi';
  const prefill = multi
    ? { kind: 'trip' as const, tourSlug: slug, tourTitle: title, durationDays }
    : { kind: 'day_tour' as const, tourSlug: slug, tourTitle: title, priceFromEur: fromEur };
  return (
    <div className="pdp-hf" aria-label={t('panelLabel')}>
      <Facts
        facts={[
          ...facts,
          { label: t('from'), value: <FromRow fromEur={fromEur} basis={basis ?? (multi ? t('basisPerPerson') : t('basisDay'))} onRequest={t('priceOnRequest')} note={fromNote} sep={locale === 'ja' ? '・' : ' · '} /> },
          ...afterFrom,
        ]}
        className="pdp-facts--hero"
      />
      <p className="pdp-hf__line">
        {mobileLine}
        {fromEur ? (
          <>
            {mobileLine ? (locale === 'ja' ? '・' : ' · ') : ''}
            {t('from')} <strong><Price eur={fromEur} /></strong>
          </>
        ) : null}
      </p>
      <GuideNote on={guidePriced && !!fromEur} note={ts('guidePriceNote')} />
      {fromEur ? <div className="pdp-ccy"><CurrencyNote note={ts('priceCurrencyNote')} /></div> : null}
      <div className="pdp-actions pdp-hf__actions">
        {sawaUrl ? (
          <ProductSawaLink url={sawaUrl} location="product_hero" tourSlug={slug} locale={locale} className="pdp-btn pdp-btn--primary">
            {t('ctaSawa')} <span aria-hidden="true">↗</span>
          </ProductSawaLink>
        ) : (
          <ProductLeadButton location="product_hero" prefill={prefill} className="pdp-btn pdp-btn--primary">
            {multi ? t('ctaCustomise') : t('ctaCheckDate')}
          </ProductLeadButton>
        )}
        <ProductWhatsApp href={waHref} location="product_hero" tourSlug={slug} className="pdp-link">
          {t('ctaWhatsApp')} →
        </ProductWhatsApp>
        {conciergeAvailable(locale) && (
          <ProductConciergeLink tourSlug={slug} className="pdp-link">
            {t('ctaConcierge')}
          </ProductConciergeLink>
        )}
      </div>
      {sawaUrl ? (
        <>
          <p className="pdp-rt pdp-sawa-note">{t('sawaNote')}</p>
          <p className="pdp-rt pdp-sawa-note">{t('sawaGuide')}</p>
        </>
      ) : (
        rt && <p className="pdp-rt">{rt}</p>
      )}
    </div>
  );
}

/**
 * Day tours, right-column panel. Type, Duration, From-price and the CTAs now
 * live in the hero (DayHeroFacts), so the panel keeps only what is not shown
 * there: "Starts from" and the price tiers. Renders nothing when both are empty.
 */
export async function DayTourPanel({
  locale,
  facts,
  tiers,
}: {
  locale: Locale;
  facts: PanelFact[];
  tiers?: Array<{ name?: string; sub?: string; price?: number; unit?: string }>;
}) {
  const t = await getTranslations({ locale, namespace: 'productPanel' });
  const rows = facts.filter((f) => f.value !== null && f.value !== undefined && f.value !== '');
  const tierRows = (tiers ?? []).filter((x) => x.name || x.price);
  if (rows.length === 0 && tierRows.length === 0) return null;
  return (
    <aside id="pdp-panel" className="pdp-panel pdp-panel--day" aria-label={t('panelLabel')}>
      <Facts facts={rows} className="pdp-facts--details" />
      {tierRows.length > 0 && (
        <ul className="pdp-tiers">
          {tierRows.map((tier, i) => (
            <li key={i}>
              <span>
                {tier.name}
                {tier.sub && <small>{tier.sub}</small>}
              </span>
              <span>
                <Price eur={tier.price} />
                {tier.unit && <small> {tier.unit}</small>}
              </span>
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
}

/**
 * §3 — Included / Not included (layout before the multi-day itinerary format;
 * "Itinerary at a glance" was removed 2026-11-16). Inputs are already filtered
 * to owner-approved items (query).
 */
export async function ProductFactsBlock({
  locale,
  included,
  excluded,
}: {
  locale: Locale;
  included: string[];
  excluded: string[];
}) {
  const t = await getTranslations({ locale, namespace: 'productPanel' });
  if (included.length === 0 && excluded.length === 0) return null;
  return (
    <section className="pdp-factsblock">
      <div className="pdp-incl">
        {included.length > 0 && (
          <div>
            <h2>{t('included')}</h2>
            <ul className="yes">
              {included.map((x, i) => (
                <li key={i}>{x}</li>
              ))}
            </ul>
          </div>
        )}
        {excluded.length > 0 && (
          <div>
            <h2>{t('notIncluded')}</h2>
            <ul className="no">
              {excluded.map((x, i) => (
                <li key={i}>{x}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}

/** §5 — the button pair after the narrative. */
export async function MidCta({ locale, kind, slug, title, waHref, durationDays, fromEur, sawaUrl = null }: Common & { kind: 'multi' | 'day'; durationDays: number | null; fromEur: number | null }) {
  const t = await getTranslations({ locale, namespace: 'productPanel' });
  const prefill =
    kind === 'multi'
      ? { kind: 'trip' as const, tourSlug: slug, tourTitle: title, durationDays }
      : { kind: 'day_tour' as const, tourSlug: slug, tourTitle: title, priceFromEur: fromEur };
  return (
    <p className="pdp-mid">
      {sawaUrl ? (
        <ProductSawaLink url={sawaUrl} location="product_mid" tourSlug={slug} locale={locale} className="pdp-btn pdp-btn--primary">
          {t('ctaSawa')} <span aria-hidden="true">↗</span>
        </ProductSawaLink>
      ) : (
        <ProductLeadButton location="product_mid" prefill={prefill} className="pdp-btn pdp-btn--primary">
          {kind === 'multi' ? t('ctaCustomise') : t('ctaCheckDate')}
        </ProductLeadButton>
      )}
      <ProductWhatsApp href={waHref} location="product_mid" tourSlug={slug} className="pdp-link">
        {t('quickWhatsapp')}
      </ProductWhatsApp>
    </p>
  );
}

/** §5 — the end block (replaces "Talk to us about this journey/day."). */
export async function EndBlock({ locale, kind, slug, title, waHref, durationDays, fromEur, sawaUrl = null }: Common & { kind: 'multi' | 'day'; durationDays: number | null; fromEur: number | null }) {
  const t = await getTranslations({ locale, namespace: 'productPanel' });
  const ts = await getTranslations({ locale, namespace: 'tourSystem' });
  const s = await client.fetch<{ responseTimeFull?: string | null } | null>(siteSettingsQuery(locale));
  const prefill =
    kind === 'multi'
      ? { kind: 'trip' as const, tourSlug: slug, tourTitle: title, durationDays }
      : { kind: 'day_tour' as const, tourSlug: slug, tourTitle: title, priceFromEur: fromEur };
  const sep = locale === 'ja' ? '' : ' ';
  return (
    // data-end-form: the page already ends with this itinerary CTA, so the footer action band hides.
    <section className="concierge-cta" data-end-form="">
      <div className="t2e-wrap">
        <div className="cta-inner">
          <span className="t2e-kicker">{ts('ctaKicker')}</span>
          <h2>{sawaUrl ? t('endSawaH2') : kind === 'multi' ? t('endMultiH2') : t('endDayH2')}</h2>
          <p>
            {sawaUrl ? t('endSawaBody') : kind === 'multi' ? t('endMultiBody') : t('endDayBody')}
            {!sawaUrl && s?.responseTimeFull ? `${sep}${s.responseTimeFull}` : ''}
          </p>
          <div className="cta-buttons">
            {sawaUrl ? (
              <ProductSawaLink url={sawaUrl} location="product_end" tourSlug={slug} locale={locale} className="cta-btn cta-btn--primary">
                {t('ctaSawa')} <span className="cta-arrow" aria-hidden>↗</span>
              </ProductSawaLink>
            ) : (
              <ProductLeadButton location="product_end" prefill={prefill} className="cta-btn cta-btn--primary">
                {kind === 'multi' ? t('ctaCustomise') : t('ctaCheckDate')} <span className="cta-arrow" aria-hidden>→</span>
              </ProductLeadButton>
            )}
            <ProductWhatsApp href={waHref} location="product_end" tourSlug={slug} className="cta-btn cta-btn--ghost">
              {t('ctaWhatsApp')} <span className="cta-arrow" aria-hidden>→</span>
            </ProductWhatsApp>
          </div>
          {conciergeAvailable(locale) && (
            <p className="pdp-end-concierge">
              <ProductConciergeLink tourSlug={slug}>{t('stillExploring')}</ProductConciergeLink>
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

/**
 * "Part of: {journey label} →" — shown when this product is an APPROVED pick
 * on a journey page (journey pages Phase A §7.5).
 */
function PartOfJourneys({ enSlug, locale }: { enSlug?: string; locale: Locale }) {
  if (!enSlug) return null;
  const keys = journeysForProduct(enSlug);
  if (!keys.length) return null;
  const L = journeyLocale(locale);
  return (
    <p className="pdp-partof">
      {JOURNEY_UI[L].partOf}
      {L === 'ja' ? '' : ' '}
      {keys.map((k, i) => (
        <span key={k}>
          {i > 0 && ' · '}
          <Link href={JOURNEYS[k].path as never}>{JOURNEYS[k].label[L]} →</Link>
        </span>
      ))}
    </p>
  );
}
