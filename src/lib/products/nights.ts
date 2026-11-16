/**
 * Panel "Nights" (multi-day itinerary format, 2026-11-16): computed from the
 * days' overnights, never from a stored figure. Each night is grouped as a
 * hotel, sleeper-train, river (cruise, dahabiya, felucca) or camp night.
 * Anything not recognised as train, river or camp counts as a hotel night.
 * Client-safe (pure).
 */
export type NightKind = 'hotel' | 'train' | 'river' | 'camp';

const TRAIN_RE = /sleeper|train|tren|literas|寝台|列車/i;
const RIVER_RE = /cruise|nile|dahabiya|dahabeya|river|boat|felucca|ship|crucero|barco|río|クルーズ|ダハビヤ|フェルッカ|船/i;
const CAMP_RE = /camp|tent|campamento|キャンプ|テント/i;

export function nightKind(overnight: string): NightKind {
  if (TRAIN_RE.test(overnight)) return 'train';
  if (RIVER_RE.test(overnight)) return 'river';
  if (CAMP_RE.test(overnight)) return 'camp';
  return 'hotel';
}

export type NightCounts = Record<NightKind, number> & { total: number };

export function countNights(overnights: Array<string | null | undefined>): NightCounts {
  const out: NightCounts = { hotel: 0, train: 0, river: 0, camp: 0, total: 0 };
  for (const o of overnights) {
    const v = (o ?? '').trim();
    if (!v || v === '—' || v === '-') continue;
    out[nightKind(v)] += 1;
    out.total += 1;
  }
  return out;
}

/** The parts to show, in a fixed order, skipping zero counts. */
export function nightParts(c: NightCounts): Array<{ kind: NightKind; n: number }> {
  return (['hotel', 'train', 'river', 'camp'] as const).filter((k) => c[k] > 0).map((k) => ({ kind: k, n: c[k] }));
}
