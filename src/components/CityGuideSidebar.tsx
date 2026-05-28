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
  placesToGoGroup?: string | null;
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
  // Sanity GROQ `placesToGo[]->` can yield null for refs whose target doc was
  // deleted or hasn't propagated to the CDN yet. Filter to keep the renderer
  // tolerant of that transient. Same belt-and-braces on subArticles.
  const articles = (subArticles ?? []).filter((a): a is SubArticle => a !== null && a !== undefined);
  const places = (placesToGo ?? []).filter((p): p is PlaceToGo => p !== null && p !== undefined);
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

      // Group places by `placesToGoGroup` (e.g., "Coptic Cairo", "Saqqara").
      // Empty/null group → "Other sites" (rendered last).
      // Inside each group: alphabetical by name.
      // Groups themselves: alphabetical, with "Other sites" pinned last.
      const OTHER_KEY = '__other__';
      const groupsMap = new Map<string, PlaceToGo[]>();
      for (const p of places) {
        const key = p.placesToGoGroup?.trim() || OTHER_KEY;
        if (!groupsMap.has(key)) groupsMap.set(key, []);
        groupsMap.get(key)!.push(p);
      }
      const groupKeys = [...groupsMap.keys()].sort((a, b) => {
        if (a === OTHER_KEY) return 1;
        if (b === OTHER_KEY) return -1;
        return a.localeCompare(b);
      });
      const collator = new Intl.Collator(undefined, { sensitivity: 'base' });
      for (const k of groupKeys) {
        groupsMap.get(k)!.sort((x, y) => collator.compare(x.name ?? '', y.name ?? ''));
      }
      // If every place is in the same single group (or all untagged),
      // render flat without sub-headers — sub-headers only help when
      // there are actually multiple groups to distinguish.
      const renderSubHeaders = groupKeys.length > 1;

      return (
        <SectionGroup key={section} label={t(section)}>
          {groupKeys.flatMap((groupKey) => {
            const groupPlaces = groupsMap.get(groupKey)!;
            const isOther = groupKey === OTHER_KEY;
            const items = groupPlaces.map((place) => (
              <li key={place._id}>
                <Link
                  href={`/guide/${citySlug}/${place.slug}`}
                  className="block text-night-soft transition-colors hover:text-faience"
                >
                  {place.name}
                </Link>
              </li>
            ));
            if (!renderSubHeaders) return items;
            return [
              <li
                key={`hdr-${groupKey}`}
                className="mt-3 pt-2 text-xs uppercase tracking-wider text-night-muted first:mt-0 first:pt-0"
              >
                {isOther ? t('places-to-go-other') : groupKey}
              </li>,
              ...items,
            ];
          })}
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
                    ? 'block font-medium text-faience'
                    : 'block text-night-soft transition-colors hover:text-faience'
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
      className="border-t border-rule-strong pt-6 text-sm"
      aria-label="City guide navigation"
    >
      <h2 className="mb-5 font-sans text-xs font-medium uppercase tracking-[0.16em] text-night-soft">
        {tGuide('cityTravelGuide', { city: cityName })}
      </h2>
      <div className="divide-y divide-rule">{renderedSections}</div>
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
    <h3 className="font-serif text-sm italic text-faience">
      {label}
    </h3>
  );
}
