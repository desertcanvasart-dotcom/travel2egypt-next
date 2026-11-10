import type { ReactNode } from 'react';
import { getTranslations } from 'next-intl/server';

import type { Locale } from '@/i18n/routing';
import { client } from '@/sanity/lib/client';
import { siteSettingsQuery } from '@/sanity/lib/queries';
import { isChatEnabled } from '@/lib/concierge/chatEnabled';
import { Price } from '@/components/Price';
import { CurrencyNote } from '@/components/CurrencyNote';

import {
  InlineDateCheck,
  ProductConciergeLink,
  ProductLeadButton,
  ProductWhatsApp,
} from './ProductActions';
import '@/styles/product-page.css';

/**
 * Product page template (owner spec, 2026-11-09): a decision panel directly
 * under the H1 + dek (sticky right column from 1024px), the review-gated
 * Included / Itinerary-at-a-glance block, and the end block. Rows render only
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

function FromRow({ fromEur, basis, onRequest }: { fromEur: number | null; basis: string; onRequest: string }) {
  return fromEur ? (
    <span className="pdp-from">
      <strong>
        <Price eur={fromEur} />
      </strong>
      <small>{basis}</small>
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
}: Common & {
  facts: PanelFact[];
  fromEur: number | null;
  durationDays: number | null;
  tiers?: Array<{ name?: string; sub?: string; price?: number; unit?: string }>;
  /** e.g. the group package's next-departure card. */
  extra?: ReactNode;
}) {
  const t = await getTranslations({ locale, namespace: 'productPanel' });
  const ts = await getTranslations({ locale, namespace: 'tourSystem' });
  const rt = await responseShort(locale);
  const prefill = { kind: 'trip' as const, tourSlug: slug, tourTitle: title, durationDays };
  return (
    <aside id="pdp-panel" className="pdp-panel" aria-label={t('panelLabel')}>
      <Facts facts={facts} className="pdp-facts--details" />
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

/** §2 — day tours: the date check sits in the panel (inline from 1024px). */
export async function DayTourPanel({
  locale,
  slug,
  title,
  waHref,
  facts,
  fromEur,
  tiers,
}: Common & {
  facts: PanelFact[];
  fromEur: number | null;
  tiers?: Array<{ name?: string; sub?: string; price?: number; unit?: string }>;
}) {
  const t = await getTranslations({ locale, namespace: 'productPanel' });
  const ts = await getTranslations({ locale, namespace: 'tourSystem' });
  const rt = await responseShort(locale);
  return (
    <aside id="pdp-panel" className="pdp-panel pdp-panel--day" aria-label={t('panelLabel')}>
      <Facts facts={facts} className="pdp-facts--details" />
      <div className="pdp-price">
      <Facts facts={[{ label: t('from'), value: <FromRow fromEur={fromEur} basis={t('basisDay')} onRequest={t('priceOnRequest')} /> }]} />
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
      </div>
      {fromEur ? <div className="pdp-ccy"><CurrencyNote note={ts('priceCurrencyNote')} /></div> : null}
      <InlineDateCheck
        locale={locale}
        prefill={{ tourSlug: slug, tourTitle: title, priceFromEur: fromEur }}
        buttonLabel={t('ctaCheckDate')}
      />
      <div className="pdp-actions pdp-actions--day">
        <ProductWhatsApp href={waHref} location="product_panel" tourSlug={slug} className="pdp-link">
          {t('ctaWhatsApp')} →
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
 * §3 + §4 — Included / Not included, then Itinerary at a glance (multi-day).
 * Inputs are already filtered to owner-approved items (query). The itinerary
 * renders only when it covers every day of the product.
 */
export async function ProductFactsBlock({
  locale,
  included,
  excluded,
  itinerary,
  durationDays,
}: {
  locale: Locale;
  included: string[];
  excluded: string[];
  itinerary?: Array<{ day: number; title: string; overnight?: string | null }>;
  durationDays?: number | null;
}) {
  const t = await getTranslations({ locale, namespace: 'productPanel' });
  const days = itinerary ?? [];
  const fullItinerary =
    days.length > 0 &&
    typeof durationDays === 'number' &&
    days.length === durationDays &&
    days.every((d, i) => d.day === i + 1);
  if (included.length === 0 && excluded.length === 0 && !fullItinerary) return null;
  return (
    <section className="pdp-factsblock">
      {(included.length > 0 || excluded.length > 0) && (
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
      )}
      {fullItinerary && (
        <div className="pdp-glance">
          <h2>{t('atAGlance')}</h2>
          <ol>
            {days.map((d) => (
              <li key={d.day}>
                <span className="pdp-glance__day">{t('dayN', { n: d.day })}</span>
                <span className="pdp-glance__title">{d.title}</span>
                <span className="pdp-glance__night">{d.overnight ? t('night', { place: d.overnight }) : t('departure')}</span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </section>
  );
}

/** §5 — the button pair after the narrative. */
export async function MidCta({ locale, kind, slug, title, waHref, durationDays, fromEur }: Common & { kind: 'multi' | 'day'; durationDays: number | null; fromEur: number | null }) {
  const t = await getTranslations({ locale, namespace: 'productPanel' });
  const prefill =
    kind === 'multi'
      ? { kind: 'trip' as const, tourSlug: slug, tourTitle: title, durationDays }
      : { kind: 'day_tour' as const, tourSlug: slug, tourTitle: title, priceFromEur: fromEur };
  return (
    <p className="pdp-mid">
      <ProductLeadButton location="product_mid" prefill={prefill} className="pdp-btn pdp-btn--primary">
        {kind === 'multi' ? t('ctaCustomise') : t('ctaCheckDate')}
      </ProductLeadButton>
      <ProductWhatsApp href={waHref} location="product_mid" tourSlug={slug} className="pdp-link">
        {t('quickWhatsapp')}
      </ProductWhatsApp>
    </p>
  );
}

/** §5 — the end block (replaces "Talk to us about this journey/day."). */
export async function EndBlock({ locale, kind, slug, title, waHref, durationDays, fromEur }: Common & { kind: 'multi' | 'day'; durationDays: number | null; fromEur: number | null }) {
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
          <h2>{kind === 'multi' ? t('endMultiH2') : t('endDayH2')}</h2>
          <p>
            {kind === 'multi' ? t('endMultiBody') : t('endDayBody')}
            {s?.responseTimeFull ? `${sep}${s.responseTimeFull}` : ''}
          </p>
          <div className="cta-buttons">
            <ProductLeadButton location="product_end" prefill={prefill} className="cta-btn cta-btn--primary">
              {kind === 'multi' ? t('ctaCustomise') : t('ctaCheckDate')} <span className="cta-arrow" aria-hidden>→</span>
            </ProductLeadButton>
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
