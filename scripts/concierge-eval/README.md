# Concierge offline eval harness (Layer 2)

The go / no-go gate for **any v4.1 prompt edit, model upgrade, or marker
change**. Replays scripted visitor personas against the real production
pipeline and scores Gate-2 extraction on fixed golden transcripts.

## Suites

| Suite | Input | What a failure means |
|---|---|---|
| **replay** (`personas.ts`) | 14 scripted personas (EN/ES: leads, browsers, injection, hostile) run live against `CONCIERGE_MODEL` with the exact `/api/chat` system-block assembly | The conversation behavior changed: wrap markers not emitted / emitted when they shouldn't be, contact not asked for, prompt leaked |
| **extraction** (`extraction-fixtures.ts`) | 6 fixed transcripts through the real `extractBrief()` | Pure Gate-2 regression — extraction drift, normalization bug, ES display-language break |

Deterministic checks reuse the production `detectBriefMarkers` — the same code
the CI marker corpus freezes, so eval and CI can't drift apart.

## Usage

```bash
npm run eval:concierge                          # both suites, no judge
npm run eval:concierge -- --suite replay
npm run eval:concierge -- --suite extraction --reps 3
npm run eval:concierge -- --scenario en-anniversary-couple,es-full-lead
npm run eval:concierge -- --judge               # adds LLM-judge rubric (opus)
npm run eval:concierge -- --run pre-v5          # named run for baselines
npm run eval:concierge -- --run pre-v5 --force  # re-run, overwrite results
```

Needs `ANTHROPIC_API_KEY` in `.env`. Runs are **resumable**: results land in
`results/<run>/` (gitignored) and existing files are skipped unless `--force`.
Exit code 1 on any failed check — pipe-able into scripts.

## The change-gate workflow

```bash
# 1. Baseline on the CURRENT prompt/model
npm run eval:concierge -- --run baseline --judge

# 2. Apply the prompt edit / model bump

# 3. Candidate run
npm run eval:concierge -- --run candidate --judge --force

# 4. Compare results/baseline/ vs results/candidate/ — any check that
#    flipped is a behavioral regression to explain, not a test to delete.
```

## What is deliberately NOT here

- **No mocked model** — the model × prompt pair IS the system under test.
- **No agent-phrasing assertions in replay extraction** — only user-provided
  facts (email, counts, destinations). Phrasing-dependent fields
  (`follow_up_window`) are asserted only in the fixed extraction fixtures.
- **No pass/fail from the judge** — judge scores (pacing/grounding/tone, 1-5)
  are tracked over time, not gated; hard outcomes gate.

## Findings log

**2026-07-03 calibration run** (baseline, Sonnet 4.6 × v4.1) — both findings
resolved by owner decision the same day:

1. **The agent gates the wrap on a phone number.** v4.1 contradicted itself
   (Tier-1 "non-negotiable" phone vs "email alone is acceptable"), and the
   agent leaned phone-required. **Decision (Islam): phone-required is the
   policy.** → v4.1.1 amendment makes full name + email + phone with country
   code required before any handoff, and rewrites the hesitancy passage to
   explain-once-then-hold instead of waiving. Personas supply phone in their
   closing turns accordingly.
2. **Gate-2 marked `complete:true` on contact-only transcripts** (2/2 reps),
   violating extraction rule 5. **Decision (Islam): code enforcement — and
   the v4.1.1 contact trio (name AND email AND phone) enforced "at both
   layers"** (agent wrap + Gate 2). → `passesCompletenessRule()` in
   briefExtraction.ts deterministically forces `complete:false` (tighten-only
   guard, stricter than rule 5's name-or-email by design); the
   `x-contact-no-trip` fixture gates again (knownIssue flag removed), and
   complete-lead fixtures carry phones. Pure test:
   `src/lib/__tests__/briefCompleteness.test.ts`.

## Cost

Default full run ≈ 60 chat calls + ~18 extraction calls on Sonnet, with the
13.2k v4.1 prefix cached across sequential calls (runs are sequential on
purpose — 5-min cache TTL). Judge pass adds ~8 Opus calls.
