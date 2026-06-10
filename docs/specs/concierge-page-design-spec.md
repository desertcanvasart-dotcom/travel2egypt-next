# Travel2Egypt AI Concierge — Production Page Design Specification

*Replaces the current /plan-your-tour page on travel2egypt.org*

*Version 1, for review before implementation*

---

## 1. Strategic Context

The current /plan-your-tour page collects traveler context through a four-step form (Trip Details → Travel Style → Budget → Contact). The form works but has clear limitations: it cannot push back when a traveler underestimates Egypt's distances, cannot probe what "luxury" means to this specific traveler, cannot explain why a 6-day everything-trip is unrealistic. It captures inputs, not understanding.

The new page replaces the form with a conversational interface backed by the AI concierge (system prompt v4.1). The agent does what the form cannot: ask the right next question, push back gently on mismatched expectations, surface specific operational realities, and produce a brief that reflects a real understanding of the traveler — not just their checkbox answers.

The page must work for two distinct audiences without privileging either: first-time researchers who do not yet know what they want, and high-intent visitors ready to hand over a complete trip vision. The interface must serve both without making either feel out of place.

---

## 2. Page Layout — Above the Fold

The page has three layers from top to bottom: site header (existing, unchanged), concierge frame, chat interface.

### Site header
The existing Travel2Egypt site header remains unchanged. Same logo, same navigation, same language switcher, same "Get A Free Quote" button. No special header for this page.

### Concierge frame
A compact section that introduces the concierge before the chat begins. Three elements stacked:

**Heading.** "Plan Your Egypt Trip with Our Concierge" — direct, descriptive, no marketing language. The word "concierge" carries the right weight and matches the agent's actual positioning. No exclamation marks, no "free" promises in the heading.

**Subheading paragraph.** Two short sentences. "Tell us about the trip you have in mind, and our AI concierge will shape it with you in conversation. When the brief is complete, our team takes over from there with specific recommendations and pricing." This sets expectations clearly: it is a conversation, the AI is doing the shaping, humans handle pricing and booking.

**Trust strip below the subheading.** A single horizontal row of small visual elements: TripAdvisor rating badge (linked to your existing TripAdvisor page), Kayak partner mark, JATA / IATA / ASTA association marks (already on your homepage), and a small "30 years" badge. This communicates credibility before the visitor has spoken to the agent. Critical for the trust-collapse moment we identified in the WhatsApp archive — many visitors decide whether to engage based on what they see in the first two seconds. On mobile, the strip becomes horizontally scrollable to accommodate all six elements without crowding.

### Chat interface
The chat itself begins below the trust strip. On desktop it occupies the central column with comfortable margins on either side. On mobile it occupies the full viewport width with appropriate padding.

The visual frame of the chat is a single contained area with subtle border and rounded corners, set against the warm cream background of the site. It does not look like a modal or an overlay — it looks like a section of the page, because that is what it is.

Above the chat input, when the conversation has not yet started, a default state shows:

**The agent's opening message** — the agent introduces itself and explains what it can do. The language matches v4.1: direct, warm, restrained. Specifically:

*"Hi, I am the AI concierge for Travel2Egypt. I can help you shape an Egypt trip — discuss what you are hoping for, push back on plans that will not work in practice, and put together a clear brief that our team can build into a proposal with specific pricing and bookings. Where shall we start?"*

This is honest about three things: it is AI, it is the planning interface (not the booking interface), and the human team handles the actual proposal. No false naming, no claim of human conversation, no concealment that pricing comes later.

**Below the opening message, four conversation starter chips** — tappable suggestions that reduce the activation cost for visitors who do not know how to begin. These are not pre-written prompts the agent processes blindly; tapping them populates the input field with the suggested opener, which the visitor can then send or edit.

Suggested starter chips (final wording to refine):
- "Plan a first-time Egypt trip"
- "Help me with Cairo and the Nile"
- "I have a specific itinerary already"
- "I am curious about Egypt — explore with me"

The four chips cover the primary intent ranges: first-timer, classic-route visitor, prepared-itinerary visitor, exploratory visitor. The fourth one matters specifically for visitors who would otherwise bounce — gives them permission to engage without committing to a planning task.

**The input field at the bottom** with placeholder text "Type your message…" and a send button (orange, matching site CTA color). On focus, the chat enters an active conversation state and the chips fade out (they remain accessible via a small "show suggestions" link if useful).

---

## 3. The Conversation Experience

### Message rendering
User messages right-aligned, agent messages left-aligned. User messages in a slightly tinted bubble (warm cream tint), agent messages in clean white with subtle border. Avatar on agent side: a small T2E mark or simple icon, not a generated face. We do not want this to look like a fake person.

Message text uses the site's body typography for natural integration. Markdown is rendered properly — the agent uses bold occasionally for emphasis and lists for itinerary structure. Links open in new tabs.

Agent message timestamps appear on hover (desktop) or are visible by default (mobile). User messages also timestamp.

### Streaming behavior
Agent responses stream as they generate, character by character or word by word. This is critical — a long pause followed by a long block of text feels broken. Streaming makes the interface feel alive even when the agent is composing thoughtfully.

Before streaming begins, a subtle "thinking" indicator (three dots, animated) appears in the agent's bubble. This handles the moment between the user sending a message and the first token returning.

### Long messages
On mobile, a 200-word agent response is significant scroll real estate. The chat auto-scrolls to keep the latest message in view, but the visitor can scroll back without losing position when new content arrives. A "jump to latest" pill appears when the visitor is scrolled away from the bottom.

For very long messages (the agent occasionally produces these for itinerary breakdowns), consider a soft fade-out and "show more" cap at around 400 words — the message can be expanded. This is a defensive measure for cases where v4.1's length discipline does not fully prevent over-writing.

### Typing indicator on user side
None needed. Standard chat UX — the user types, the agent does not see preview.

### Read state
Agent's last message stays visible. No "read receipts" needed.

### Inline media
The agent does not currently send images. If we ever add this — sample itineraries, hotel photos, vessel images — we would render them in the chat with full-width display on mobile and contained width on desktop. Out of scope for v1.

---

## 4. The Brief-Completion State

This is the moment the conversation transitions from planning into handoff. v4.1 has the agent capture contact information and confirm what happens next. The UI should reinforce this with a visible state change — the visitor needs to feel that something has happened, not just that the conversation went quiet.

When the agent has completed the brief and committed to a team response, the chat surface displays a confirmation panel below the agent's final message. Not a modal, not a redirect — a panel inline in the conversation flow.

The panel includes:

**Heading.** "Your brief is ready." Brief, declarative.

**Body.** Two short sentences of confirmation. "We have everything we need. Our team will follow up at [email] within [timeframe based on Cairo time and visitor's timezone]."

**The timeframe is calculated and displayed concretely.** If it is currently 10am Cairo time, the panel says "by 8 p.m. Cairo time today, which is roughly [visitor local time]." If it is currently 4pm Cairo time, the panel says "first thing tomorrow morning, by 10 a.m. Cairo time, which is [visitor local time]." Calculate this from the visitor's browser timezone.

**A summary chip section.** Five pieces of information from the brief, displayed as small chips: number of travelers, destinations, approximate dates, trip length, and inferred comfort level (boutique / international 5-star / luxury / something specific the agent identified). Visual confirmation that the brief captured the right essentials. The comfort level chip is particularly important — the agent infers this from preference signals rather than asking budget directly, and surfacing it back gives the visitor a chance to correct the inference if it is off. If the visitor sees something wrong here, they can continue the chat to correct it.

**A "Continue conversation" link.** The conversation remains open. The visitor can keep talking — refine details, ask follow-up questions, change something. The agent remains available. The brief is sent, but the conversation is not closed.

**A "Save my conversation" optional prompt** — small text, low emphasis. "Want to come back to this later? We can email you a link to continue this conversation from another device." Tapping it opens an email field. This is the soft persistence offer for visitors who want cross-device continuity. Optional, not required.

---

## 5. Persistence Behavior

Conversations persist by browser cookie + database lookup. Implementation:

When a visitor first arrives, a unique anonymous session ID is created and stored in a cookie (`t2e_session`). The chat backend creates a conversation row keyed to this session ID. Every message in the conversation is stored against it.

When the visitor returns to the page on the same browser, the cookie is read and the previous conversation loads automatically. The visitor sees their full chat history with a subtle visual indicator at the top: "Continuing your conversation from [date]." A small "Start new conversation" link is visible, archiving the previous and beginning fresh.

If the cookie is cleared or expires, the conversation is effectively orphaned (still in the database for analytics, but no longer accessible to the visitor). This is the known limitation of anonymous persistence. The "Save my conversation" email opt-in provides a workaround for visitors who want it.

Cross-device persistence is not supported in v1 without the email opt-in. A visitor who started on phone and returns on laptop will see a fresh chat unless they used the email-link option.

---

## 6. The Escape Hatch — "Talk to a Human"

A persistent button visible throughout the chat experience. Placement: top-right of the chat frame on desktop (small, subtle), or in a collapsible menu on mobile (the standard three-dot or hamburger icon at the top of the chat).

Label: "Talk to a human" — clearer than "report this conversation" and serves both purposes.

When tapped, it opens a small panel with three options:

**1. WhatsApp our team directly.** Opens a WhatsApp link (`wa.me/[number]`) with a prefilled message: "Hi, I was using your AI concierge and would like to speak with your team directly." This routes to your existing WhatsApp Business inbox where Sara or your team picks up.

**2. Send your conversation to our team for human review.** This captures the visitor's email if not yet provided, exports the conversation, and sends it to the team's inbox. A team member reads the conversation and replies via email within the standard timeframe. The visitor receives a confirmation message in the chat.

**3. Continue with the AI for now.** Closes the panel and returns to the chat. Some visitors will tap the escape hatch out of curiosity, then continue with the agent.

This panel reduces the "trapped with the AI" feeling that can erode trust. Most visitors will not use it, but its visibility matters more than its usage rate. A visitor who knows the human path is one tap away is more willing to engage with the AI.

---

## 7. Mobile-First Behaviors

The page is designed for mobile viewports first (375-414px width baseline) and scales up to desktop. Key mobile-specific considerations:

**Layout.** The concierge frame collapses to vertical stack. Heading, subheading, trust strip (which becomes a horizontally scrollable row on narrow screens). Chat occupies full width with padding. Input field is sticky to the bottom of the viewport, above the soft keyboard when active.

**Input behavior.** Tapping the input field activates the soft keyboard. The chat history scrolls to keep the latest message visible above the keyboard. The send button is large enough for thumb tap (44px minimum touch target).

**Conversation starter chips on mobile.** Stack vertically rather than wrap horizontally — better thumb targets. Tap fills the input but does not auto-send; the visitor reviews and sends. This prevents accidental sends from misclicks.

**Persistent header on mobile.** The Travel2Egypt site header remains visible but compresses (logo + hamburger menu, no horizontal nav).

**The escape hatch on mobile.** Lives in a small menu icon at the top of the chat frame. Single tap opens the three-option panel.

**Brief-completion panel on mobile.** Full-width within the chat, vertically stacked content. Email field, if shown for "save my conversation," is appropriately sized for mobile keyboard.

**Performance.** First contentful paint must be under 2 seconds on mid-range mobile. The chat frame can lazy-load — it is below the concierge frame, which is the priority — but the initial agent message and starter chips should be visible within 3 seconds of arrival.

---

## 8. Visual System

Drawing from the existing Travel2Egypt site for consistency.

**Color palette.**
- Primary background: warm cream (#FAF6F0 or similar to existing site)
- Section backgrounds: clean white for chat surface
- Text: deep charcoal/near-black for body, slightly softer for secondary text
- Primary CTA / accent: existing Travel2Egypt orange (the color of "Get A Free Quote" button on the homepage)
- User message bubble: light tinted version of the cream
- Agent message bubble: white with subtle 1px border
- Trust strip: muted, supports without dominating

**Typography.**
- Headings: existing site heading font
- Body / chat messages: existing site body font, comfortable line height (1.6 on desktop, 1.5 on mobile)
- Font size in chat: 16px minimum on mobile (avoids iOS zoom-on-focus)

**Spacing.** Generous padding around the chat frame to give it breathing room. Internal message spacing: 12-16px between messages, slightly more between sender swaps.

**Iconography.** Minimal. Send arrow, "talk to human" icon, three-dot menu on mobile, clear/start-new icon. All using a consistent line-icon set, ideally matching whatever the site already uses.

**Animation.** Subtle. Streaming text appears smoothly without layout jank. Conversation starter chips fade out gently when chat begins. The brief-completion panel slides in below the final message with a soft transition. No bouncy animations, no decorative motion.

---

## 9. Language Behavior

The chat is available on the English (`/plan-your-tour`) and Spanish (`/es/plan-your-tour` or equivalent) versions of the site only.

On Japanese, Finnish, Arabic, and any other language site, the existing form remains in place at `/plan-your-tour` for the time being. A small note at the top of the form on those pages: "Our AI concierge is currently available in English and Spanish. For [language] inquiries, please use this form and our team will follow up directly."

When the agent eventually expands language coverage, additional language sites can be migrated to the chat experience.

The chat's interface language follows the site language. UI elements (placeholder text, button labels, escape hatch language) are translated to match. The agent's actual conversation language follows v4.1's policy — English on English site, Spanish on Spanish site. If a Spanish-site visitor writes in English, the agent continues in English and offers the language switch as v4.1 specifies.

---

## 10. Failure Handling

**Network or backend failure.** If the chat API call fails, the agent's message bubble shows an error state with a "retry" button rather than disappearing. Three retry attempts before surfacing a fallback message: "We are having trouble reaching our system. Please try again, or use 'Talk to a human' to reach our team directly."

**Long agent response time.** If the agent is taking longer than 8 seconds to respond, the thinking indicator includes additional reassurance: "Working on a thoughtful response…" rather than just dots indefinitely.

**Agent response inappropriate or off-topic.** Built into v4.1, but for cases where the agent fails the visitor (factually inaccurate, off-topic engagement, concerning behavior): the "Talk to a human" escape hatch is the primary failsafe. We also log all conversations for review. The reviewer panel (already built in the harness) becomes part of the production back-end for ongoing quality monitoring.

**Visitor distress or sensitive topics.** If the conversation enters territory that the agent should not handle alone — distress, mental health, urgent safety issues — the agent's training (and the model's underlying safety behavior) will redirect appropriately. The escape hatch makes the human path immediately accessible.

**Pricing pressure beyond the agent's role.** A visitor who insists on specific prices the agent will not quote can be frustrated. The agent's response in v4.1 is to commit to a team timeframe. If the visitor pushes further, the escape hatch offers WhatsApp directly.

---

## 11. Brief Handoff to Autoura

When the conversation reaches the brief-completion state, a structured payload is sent to Autoura via API.

The payload includes:
- Visitor email, phone (if provided), name(s)
- Number of travelers, ages if relevant, traveler relationships
- Approximate or specific dates, trip length
- Origin city / nationality
- Destinations of interest
- Hotel level / comfort level inferred from preferences (boutique character, international 5-star, luxury, mid-range, or specific signal)
- Special interests / experiences mentioned
- Special requirements (dietary, mobility, religious)
- Full conversation transcript
- Prompt version used (v4.1)
- Timestamp and session ID
- A short structured summary the agent generates as a final step ("Brief: 2 travelers, UK, 14 days mid-October, scholarly interest in Pyramid Texts and Amarna, private dahabiya preferred, vegetarian, low-sodium")

This payload appears in Autoura as a new lead, routed to whoever handles incoming inquiries on your team. The team picks it up, prepares the proposal, and follows up via the channels the visitor provided within the timeframe committed.

The exact API contract with Autoura needs to be defined separately as integration work. For now, the chat backend stores the payload in its own database and emails a copy to a designated inbox; once the Autoura integration is built, the payload is sent there directly.

---

## 12. Analytics and Monitoring

What we need to track from day one:

**Engagement metrics.** Page arrivals, conversation starts (first message sent), conversation completions (brief reached), drop-off points (where visitors leave without finishing).

**Conversation quality metrics.** Average conversation length, message count, time to brief completion. Conversations flagged for review (by reviewer team or by the "talk to a human" trigger).

**Conversion metrics.** Briefs submitted to Autoura. Briefs that became actual proposals sent. Proposals that became confirmed bookings. The full funnel.

**Failure metrics.** API errors, agent timeouts, escape hatch usage, network failures. Each is a different signal about what is going wrong.

**Language and device split.** What percentage of conversations on each language. Mobile vs desktop. Geographic distribution.

The internal admin reviewer panel from the harness should be ported to production with appropriate adjustments. Production conversations need ongoing review to identify failure patterns, prompt drift, and opportunities to refine v5.

---

## 13. Edge Cases and Open Questions

A few things this specification does not yet resolve. Flagging them so they are visible:

**Cookie consent.** EU and UK visitors require cookie consent banners under GDPR. The session cookie that enables persistence is a strictly necessary cookie (functional, not tracking) and may be exempt, but legal review is needed before launch.

**Privacy policy and data handling.** The chat captures personal data (names, emails, travel plans, sometimes financial preferences). The current privacy policy on the site needs review and likely amendment to cover AI-mediated chat and AI processing of inputs.

**AI disclosure compliance.** The agent self-identifies as AI in the opening message, which addresses transparency requirements in most jurisdictions, but specific markets (some US states, EU AI Act phasing in) may require additional disclosures.

**Abusive or hostile conversations.** A small percentage of visitors will attempt to abuse, jailbreak, or extract information from the agent. v4.1 has decline language built in, but the production environment may want rate limiting, abuse detection, or session termination for clearly bad-faith interactions.

**Concurrent conversations and load.** What happens when 100 visitors are chatting simultaneously? The harness has not been load-tested. Production needs basic load testing before launch, especially around the streaming response handling.

**Backup if the API is down.** The chat depends on Anthropic API uptime. If the API has an outage, the page should gracefully degrade — show a message that the concierge is temporarily unavailable, surface the WhatsApp escape hatch prominently, and ideally fall back to the original form as a backup capture mechanism.

These are not blockers for design but are blockers for launch. Each needs an owner and a plan before this goes live.

---

## 14. What This Document Does Not Cover

Several things are deliberately out of scope here and need separate work:

- The Autoura API integration (separate technical workstream)
- The legal/compliance review (privacy policy, GDPR, AI disclosure)
- The team training on what to do with incoming AI briefs (your operational workstream)
- Multi-language expansion beyond English/Spanish (future iteration)
- Image, document, or rich media support in chat (future iteration)
- Authenticated user experience for the no-prices portal (planned but separate)

---

## 15. Build Sequencing Recommendation

When this specification is approved, the build can proceed in the following order:

1. **Foundation.** Page route, layout, brand styling. Static page that renders without backend.
2. **Chat backend integration.** Connect to the v4.1 system prompt, streaming responses, message storage.
3. **Persistence layer.** Cookie-based session management, conversation reload.
4. **Concierge frame.** Heading, subheading, trust strip, opening message, starter chips.
5. **Conversation polish.** Streaming, scroll behavior, message rendering, mobile keyboard handling.
6. **Brief-completion state.** Detection, panel rendering, timeframe calculation.
7. **Escape hatch.** Talk to human panel, WhatsApp link, conversation export.
8. **Edge case handling.** Network errors, retries, fallback messages.
9. **Analytics.** Event tracking, admin reviewer integration.
10. **Autoura integration.** When the API contract is ready.
11. **Pre-launch testing.** Load, mobile devices, browsers, accessibility.
12. **Soft launch.** Limited traffic, observe, refine.
13. **Full launch.** Replace /plan-your-tour fully.

---

End of design specification. This is the input to Claude Code for implementation. Review, refine, and confirm before we begin.
