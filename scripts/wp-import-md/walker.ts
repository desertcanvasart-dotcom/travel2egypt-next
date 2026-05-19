/**
 * File walker: globs `<dir>/<city>/<slug>.<locale>.md`, groups by (city, slug).
 *
 * - Lives below a base directory (defaults to content/destinations).
 * - Ignores anything not matching the naming pattern.
 * - `images/` subfolders are not walked (handled by md-to-pt + image-uploader).
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { basename, dirname, join, relative } from 'node:path';

import { parseFrontMatter } from './frontmatter.js';
import type { LocaleTriplet, ParsedFile, ValidationError } from './types.js';
import { LOCALES, type Locale } from './types.js';

export interface WalkResult {
  triplets: LocaleTriplet[];
  errors: ValidationError[];
  filesScanned: number;
}

interface FilenameParse {
  slug: string;
  locale: Locale;
}

/** Match `<slug>.<locale>.md` where locale ∈ {en,es,ja}. */
function parseFilename(filename: string): FilenameParse | null {
  const m = /^(.+)\.(en|es|ja)\.md$/.exec(filename);
  if (!m) return null;
  return { slug: m[1], locale: m[2] as Locale };
}

function listMdFiles(rootDir: string): string[] {
  const out: string[] = [];
  const visit = (dir: string) => {
    let entries: string[];
    try {
      entries = readdirSync(dir);
    } catch {
      return;
    }
    for (const e of entries) {
      if (e.startsWith('.')) continue;
      if (e === 'images' || e === '_images' || e === '_assets') continue;
      const p = join(dir, e);
      const s = statSync(p);
      if (s.isDirectory()) visit(p);
      else if (s.isFile() && e.endsWith('.md')) out.push(p);
    }
  };
  visit(rootDir);
  return out.sort();
}

export interface WalkOpts {
  /** Optional filter: only process this city slug. */
  city?: string;
  /** Optional filter: only process this page slug. */
  slug?: string;
  /** Optional filter: only process this locale's files. */
  locale?: Locale;
}

export function walk(rootDir: string, opts: WalkOpts = {}): WalkResult {
  const errors: ValidationError[] = [];
  const files = listMdFiles(rootDir);
  const byKey = new Map<string, LocaleTriplet>();

  for (const file of files) {
    const filename = basename(file);
    const filenameParse = parseFilename(filename);
    if (!filenameParse) {
      errors.push({
        file,
        message: `filename does not match <slug>.<locale>.md pattern (locale ∈ en|es|ja)`,
      });
      continue;
    }
    const cityDir = basename(dirname(file));

    if (opts.city && cityDir !== opts.city) continue;
    if (opts.slug && filenameParse.slug !== opts.slug) continue;
    if (opts.locale && filenameParse.locale !== opts.locale) continue;

    let raw: string;
    try {
      raw = readFileSync(file, 'utf8');
    } catch (e) {
      errors.push({ file, message: `read failed: ${(e as Error).message}` });
      continue;
    }

    const parsed = parseFrontMatter(file, raw, {
      city: cityDir,
      slug: filenameParse.slug,
      locale: filenameParse.locale,
    });
    if (parsed.errors.length > 0) errors.push(...parsed.errors);
    if (!parsed.fm) continue;

    const key = `${parsed.fm.city}/${parsed.fm.slug}`;
    const parsedFile: ParsedFile = { filePath: file, fm: parsed.fm, body: parsed.body };
    const existing = byKey.get(key);
    if (existing) {
      if (existing.files[parsed.fm.locale]) {
        errors.push({
          file,
          message: `duplicate locale ${parsed.fm.locale} for ${key} (also in ${existing.files[parsed.fm.locale]!.filePath})`,
        });
        continue;
      }
      existing.files[parsed.fm.locale] = parsedFile;
    } else {
      byKey.set(key, {
        city: parsed.fm.city,
        slug: parsed.fm.slug,
        files: { [parsed.fm.locale]: parsedFile },
      });
    }
    void relative; // silence unused-import lint
  }

  return {
    triplets: [...byKey.values()].sort((a, b) =>
      a.city === b.city ? a.slug.localeCompare(b.slug) : a.city.localeCompare(b.city)
    ),
    errors,
    filesScanned: files.length,
  };
}

export { LOCALES };
