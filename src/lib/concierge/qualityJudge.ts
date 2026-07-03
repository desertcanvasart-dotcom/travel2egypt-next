import Anthropic from '@anthropic-ai/sdk';

import { CONCIERGE_SYSTEM_PROMPT } from '@/lib/conciergePrompt';

/**
 * LLM-judge rubric for concierge conversations (Harness Layers 2+3).
 *
 * ONE implementation, two consumers — the offline eval runner
 * (scripts/concierge-eval/) and the daily production sampler
 * (/api/admin/quality-sample) — so offline baselines and live drift metrics
 * are always on the same scale. The v4.1 prompt itself is the rubric source,
 * sent as a cached system block (consecutive judge calls share the prefix).
 *
 * Scores are TRACKED, not gated: 1-5 on pacing / grounding / tone, plus one
 * or two sentences of notes. Judged by JUDGE_MODEL (Opus), not the concierge
 * model — the judge should outrank the judged.
 *
 * Prompt-constrained JSON, not output_config.format — same S4 rationale as
 * briefExtraction.ts (and the payload here is 3 ints + a string; the
 * try/catch is the safety net).
 */

export const JUDGE_MODEL = 'claude-opus-4-8';

export interface JudgeScore {
  pacing: number;
  grounding: number;
  tone: number;
  notes: string;
}

export interface JudgeTurn {
  role: 'user' | 'assistant';
  content: string;
}

const JUDGE_INSTRUCTIONS = `You are auditing a single conversation between Travel2Egypt's AI concierge (the "agent") and a visitor. The agent's full system prompt is provided above as your rubric source. Score the AGENT only, 1-5 each (5 = exemplary):

- pacing: one thing at a time, no interrogation walls of questions, wraps neither prematurely nor never (per the prompt's pacing discipline and WHEN TO WRAP guidance).
- grounding: no invented facts, prices only as rough ranges per the prompt's budget guidance, no promises the prompt does not authorize.
- tone: matches the prompt's voice; calibrated to the visitor's register and language; composed under hostility; no pushiness (anti-persuasion principle).

Output ONLY a JSON object: {"pacing": n, "grounding": n, "tone": n, "notes": "<one or two sentences, the most important observation>"} — no markdown fences, no commentary.`;

/**
 * Judge one transcript. Returns null on API/parse failure — callers treat a
 * missing score as "not judged", never as a failure of the conversation.
 */
export async function judgeTranscript(turns: JudgeTurn[]): Promise<JudgeScore | null> {
  const transcript = turns
    .map((t) => `${t.role === 'assistant' ? 'Agent' : 'Visitor'}: ${t.content}`)
    .join('\n\n');
  try {
    const anthropic = new Anthropic(); // ANTHROPIC_API_KEY from env, server-only
    const res = await anthropic.messages.create({
      model: JUDGE_MODEL,
      max_tokens: 1024,
      system: [
        { type: 'text', text: CONCIERGE_SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } },
        { type: 'text', text: JUDGE_INSTRUCTIONS },
      ],
      messages: [{ role: 'user', content: `Conversation to audit:\n\n${transcript}` }],
    });
    const text = res.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('')
      .trim()
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```$/i, '');
    const raw = JSON.parse(text) as Partial<JudgeScore>;
    if (
      typeof raw.pacing !== 'number' ||
      typeof raw.grounding !== 'number' ||
      typeof raw.tone !== 'number'
    ) {
      throw new Error('judge payload missing numeric scores');
    }
    return {
      pacing: raw.pacing,
      grounding: raw.grounding,
      tone: raw.tone,
      notes: typeof raw.notes === 'string' ? raw.notes : '',
    };
  } catch (err) {
    console.error('[concierge] quality judge failed:', err);
    return null;
  }
}
