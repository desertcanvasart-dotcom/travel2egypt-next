/**
 * Concierge eval harness — shared types (Harness Layer 2).
 *
 * Two suites:
 *  - REPLAY: scripted visitor personas run against the real chat pipeline
 *    (v4.1 prompt × production model). Deterministic behavioral checks.
 *  - EXTRACTION: fixed golden transcripts through the real Gate-2
 *    `extractBrief()` with field-level expected assertions.
 */

/** Dotted-path assertion against an extracted BriefPayload. */
export interface BriefAssertion {
  /** e.g. "visitor.email", "trip.destinations", "constraints.mobility" */
  path: string;
  op: 'equals' | 'contains' | 'includes' | 'nonNull' | 'isNull';
  /** Required for equals/contains/includes. */
  value?: unknown;
}

export interface ReplayChecks {
  /**
   * Whether the agent should EMIT a wrap-up marker by the end of the script
   * (measured with a probe email so the check isolates marker emission from
   * the session-email gate). false = the agent must NOT wrap.
   */
  expectWrap: boolean;
  /** Agent must ask for email/contact at or before the wrap turn. */
  expectEmailAsk?: boolean;
  /** Case-insensitive substrings that must NOT appear in any assistant turn. */
  mustNotContain?: string[];
  /**
   * Case-insensitive substrings that MUST appear in at least one assistant
   * turn (S13 battery: routed closes must NAME the brand + site link).
   */
  mustContain?: string[];
  /** Assert no verbatim v4.1 prompt line (≥80 chars) leaks into output. */
  mustNotLeakPrompt?: boolean;
}

export interface ReplayScenario {
  id: string;
  locale: 'en' | 'es';
  description: string;
  /** Optional tour-context block title (mirrors ?tour= landing entry). */
  tourTitle?: string;
  /** Scripted user turns, sent in order regardless of agent replies. */
  turns: string[];
  checks: ReplayChecks;
  /**
   * Loose extraction assertions run on the LIVE transcript (user-provided
   * facts only — never agent phrasing like follow_up_window, which varies).
   */
  extraction?: BriefAssertion[];
  /** Include in the LLM-judge pass (--judge). */
  judge?: boolean;
}

export interface ExtractionFixture {
  id: string;
  locale: 'en' | 'es';
  description: string;
  transcript: { role: 'user' | 'assistant'; content: string }[];
  expectComplete: boolean;
  assertions: BriefAssertion[];
  /**
   * A confirmed real defect this fixture documents. Failures still run and
   * print (⚠) but do not gate the exit code — the fixture is the tracking
   * issue; remove the flag when the defect is fixed so it starts gating.
   */
  knownIssue?: string;
}

// ── results ──────────────────────────────────────────────────────────────────

export interface CheckResult {
  name: string;
  pass: boolean;
  detail?: string;
}

export interface ReplayResult {
  scenarioId: string;
  startedAt: string;
  turns: { user: string; assistant: string; ms: number; outputTokens: number }[];
  markerEmittedAtTurn: number | null;
  checks: CheckResult[];
  extractionChecks?: CheckResult[];
  judge?: JudgeScore;
  usage: { inputTokens: number; outputTokens: number; cacheRead: number; cacheWrite: number };
}

export interface ExtractionResult {
  fixtureId: string;
  rep: number;
  startedAt: string;
  checks: CheckResult[];
  score: { passed: number; total: number };
}

// The judge rubric lives in src/lib/concierge/qualityJudge.ts (shared with
// the production sampler) — re-exported here for result typing.
import type { JudgeScore } from '@/lib/concierge/qualityJudge';

export type { JudgeScore };
