/**
 * Front-matter parser + validator tests.
 */

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { parseFrontMatter } from '../frontmatter.js';
import { makeAsserter } from './_assert.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '__fixtures__');

export async function run(): Promise<boolean> {
const { ok, eq, done } = makeAsserter('frontmatter');

// Happy path
{
  const file = join(ROOT, 'content/luxor/valley-of-the-kings.en.md');
  const result = parseFrontMatter(file, readFileSync(file, 'utf8'), {
    city: 'luxor',
    slug: 'valley-of-the-kings',
    locale: 'en',
  });
  eq(result.errors, [], 'happy path emits no errors');
  ok(result.fm !== null, 'happy path returns fm');
  eq(result.fm?.kind, 'attraction', 'kind parsed');
  eq(result.fm?.city, 'luxor', 'city parsed');
  eq(result.fm?.slug, 'valley-of-the-kings', 'slug parsed');
  eq(result.fm?.locale, 'en', 'locale parsed');
  eq(result.fm?.title, 'Valley of the Kings', 'title parsed');
  eq(result.fm?.heroImage, './images/valley-of-the-kings-hero.jpg', 'heroImage parsed');
  eq(result.fm?.keywords?.length, 3, 'keywords array parsed');
}

// Invalid kind
{
  const file = join(ROOT, 'content/aswan/unknown-kind.en.md');
  const result = parseFrontMatter(file, readFileSync(file, 'utf8'), {
    city: 'aswan',
    slug: 'unknown-kind',
    locale: 'en',
  });
  ok(result.fm === null, 'invalid kind blocks fm');
  ok(
    result.errors.some((e) => e.field === 'kind' && e.message.includes('11-value enum')),
    'invalid kind surfaces enum-range error'
  );
}

// Path-vs-fm mismatch
{
  const raw = `---
slug: foo
city: luxor
kind: attraction
locale: en
title: T
description: D
---
body`;
  const result = parseFrontMatter('/fake/valley-of-the-kings.en.md', raw, {
    city: 'luxor',
    slug: 'valley-of-the-kings',
    locale: 'en',
  });
  ok(
    result.errors.some((e) => e.field === 'slug' && e.message.includes('does not match filename')),
    'fm slug mismatch with filename surfaces'
  );
}

// Missing required field
{
  const raw = `---
city: luxor
kind: attraction
locale: en
title: T
description: D
---
body`;
  const result = parseFrontMatter('/fake/x.en.md', raw);
  ok(result.fm === null, 'missing slug blocks fm');
  ok(
    result.errors.some((e) => e.field === 'slug' && e.message.includes('required')),
    'missing slug surfaces required error'
  );
}

return done();
}
