'use client';

import { useMemo, useState } from 'react';

import { Link } from '@/i18n/navigation';

export interface BlogIndexItem {
  _id: string;
  title: string;
  slug: string;
  category?: string;
  date?: string;
}

/**
 * Compact, searchable index of the journal's back catalogue. Replaces the
 * full-card grid for the long tail — a title row is ~60px vs a card's ~1000px,
 * so hundreds of articles stay browsable in a few screens, and the live search
 * narrows them instantly. Client component (search state only).
 */
export function BlogIndex({
  items,
  searchLabel,
  emptyLabel,
}: {
  items: BlogIndexItem[];
  searchLabel: string;
  emptyLabel: string;
}) {
  const [q, setQ] = useState('');
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return items;
    return items.filter((i) => `${i.title} ${i.category ?? ''}`.toLowerCase().includes(s));
  }, [q, items]);

  return (
    <div>
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={searchLabel}
        aria-label={searchLabel}
        className="mb-10 w-full max-w-md border-b border-rule bg-transparent pb-2 font-sans text-sm text-night placeholder:text-night-soft focus:border-faience focus:outline-none"
      />
      {filtered.length === 0 ? (
        <p className="font-serif text-lg italic text-night-soft">{emptyLabel}</p>
      ) : (
        <ul className="border-t border-rule">
          {filtered.map((i) => (
            <li key={i._id} className="border-b border-rule">
              <Link
                href={`/blog/${i.slug}`}
                className="group flex flex-col gap-1 py-4 md:flex-row md:items-baseline md:justify-between md:gap-8"
              >
                <span className="font-serif text-lg leading-snug text-night transition-colors group-hover:text-faience">
                  {i.title}
                </span>
                {(i.category || i.date) && (
                  <span className="shrink-0 font-sans text-xs uppercase tracking-[0.12em] text-night-soft">
                    {i.category}
                    {i.category && i.date ? ' · ' : ''}
                    {i.date}
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
