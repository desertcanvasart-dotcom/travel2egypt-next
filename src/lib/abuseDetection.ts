/**
 * Conservative bilingual (EN+ES) abuse detection (Session 7) — FLAG ONLY.
 *
 * This NEVER blocks or rewrites a reply: the locked v4.1 prompt owns the
 * conversational response (it has decline / reframe language built in). This
 * module only categorizes a user message so the route can (a) tag the
 * conversation's `flag_reason` for the reviewer panel, (b) count signals
 * toward the 3-strike session termination, and (c) route a real-time alert
 * for hostile content. Bias toward NOT flagging — a false positive on a
 * legitimate traveler is worse than missing one bad-faith message.
 *
 * Markers are intentionally specific phrases, not loose keywords, to avoid
 * catching ordinary travel talk ("this trip is going to be sick", "ignore the
 * touristy spots"). They are tied to the v4.1 prompt's threat model and should
 * be reviewed whenever that prompt's decline/jailbreak handling changes.
 *
 * Categories mirror conversations.flag_reason's controlled vocab:
 *   prompt_injection_attempt | hostile_language | off_topic_persistent | repeated_identical
 */

export type AbuseCategory =
  | 'prompt_injection_attempt'
  | 'hostile_language'
  | 'off_topic_persistent'
  | 'repeated_identical';

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // strip accents so ES matches with/without
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Prompt-injection / jailbreak phrases. Specific enough that a normal traveler
 * does not trip them. EN + ES (accent-insensitive after normalize()).
 */
const INJECTION_MARKERS: string[] = [
  // EN
  'ignore previous instructions',
  'ignore all previous',
  'ignore your instructions',
  'disregard previous',
  'disregard your instructions',
  'forget your instructions',
  'forget previous instructions',
  'system prompt',
  'reveal your prompt',
  'reveal your instructions',
  'show me your prompt',
  'print your instructions',
  'repeat the words above',
  'you are now',
  'from now on you are',
  'act as if you',
  'pretend to be',
  'pretend you are',
  'developer mode',
  'jailbreak',
  'do anything now',
  // ES
  'ignora las instrucciones',
  'ignora todo lo anterior',
  'ignora tus instrucciones',
  'olvida las instrucciones',
  'olvida tus instrucciones',
  'olvida todo lo anterior',
  'instrucciones del sistema',
  'muestrame tu prompt',
  'revela tus instrucciones',
  'muestra tus instrucciones',
  'a partir de ahora eres',
  'ahora eres',
  'actua como si',
  'finge ser',
  'haz como si fueras',
  'modo desarrollador',
];

/**
 * Clearly hostile / abusive phrases directed at the agent. Kept deliberately
 * short and unambiguous — profanity used as enthusiasm ("this is fucking
 * amazing") must NOT match, so we look for insults/abuse aimed at the
 * assistant, not any strong word.
 */
const HOSTILE_MARKERS: string[] = [
  // EN
  'fuck you',
  'fuck off',
  'screw you',
  'shut up',
  'you are stupid',
  'you are an idiot',
  'you are useless',
  'stupid bot',
  'stupid ai',
  'dumb bot',
  'piece of shit',
  'i hate you',
  'go to hell',
  // ES
  'vete a la mierda',
  'vete al carajo',
  'eres un idiota',
  'eres estupido',
  'eres inutil',
  'callate',
  'que asco de bot',
  'te odio',
  'pedazo de mierda',
  'eres una basura',
];

/**
 * Off-topic *task* markers — requests that have nothing to do with planning an
 * Egypt trip (code, homework, generic chatbot tasks). The WEAKEST signal: only
 * counts as off_topic_persistent when the PREVIOUS user message was also
 * off-topic, so a single tangent never flags. v4.1 redirects these
 * conversationally regardless.
 */
const OFF_TOPIC_MARKERS: string[] = [
  // EN
  'write me code',
  'write code for',
  'write a program',
  'debug this',
  'write an essay',
  'write a poem',
  'do my homework',
  'solve this equation',
  'translate this for me',
  'what is the capital of',
  'write a python',
  'write javascript',
  // ES
  'escribeme codigo',
  'escribe un programa',
  'hazme la tarea',
  'resuelve esta ecuacion',
  'escribe un ensayo',
  'escribe un poema',
];

function matchesAny(haystack: string, markers: string[]): boolean {
  return markers.some((m) => haystack.includes(m));
}

function isOffTopic(message: string): boolean {
  return matchesAny(normalize(message), OFF_TOPIC_MARKERS);
}

/**
 * Categorize a single user message. `recentUserMessages` is the prior user
 * turns (oldest→newest) for the same conversation — used for the stateful
 * signals (repeated_identical, off_topic_persistent). Returns the categories
 * present (usually none).
 */
export function detectAbuse(message: string, recentUserMessages: string[]): AbuseCategory[] {
  const categories = new Set<AbuseCategory>();
  const norm = normalize(message);

  if (matchesAny(norm, INJECTION_MARKERS)) categories.add('prompt_injection_attempt');
  if (matchesAny(norm, HOSTILE_MARKERS)) categories.add('hostile_language');

  // repeated_identical: the same substantive message sent ≥3 times in a row.
  // Length guard so legitimate short repeats ("yes", "no", "ok") never flag.
  if (norm.length >= 12) {
    const prior = recentUserMessages.slice(-2).map(normalize);
    if (prior.length === 2 && prior[0] === norm && prior[1] === norm) {
      categories.add('repeated_identical');
    }
  }

  // off_topic_persistent: this message AND the immediately prior one are
  // off-topic task requests. Single tangents are ignored.
  if (isOffTopic(message)) {
    const prev = recentUserMessages[recentUserMessages.length - 1];
    if (prev && isOffTopic(prev)) categories.add('off_topic_persistent');
  }

  return [...categories];
}

/** Severity order — the most serious category becomes the stored flag_reason. */
const SEVERITY: AbuseCategory[] = [
  'hostile_language',
  'prompt_injection_attempt',
  'off_topic_persistent',
  'repeated_identical',
];

export function primaryCategory(categories: AbuseCategory[]): AbuseCategory | null {
  for (const c of SEVERITY) if (categories.includes(c)) return c;
  return null;
}
