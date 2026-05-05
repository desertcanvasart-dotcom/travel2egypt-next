import { useTranslations } from 'next-intl';

import { Link } from '@/i18n/navigation';

export interface TravelTipsSidebarCategory {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  tipCount?: number;
}

interface Props {
  categories: TravelTipsSidebarCategory[];
  /** When set, the matching category gets a faience-active treatment. */
  currentCategorySlug?: string;
  locale: string;
}

export function TravelTipsSidebar({
  categories,
  currentCategorySlug,
}: Props) {
  const t = useTranslations('travelTips');

  if (!categories || categories.length === 0) return null;

  return (
    <nav
      className="border-t border-rule-strong pt-6 text-sm"
      aria-label={t('categoryNavLabel')}
    >
      <h2 className="mb-5 font-sans text-xs font-medium uppercase tracking-[0.16em] text-night-soft">
        {t('categoryNavLabel')}
      </h2>
      <ul className="space-y-3">
        <li>
          <Link
            href="/travel-tips"
            className="block font-serif text-base text-night-soft transition-colors hover:text-faience"
          >
            {t('allTipsLabel')}
          </Link>
        </li>
        {categories.map((cat) => {
          const isActive = currentCategorySlug === cat.slug;
          return (
            <li key={cat._id}>
              <Link
                href={`/travel-tips#category-${cat.slug}`}
                aria-current={isActive ? 'true' : undefined}
                className={
                  isActive
                    ? 'block font-serif text-base font-medium text-faience underline underline-offset-4 decoration-faience'
                    : 'block font-serif text-base text-night transition-colors hover:text-faience'
                }
              >
                <span>{cat.name}</span>
                {typeof cat.tipCount === 'number' && cat.tipCount > 0 && (
                  <span className="ml-2 font-sans text-xs italic text-night-soft">
                    ({cat.tipCount})
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
