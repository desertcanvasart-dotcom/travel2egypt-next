/**
 * kind → section lookup table tests.
 *
 * Locks the 11 mappings from the s56 STOP gate. If any of these change,
 * the test should change in the same commit.
 */

import { KIND_TO_SECTION, sectionForKind } from '../kind-to-section.js';
import { KINDS } from '../types.js';
import { makeAsserter } from './_assert.js';

export async function run(): Promise<boolean> {
const { ok, eq, done } = makeAsserter('kind-to-section');

eq(sectionForKind('signature'), 'others', 'signature → others');
eq(sectionForKind('heritage'), 'introducing', 'heritage → introducing');
eq(sectionForKind('transport-to'), 'plan-your-trip', 'transport-to → plan-your-trip');
eq(sectionForKind('climate'), 'plan-your-trip', 'climate → plan-your-trip');
eq(sectionForKind('transport-around'), 'while-you-are-there', 'transport-around → while-you-are-there');
eq(sectionForKind('accommodation'), 'while-you-are-there', 'accommodation → while-you-are-there');
eq(sectionForKind('food'), 'while-you-are-there', 'food → while-you-are-there');
eq(sectionForKind('tours'), 'while-you-are-there', 'tours → while-you-are-there');
eq(sectionForKind('attraction'), 'places-to-go', 'attraction → places-to-go');
eq(sectionForKind('events'), 'others', 'events → others');
eq(sectionForKind('overview'), 'others', 'overview → others');

ok(Object.keys(KIND_TO_SECTION).length === KINDS.length, '11 kind values all mapped (no gaps)');
for (const k of KINDS) {
  ok(KIND_TO_SECTION[k] !== undefined, `${k} has a section`);
}

return done();
}
