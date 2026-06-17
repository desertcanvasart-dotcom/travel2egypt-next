import type { Metadata } from 'next';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';

import type { Locale } from '@/i18n/routing';
import { routing } from '@/i18n/routing';
import { buildStaticMetadata } from '@/lib/seo';
import { client } from '@/sanity/lib/client';
import {
  fieldGuideBySlugQuery,
  allFieldGuideSlugsQuery,
} from '@/sanity/lib/queries';
import { FieldGuideShell, FieldMasthead } from '@/components/resources';

interface Props {
  params: Promise<{ locale: string; slug: string }>;
}

/**
 * Dynamic Field Guide page, served by /resources/[slug]. Hardcoded
 * static routes — /resources/pyramids-decoded, /resources/arabic-lightly,
 * /resources/egyptian-gods — take Next.js routing precedence and keep
 * their bespoke visual treatments. Any fieldGuide doc whose slug
 * doesn't collide with one of those static routes renders through
 * this prose-driven template.
 */

interface TipRow {
  recipient: string;
  amount: string;
  context: string | null;
}

interface DishEntry {
  name: string;
  description: string;
  operatorNote: string | null;
}

interface FieldGuideSection {
  title: string;
  body: string | null;
  tipRows: TipRow[] | null;
  dishes: DishEntry[] | null;
  operatorNote: string | null;
  emphasized: boolean | null;
}

interface FieldGuideData {
  _id: string;
  slug: string;
  seriesNumber: string;
  title: string;
  titleAccent: string | null;
  region: string | null;
  tagSummary: string | null;
  standfirstLead: string | null;
  standfirstAccent: string | null;
  intro: string | null;
  sections: FieldGuideSection[] | null;
  closing: string | null;
  colophonNote: string | null;
  seo?: { metaTitle?: string; metaDescription?: string } | null;
}

export async function generateStaticParams() {
  const guides = await client.fetch<Array<{ slug: string }>>(
    allFieldGuideSlugsQuery,
  );
  // Cross-locale × per-slug params. Static routes already in the
  // filesystem (pyramids-decoded, arabic-lightly, egyptian-gods) win
  // over these dynamic ones, so no collision risk.
  return routing.locales.flatMap((locale) =>
    guides.map((g) => ({ locale, slug: g.slug })),
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const data = await client.fetch<FieldGuideData | null>(
    fieldGuideBySlugQuery(locale as Locale),
    { slug },
  );
  if (!data) return {};
  const tShared = await getTranslations({
    locale,
    namespace: 'resources',
  });
  const title =
    data.seo?.metaTitle ||
    `${data.title} ${data.titleAccent ?? ''} — ${tShared('wordmarkPlural')}`.trim();
  const description = data.seo?.metaDescription || data.standfirstLead || '';
  return buildStaticMetadata({
    locale: locale as Locale,
    path: `/resources/${slug}`,
    title,
    description,
  });
}

/**
 * Split a text block into paragraphs at blank lines. Sanity stores
 * multi-paragraph prose as a single string with `\n\n` separators;
 * we render each as its own <p>.
 */
function paragraphs(text: string | null | undefined): string[] {
  if (!text) return [];
  return text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}

export default async function FieldGuidePage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const data = await client.fetch<FieldGuideData | null>(
    fieldGuideBySlugQuery(locale as Locale),
    { slug },
  );
  if (!data) notFound();

  return (
    <FieldGuideShell>
      <FieldMasthead
        number={data.seriesNumber}
        region={data.region ?? ''}
        tagSummary={data.tagSummary ?? ''}
        title={
          <>
            {data.title}
            {data.titleAccent ? (
              <>
                {' '}
                <em>{data.titleAccent}</em>
              </>
            ) : null}
          </>
        }
        standfirst={
          <>
            {data.standfirstLead}
            {data.standfirstAccent ? (
              <>
                {' '}
                <em>{data.standfirstAccent}</em>
              </>
            ) : null}
          </>
        }
      />

      <div className="fg-prose">
        {data.intro ? (
          <section className="fg-prose__intro">
            {paragraphs(data.intro).map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </section>
        ) : null}

        {(data.sections ?? []).map((section, i) => (
          <section
            key={i}
            className={
              section.emphasized
                ? 'fg-prose__section fg-prose__section--emphasized'
                : 'fg-prose__section'
            }
            aria-labelledby={`fgp-${i}`}
          >
            <h2 id={`fgp-${i}`} className="fg-prose__label">
              {section.title}
            </h2>
            {section.body
              ? paragraphs(section.body).map((p, pi) => (
                  <p key={pi} className="fg-prose__body">
                    {p}
                  </p>
                ))
              : null}
            {section.tipRows && section.tipRows.length > 0 ? (
              <ul className="fg-prose__rows">
                {section.tipRows.map((row, ri) => (
                  <li key={ri} className="fg-prose__row">
                    <span className="fg-prose__row-recipient">
                      {row.recipient}
                    </span>
                    <span className="fg-prose__row-amount">{row.amount}</span>
                    {row.context ? (
                      <span className="fg-prose__row-context">
                        {row.context}
                      </span>
                    ) : null}
                  </li>
                ))}
              </ul>
            ) : null}
            {section.dishes && section.dishes.length > 0 ? (
              <ul className="fg-prose__dishes">
                {section.dishes.map((dish, di) => (
                  <li key={di} className="fg-prose__dish">
                    <h3 className="fg-prose__dish-name">{dish.name}</h3>
                    {paragraphs(dish.description).map((p, pi) => (
                      <p key={pi} className="fg-prose__dish-desc">
                        {p}
                      </p>
                    ))}
                    {dish.operatorNote ? (
                      <aside className="fg-prose__dish-note">
                        {dish.operatorNote}
                      </aside>
                    ) : null}
                  </li>
                ))}
              </ul>
            ) : null}
            {section.operatorNote ? (
              <aside className="fg-prose__op-note">
                {section.operatorNote}
              </aside>
            ) : null}
          </section>
        ))}

        {data.closing ? (
          <section className="fg-prose__closing">
            {paragraphs(data.closing).map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </section>
        ) : null}

        <footer className="fg-prose__colophon">
          <span className="fg-wordmark">
            Travel<span>2</span>Egypt
          </span>
          {data.colophonNote ? <p>{data.colophonNote}</p> : null}
        </footer>
      </div>
    </FieldGuideShell>
  );
}
