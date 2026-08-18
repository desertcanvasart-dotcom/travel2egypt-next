/**
 * Transform our internal brief into the Autoura wire payload (Session 9) — PURE.
 *
 * Our `BriefPayload` (types/concierge.ts) and Autoura's accepted shape disagree
 * in five places; this is the single layer that reconciles them, kept pure so
 * it is unit-testable without a network or DB:
 *   1. visitor.nationality  → trip.nationality
 *   2. visitor.origin_city   → trip.origin_city
 *   3. trip.length_days      → trip.trip_length_days
 *   4. trip.destinations     → preferences.destinations
 *   5. follow_up_window (flat string) → object {committed_response_by,
 *      cairo_time_label, visitor_local_label}  (see buildFollowUpWindow)
 *
 * Everything else passes straight through. `comfort_level` is sent VERBATIM —
 * we deliberately do not normalize the v4.1 vocabulary
 * (budget|mid-range|boutique|international-5-star|luxury) to Autoura's tier
 * map; pre-massaging it here would hide the receiver-side mapping gap
 * (international-5-star currently lands as 'standard'). That gap is reported to
 * the Autoura owner, not patched on the wire (Phase 0 decision #4).
 */
import type { BriefPayload } from '@/types/concierge';
import type { RoutedBrand } from '@/lib/concierge/brands';

import { computeFollowUpInstant } from '../timeframe';
import type {
  AutouraBriefPayload,
  AutouraFollowUpWindow,
  AutouraTranscriptMessage,
} from './types';

export interface AutouraPayloadContext {
  /** The conversation's session row id (opaque to Autoura). */
  sessionId: string | null;
  /** Idempotency / revision correlation key on the Autoura side. */
  conversationId: string;
  /** ISO — when the brief completed (briefs/conversation timestamp). */
  submittedAt: string;
  /** Conversation prompt version, e.g. "v4.1". */
  promptVersion: string;
  language: 'en' | 'es';
  briefRevision: number;
  isUpdate: boolean;
  /**
   * Tenant routing key on the wire (S13 multi-tenant pivot) — the brief row's
   * immutable `delivered_brand` snapshot. The single getAutoura endpoint maps
   * it to a tenant; see AutouraBriefPayload.brand.
   */
  brand: RoutedBrand;
}

/**
 * Build Autoura's follow_up_window object from our flat string label.
 *
 * Gated on the agent having actually made a commitment: if the brief's
 * follow_up_window is null (no commitment), the whole object is null — we never
 * fabricate an SLA the agent did not promise. When present, the verbatim string
 * is the authoritative `cairo_time_label`; the instant and the visitor-zone
 * label are reconstructed from `submitted_at` via the shared cutoff rule, and
 * each is left null if it cannot be derived (Autoura requires none of them).
 */
export function buildFollowUpWindow(
  label: string | null,
  submittedAtIso: string,
  visitorTimezone: string | null,
  locale: string,
): AutouraFollowUpWindow | null {
  if (!label) return null;

  const submittedAt = new Date(submittedAtIso);
  let committedResponseBy: string | null = null;
  let visitorLocalLabel: string | null = null;

  if (!Number.isNaN(submittedAt.getTime())) {
    const { instant } = computeFollowUpInstant(submittedAt);
    committedResponseBy = instant.toISOString();
    if (visitorTimezone) {
      try {
        visitorLocalLabel = new Intl.DateTimeFormat(locale, {
          timeZone: visitorTimezone,
          hour: 'numeric',
          minute: '2-digit',
        }).format(instant);
      } catch {
        // Unknown/invalid IANA zone from the extraction → leave null.
        visitorLocalLabel = null;
      }
    }
  }

  return {
    committed_response_by: committedResponseBy,
    cairo_time_label: label,
    visitor_local_label: visitorLocalLabel,
  };
}

export function toAutouraPayload(
  brief: BriefPayload,
  ctx: AutouraPayloadContext,
  transcript: AutouraTranscriptMessage[],
): AutouraBriefPayload {
  const { visitor, trip, preferences, constraints } = brief;

  return {
    session_id: ctx.sessionId,
    conversation_id: ctx.conversationId,
    submitted_at: ctx.submittedAt,
    prompt_version: ctx.promptVersion,
    language: ctx.language,
    brief_revision: ctx.briefRevision,
    is_update: ctx.isUpdate,
    brand: ctx.brand,

    visitor: {
      name: visitor.name,
      email: visitor.email,
      phone: visitor.phone,
      preferred_contact: visitor.preferred_contact,
      timezone: visitor.timezone,
    },

    trip: {
      travelers_count: trip.travelers_count,
      travelers_detail: trip.travelers_detail,
      dates_specific: trip.dates_specific,
      dates_window: trip.dates_window,
      trip_length_days: trip.length_days, // (3) rename
      origin_city: visitor.origin_city, // (2) visitor → trip
      nationality: visitor.nationality, // (1) visitor → trip
      international_flights: trip.international_flights,
    },

    preferences: {
      destinations: trip.destinations, // (4) trip → preferences
      comfort_level: preferences.comfort_level, // verbatim (see header)
      interests: preferences.interests,
      must_see: preferences.must_see,
      must_avoid: preferences.must_avoid,
    },

    constraints: {
      dietary: constraints.dietary,
      mobility: constraints.mobility,
      religious: constraints.religious,
      medical: constraints.medical,
    },

    brief_summary: brief.brief_summary,
    full_transcript: transcript,
    follow_up_window: buildFollowUpWindow(
      brief.follow_up_window, // (5) flat string → object
      ctx.submittedAt,
      visitor.timezone,
      ctx.language,
    ),
  };
}
