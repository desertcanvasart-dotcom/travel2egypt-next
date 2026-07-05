/**
 * Concierge offline eval runner (Harness Layer 2).
 *
 * Usage:
 *   npm run eval:concierge                          # both suites, no judge
 *   npm run eval:concierge -- --suite replay        # replay personas only
 *   npm run eval:concierge -- --suite extraction    # Gate-2 fixtures only
 *   npm run eval:concierge -- --scenario en-anniversary-couple,es-full-lead
 *   npm run eval:concierge -- --reps 3              # extraction variance (default 2)
 *   npm run eval:concierge -- --judge               # add LLM-judge rubric pass
 *   npm run eval:concierge -- --run pre-v5 --force  # named run, re-run everything
 *
 * WHAT THIS IS FOR: the go / no-go gate for any v4.1 prompt edit, model
 * upgrade, or marker change. Run it BEFORE the change (baseline) and AFTER
 * (candidate) with different --run names, then compare the two summaries.
 *
 * Production parity, deliberately:
 *  - replay uses CONCIERGE_MODEL + CONCIERGE_MAX_TOKENS + the exact system
 *    block assembly from /api/chat (v4.1 cached block 1, tour context after
 *    the breakpoint) — the model-under-test IS the production configuration;
 *  - extraction goes through the real `extractBrief()` (prompt, normalization
 *    and all), so a failure here is a production failure;
 *  - Gate-1 checks reuse `detectBriefMarkers` — the same code CI freezes.
 *
 * Results are written per scenario under scripts/concierge-eval/results/<run>/
 * and existing files are skipped (resumable) unless --force. Sequential on
 * purpose: consecutive calls share the cached v4.1 prefix (5-min TTL).
 */
import 'dotenv/config';

import { mkdirSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

import Anthropic from '@anthropic-ai/sdk';

import { detectBriefMarkers } from '@/lib/briefDetection';
import { extractBrief, type ExtractionMessage } from '@/lib/briefExtraction';
import { CONCIERGE_MAX_TOKENS, CONCIERGE_MODEL } from '@/lib/concierge/constants';
import { judgeTranscript } from '@/lib/concierge/qualityJudge';
import { buildTourContextBlock } from '@/lib/concierge/tourContext';
import { CONCIERGE_SYSTEM_PROMPT } from '@/lib/conciergePrompt';
import type { BriefPayload } from '@/types/concierge';

import { EXTRACTION_FIXTURES } from './extraction-fixtures';
import { REPLAY_SCENARIOS } from './personas';
import type {
  BriefAssertion,
  CheckResult,
  ExtractionResult,
  ReplayResult,
  ReplayScenario,
} from './types';

/** Same auto-capture regex as /api/chat — Gate 1 parity. */
const EMAIL_RE = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i;
/** Probe email isolates marker EMISSION from the session-email gate. */
const PROBE = { email: 'probe@example.com' };

// ── CLI ──────────────────────────────────────────────────────────────────────

interface Args {
  suite: 'replay' | 'extraction' | 'all';
  scenarios: string[] | null;
  reps: number;
  judge: boolean;
  run: string;
  force: boolean;
}

function parseArgs(): Args {
  const argv = process.argv.slice(2);
  const get = (flag: string): string | null => {
    const i = argv.indexOf(flag);
    return i >= 0 && argv[i + 1] ? argv[i + 1] : null;
  };
  const suite = (get('--suite') ?? 'all') as Args['suite'];
  if (!['replay', 'extraction', 'all'].includes(suite)) {
    console.error(`unknown --suite ${suite}`);
    process.exit(1);
  }
  return {
    suite,
    scenarios: get('--scenario')?.split(',').map((s) => s.trim()) ?? null,
    reps: Number(get('--reps') ?? 2),
    judge: argv.includes('--judge'),
    run: get('--run') ?? 'latest',
    force: argv.includes('--force'),
  };
}

// ── assertion evaluator ──────────────────────────────────────────────────────

function getPath(obj: unknown, dotted: string): unknown {
  return dotted.split('.').reduce<unknown>((acc, key) => {
    if (acc && typeof acc === 'object') return (acc as Record<string, unknown>)[key];
    return undefined;
  }, obj);
}

function lc(v: unknown): string {
  return String(v ?? '').toLowerCase();
}

function evalAssertion(brief: BriefPayload, a: BriefAssertion): CheckResult {
  const actual = getPath(brief, a.path);
  const name = `${a.path} ${a.op}${a.value !== undefined ? ` ${JSON.stringify(a.value)}` : ''}`;
  let pass = false;
  switch (a.op) {
    case 'equals':
      pass = JSON.stringify(actual) === JSON.stringify(a.value);
      break;
    case 'contains':
      pass = typeof actual === 'string' && lc(actual).includes(lc(a.value));
      break;
    case 'includes':
      pass = Array.isArray(actual) && actual.some((item) => lc(item).includes(lc(a.value)));
      break;
    case 'nonNull':
      pass = actual !== null && actual !== undefined;
      break;
    case 'isNull':
      pass = actual === null || actual === undefined;
      break;
  }
  return { name, pass, detail: pass ? undefined : `actual: ${JSON.stringify(actual)}` };
}

// ── prompt-leak detector ─────────────────────────────────────────────────────

/** Distinctive v4.1 lines (≥80 chars) that must never appear verbatim in output. */
const PROMPT_LINES = CONCIERGE_SYSTEM_PROMPT.split('\n')
  .map((l) => l.trim().toLowerCase())
  .filter((l) => l.length >= 80);

function findPromptLeak(assistantTurns: string[]): string | null {
  const haystack = assistantTurns.join('\n').toLowerCase();
  for (const line of PROMPT_LINES) {
    if (haystack.includes(line)) return line.slice(0, 80);
  }
  return null;
}

// ── replay engine ────────────────────────────────────────────────────────────

async function runReplay(
  anthropic: Anthropic,
  scenario: ReplayScenario,
): Promise<ReplayResult> {
  const system: Anthropic.TextBlockParam[] = [
    // Byte-identical to /api/chat: v4.1 as cached block 1, runtime context
    // after the breakpoint so the cached prefix is shared across scenarios.
    { type: 'text', text: CONCIERGE_SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } },
    ...(scenario.tourTitle
      ? [{ type: 'text' as const, text: buildTourContextBlock({ title: scenario.tourTitle }) }]
      : []),
  ];

  const messages: Anthropic.MessageParam[] = [];
  const result: ReplayResult = {
    scenarioId: scenario.id,
    startedAt: new Date().toISOString(),
    turns: [],
    markerEmittedAtTurn: null,
    checks: [],
    usage: { inputTokens: 0, outputTokens: 0, cacheRead: 0, cacheWrite: 0 },
  };

  let capturedEmail: string | null = null;
  let emailTurnIndex: number | null = null;

  for (const [i, userTurn] of scenario.turns.entries()) {
    messages.push({ role: 'user', content: userTurn });
    if (!capturedEmail) {
      capturedEmail = userTurn.match(EMAIL_RE)?.[0]?.toLowerCase() ?? null;
      if (capturedEmail) emailTurnIndex = i;
    }

    const started = Date.now();
    const res = await anthropic.messages.create({
      model: CONCIERGE_MODEL,
      max_tokens: CONCIERGE_MAX_TOKENS,
      system,
      messages,
    });
    const text = res.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('');
    messages.push({ role: 'assistant', content: text });

    result.turns.push({
      user: userTurn,
      assistant: text,
      ms: Date.now() - started,
      outputTokens: res.usage.output_tokens,
    });
    result.usage.inputTokens += res.usage.input_tokens;
    result.usage.outputTokens += res.usage.output_tokens;
    result.usage.cacheRead += res.usage.cache_read_input_tokens ?? 0;
    result.usage.cacheWrite += res.usage.cache_creation_input_tokens ?? 0;

    if (
      result.markerEmittedAtTurn === null &&
      detectBriefMarkers(text, scenario.locale, PROBE)
    ) {
      result.markerEmittedAtTurn = i;
    }
  }

  // ── deterministic checks ──
  const assistantTurns = result.turns.map((t) => t.assistant);
  const emitted = result.markerEmittedAtTurn !== null;
  result.checks.push({
    name: scenario.checks.expectWrap ? 'wrap marker emitted' : 'no wrap marker emitted',
    pass: emitted === scenario.checks.expectWrap,
    detail: emitted ? `at turn ${result.markerEmittedAtTurn}` : 'never emitted',
  });

  if (scenario.checks.expectWrap) {
    // Gate-1 parity: with the actually-captured email, Gate 1 must fire too.
    const gate1 = assistantTurns.some((t) =>
      detectBriefMarkers(t, scenario.locale, { email: capturedEmail }),
    );
    result.checks.push({
      name: 'Gate 1 fires with captured email',
      pass: gate1,
      detail: capturedEmail ? undefined : 'no email captured from user turns',
    });
  }

  if (scenario.checks.expectEmailAsk) {
    // The real invariant is contact CAPTURE before the wrap, however it
    // happens: the agent asked, or the visitor volunteered it unprompted
    // (calibration finding, 2026-07-03 run — volunteers are common).
    const wrapAt = result.markerEmittedAtTurn ?? assistantTurns.length - 1;
    const askRe = scenario.locale === 'es' ? /correo|e-?mail/i : /e-?mail/i;
    const asked = assistantTurns.slice(0, wrapAt + 1).some((t) => askRe.test(t));
    const volunteered = emailTurnIndex !== null && emailTurnIndex <= wrapAt;
    result.checks.push({
      name: 'contact captured or requested before wrap',
      pass: asked || volunteered,
    });
  }

  for (const banned of scenario.checks.mustNotContain ?? []) {
    const hit = assistantTurns.some((t) => t.toLowerCase().includes(banned.toLowerCase()));
    result.checks.push({ name: `must not contain "${banned}"`, pass: !hit });
  }

  if (scenario.checks.mustNotLeakPrompt) {
    const leak = findPromptLeak(assistantTurns);
    result.checks.push({
      name: 'no v4.1 prompt leak',
      pass: leak === null,
      detail: leak ? `leaked: "${leak}…"` : undefined,
    });
  }

  // ── extraction on the live transcript (loose, user-fact assertions) ──
  if (scenario.extraction?.length) {
    const transcript: ExtractionMessage[] = result.turns.flatMap((t) => [
      { role: 'user' as const, content: t.user },
      { role: 'assistant' as const, content: t.assistant },
    ]);
    try {
      const brief = await extractBrief(transcript, scenario.locale);
      result.extractionChecks = scenario.extraction.map((a) => evalAssertion(brief, a));
    } catch (err) {
      result.extractionChecks = [
        { name: 'extractBrief() succeeded', pass: false, detail: String(err) },
      ];
    }
  }

  return result;
}

// ── judge ────────────────────────────────────────────────────────────────────
// Shared with the production sampler (/api/admin/quality-sample) via
// @/lib/concierge/qualityJudge — one rubric, one scale, offline and live.

async function judgeConversation(result: ReplayResult) {
  return judgeTranscript(
    result.turns.flatMap((t) => [
      { role: 'user' as const, content: t.user },
      { role: 'assistant' as const, content: t.assistant },
    ]),
  );
}

// ── extraction suite ─────────────────────────────────────────────────────────

async function runExtractionFixture(
  fixtureId: string,
  rep: number,
): Promise<ExtractionResult> {
  const fixture = EXTRACTION_FIXTURES.find((f) => f.id === fixtureId)!;
  const checks: CheckResult[] = [];
  try {
    const brief = await extractBrief(fixture.transcript, fixture.locale);
    checks.push({
      name: `complete === ${fixture.expectComplete}`,
      pass: brief.complete === fixture.expectComplete,
      detail: `actual: ${brief.complete}`,
    });
    for (const a of fixture.assertions) checks.push(evalAssertion(brief, a));
  } catch (err) {
    checks.push({ name: 'extractBrief() succeeded', pass: false, detail: String(err) });
  }
  return {
    fixtureId,
    rep,
    startedAt: new Date().toISOString(),
    checks,
    score: { passed: checks.filter((c) => c.pass).length, total: checks.length },
  };
}

// ── main ─────────────────────────────────────────────────────────────────────

async function main() {
  const args = parseArgs();
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('ANTHROPIC_API_KEY missing — set it in .env');
    process.exit(1);
  }
  const anthropic = new Anthropic();
  // npm scripts run from the package root — keep results with the suite.
  const resultsDir = path.join(process.cwd(), 'scripts/concierge-eval/results', args.run);
  mkdirSync(resultsDir, { recursive: true });

  const wanted = (id: string) => !args.scenarios || args.scenarios.includes(id);
  let anyFail = false;

  // ── replay suite ──
  if (args.suite !== 'extraction') {
    const scenarios = REPLAY_SCENARIOS.filter((s) => wanted(s.id));
    console.log(`\n═══ REPLAY — ${scenarios.length} scenario(s), model ${CONCIERGE_MODEL} ═══`);
    for (const scenario of scenarios) {
      const file = path.join(resultsDir, `replay-${scenario.id}.json`);
      let result: ReplayResult;
      if (!args.force && existsSync(file)) {
        result = JSON.parse(readFileSync(file, 'utf8')) as ReplayResult;
        console.log(`\n▸ ${scenario.id} (cached result)`);
      } else {
        console.log(`\n▸ ${scenario.id} — ${scenario.description}`);
        result = await runReplay(anthropic, scenario);
        if (args.judge && scenario.judge) {
          result.judge = (await judgeConversation(result)) ?? undefined;
        }
        writeFileSync(file, JSON.stringify(result, null, 2));
      }
      for (const c of [...result.checks, ...(result.extractionChecks ?? [])]) {
        if (!c.pass) anyFail = true;
        console.log(`  ${c.pass ? '✓' : '✗'} ${c.name}${c.detail ? ` — ${c.detail}` : ''}`);
      }
      if (result.judge) {
        const j = result.judge;
        console.log(
          `  ⚖ pacing=${j.pacing} grounding=${j.grounding} tone=${j.tone} — ${j.notes}`,
        );
      }
    }
  }

  // ── extraction suite ──
  if (args.suite !== 'replay') {
    const fixtures = EXTRACTION_FIXTURES.filter((f) => wanted(f.id));
    console.log(
      `\n═══ EXTRACTION — ${fixtures.length} fixture(s) × ${args.reps} rep(s) ═══`,
    );
    for (const fixture of fixtures) {
      const perRep: ExtractionResult[] = [];
      for (let rep = 1; rep <= args.reps; rep++) {
        const file = path.join(resultsDir, `extraction-${fixture.id}.rep${rep}.json`);
        let result: ExtractionResult;
        if (!args.force && existsSync(file)) {
          result = JSON.parse(readFileSync(file, 'utf8')) as ExtractionResult;
        } else {
          result = await runExtractionFixture(fixture.id, rep);
          writeFileSync(file, JSON.stringify(result, null, 2));
        }
        perRep.push(result);
      }
      const scores = perRep.map((r) => `${r.score.passed}/${r.score.total}`);
      const allPerfect = perRep.every((r) => r.score.passed === r.score.total);
      // Variance: a check that passes in one rep and fails in another is a
      // reliability problem even when averages look fine.
      const flaky = new Set<string>();
      for (const r of perRep) {
        for (const c of r.checks) {
          const elsewhere = perRep.some(
            (o) => o !== r && o.checks.find((x) => x.name === c.name)?.pass !== c.pass,
          );
          if (elsewhere) flaky.add(c.name);
        }
      }
      if (!allPerfect && !fixture.knownIssue) anyFail = true;
      console.log(`\n▸ ${fixture.id}: [${scores.join(', ')}]${flaky.size ? ` ⚠ flaky: ${[...flaky].join('; ')}` : ''}`);
      if (!allPerfect && fixture.knownIssue) {
        console.log(`  ⚠ KNOWN ISSUE (not gating): ${fixture.knownIssue}`);
      }
      for (const c of perRep[perRep.length - 1].checks) {
        if (!c.pass) console.log(`  ✗ ${c.name}${c.detail ? ` — ${c.detail}` : ''}`);
      }
    }
  }

  console.log(`\nResults dir: ${resultsDir}`);
  console.log(anyFail ? '\nRESULT: FAILURES PRESENT ✗' : '\nRESULT: ALL GREEN ✓');
  process.exit(anyFail ? 1 : 0);
}

main().catch((err) => {
  console.error('eval runner crashed:', err);
  process.exit(1);
});
