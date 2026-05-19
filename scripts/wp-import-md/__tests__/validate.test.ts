/**
 * Cross-locale validation tests.
 */

import { crossLocaleValidate } from '../validate.js';
import type { LocaleTriplet, ParsedFile } from '../types.js';
import { makeAsserter } from './_assert.js';

function fmOf(slug: string, city: string, kind: string, locale: 'en' | 'es' | 'ja'): ParsedFile {
  return {
    filePath: `/fake/${city}/${slug}.${locale}.md`,
    fm: {
      slug,
      city,
      kind: kind as any,
      locale,
      title: `T ${locale}`,
      description: `D ${locale}`,
    },
    body: '',
  };
}

export async function run(): Promise<boolean> {
const { ok, eq, done } = makeAsserter('validate');

// Full trilingual happy path
{
  const triplet: LocaleTriplet = {
    city: 'luxor',
    slug: 'vot',
    files: {
      en: fmOf('vot', 'luxor', 'attraction', 'en'),
      es: fmOf('vot', 'luxor', 'attraction', 'es'),
      ja: fmOf('vot', 'luxor', 'attraction', 'ja'),
    },
  };
  const r = crossLocaleValidate(triplet);
  eq(r.errors.length, 0, 'trilingual: no errors');
  eq(r.missingLocales, [], 'trilingual: no missing');
  eq(r.skipNoEn, false, 'trilingual: not skipped');
}

// EN-only — locale-incomplete warn
{
  const triplet: LocaleTriplet = {
    city: 'luxor',
    slug: 'htr',
    files: { en: fmOf('htr', 'luxor', 'transport-to', 'en') },
  };
  const r = crossLocaleValidate(triplet);
  eq(r.errors.length, 0, 'EN-only: no errors');
  eq(r.missingLocales.sort(), ['es', 'ja'], 'EN-only: missing es+ja flagged');
  eq(r.skipNoEn, false, 'EN-only: not skipped (EN present)');
}

// ES orphan, no EN — skip
{
  const triplet: LocaleTriplet = {
    city: 'luxor',
    slug: 'orphan',
    files: { es: fmOf('orphan', 'luxor', 'attraction', 'es') },
  };
  const r = crossLocaleValidate(triplet);
  ok(r.skipNoEn, 'orphan ES skips');
  ok(
    r.errors.some((e) => e.message.includes('orphan locale')),
    'orphan ES surfaces error'
  );
}

// Kind mismatch
{
  const triplet: LocaleTriplet = {
    city: 'luxor',
    slug: 'vot',
    files: {
      en: fmOf('vot', 'luxor', 'attraction', 'en'),
      es: fmOf('vot', 'luxor', 'food', 'es'),
    },
  };
  const r = crossLocaleValidate(triplet);
  ok(
    r.errors.some((e) => e.field === 'kind'),
    'kind mismatch surfaces error'
  );
}

return done();
}
