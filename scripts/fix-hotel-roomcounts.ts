/**
 * GROUP 4 — Well-supported room-count corrections only.
 *
 * Le Passage (wp-page-63665): EN says 194; ES & JA already say 424 (operator fact
 *   sheet). Bring EN into line — body spans + summary string.
 * Cairo Marriott (wp-page-62471): article says 1,060; official marriott.com = 1,087.
 *   Update EN body (×2) + JA body (×1). ES body doesn't state a count.
 *
 * HELD (sources conflict / confirm-before-publish): Pickalbatros 156→468,
 *   Casa Cook 100→129, Benben 24-vs-11, The Cascades 166→159.
 *
 * Span-level .text mutation for body (no _key regen) + keyed-path .set for summary.
 * Patches published + draft. Dry-run by default; --commit to write.
 */
import { createClient } from '@sanity/client';
import { config as loadEnv } from 'dotenv';
loadEnv();

type Rep = { find: string; replace: string };
type Job = {
  slug: string;
  body?: Record<string, Rep[]>;   // per-locale body span replacements
  summary?: Record<string, Rep[]>; // per-locale summary string replacements
};

const JOBS: Job[] = [
  {
    slug: 'le-passage-cairo-hotel-and-casino',
    body: { en: [{ find: '194 rooms', replace: '424 rooms' }, { find: '194-room', replace: '424-room' }] },
    summary: { en: [{ find: '194 rooms', replace: '424 rooms' }] },
  },
  {
    slug: 'cairo-marriott-hotel-and-omar-khayyam-casino',
    body: {
      en: [{ find: '1,060 rooms', replace: '1,087 rooms' }],
      ja: [{ find: '1,060室', replace: '1,087室' }],
    },
  },
];

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2024-12-01',
  useCdn: false,
  token: process.env.SANITY_STAGING_API_WRITE_TOKEN || process.env.SANITY_API_WRITE_TOKEN,
});

async function main() {
  const commit = process.argv.includes('--commit');
  if (process.env.NEXT_PUBLIC_SANITY_DATASET !== 'migration-staging') {
    throw new Error(`Refusing to run against dataset "${process.env.NEXT_PUBLIC_SANITY_DATASET}".`);
  }

  for (const job of JOBS) {
    const base = await client.fetch(
      `*[_type=="hotel" && slug[_key=="en"][0].value.current==$s][0]._id`, { s: job.slug });
    if (!base) { console.log(`\n## ${job.slug}\n   !! NOT FOUND`); continue; }
    const id = base.replace(/^drafts\./, '');
    console.log(`\n## ${job.slug}  (${id})`);

    for (const target of [id, `drafts.${id}`]) {
      const doc = await client.fetch(`*[_id==$id][0]{_id, body, "summary": summary}`, { id: target });
      if (!doc) { console.log(`   ${target}: (absent)`); continue; }
      let bodyChanged = false;
      const summarySet: Record<string, string> = {};

      // body span mutation
      for (const [loc, reps] of Object.entries(job.body || {})) {
        const entry = (doc.body || []).find((b: any) => b._key === loc);
        if (!entry || !Array.isArray(entry.value)) { console.log(`   ${target} body.${loc}: ✗ no body`); continue; }
        for (const r of reps) {
          let hits = 0;
          for (const block of entry.value) {
            if (block._type !== 'block' || !Array.isArray(block.children)) continue;
            for (const span of block.children) {
              if (typeof span.text === 'string' && span.text.includes(r.find)) {
                const n = span.text.split(r.find).length - 1;
                span.text = span.text.split(r.find).join(r.replace);
                hits += n; bodyChanged = true;
              }
            }
          }
          console.log(`   ${target} body.${loc}: ${hits > 0 ? '✓' : '✗ NOT FOUND'} (${hits})  "${r.find}"→"${r.replace}"`);
        }
      }

      // summary string mutation
      for (const [loc, reps] of Object.entries(job.summary || {})) {
        const cur = (doc.summary || []).find((s: any) => s._key === loc)?.value;
        if (typeof cur !== 'string') { console.log(`   ${target} summary.${loc}: ✗ none`); continue; }
        let next = cur;
        for (const r of reps) next = next.split(r.find).join(r.replace);
        if (next !== cur) {
          summarySet[`summary[_key=="${loc}"].value`] = next;
          console.log(`   ${target} summary.${loc}: ✓ updated`);
        } else {
          console.log(`   ${target} summary.${loc}: ✗ NOT FOUND`);
        }
      }

      if (commit && (bodyChanged || Object.keys(summarySet).length)) {
        let p = client.patch(target);
        if (bodyChanged) p = p.set({ body: doc.body });
        if (Object.keys(summarySet).length) p = p.set(summarySet);
        await p.commit({ visibility: 'async' });
        console.log(`     → written`);
      }
    }
  }
  if (!commit) console.log('\n  DRY RUN. Re-run with --commit.');
}
main().catch((e) => { console.error(e); process.exit(1); });
