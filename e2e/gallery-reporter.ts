/**
 * Writes the design-review gallery: one row per page and language, phone and desktop
 * screenshots side by side, with the checks' result and notes under each. The page sits
 * at reports/page-health/gallery.html with its screenshots in shots/ beside it (one
 * folder: open it from the CI download, unzipped, or locally).
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import type { Reporter, TestCase, TestResult } from '@playwright/test/reporter';

interface Cell { status: string; png?: Buffer; notes: string[]; errors: string[]; url?: string }

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

export default class GalleryReporter implements Reporter {
  private rows = new Map<string, Map<string, Cell>>();
  private projects = new Set<string>();
  constructor(private opts: { outputFile: string }) {}

  onTestEnd(test: TestCase, result: TestResult) {
    const project = test.parent.project()?.name ?? 'default';
    this.projects.add(project);
    const row = this.rows.get(test.title) ?? new Map<string, Cell>();
    this.rows.set(test.title, row);
    const shot = [...result.attachments].reverse().find((a) => a.name === 'page' && a.body);
    row.set(project, {
      status: result.status,
      png: shot?.body,
      url: test.annotations.find((a) => a.type === 'url')?.description,
      notes: test.annotations.filter((a) => a.type.startsWith('note')).map((a) => `${a.type.replace('note: ', '')}: ${a.description}`),
      errors: result.errors.map((e) => (e.message ?? '').split('\n')[0].replace(/\x1b\[[0-9;]*m/g, '')),
    });
  }

  onEnd() {
    const dir = dirname(this.opts.outputFile);
    mkdirSync(join(dir, 'shots'), { recursive: true });
    const slug = (t: string) => t.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const projects = [...this.projects].sort((a, b) => (a === 'phone' ? -1 : b === 'phone' ? 1 : a.localeCompare(b)));
    let failed = 0, noted = 0;
    const rows = [...this.rows.entries()].map(([title, cells]) => {
      const tds = projects.map((p) => {
        const c = cells.get(p);
        if (!c) return '<td></td>';
        if (c.status !== 'passed') failed++;
        if (c.notes.length) noted++;
        let img = '<p class="none">no screenshot</p>';
        if (c.png) {
          const file = `shots/${slug(title)}-${p}.jpg`;
          writeFileSync(join(dir, file), c.png);
          img = `<a href="${file}" target="_blank"><img loading="lazy" src="${file}" alt="${esc(title)} — ${p}"></a>`;
        }
        return `<td><div class="badge ${c.status === 'passed' ? 'ok' : 'bad'}">${p}: ${c.status === 'passed' ? 'checks pass' : 'FAILED'}</div>${img}${c.errors.map((e) => `<p class="err">${esc(e)}</p>`).join('')}${c.notes.map((n) => `<p class="note">${esc(n)}</p>`).join('')}</td>`;
      }).join('');
      const url = [...cells.values()].find((c) => c.url)?.url ?? '';
      return `<tr><th><span>${esc(title)}</span><code>${esc(url)}</code></th>${tds}</tr>`;
    }).join('\n');
    const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Page health gallery</title><style>
:root{--bg:#fff;--fg:#1d2433;--muted:#5b6475;--line:#e3e6ec;--ok:#1f7a4d;--bad:#b42318;--note:#8a5a00}
@media (prefers-color-scheme:dark){:root{--bg:#12151c;--fg:#e8eaef;--muted:#a3abba;--line:#2a2f3a;--ok:#5cc99a;--bad:#ff8a7a;--note:#f2c46d}}
body{margin:0;padding:16px;background:var(--bg);color:var(--fg);font:14px/1.45 system-ui,sans-serif}
h1{font-size:20px;margin:0 0 4px}.sum{color:var(--muted);margin:0 0 16px}
table{border-collapse:collapse;width:100%}th,td{border-top:1px solid var(--line);vertical-align:top;padding:12px 8px;text-align:left}
th{width:220px}th span{display:block;font-weight:600}th code{display:block;color:var(--muted);font-size:12px;word-break:break-all;margin-top:4px}
td img{display:block;max-width:100%;max-height:900px;object-fit:cover;object-position:top;border:1px solid var(--line);border-radius:6px}
.badge{font-size:12px;font-weight:600;margin-bottom:6px}.ok{color:var(--ok)}.bad{color:var(--bad)}
.err{color:var(--bad);font-size:12px;margin:6px 0 0}.note{color:var(--note);font-size:12px;margin:6px 0 0}
@media (max-width:700px){th{width:auto}tr{display:block}th,td{display:block}}
</style></head><body><h1>Page health gallery</h1><p class="sum">${new Date().toISOString().slice(0, 16).replace('T', ' ')} UTC · ${this.rows.size} pages × ${projects.length} widths · ${failed} failed · ${noted} with notes. Click a screenshot for full size.</p><table>${rows}</table></body></html>`;
    writeFileSync(this.opts.outputFile, html);
    console.log(`\ngallery → ${this.opts.outputFile}`);
  }
}
