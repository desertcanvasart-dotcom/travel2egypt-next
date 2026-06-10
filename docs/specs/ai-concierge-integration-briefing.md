# The AI Concierge — Role and Integration within Travel2Egypt

*A briefing document for Claude Code, to be read before the AI concierge integration work begins.*

*Purpose: explain what the AI concierge is, what role it plays in the new Travel2Egypt site, and how it integrates with the rest of the architecture.*

---

## Read this before anything else

You are about to integrate an AI-mediated planning experience into the Travel2Egypt Next.js site. Before doing any implementation work, you need to understand what this thing is, why it exists, and where it sits in the larger system. Implementation choices that look reasonable in isolation will be wrong if they are made without this context.

This document is the orientation. The detailed technical specifications (system prompt, design spec, build brief, mockup) come after, when you understand the role this surface is playing.

---

## What the AI concierge is

The AI concierge is a conversational planning interface that replaces the form-based "Plan Your Trip" page on the current WordPress site. It lives at the URL `/plan-your-tour` on the new Next.js site and is the primary planning surface for visitors who want help shaping an Egypt trip.

Mechanically, it is a chat interface backed by Anthropic's Claude API. A visitor arrives at the page, sees a brief introduction, and starts a conversation. The conversation produces a structured brief that flows to the team for proposal and pricing. The team takes over from there.

But the mechanical description misses what makes this thing matter. Let me explain why it exists.

---

## Why the AI concierge exists

Travel2Egypt is a 30-year Egyptian tour operator. Its competitive advantage is not its catalog of tours, its photography, its hotel partnerships, or its prices. Its competitive advantage is the judgment of its founder, Islam Hussein, who has spent three decades learning what makes Egypt trips succeed and fail, when to push back on a traveler's plan, how to read the texture of what someone actually wants from a trip versus what they say they want, and how to translate vague intentions into actual itineraries that produce great outcomes.

This judgment was previously delivered exclusively through human conversation. Islam (and his team) handled every inquiry personally. The model worked but did not scale, was vulnerable to founder availability, and treated every visitor identically regardless of complexity — a visitor asking about a simple day tour received the same depth of attention as a visitor planning a 14-day private dahabiya journey.

The AI concierge is an attempt to encode Islam's judgment into a system that can have thousands of conversations simultaneously, treat every visitor with the same depth of care, and produce briefs richer than any form could capture. It is not a chatbot in the FAQ sense. It is an attempt at preserving and scaling a specific kind of operator expertise.

The system prompt that drives this agent is roughly 8,500 words. It was developed iteratively over months, validated against analysis of approximately 1,300 historical WhatsApp customer conversations, and refined through structured testing. The agent knows the actual operational realities of Egypt travel: the convoy schedule in Middle Egypt, the closure of the Siwa-Bahariya road, the kitchen jeep standard for desert overnights, the difference between a local 5-star Nile cruise and an international 5-star, the right time of year for the White Desert circuit, the trust collapse moment around payment that kills bookings if handled badly. It knows the operator's voice: warm, restrained, opinionated, honest, willing to push back on bad ideas, willing to redirect to sister brands when Travel2Egypt is not the right fit.

This is not a generic AI assistant given a prompt. It is the encoded judgment of a specific operator with a specific reputation, and the implementation should respect that.

---

## What role the concierge plays within the site

The new Travel2Egypt site has three primary surfaces, each playing a different role:

**Surface one: editorial content.** Destination guides, wiki entries, blog posts, traveler stories. This is where the brand demonstrates judgment before any conversation has started. A visitor reading a piece about the Tomb of Petosiris at Tuna el-Gebel is encountering Travel2Egypt's operator perspective in publishing form. Editorial content drives SEO, builds trust, and educates visitors before they engage in planning.

**Surface two: tour and experience pages.** Specific tours, packages, hotels, cruises. These are content pages that describe what Travel2Egypt offers. They are not transactional — there is no booking engine, no checkout, no "Book Now" button. They route visitors to the planning conversation when ready.

**Surface three: the AI concierge.** The planning conversation itself. This is where intent becomes brief. Visitors who have read enough, who have a question, who are ready to plan — they come here.

These three surfaces work together. Editorial builds trust and demonstrates judgment. Tour pages communicate what is on offer. The concierge captures the planning intent and produces the brief that flows to the team. None of these surfaces stand alone; all three are needed for the full visitor journey.

The concierge is not the "do everything" surface. It does not browse tours, list destinations, manage bookings, or handle post-trip communication. It does one thing well: it shapes a trip in conversation and hands a structured brief to the team. The site supports it by providing the editorial and product context that gives visitors something to talk about.

---

## How the concierge integrates technically

The concierge is a Next.js page within the main site codebase, not a separate application. It uses the same component library, the same brand tokens, the same fonts, the same site header and footer as the rest of the site. From the visitor's perspective, it is a page on travel2egypt.org — not a third-party widget or a popup.

The page route is `/plan-your-tour` (preserving the existing URL for SEO continuity through the migration). Locale variants live at `/es/plan-your-tour` for Spanish and so on for other supported languages, though the agent currently operates only in English and Spanish; other language pages should display a contact form fallback with a note that the AI concierge will be available in those languages later.

The chat backend runs as API routes within the same Next.js application:

- `/api/chat` — streams agent responses via Server-Sent Events from the Anthropic API
- `/api/conversation` — loads or creates a conversation tied to the visitor's session
- `/api/brief` — triggers structured brief extraction when a conversation reaches completion
- `/api/escape-hatch` — logs visitor escalations to human contact
- `/api/admin/*` — protected admin routes for the reviewer panel (Islam and designated team members only)

Conversation state lives in Supabase (PostgreSQL with Row-Level Security). The schema covers sessions, conversations, messages, briefs, and rate limit tracking. A session cookie scoped to the parent domain (`.travel2egypt.org`) identifies returning visitors and lets them resume conversations across page reloads.

The agent's system prompt is loaded from a single source file (`lib/systemPrompt.ts`) so that prompt refinements can be deployed without changing the page or backend code.

Brief completion triggers a webhook to Autoura with a structured JSON payload containing the visitor's contact information, trip parameters, and the full conversation transcript. The Autoura webhook details (URL, HMAC secret) come from Islam's team. If the webhook fails after retries, an email fallback delivers the brief to a designated team inbox.

The detailed implementation specification for all of this exists in a separate document (`production-build-brief.md`) covering twelve sequential build sessions. That document was written for a standalone application but applies to in-site integration with the difference that the chat is a route, the API routes are part of the main app, and the deployment is the same as the rest of the site.

---

## How the concierge integrates conceptually

The technical integration is the easy part. The conceptual integration is where care matters.

**The concierge inherits the site's voice.** The system prompt establishes the agent's voice — warm, restrained, opinionated, honest. The site as a whole has the same voice in its editorial content, its tour descriptions, its hotel notes. The concierge should feel like the natural conversational form of the voice the visitor has been reading elsewhere on the site. If the editorial pages feel like a serious publisher and the concierge feels like a chatbot, the integration has failed.

**The concierge uses the site's visual identity.** No different chat styling, no decorative AI flourishes, no robot avatars. The chat uses the same typography (editorial serif headings, clean sans-serif body), the same color palette (cream backgrounds, desert orange accent, deep ink text), the same spacing rhythm as the rest of the site. The visitor should not feel like they have entered a different application when they open the chat.

**The concierge links to site content.** When the agent recommends a specific monument, hotel, or experience, it can include a link to the relevant editorial page on the site. The visitor reading about "the Tomb of Petosiris at Tuna el-Gebel" in the conversation can click through to the wiki entry. This requires a link map derived from CMS content metadata — every linkable document has structured fields identifying what it covers, and a build-time aggregation produces the map the agent uses at conversation time. The chat does not need the agent to know URLs; a post-processing layer wraps recognized entities in links before rendering the response.

**The concierge supports the marketplace structure.** Travel2Egypt is part of a portfolio that also includes AffordEgypt.com (budget tier) and Soléi (boutique luxury tier). When the agent identifies that a visitor's budget or preferences fit a sister brand better than Travel2Egypt, the agent redirects appropriately. The concierge does this through conversational language ("Travel2Egypt operates at a specific quality tier; based on what you have shared, AffordEgypt may suit you better") backed by working links to those sister sites.

**The concierge respects the consultation-only model.** Travel2Egypt has no booking engine. The concierge captures the brief; the team delivers the proposal and arranges payment. The concierge should never imply self-service booking is available, never quote final prices it cannot guarantee, never commit to specific hotel availability without team confirmation. It commits to one thing: that the team will respond within a specific window (by 8 p.m. Cairo time same day if before 1 p.m., or by 10 a.m. Cairo time the next morning otherwise), seven days a week. That commitment must be honored.

**The concierge sits within the privacy and consent framework of the site.** The cookie banner must include the chat's functional cookie. The privacy policy must cover AI-mediated conversation data. The visitor must be able to decline cookies and have the chat gracefully fall back to a contact form. AI disclosure must be visible (the agent self-identifies as AI in its opening message and the chat header).

---

## What the concierge does and does not do

To prevent scope confusion, let me be explicit about what falls inside and outside the concierge's scope.

**The concierge does:**

- Engage in open-ended planning conversation with visitors
- Ask the right next questions to understand a traveler's interests, constraints, and preferences
- Push back on itineraries that will not work in practice (too many destinations in too few days, wrong season for what they want, mismatched comfort expectations)
- Surface operational realities relevant to the visitor's plan (heat in Upper Egypt summer, convoy schedules, vessel category differences, etc.)
- Offer rough orders of magnitude for pricing when needed, framed as approximate
- Capture contact information naturally during the conversation
- Produce a structured brief at the right moment
- Hand off to the team via the Autoura webhook
- Redirect to sister brands when appropriate
- Decline non-fit inquiries (non-travel, outside Egypt, beyond Travel2Egypt's scope)
- Direct visitors to human contact via the escape hatch when needed

**The concierge does not:**

- Process payments
- Confirm bookings
- Display live availability or inventory
- Quote final prices
- Manage post-booking communication
- Handle complaints or service issues from existing customers
- Provide general travel information for trips outside Egypt
- Replace the team's role in proposal preparation and delivery
- Operate as a customer support agent for existing trips

The concierge has a specific job. It does that job well and stays out of the rest.

---

## What you (Claude Code) should do when integrating

When you begin the integration work, the workflow is:

**First, read the strategic context.** This document, plus the strategic brief for the site rebuild. These tell you what role the concierge plays.

**Second, read the detailed specifications.** In order:

1. `travel-to-egypt-agent-system-prompt-v4.1.md` — the agent's instructions
2. `concierge-page-design-spec.md` — the visual and behavioral specification
3. `concierge-page-mockup-v2.html` — the pixel-accurate visual reference
4. `production-build-brief.md` — the twelve-session implementation plan
5. `whatsapp-archive-analysis-for-v4.md` — the analysis that informed the system prompt

**Third, propose the integration plan.** Translate the production build brief from its original standalone-app framing to in-site integration. The twelve sessions still apply, but session 1 (foundation) becomes "add the chat route and page to the existing Next.js app" rather than "create a new Next.js project." Session 2 (database) becomes "extend the existing Supabase schema with chat tables" rather than "create a new Supabase project." And so on.

**Fourth, flag decisions before implementing them.** Several integration choices need Islam's confirmation:

- Should the chat tables live in the same Supabase project as the rest of the site's data, or a separate Supabase project? (Recommend same, but confirm.)
- How does the chat's session cookie interact with the site's other cookies and analytics? (Should be a separate functional cookie scoped to the parent domain, distinct from analytics cookies.)
- How does the existing site's authentication (if any visitor accounts exist for the no-prices portal or future features) interact with the chat? (Recommend the chat be aware of authenticated visitors but not require authentication.)
- How does the AI concierge link to editorial content via the link map? (Recommend the build-time aggregation pattern from content metadata.)
- How is the team notified when a brief arrives in Autoura? (Their workflow, but the webhook payload should support whatever notification mechanism they use.)

**Fifth, integrate the team-side documents into the operational flow.**

The team's email response templates (`email-response-templates.md`) and operating principles (`team-operating-principles.md`) are not your concern technically, but you should know they exist. The team will use these documents to handle the briefs that arrive from the concierge. Their workflow is outside the code, but the data the concierge produces (the brief payload) is the input to their workflow.

---

## What success looks like for the integration

When the integration is complete and the AI concierge is live on the new site, these things are true:

A visitor who lands on `/plan-your-tour` sees a conversational planning interface that feels like a native part of the Travel2Egypt site, not a third-party widget bolted on. The visual identity is continuous with the editorial content they may have been reading. The conversation begins with a clear, brief introduction that establishes what the agent is and what it can do. The visitor types or taps a starter chip and the conversation begins.

The conversation progresses naturally. The agent asks good questions, listens for signals, makes specific recommendations, pushes back when appropriate, and produces a brief that captures the texture of what the visitor actually wants. Contact information is captured naturally near the end of the conversation. The brief lands in Autoura within seconds. The visitor sees a confirmation panel telling them when they will hear back. They can continue the conversation if they want to refine, or close the browser knowing the team will respond.

The team receives the brief in their normal workflow. They read it, prepare a proposal, send the response within the committed window. The visitor receives a personalized email that builds on the conversation rather than starting from scratch. If they accept, payment links flow through Tab.travel. If they decline, they have had a good experience regardless and may return.

When the visitor returns to the site later (same browser), their previous conversation is still there. They can pick up where they left off, ask a follow-up, refine a detail. The persistence is per-browser, anonymous, and respects the cookie consent the visitor has given.

If the visitor expresses concerns the agent should not handle alone — distress, complex complaints, urgent issues — the escape hatch routes them to human contact via WhatsApp or email transcript review.

The admin reviewer panel lets Islam and designated team members read conversations, rate them, flag failures, and refine the system prompt over time. The daily digest email surfaces failures and notable conversations from the previous day.

The chat does not feel artificial. The visitor does not feel manipulated. The team does not feel diminished by the AI's presence. The brand is enhanced, not undermined, by the integration.

---

## What success does not look like

To prevent the failure modes, let me be explicit about what the integration should never become:

**It should not feel like a chatbot widget.** No floating bubble in the corner of every page. No "Click here to chat with AI" popup that interrupts editorial content. The concierge has its own page; it is not an ambient presence across the site.

**It should not promise things it cannot deliver.** No "instant proposals." No "guaranteed pricing." No "book in minutes." The concierge is a planning conversation that produces a brief; the team produces the proposal. This boundary must be clear.

**It should not feel separate from the rest of the site.** Different typography, different colors, different voice — any of these would signal "this is the AI part of the site, the rest is the real site." The integration should make the concierge feel like one of the site's natural surfaces, not a parallel system.

**It should not replace human relationships.** The concierge captures the brief. The team builds the relationship. Visitors who book with Travel2Egypt should remember a thoughtful conversation with the agent followed by a personal email from a real team member. They should not remember "I chatted with the AI and a transactional email arrived."

**It should not be heavy on the page.** Performance matters. The chat should not slow the page below the standards of the rest of the site. First contentful paint under 1.5 seconds on mid-range mobile. Time to interactive under 2.5 seconds.

**It should not be the only path.** Some visitors do not want to chat with AI. The site supports them through editorial content, tour pages, contact information, WhatsApp links, and any other paths the rest of the site provides. The concierge is the primary planning surface, not the only one.

---

## A note on this work's history

The AI concierge has been in development for several months. The system prompt has evolved through four major versions (v1 through v4.1) and multiple iterations of testing. A test harness application was built first to validate the agent's behavior in isolation. Approximately 1,300 historical WhatsApp customer conversations were analyzed to inform the system prompt. Real test conversations were run against the harness, reviewed, and used to refine the prompt further.

What you are integrating is not a fresh idea. It is a mature, tested system being moved from its development environment into its production home — the Travel2Egypt site. Treat it with the respect a tested system deserves: do not make implementation choices that undermine what the testing established.

If at any point during the integration you find yourself wanting to deviate from the specifications — change the system prompt, modify the design, adjust the conversation flow — surface the desire to Islam before acting on it. The specifications are not arbitrary. They are the product of extensive iteration. Deviation should be deliberate, not accidental.

---

## Summary

The AI concierge is the primary planning interface for Travel2Egypt's new site. It lives at `/plan-your-tour` as a Next.js page within the main site codebase. It encodes 30 years of operator judgment into a conversational interface that produces structured briefs for the team to act on. It integrates with editorial content through a link map, with the marketplace structure through redirect language, with the team's workflow through the Autoura webhook, and with the site's overall visual and conversational voice through shared design tokens and brand discipline.

It is not a chatbot widget. It is not a booking engine. It is not a customer service interface. It is a planning conversation surface, and the integration should preserve its specific character within the larger site.

The detailed implementation specifications are in the documents listed in the "What you should do" section above. Read them in order. Integrate carefully. Flag decisions that affect the visitor experience. Treat the existing work with respect.

When the integration is complete, Travel2Egypt will have something most operators do not: a scalable, encoded version of its founder's operator judgment, integrated natively into a serious publishing platform, supporting a consultation-only business model that produces better visitor experiences and better operational outcomes than the form-based legacy it replaces.

That is what you are building. Build it well.

---

*End of briefing. Read the detailed specifications next.*
