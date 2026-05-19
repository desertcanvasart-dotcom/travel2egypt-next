/**
 * Locked kind → section mapping (s52 + s56 STOP gate).
 *
 * `kind` is the editorial source of truth in front-matter.
 * `section` is derived at write time — never authored in MD.
 */

import type { Kind, Section } from './types.js';

export const KIND_TO_SECTION: Readonly<Record<Kind, Section>> = {
  signature: 'others',
  heritage: 'introducing',
  'transport-to': 'plan-your-trip',
  climate: 'plan-your-trip',
  'transport-around': 'while-you-are-there',
  accommodation: 'while-you-are-there',
  food: 'while-you-are-there',
  tours: 'while-you-are-there',
  attraction: 'places-to-go',
  events: 'others',
  overview: 'others',
} as const;

export function sectionForKind(kind: Kind): Section {
  return KIND_TO_SECTION[kind];
}
