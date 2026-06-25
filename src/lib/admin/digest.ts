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
}

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
  };
}
