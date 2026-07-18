interface Stat {
  label: string;
  value: string | number;
}

/**
 * Right-side stat anchor for the editorial (Tailwind) hero family — guide,
 * travel-tips, blog, hotels. A compact label/value spec list matching the
 * `.mast-stats` device on the tour-system pages, but styled with the editorial
 * faience/night palette. Rows with a falsy value are dropped.
 */
export function EditorialHeroStats({ stats }: { stats: Stat[] }) {
  const rows = stats.filter((s) => Boolean(s.value));
  if (rows.length === 0) return null;
  return (
    <dl className="w-full shrink-0 md:mb-1.5 md:w-60">
      {rows.map((s, i) => (
        <div
          key={s.label}
          className={`flex items-baseline justify-between gap-6 border-t border-rule py-2.5 ${
            i === rows.length - 1 ? 'border-b' : ''
          }`}
        >
          <dt className="font-sans text-[11px] uppercase tracking-[0.12em] text-night-soft">
            {s.label}
          </dt>
          <dd className="font-serif text-[1.4375rem] leading-none text-faience">{s.value}</dd>
        </div>
      ))}
    </dl>
  );
}
