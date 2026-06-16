import { Fragment } from 'react';

/**
 * Tree node shape — the minimum the layout + drawing logic needs. Phase 2's
 * side panel will extend this with the editorial fields. The optional
 * `isPlaceholder` marks deities not yet in Sanity — they render muted +
 * italic with a dotted outline, so the spine structure is visible even
 * while Shu/Tefnut/Geb/Nut are still to be seeded.
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
  isPlaceholder?: boolean;
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
  firstGeneration: 240,
  secondGeneration: 390,
  thirdGeneration: 540,
  fourthGeneration: 720,
};

const SPINE_SLOTS_X = 180;
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

// Unified node radius — spine vs non-spine is signalled by a ring,
// not by size, so the visual hierarchy is restrained and deliberate
// rather than scalar.
const NODE_R = 34;
const SPINE_RING_OFFSET = 6;

const SPINE_ROLES: TreeRole[] = [
  'primordial',
  'firstGeneration',
  'secondGeneration',
  'thirdGeneration',
  'fourthGeneration',
];

/**
 * Heliopolitan spine placeholders — Shu/Tefnut (1st generation),
 * Geb/Nut (2nd generation). Rendered in the visualization but NOT in
 * Sanity, so editors don't see them in Studio and Phase 2's content
 * pass replaces them with real documents. Relationships link Atum →
 * Shu+Tefnut → Geb+Nut → the seeded Osiris+Isis so the spine reads as
 * structurally complete instead of stranded.
 */
const PLACEHOLDER_DEITIES: DeityNode[] = [
  {
    _id: 'p-shu',
    name: 'Shu',
    transliteration: 'Šw',
    treeRole: 'firstGeneration',
    isOnSpine: true,
    parentIds: ['deity-atum'],
    spouseId: 'p-tefnut',
    childIds: ['p-geb', 'p-nut'],
    isPlaceholder: true,
  },
  {
    _id: 'p-tefnut',
    name: 'Tefnut',
    transliteration: 'Tfnwt',
    treeRole: 'firstGeneration',
    isOnSpine: true,
    parentIds: ['deity-atum'],
    spouseId: 'p-shu',
    childIds: ['p-geb', 'p-nut'],
    isPlaceholder: true,
  },
  {
    _id: 'p-geb',
    name: 'Geb',
    transliteration: 'Gb',
    treeRole: 'secondGeneration',
    isOnSpine: true,
    parentIds: ['p-shu', 'p-tefnut'],
    spouseId: 'p-nut',
    childIds: ['deity-osiris', 'deity-isis'],
    isPlaceholder: true,
  },
  {
    _id: 'p-nut',
    name: 'Nut',
    transliteration: 'Nwt',
    treeRole: 'secondGeneration',
    isOnSpine: true,
    parentIds: ['p-shu', 'p-tefnut'],
    spouseId: 'p-geb',
    childIds: ['deity-osiris', 'deity-isis'],
    isPlaceholder: true,
  },
];

interface Position {
  x: number;
  y: number;
}

/**
 * Deterministic layout — pure function of (treeRole, isOnSpine) plus
 * the count of deities in each role. Adding a new deity to the dataset
 * automatically slots it in.
 */
function layout(deities: DeityNode[]): Map<string, Position> {
  const positions = new Map<string, Position>();
  const byRole: Record<string, DeityNode[]> = {};
  for (const d of deities) {
    (byRole[d.treeRole] ||= []).push(d);
  }
  // Stable order: spine first, then alpha by name.
  for (const role in byRole) {
    byRole[role].sort((a, b) => {
      if (a.isOnSpine !== b.isOnSpine) return a.isOnSpine ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
  }

  for (const role of SPINE_ROLES) {
    const group = byRole[role] || [];
    const y = SPINE_Y[role];
    if (!group.length) continue;
    if (group.length === 1) {
      positions.set(group[0]._id, { x: SPINE_X, y });
    } else {
      const total = (group.length - 1) * SPINE_SLOTS_X;
      const startX = SPINE_X - total / 2;
      group.forEach((d, i) => {
        positions.set(d._id, { x: startX + i * SPINE_SLOTS_X, y });
      });
    }
  }

  (byRole.solarChild || []).forEach((d, i) =>
    positions.set(d._id, { x: OFF_RIGHT_X, y: SOLAR_Y_START + i * OFF_SPACING })
  );
  (byRole.independent || []).forEach((d, i) =>
    positions.set(d._id, { x: OFF_RIGHT_X, y: INDEP_Y_START + i * OFF_SPACING })
  );
  (byRole.alternateCreator || []).forEach((d, i) =>
    positions.set(d._id, { x: OFF_LEFT_X, y: ALT_Y_START + i * OFF_SPACING })
  );
  (byRole.folkDeity || []).forEach((d, i) =>
    positions.set(d._id, { x: FOLK_X_START + i * BOTTOM_SPACING, y: BOTTOM_Y })
  );
  (byRole.experimental || []).forEach((d, i) =>
    positions.set(d._id, { x: EXPER_X_START + i * BOTTOM_SPACING, y: BOTTOM_Y })
  );

  return positions;
}

/**
 * Where on a circle's edge a line should land — so connectors stop at
 * the portrait outline rather than tunneling through it.
 */
function edgePoint(from: Position, to: Position, radius: number) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const len = Math.hypot(dx, dy) || 1;
  return { x: from.x + (dx / len) * radius, y: from.y + (dy / len) * radius };
}

export function EgyptianGodsTree({ deities }: { deities: DeityNode[] }) {
  // Merge real deities with the Heliopolitan spine placeholders so the
  // tree reads as structurally complete. Placeholders never collide with
  // real docs (their _ids are `p-*` not `deity-*`).
  const all = [...deities, ...PLACEHOLDER_DEITIES];
  const positions = layout(all);
  const byId = new Map(all.map((d) => [d._id, d] as const));

  // ── Lines ──────────────────────────────────────────────────────────
  // Walk both directions (parents on the child + children on the parent)
  // and de-dupe so the placeholder spine pulls in lines the seeded data
  // can't supply yet (Osiris/Isis have no parentIds in Sanity, but the
  // placeholder Geb/Nut declare them as children).
  type Edge = {
    key: string;
    a: string;
    b: string;
    kind: 'parent' | 'spouse';
    placeholder: boolean;
  };
  const edges: Edge[] = [];
  const seen = new Set<string>();

  const addEdge = (a: string, b: string, kind: 'parent' | 'spouse') => {
    if (!positions.has(a) || !positions.has(b)) return;
    // For parent lines, order is parent → child and matters; for spouse
    // lines, order is irrelevant so canonicalise to dedupe.
    const key =
      kind === 'spouse'
        ? `s-${[a, b].sort().join('-')}`
        : `p-${a}-${b}`;
    if (seen.has(key)) return;
    seen.add(key);
    const ph =
      !!byId.get(a)?.isPlaceholder || !!byId.get(b)?.isPlaceholder;
    edges.push({ key, a, b, kind, placeholder: ph });
  };

  for (const d of all) {
    for (const pid of d.parentIds || []) addEdge(pid, d._id, 'parent');
    for (const cid of d.childIds || []) addEdge(d._id, cid, 'parent');
    if (d.spouseId) addEdge(d._id, d.spouseId, 'spouse');
  }

  return (
    <div className="egt-shell">
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        xmlns="http://www.w3.org/2000/svg"
        className="egt-svg"
        role="img"
        aria-label="Egyptian gods family tree — Heliopolitan spine with secondary deities placed around it"
      >
        <g className="egt-edges">
          {edges.map((edge) => {
            const aPos = positions.get(edge.a)!;
            const bPos = positions.get(edge.b)!;
            const from = edgePoint(aPos, bPos, NODE_R);
            const to = edgePoint(bPos, aPos, NODE_R);
            // Real-deity lines: bold gold, fully visible. Placeholder-
            // involved lines: muted + dotted so the structure reads as
            // "scaffolding" rather than as confirmed relationships.
            const stroke = 'var(--gold)';
            const strokeWidth = edge.placeholder ? 1 : 1.75;
            const opacity = edge.placeholder ? 0.42 : 1;
            const dasharray =
              edge.kind === 'spouse'
                ? '6 4'
                : edge.placeholder
                  ? '2 5'
                  : undefined;
            return (
              <line
                key={edge.key}
                x1={from.x}
                y1={from.y}
                x2={to.x}
                y2={to.y}
                stroke={stroke}
                strokeWidth={strokeWidth}
                opacity={opacity}
                strokeDasharray={dasharray}
                strokeLinecap="round"
              />
            );
          })}
        </g>

        <g className="egt-nodes">
          {all.map((d) => {
            const pos = positions.get(d._id);
            if (!pos) return null;
            const ph = d.isPlaceholder;
            return (
              <Fragment key={d._id}>
                {/* Spine ring — drawn first so the node circle covers
                    the inner edge cleanly. Only on the spine; on
                    placeholders the ring also dims. */}
                {d.isOnSpine ? (
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r={NODE_R + SPINE_RING_OFFSET}
                    fill="none"
                    stroke="var(--gold)"
                    strokeWidth={1}
                    opacity={ph ? 0.32 : 0.85}
                  />
                ) : null}
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={NODE_R}
                  fill="var(--paper-warm, #f4eede)"
                  stroke="var(--navy)"
                  strokeWidth={1}
                  strokeDasharray={ph ? '2 4' : undefined}
                  opacity={ph ? 0.45 : 1}
                  className={ph ? 'egt-node egt-node--placeholder' : 'egt-node'}
                />
                <text
                  x={pos.x}
                  y={pos.y + NODE_R + 22}
                  textAnchor="middle"
                  className={
                    ph
                      ? 'egt-name egt-name--placeholder'
                      : d.isOnSpine
                        ? 'egt-name egt-name--spine'
                        : 'egt-name'
                  }
                  fontStyle={ph ? 'italic' : undefined}
                  opacity={ph ? 0.55 : 1}
                >
                  {d.name}
                </text>
                {d.transliteration ? (
                  <text
                    x={pos.x}
                    y={pos.y + NODE_R + 40}
                    textAnchor="middle"
                    className="egt-translit"
                    opacity={ph ? 0.55 : 1}
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
 * reading.
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

  // Same merge as desktop — placeholder spine deities flesh out the
  // empty generations so the role headings read as a complete spine
  // rather than skipping straight from Primordial to Third generation.
  const all = [...deities, ...PLACEHOLDER_DEITIES];
  const byRole: Record<string, DeityNode[]> = {};
  for (const d of all) (byRole[d.treeRole] ||= []).push(d);

  return (
    <div className="egt-stack">
      {ROLE_ORDER.map((role) => {
        const group = byRole[role];
        if (!group?.length) return null;
        return (
          <section key={role} className="egt-stack__group">
            <h3 className="egt-stack__label">{roleLabels[role]}</h3>
            <ul className="egt-stack__list">
              {group.map((d) => {
                const ph = d.isPlaceholder;
                const cls = [
                  'egt-stack__item',
                  d.isOnSpine ? 'egt-stack__item--spine' : '',
                  ph ? 'egt-stack__item--placeholder' : '',
                ]
                  .filter(Boolean)
                  .join(' ');
                return (
                  <li key={d._id} className={cls}>
                    <div className="egt-stack__portrait" aria-hidden="true" />
                    <div className="egt-stack__meta">
                      <span className="egt-stack__name">{d.name}</span>
                      {d.transliteration ? (
                        <span className="egt-stack__translit">
                          {d.transliteration}
                        </span>
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
