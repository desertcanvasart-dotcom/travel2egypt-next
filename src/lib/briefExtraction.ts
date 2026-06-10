import Anthropic from '@anthropic-ai/sdk';

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
  "follow_up_window":"by 8 p.m. Cairo time" }

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
  "follow_up_window":null }

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
  "follow_up_window":"by 10 a.m. Cairo time tomorrow" }`;

const str = { type: 'string' } as const;
const strArray = { type: 'array', items: { type: 'string' } } as const;

/**
 * Structured-outputs schema. Optional fields are modeled as
 * optional-by-omission (NOT nullable unions): the API caps union-typed
 * params at 16, and an all-nullable brief exceeds that. The model omits
 * fields it has no data for; `normalizeBrief` fills them with null / [] so
 * the returned object is always a complete BriefPayload. Only `complete`
 * and the four container objects are required.
 */
const BRIEF_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['complete', 'visitor', 'trip', 'preferences', 'constraints'],
  properties: {
    complete: { type: 'boolean' },
    visitor: {
      type: 'object',
      additionalProperties: false,
      properties: {
        name: str,
        email: str,
        phone: str,
        preferred_contact: { type: 'string', enum: ['email', 'phone', 'whatsapp'] },
        nationality: str,
        origin_city: str,
        timezone: str,
      },
    },
    trip: {
      type: 'object',
      additionalProperties: false,
      properties: {
        travelers_count: { type: 'integer' },
        travelers_detail: str,
        dates_specific: str,
        dates_window: str,
        length_days: { type: 'integer' },
        international_flights: { type: 'boolean' },
        destinations: strArray,
      },
    },
    preferences: {
      type: 'object',
      additionalProperties: false,
      properties: {
        comfort_level: str,
        interests: strArray,
        must_see: strArray,
        must_avoid: strArray,
      },
    },
    constraints: {
      type: 'object',
      additionalProperties: false,
      properties: {
        dietary: str,
        mobility: str,
        religious: str,
        medical: str,
      },
    },
    brief_summary: str,
    follow_up_window: str,
  },
} as const;

type RawBrief = {
  complete?: unknown;
  visitor?: Record<string, unknown>;
  trip?: Record<string, unknown>;
  preferences?: Record<string, unknown>;
  constraints?: Record<string, unknown>;
  brief_summary?: unknown;
  follow_up_window?: unknown;
};

const s = (v: unknown): string | null => (typeof v === 'string' && v ? v : null);
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
export async function extractBrief(messages: ExtractionMessage[]): Promise<BriefPayload> {
  const anthropic = new Anthropic(); // ANTHROPIC_API_KEY from env, server-only
  const res = await anthropic.messages.create({
    model: CONCIERGE_MODEL,
    max_tokens: 1024,
    system: [{ type: 'text', text: EXTRACTION_PROMPT, cache_control: { type: 'ephemeral' } }],
    messages: [{ role: 'user', content: formatTranscript(messages) }],
    // Guarantee the JSON shape; the prompt examples guide field population.
    output_config: { format: { type: 'json_schema', schema: BRIEF_SCHEMA } },
  });

  const text = res.content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map((b) => b.text)
    .join('')
    .trim();
  if (!text) throw new Error('extraction returned empty content');

  let raw: RawBrief;
  try {
    raw = JSON.parse(text) as RawBrief;
  } catch {
    throw new Error(`extraction returned non-JSON: ${text.slice(0, 200)}`);
  }
  if (typeof raw.complete !== 'boolean') {
    throw new Error('extraction payload missing complete:boolean');
  }
  return normalizeBrief(raw);
}
