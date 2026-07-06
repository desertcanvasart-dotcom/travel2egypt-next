import { readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
const DIR = '/private/tmp/claude-501/-Users-islamhussein-t2e/5e23d53e-3e9f-4209-b183-1d60cdabe3f8/scratchpad/alt';
const wl = JSON.parse(readFileSync(`${DIR}/worklist.json`, 'utf8'));
const todo = wl.entries.filter((e: any) => !e.done).map((e: any) => ({
  ref: e.ref, url: e.url, altMode: e.altMode,
  ctx: (e.docs.find((d: any) => d.ctx)?.ctx) || '',
}));
rmSync(`${DIR}/wf`, { recursive: true, force: true });
mkdirSync(`${DIR}/wf`, { recursive: true });
writeFileSync(`${DIR}/wf-input.json`, JSON.stringify(todo));
console.log('wf-input items:', todo.length);
