/**
 * Phase 1 redirect verification.
 *
 * For every Phase 1 source URL in every locale (docs/phase1/inventory.csv):
 *   - live row in migration/redirect-map.csv → the URL must answer 301/308 without
 *     following redirects, its Location must be the row's final target, and the
 *     target must answer 200 (so there is no chain);
 *   - "ship after publish" / cross-domain comment row → not live yet: the source
 *     must still answer 200, and (in-site) the planned target must already be 200;
 *   - no row at all → reported.
 *
 * Usage: npx tsx scripts/phase1-verify.ts [--base http://localhost:3000]
 * Exit code 1 if any check fails.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const argBase = process.argv.indexOf('--base');
const BASE = (argBase > -1 ? process.argv[argBase + 1] : 'http://localhost:3000').replace(/\/$/, '');

type Row = { from: string; to: string; locale: string; state: 'live' | 'after-publish' | 'cross-domain'; task?: string };

function norm(p: string): string {
  const path = p.replace(/^https?:\/\/(www\.)?travel2egypt\.org/, '');
  return path.length > 1 ? path.replace(/\/$/, '') : path;
}

function readMap(): Map<string, Row> {
  const rows = new Map<string, Row>();
  const lines = readFileSync(join(ROOT, 'migration/redirect-map.csv'), 'utf8').split(/\r?\n/).slice(1);
  for (const line of lines) {
    if (!line) continue;
    let state: Row['state'] = 'live';
    let body = line;
    let task: string | undefined;
    if (line.startsWith('#')) {
      const m = line.match(/^# PHASE1-(SHIP-AFTER-PUBLISH|CROSS-DOMAIN) task=(\d+)(?: \([^)]*\))?: (.*)$/);
      if (!m) continue;
      state = m[1] === 'CROSS-DOMAIN' ? 'cross-domain' : 'after-publish';
      task = m[2];
      body = m[3];
    }
    const [from, to, locale] = body.split(',');
    const key = `${locale} ${norm(from)}`;
    // a live row wins over a commented one for the same source
    if (!rows.has(key) || state === 'live') rows.set(key, { from: norm(from), to: norm(to), locale, state, task });
  }
  return rows;
}

function readInventory(): Array<{ task: string; url: string; locale: string }> {
  const [header, ...lines] = readFileSync(join(ROOT, 'docs/phase1/inventory.csv'), 'utf8').trim().split(/\r?\n/);
  const cols = header.split(',');
  const out = [];
  for (const line of lines) {
    const cells = line.match(/("([^"]|"")*"|[^,]*)(,|$)/g)!.map((c) => c.replace(/,$/, '').replace(/^"|"$/g, ''));
    const r = Object.fromEntries(cols.map((c, i) => [c, cells[i]]));
    if (r.role === 'source' && r.url && !r.url.includes('(none)')) out.push({ task: r.task, url: r.url, locale: r.locale });
  }
  return out;
}

async function head(path: string): Promise<{ status: number; location: string | null }> {
  const url = /^https?:/.test(path) ? path : BASE + encodeURI(path);
  const res = await fetch(url, { redirect: 'manual' });
  const loc = res.headers.get('location');
  return { status: res.status, location: loc ? decodeURI(loc.replace(BASE, '').replace(/^https?:\/\/[^/]+(?=\/)/, '')) : null };
}

async function main() {
  const map = readMap();
  const sources = readInventory();
  const seen = new Set<string>();
  let fail = 0;
  const out: string[] = [`Phase 1 redirect verification against ${BASE} — ${new Date().toISOString()}`, ''];
  for (const s of sources) {
    const key = `${s.locale} ${norm(s.url)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const row = map.get(key);
    const tag = `task ${s.task.padEnd(2)} ${s.locale}  ${s.url}`;
    if (!row) {
      out.push(`?    ${tag}  no redirect row (cross-domain move: this locale needs a decision)`);
      continue;
    }
    const src = await head(s.url);
    if (row.state === 'live') {
      const okStatus = src.status === 301 || src.status === 308;
      const okLoc = src.location === row.to;
      const tgt = okLoc ? await head(row.to) : { status: 0, location: null };
      const ok = okStatus && okLoc && tgt.status === 200;
      if (!ok) fail++;
      out.push(
        `${ok ? 'PASS' : 'FAIL'} ${tag}  → ${src.status} ${src.location ?? '-'}` +
          (okLoc ? `  target ${tgt.status}${tgt.location ? ' → ' + tgt.location + ' (chain)' : ''}` : `  expected ${row.to}`)
      );
    } else {
      const inSite = row.state === 'after-publish';
      const tgt = inSite ? await head(row.to) : { status: 0, location: null };
      const ok = src.status === 200 && (!inSite || tgt.status === 200);
      if (!ok) fail++;
      out.push(
        `${ok ? 'HOLD' : 'FAIL'} ${tag}  ${row.state} (task ${row.task}): source ${src.status}` +
          (inSite ? `, planned target ${row.to} ${tgt.status}` : `, planned ${row.to}`)
      );
    }
  }
  out.push('', `${fail} failure(s). PASS = live redirect verified; HOLD = waiting on publish or on the destination site.`);
  console.log(out.join('\n'));
  process.exit(fail ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
