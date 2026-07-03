/**
 * concierge-db — TypeScript shape of the `concierge` Postgres schema.
 *
 * Hand-written against supabase/migrations/0001_concierge_init.sql (the
 * migration is applied manually via the Dashboard, so there was no live
 * schema to introspect at authoring time). After the migration is applied
 * it can be regenerated and diffed:
 *
 *   npx supabase gen types typescript --project-id <ref> --schema concierge
 *
 * Columns arriving in later migrations are added here alongside those
 * migrations: 0002 tour-context, 0003 escape-hatch, 0004 rate-limit action,
 * 0005 briefs.brief_revision (Session 9), 0006 anonymized_at (Session 10).
 * NOTE: 0005 must be applied in the Dashboard before any briefs row is written
 * with brief_revision (i.e. before live S9 Phase 3) — see the build brief.
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface ConciergeDatabase {
  concierge: {
    Tables: {
      sessions: {
        Row: {
          id: string;
          cookie_id: string;
          created_at: string;
          last_active_at: string;
          ip_hash: string | null;
          user_agent_hash: string | null;
          locale: string;
          email: string | null;
          email_verified: boolean | null;
          anonymized_at: string | null; // migration 0006 (Session 10)
        };
        Insert: {
          id?: string;
          cookie_id: string;
          created_at?: string;
          last_active_at?: string;
          ip_hash?: string | null;
          user_agent_hash?: string | null;
          locale?: string;
          email?: string | null;
          email_verified?: boolean | null;
          anonymized_at?: string | null;
        };
        Update: {
          id?: string;
          cookie_id?: string;
          created_at?: string;
          last_active_at?: string;
          ip_hash?: string | null;
          user_agent_hash?: string | null;
          locale?: string;
          email?: string | null;
          email_verified?: boolean | null;
          anonymized_at?: string | null;
        };
        Relationships: [];
      };
      conversations: {
        Row: {
          id: string;
          session_id: string | null;
          started_at: string;
          last_message_at: string;
          prompt_version: string;
          tour_slug: string | null;
          tour_title: string | null;
          brief_completed: boolean | null;
          brief_completed_at: string | null;
          brief_payload: Json | null;
          reviewed: boolean | null;
          reviewer_rating: number | null;
          reviewer_notes: string | null;
          archived: boolean | null;
          flagged: boolean | null;
          flag_reason: string | null;
          escape_hatch_used: boolean | null;
          escape_hatch_action: string | null;
          escape_hatch_at: string | null;
        };
        Insert: {
          id?: string;
          session_id?: string | null;
          started_at?: string;
          last_message_at?: string;
          prompt_version?: string;
          tour_slug?: string | null;
          tour_title?: string | null;
          brief_completed?: boolean | null;
          brief_completed_at?: string | null;
          brief_payload?: Json | null;
          reviewed?: boolean | null;
          reviewer_rating?: number | null;
          reviewer_notes?: string | null;
          archived?: boolean | null;
          flagged?: boolean | null;
          flag_reason?: string | null;
          escape_hatch_used?: boolean | null;
          escape_hatch_action?: string | null;
          escape_hatch_at?: string | null;
        };
        Update: {
          id?: string;
          session_id?: string | null;
          started_at?: string;
          last_message_at?: string;
          prompt_version?: string;
          tour_slug?: string | null;
          tour_title?: string | null;
          brief_completed?: boolean | null;
          brief_completed_at?: string | null;
          brief_payload?: Json | null;
          reviewed?: boolean | null;
          reviewer_rating?: number | null;
          reviewer_notes?: string | null;
          archived?: boolean | null;
          flagged?: boolean | null;
          flag_reason?: string | null;
          escape_hatch_used?: boolean | null;
          escape_hatch_action?: string | null;
          escape_hatch_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'conversations_session_id_fkey';
            columns: ['session_id'];
            referencedRelation: 'sessions';
            referencedColumns: ['id'];
          },
        ];
      };
      messages: {
        Row: {
          id: string;
          conversation_id: string;
          role: 'user' | 'assistant' | 'system';
          content: string;
          created_at: string;
          response_time_ms: number | null;
          token_count_input: number | null;
          token_count_output: number | null;
          /** cache_read_input_tokens per real turn (0008); null = pre-0008 or canned wrap. */
          token_count_cache_read: number | null;
          model_version: string | null;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          role: 'user' | 'assistant' | 'system';
          content: string;
          created_at?: string;
          response_time_ms?: number | null;
          token_count_input?: number | null;
          token_count_output?: number | null;
          token_count_cache_read?: number | null;
          model_version?: string | null;
        };
        Update: {
          id?: string;
          conversation_id?: string;
          role?: 'user' | 'assistant' | 'system';
          content?: string;
          created_at?: string;
          response_time_ms?: number | null;
          token_count_input?: number | null;
          token_count_output?: number | null;
          token_count_cache_read?: number | null;
          model_version?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'messages_conversation_id_fkey';
            columns: ['conversation_id'];
            referencedRelation: 'conversations';
            referencedColumns: ['id'];
          },
        ];
      };
      briefs: {
        Row: {
          id: string;
          conversation_id: string;
          created_at: string;
          payload: Json;
          autoura_webhook_status: 'pending' | 'sent' | 'failed' | 'retried' | null;
          autoura_webhook_response: Json | null;
          autoura_attempts: number | null;
          email_fallback_sent: boolean | null;
          brief_revision: number | null; // migration 0005 (Session 9)
        };
        Insert: {
          id?: string;
          conversation_id: string;
          created_at?: string;
          payload: Json;
          autoura_webhook_status?: 'pending' | 'sent' | 'failed' | 'retried' | null;
          autoura_webhook_response?: Json | null;
          autoura_attempts?: number | null;
          email_fallback_sent?: boolean | null;
          brief_revision?: number | null;
        };
        Update: {
          id?: string;
          conversation_id?: string;
          created_at?: string;
          payload?: Json;
          autoura_webhook_status?: 'pending' | 'sent' | 'failed' | 'retried' | null;
          autoura_webhook_response?: Json | null;
          autoura_attempts?: number | null;
          email_fallback_sent?: boolean | null;
          brief_revision?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'briefs_conversation_id_fkey';
            columns: ['conversation_id'];
            referencedRelation: 'conversations';
            referencedColumns: ['id'];
          },
        ];
      };
      rate_limits: {
        Row: {
          id: string;
          cookie_id: string;
          action: string;
          ip_hash: string | null;
          window_start: string;
          message_count: number | null;
          blocked_until: string | null;
        };
        Insert: {
          id?: string;
          cookie_id: string;
          action?: string;
          ip_hash?: string | null;
          window_start?: string;
          message_count?: number | null;
          blocked_until?: string | null;
        };
        Update: {
          id?: string;
          cookie_id?: string;
          action?: string;
          ip_hash?: string | null;
          window_start?: string;
          message_count?: number | null;
          blocked_until?: string | null;
        };
        Relationships: [];
      };
      eval_scores: {
        Row: {
          id: string;
          conversation_id: string;
          /** Cairo calendar day the sample covered (date, YYYY-MM-DD). */
          sampled_on: string;
          judge_model: string;
          pacing: number;
          grounding: number;
          tone: number;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          sampled_on: string;
          judge_model: string;
          pacing: number;
          grounding: number;
          tone: number;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          conversation_id?: string;
          sampled_on?: string;
          judge_model?: string;
          pacing?: number;
          grounding?: number;
          tone?: number;
          notes?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'eval_scores_conversation_id_fkey';
            columns: ['conversation_id'];
            referencedRelation: 'conversations';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
}

export type SessionRow = ConciergeDatabase['concierge']['Tables']['sessions']['Row'];
export type ConversationRow = ConciergeDatabase['concierge']['Tables']['conversations']['Row'];
export type MessageRow = ConciergeDatabase['concierge']['Tables']['messages']['Row'];
export type BriefRow = ConciergeDatabase['concierge']['Tables']['briefs']['Row'];
export type RateLimitRow = ConciergeDatabase['concierge']['Tables']['rate_limits']['Row'];
