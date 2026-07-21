/**
 * Wire types for the Autoura inbound brief webhook (Session 9).
 *
 * These mirror the RECEIVER's accepted shape — see the Autoura contract
 * (travel-ops-pro: `docs/concierge-autoura-webhook-spec.md` §3 +
 * `lib/concierge-brief-schema.ts`). Our internal `BriefPayload`
 * (`types/concierge.ts`) is reshaped onto this by `payload.ts`.
 *
 * Field names and nesting here are AUTOURA's, not ours — three fields live
 * under a different parent than our model (nationality/origin_city move from
 * visitor→trip; destinations move from trip→preferences) and one is renamed
 * (length_days→trip_length_days). Keep this in lockstep with the receiver;
 * never "tidy" it toward our internal model.
 */

export interface AutouraVisitor {
  name: string | null;
  email: string | null;
  phone: string | null;
  preferred_contact: string | null;
  timezone: string | null;
}

export interface AutouraTrip {
  travelers_count: number | null;
  travelers_detail: string | null;
  dates_specific: string | null;
  dates_window: string | null;
  trip_length_days: number | null; // our trip.length_days
  origin_city: string | null; // our visitor.origin_city
  nationality: string | null; // our visitor.nationality
  international_flights: boolean | null;
}

export interface AutouraPreferences {
  destinations: string[]; // our trip.destinations
  comfort_level: string | null;
  interests: string[];
  must_see: string[];
  must_avoid: string[];
}

export interface AutouraConstraints {
  dietary: string | null;
  mobility: string | null;
  religious: string | null;
  medical: string | null;
}

/**
 * Autoura expects an OBJECT here; our internal model carries a single flat
 * string (the human label the agent committed, e.g. "by 8 p.m. Cairo time").
 * We map that string verbatim to `cairo_time_label` and derive the other two
 * from the same Cairo cutoff rule the panel uses (timeframe.ts). Any field we
 * cannot derive stays null — Autoura requires none of them (§3b/§4).
 */
export interface AutouraFollowUpWindow {
  committed_response_by: string | null; // ISO instant, derived
  cairo_time_label: string | null; // our flat follow_up_window string, verbatim
  visitor_local_label: string | null; // derived in the visitor's timezone
}

export interface AutouraTranscriptMessage {
  role: string;
  content: string;
  timestamp: string;
}

export interface AutouraBriefPayload {
  session_id: string | null;
  conversation_id: string;
  submitted_at: string; // ISO
  prompt_version: string; // "v4.1"
  language: string; // "en" | "es"
  brief_revision: number;
  is_update: boolean;
  /**
   * Tenant routing key (S13 multi-tenant pivot). The getAutoura platform is ONE
   * endpoint for the whole family; the receiver maps this string to a tenant via
   * its `concierge_brand_mappings` table (lowercase, trimmed; unmapped → 422).
   * Values = our RoutedBrand vocabulary: travel2egypt|affordegypt|sawa|sillage.
   */
  brand: string;
  visitor: AutouraVisitor;
  trip: AutouraTrip;
  preferences: AutouraPreferences;
  constraints: AutouraConstraints;
  brief_summary: string | null;
  full_transcript: AutouraTranscriptMessage[]; // inline — the proposal context
  follow_up_window: AutouraFollowUpWindow | null;
}
