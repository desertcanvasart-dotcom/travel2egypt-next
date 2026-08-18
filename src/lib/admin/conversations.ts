import { conciergeDb } from '@/lib/supabase/server';

import { type ListFilters, PAGE_SIZE } from './filters';
import { cairoTodayStartIso } from './format';

/**
 * Server-side queries for the admin list view (Session 10).
 *
 * v1 ships sort-by-recent only. Sorting by length or tokens requires an
 * aggregate view; deferred to a follow-up migration so this PR doesn't
 * inflate. Per-row msg_count + total_tokens ARE shown — fetched in one
 * batched aggregate query against `messages` for the current page (1
 * conversations query + 1 batched aggregate = 2 round trips total, no N+1).
 */

export interface ConversationListRow {
  id: string;
  started_at: string;
  last_message_at: string;
  locale: string;
  prompt_version: string;
  brief_completed: boolean | null;
  brief_completed_at: string | null;
  reviewed: boolean | null;
  reviewer_rating: number | null;
  flagged: boolean | null;
  flag_reason: string | null;
  archived: boolean | null;
  escape_hatch_used: boolean | null;
  routed_brand: string; // migration 0007 (Session 13)
  routing_reason: string | null;
  anonymized_at: string | null;
  msg_count: number;
  total_tokens: number;
}

export interface ListResult {
  rows: ConversationListRow[];
  total: number;
  page: number;
  pageSize: number;
}

const SEARCH_HIT_CAP = 500;
const SEARCH_RESULT_CAP = 50;

export async function listConversations(filters: ListFilters): Promise<ListResult> {
  const db = conciergeDb();

  // `sessions!inner` enforces the join (we always want the session locale
  // and anonymized_at) and lets us filter by sessions.locale.
  let q = db
    .from('conversations')
    .select('*, sessions!inner(locale, anonymized_at)', { count: 'exact' });

  if (filters.from) q = q.gte('started_at', `${filters.from}T00:00:00Z`);
  if (filters.to) q = q.lte('started_at', `${filters.to}T23:59:59.999Z`);
  if (filters.locale) q = q.eq('sessions.locale', filters.locale);
  if (filters.briefCompleted !== null) q = q.eq('brief_completed', filters.briefCompleted);
  if (filters.flagged !== null) q = q.eq('flagged', filters.flagged);
  if (filters.flagReason) q = q.eq('flag_reason', filters.flagReason);
  if (filters.reviewed !== null) q = q.eq('reviewed', filters.reviewed);
  if (filters.brand) q = q.eq('routed_brand', filters.brand);

  const offset = (filters.page - 1) * PAGE_SIZE;
  q = q.order('started_at', { ascending: false }).range(offset, offset + PAGE_SIZE - 1);

  const { data, count, error } = await q;
  if (error) {
    console.error('[admin] listConversations failed:', error);
    throw error;
  }

  const conversations = (data ?? []) as Array<
    {
      id: string;
      started_at: string;
      last_message_at: string;
      prompt_version: string;
      brief_completed: boolean | null;
      brief_completed_at: string | null;
      reviewed: boolean | null;
      reviewer_rating: number | null;
      flagged: boolean | null;
      flag_reason: string | null;
      archived: boolean | null;
      escape_hatch_used: boolean | null;
      routed_brand: string;
      routing_reason: string | null;
      sessions: { locale: string; anonymized_at: string | null } | null;
    }
  >;

  // Batched aggregate — one round trip for ALL conversations on the page.
  const ids = conversations.map((c) => c.id);
  const aggregates = new Map<string, { msg_count: number; total_tokens: number }>();
  if (ids.length > 0) {
    const { data: msgs, error: msgsErr } = await db
      .from('messages')
      .select('conversation_id, token_count_input, token_count_output')
      .in('conversation_id', ids);
    if (msgsErr) {
      console.error('[admin] messages aggregate failed:', msgsErr);
      throw msgsErr;
    }
    for (const m of msgs ?? []) {
      const cur = aggregates.get(m.conversation_id) ?? { msg_count: 0, total_tokens: 0 };
      cur.msg_count++;
      cur.total_tokens += (m.token_count_input ?? 0) + (m.token_count_output ?? 0);
      aggregates.set(m.conversation_id, cur);
    }
  }

  const rows: ConversationListRow[] = conversations.map((c) => {
    const agg = aggregates.get(c.id) ?? { msg_count: 0, total_tokens: 0 };
    return {
      id: c.id,
      started_at: c.started_at,
      last_message_at: c.last_message_at,
      locale: c.sessions?.locale ?? '',
      prompt_version: c.prompt_version,
      brief_completed: c.brief_completed,
      brief_completed_at: c.brief_completed_at,
      reviewed: c.reviewed,
      reviewer_rating: c.reviewer_rating,
      flagged: c.flagged,
      flag_reason: c.flag_reason,
      archived: c.archived,
      escape_hatch_used: c.escape_hatch_used,
      routed_brand: c.routed_brand,
      routing_reason: c.routing_reason,
      anonymized_at: c.sessions?.anonymized_at ?? null,
      msg_count: agg.msg_count,
      total_tokens: agg.total_tokens,
    };
  });

  return { rows, total: count ?? 0, page: filters.page, pageSize: PAGE_SIZE };
}

/**
 * ILIKE search over message content (Session 10).
 *
 * Anonymised conversations correctly drop out — their messages.content is
 * '[deleted]' and the search rarely targets that literal. Capped: at most
 * SEARCH_HIT_CAP message hits are inspected (bounds Postgres work), deduped
 * by conversation_id, then the top SEARCH_RESULT_CAP conversations are
 * shaped like the list view (with msg_count + total_tokens). If we hit the
 * cap, the list-view "x conversations" line surfaces it as "≥N".
 *
 * Pagination is intentionally not supported in v1: search results are
 * intended as a focused find-and-click, not a browse. If volume grows,
 * upgrade to Postgres FTS (per build brief).
 */
export async function searchConversations(q: string): Promise<ListResult & { capped: boolean }> {
  const trimmed = q.trim();
  if (!trimmed) return { rows: [], total: 0, page: 1, pageSize: SEARCH_RESULT_CAP, capped: false };

  const db = conciergeDb();
  // Escape ILIKE wildcards in the user input so '%' / '_' are treated as
  // literals. We then wrap with our own '%…%' to make it a substring match.
  const escaped = trimmed.replace(/[\\%_]/g, (m) => `\\${m}`);
  const pattern = `%${escaped}%`;

  const { data: hits, error: hitsErr } = await db
    .from('messages')
    .select('conversation_id')
    .ilike('content', pattern)
    .limit(SEARCH_HIT_CAP);
  if (hitsErr) {
    console.error('[admin] search ilike failed:', hitsErr);
    throw hitsErr;
  }

  const capped = (hits ?? []).length === SEARCH_HIT_CAP;
  const uniqueIds: string[] = [];
  const seen = new Set<string>();
  for (const h of hits ?? []) {
    if (!seen.has(h.conversation_id)) {
      seen.add(h.conversation_id);
      uniqueIds.push(h.conversation_id);
      if (uniqueIds.length >= SEARCH_RESULT_CAP) break;
    }
  }

  if (uniqueIds.length === 0) {
    return { rows: [], total: 0, page: 1, pageSize: SEARCH_RESULT_CAP, capped };
  }

  const { data: convs, error: convsErr } = await db
    .from('conversations')
    .select('*, sessions!inner(locale, anonymized_at)')
    .in('id', uniqueIds)
    .order('started_at', { ascending: false });
  if (convsErr) {
    console.error('[admin] search convs fetch failed:', convsErr);
    throw convsErr;
  }

  const conversations = (convs ?? []) as Array<
    {
      id: string;
      started_at: string;
      last_message_at: string;
      prompt_version: string;
      brief_completed: boolean | null;
      brief_completed_at: string | null;
      reviewed: boolean | null;
      reviewer_rating: number | null;
      flagged: boolean | null;
      flag_reason: string | null;
      archived: boolean | null;
      escape_hatch_used: boolean | null;
      routed_brand: string;
      routing_reason: string | null;
      sessions: { locale: string; anonymized_at: string | null } | null;
    }
  >;

  const ids = conversations.map((c) => c.id);
  const aggregates = new Map<string, { msg_count: number; total_tokens: number }>();
  if (ids.length > 0) {
    const { data: msgs } = await db
      .from('messages')
      .select('conversation_id, token_count_input, token_count_output')
      .in('conversation_id', ids);
    for (const m of msgs ?? []) {
      const cur = aggregates.get(m.conversation_id) ?? { msg_count: 0, total_tokens: 0 };
      cur.msg_count++;
      cur.total_tokens += (m.token_count_input ?? 0) + (m.token_count_output ?? 0);
      aggregates.set(m.conversation_id, cur);
    }
  }

  const rows: ConversationListRow[] = conversations.map((c) => {
    const agg = aggregates.get(c.id) ?? { msg_count: 0, total_tokens: 0 };
    return {
      id: c.id,
      started_at: c.started_at,
      last_message_at: c.last_message_at,
      locale: c.sessions?.locale ?? '',
      prompt_version: c.prompt_version,
      brief_completed: c.brief_completed,
      brief_completed_at: c.brief_completed_at,
      reviewed: c.reviewed,
      reviewer_rating: c.reviewer_rating,
      flagged: c.flagged,
      flag_reason: c.flag_reason,
      archived: c.archived,
      escape_hatch_used: c.escape_hatch_used,
      routed_brand: c.routed_brand,
      routing_reason: c.routing_reason,
      anonymized_at: c.sessions?.anonymized_at ?? null,
      msg_count: agg.msg_count,
      total_tokens: agg.total_tokens,
    };
  });

  return { rows, total: rows.length, page: 1, pageSize: SEARCH_RESULT_CAP, capped };
}

export interface DailyStats {
  conversationsToday: number;
  briefsToday: number;
  flaggedToday: number;
  avgRating: number | null;
  ratingsCount: number;
}

/**
 * Header strip stats — all Cairo-day scoped except avg rating, which is
 * lifetime (a small rolling sample is unhelpful for reviewers gauging
 * trend). Four small count queries in parallel; no aggregate view needed.
 */
export async function getDailyStats(): Promise<DailyStats> {
  const db = conciergeDb();
  const startIso = cairoTodayStartIso();

  const [convsRes, briefsRes, flaggedRes, ratingRes] = await Promise.all([
    db
      .from('conversations')
      .select('id', { count: 'exact', head: true })
      .gte('started_at', startIso),
    db
      .from('conversations')
      .select('id', { count: 'exact', head: true })
      .gte('brief_completed_at', startIso)
      .eq('brief_completed', true),
    db
      .from('conversations')
      .select('id', { count: 'exact', head: true })
      .gte('started_at', startIso)
      .eq('flagged', true),
    db.from('conversations').select('reviewer_rating').not('reviewer_rating', 'is', null),
  ]);

  const ratings = (ratingRes.data ?? [])
    .map((r) => r.reviewer_rating)
    .filter((n): n is number => typeof n === 'number');
  const avgRating =
    ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : null;

  return {
    conversationsToday: convsRes.count ?? 0,
    briefsToday: briefsRes.count ?? 0,
    flaggedToday: flaggedRes.count ?? 0,
    avgRating,
    ratingsCount: ratings.length,
  };
}
