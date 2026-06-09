import { useTranslations } from 'next-intl';

/**
 * ChatContainer — Session 1 STATIC placeholder. Renders the chat chrome from
 * the mockup (header identity, opening agent message, four starter chips,
 * input + send) but everything is INERT: the "Talk to a human" trigger, the
 * chips, the textarea and the send button are all disabled. No client JS.
 *
 * The functional chat is Session 3; the working escape hatch is Session 5.
 */
export function ChatContainer() {
  const t = useTranslations('planYourTour');
  const chips = [t('chip1'), t('chip2'), t('chip3'), t('chip4')];

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
          <button type="button" className="cnc-escape" disabled aria-label={t('escapeTrigger')}>
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
        </div>

        {/* Conversation — opening agent message */}
        <div className="cnc-conversation">
          <div className="cnc-msg cnc-msg--agent">
            <span className="cnc-msg__avatar" aria-hidden>
              T2E
            </span>
            <div className="cnc-msg__bubble">
              <p>{t('opening1')}</p>
              <p>{t('opening2')}</p>
              <p>{t('opening3')}</p>
            </div>
          </div>
        </div>

        {/* Starter chips */}
        <div className="cnc-starters">
          <div className="cnc-starters__label">{t('starterLabel')}</div>
          <div className="cnc-chips">
            {chips.map((chip, i) => (
              <button key={i} type="button" className="cnc-chip" disabled>
                {chip}
              </button>
            ))}
          </div>
        </div>

        {/* Input bar — inert */}
        <div className="cnc-input-bar">
          <textarea
            className="cnc-input"
            rows={1}
            placeholder={t('inputPlaceholder')}
            aria-label={t('inputPlaceholder')}
            disabled
          />
          <button type="button" className="cnc-send" disabled aria-label={t('sendLabel')}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor" aria-hidden>
              <path d="M2 9 L16 2 L11 16 L9 10 L2 9 Z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
