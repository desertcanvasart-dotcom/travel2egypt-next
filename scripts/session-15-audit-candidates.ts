/**
 * Session 15 Step 1 — Pre-import audit.
 *
 * Pulls all EN pages from WP, runs each through the canonical
 * `classifyPageBySlug`, filters tour-or-package, excludes the 12 already-imported,
 * splits dayTour vs package using the mapper's slug-pattern logic, and writes
 * the canonical candidate list + a summary.
 *
 * Output: migration/sessions/session-15-audit/candidates.json + .md
 */

import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

import { classifyPageBySlug } from './wp-classifier.js';
import { loadEnv } from './wp-import/env.js';
import { WpClient } from './wp-import/wp-client.js';

interface WpPageLite {
  id: number;
  slug: string;
  title: { rendered: string };
}

const ALREADY_IMPORTED_WP_IDS = new Set<number>([
  112993, 115573, 146018, 156421, 156539, 87438, 87764, 88169, 89353, 89438,
  89452, 89558,
]);

function daysFromSlug(slug: string): number {
  const m = /^(\d+)-?days?-/.exec(slug) ?? /(\d+)-day-/.exec(slug);
  return m ? Number(m[1]) : 0;
}

function classifyTourType(slug: string): 'dayTour' | 'package' {
  const isPackage =
    /-package(-|$)|-vacation(-|$)|-itinerary(-|$)|cruise-vacation/.test(slug) ||
    daysFromSlug(slug) > 7;
  return isPackage ? 'package' : 'dayTour';
}

async function main() {
  const env = loadEnv();
  const wp = new WpClient(env, 4);

  console.log('Fetching all EN pages from WP source...');
  const allPages = await wp.getPaginated<WpPageLite>('/wp-json/wp/v2/pages', {
    lang: 'en',
    status: 'publish',
    _fields: 'id,slug,title',
  });
  console.log(`  total EN publish pages: ${allPages.length}`);

  const tourOrPackage = allPages
    .map((p) => ({ p, c: classifyPageBySlug(p.slug) }))
    .filter((x) => x.c.type === 'tour-or-package');

  const alreadyImported = tourOrPackage.filter((x) => ALREADY_IMPORTED_WP_IDS.has(x.p.id));
  const candidates = tourOrPackage.filter((x) => !ALREADY_IMPORTED_WP_IDS.has(x.p.id));

  const dayTours = candidates.filter((x) => classifyTourType(x.p.slug) === 'dayTour');
  const packages = candidates.filter((x) => classifyTourType(x.p.slug) === 'package');

  const privateDay = dayTours.filter((x) => /-private-car-and-guide$/.test(x.p.slug));
  const otherDay = dayTours.filter((x) => !/-private-car-and-guide$/.test(x.p.slug));

  console.log('');
  console.log(`tour-or-package total: ${tourOrPackage.length}`);
  console.log(`  already imported:    ${alreadyImported.length}`);
  console.log(`  bulk-import target:  ${candidates.length}`);
  console.log(`    dayTour:           ${dayTours.length}`);
  console.log(`      private-car-and-guide: ${privateDay.length}`);
  console.log(`      other day tours:       ${otherDay.length}`);
  console.log(`    package:           ${packages.length}`);

  // Confidence breakdown
  const conf = { high: 0, med: 0, low: 0 } as Record<string, number>;
  for (const x of candidates) conf[x.c.confidence]++;
  console.log('');
  console.log(`Confidence breakdown of candidates:`);
  console.log(`  high: ${conf.high}`);
  console.log(`  med:  ${conf.med}`);
  console.log(`  low:  ${conf.low}`);

  const outDir = join(process.cwd(), 'migration/sessions/session-15-audit');
  mkdirSync(outDir, { recursive: true });

  const candidatesOut = candidates.map((x) => ({
    wpId: x.p.id,
    slug: x.p.slug,
    title: x.p.title?.rendered ?? '',
    type: classifyTourType(x.p.slug),
    mode: /-private-car-and-guide$/.test(x.p.slug) ? 'private' : undefined,
    classifierReason: x.c.reason,
    confidence: x.c.confidence,
    durationDays: daysFromSlug(x.p.slug) || undefined,
  }));
  writeFileSync(join(outDir, 'candidates.json'), JSON.stringify(candidatesOut, null, 2));

  // Markdown summary
  const md: string[] = [];
  md.push('# Session 15 — Candidate Inventory');
  md.push('');
  md.push(`Generated: ${new Date().toISOString()}`);
  md.push(`Source: live WP REST + scripts/wp-classifier.ts \`classifyPageBySlug\``);
  md.push('');
  md.push('## Counts');
  md.push('');
  md.push('| Bucket | Count |');
  md.push('|---|---:|');
  md.push(`| EN pages total | ${allPages.length} |`);
  md.push(`| Classified \`tour-or-package\` | ${tourOrPackage.length} |`);
  md.push(`| Already imported (session 14 baseline) | ${alreadyImported.length} |`);
  md.push(`| **Bulk-import candidates** | **${candidates.length}** |`);
  md.push(`| → dayTour | ${dayTours.length} |`);
  md.push(`|   • \`*-private-car-and-guide\` | ${privateDay.length} |`);
  md.push(`|   • other day tours | ${otherDay.length} |`);
  md.push(`| → package | ${packages.length} |`);
  md.push('');
  md.push('## Confidence (classifier)');
  md.push('');
  md.push(`high: ${conf.high} | med: ${conf.med} | low: ${conf.low}`);
  md.push('');

  function sampleList(label: string, arr: typeof candidates, n = 25) {
    md.push(`## ${label} (${arr.length})`);
    md.push('');
    md.push('| WP ID | Slug | Title | Days | Reason | Conf |');
    md.push('|---:|---|---|---:|---|---|');
    for (const x of arr.slice(0, n)) {
      const days = daysFromSlug(x.p.slug);
      md.push(
        `| ${x.p.id} | \`${x.p.slug}\` | ${(x.p.title?.rendered ?? '').replace(/\|/g, '\\|')} | ${days || ''} | ${x.c.reason.replace(/\|/g, '\\|')} | ${x.c.confidence} |`
      );
    }
    if (arr.length > n) md.push(`| _… +${arr.length - n} more_ | | | | | |`);
    md.push('');
  }

  sampleList('Day tours — private-car-and-guide', privateDay, 30);
  sampleList('Day tours — other (will get tourMode=group)', otherDay, 30);
  sampleList('Packages', packages, 30);

  writeFileSync(join(outDir, 'candidates.md'), md.join('\n'));
  console.log('');
  console.log(`Wrote ${outDir}/candidates.json`);
  console.log(`Wrote ${outDir}/candidates.md`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
