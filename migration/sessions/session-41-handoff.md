# Session 41 — Brand-facts sweep + homepage Siwa fix

**Date:** 2026-05-17
**Branch:** `session-41-brand-facts-sweep` (worktree off `main`)

Targeted fix session. Session 40 flagged the homepage hero claiming
Travel2Egypt has "deep roots in Siwa" (Siwa belongs to the Soléi sister
brand). Pre-flight ran a wider brand-facts sweep before editing.

## Sweep findings (Step 1)

### Siwa references

| Location | Text | Category |
|---|---|---|
| `messages/en.json` `home.heroLede` | "…with deep roots in Siwa." | **VIOLATION** |
| `messages/es.json` `home.heroLede` | "…raíces profundas en Siwa." | **VIOLATION** |
| `messages/ja.json` `home.heroLede` | "…シーワに深く根を張っています。" | **VIOLATION** |
| `Footer.tsx` Soléi description (en/es) | "Siwa-rooted" / "raíces en Siwa" | Legitimate — Soléi sister brand |
| `city.ts` region enum | "Western Desert (Siwa, Oases)" | Legitimate — geographic label |

The JA heroLede also carried the Siwa claim — the session-40 flag only
named EN; all three locales had it.

### Accreditation lists

| Location | Status |
|---|---|
| `footer.tagline` (en/es/ja) | All 4 ✓ (session 40) |
| `about.metaDescription` (en/es/ja) | All 4 ✓ |
| `structured-data.ts` `ACCREDITATIONS` array | **VIOLATION — only 3 (JATA, IATA, ASTA); ETAA missing** |
| `system.ts` schema field description | "JATA, IATA, ASTA, TripAdvisor, Kayak…" — editor help text listing example badge types (incl. non-accreditations); not brand copy. Left as-is. |

### Year references (Step 1b)

All year references are **2003** (company) or **1993** (founder) — no
anomalies. Session 40's "1995" fix is clean; no residuals.

### Tenure claims (Step 1d)

`concierge.step3Text` says "thirty years of operations" — consistent
with the locked "30+ years / three decades" framing. Not a violation.

**Total: 2 logical violations** (hero Siwa claim ×3 locales; structured-
data accreditations) — under the 5-violation STOP threshold, so fixes
were applied directly.

## Fixes applied (Step 2)

### Homepage hero lede — Siwa claim removed

Replaced the second sentence with **option (a)** (the brief's default):

- **EN:** "Operator-grade guides, considered tours, and a concierge that
  actually listens. **Cairo-based, founder-led, with three decades of
  Egyptian travel experience.**"
- **ES:** "…**Con sede en El Cairo, dirigido por su fundador y con tres
  décadas de experiencia en viajes por Egipto.**"
- **JA:** "…**カイロを拠点とし、創業者が率いる、エジプト旅行歴30年以上の運営です。**"

The first sentence ("Operator-grade guides…") was unaffected and kept.
ES/JA are provisional translations — flagged for the batched review.

### Structured-data accreditations — ETAA added

`ACCREDITATIONS` in `src/lib/structured-data.ts` now includes ETAA
(Egyptian Travel Agents Association), so the JSON-LD `hasCredential`
advertises all four bodies. The array gained an explicit type so `url`
can be optional. **The ETAA `url` is intentionally omitted** — I didn't
have a confident official URL, and a wrong URL in structured data is
worse than none. `recognizedBy` for ETAA renders with name only (valid
schema.org). **TODO:** operator to supply the official ETAA URL.

## Smoke test results

| Check | Result |
|---|---|
| `/en` `/es` `/ja` hero lede — corrected, no Siwa | PASS |
| No "Siwa" claim in homepage hero copy | PASS |
| Soléi footer strip still says "Siwa-rooted" | PASS (correctly kept) |
| JSON-LD lists JATA + IATA + ASTA + ETAA | PASS |
| `tsc --noEmit` | PASS (clean) |
| Dev server console | No new errors |

## Status

Brand-facts drift around Siwa and accreditations is now resolved. The
sweep found no year anomalies and no tenure-claim drift. One open item:
the ETAA structured-data URL.

## TODO stack (carried forward)

- **ETAA official URL** — supply for `structured-data.ts` ACCREDITATIONS.
- Translation review backlog (sessions 30–34, 36–41) — now includes the
  3 corrected `home.heroLede` strings (ES/JA provisional).
- `siteSettings.contact.whatsapp` still unset (session 37).
- `{tier}` `FORMATTING_ERROR` — unrelated pre-existing dev-log error.
