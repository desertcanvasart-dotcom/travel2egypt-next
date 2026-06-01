import { Link } from '@/i18n/navigation';

/**
 * Presentational connective sections for the article template: the related
 * "weave" (Read next / Do this in {city} / Read in the Guide) and the foot
 * band (In season now / From the Journal / Practical notes).
 *
 * Both are deliberately dumb — the page builds localized, href-resolved
 * columns and these just lay them out. Columns with no items are dropped by
 * the page before they reach here, and the grid reflows to what remains.
 */

export interface WeaveItem {
  id: string;
  kicker?: string;
  title: string;
  note?: string;
  href: string;
}

export interface WeaveColumn {
  heading: string;
  items: WeaveItem[];
}

const COLS_CLASS: Record<number, string> = {
  1: 'md:grid-cols-1',
  2: 'md:grid-cols-2',
  3: 'md:grid-cols-2 lg:grid-cols-3',
};

function WeaveColumnView({ column }: { column: WeaveColumn }) {
  return (
    <div>
      <h3 className="mb-6 border-b border-rule pb-4 font-sans text-xs font-medium uppercase tracking-[0.18em] text-sand-warm">
        {column.heading}
      </h3>
      <div>
        {column.items.map((item) => (
          <Link
            key={item.id}
            href={item.href}
            className="block border-b border-rule py-4 transition-[padding] duration-200 last:border-0 hover:pl-2"
          >
            {item.kicker && (
              <span className="mb-1.5 block font-sans text-[0.625rem] uppercase tracking-[0.14em] text-night-soft">
                {item.kicker}
              </span>
            )}
            <span className="block font-serif text-xl font-normal leading-tight text-night">
              {item.title}
            </span>
            {item.note && (
              <span className="mt-1 block font-sans text-sm leading-snug text-night-soft">
                {item.note}
              </span>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}

export function ArticleRelatedWeave({ columns }: { columns: WeaveColumn[] }) {
  const present = columns.filter((c) => c.items.length > 0);
  if (present.length === 0) return null;
  return (
    <section className="border-t border-rule-strong">
      <div className="mx-auto max-w-7xl px-6 py-20">
        <div className={`grid grid-cols-1 gap-x-14 gap-y-12 ${COLS_CLASS[present.length] ?? COLS_CLASS[3]}`}>
          {present.map((column) => (
            <WeaveColumnView key={column.heading} column={column} />
          ))}
        </div>
      </div>
    </section>
  );
}

export interface FootBandProps {
  inSeasonLabel: string;
  /** Paragraphs split on blank lines. */
  inSeasonBody: string;
  journalLabel: string;
  journalItems: WeaveItem[];
  practicalLabel: string;
  practicalBody: string;
}

function Prose({ body }: { body: string }) {
  const paragraphs = body.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  return (
    <div className="font-serif text-lg italic leading-relaxed text-night-soft">
      {paragraphs.map((p, i) => (
        <p key={i} className={i > 0 ? 'mt-3.5' : undefined}>
          {p}
        </p>
      ))}
    </div>
  );
}

export function ArticleFootBand({
  inSeasonLabel,
  inSeasonBody,
  journalLabel,
  journalItems,
  practicalLabel,
  practicalBody,
}: FootBandProps) {
  return (
    <section className="bg-limestone-deep">
      <div className="mx-auto max-w-7xl px-6 py-20">
        <div className="grid grid-cols-1 gap-x-16 gap-y-12 md:grid-cols-3">
          <div>
            <h4 className="mb-6 border-b border-rule pb-4 font-sans text-xs font-medium uppercase tracking-[0.18em] text-sand-warm">
              {inSeasonLabel}
            </h4>
            <Prose body={inSeasonBody} />
          </div>
          <div>
            <h4 className="mb-6 border-b border-rule pb-4 font-sans text-xs font-medium uppercase tracking-[0.18em] text-sand-warm">
              {journalLabel}
            </h4>
            <ul>
              {journalItems.map((item) => (
                <li key={item.id} className="border-b border-rule last:border-0">
                  <Link href={item.href} className="block py-3.5 transition-colors hover:text-sand-warm">
                    <span className="block font-serif text-lg leading-snug text-night">
                      {item.title}
                    </span>
                    {item.kicker && (
                      <span className="mt-0.5 block font-sans text-[0.625rem] uppercase tracking-[0.1em] text-night-soft">
                        {item.kicker}
                      </span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="mb-6 border-b border-rule pb-4 font-sans text-xs font-medium uppercase tracking-[0.18em] text-sand-warm">
              {practicalLabel}
            </h4>
            <Prose body={practicalBody} />
          </div>
        </div>
      </div>
    </section>
  );
}
