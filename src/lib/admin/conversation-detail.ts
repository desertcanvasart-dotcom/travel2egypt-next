import { conciergeDb } from '@/lib/supabase/server';
import type {
  BriefRow,
  ConversationRow,
  MessageRow,
  SessionRow,
} from '@/types/concierge-db';

/**
 * Server-side fetch for the admin detail view (Session 10).
 *
 * 1 conversation+session lookup (via FK select) + 2 parallel reads
 * (messages, briefs). Brief rows include the Autoura webhook status,
 * attempts, response, and brief_revision history — multiple rows
 * possible per conversation when revisions are sent.
 */

export interface ConversationDetail {
  conversation: ConversationRow;
  session: Pick<
    SessionRow,
    'id' | 'cookie_id' | 'locale' | 'email' | 'ip_hash' | 'user_agent_hash' | 'anonymized_at' | 'created_at'
  >;
  messages: MessageRow[];
  briefs: BriefRow[];
}

export async function getConversationDetail(id: string): Promise<ConversationDetail | null> {
  const db = conciergeDb();

  const convRes = await db
    .from('conversations')
    .select(
      '*, sessions(id, cookie_id, locale, email, ip_hash, user_agent_hash, anonymized_at, created_at)',
    )
    .eq('id', id)
    .single();

  if (convRes.error || !convRes.data) return null;

  const conv = convRes.data as ConversationRow & {
    sessions: ConversationDetail['session'] | null;
  };
  if (!conv.sessions) return null;

  const [msgsRes, briefsRes] = await Promise.all([
    db
      .from('messages')
      .select('*')
      .eq('conversation_id', id)
      .order('created_at', { ascending: true }),
    db
      .from('briefs')
      .select('*')
      .eq('conversation_id', id)
      .order('brief_revision', { ascending: true }),
  ]);

  const { sessions, ...conversation } = conv;
  return {
    conversation: conversation as ConversationRow,
    session: sessions,
    messages: (msgsRes.data ?? []) as MessageRow[],
    briefs: (briefsRes.data ?? []) as BriefRow[],
  };
}
