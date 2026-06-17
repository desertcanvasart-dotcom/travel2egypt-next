/**
 * The static editorial timeline that opens Field Guide No. 05.
 *
 * One SVG. No interactivity, no animation. Nine era bands at
 * proportional widths matching their durations (3100 BC → 30 BC),
 * seven anchoring pharaohs as ticks, and a "modern era" extension
 * (30 BC → today) rendered in a quieter stripe pattern so the
 * editorial hook — "Cleopatra is closer to us than to the Pyramids"
 * — lands as visible scale.
 *
 * Year-to-x:   1 year ≈ 0.234 viewBox units (1200 units = 5126 years).
 * Era colors:  navy at varying opacity, with the New Kingdom in gold
 *              (the era most travelers spend most of their time in,
 *              and the one this guide leans on as its narrative
 *              centerpiece).
 *
 * Mobile behavior: SVG scales down with the page. Labels shrink with
 * it; the bar itself carries the visual story at any size.
 */

const VB_WIDTH = 1240;
const VB_HEIGHT = 320;

// Layout: bar sits at y=140..180. Labels above (era), ticks + names below.
const BAR_Y = 140;
const BAR_H = 40;
const BAR_BOTTOM = BAR_Y + BAR_H;

// 3100 BC → 30 BC = 3070 ancient years
// 30 BC → 2025 AD = 2055 modern years
// Total 5125 years → 0.234 units/year, starting at x=20.
const X_ORIGIN = 20;
const UNITS_PER_YEAR = 0.234;
const yearsFromStart = (yearBC: number) => 3100 - yearBC; // yearBC negative for AD
const xForYearBC = (yearBC: number) => X_ORIGIN + yearsFromStart(yearBC) * UNITS_PER_YEAR;

type Era = {
  key: string;
  label: string;
  startBC: number;
  endBC: number;
  fill: string;
  opacity?: number;
  labelLight?: boolean;
  hatched?: boolean;
};

// Era bands in chronological order.
const ERAS: Era[] = [
  { key: 'early',     label: 'Early Dynastic',           startBC: 3100, endBC: 2686, fill: 'var(--navy)', opacity: 0.55 },
  { key: 'old',       label: 'Old Kingdom',              startBC: 2686, endBC: 2181, fill: 'var(--navy)', opacity: 0.92 },
  { key: 'inter1',    label: '1st Inter.',               startBC: 2181, endBC: 2055, fill: 'var(--navy)', opacity: 0.28 },
  { key: 'middle',    label: 'Middle Kingdom',           startBC: 2055, endBC: 1650, fill: 'var(--navy)', opacity: 0.75 },
  { key: 'inter2',    label: '2nd Inter.',               startBC: 1650, endBC: 1550, fill: 'var(--navy)', opacity: 0.28 },
  { key: 'new',       label: 'New Kingdom',              startBC: 1550, endBC: 1069, fill: 'var(--gold)', opacity: 1, labelLight: true },
  { key: 'inter3',    label: '3rd Inter.',               startBC: 1069, endBC: 664,  fill: 'var(--navy)', opacity: 0.28 },
  { key: 'late',      label: 'Late Period',              startBC: 664,  endBC: 332,  fill: 'var(--navy)', opacity: 0.60 },
  { key: 'ptolemaic', label: 'Ptolemaic',                startBC: 332,  endBC: 30,   fill: 'var(--navy)', opacity: 0.85 },
  // Modern extension — 30 BC → ~2025. Negative BC = AD.
  { key: 'modern',    label: 'Roman Egypt → today',      startBC: 30,   endBC: -2025, fill: 'url(#pt-stripes)', opacity: 1, hatched: true },
];

type Pharaoh = {
  key: string;
  name: string;
  date: string;
  yearBC: number;
  stagger?: 'up' | 'down' | 'down2';
};

// Seven anchors. Tut omitted from the visual (lives in editorial body) —
// his significance is monument-survival, not temporal scale.
const PHARAOHS: Pharaoh[] = [
  { key: 'djoser',     name: 'Djoser',         date: '~2670 BC', yearBC: 2670, stagger: 'down' },
  { key: 'khufu',      name: 'Khufu',          date: '~2580 BC', yearBC: 2580, stagger: 'down2' },
  { key: 'mentuhotep', name: 'Mentuhotep II',  date: '~2050 BC', yearBC: 2050, stagger: 'down' },
  { key: 'hatshepsut', name: 'Hatshepsut',     date: '~1479 BC', yearBC: 1479, stagger: 'down' },
  { key: 'akhenaten',  name: 'Akhenaten',      date: '~1351 BC', yearBC: 1351, stagger: 'up'   },
  { key: 'ramses',     name: 'Ramses II',      date: '~1279 BC', yearBC: 1279, stagger: 'down2' },
  { key: 'cleopatra',  name: 'Cleopatra VII',  date: '~30 BC',   yearBC: 30,   stagger: 'down' },
];

export function PharaohTimelineSvg() {
  return (
    <svg
      className="fg-timeline"
      viewBox={`0 0 ${VB_WIDTH} ${VB_HEIGHT}`}
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="A horizontal timeline of pharaonic Egypt: nine era bands from the Early Dynastic Period (3100 BC) through the Ptolemaic dynasty (30 BC), with key pharaohs marked. A muted extension at right shows the two thousand years from Cleopatra's death to the present day."
    >
      <defs>
        {/* Diagonal stripe pattern for the modern-era extension —
         *  subtle hatching that visually separates "ancient Egypt"
         *  from "everything since." */}
        <pattern
          id="pt-stripes"
          patternUnits="userSpaceOnUse"
          width="8"
          height="8"
          patternTransform="rotate(35)"
        >
          <rect width="8" height="8" fill="var(--navy)" fillOpacity="0.07" />
          <line x1="0" y1="0" x2="0" y2="8" stroke="var(--navy)" strokeWidth="1.2" strokeOpacity="0.22" />
        </pattern>
      </defs>

      {/* Era bands */}
      {ERAS.map((era) => {
        const x = xForYearBC(era.startBC);
        const width = xForYearBC(era.endBC) - x;
        return (
          <rect
            key={era.key}
            x={x}
            y={BAR_Y}
            width={width}
            height={BAR_H}
            fill={era.fill}
            opacity={era.opacity ?? 1}
          />
        );
      })}

      {/* Era labels — date range above era name. Centered over band. */}
      {ERAS.map((era) => {
        const x = xForYearBC(era.startBC);
        const width = xForYearBC(era.endBC) - x;
        const cx = x + width / 2;
        const isShort = width < 40;
        const dateRange = era.hatched
          ? '30 BC → today'
          : `${era.startBC} – ${era.endBC} BC`;
        return (
          <g key={`${era.key}-label`}>
            <text
              x={cx}
              y={BAR_Y - 26}
              textAnchor="middle"
              fontSize={isShort ? '8.5' : '9.5'}
              fontFamily="var(--ui)"
              fill="var(--fg-ink-soft)"
              letterSpacing="0.08em"
            >
              {era.hatched ? dateRange : `${era.startBC}–${era.endBC} BC`}
            </text>
            <text
              x={cx}
              y={BAR_Y - 10}
              textAnchor="middle"
              fontSize={isShort ? '10' : '13'}
              fontFamily="var(--display)"
              fontStyle={era.hatched ? 'italic' : 'normal'}
              fontWeight={era.hatched ? '500' : '600'}
              fill={era.labelLight ? 'var(--gold)' : 'var(--navy)'}
            >
              {era.label}
            </text>
          </g>
        );
      })}

      {/* Pharaoh ticks + labels */}
      {PHARAOHS.map((p) => {
        const x = xForYearBC(p.yearBC);
        const up = p.stagger === 'up';
        const down2 = p.stagger === 'down2';
        // Tick: thin gold vertical line crossing the bar.
        const tickY1 = up ? BAR_Y - 22 : BAR_Y;
        const tickY2 = up ? BAR_Y : BAR_BOTTOM + (down2 ? 38 : 20);
        // Label positions stagger below (or above for `up`).
        const nameY = up ? BAR_Y - 28 : BAR_BOTTOM + (down2 ? 54 : 36);
        const dateY = up ? BAR_Y - 40 : BAR_BOTTOM + (down2 ? 67 : 49);
        return (
          <g key={p.key}>
            <line
              x1={x}
              x2={x}
              y1={tickY1}
              y2={tickY2}
              stroke="var(--gold)"
              strokeWidth="1.4"
            />
            <text
              x={x}
              y={nameY}
              textAnchor="middle"
              fontSize="11.5"
              fontFamily="var(--display)"
              fontStyle="italic"
              fill="var(--navy)"
            >
              {p.name}
            </text>
            <text
              x={x}
              y={dateY}
              textAnchor="middle"
              fontSize="9"
              fontFamily="var(--ui)"
              fill="var(--fg-ink-soft)"
              letterSpacing="0.04em"
            >
              {p.date}
            </text>
          </g>
        );
      })}

      {/* "Cleopatra → today" annotation under the modern band — the
       *  editorial point made literal. */}
      {(() => {
        const xStart = xForYearBC(30);
        const xEnd = xForYearBC(-2025);
        const yBracket = BAR_BOTTOM + 90;
        const mid = (xStart + xEnd) / 2;
        return (
          <g>
            <path
              d={`M ${xStart} ${BAR_BOTTOM + 80} L ${xStart} ${yBracket} L ${xEnd} ${yBracket} L ${xEnd} ${BAR_BOTTOM + 80}`}
              fill="none"
              stroke="var(--fg-rule-strong)"
              strokeWidth="1"
            />
            <text
              x={mid}
              y={yBracket + 18}
              textAnchor="middle"
              fontSize="11"
              fontFamily="var(--ui)"
              fill="var(--fg-ink-soft)"
              letterSpacing="0.12em"
            >
              {'~2,055 YEARS — LONGER THAN OLD + MIDDLE + NEW KINGDOMS COMBINED'}
            </text>
          </g>
        );
      })()}

      {/* End markers — left "3100 BC" and right "TODAY". */}
      <text
        x={X_ORIGIN}
        y={BAR_Y - 44}
        textAnchor="start"
        fontSize="9"
        fontFamily="var(--ui)"
        fill="var(--navy)"
        letterSpacing="0.14em"
        fontWeight="600"
      >
        3100 BC
      </text>
      <text
        x={xForYearBC(-2025)}
        y={BAR_Y - 44}
        textAnchor="end"
        fontSize="9"
        fontFamily="var(--ui)"
        fill="var(--navy)"
        letterSpacing="0.14em"
        fontWeight="600"
      >
        TODAY
      </text>
    </svg>
  );
}
