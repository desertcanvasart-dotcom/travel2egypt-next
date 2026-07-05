import { conciergeDb } from '@/lib/supabase/server';

import { cairoYesterdayWindowIso } from './format';

/**
 * Daily digest computation (Session 10).
 *
 * Window = previous Cairo calendar day. Called by `/api/admin/digest` once a
 * day at 08:00 Cairo via Railway cron. Stats are intentionally small — the
 * email is for orientation, not analytics; reviewers click through to the
 * admin panel for detail.
 */

export interface DigestEntry {
  id: string;
  started_at: string;
  locale: string;
  email: string | null;
}

export interface DigestStats {
  windowStart: string;
  windowEnd: string;
  totals: {
    conversations: number;
    briefsCompleted: number;
    flagged: number;
  };
  briefsCompleted: Array<DigestEntry & { brief_completed_at: string }>;
  flaggedByReason: Record<string, DigestEntry[]>;
  topResponseTimes: Array<{
    conversation_id: string;
    response_time_ms: number;
    created_at: string;
  }>;
  tokenSummary: {
    inputTokens: number;
    outputTokens: number;
    messageCount: number;
  };
  /**
   * Layer 3 additions — both null-tolerant so the digest keeps working
   * before migration 0008 is applied (fail-soft, like the writers).
   */
  qualityScores: {
    count: number;
    avgPacing: number;
    avgGrounding: number;
    avgTone: number;
    worstNote: string | null;
  } | null;
  cacheHit: {
    /** cache_read / full input across turns that carry telemetry. */
    rate: number;
    turnsMeasured: number;
    /** True when the rate is suspiciously low with enough volume — likely an invalidated v4.1 prefix. */
    alert: boolean;
  } | null;
}

/** Below this hit-rate (with enough turns) the cached v4.1 prefix is likely broken. */
const CACHE_HIT_ALERT_THRESHOLD = 0.5;
const CACHE_HIT_MIN_TURNS = 10;

const TOP_RESPONSE_TIMES_LIMIT = 5;

export async function computeDigest(): Promise<DigestStats> {
  const db = conciergeDb();
  const { startIso, endIso } = cairoYesterdayWindowIso();

  const [
    convsCountRes,
    briefsCountRes,
    flaggedCountRes,
    briefsListRes,
    flaggedListRes,
    msgsForTokensRes,
    topRtRes,
  ] = await Promise.all([
    db
      .from('conversations')
      .select('id', { count: 'exact', head: true })
      .gte('started_at', startIso)
      .lt('started_at', endIso),
    db
      .from('conversations')
      .select('id', { count: 'exact', head: true })
      .gte('brief_completed_at', startIso)
      .lt('brief_completed_at', endIso)
      .eq('brief_completed', true),
    db
      .from('conversations')
      .select('id', { count: 'exact', head: true })
      .gte('started_at', startIso)
      .lt('started_at', endIso)
      .eq('flagged', true),
    db
      .from('conversations')
      .select('id, started_at, brief_completed_at, sessions!inner(locale, email)')
      .gte('brief_completed_at', startIso)
      .lt('brief_completed_at', endIso)
      .eq('brief_completed', true)
      .order('brief_completed_at', { ascending: false })
      .limit(50),
    db
      .from('conversations')
      .select('id, started_at, flag_reason, sessions!inner(locale, email)')
      .gte('started_at', startIso)
      .lt('started_at', endIso)
      .eq('flagged', true)
      .eq('reviewed', false)
      .order('started_at', { ascending: false })
      .limit(100),
    db
      .from('messages')
      .select('token_count_input, token_count_output')
      .gte('created_at', startIso)
      .lt('created_at', endIso),
    db
      .from('messages')
      .select('conversation_id, response_time_ms, created_at')
      .gte('created_at', startIso)
      .lt('created_at', endIso)
      .not('response_time_ms', 'is', null)
      .order('response_time_ms', { ascending: false })
      .limit(TOP_RESPONSE_TIMES_LIMIT),
  ]);

  const briefsCompletedRows = (briefsListRes.data ?? []) as Array<{
    id: string;
    started_at: string;
    brief_completed_at: string | null;
    sessions: { locale: string; email: string | null } | null;
  }>;
  const briefsCompleted = briefsCompletedRows.map((r) => ({
    id: r.id,
    started_at: r.started_at,
    brief_completed_at: r.brief_completed_at ?? r.started_at,
    locale: r.sessions?.locale ?? '',
    email: r.sessions?.email ?? null,
  }));

  const flaggedRows = (flaggedListRes.data ?? []) as Array<{
    id: string;
    started_at: string;
    flag_reason: string | null;
    sessions: { locale: string; email: string | null } | null;
  }>;
  const flaggedByReason: Record<string, DigestEntry[]> = {};
  for (const r of flaggedRows) {
    const reason = r.flag_reason ?? 'unspecified';
    const arr = flaggedByReason[reason] ?? (flaggedByReason[reason] = []);
    arr.push({
      id: r.id,
      started_at: r.started_at,
      locale: r.sessions?.locale ?? '',
      email: r.sessions?.email ?? null,
    });
  }

  const tokenRows = (msgsForTokensRes.data ?? []) as Array<{
    token_count_input: number | null;
    token_count_output: number | null;
  }>;
  const tokenSummary = tokenRows.reduce(
    (acc, m) => {
      acc.inputTokens += m.token_count_input ?? 0;
      acc.outputTokens += m.token_count_output ?? 0;
      acc.messageCount += 1;
      return acc;
    },
    { inputTokens: 0, outputTokens: 0, messageCount: 0 },
  );

  const topResponseTimes = ((topRtRes.data ?? []) as Array<{
    conversation_id: string;
    response_time_ms: number | null;
    created_at: string;
  }>)
    .filter((r): r is { conversation_id: string; response_time_ms: number; created_at: string } =>
      typeof r.response_time_ms === 'number',
    );

  // ── Layer 3: judge scores for the window (fail-soft pre-0008) ────────────
  // Join on sampled_on (the Cairo day the sample COVERED), not created_at —
  // scores are written the morning after the window by the 07:15 cron, so a
  // created_at range would pick up the previous window's scores instead.
  let qualityScores: DigestStats['qualityScores'] = null;
  {
    const sampledOn = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Africa/Cairo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date(startIso));
    const { data, error } = await db
      .from('eval_scores')
      .select('pacing, grounding, tone, notes')
      .eq('sampled_on', sampledOn);
    if (error) {
      console.warn('[admin] digest: eval_scores unavailable (migration 0008?):', error.message);
    } else if (data && data.length) {
      const worst = [...data].sort(
        (a, b) => a.pacing + a.grounding + a.tone - (b.pacing + b.grounding + b.tone),
      )[0];
      const avg = (k: 'pacing' | 'grounding' | 'tone') =>
        Math.round((data.reduce((s, r) => s + r[k], 0) / data.length) * 10) / 10;
      qualityScores = {
        count: data.length,
        avgPacing: avg('pacing'),
        avgGrounding: avg('grounding'),
        avgTone: avg('tone'),
        worstNote: worst.notes,
      };
    } else {
      qualityScores = { count: 0, avgPacing: 0, avgGrounding: 0, avgTone: 0, worstNote: null };
    }
  }

  // ── Layer 3: prompt-cache hit rate (fail-soft pre-0008) ──────────────────
  let cacheHit: DigestStats['cacheHit'] = null;
  {
    const { data, error } = await db
      .from('messages')
      .select('token_count_input, token_count_cache_read')
      .gte('created_at', startIso)
      .lt('created_at', endIso)
      .not('token_count_cache_read', 'is', null);
    if (error) {
      console.warn('[admin] digest: cache telemetry unavailable (migration 0008?):', error.message);
    } else {
      const rows = (data ?? []) as Array<{
        token_count_input: number | null;
        token_count_cache_read: number | null;
      }>;
      const input = rows.reduce((s, r) => s + (r.token_count_input ?? 0), 0);
      const cached = rows.reduce((s, r) => s + (r.token_count_cache_read ?? 0), 0);
      const rate = input > 0 ? cached / input : 0;
      cacheHit = {
        rate: Math.round(rate * 1000) / 1000,
        turnsMeasured: rows.length,
        alert: rows.length >= CACHE_HIT_MIN_TURNS && rate < CACHE_HIT_ALERT_THRESHOLD,
      };
    }
  }

  return {
    windowStart: startIso,
    windowEnd: endIso,
    totals: {
      conversations: convsCountRes.count ?? 0,
      briefsCompleted: briefsCountRes.count ?? 0,
      flagged: flaggedCountRes.count ?? 0,
    },
    briefsCompleted,
    flaggedByReason,
    topResponseTimes,
    tokenSummary,
    qualityScores,
    cacheHit,
  };
}
