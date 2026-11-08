/**
 * Shared concierge types (Session 4). The brief payload is the contract
 * between the extraction call (lib/briefExtraction.ts), the /api/brief
 * route, the completion panel, and — at Session 9 — the Autoura webhook.
 * Keep this Autoura-aligned: field renames here ripple to S9.
 */
import type { RoutedBrand } from '@/lib/concierge/brands';

export type PreferredContact = 'email' | 'phone' | 'whatsapp' | null;

export interface BriefVisitor {
  name: string | null;
  email: string | null;
  phone: string | null;
  preferred_contact: PreferredContact;
  nationality: string | null;
  origin_city: string | null;
  timezone: string | null;
}

export interface BriefTrip {
  travelers_count: number | null;
  travelers_detail: string | null;
  dates_specific: string | null;
  dates_window: string | null;
  length_days: number | null;
  international_flights: boolean | null;
  destinations: string[];
}

export interface BriefPreferences {
  comfort_level: string | null;
  interests: string[];
  must_see: string[];
  must_avoid: string[];
}

export interface BriefConstraints {
  dietary: string | null;
  mobility: string | null;
  religious: string | null;
  medical: string | null;
}

export interface BriefPayload {
  complete: boolean;
  visitor: BriefVisitor;
  trip: BriefTrip;
  preferences: BriefPreferences;
  constraints: BriefConstraints;
  brief_summary: string | null;
  follow_up_window: string | null;
  /**
   * Portfolio routing (Session 13). The agent decides the route in
   * conversation; this is the extraction READING BACK that decision from the
   * agent's explicit handoff (default 'travel2egypt' when no sister-brand
   * handoff was made). NOT sent on the Autoura wire (toAutouraPayload maps
   * fields explicitly and omits these) — the target endpoint already encodes
   * the brand. routing_reason is a short team-facing 'why', or null.
   */
  routed_brand: RoutedBrand;
  routing_reason: string | null;
}

/** What /api/brief returns to the client. */
export interface BriefResponse {
  /** False when Gate 2 rejected (panel must not show). */
  complete: boolean;
  /** Present only when complete. */
  payload?: BriefPayload;
}
