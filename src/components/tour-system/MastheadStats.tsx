interface Stat {
  label: string;
  value: string | number;
}

/**
 * Right-side stat anchor for the `.lvl-category` masthead — a small label/value
 * spec list that resolves the hero's negative space with substance. Rows with a
 * falsy value (0, empty) are dropped, so a category with none simply omits them.
 * Rendered bottom-right of the masthead on desktop; stacks below on mobile.
 */
export function MastheadStats({ stats }: { stats: Stat[] }) {
  const rows = stats.filter((s) => Boolean(s.value));
  if (rows.length === 0) return null;
  return (
    <dl className="mast-stats">
      {rows.map((s) => (
        <div className="stat-row" key={s.label}>
          <dt>{s.label}</dt>
          <dd>{s.value}</dd>
        </div>
      ))}
    </dl>
  );
}
