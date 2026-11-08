import { parse } from 'node-html-parser';
import repairs from '../migration/seo-repairs-2026-09-22.json';

// Read-only GET checks. Before deployment, --skip-restored checks destinations
// already live. After deployment, the default also checks the seven restored pages.
const args = process.argv.slice(2);
const baseArg = args.find((arg) => arg.startsWith('--base-url='));
const base = new URL(baseArg?.slice('--base-url='.length) ?? 'https://travel2egypt.org');
if (!['http:', 'https:'].includes(base.protocol) || base.username || base.password) {
  throw new Error('base-url must be an HTTP(S) origin without credentials');
}
const skipRestored = args.includes('--skip-restored');
const paths = [...new Set([
  ...repairs.redirects.map((row) => row.destination),
  ...(skipRestored ? [] : repairs.restoredRoutes),
])];
const normalize = (path: string) => decodeURIComponent(path).replace(/\/$/, '') || '/';
const failures: Array<{ path: string; problem: string }> = [];
let cursor = 0;
let checked = 0;

async function worker() {
  while (cursor < paths.length) {
    const path = paths[cursor++];
    try {
      const response = await fetch(new URL(path, base), {
        redirect: 'manual', signal: AbortSignal.timeout(30000),
        headers: { 'User-Agent': 'Travel2Egypt-Migration-Validation/1.0' },
      });
      if (response.status !== 200) throw new Error(`HTTP ${response.status}${response.headers.get('location') ? ` → ${response.headers.get('location')}` : ''}`);
      const html = parse(await response.text());
      const canonicals = html.querySelectorAll('link[rel="canonical"]');
      if (canonicals.length !== 1) throw new Error(`expected one canonical, found ${canonicals.length}`);
      const canonical = new URL(canonicals[0].getAttribute('href') ?? '', base);
      if (canonical.origin !== 'https://travel2egypt.org' || normalize(canonical.pathname) !== normalize(path)) throw new Error(`unexpected canonical: ${canonical.href}`);
      const robots = html.querySelectorAll('meta[name="robots"],meta[name="googlebot"]').map((meta) => meta.getAttribute('content') ?? '').join(',');
      if (/noindex/i.test(robots)) throw new Error('HTML contains noindex');
      // Preview hosts deliberately have X-Robots-Tag: noindex. Production must not.
      if (base.hostname === 'travel2egypt.org' && /noindex/i.test(response.headers.get('x-robots-tag') ?? '')) throw new Error('production X-Robots-Tag contains noindex');
    } catch (error) {
      failures.push({ path, problem: error instanceof Error ? error.message : String(error) });
    }
    checked++;
    if (checked % 50 === 0) console.log(`Checked ${checked}/${paths.length}`);
  }
}

async function main() {
  await Promise.all([worker(), worker(), worker()]);
  for (const row of failures) console.error(`${row.path}: ${row.problem}`);
  console.log(`${paths.length - failures.length}/${paths.length} destinations passed HTTP, canonical and indexability checks${skipRestored ? ' (restored routes excluded until preview/deployment)' : ''}.`);
  if (failures.length) process.exitCode = 1;
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
