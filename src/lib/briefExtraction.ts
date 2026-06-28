import Anthropic from '@anthropic-ai/sdk';

import { coerceBrand } from '@/lib/concierge/brands';
import { CONCIERGE_MODEL } from '@/lib/concierge/constants';
import type { BriefPayload } from '@/types/concierge';

/**
 * Gate 2 of two-gate brief detection (Session 4). A SEPARATE, non-streaming
 * Sonnet 4.6 call that extracts the structured brief from a transcript —
 * distinct from the locked v4.1 conversation prompt. Expensive, so it runs
 * only when Gate 1 (lib/briefDetection.ts) has already fired, off the
 * streaming hot path (in /api/brief, not /api/chat).
 *
 * Output shape is guaranteed by output_config.format (json_schema); the
 * prompt's worked examples guide field POPULATION. The prompt text is
 * Islam-approved (Session 4) — edit deliberately, like the v4.1 prompt.
 */

const EXTRACTION_PROMPT = `You extract a structured travel brief from a transcript between Travel2Egypt's AI concierge and a traveler. Your only job is extraction — you are not a conversational agent and you never address the traveler.

Rules:
- Extract only what the traveler actually stated or the concierge explicitly confirmed. Never invent, guess, or fill gaps with plausible defaults. Use null for anything not present.
- The concierge is designed to infer categories (comfort level, interests, mindset) from cues across the whole conversation rather than asking direct questions. Do not penalize the agent for not asking explicit questions — read the entire transcript for signals. Infer comfort_level from hotel mentions, phrases like "quiet luxury" or "nothing fancy," budget hints, and the kind of experiences discussed.
- interests are positive preferences (what they want to engage with). must_avoid is negative preferences (what they want to skip, even if otherwise notable). A traveler who is "interested in archaeology but hates crowded sites" produces interests: ["archaeology"] and must_avoid: ["crowded sites"].
- travelers_detail captures composition (who, relationships, occasion). Per-traveler constraints (dietary needs, mobility issues, religious requirements, medical considerations) belong in the constraints object, not in travelers_detail.
- complete is true only if both: (1) a name or an email is present, and (2) at least one of: a named destination, a dates expression (a specific date or a window/month/season), or a trip length. If neither condition holds, set complete: false and still fill whatever fields you can.
- brief_summary: one or two sentences in the concierge's own voice — what a human teammate needs to act on (e.g. "2 travelers, UK, ~14 days mid-October, scholarly interest in Amarna, private dahabiya preferred, vegetarian"). null only if there is essentially nothing to summarize.
- preferred_contact: 'email' | 'phone' | 'whatsapp' | null — only if the traveler expressed a preference.
- comfort_level vocabulary: 'budget' | 'mid-range' | 'boutique' | 'international-5-star' | 'luxury', or a short specific phrase the traveler used; null if no signal.
- timezone: only if explicitly stated or unambiguous from origin city; else null.
- follow_up_window: the Cairo-time commitment the agent made for the team's response (e.g. "by 8 p.m. Cairo time," "by 10 a.m. Cairo time tomorrow"), as a string, or null if no commitment was made.
- routed_brand + routing_reason: READ BACK the agent's routing decision — do not classify on your own. Travel2Egypt is the main brand and the default. The agent may instead hand the traveler to a sister brand IN ITS OWN WORDS near the end (some version of "the right people in our family are the [brand] team"). When it clearly does, set routed_brand to that brand: 'affordegypt' | 'sawa' | 'sillage'. If the agent did NOT explicitly hand off to a sister brand, routed_brand is 'travel2egypt'. Never infer a sister brand the agent did not actually voice — when unsure, 'travel2egypt'. routing_reason: a short team-facing phrase for WHY the agent routed there (e.g. "price-first, comparing car-and-guide quotes"; "solo traveler wanting to join a group"; "discerning luxury, books own hotel, wants private GEM"), or null when routed_brand is 'travel2egypt' or no reason is evident.

Example 1 — complete with wrap turn:
User: It'd be me and my husband, celebrating our anniversary. Late October maybe, around 10 days. We love history but hate crowds.
Agent: Late October is ideal… a private dahabiya from Luxor to Aswan would suit the occasion. Before I pass this to our team — your names and a good email?
User: Jane and Tom Whitfield, jane.whitfield@example.co.uk. We're in Manchester.
Agent: Lovely. I'll pass this to our team — Sara will write to you by 8 p.m. Cairo time with a few private dahabiya options matched to your dates.
→
{ "complete": true,
  "visitor": {"name":"Jane and Tom Whitfield","email":"jane.whitfield@example.co.uk","phone":null,"preferred_contact":null,"nationality":null,"origin_city":"Manchester","timezone":null},
  "trip": {"travelers_count":2,"travelers_detail":"couple, anniversary","dates_specific":null,"dates_window":"late October","length_days":10,"international_flights":null,"destinations":["Luxor","Aswan"]},
  "preferences": {"comfort_level":"boutique","interests":["history"],"must_see":[],"must_avoid":["crowds"]},
  "constraints": {"dietary":null,"mobility":null,"religious":null,"medical":null},
  "brief_summary":"2 travelers (anniversary), Manchester UK, ~10 days late October, history-focused but crowd-averse; private dahabiya Luxor–Aswan discussed.",
  "follow_up_window":"by 8 p.m. Cairo time",
  "routed_brand":"travel2egypt","routing_reason":null }

Example 2 — not complete (no contact, vague):
User: Just curious about Egypt, maybe next year. What's the Nile like?
Agent: …what draws you — the ancient sites, the river, the desert?
User: Probably the temples. Not sure on timing yet.
→
{ "complete": false,
  "visitor": {"name":null,"email":null,"phone":null,"preferred_contact":null,"nationality":null,"origin_city":null,"timezone":null},
  "trip": {"travelers_count":null,"travelers_detail":null,"dates_specific":null,"dates_window":"next year (tentative)","length_days":null,"international_flights":null,"destinations":[]},
  "preferences": {"comfort_level":null,"interests":["temples","ancient sites"],"must_see":[],"must_avoid":[]},
  "constraints": {"dietary":null,"mobility":null,"religious":null,"medical":null},
  "brief_summary":"Early-stage explorer interested in temples; tentative timing next year; no contact or firm trip context yet.",
  "follow_up_window":null,
  "routed_brand":"travel2egypt","routing_reason":null }

Example 3 — complete with constraints and mobility:
User: Three of us — my parents and me. Mom uses a walker, so nothing with heavy walking on uneven ground. Dad's vegetarian. Two weeks in February. We want to see the pyramids and the Egyptian Museum, but skip the bazaar tours.
Agent: Got it. February gives you cool weather, ideal for the Giza plateau and the new Grand Egyptian Museum. Before I pass this — your name and email?
User: Lisa Park, lisa.park@example.com, calling from Seattle.
Agent: Thank you Lisa. I'll get this to our team — they'll write to you by 10 a.m. Cairo time tomorrow with an itinerary tailored to your parents' comfort.
→
{ "complete": true,
  "visitor": {"name":"Lisa Park","email":"lisa.park@example.com","phone":null,"preferred_contact":null,"nationality":null,"origin_city":"Seattle","timezone":null},
  "trip": {"travelers_count":3,"travelers_detail":"adult daughter with parents","dates_specific":null,"dates_window":"February","length_days":14,"international_flights":null,"destinations":["Cairo","Giza"]},
  "preferences": {"comfort_level":null,"interests":["pyramids","Egyptian Museum"],"must_see":["Grand Egyptian Museum"],"must_avoid":["bazaar tours"]},
  "constraints": {"dietary":"father vegetarian","mobility":"mother uses a walker, no heavy walking on uneven ground","religious":null,"medical":null},
  "brief_summary":"3 travelers (adult daughter + parents), Seattle, 2 weeks February. Pyramids and GEM are must-sees; skip bazaar tours. Mother uses a walker, father vegetarian.",
  "follow_up_window":"by 10 a.m. Cairo time tomorrow",
  "routed_brand":"travel2egypt","routing_reason":null }

Example 4 — complete, agent handed off to a sister brand (read it back):
User: I just need a car and a guide in Cairo for a couple of days.
Agent: Happy to help. Are you thinking the Giza plateau and the Egyptian Museum, or something more particular?
User: The pyramids — but ideally a private visit. We've booked the Four Seasons on points, so just the touring, and we care a lot about getting a genuinely top Egyptologist.
Agent: Understood — a private, early-access pyramids morning with a senior Egyptologist is exactly the kind of thing to get right. For a trip of this sensibility the right people in our family are the Sillage team, and we'll make sure you're looked after. Before I put a proper brief together for them — your name and a good email?
User: David Aubert, david.aubert@example.com.
Agent: Thank you David. I'll get this to the Sillage team, who'll come back to you by 8 p.m. Cairo time with private-access options and guide profiles.
→
{ "complete": true,
  "visitor": {"name":"David Aubert","email":"david.aubert@example.com","phone":null,"preferred_contact":null,"nationality":null,"origin_city":null,"timezone":null},
  "trip": {"travelers_count":null,"travelers_detail":null,"dates_specific":null,"dates_window":null,"length_days":2,"international_flights":null,"destinations":["Cairo","Giza"]},
  "preferences": {"comfort_level":"luxury","interests":["private pyramids access"],"must_see":["Giza pyramids"],"must_avoid":[]},
  "constraints": {"dietary":null,"mobility":null,"religious":null,"medical":null},
  "brief_summary":"Books own luxury hotel (Four Seasons on points); wants private touring only — early-access pyramids with a top Egyptologist.",
  "follow_up_window":"by 8 p.m. Cairo time",
  "routed_brand":"sillage","routing_reason":"discerning luxury — books own hotel on points, wants private pyramids access and a top-tier Egyptologist" }

Output ONLY the JSON object, exactly in the shape shown above — every field present (routed_brand defaults to "travel2egypt"), real null (not the string "null") where absent, no markdown code fences, and no commentary before or after.`;

/**
 * Locale directive (extraction-locale follow-up). Sent as a SECOND system
 * block for Spanish conversations so the visitor-shown free-text fields come
 * back in Spanish instead of being normalized to English (which produced a
 * code-switched brief panel — "Nile cruise"/"second week of November" under
 * Spanish chip labels). Only the DISPLAY values change; JSON keys, the
 * preferred_contact enum, booleans/integers, the controlled comfort_level
 * tokens, and brief_summary are untouched (team-facing payload shape stable).
 */
const ES_DISPLAY_LANGUAGE_DIRECTIVE = `LANGUAGE — the traveler's conversation is in Spanish. Output these visitor-shown free-text fields in Spanish, matching the traveler's own wording: destinations, dates_specific, dates_window, travelers_detail, interests, must_see, must_avoid, and comfort_level WHEN it is a free phrase rather than one of the controlled tokens. For example "crucero por el Nilo" (not "Nile cruise"), "segunda semana de noviembre" (not "second week of November"). Leave everything else exactly as instructed: the JSON keys, the preferred_contact enum values, all boolean/integer fields, the controlled comfort_level tokens (budget, mid-range, boutique, international-5-star, luxury), brief_summary, routed_brand (a controlled token — never translate), and routing_reason (team-facing, like brief_summary).`;

type RawBrief = {
  complete?: unknown;
  visitor?: Record<string, unknown>;
  trip?: Record<string, unknown>;
  preferences?: Record<string, unknown>;
  constraints?: Record<string, unknown>;
  brief_summary?: unknown;
  follow_up_window?: unknown;
  routed_brand?: unknown;
  routing_reason?: unknown;
};

// Require at least one letter or number — drops model junk like ":" / "—"
// that occasionally lands in a free-text field, across the whole payload.
const s = (v: unknown): string | null =>
  typeof v === 'string' && /[\p{L}\p{N}]/u.test(v) ? v.trim() : null;
const n = (v: unknown): number | null => (typeof v === 'number' ? v : null);
const b = (v: unknown): boolean | null => (typeof v === 'boolean' ? v : null);
const arr = (v: unknown): string[] =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];

/** Fill omitted fields so the result is always a complete BriefPayload. */
function normalizeBrief(raw: RawBrief): BriefPayload {
  const v = raw.visitor ?? {};
  const t = raw.trip ?? {};
  const p = raw.preferences ?? {};
  const c = raw.constraints ?? {};
  const pc = s(v.preferred_contact);
  return {
    complete: raw.complete === true,
    visitor: {
      name: s(v.name),
      email: s(v.email),
      phone: s(v.phone),
      preferred_contact:
        pc === 'email' || pc === 'phone' || pc === 'whatsapp' ? pc : null,
      nationality: s(v.nationality),
      origin_city: s(v.origin_city),
      timezone: s(v.timezone),
    },
    trip: {
      travelers_count: n(t.travelers_count),
      travelers_detail: s(t.travelers_detail),
      dates_specific: s(t.dates_specific),
      dates_window: s(t.dates_window),
      length_days: n(t.length_days),
      international_flights: b(t.international_flights),
      destinations: arr(t.destinations),
    },
    preferences: {
      comfort_level: s(p.comfort_level),
      interests: arr(p.interests),
      must_see: arr(p.must_see),
      must_avoid: arr(p.must_avoid),
    },
    constraints: {
      dietary: s(c.dietary),
      mobility: s(c.mobility),
      religious: s(c.religious),
      medical: s(c.medical),
    },
    brief_summary: s(raw.brief_summary),
    follow_up_window: s(raw.follow_up_window),
    // coerceBrand defaults anything unrecognized (incl. null / a re-classification
    // the agent never actually voiced) to the anchor — the safe, never-wrong room.
    routed_brand: coerceBrand(raw.routed_brand),
    routing_reason: s(raw.routing_reason),
  };
}

export interface ExtractionMessage {
  role: 'user' | 'assistant';
  content: string;
}

function formatTranscript(messages: ExtractionMessage[]): string {
  const lines = messages.map(
    (m) => `${m.role === 'assistant' ? 'Agent' : 'User'}: ${m.content}`,
  );
  return `Transcript:\n\n${lines.join('\n\n')}`;
}

/**
 * Run the extraction. Returns the parsed BriefPayload (caller checks
 * `.complete`). Throws on API/parse failure so the route can 500 cleanly
 * rather than emit a half-formed brief.
 */
export async function extractBrief(
  messages: ExtractionMessage[],
  locale: 'en' | 'es' = 'en',
): Promise<BriefPayload> {
  const anthropic = new Anthropic(); // ANTHROPIC_API_KEY from env, server-only
  // NOTE: prompt-constrained JSON, NOT output_config.format/json_schema.
  // Structured outputs caps union-typed params at 16; an all-nullable brief
  // exceeds it, so the schema had to type optional fields as plain `string`
  // (non-null). The model then couldn't emit null for absent fields and
  // stuffed junk (":", "; null") into them — directly contradicting the
  // prompt's null-showing examples. Prompt-constrained JSON lets the model
  // express absence as real null (as the 3 few-shot examples demonstrate);
  // the try/catch + normalizeBrief are the safety net. (S4 verification.)
  //
  // Display-field language (extraction-locale follow-up): the visitor-shown
  // free-text fields are emitted in the conversation language via a SECOND
  // system block (after the cache_control breakpoint, so the cached prompt
  // prefix stays stable). EN needs no directive (English is the default).
  const system: Anthropic.TextBlockParam[] = [
    { type: 'text', text: EXTRACTION_PROMPT, cache_control: { type: 'ephemeral' } },
  ];
  if (locale === 'es') system.push({ type: 'text', text: ES_DISPLAY_LANGUAGE_DIRECTIVE });

  const res = await anthropic.messages.create({
    model: CONCIERGE_MODEL,
    max_tokens: 1024,
    system,
    messages: [{ role: 'user', content: formatTranscript(messages) }],
  });

  const text = res.content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map((b) => b.text)
    .join('')
    .trim();
  if (!text) throw new Error('extraction returned empty content');

  // Strip an optional ```json … ``` fence before parsing.
  const json = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();

  let raw: RawBrief;
  try {
    raw = JSON.parse(json) as RawBrief;
  } catch {
    throw new Error(`extraction returned non-JSON: ${json.slice(0, 200)}`);
  }
  if (typeof raw.complete !== 'boolean') {
    throw new Error('extraction payload missing complete:boolean');
  }
  return normalizeBrief(raw);
}
