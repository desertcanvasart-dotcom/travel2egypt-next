/**
 * Run-scope decision for the WordPress importer.
 *
 * Background — session 5 Step 8 incident: the importer was invoked with
 *   `--filter-by-template destination-hub --slug-pattern '*-travel-guide' --slug-exclude 'egypt-travel-guide'`
 * expecting to narrow to 41 city hub pages. Actual scope: 41 city + 489
 * article + 19 editorialCategory + 163 translation.metadata. The filter
 * only narrowed the page enumeration; posts and categories ran
 * unconditionally because `--type` defaults to `'all'`.
 *
 * This module concentrates that bug class into one pure function:
 * `decideScope(cli) → { runCategories, runPosts, runPages, postFilter,
 * pageFilter }`. The wp-import.ts orchestrator dispatches off the result
 * instead of the legacy `cli.type === 'all' || …` checks. Easy to test in
 * isolation; impossible to silently drift between diff and write paths.
 */

import type { PageType } from '../wp-classifier.js';
import type { CliOptions } from './types.js';

export type RunType = 'post' | 'page' | 'attachment' | 'category' | 'both' | 'all';

export interface ScopePlan {
  runCategories: boolean;
  runPosts: boolean;
  runPages: boolean;
  /** When set, posts that don't classify to this template are skipped. */
  postTemplateFilter: PageType | null;
  /** When set, pages that don't classify to this template are skipped. */
  pageTemplateFilter: PageType | null;
  /** Human-readable scope summary for run-start logging. */
  summary: string;
}

/**
 * Validate that `cli.type` and `cli.filterByTemplate` are coherent. Throws on
 * misuse. The single most important check: `--filter-by-template` requires an
 * explicit `--type=page|post|both`, never silent `'all'`.
 */
export function validateScopeFlags(cli: Pick<CliOptions, 'type' | 'filterByTemplate'>): void {
  const validTypes: RunType[] = ['post', 'page', 'attachment', 'category', 'both', 'all'];
  if (!validTypes.includes(cli.type as RunType)) {
    throw new ScopeFlagError(`--type must be one of ${validTypes.join(' | ')} (got "${cli.type}")`);
  }
  if (cli.filterByTemplate) {
    const allowedWithTemplate: RunType[] = ['post', 'page', 'both'];
    if (!allowedWithTemplate.includes(cli.type as RunType)) {
      throw new ScopeFlagError(
        `--filter-by-template requires --type=page|post|both (got "${cli.type}"). ` +
          `Without an explicit --type, categories and other corpora would run ` +
          `unconditionally — the session 5 Step 8 scope-anomaly trap.`
      );
    }
  }
}

/** Marker error class; main() can catch and print without a stack trace. */
export class ScopeFlagError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ScopeFlagError';
  }
}

/**
 * Decide which corpora to run and what filters to apply. Pure function —
 * unit-testable without WP or Sanity clients. Caller is responsible for
 * having already passed validateScopeFlags.
 */
export function decideScope(
  cli: Pick<CliOptions, 'type' | 'filterByTemplate'>
): ScopePlan {
  const type = cli.type as RunType;
  const template = cli.filterByTemplate ?? null;

  let runCategories: boolean;
  let runPosts: boolean;
  let runPages: boolean;

  if (template) {
    // Template filter is set → categories never run (categories don't have templates).
    // Posts/pages run iff explicitly requested.
    runCategories = false;
    runPosts = type === 'post' || type === 'both';
    runPages = type === 'page' || type === 'both';
  } else {
    // Legacy behavior preserved when no template filter: --type controls everything.
    // `both` is treated as pages + posts even without a template filter.
    runCategories = type === 'all' || type === 'category';
    runPosts = type === 'all' || type === 'post' || type === 'both';
    runPages = type === 'all' || type === 'page' || type === 'both';
  }

  // The template filter applies to whichever corpora are enabled.
  const postTemplateFilter = template && runPosts ? template : null;
  const pageTemplateFilter = template && runPages ? template : null;

  const willRun = [
    runPages ? `pages${pageTemplateFilter ? ` (template=${pageTemplateFilter})` : ''}` : null,
    runPosts ? `posts${postTemplateFilter ? ` (template=${postTemplateFilter})` : ''}` : null,
    runCategories ? 'categories' : null,
  ].filter(Boolean);
  const willSkip = [
    runPages ? null : 'pages',
    runPosts ? null : 'posts',
    runCategories ? null : 'categories',
    'attachments',
  ].filter(Boolean);

  const flagLine = template
    ? `--filter-by-template=${template} --type=${type}`
    : `--type=${type}`;
  const summary =
    `[wp-import] scope:\n` +
    `  ${flagLine}\n` +
    `  Will iterate: ${willRun.length ? willRun.join(', ') : '(nothing)'}\n` +
    `  Will skip:    ${willSkip.join(', ')}`;

  return { runCategories, runPosts, runPages, postTemplateFilter, pageTemplateFilter, summary };
}
