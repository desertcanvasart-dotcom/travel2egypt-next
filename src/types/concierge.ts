/**
 * Shared concierge types (Session 4). The brief payload is the contract
 * between the extraction call (lib/briefExtraction.ts), the /api/brief
 * route, the completion panel, and — at Session 9 — the Autoura webhook.
 * Keep this Autoura-aligned: field renames here ripple to S9.
 */

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
}

/** What /api/brief returns to the client. */
export interface BriefResponse {
  /** False when Gate 2 rejected (panel must not show). */
  complete: boolean;
  /** Present only when complete. */
  payload?: BriefPayload;
}
