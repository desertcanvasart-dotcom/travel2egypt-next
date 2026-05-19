/**
 * Front-matter parser + validator.
 *
 * Consumes one .md file's content. Returns a typed FmFields record on
 * success, or a list of ValidationErrors. Pure — no I/O beyond what the
 * caller provides.
 */

import matter from 'gray-matter';

import { KINDS, LOCALES, type FmFields, type Kind, type Locale, type ValidationError } from './types.js';

export interface ParseResult {
  fm: FmFields | null;
  body: string;
  errors: ValidationError[];
}

/**
 * Parse one .md file's raw text. `filePath` is used for error messages.
 * The file path is also cross-checked against the FM `slug`/`locale` —
 * mismatches surface as validation errors.
 */
export function parseFrontMatter(
  filePath: string,
  raw: string,
  pathFacts?: { city?: string; slug?: string; locale?: string }
): ParseResult {
  const errors: ValidationError[] = [];
  let parsed: matter.GrayMatterFile<string>;
  try {
    parsed = matter(raw);
  } catch (e) {
    errors.push({
      file: filePath,
      message: `YAML parse failed: ${(e as Error).message}`,
    });
    return { fm: null, body: raw, errors };
  }

  const data = parsed.data as Record<string, unknown>;

  const require = (field: string): string | null => {
    const v = data[field];
    if (v === undefined || v === null || v === '') {
      errors.push({ file: filePath, field, message: `required field "${field}" missing` });
      return null;
    }
    if (typeof v !== 'string') {
      errors.push({ file: filePath, field, message: `field "${field}" must be a string` });
      return null;
    }
    return v;
  };

  const slug = require('slug');
  const city = require('city');
  const kindRaw = require('kind');
  const localeRaw = require('locale');
  const title = require('title');
  const description = require('description');

  // Enum validation (best-effort even when earlier requires failed).
  let kind: Kind | null = null;
  if (kindRaw !== null) {
    if ((KINDS as readonly string[]).includes(kindRaw)) {
      kind = kindRaw as Kind;
    } else {
      errors.push({
        file: filePath,
        field: 'kind',
        message: `kind "${kindRaw}" not in 11-value enum (${KINDS.join(', ')})`,
      });
    }
  }

  let locale: Locale | null = null;
  if (localeRaw !== null) {
    if ((LOCALES as readonly string[]).includes(localeRaw)) {
      locale = localeRaw as Locale;
    } else {
      errors.push({
        file: filePath,
        field: 'locale',
        message: `locale "${localeRaw}" must be one of ${LOCALES.join(', ')}`,
      });
    }
  }

  // Lowercase-hyphen format checks.
  if (slug !== null && !/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(slug)) {
    errors.push({ file: filePath, field: 'slug', message: `slug "${slug}" must be lowercase-hyphenated` });
  }
  if (city !== null && !/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(city)) {
    errors.push({ file: filePath, field: 'city', message: `city "${city}" must be lowercase-hyphenated` });
  }

  // File-path agreement (if caller supplied path facts).
  if (pathFacts) {
    if (pathFacts.city && city && pathFacts.city !== city) {
      errors.push({
        file: filePath,
        field: 'city',
        message: `front-matter city "${city}" does not match directory "${pathFacts.city}"`,
      });
    }
    if (pathFacts.slug && slug && pathFacts.slug !== slug) {
      errors.push({
        file: filePath,
        field: 'slug',
        message: `front-matter slug "${slug}" does not match filename "${pathFacts.slug}"`,
      });
    }
    if (pathFacts.locale && locale && pathFacts.locale !== locale) {
      errors.push({
        file: filePath,
        field: 'locale',
        message: `front-matter locale "${locale}" does not match filename "${pathFacts.locale}"`,
      });
    }
  }

  // Optional fields — type coercion (best-effort).
  const heroImage = typeof data.heroImage === 'string' ? data.heroImage : undefined;
  const excerpt = typeof data.excerpt === 'string' ? data.excerpt : undefined;
  const lastUpdated = typeof data.lastUpdated === 'string' ? data.lastUpdated : undefined;
  const keywordsRaw = data.keywords;
  let keywords: string[] | undefined;
  if (keywordsRaw !== undefined) {
    if (Array.isArray(keywordsRaw) && keywordsRaw.every((k) => typeof k === 'string')) {
      keywords = keywordsRaw as string[];
    } else {
      errors.push({ file: filePath, field: 'keywords', message: 'keywords must be a list of strings' });
    }
  }

  if (errors.length > 0 || !slug || !city || !kind || !locale || !title || !description) {
    return { fm: null, body: parsed.content, errors };
  }

  return {
    fm: {
      slug,
      city,
      kind,
      locale,
      title,
      description,
      heroImage,
      excerpt,
      keywords,
      lastUpdated,
    },
    body: parsed.content,
    errors,
  };
}
