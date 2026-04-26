import Image from 'next/image';
import { getTranslations } from 'next-intl/server';

import { Link } from '@/i18n/navigation';
import { urlFor } from '@/sanity/lib/image';

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

export async function WikiCard({ item, eyebrow }: Props) {
  const t = await getTranslations('wiki');
  const heroUrl = item.heroImage?.asset
    ? urlFor(item.heroImage).width(800).height(560).quality(80).url()
    : null;

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
    <Link href={href} className="group block">
      <div className="mb-3 aspect-[4/3] overflow-hidden rounded-lg bg-cream-deep">
        {heroUrl ? (
          <Image
            src={heroUrl}
            alt={item.heroImage?.alt || item.name}
            width={800}
            height={560}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : null}
      </div>
      {computedEyebrow && (
        <p className="mb-1 font-sans text-xs font-semibold uppercase tracking-[0.12em] text-orange-deep">
          {computedEyebrow}
        </p>
      )}
      <h3 className="mb-1 font-serif text-xl text-ink group-hover:text-orange-deep">
        {item.name}
      </h3>
      {item.summary && (
        <p className="line-clamp-3 text-sm text-ink-soft">{item.summary}</p>
      )}
    </Link>
  );
}
