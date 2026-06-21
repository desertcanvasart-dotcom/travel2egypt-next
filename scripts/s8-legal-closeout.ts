/**
 * Session 8 legal closeout — reconcile the LIVE published legal copy (PRODUCTION).
 *
 * Decisions (this session): the live EN/ES policy text is the legally-approved
 * text, so we reconcile IN PLACE — no body replacement. Three span fixes plus a
 * "Last updated" bump. JA is deferred to a dedicated pass; anonymized_at stays
 * S10. No schema/migration change.
 *
 * Edits (production dataset, ufallvd2):
 *   1. privacy EN  — resolve the live "[DATA-REQUEST SLA — TO CONFIRM]" placeholder
 *      to the approved 30-day acknowledgment (matches the rights-response SLA).
 *   2. privacy ES  — same, ES wording ("Responderemos en un plazo de 30 días.").
 *   3. cookie  EN  — remove a duplicated sentence ("…convenient to use, it makes
 *      the site more convenient to use.").
 *   4. lastUpdated → 2026-06-21 on cookie + privacy (content predated this date
 *      with a stale display date; bump to the finalized publish date).
 *
 * Each edit is GUARDED: the script asserts the span's current text equals the
 * expected "from" before patching; on drift it skips that edit and reports it
 * (never forces). A full backup of both docs is written to backups/ before any
 * write. Dry-run by default.
 *
 *   Dry run (default): npx tsx scripts/s8-legal-closeout.ts
 *   Apply:             npx tsx scripts/s8-legal-closeout.ts --apply
 */
import 'dotenv/config';
import { createClient } from '@sanity/client';
import { writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';

const APPLY = process.argv.includes('--apply');
const PUBLISH_DATE = '2026-06-21';

const token =
  process.env.SANITY_PRODUCTION_API_WRITE_TOKEN || process.env.SANITY_API_WRITE_TOKEN;
if (!token) {
  console.error('Missing SANITY_PRODUCTION_API_WRITE_TOKEN / SANITY_API_WRITE_TOKEN');
  process.exit(1);
}

const c = createClient({
  projectId: 'ufallvd2',
  dataset: 'production',
  apiVersion: '2024-12-01',
  token,
  useCdn: false,
});

interface SpanEdit {
  docId: string;
  locale: string;
  block: string;
  span: string;
  from: string;
  to: string;
}

const SPAN_EDITS: SpanEdit[] = [
  {
    docId: 'legal-privacy-policy',
    locale: 'en',
    block: 's8en1o',
    span: 's8en1p',
    from: 'Request a copy of your conversation data — email us and we will send you a copy. [DATA-REQUEST SLA — TO CONFIRM]',
    to: 'Request a copy of your conversation data — email us and we will send you a copy. We will respond within 30 days.',
  },
  {
    docId: 'legal-privacy-policy',
    locale: 'es',
    block: 's8es1o',
    span: 's8es1p',
    from: 'Solicitar una copia de los datos de su conversación: escríbanos y le enviaremos una copia. [PLAZO DE RESPUESTA — POR CONFIRMAR]',
    to: 'Solicitar una copia de los datos de su conversación: escríbanos y le enviaremos una copia. Responderemos en un plazo de 30 días.',
  },
  {
    docId: 'legal-cookie-policy',
    locale: 'en',
    block: '5246ffc58de8',
    span: 'f45ef771a194',
    from: ' remembering your language preference. This is a functional cookie — it makes the site more convenient to use, it makes the site more convenient to use.',
    to: ' remembering your language preference. This is a functional cookie — it makes the site more convenient to use.',
  },
];

const DATE_BUMPS = ['legal-cookie-policy', 'legal-privacy-policy'];

async function spanText(e: SpanEdit): Promise<string | undefined> {
  return c.fetch(
    `*[_id==$id][0].body[_key==$loc][0].value[_key==$blk][0].children[_key==$span][0].text`,
    { id: e.docId, loc: e.locale, blk: e.block, span: e.span }
  );
}

async function main() {
  console.log(`\n=== S8 legal closeout — ${APPLY ? 'APPLY' : 'DRY RUN'} ===\n`);

  // 1. Backup both docs in full (rollback artifact).
  const ids = [...new Set(SPAN_EDITS.map((e) => e.docId).concat(DATE_BUMPS))];
  const backup = await c.fetch(`*[_id in $ids]`, { ids });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = path.join(process.cwd(), 'backups');
  mkdirSync(backupDir, { recursive: true });
  const backupPath = path.join(backupDir, `s8-legal-closeout-rollback-${stamp}.json`);
  writeFileSync(backupPath, JSON.stringify(backup, null, 2));
  console.log(`Backup of ${backup.length} docs → ${path.relative(process.cwd(), backupPath)}\n`);

  // 2. Guard + patch each span edit.
  let okSpans = 0;
  for (const e of SPAN_EDITS) {
    const current = await spanText(e);
    const label = `${e.docId} [${e.locale}] ${e.block}/${e.span}`;
    if (current === undefined) {
      console.log(`  ✗ SKIP  ${label} — span not found`);
      continue;
    }
    if (current === e.to) {
      console.log(`  • DONE  ${label} — already at target text`);
      okSpans++;
      continue;
    }
    if (current !== e.from) {
      console.log(`  ✗ SKIP  ${label} — current text drifted from expected:`);
      console.log(`          have: ${JSON.stringify(current.slice(0, 90))}…`);
      continue;
    }
    console.log(`  ✓ EDIT  ${label}`);
    console.log(`          - ${JSON.stringify(e.from)}`);
    console.log(`          + ${JSON.stringify(e.to)}`);
    if (APPLY) {
      const guardPath = `body[_key=="${e.locale}"].value[_key=="${e.block}"].children[_key=="${e.span}"].text`;
      await c
        .patch(e.docId)
        .ifRevisionId((await c.fetch(`*[_id==$id][0]._rev`, { id: e.docId })) as string)
        .set({ [guardPath]: e.to })
        .commit({ autoGenerateArrayKeys: false });
    }
    okSpans++;
  }

  // 3. Date bumps.
  console.log('');
  for (const id of DATE_BUMPS) {
    const cur = await c.fetch(`*[_id==$id][0].lastUpdated`, { id });
    if (cur === PUBLISH_DATE) {
      console.log(`  • DONE  ${id} lastUpdated already ${PUBLISH_DATE}`);
      continue;
    }
    console.log(`  ✓ DATE  ${id} lastUpdated ${cur} → ${PUBLISH_DATE}`);
    if (APPLY) {
      await c.patch(id).set({ lastUpdated: PUBLISH_DATE }).commit();
    }
  }

  console.log(
    `\n${APPLY ? 'Applied' : 'Dry run complete'}: ${okSpans}/${SPAN_EDITS.length} span edits, ${DATE_BUMPS.length} date bumps.\n` +
      (APPLY ? '' : 'Re-run with --apply to write.\n')
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
