import { useTranslations } from 'next-intl';

import { Link } from '@/i18n/navigation';

const SECTION_ORDER = [
  'introducing',
  'plan-your-trip',
  'while-you-are-there',
  'places-to-go',
  'others',
] as const;

type SectionValue = (typeof SECTION_ORDER)[number];

interface SubArticle {
  _id: string;
  section?: SectionValue | string;
  title: string;
  slug: string;
  summary?: string;
}

interface PlaceToGo {
  _id: string;
  name: string;
  slug: string;
  summary?: string;
  monumentType?: string;
}

interface Props {
  citySlug: string;
  cityName: string;
  subArticles?: SubArticle[] | null;
  placesToGo?: PlaceToGo[] | null;
  /** Slug of the active leaf article, when rendered inside a leaf page. */
  activeArticleSlug?: string;
}

export function CityGuideSidebar({
  citySlug,
  cityName,
  subArticles,
  placesToGo,
  activeArticleSlug,
}: Props) {
  const articles = subArticles ?? [];
  const places = placesToGo ?? [];
  const t = useTranslations('guideSections');
  const tGuide = useTranslations('guide');

  // Group articles by section.
  const groupedArticles = new Map<string, SubArticle[]>();
  for (const article of articles) {
    if (!article.section || article.section === 'places-to-go') continue;
    const list = groupedArticles.get(article.section) ?? [];
    list.push(article);
    groupedArticles.set(article.section, list);
  }

  const renderedSections = SECTION_ORDER.map((section) => {
    if (section === 'places-to-go') {
      if (places.length === 0) return null;
      return (
        <SectionGroup key={section} label={t(section)}>
          {places.map((place) => (
            <li key={place._id}>
              <Link
                href={`/wiki/monuments/${place.slug}`}
                className="block text-ink-soft transition-colors hover:text-orange-deep"
              >
                {place.name}
              </Link>
            </li>
          ))}
        </SectionGroup>
      );
    }

    const items = groupedArticles.get(section) ?? [];
    if (items.length === 0) return null;
    const label =
      section === 'introducing'
        ? tGuide('introducingCity', { city: cityName })
        : t(section);
    return (
      <SectionGroup key={section} label={label}>
        {items.map((item) => {
          const isActive = activeArticleSlug === item.slug;
          return (
            <li key={item._id}>
              <Link
                href={`/guide/${citySlug}/${item.slug}`}
                className={
                  isActive
                    ? 'block font-medium text-orange-deep'
                    : 'block text-ink-soft transition-colors hover:text-orange-deep'
                }
                aria-current={isActive ? 'page' : undefined}
              >
                {item.title}
              </Link>
            </li>
          );
        })}
      </SectionGroup>
    );
  }).filter(Boolean);

  if (renderedSections.length === 0) return null;

  return (
    <nav
      className="rounded-lg border border-line bg-paper p-6 text-sm shadow-soft"
      aria-label="City guide navigation"
    >
      <h2 className="mb-5 border-b border-line pb-4 font-serif text-lg font-medium text-ink">
        {tGuide('cityTravelGuide', { city: cityName })}
      </h2>
      <div className="divide-y divide-line">{renderedSections}</div>
    </nav>
  );
}

function SectionGroup({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="py-4 first:pt-0 last:pb-0">
      <SectionHeader label={label} />
      <ul className="mt-3 space-y-2">{children}</ul>
    </div>
  );
}

function SectionHeader({ label }: { label: string }) {
  return (
    <h3 className="font-sans text-xs font-semibold uppercase tracking-[0.15em] text-ink-muted">
      {label}
    </h3>
  );
}
