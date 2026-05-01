import { getTranslations } from 'next-intl/server';

import { Link } from '@/i18n/navigation';

export interface WikiCardData {
  _id: string;
  _type: string;
  name: string;
  slug: string;
  summary?: string;
  heroImage?: { asset?: unknown; alt?: string } | null;
  // Type-specific extras (any may be undefined)
  kingdom?: string;
  period?: string;
  role?: string;
  reignDisplay?: string;
  monumentType?: string;
  preciseLocation?: string;
  city?: { name?: string; slug?: string } | null;
  domain?: string;
  count?: number;
}

interface Props {
  item: WikiCardData;
  /** Optional eyebrow override; defaults to a sensible per-type label. */
  eyebrow?: string;
}

const TYPE_PATH: Record<string, string> = {
  wikiDynasty: '/wiki/dynasties',
  wikiPerson: '/wiki/people',
  wikiMonument: '/wiki/monuments',
  wikiDeity: '/wiki/deities',
};

/**
 * Knowledge / Wiki card per brand-inputs Section 4.
 *
 * 1px rule border on default state; on hover, limestone background
 * with faience border. Italic faience label at top, serif title centered,
 * uppercase wide-tracked count at bottom. Min-height for grid alignment.
 */
export async function WikiCard({ item, eyebrow }: Props) {
  const t = await getTranslations('wiki');

  // Map slugs (kingdom/role/monumentType) to translated labels.
  const monumentTypeLabel = item.monumentType
    ? t(`monumentTypes.${item.monumentType}` as any)
    : null;
  const roleLabel = item.role ? t(`roles.${item.role}` as any) : null;

  const computedEyebrow =
    eyebrow ??
    (item._type === 'wikiDynasty'
      ? item.period
      : item._type === 'wikiPerson'
        ? [roleLabel, item.reignDisplay].filter(Boolean).join(' · ') || item.reignDisplay
        : item._type === 'wikiMonument'
          ? [monumentTypeLabel, item.city?.name].filter(Boolean).join(' · ')
          : item.domain);

  const href = `${TYPE_PATH[item._type] ?? '/wiki'}/${item.slug}`;

  return (
    <Link
      href={href}
      className="group flex min-h-[200px] flex-col justify-between border border-rule-strong p-7 transition-all duration-300 hover:border-faience hover:bg-limestone"
    >
      <div>
        {computedEyebrow && (
          <p className="mb-3 font-serif text-[0.8125rem] italic text-faience">
            {computedEyebrow}
          </p>
        )}
        <h3 className="mb-4 font-serif text-2xl font-medium leading-tight text-night">
          {item.name}
        </h3>
        {item.summary && (
          <p className="line-clamp-3 text-[0.9375rem] leading-relaxed text-night-soft">
            {item.summary}
          </p>
        )}
      </div>
      {item.count != null && (
        <p className="mt-4 font-sans text-[0.8125rem] uppercase tracking-[0.1em] text-night-soft">
          {item.count} {item.count === 1 ? 'entry' : 'entries'}
        </p>
      )}
    </Link>
  );
}
