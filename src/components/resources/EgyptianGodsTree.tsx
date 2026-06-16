import { Fragment } from 'react';

/**
 * Tree node shape — the minimum the layout + drawing logic needs. Phase 2's
 * side panel will extend this with the editorial fields.
 */
export interface DeityNode {
  _id: string;
  name: string;
  transliteration?: string | null;
  treeRole: TreeRole;
  isOnSpine: boolean;
  parentIds?: string[] | null;
  spouseId?: string | null;
  childIds?: string[] | null;
}

export type TreeRole =
  | 'primordial'
  | 'firstGeneration'
  | 'secondGeneration'
  | 'thirdGeneration'
  | 'fourthGeneration'
  | 'solarChild'
  | 'alternateCreator'
  | 'independent'
  | 'folkDeity'
  | 'experimental';

const VIEW_W = 1100;
const VIEW_H = 980;

const SPINE_X = VIEW_W / 2;
const SPINE_Y: Record<string, number> = {
  primordial: 90,
  firstGeneration: 235,
  secondGeneration: 380,
  thirdGeneration: 525,
  fourthGeneration: 720,
};

const SPINE_SLOTS_X = 180; // horizontal spacing between siblings on the spine
const OFF_LEFT_X = 230;
const OFF_RIGHT_X = 880;
const SOLAR_Y_START = 200;
const INDEP_Y_START = 540;
const ALT_Y_START = 120;
const OFF_SPACING = 140;
const BOTTOM_Y = 880;
const FOLK_X_START = 200;
const EXPER_X_START = 660;
const BOTTOM_SPACING = 150;

const R_SPINE = 38;
const R_OFF = 30;

const SPINE_ROLES: TreeRole[] = [
  'primordial',
  'firstGeneration',
  'secondGeneration',
  'thirdGeneration',
  'fourthGeneration',
];

interface Position {
  x: number;
  y: number;
  r: number;
}

/**
 * Deterministic layout — pure function of (treeRole, isOnSpine) plus the
 * count of deities in each role. Adding a new deity to the dataset
 * automatically slots it in; nothing here needs editing.
 */
function layout(deities: DeityNode[]): Map<string, Position> {
  const positions = new Map<string, Position>();
  const byRole: Record<string, DeityNode[]> = {};
  for (const d of deities) {
    (byRole[d.treeRole] ||= []).push(d);
  }
  // Stable order inside a role: spine first, then alpha by name.
  for (const role in byRole) {
    byRole[role].sort((a, b) => {
      if (a.isOnSpine !== b.isOnSpine) return a.isOnSpine ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
  }

  // ── Spine generations — centered on SPINE_X, siblings distributed
  for (const role of SPINE_ROLES) {
    const group = byRole[role] || [];
    const y = SPINE_Y[role];
    if (!group.length) continue;
    if (group.length === 1) {
      positions.set(group[0]._id, { x: SPINE_X, y, r: R_SPINE });
    } else {
      const total = (group.length - 1) * SPINE_SLOTS_X;
      const startX = SPINE_X - total / 2;
      group.forEach((d, i) => {
        positions.set(d._id, {
          x: startX + i * SPINE_SLOTS_X,
          y,
          r: d.isOnSpine ? R_SPINE : R_OFF,
        });
      });
    }
  }

  // ── Solar children — right column upper, stacked vertically
  (byRole.solarChild || []).forEach((d, i) =>
    positions.set(d._id, { x: OFF_RIGHT_X, y: SOLAR_Y_START + i * OFF_SPACING, r: R_OFF })
  );

  // ── Independent — right column lower
  (byRole.independent || []).forEach((d, i) =>
    positions.set(d._id, { x: OFF_RIGHT_X, y: INDEP_Y_START + i * OFF_SPACING, r: R_OFF })
  );

  // ── Alternate creators — left column, parallel to the spine top
  (byRole.alternateCreator || []).forEach((d, i) =>
    positions.set(d._id, { x: OFF_LEFT_X, y: ALT_Y_START + i * OFF_SPACING, r: R_OFF })
  );

  // ── Folk deities — bottom-left horizontal
  (byRole.folkDeity || []).forEach((d, i) =>
    positions.set(d._id, { x: FOLK_X_START + i * BOTTOM_SPACING, y: BOTTOM_Y, r: R_OFF })
  );

  // ── Experimental — bottom-right horizontal
  (byRole.experimental || []).forEach((d, i) =>
    positions.set(d._id, { x: EXPER_X_START + i * BOTTOM_SPACING, y: BOTTOM_Y, r: R_OFF })
  );

  return positions;
}

/**
 * Where on a circle's edge a line should land — so connectors stop at the
 * portrait outline rather than tunneling through it.
 */
function edgePoint(from: Position, to: Position, radius: number) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const len = Math.hypot(dx, dy) || 1;
  return { x: from.x + (dx / len) * radius, y: from.y + (dy / len) * radius };
}

export function EgyptianGodsTree({ deities }: { deities: DeityNode[] }) {
  const positions = layout(deities);

  // ── Lines ──────────────────────────────────────────────────────────
  const parentLines: Array<{ key: string; x1: number; y1: number; x2: number; y2: number }> = [];
  const spouseLines: Array<{ key: string; x1: number; y1: number; x2: number; y2: number }> = [];

  for (const d of deities) {
    const pos = positions.get(d._id);
    if (!pos) continue;

    // Parent → child solid line. Drawn from the child end so the dataset
    // doesn't need symmetric children[] on parents.
    for (const pid of d.parentIds || []) {
      const ppos = positions.get(pid);
      if (!ppos) continue;
      const from = edgePoint(ppos, pos, ppos.r);
      const to = edgePoint(pos, ppos, pos.r);
      parentLines.push({
        key: `p-${pid}-${d._id}`,
        x1: from.x,
        y1: from.y,
        x2: to.x,
        y2: to.y,
      });
    }

    // Spouse dashed line — render once per pair, on the lexicographically
    // smaller _id end.
    if (d.spouseId && d._id < d.spouseId) {
      const spos = positions.get(d.spouseId);
      if (spos) {
        const from = edgePoint(pos, spos, pos.r);
        const to = edgePoint(spos, pos, spos.r);
        spouseLines.push({
          key: `s-${d._id}-${d.spouseId}`,
          x1: from.x,
          y1: from.y,
          x2: to.x,
          y2: to.y,
        });
      }
    }
  }

  // ── Nodes ──────────────────────────────────────────────────────────
  return (
    <div className="egt-shell">
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        xmlns="http://www.w3.org/2000/svg"
        className="egt-svg"
        role="img"
        aria-label="Egyptian gods family tree — Heliopolitan spine with secondary deities placed around it"
      >
        {/* Connector lines render first so node circles overlay them. */}
        <g className="egt-edges">
          {parentLines.map((l) => (
            <line
              key={l.key}
              x1={l.x1}
              y1={l.y1}
              x2={l.x2}
              y2={l.y2}
              stroke="var(--gold)"
              strokeWidth={1.25}
              opacity={0.55}
            />
          ))}
          {spouseLines.map((l) => (
            <line
              key={l.key}
              x1={l.x1}
              y1={l.y1}
              x2={l.x2}
              y2={l.y2}
              stroke="var(--gold)"
              strokeWidth={1.25}
              strokeDasharray="5 5"
              opacity={0.65}
            />
          ))}
        </g>

        {/* Nodes */}
        <g className="egt-nodes">
          {deities.map((d) => {
            const pos = positions.get(d._id);
            if (!pos) return null;
            return (
              <Fragment key={d._id}>
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={pos.r}
                  fill="var(--paper-warm, #f4eede)"
                  stroke="var(--navy)"
                  strokeWidth={d.isOnSpine ? 1.5 : 1}
                  className={d.isOnSpine ? 'egt-node egt-node--spine' : 'egt-node'}
                />
                <text
                  x={pos.x}
                  y={pos.y + pos.r + 22}
                  textAnchor="middle"
                  className={d.isOnSpine ? 'egt-name egt-name--spine' : 'egt-name'}
                >
                  {d.name}
                </text>
                {d.transliteration ? (
                  <text
                    x={pos.x}
                    y={pos.y + pos.r + 38}
                    textAnchor="middle"
                    className="egt-translit"
                  >
                    {d.transliteration}
                  </text>
                ) : null}
              </Fragment>
            );
          })}
        </g>
      </svg>
    </div>
  );
}

/**
 * Mobile fallback — vertical stack grouped by tree role. The spec is
 * explicit: don't shrink the desktop layout, restructure for vertical
 * reading. Used in place of the SVG below the small-screen breakpoint.
 */
export function EgyptianGodsTreeMobile({
  deities,
  roleLabels,
}: {
  deities: DeityNode[];
  roleLabels: Record<TreeRole, string>;
}) {
  const ROLE_ORDER: TreeRole[] = [
    'primordial',
    'firstGeneration',
    'secondGeneration',
    'thirdGeneration',
    'fourthGeneration',
    'solarChild',
    'alternateCreator',
    'independent',
    'folkDeity',
    'experimental',
  ];
  const byRole: Record<string, DeityNode[]> = {};
  for (const d of deities) (byRole[d.treeRole] ||= []).push(d);

  return (
    <div className="egt-stack">
      {ROLE_ORDER.map((role) => {
        const group = byRole[role];
        if (!group?.length) return null;
        return (
          <section key={role} className="egt-stack__group">
            <h3 className="egt-stack__label">{roleLabels[role]}</h3>
            <ul className="egt-stack__list">
              {group.map((d) => (
                <li
                  key={d._id}
                  className={d.isOnSpine ? 'egt-stack__item egt-stack__item--spine' : 'egt-stack__item'}
                >
                  <div className="egt-stack__portrait" aria-hidden="true" />
                  <div className="egt-stack__meta">
                    <span className="egt-stack__name">{d.name}</span>
                    {d.transliteration ? (
                      <span className="egt-stack__translit">{d.transliteration}</span>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
