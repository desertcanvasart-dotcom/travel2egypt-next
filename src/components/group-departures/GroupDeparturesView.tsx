import { getTranslations } from 'next-intl/server';

import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { Price } from '@/components/Price';
import { JsonLd } from '@/components/JsonLd';
import { FloatingConcierge } from '@/components/FloatingConcierge';
import { buildBreadcrumbList } from '@/lib/structured-data';
import { WHATSAPP_LINK } from '@/lib/concierge/constants';
import type { CalendarMonth } from '@/lib/groupDepartures';

import '@/styles/tour-system.css';
import '@/styles/packages-hub.css';
import '@/styles/group-departures.css';

const STATUS_CLASS: Record<string, string> = {
  guaranteed: 's-ok',
  few: 's-few',
  available: 's-open',
  soldout: 's-out',
  onrequest: 's-req',
};

/**
 * Group departures calendar — /group-departures. Every scheduled group
 * departure in date order, by month; each row opens the tour's own page.
 * Server-rendered, no client state: the month chips are plain anchors.
 */
export async function GroupDeparturesView({ months, locale }: { months: CalendarMonth[]; locale: Locale }) {
  const t = await getTranslations('groupDepartures');
  const ts = await getTranslations('tourSystem');
  const tNav = await getTranslations('nav');
  const sep = locale === 'ja' ? '' : ' ';
  const total = months.reduce((n, m) => n + m.rows.length, 0);
  const STATUS_LABEL: Record<string, string> = {
    guaranteed: ts('pkgGrpStatusGuaranteed'),
    few: ts('pkgGrpStatusFew'),
    available: ts('pkgGrpStatusAvailable'),
    soldout: ts('pkgGrpStatusSoldout'),
    onrequest: ts('pkgGrpStatusOnrequest'),
  };

  return (
    <div className="tour-doc lvl-category lvl-hub lvl-gd" lang={locale}>
      <JsonLd
        data={[
          buildBreadcrumbList(
            [
              { name: tNav('home'), path: '/' },
              { name: t('crumb'), path: '/group-departures' },
            ],
            locale,
          ),
        ]}
      />
      <div className="t2e-wrap">
        <nav className="t2e-crumb" aria-label="Breadcrumb">
          <ol>
            <li><Link href="/">{tNav('home')}</Link></li>
            <li>{t('crumb')}</li>
          </ol>
        </nav>
        <header className="gd-head">
          <span className="t2e-kicker">{t('kicker')}</span>
          <h1 className="mast-title">{t('title')}</h1>
          <p className="mast-tag">{t('dek')}</p>
          {total > 0 && (
            <p className="gd-count">{t('count', { count: total })}</p>
          )}
        </header>

        {months.length > 0 && (
          <nav className="gd-months" aria-label={t('jump')}>
            <span className="gd-months-label">{t('jump')}</span>
            <ul>
              {months.map((m) => (
                <li key={m.key}>
                  <a href={`#m-${m.key}`}>{m.label}</a>
                </li>
              ))}
            </ul>
          </nav>
        )}

        {months.length === 0 ? (
          <p className="gd-empty">
            {t('empty')}
            {sep}
            <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer">WhatsApp +20 155 177 2258</a>
          </p>
        ) : (
          months.map((m) => (
            <section className="gd-month" id={`m-${m.key}`} key={m.key} aria-labelledby={`h-${m.key}`} style={{ scrollMarginTop: 80 }}>
              <h2 id={`h-${m.key}`}>{m.label}</h2>
              <ul className="gd-list">
                {m.rows.map((r) => (
                  <li className={r.isSoldOut ? 'gd-row is-out' : 'gd-row'} key={r.key}>
                    <div className="gd-date">{r.dateRange}</div>
                    <div className="gd-tour">
                      <Link href={`/${r.href}` as never} className="gd-title">{r.title}</Link>
                      {r.days != null && <span className="gd-days">{ts('pkgCatDayCount', { count: r.days })}</span>}
                    </div>
                    <div className={`gd-status ${r.status ? STATUS_CLASS[r.status] ?? 's-open' : ''}`}>
                      {r.status ? STATUS_LABEL[r.status] : ''}
                      {r.isPeak && <span className="gd-peak">{t('peak')}</span>}
                    </div>
                    <div className="gd-price">
                      {r.price != null ? <Price eur={r.price} /> : ts('priceOnInquiry')}
                      {r.price != null && <small>{ts('pkgGrpPerPerson')}</small>}
                    </div>
                    <Link href={`/${r.href}` as never} className="gd-go">{t('see')}</Link>
                  </li>
                ))}
              </ul>
            </section>
          ))
        )}

        <p className="gd-note">{t('note')}</p>
        <p className="gd-more">
          <Link href="/small-group-travel-packages">{t('howItWorks')}</Link>
        </p>
      </div>
      <FloatingConcierge />
    </div>
  );
}
