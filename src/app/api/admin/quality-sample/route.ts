import { NextResponse, type NextRequest } from 'next/server';

import { cairoYesterdayWindowIso } from '@/lib/admin/format';
import { JUDGE_MODEL, judgeTranscript, type JudgeTurn } from '@/lib/concierge/qualityJudge';
import { conciergeDb } from '@/lib/supabase/server';

/**
 * GET /api/admin/quality-sample — daily production quality sampling
 * (Harness Layer 3). Railway cron target, run BEFORE the digest (e.g.
 * 07:15 Cairo = "15 5 * * *" UTC) so the digest can report the scores.
 *
 * Samples up to QUALITY_SAMPLE_SIZE (default 5) conversations from the
 * previous Cairo day and scores each with the shared LLM-judge rubric
 * (pacing / grounding / tone — the same scale as the offline eval harness,
 * so live drift and offline baselines are directly comparable). Scores land
 * in concierge.eval_scores; the digest reads them the same morning.
 *
 * Selection: most recent first, ≥ MIN_MESSAGES stored messages, skips
 * conversations already scored (UNIQUE conversation_id — judged once, ever)
 * and skips anonymized sessions (erasure requests are honored everywhere,
 * including QA). Latest-first is a pragmatic v1 bias, documented here.
 *
 * Fail-soft (migration 0008): if eval_scores doesn't exist yet, respond
 * 503 { error: 'migration_0008_missing' } — no crash, no partial writes.
 *
 * Protected by `Authorization: Bearer ${CRON_SECRET}` like /api/admin/digest.
 * Response carries counts + opaque ids + scores only (no transcript content).
 */
export const runtime = 'nodejs';

const MIN_MESSAGES = 4;
const DEFAULT_SAMPLE_SIZE = 5;

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

/** PostgREST "relation does not exist" style errors → migration not applied. */
function isMissingTable(err: { code?: string; message?: string } | null): boolean {
  return !!err && (err.code === 'PGRST205' || /eval_scores/.test(err.message ?? ''));
}

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    console.error('[admin] /api/admin/quality-sample invoked but CRON_SECRET unset');
    return NextResponse.json({ error: 'cron_secret_unset' }, { status: 500 });
  }
  const auth = req.headers.get('authorization') ?? '';
  if (!timingSafeEqual(auth, `Bearer ${secret}`)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const sampleSize = Math.max(
    1,
    Number(process.env.QUALITY_SAMPLE_SIZE ?? DEFAULT_SAMPLE_SIZE) || DEFAULT_SAMPLE_SIZE,
  );

  try {
    const db = conciergeDb();
    const { startIso, endIso } = cairoYesterdayWindowIso();
    // The Cairo calendar day this window covers, as a date for eval_scores.
    const sampledOn = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Africa/Cairo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date(startIso));

    // Fail-soft probe: is 0008 applied?
    {
      const { error } = await db.from('eval_scores').select('id').limit(1);
      if (isMissingTable(error)) {
        console.warn('[admin] quality-sample: eval_scores missing — apply migration 0008');
        return NextResponse.json({ error: 'migration_0008_missing' }, { status: 503 });
      }
      if (error) throw new Error(`eval_scores probe failed: ${error.message}`);
    }

    // Candidates: yesterday's conversations, newest first, un-anonymized.
    const { data: candidates, error: candErr } = await db
      .from('conversations')
      .select('id, session_id, sessions!inner(locale, anonymized_at)')
      .gte('last_message_at', startIso)
      .lt('last_message_at', endIso)
      .eq('archived', false)
      .order('last_message_at', { ascending: false })
      .limit(sampleSize * 4);
    if (candErr) throw new Error(`candidate query failed: ${candErr.message}`);

    const unanonymized = ((candidates ?? []) as Array<{
      id: string;
      sessions: { anonymized_at: string | null } | null;
    }>).filter((c) => !c.sessions?.anonymized_at);

    // Drop already-scored (judged once, ever).
    const ids = unanonymized.map((c) => c.id);
    const scored = new Set<string>();
    if (ids.length) {
      const { data: existing, error: exErr } = await db
        .from('eval_scores')
        .select('conversation_id')
        .in('conversation_id', ids);
      if (exErr) throw new Error(`scored lookup failed: ${exErr.message}`);
      for (const row of existing ?? []) scored.add(row.conversation_id);
    }

    const results: Array<{
      conversationId: string;
      pacing: number;
      grounding: number;
      tone: number;
    }> = [];
    let judgedFailed = 0;
    let tooShort = 0;

    for (const conv of unanonymized) {
      if (results.length >= sampleSize) break;
      if (scored.has(conv.id)) continue;

      const { data: messages, error: msgErr } = await db
        .from('messages')
        .select('role, content')
        .eq('conversation_id', conv.id)
        .in('role', ['user', 'assistant'])
        .order('created_at', { ascending: true });
      if (msgErr) {
        console.error(`[admin] quality-sample: messages load failed for ${conv.id}`);
        continue;
      }
      if ((messages ?? []).length < MIN_MESSAGES) {
        tooShort += 1;
        continue;
      }

      const score = await judgeTranscript((messages ?? []) as JudgeTurn[]);
      if (!score) {
        judgedFailed += 1;
        continue;
      }

      const { error: insErr } = await db.from('eval_scores').insert({
        conversation_id: conv.id,
        sampled_on: sampledOn,
        judge_model: JUDGE_MODEL,
        pacing: score.pacing,
        grounding: score.grounding,
        tone: score.tone,
        notes: score.notes || null,
      });
      if (insErr) {
        // Unique-violation race (double cron fire) is benign — skip, don't fail.
        console.error(`[admin] quality-sample: insert failed for ${conv.id}: ${insErr.message}`);
        continue;
      }
      results.push({
        conversationId: conv.id,
        pacing: score.pacing,
        grounding: score.grounding,
        tone: score.tone,
      });
    }

    console.log(
      `[admin] quality-sample: sampled=${results.length} tooShort=${tooShort} judgeFailed=${judgedFailed} window=${startIso}`,
    );
    return NextResponse.json({
      ok: true,
      sampledOn,
      window: { start: startIso, end: endIso },
      sampled: results,
      skipped: { tooShort, judgeFailed: judgedFailed, alreadyScored: scored.size },
    });
  } catch (err) {
    console.error('[admin] quality-sample failed:', err);
    return NextResponse.json({ error: 'quality_sample_failed' }, { status: 500 });
  }
}
