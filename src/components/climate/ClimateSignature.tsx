import type { ClimateRecord, MonthSpan } from '@/data/climate';

/**
 * ClimateSignature — the weather-page hero.
 *
 * A static, server-rendered SVG "climate signature": day/night temperature
 * bands across twelve months, the recommended season marked in gold (a quiet
 * background band AND gold-tinted month letters), a same-month day–night gap
 * measure, an optional rain-days row, a descriptor row under the title, and an
 * italic caption under the chart.
 *
 * Ported 1:1 from the approved design mock (climate-signature-mock-v2). The
 * mock shipped as a standalone file with client JS purely because it was
 * standalone; here the geometry is computed at render time and emitted as
 * plain SVG elements — no animation, no client JS.
 *
 * Graceful degradation: the chart needs only the numeric record. Every
 * editorial string (descriptors, gap/trough annotations, caption, season
 * label) renders only when present — a locale with no copy shows the chart
 * alone; the page never mounts this at all for a city with no data entry.
 */

// ── Geometry constants (from the mock's render()) ──────────────────────────
const W = 940;
const H = 310;
const PAD_L = 44;
const PAD_R = 24;
const PAD_T = 34;
const MONTHS = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];
const ES_MONTHS = ['E', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];
const JA_MONTHS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];

type Pt = [number, number];

/** Catmull-Rom → cubic-bézier smoothing (verbatim from the mock). */
function smoothPath(pts: Pt[]): string {
  let d = `M ${pts[0][0]},${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += ` C ${c1x},${c1y} ${c2x},${c2y} ${p2[0]},${p2[1]}`;
  }
  return d;
}

const inAnySpan = (m: number, spans: MonthSpan[]) =>
  spans.some(([a, b]) => m >= a && m <= b);

/** Split "A · B · C" into nodes with gold middots (the mock's <b>·</b>). */
function descriptorNodes(text: string) {
  const parts = text.split(' · ');
  return parts.flatMap((p, i) =>
    i === 0
      ? [<span key={`d${i}`}>{p}</span>]
      : [
          <b key={`s${i}`}> · </b>,
          <span key={`d${i}`}>{p}</span>,
        ],
  );
}

export interface ClimateCopy {
  descriptors?: string;
  gapText?: string;
  troughText?: string;
  caption?: string;
  seasonLabel?: string;
  /** Fixed chrome, per locale: the RAIN DAYS row label. */
  rainLabel: string;
}

interface Props {
  /** Article title — decorative wordmark; the page's real <h1> is below. */
  title: string;
  record: ClimateRecord;
  copy: ClimateCopy;
  locale: string;
  cityName: string;
  /**
   * 'hero' (default) — the boxed card used at the top of every un-rewritten
   * weather page; unchanged. 'inline' — surfaceless, top/bottom-ruled variant
   * (PriceManifest v2 pattern) for placement inside a rewritten weather-page
   * body. Defaulting to 'hero' keeps all existing callers byte-identical.
   */
  variant?: 'hero' | 'inline';
}

export default function ClimateSignature({
  title,
  record,
  copy,
  locale,
  cityName,
  variant = 'hero',
}: Props) {
  const { highs, lows, rain, season, gapMonth, troughMonth } = record;
  const hasRain = Array.isArray(rain);
  const padB = hasRain ? 76 : 56;
  const plotW = W - PAD_L - PAD_R;
  const plotH = H - PAD_T - padB;

  // Domain: the mock pins [0,45]. Keep that for every city that fits, and
  // expand only when data escapes it (Saint Catherine's sub-zero winter),
  // so the common case stays pixel-identical to the approved mock.
  const dataMin = Math.min(...lows);
  const dataMax = Math.max(...highs);
  const tMin = Math.min(0, Math.floor(dataMin) - 2);
  const tMax = Math.max(45, Math.ceil(dataMax));

  const x = (m: number) => PAD_L + (m / 11) * plotW;
  const y = (t: number) => PAD_T + (1 - (t - tMin) / (tMax - tMin)) * plotH;

  const hiPts: Pt[] = highs.map((t, m) => [x(m), y(t)]);
  const loPts: Pt[] = lows.map((t, m) => [x(m), y(t)]);

  const monthCell = plotW / 11 / 2;
  const gridTicks = [10, 20, 30, 40];

  // Area between the two curves.
  const fillPath =
    smoothPath(hiPts) +
    ` L ${loPts[11][0]},${loPts[11][1]} ` +
    smoothPath([...loPts].reverse()).replace(/^M/, 'L') +
    ' Z';

  // Day–night gap measure — same month, honest.
  const gx = x(gapMonth);
  const gy1 = y(highs[gapMonth]);
  const gy2 = y(lows[gapMonth]);
  const gapAnchor = gapMonth > 8 ? 'end' : 'start';
  const gapTx = gapMonth > 8 ? gx - 10 : gx + 10;

  // Trough annotation.
  const trx = x(troughMonth);
  const trY = y(lows[troughMonth]);

  const monthLabels = locale === 'es' ? ES_MONTHS : locale === 'ja' ? JA_MONTHS : MONTHS;
  const ry = PAD_T + plotH + 56;
  const ariaLabel = `Monthly day and night temperatures in ${cityName}`;

  return (
    <div className={variant === 'inline' ? 'climate-signature climate-signature--inline' : 'climate-signature'}>
      <div className="climate-signature__title" aria-hidden="true">
        {title}
      </div>

      {copy.descriptors && (
        <div className="climate-signature__descriptors">
          {descriptorNodes(copy.descriptors)}
        </div>
      )}

      <div className="climate-signature__chart">
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={ariaLabel}>
          {/* season band(s) — quiet */}
          {season.spans.map(([a, b], i) => {
            const x0 = a === 0 ? PAD_L : x(a) - monthCell;
            const x1 = b === 11 ? W - PAD_R : x(b) + monthCell;
            const rx = Math.max(PAD_L, x0);
            const rw = Math.min(W - PAD_R, x1) - rx;
            return (
              <rect
                key={`band${i}`}
                x={rx}
                y={PAD_T - 8}
                width={rw}
                height={plotH + 16}
                fill="rgba(160,138,82,.07)"
              />
            );
          })}

          {/* gridlines + degree labels */}
          {gridTicks.map((t) => (
            <g key={`grid${t}`}>
              <line
                x1={PAD_L}
                y1={y(t)}
                x2={W - PAD_R}
                y2={y(t)}
                stroke="rgba(20,36,59,.10)"
                strokeWidth={1}
              />
              <text
                x={PAD_L - 8}
                y={y(t) + 3.5}
                textAnchor="end"
                fontFamily="var(--font-source-serif-4), sans-serif"
                fontSize={10}
                fill="rgba(20,36,59,.45)"
              >
                {t}°
              </text>
            </g>
          ))}

          {/* fill + curves */}
          <path d={fillPath} fill="rgba(20,36,59,.055)" stroke="none" />
          <path
            d={smoothPath(loPts)}
            fill="none"
            stroke="rgba(20,36,59,.45)"
            strokeWidth={1.25}
          />
          <path d={smoothPath(hiPts)} fill="none" stroke="#14243B" strokeWidth={1.75} />

          {/* day–night gap measure */}
          <line x1={gx} y1={gy1 + 5} x2={gx} y2={gy2 - 5} stroke="#A08A52" strokeWidth={1} />
          <line x1={gx - 4} y1={gy1 + 5} x2={gx + 4} y2={gy1 + 5} stroke="#A08A52" strokeWidth={1} />
          <line x1={gx - 4} y1={gy2 - 5} x2={gx + 4} y2={gy2 - 5} stroke="#A08A52" strokeWidth={1} />
          {copy.gapText && (
            <text
              x={gapTx}
              y={(gy1 + gy2) / 2 + 4}
              textAnchor={gapAnchor}
              fontFamily="var(--font-cormorant), Georgia, serif"
              fontStyle="italic"
              fontSize={15}
              fill="#14243B"
            >
              {copy.gapText}
            </text>
          )}

          {/* trough annotation */}
          <circle cx={trx} cy={trY} r={3} fill="rgba(20,36,59,.55)" />
          {copy.troughText && (
            <text
              x={troughMonth < 2 ? trx + 8 : trx}
              y={trY + 20}
              textAnchor={troughMonth < 2 ? 'start' : 'middle'}
              fontFamily="var(--font-cormorant), Georgia, serif"
              fontStyle="italic"
              fontSize={15}
              fill="rgba(20,36,59,.7)"
            >
              {copy.troughText}
            </text>
          )}

          {/* month letters — in-season tinted gold */}
          {monthLabels.map((mm, m) => {
            const on = inAnySpan(m, season.spans);
            return (
              <text
                key={`mo${m}`}
                x={x(m)}
                y={PAD_T + plotH + 20}
                textAnchor="middle"
                fontFamily="var(--font-source-serif-4), sans-serif"
                fontSize={10.5}
                letterSpacing={2}
                fontWeight={on ? 500 : 400}
                fill={on ? '#A08A52' : 'rgba(20,36,59,.45)'}
              >
                {mm}
              </text>
            );
          })}

          {/* season label */}
          {copy.seasonLabel && (
            <text
              x={PAD_L}
              y={PAD_T + plotH + 40}
              fontFamily="var(--font-source-serif-4), sans-serif"
              fontSize={9.5}
              letterSpacing={2.2}
              fill="#A08A52"
            >
              {copy.seasonLabel}
            </text>
          )}

          {/* rain row */}
          {hasRain && (
            <>
              <text
                x={PAD_L}
                y={ry + 4}
                fontFamily="var(--font-source-serif-4), sans-serif"
                fontSize={9.5}
                letterSpacing={1.5}
                fill="rgba(20,36,59,.5)"
              >
                {copy.rainLabel}
              </text>
              {rain!.flatMap((d, m) =>
                Array.from({ length: d }, (_, i) => {
                  const col = i % 4;
                  const row = Math.floor(i / 4);
                  return (
                    <circle
                      key={`r${m}-${i}`}
                      cx={x(m) - 6 + col * 4}
                      cy={ry + row * 4 - 2}
                      r={1.4}
                      fill="rgba(20,36,59,.5)"
                    />
                  );
                }),
              )}
            </>
          )}
        </svg>
      </div>

      {copy.caption && <div className="climate-signature__caption">{copy.caption}</div>}
    </div>
  );
}
