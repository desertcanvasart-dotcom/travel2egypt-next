'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { useFormatter, useTranslations } from 'next-intl';

import { renderAgentMarkdown } from '@/lib/concierge/markdown';
import { whatsappUrl } from '@/lib/concierge/constants';
import { Link } from '@/i18n/navigation';
import type { BriefPayload, BriefResponse } from '@/types/concierge';
import type { LinkMapEntry } from '@/lib/linkMap/resolve';
import { BriefPanel } from './BriefPanel';
import { ConciergeFallback } from './ConciergeFallback';
import { DataMenu } from './DataMenu';
import { EscapeHatch } from './EscapeHatch';

/**
 * ChatContainer — the functional concierge chat (Session 3).
 *
 * Consumes the S2 backend: POST /api/chat (SSE: start/delta/done/error) and
 * /api/conversation (GET load, POST start-new). Streaming follows the locked
 * Option A: agent text renders as PLAIN TEXT while streaming; only on `done`
 * is the full message run through marked + DOMPurify (markdown.ts) and
 * swapped in. User text is always rendered as React text (escaped).
 *
 * Behaviors per mockup/spec: chips populate the input (no auto-send) and
 * hide after the first send with a "show suggestions" restore; Enter sends,
 * Shift+Enter newlines; input + send disabled while a turn is in flight;
 * typing dots until first token, with an extra reassurance line after 8 s;
 * sticky-bottom auto-scroll with a jump-to-latest pill; error bubble with
 * retry, and after three failed attempts the human paths (until S5's escape
 * hatch panel replaces them). History reload shows "Continuing your
 * conversation from [date]" + "Start new conversation" (archives).
 */

const SLOW_RESPONSE_MS = 8000;
const MAX_RETRIES = 3;

interface ChatMessage {
  key: string;
  role: 'user' | 'assistant';
  text: string;
  /** Sanitized HTML — assistant messages only, set at stream completion. */
  html?: string;
}

interface ChatContainerProps {
  locale: 'en' | 'es';
  tourSlug?: string | null;
  tourTitle?: string | null;
  /** True when arriving via an invalid/expired resume link (S4). */
  resumeError?: boolean;
  /** Resolved concierge link map for this locale (deep-link post-processor). */
  linkMap?: LinkMapEntry[];
}

type Phase = 'idle' | 'thinking' | 'streaming';

export function ChatContainer({
  locale,
  tourSlug,
  tourTitle,
  resumeError = false,
  linkMap = [],
}: ChatContainerProps) {
  const t = useTranslations('planYourTour');
  const format = useFormatter();
  const [resumeNoticeShown, setResumeNoticeShown] = useState(resumeError);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [phase, setPhase] = useState<Phase>('idle');
  const [streamText, setStreamText] = useState('');
  const [input, setInput] = useState('');
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [continuingFrom, setContinuingFrom] = useState<string | null>(null);
  const [chipsHidden, setChipsHidden] = useState(false);
  const [slowResponse, setSlowResponse] = useState(false);
  const [showJump, setShowJump] = useState(false);
  const [failed, setFailed] = useState<{ text: string; attempts: number } | null>(null);
  const [announcement, setAnnouncement] = useState('');
  // Rate limiting (S7). ipBlocked → swap to the full fallback; terminated →
  // lock the input with a closing notice; cooldownUntil → soft per-session
  // pause with the input re-enabling when it elapses.
  const [ipBlocked, setIpBlocked] = useState(false);
  const [terminated, setTerminated] = useState(false);
  const [cooldownUntil, setCooldownUntil] = useState<number | null>(null);
  // Brief flow (S4): the completion panel + Gate-1→Gate-2 client gating.
  const [brief, setBrief] = useState<BriefPayload | null>(null);
  const [briefDismissed, setBriefDismissed] = useState(false);
  // Escape hatch (S5).
  const [escapeOpen, setEscapeOpen] = useState(false);
  const [sessionRef, setSessionRef] = useState<string | null>(null);
  const escapeTriggerRef = useRef<HTMLButtonElement>(null);
  // Your-data menu (S8) — delete (anonymise) + export.
  const [dataMenuOpen, setDataMenuOpen] = useState(false);
  const [deletedNoteShown, setDeletedNoteShown] = useState(false);
  const dataMenuTriggerRef = useRef<HTMLButtonElement>(null);
  // After a Gate-1-true / Gate-2-false result, suppress the next N triggers
  // so we don't re-run the expensive extraction every turn (S4 decision 3).
  const suppressRef = useRef(0);
  const briefFetchingRef = useRef(false);

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const convRef = useRef<HTMLDivElement>(null);
  const stickRef = useRef(true);
  const keyRef = useRef(0);
  const slowTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const nextKey = () => `m${++keyRef.current}`;

  // ── mount: focus + reload any prior conversation ──────────────────────
  useEffect(() => {
    inputRef.current?.focus();
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/conversation');
        if (!res.ok) return;
        const data = (await res.json()) as {
          conversation: {
            id: string;
            lastMessageAt: string;
            briefCompleted?: boolean;
            briefPayload?: BriefPayload | null;
          } | null;
          messages: Array<{ id: string; role: 'user' | 'assistant'; content: string }>;
          sessionRef?: string | null;
        };
        if (cancelled) return;
        if (data.sessionRef) setSessionRef(data.sessionRef);
        if (!data.conversation || data.messages.length === 0) return;
        setConversationId(data.conversation.id);
        setContinuingFrom(data.conversation.lastMessageAt);
        // A reloaded, already-completed conversation re-shows its panel.
        if (data.conversation.briefCompleted && data.conversation.briefPayload) {
          setBrief(data.conversation.briefPayload);
        }
        const rendered = await Promise.all(
          data.messages.map(async (m) => ({
            key: m.id,
            role: m.role,
            text: m.content,
            html: m.role === 'assistant' ? await renderAgentMarkdown(m.content, linkMap) : undefined,
          })),
        );
        if (cancelled) return;
        setMessages(rendered);
        setChipsHidden(true);
      } catch {
        // Fresh state on load failure — the visitor can still chat.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // ── sticky-bottom auto-scroll ──────────────────────────────────────────
  useEffect(() => {
    const el = convRef.current;
    if (el && stickRef.current) el.scrollTop = el.scrollHeight;
  }, [messages, streamText, phase]);

  // ── S7 soft cooldown: clear the pause when its window elapses ───────────
  useEffect(() => {
    if (cooldownUntil === null) return;
    const ms = cooldownUntil - Date.now();
    if (ms <= 0) {
      setCooldownUntil(null);
      return;
    }
    const id = setTimeout(() => {
      setCooldownUntil(null);
      inputRef.current?.focus();
    }, ms);
    return () => clearTimeout(id);
  }, [cooldownUntil]);

  const onScroll = useCallback(() => {
    const el = convRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 48;
    stickRef.current = atBottom;
    setShowJump(!atBottom);
  }, []);

  function jumpToLatest() {
    const el = convRef.current;
    if (!el) return;
    stickRef.current = true;
    el.scrollTop = el.scrollHeight;
    setShowJump(false);
  }

  function clearSlowTimer() {
    if (slowTimerRef.current) clearTimeout(slowTimerRef.current);
    slowTimerRef.current = null;
    setSlowResponse(false);
  }

  // ── send / retry ───────────────────────────────────────────────────────
  async function send(text: string, isRetry = false) {
    if (phase !== 'idle') return;
    if (terminated || ipBlocked) return;
    if (cooldownUntil !== null && cooldownUntil > Date.now()) return;
    const trimmed = text.trim();
    if (!trimmed) return;

    setChipsHidden(true);
    setFailed(null);
    if (!isRetry) {
      setMessages((prev) => [...prev, { key: nextKey(), role: 'user', text: trimmed }]);
      setInput('');
      if (inputRef.current) inputRef.current.style.height = 'auto';
    }
    setPhase('thinking');
    slowTimerRef.current = setTimeout(() => setSlowResponse(true), SLOW_RESPONSE_MS);

    let assembled = '';
    let gotError = false;
    let briefDetected = false;
    let doneConversationId: string | null = conversationId;
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
          ...(conversationId ? { conversationId } : {}),
          locale,
          ...(tourSlug ? { tourSlug } : {}),
        }),
      });
      // S7 rate limiting — a 429 is a graceful pause, never the error bubble.
      if (res.status === 429) {
        const info = (await res.json().catch(() => ({}))) as {
          error?: string;
          scope?: 'session' | 'ip';
          retryAfter?: number;
        };
        clearSlowTimer();
        setStreamText('');
        setPhase('idle');
        if (info.error === 'terminated') {
          setTerminated(true);
          return;
        }
        if (info.scope === 'ip') {
          setIpBlocked(true);
          return;
        }
        // Per-session soft cooldown: drop the un-sent bubble, restore the
        // text, and pause the input until the window passes.
        if (!isRetry) {
          setMessages((prev) =>
            prev.length && prev[prev.length - 1].role === 'user' && prev[prev.length - 1].text === trimmed
              ? prev.slice(0, -1)
              : prev,
          );
          setInput(trimmed);
        }
        setCooldownUntil(Date.now() + (info.retryAfter ?? 30) * 1000);
        return;
      }
      if (!res.ok || !res.body) throw new Error(`http_${res.status}`);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let sep: number;
        while ((sep = buffer.indexOf('\n\n')) !== -1) {
          const chunk = buffer.slice(0, sep);
          buffer = buffer.slice(sep + 2);
          if (!chunk.startsWith('data: ')) continue;
          const event = JSON.parse(chunk.slice(6)) as {
            type: string;
            conversationId?: string;
            sessionRef?: string;
            text?: string;
            briefDetected?: boolean;
          };
          if (event.type === 'start' && event.conversationId) {
            doneConversationId = event.conversationId;
            setConversationId(event.conversationId);
            if (event.sessionRef) setSessionRef(event.sessionRef);
          } else if (event.type === 'delta' && event.text) {
            clearSlowTimer();
            setPhase('streaming');
            assembled += event.text;
            setStreamText(assembled);
          } else if (event.type === 'done') {
            briefDetected = event.briefDetected === true;
          } else if (event.type === 'error') {
            gotError = true;
          }
        }
      }
      if (gotError || !assembled) throw new Error('stream_failed');

      const html = await renderAgentMarkdown(assembled, linkMap);
      setMessages((prev) => [
        ...prev,
        { key: nextKey(), role: 'assistant', text: assembled, html },
      ]);
      setAnnouncement(`${t('chatAgentName')}: ${assembled}`);
      setStreamText('');
      setPhase('idle');
      clearSlowTimer();

      // Gate 1 → Gate 2. Skip if a brief already exists or while suppressed
      // after a prior Gate-2 rejection (decision 3); Gate 1 itself stays
      // stateless server-side — this client gating only governs the fetch.
      if (briefDetected && !brief && doneConversationId) {
        if (suppressRef.current > 0) {
          suppressRef.current -= 1;
        } else {
          void fetchBrief(doneConversationId);
        }
      }
      inputRef.current?.focus();
    } catch {
      clearSlowTimer();
      setStreamText('');
      setPhase('idle');
      setFailed((prev) => ({
        text: trimmed,
        attempts: (prev && prev.text === trimmed ? prev.attempts : 0) + 1,
      }));
    }
  }

  // ── Gate 2: confirm + load the brief, or suppress for a few turns ─────
  async function fetchBrief(convId: string) {
    if (briefFetchingRef.current) return;
    briefFetchingRef.current = true;
    try {
      const res = await fetch('/api/brief', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ conversationId: convId, locale }),
      });
      if (!res.ok) {
        suppressRef.current = 3;
        return;
      }
      const data = (await res.json()) as BriefResponse;
      if (data.complete && data.payload) {
        setBrief(data.payload);
        setBriefDismissed(false);
      } else {
        // Gate 2 rejected a Gate-1 match — quietly continue (decision 3).
        suppressRef.current = 3;
      }
    } catch {
      suppressRef.current = 3;
    } finally {
      briefFetchingRef.current = false;
    }
  }

  function continueFromBrief() {
    setBriefDismissed(true);
    inputRef.current?.focus();
  }

  // After a successful "Delete my conversation" (S8): the server anonymised the
  // session and cleared the cookie — reset to a fresh, empty chat.
  function onDataDeleted() {
    setMessages([]);
    setStreamText('');
    setConversationId(null);
    setContinuingFrom(null);
    setBrief(null);
    setBriefDismissed(false);
    setSessionRef(null);
    setChipsHidden(false);
    setInput('');
    setFailed(null);
    suppressRef.current = 0;
    setDeletedNoteShown(true);
    inputRef.current?.focus();
  }

  // ── start a fresh conversation (archives the current one) ─────────────
  async function startNew() {
    if (phase !== 'idle') return;
    try {
      const res = await fetch('/api/conversation', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ locale }),
      });
      const data = (await res.json()) as { conversationId?: string };
      setConversationId(data.conversationId ?? null);
    } catch {
      setConversationId(null);
    }
    setMessages([]);
    setContinuingFrom(null);
    setChipsHidden(false);
    setFailed(null);
    setStreamText('');
    setAnnouncement('');
    setBrief(null);
    setBriefDismissed(false);
    suppressRef.current = 0;
    inputRef.current?.focus();
  }

  // ── input mechanics ────────────────────────────────────────────────────
  function autoResize() {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void send(input);
    }
  }

  function useChip(chip: string) {
    setInput(chip);
    inputRef.current?.focus();
    requestAnimationFrame(autoResize);
  }

  const busy = phase !== 'idle';
  // While the brief panel is the active surface, the chat input is locked
  // until "Continue conversation" (briefDismissed) re-enables it.
  const panelActive = brief !== null && !briefDismissed;
  const cooldownActive = cooldownUntil !== null && cooldownUntil > Date.now();
  const inputLocked = busy || panelActive || terminated || cooldownActive;
  const showOpening = messages.length === 0 && !busy;
  const chips = [t('chip1'), t('chip2'), t('chip3'), t('chip4')];
  const whatsappHref = whatsappUrl(t('fallbackWhatsappText'));

  // S7 per-IP hard block — replace the whole chat surface with the human paths.
  if (ipBlocked) return <ConciergeFallback reason="rate_limited" />;

  return (
    <div className="cnc-chat-shell">
      <div className="cnc-chat">
        {/* Header */}
        <div className="cnc-chat__header">
          <div className="cnc-chat__identity">
            <span className="cnc-avatar" aria-hidden>
              T2E
            </span>
            <div>
              <div className="cnc-chat__name">{t('chatAgentName')}</div>
              <div className="cnc-chat__status">
                <span className="cnc-status-dot" aria-hidden />
                {t('chatAgentStatus')}
              </div>
            </div>
          </div>
          <div className="cnc-chat__actions">
            {/* Escape hatch trigger (S5) — always available. */}
            <button
              ref={escapeTriggerRef}
              type="button"
              className="cnc-escape"
              aria-haspopup="dialog"
              aria-expanded={escapeOpen}
              onClick={() => setEscapeOpen(true)}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
                <path
                  d="M2 4 C 2 2.5, 3.5 2, 5 2 L 9 2 C 10.5 2, 12 2.5, 12 4 L 12 8 C 12 9.5, 10.5 10, 9 10 L 7 10 L 4 12.5 L 4.5 10 C 3 10, 2 9.5, 2 8 Z"
                  stroke="currentColor"
                  strokeWidth="1.3"
                  strokeLinejoin="round"
                />
              </svg>
              <span>{t('escapeTrigger')}</span>
            </button>
            {/* Your-data menu (S8) — delete (anonymise) + export. */}
            <button
              ref={dataMenuTriggerRef}
              type="button"
              className="cnc-icon-btn"
              aria-haspopup="dialog"
              aria-expanded={dataMenuOpen}
              aria-label={t('dataMenuTrigger')}
              onClick={() => setDataMenuOpen(true)}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
                <circle cx="3" cy="8" r="1.4" />
                <circle cx="8" cy="8" r="1.4" />
                <circle cx="13" cy="8" r="1.4" />
              </svg>
            </button>
          </div>
        </div>

        {/* Persistent AI disclosure (S8) — never scrolls away (sits above the
            scrollable conversation). The v4.1 persona self-discloses; this is
            the always-visible visual layer, using the consistent "AI Concierge"
            term (matches the page eyebrow + metadata). */}
        <p className="cnc-ai-disclosure">{t('aiDisclosure')}</p>

        {resumeNoticeShown && (
          <div className="cnc-flash" role="status">
            <span>{t('resumeErrorFlash')}</span>
            <button
              type="button"
              className="cnc-flash__dismiss"
              aria-label={t('dismiss')}
              onClick={() => setResumeNoticeShown(false)}
            >
              ✕
            </button>
          </div>
        )}

        {deletedNoteShown && (
          <div className="cnc-flash" role="status">
            <span>{t('dataDeletedNote')}</span>
            <button
              type="button"
              className="cnc-flash__dismiss"
              aria-label={t('dismiss')}
              onClick={() => setDeletedNoteShown(false)}
            >
              ✕
            </button>
          </div>
        )}

        {/* Conversation */}
        <div className="cnc-conversation" ref={convRef} onScroll={onScroll}>
          {continuingFrom && (
            <div className="cnc-continuing">
              <span>
                {t('continuingFrom', {
                  date: format.dateTime(new Date(continuingFrom), { dateStyle: 'medium' }),
                })}
              </span>
              <button type="button" className="cnc-textlink" onClick={() => void startNew()}>
                {t('startNew')}
              </button>
            </div>
          )}

          {showOpening && (
            <div className="cnc-msg cnc-msg--agent">
              <span className="cnc-msg__avatar" aria-hidden>
                T2E
              </span>
              <div className="cnc-msg__bubble">
                {tourTitle ? (
                  <>
                    <p>{t('openingTour1', { tourName: tourTitle })}</p>
                    <p>{t('openingTour2')}</p>
                  </>
                ) : (
                  <>
                    <p>{t('opening1')}</p>
                    <p>{t('opening2')}</p>
                    <p>{t('opening3')}</p>
                  </>
                )}
              </div>
            </div>
          )}

          {messages.map((m) =>
            m.role === 'assistant' ? (
              <div key={m.key} className="cnc-msg cnc-msg--agent">
                <span className="cnc-msg__avatar" aria-hidden>
                  T2E
                </span>
                {m.html ? (
                  <div className="cnc-msg__bubble" dangerouslySetInnerHTML={{ __html: m.html }} />
                ) : (
                  <div className="cnc-msg__bubble">{m.text}</div>
                )}
              </div>
            ) : (
              <div key={m.key} className="cnc-msg cnc-msg--user">
                <span className="cnc-msg__avatar" aria-hidden>
                  {t('userAvatar')}
                </span>
                <div className="cnc-msg__bubble">{m.text}</div>
              </div>
            ),
          )}

          {brief && !briefDismissed && (
            <BriefPanel payload={brief} locale={locale} onContinue={continueFromBrief} />
          )}

          {phase === 'streaming' && streamText && (
            <div className="cnc-msg cnc-msg--agent">
              <span className="cnc-msg__avatar" aria-hidden>
                T2E
              </span>
              <div className="cnc-msg__bubble cnc-msg__bubble--streaming">{streamText}</div>
            </div>
          )}

          {phase === 'thinking' && (
            <div className="cnc-msg cnc-msg--agent">
              <span className="cnc-msg__avatar" aria-hidden>
                T2E
              </span>
              <div className="cnc-msg__bubble">
                <span className="cnc-typing" aria-hidden>
                  <span />
                  <span />
                  <span />
                </span>
                {slowResponse && <p className="cnc-slow">{t('slowResponse')}</p>}
              </div>
            </div>
          )}

          {failed && (
            <div className="cnc-msg cnc-msg--agent cnc-msg--error">
              <span className="cnc-msg__avatar" aria-hidden>
                T2E
              </span>
              <div className="cnc-msg__bubble">
                {failed.attempts >= MAX_RETRIES ? (
                  <>
                    <p>{t('errorFallback')}</p>
                    <p className="cnc-error-paths">
                      <a href={whatsappHref} target="_blank" rel="noopener noreferrer">
                        {t('fallbackWhatsappCta')}
                      </a>
                      {' · '}
                      <Link href="/contact">{t('fallbackContactCta')}</Link>
                    </p>
                  </>
                ) : (
                  <>
                    <p>{t('errorBubble')}</p>
                    <button
                      type="button"
                      className="cnc-textlink"
                      onClick={() => void send(failed.text, true)}
                    >
                      {t('retryLabel')}
                    </button>
                  </>
                )}
              </div>
            </div>
          )}

          {/* S7 termination — a closing notice with the human paths. */}
          {terminated && (
            <div className="cnc-msg cnc-msg--agent cnc-msg--error">
              <span className="cnc-msg__avatar" aria-hidden>
                T2E
              </span>
              <div className="cnc-msg__bubble">
                <p>{t('rateLimitTerminated')}</p>
                <p className="cnc-error-paths">
                  <a href={whatsappHref} target="_blank" rel="noopener noreferrer">
                    {t('fallbackWhatsappCta')}
                  </a>
                  {' · '}
                  <Link href="/contact">{t('fallbackContactCta')}</Link>
                </p>
              </div>
            </div>
          )}
        </div>

        {showJump && (
          <button type="button" className="cnc-jump" onClick={jumpToLatest}>
            {t('jumpToLatest')} ↓
          </button>
        )}

        {/* Starter chips — populate the input, never auto-send */}
        {!chipsHidden ? (
          <div className="cnc-starters">
            <div className="cnc-starters__label">{t('starterLabel')}</div>
            <div className="cnc-chips">
              {chips.map((chip, i) => (
                <button key={i} type="button" className="cnc-chip" onClick={() => useChip(chip)}>
                  {chip}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.length > 0 && (
            <div className="cnc-starters cnc-starters--collapsed">
              <button
                type="button"
                className="cnc-textlink"
                onClick={() => setChipsHidden(false)}
              >
                {t('showSuggestions')}
              </button>
            </div>
          )
        )}

        {/* S7 soft cooldown — a gentle pause note while the input is locked. */}
        {cooldownActive && (
          <p className="cnc-cooldown" role="status">
            {t('rateLimitCooldown')}
          </p>
        )}

        {/* Input bar */}
        <div className="cnc-input-bar">
          <textarea
            ref={inputRef}
            className="cnc-input"
            rows={1}
            placeholder={t('inputPlaceholder')}
            aria-label={t('inputPlaceholder')}
            value={input}
            disabled={inputLocked}
            onChange={(e) => {
              setInput(e.target.value);
              autoResize();
            }}
            onKeyDown={onKeyDown}
          />
          <button
            type="button"
            className="cnc-send"
            disabled={inputLocked || !input.trim()}
            aria-label={t('sendLabel')}
            onClick={() => void send(input)}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor" aria-hidden>
              <path d="M2 9 L16 2 L11 16 L9 10 L2 9 Z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Completed agent messages announced once — not per token (S11 a11y). */}
      <div aria-live="polite" className="sr-only">
        {announcement}
      </div>

      <EscapeHatch
        open={escapeOpen}
        onClose={() => setEscapeOpen(false)}
        conversationId={conversationId}
        sessionRef={sessionRef}
        locale={locale}
        triggerRef={escapeTriggerRef}
      />

      <DataMenu
        open={dataMenuOpen}
        onClose={() => setDataMenuOpen(false)}
        sessionRef={sessionRef}
        locale={locale}
        triggerRef={dataMenuTriggerRef}
        onDeleted={onDataDeleted}
      />
    </div>
  );
}
