import { readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';

const DIR = '/private/tmp/claude-501/-Users-islamhussein-t2e/5e23d53e-3e9f-4209-b183-1d60cdabe3f8/scratchpad/alt';
const N = parseInt(process.argv[2] || '24', 10);

const wl = JSON.parse(readFileSync(`${DIR}/worklist.json`, 'utf8'));
const todo = wl.entries.filter((e: any) => !e.done).slice(0, N);

async function main() {
rmSync(`${DIR}/img`, { recursive: true, force: true });
mkdirSync(`${DIR}/img`, { recursive: true });

const picked: any[] = [];
let i = 0;
for (const e of todo) {
  const file = `img/${i}.jpg`;
  const res = await fetch(`${e.url}?w=1000&q=70&fit=max`);
  const buf = Buffer.from(await res.arrayBuffer());
  writeFileSync(`${DIR}/${file}`, buf);
  const langs = [...new Set(e.docs.map((d: any) => d.lang))];
  picked.push({ i, ref: e.ref, file, altMode: e.altMode, ctx: e.docs[0]?.ctx, types: [...new Set(e.docs.map((d: any) => d.type))], langs, nDocs: e.docs.length });
  i++;
}
writeFileSync(`${DIR}/batch.json`, JSON.stringify({ picked }, null, 2));

const remaining = wl.entries.filter((e: any) => !e.done).length;
console.log(`Batch of ${picked.length} downloaded. Remaining undone: ${remaining} / ${wl.entries.length}`);
for (const p of picked) console.log(`#${p.i} [${p.altMode}] ${p.types.join(',')} | ${p.nDocs} doc(s) ${JSON.stringify(p.langs)} | ${p.ctx ?? '(no title)'}`);
}
main();
