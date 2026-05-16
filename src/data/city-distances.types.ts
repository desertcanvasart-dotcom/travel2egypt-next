/**
 * Source-of-truth schema for src/data/city-distances.json.
 * Operator-curated route table; 104 entries across 25 cities and three
 * regions (Nile Valley, Eastern Desert, Sinai Peninsula).
 *
 * Each entry encodes one direction (A → B). The frontend expands to
 * bidirectional pairs at render time via expandToBothDirections().
 */
export type DistanceRegion = 'Nile Valley' | 'Eastern Desert' | 'Sinai Peninsula';

export type DistanceRoute = {
  from: string;
  to: string;
  distance_km: number;
  /** Reference value from source data — frontend recomputes from
   *  user-configurable speed. Format: `Xh YYm`. */
  estimated_drive_time: string;
  notes: DistanceRegion;
};

export type DistancesData = {
  routes: DistanceRoute[];
};
