# AI Concierge Integration — Decisions and Discoveries Summary

*The closing deliverable from the integration orientation conversation. To be used as starting context when the build-brief reframing conversation begins in a fresh thread.*

*Version 1.1 — corrects link map scope, refines Spanish URL mechanism, updates model version*

---

## Purpose of this document

This summary captures every decision, discovery, and clarification produced during the orientation conversation between the project owner (Islam) and the AI assistant about how the AI concierge will integrate into the new Travel2Egypt Next.js site. It exists so that the next conversation — the twelve-session build-brief reframing — can begin with full context without requiring archaeology through the previous thread.

When opening the next conversation, attach this document alongside the foundational specifications. The reframing conversation should not re-derive anything captured here.

---

## The canonical specifications

These are the locked, current versions of the foundational documents. Use these and only these.

**System prompt.** `travel-to-egypt-agent-system-prompt-v4.1.md`. Approximately 8,500 words, roughly 600 lines. Version header reads "Version 4.1 — Currency, payment processor, and deposit structure corrections." Contains Tab.travel references throughout, EUR as the default currency in the pricing reference table, the two-tier deposit structure (10% for light services, 25% for tour packages), and the eight pricing question types. This file has been confirmed and locked. No revision is pending.

**Strategic context for the site.** `site-rebuild-strategic-brief.md` v1.1. Includes the booking architecture section that explicitly locks in consultation-only with no booking engine. Defines the three-surface architecture (editorial content, tour/destination pages, AI concierge) and the marketplace structure (Travel2Egypt + AffordEgypt + Soléi).

**Integration orientation.** `ai-concierge-integration-briefing.md`. The foundational briefing document explaining what the concierge is, why it exists, what role it plays, and how it integrates conceptually and technically.

**Design specification.** `concierge-page-design-spec.md`. The visual and behavioral specification for the `/plan-your-tour` page.

**Visual reference.** `concierge-page-mockup-v2.html`. Pixel-accurate mockup showing the page, the chat interface, the brief-completion panel, and the escape hatch modal in action.

**Implementation plan.** `production-build-brief.md`. The original twelve-session build plan. Written for a standalone Next.js application; requires reframing for in-site integration. The reframing is the next conversation's primary work.

**Background context.** `whatsapp-archive-analysis-for-v4.md`. The analysis of approximately 1,300 historical customer conversations that informed v4 and v4.1 of the system prompt. Background reading; not implementation guidance.

**Team-side documents.** `team-operating-principles.md` and `email-response-templates.md`. The team's workflow documents. Not the developer's concern technically, but they explain why the brief payload structure matters.

---

## Verified state of the t2e codebase

Discoveries made by Claude Code when cross-checking the documents against the actual codebase during the orientation:

**Existing concierge integration seam.** A `ConciergeCTA` component already exists at `src/components/ConciergeCTA.tsx`. It is wired into the homepage, header, and tour pages. Currently points to `/contact` with an explicit code comment noting it was designed to point at `/plan-your-tour` and pass tour context as a `tourSlug` query parameter, awaiting the concierge ship. When the concierge ships, these CTAs get repointed.

**Consent system already implemented.** Three components in place: `src/lib/consent.tsx` (the `ConsentProvider` and `useConsent()` context with versioned localStorage persistence and twelve-month refresh), `src/components/CookieConsent.tsx` (the visible notice with focus trap, Escape dismiss, aria-modal, localized via the `consent` i18n namespace), `src/components/CookiePreferencesButton.tsx` (footer control to re-open the notice). The system is currently in informational mode because the site only sets one strictly necessary cookie (`NEXT_LOCALE`) and loads no analytics or marketing scripts. The category model for analytics and marketing exists in the code as future-proofing.

**No chat infrastructure yet.** No `@anthropic-ai/sdk`, no `@supabase/*` packages, no `react-markdown` or `remark-gfm`, no Sentry. The content layer is Sanity, not Postgres. The concierge integration introduces a new data and AI stack alongside the existing Sanity content layer.

**Locale routing in place.** The site supports three locales via next-intl: English at root, Spanish at `/es`, Japanese at `/ja`. Slugs may be localized per locale; the site's actual convention needs to be verified for the planning page URL in Spanish.

**Typography stack.** The site pairs Cormorant Garamond (headings, matching the mockup) with Source Serif 4 (body, deviating from the mockup's Public Sans). Also Noto Serif/Sans JP for Japanese.

**WhatsApp escape hatch number.** `wa.me/201158011600` is in the repo. Confirmed as the escape hatch destination.

**Sanity Studio.** Runs at `/studio` with its own authentication.

---

## Architectural decisions for the integration

These are the decisions that affect how the concierge integrates into the existing site. Made during the orientation conversation; should not be re-derived.

### Routing and URL structure

**English route.** `/plan-your-tour`. Preserves the existing WordPress URL for SEO continuity.

**Spanish route.** The site does localize content slugs per locale (verified by dedicated commits across Sanity content types). However, `/plan-your-tour` is a static route, not a Sanity content slug — its localization is configured through next-intl's `pathnames` mechanism rather than a Sanity slug field. The established intent is localized (so something like `/es/planifica-tu-viaje`), but the mechanism differs from how guide and wiki slugs work. The reframing should resolve this as a `pathnames` configuration decision. The exact Spanish-language wording for the path is a translation choice to confirm with Islam during the reframing.

**Japanese route.** `/ja/plan-your-tour` displays a fallback contact form with a brief note explaining that the AI concierge is currently available in English and Spanish, with Japanese support coming later. The agent does not operate in Japanese per the system prompt's language policy (v4.1).

### Hosting and runtime

To be confirmed by Claude Code during the build-brief reframing: the actual deploy target of the t2e codebase. If Vercel or Railway, Server-Sent Events streaming for the chat works natively. If something else, the streaming approach needs reconsideration.

### Database

Supabase added alongside Sanity. Single Supabase project for the entire site (not a separate project for the concierge). Sanity handles content (editorial, wiki, tours, hotels, cruises); Supabase handles state (chat sessions, conversations, messages, briefs, rate limits, admin reviewer data).

### Cookie consent

Three small wiring tasks, not a full consent UI build:

1. **Notice copy update.** When the chat ships, the `consent` i18n namespace strings and the `/cookie-policy` page need updating to disclose the chat-session identifier.

2. **Categorization decision.** The chat-session identifier is categorized as strictly necessary / functional in v1, under the ePrivacy and GDPR exemption for "cookies strictly necessary for the provision of a service explicitly requested by the user." Rationale: visitors arrive at `/plan-your-tour` explicitly to have a conversation, and the session identifier is the functional mechanism that lets that conversation persist as they expect. Operational guard: if the parallel privacy review (handled outside the code by Islam's legal workstream) determines that gating is required, the categorization can be flipped to a gated category. The existing consent system supports this without restructuring.

3. **Analytics.** Plausible used in cookieless configuration. Avoids triggering the analytics consent category entirely; the notice stays in its current informational mode.

Net effect: the concierge integration's consent work is approximately one session smaller than originally framed in the standalone build brief.

### Typography

The chat uses the site's actual typography stack (Cormorant Garamond + Source Serif 4), not the mockup's pairing (Cormorant Garamond + Public Sans). The native principle from the integration briefing supersedes the specific font choice in the mockup. Colors and design intent from the mockup translate to the site's existing Tailwind v4 token system; variable names align with the site's conventions rather than the mockup's `--cream`, `--orange`, `--ink` names.

### Tour-context entry point

In scope for v1. The `ConciergeCTA` component already passes a `tourSlug` query parameter. When the chat loads on `/plan-your-tour?tour=<slug>`, the page reads the parameter, fetches the relevant tour metadata from Sanity at load time, and the agent's opening message acknowledges the context: "I see you have been looking at [tour name] — would you like to talk about a trip built around that, or something different?"

### Admin reviewer panel

Supabase Auth for the admin reviewer panel, separate from Sanity Studio's authentication. Operational reasoning: the reviewer panel is operationally distinct from content editing, and conflating the auth surfaces could give content editors access to customer conversation data they should not see.

### Link map for AI concierge recommendations

In scope for v1. Build-time aggregation pattern from Sanity content metadata: each linkable document type carries structured fields for primary entity, aliases, category, and priority. At build time, Next.js queries all documents with these fields and generates a link map that the chat API route uses for post-processing agent responses to wrap recognized entities in links.

V1 scope of linkable document types: `wikiMonument` (134 docs populated and indexed) and `guideArticle`. These are the wiki and editorial types that are launching with content and are indexable.

Explicitly NOT in v1 link map: `wikiDeity`, `wikiDynasty`, and `wikiPerson`. These types are deferred to v2 per the launch-scope decision — their landing pages currently render `WikiComingSoon` placeholders, carry `noindex` metadata via `wikiComingSoonMetadata`, and are explicitly disallowed in `robots.ts` (`/wiki/deities`, `/wiki/dynasties`, `/wiki/people`). If the link map wrapped agent mentions of a deity, dynasty, or pharaoh in a link, the link would route to an intentionally hidden Coming Soon page — a visible defect contradicting the v2-deferral decision. These three types re-enter the link map in v2 alongside being un-deferred everywhere else.

Tours and cities can be added to the link map as the optional next tier within v1 if scope permits.

### Model

Claude Sonnet 4.6 is the current production model and the target for the integration. The original production build brief was written before 4.6 was released and references `claude-sonnet-4-5-20250929`; that string is now stale. The reframing should pin the exact 4.6 model string against Anthropic's current documentation at the time of build.

### Analytics

Plausible Analytics, cookieless configuration. The chat funnel events (chat started, conversation engaged, brief completed, escape hatch triggered) are tracked through Plausible custom events. No GA, no cookie-based analytics that would require consent gating.

### Autoura webhook

External dependency. URL, HMAC secret, payload schema, and authentication method come from Islam's Autoura team. Email fallback to a designated team inbox handles webhook failures (retry after exponential backoff, then fallback). Real-time alert to Islam when permanent webhook failures occur.

### Brand voice continuity

The chat inherits the site's voice, visual identity, and design tokens. Same typography, same colors, same site header and footer. The chat should feel like a native page of Travel2Egypt, not a third-party widget bolted onto the site. This was emphasized in the integration briefing and confirmed in the orientation.

---

## Concerns and questions still open

These items were surfaced during the orientation but are not yet resolved. They should be addressed during the build-brief reframing.

### Hosting target

Confirm what the t2e codebase deploys to. Affects streaming runtime choice.

### Spanish URL exact wording

The mechanism is resolved (next-intl pathnames configuration). The exact Spanish-language wording for the localized path is a translation choice to confirm with Islam during the reframing.

### Autoura contract details

URL, HMAC secret, payload field mappings, expected response codes. To be provided by Islam's Autoura team. Not blocking for early build sessions but blocking for the brief webhook integration session.

### Session cookie expiration

The original build brief proposed ninety days. The orientation did not revisit this. The cookie scope is the parent domain (`.travel2egypt.org`) so the session persists across the site, but the expiration window should be confirmed during the reframing — is ninety days right, or should it be shorter for stricter privacy posture?

### Brief completion detection threshold

The brief detection heuristic was specified in the original build brief (session 4) as conservative — fires only when explicit handoff language appears in the agent's response combined with captured email. The reframing should confirm this remains the right approach in the in-site context.

### Exact Sonnet 4.6 model string

The model is confirmed as Claude Sonnet 4.6. The exact API model string to use should be pinned against Anthropic's current documentation at the time of build.

---

## Scope and sequencing implications

The integration scope, after the orientation's discoveries and decisions:

**Reduced scope (relative to standalone build brief):**

- Foundation work (session 1 of original) becomes "add the chat route and page to the existing Next.js app" rather than "create a new Next.js project." Site shell, brand tokens, component library, header, footer, site styling, language switcher, cookie consent UI — all already exist. Significant reduction.

- Database setup (session 2 of original) becomes "extend the existing Supabase project with chat tables" rather than "create a new Supabase project." Smaller reduction, but real.

- Cookie consent work (session 8 of original) becomes "update notice copy and categorization" rather than "build consent UI from scratch." Substantial reduction.

- Spanish localization (session 6 of original) becomes a smaller task because the site's i18n infrastructure (next-intl) is already in place. Translation strings are still needed but the routing and infrastructure work is done.

**Unchanged scope:**

- Chat backend integration with Anthropic API (session 3 of original)
- Brief detection and completion panel (session 4)
- Escape hatch and human handoff (session 5)
- Rate limiting and abuse handling (session 7)
- Autoura webhook integration (session 9)
- Admin reviewer panel (session 10)
- Pre-launch hardening (session 11)
- Launch (session 12)

**New or expanded scope:**

- The tour-context entry point (reading `tourSlug` query parameter, fetching Sanity metadata, agent context awareness) was not in the standalone brief because the standalone app could not know about tours on the rest of the site. Now in scope.

- The link map post-processing layer (build-time aggregation from Sanity content metadata, runtime entity-wrapping in agent responses) was not in the standalone brief. Now in scope.

- The Japanese fallback contact form on `/ja/plan-your-tour` was not in the standalone brief in detail. Now needs explicit specification.

The original twelve-session structure largely holds, but the content of each session shifts. The build-brief reframing conversation should walk through each session and document what stays, what collapses, what expands, and what new work emerges.

---

## What did not change

The system prompt v4.1 is locked. No changes to the agent's instructions during the orientation.

The design spec is locked. The visual and behavioral specification for the page stands as written.

The mockup is locked as the visual reference, with one specific deviation: the body font becomes Source Serif 4 instead of Public Sans to match the site's typography.

The strategic brief v1.1 is locked, including the consultation-only booking architecture.

The integration briefing is locked.

---

## Posture for the build-brief reframing conversation

The next conversation should be a fresh thread. The recommended starting context to attach:

1. This summary document
2. The system prompt v4.1
3. The strategic brief v1.1
4. The integration briefing
5. The design specification
6. The mockup (for visual reference, though the typography deviation has been noted)
7. The original twelve-session production build brief

The conversation's primary work is walking through the twelve sessions and producing a reframed version that reflects:

- The in-site integration topology (chat as a route, not a separate app)
- The reduced scope identified in this summary
- The new scope items (tour-context entry point, link map)
- The decisions and discoveries captured above
- Verification of any items still open (hosting target, Spanish URL convention, etc.)

The output of that conversation will be a reframed build brief — let us call it `production-build-brief-v2.md` — that supersedes the original and serves as the implementation guide for the actual integration work.

After the reframing conversation, the next step is Claude Code beginning the first session of the actual integration build.

---

## Working relationship notes

A few patterns from the orientation that are worth preserving for the build-brief reframing and the implementation phase:

**Claude Code engaged well.** It read the documents carefully, cross-checked against the actual codebase, surfaced ambiguities as questions rather than making silent choices, and corrected itself transparently when wrong (the cookie consent stale note incident). This is the right kind of collaboration.

**File management discipline matters.** Two version-mismatch incidents (v1 shared instead of v4.1, then v4 shared instead of v4.1) cost real time during the orientation. Going forward: the canonical file is `travel-to-egypt-agent-system-prompt.md` with no version suffix, and older versions live in an archive folder. Apply the same discipline to other documents as they revise.

**Surface decisions, do not silent-fix.** When Claude Code identifies an ambiguity or a deviation from the existing patterns (typography, URL structure, scope question), it surfaces the choice rather than picking. This is the working pattern to maintain.

**Cross-check the actual code.** The orientation revealed that several assumptions in the standalone build brief did not match the actual codebase (consent system already built, ConciergeCTA already wired, no chat infrastructure yet, etc.). The reframing should continue this pattern — verify against the codebase rather than assuming what is or is not there.

---

End of summary. Use as starting context for the build-brief reframing conversation.
