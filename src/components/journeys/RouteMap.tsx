import { PLACES, type PlaceKey } from '@/lib/places/coords';
import type { JLocale } from '@/lib/journeys/registry';

/**
 * Journey route map (Phase B, 2026-11-10): a simplified inline-SVG outline
 * of Egypt with the Nile, and the approved stops joined in order. No map
 * library, tiles or requests.
 *
 * Legs: product `routeLegs` (travel mode per leg) does not exist yet, so the
 * route is one plain line with no mode labels — nothing is guessed. When it
 * exists, pass `legs` (one per hop) for dashed/solid styles and labels.
 */

// Equirectangular projection, x scaled by cos(27°) so Egypt keeps its shape.
const LON0 = 24.4;
const LAT1 = 32.1;
const K = 40; // px per degree (latitude)
const KX = K * Math.cos((27 * Math.PI) / 180);
const W = Math.round((37.3 - LON0) * KX);
const H = Math.round((LAT1 - 21.6) * K);
const px = (lon: number, lat: number) => [Math.round((lon - LON0) * KX * 10) / 10, Math.round((LAT1 - lat) * K * 10) / 10] as const;
const path = (pts: Array<[number, number]>, close = false) =>
  pts.map(([lon, lat], i) => `${i ? 'L' : 'M'}${px(lon, lat).join(' ')}`).join('') + (close ? 'Z' : '');

// Simplified national outline (lon, lat): Mediterranean coast, Gaza/Israel
// border, Sinai, the Red Sea coast, then the 22°N and 25°E borders.
const OUTLINE: Array<[number, number]> = [
  [25.15, 31.57], [26.5, 31.5], [27.24, 31.35], [28.95, 30.83], [29.9, 31.2], [30.4, 31.45], [31.0, 31.58],
  [31.8, 31.5], [32.3, 31.27], [33.8, 31.13], [34.22, 31.3], [34.9, 29.5], [34.6, 28.9], [34.4, 28.1],
  [34.25, 27.75], [33.75, 28.4], [33.2, 29.2], [32.6, 29.93], [32.45, 29.85], [32.6, 29.3], [33.1, 28.35],
  [33.6, 27.6], [33.85, 27.15], [33.94, 26.75], [34.28, 26.1], [34.9, 25.07], [35.5, 24.0], [35.6, 23.6],
  [35.6, 23.1], [36.0, 22.6], [36.9, 22.0], [31.3, 22.0], [25.0, 22.0], [25.0, 29.5], [24.9, 30.4], [25.15, 31.57],
];
// The Nile from Lake Nasser to the two Delta branches.
const NILE: Array<[number, number]> = [
  [31.4, 22.0], [31.9, 22.7], [32.6, 23.4], [32.9, 24.09], [32.93, 24.45], [32.87, 24.98], [32.55, 25.29],
  [32.64, 25.69], [32.72, 26.16], [32.24, 26.05], [31.7, 26.55], [31.18, 27.18], [30.75, 28.11], [31.1, 29.07],
  [31.24, 30.04], [31.1, 30.5],
];
const ROSETTA: Array<[number, number]> = [[31.1, 30.5], [30.7, 30.9], [30.4, 31.45]];
const DAMIETTA: Array<[number, number]> = [[31.1, 30.5], [31.4, 31.0], [31.8, 31.5]];

export interface RouteLeg {
  mode: 'train' | 'cruise' | 'flight' | 'road';
  label: string;
}

export function RouteMap({
  stops,
  locale,
  heading,
  ariaPrefix,
  legs,
}: {
  stops: PlaceKey[];
  locale: JLocale;
  heading: string;
  /** "Route: " / "Ruta: " / "ルート：" — the aria-label lead. */
  ariaPrefix: string;
  legs?: RouteLeg[] | null;
}) {
  if (stops.length < 2) return null;
  const pts = stops.map((s) => PLACES[s]);
  const names = stops.map((s) => PLACES[s].name[locale]);
  const arrow = ' → ';
  const aria = `${ariaPrefix}${names.join(arrow)}`;
  const unique = [...new Set(stops)];
  const useLegs = legs && legs.length === stops.length - 1 ? legs : null;

  return (
    <section className="section journey-route" aria-labelledby="h-journey-route">
      <div className="wrap wrap--wide">
        <h2 id="h-journey-route">{heading}</h2>
        <figure className="route-map">
          <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={aria} preserveAspectRatio="xMidYMid meet">
            <path className="rm-land" d={path(OUTLINE, true)} />
            <path className="rm-nile" d={path(NILE)} />
            <path className="rm-nile" d={path(ROSETTA)} />
            <path className="rm-nile" d={path(DAMIETTA)} />
            {pts.slice(1).map((b, i) => {
              const a = pts[i];
              const [x1, y1] = px(a.lon, a.lat);
              const [x2, y2] = px(b.lon, b.lat);
              // Legs bow gently so they never run through an intermediate stop:
              // outbound legs to the west, a return (to an earlier stop) to the east.
              const back = stops.indexOf(stops[i + 1]) < i + 1;
              const leg = useLegs?.[i];
              const cls = `rm-leg${leg ? ` rm-leg--${leg.mode}` : ''}`;
              const len = Math.hypot(x2 - x1, y2 - y1);
              const bow = Math.min(60, len * 0.22) * (back ? 1 : -1);
              const cx = (x1 + x2) / 2 + bow;
              const cy = (y1 + y2) / 2;
              const d = `M${x1} ${y1}Q${Math.round(cx)} ${Math.round(cy)} ${x2} ${y2}`;
              return (
                <g key={i}>
                  <path className={cls} d={d} />
                  {leg && (
                    <text className="rm-legLabel" x={cx + (back ? 8 : -8)} y={cy} textAnchor={back ? 'start' : 'end'}>
                      {leg.label}
                    </text>
                  )}
                </g>
              );
            })}
            {unique.map((s) => {
              const p = PLACES[s];
              const [x, y] = px(p.lon, p.lat);
              const order = stops.indexOf(s) + 1;
              return (
                <g key={s} className="rm-stop">
                  <circle cx={x} cy={y} r={7} />
                  <text className="rm-num" x={x} y={y + 3.5}>
                    {order}
                  </text>
                  <text className="rm-label" x={x - 12} y={y + 5}>
                    {p.name[locale]}
                  </text>
                </g>
              );
            })}
          </svg>
          <figcaption className="route-list" aria-hidden="true">{names.join(arrow)}</figcaption>
        </figure>
      </div>
    </section>
  );
}
