'use client';

import { useId, useMemo, useState, type FormEvent, type ReactNode } from 'react';

import { track } from '@/lib/analytics';
import { convertPrice, formatConverted } from '@/lib/currency';
import { useCurrency } from '@/lib/currency-context';
import { WHATSAPP_LINK } from '@/lib/concierge/constants';
import { BUDGET_BANDS, DAY_BANDS, dayBandFor, type LeadSource } from '@/lib/leads/schema';
import { journeyLabel, type JourneyKey } from '@/lib/journeys/registry';
import { STYLE_QUESTIONS } from '@/lib/journeys/styleQuestions';

import { readUtm } from './utm';
import { useLead } from './LeadProvider';
import { LEAD_COPY, leadLocale, type LeadCopy } from './copy';

/**
 * The short itinerary form (homepage rebuild, spec §9) — and, with
 * kind="day_tour", the "Check this date" request for one day tour.
 *
 * English-first by design (spec: translate after two weeks of data). Copy
 * lives here, not in messages/*.json, so ES/JA never render half-English UI:
 * the form is only reachable from EN surfaces until the translation pass.
 */

export interface LeadPrefill {
  kind?: 'trip' | 'day_tour';
  tourSlug?: string;
  tourTitle?: string;
  travelMonth?: string;
  days?: string;
  /** Product duration — pre-selects "How many days?" (fix round 1, item 7). */
  durationDays?: number | null;
  /** Product "from" price (EUR, as stored) — drives the day-tour estimate (item 8). */
  priceFromEur?: number | null;
  /** Pre-filled "Anything we should know?" text, e.g. "Interested in: Nile cruise". */
  notes?: string;
  /** Day-tour hub slug the request came from (GA4 `hub`, 2026-11-09). */
  hub?: string;
  /** Journey the form opened from (journey pages Phase A): adds its style question. */
  journey?: JourneyKey;
}


interface Props {
  source: LeadSource;
  prefill?: LeadPrefill;
  locale?: string;
  /** Dark band styling (inline footer form) vs light (dialog). */
  tone?: 'dark' | 'light';
  headingId?: string;
  /** Replaces the default thank-you block (e.g. the plan page's own copy). */
  renderDone?: (reference: string) => ReactNode;
}

type State = { phase: 'idle' | 'sending' } | { phase: 'done'; reference: string } | { phase: 'error'; message: string };

function nextMonths(count: number, c: LeadCopy): Array<{ value: string; label: string }> {
  const out: Array<{ value: string; label: string }> = [];
  const d = new Date();
  d.setDate(1);
  for (let i = 0; i < count; i++) {
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    out.push({ value, label: c.monthLabel(d) });
    d.setMonth(d.getMonth() + 1);
  }
  return out;
}

function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function LeadForm({ source, prefill, locale = 'en', tone = 'light', headingId, renderDone }: Props) {
  const kind = prefill?.kind ?? 'trip';
  const isDay = kind === 'day_tour';
  const uid = useId();
  const id = (n: string) => `${uid}-${n}`;
  const L = leadLocale(locale);
  const c = LEAD_COPY[L];
  const months = useMemo(() => nextMonths(18, c), [c]);
  const { currency, rates } = useCurrency();

  const { responseTime } = useLead();
  const full = responseTime.full;
  const [exact, setExact] = useState(false);
  const [children, setChildren] = useState(0);
  const [adults, setAdults] = useState(2);
  // Day-tour estimate: the product's own "from" price in the viewer's
  // currency, converted the same way the cards render it, times adults.
  const unitPrice =
    isDay && typeof prefill?.priceFromEur === 'number' && prefill.priceFromEur > 0
      ? convertPrice(prefill.priceFromEur, currency, rates)
      : null;
  const estimatedTotal = unitPrice ? unitPrice * adults : null;
  const estimateLabel = estimatedTotal !== null ? formatConverted(estimatedTotal, currency, L) : '';
  const journey = !isDay ? prefill?.journey : undefined;
  const sq = journey ? STYLE_QUESTIONS[journey][L] : null;
  const [state, setState] = useState<State>({ phase: 'idle' });
  const [fieldError, setFieldError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (state.phase === 'sending') return;
    const f = new FormData(e.currentTarget);
    const get = (k: string) => {
      const v = f.get(k);
      return typeof v === 'string' ? v : '';
    };
    // The journey's style question (spec §5): days band, children's ages,
    // the ticked interests, the chosen option, or free text.
    const styleAnswer = !sq
      ? undefined
      : sq.kind === 'days'
        ? get('days')
        : sq.kind === 'childAges'
          ? get('childAges')
          : sq.kind === 'multi'
            ? f.getAll('styleAnswer').filter((v): v is string => typeof v === 'string')
            : get('styleAnswer');
    setState({ phase: 'sending' });
    setFieldError(null);
    try {
      const res = await fetch('/api/lead', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          source,
          kind,
          locale,
          email: get('email'),
          whatsapp: get('whatsapp'),
          travelMonth: !isDay && !exact ? get('travelMonth') : undefined,
          startDate: isDay || exact ? get('startDate') : undefined,
          endDate: !isDay && exact ? get('endDate') : undefined,
          days: isDay ? undefined : get('days'),
          adults: get('adults'),
          children: get('children'),
          childAges: get('childAges'),
          estimatedTotal: estimatedTotal ?? undefined,
          estimatedCurrency: estimatedTotal ? currency : undefined,
          budget: isDay ? undefined : get('budget'),
          notes: get('notes'),
          tourSlug: prefill?.tourSlug,
          tourTitle: prefill?.tourTitle,
          journey,
          styleAnswer: (Array.isArray(styleAnswer) ? styleAnswer.length > 0 : Boolean(styleAnswer)) ? styleAnswer : undefined,
          company: get('company'),
          pagePath: window.location.pathname,
          utm: readUtm(),
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { reference?: string; error?: string; field?: string };
      if (res.ok && data.reference) {
        track('generate_lead', {
          form_location: source,
          lead_kind: kind,
          ...(prefill?.tourSlug ? { tour: prefill.tourSlug } : {}),
          ...(prefill?.hub ? { hub: prefill.hub } : {}),
          ...(journey ? { journey } : {}),
          locale,
        });
        setState({ phase: 'done', reference: data.reference });
        return;
      }
      if (res.status === 422 && data.field) {
        setFieldError(data.field);
        setState({
          phase: 'error',
          message:
            data.field === 'email'
              ? c.errEmail
              : data.field === 'whatsapp'
                ? c.errWhatsapp
                : data.field === 'startDate'
                  ? c.errDate
                  : c.errDates,
        });
        return;
      }
      setState({
        phase: 'error',
        message:
          res.status === 429 ? c.errRate : c.errGeneric(full),
      });
    } catch {
      setState({
        phase: 'error',
        message: c.errNetwork(full),
      });
    }
  }

  if (state.phase === 'done') {
    if (renderDone) return <>{renderDone(state.reference)}</>;
    return (
      <div className={`lead-done lead-${tone}`} role="status">
        <p className="lead-done-title">{c.doneTitle}</p>
        <p>
          {c.doneBody(isDay, full)} {c.doneRef} <strong>{state.reference}</strong>
          {L === 'ja' ? '' : '.'}
        </p>
        <p>
          {c.doneUrgent}{' '}
          <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer">
            {c.doneWhatsapp}
          </a>{L === 'ja' ? '' : ' '}
          {c.doneQuote}
        </p>
      </div>
    );
  }

  const invalid = (name: string) => (fieldError === name ? true : undefined);

  return (
    <form className={`lead-form lead-${tone}`} onSubmit={onSubmit} noValidate={false} aria-labelledby={headingId}>
      {journey && (
        <p className="lead-tour">
          {L === 'ja' ? 'ご関心：' : L === 'es' ? 'Te interesa: ' : 'Interested in: '}
          <strong>{journeyLabel(journey, L)}</strong>
        </p>
      )}
      {prefill?.tourTitle && (
        <p className="lead-tour">
          {isDay ? c.tourLineDay(prefill.tourTitle) : c.tourLineTrip(prefill.tourTitle)}
          {L === 'ja' ? '：' : ': '}
          <strong>{prefill.tourTitle}</strong>
        </p>
      )}

      {isDay ? (
        <div className="lead-row">
          <div className="lead-field">
            <label htmlFor={id('startDate')}>{c.date}</label>
            <input id={id('startDate')} name="startDate" type="date" required min={todayIso()} aria-invalid={invalid('startDate')} />
          </div>
          <div className="lead-field">
            <label htmlFor={id('adults')}>{c.adults}</label>
            <select id={id('adults')} name="adults" value={adults} onChange={(e) => setAdults(Number(e.target.value))}>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
          <div className="lead-field">
            <label htmlFor={id('children')}>{c.children}</label>
            <select id={id('children')} name="children" value={children} onChange={(e) => setChildren(Number(e.target.value))}>
              {Array.from({ length: 7 }, (_, i) => i).map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
          {children > 0 && (
            <div className="lead-field">
              <label htmlFor={id('childAges')}>{c.childAges}</label>
              <input id={id('childAges')} name="childAges" type="text" placeholder={c.childAgesPlaceholder} maxLength={80} />
            </div>
          )}
        </div>
      ) : (
        <>
          <fieldset className="lead-field">
            <legend>{c.when}</legend>
            {exact ? (
              <div className="lead-row">
                <div className="lead-field">
                  <label htmlFor={id('startDate')}>{c.arrive}</label>
                  <input id={id('startDate')} name="startDate" type="date" required min={todayIso()} />
                </div>
                <div className="lead-field">
                  <label htmlFor={id('endDate')}>{c.leave}</label>
                  <input id={id('endDate')} name="endDate" type="date" min={todayIso()} aria-invalid={invalid('endDate')} />
                </div>
              </div>
            ) : (
              <select name="travelMonth" aria-label={c.month} defaultValue={prefill?.travelMonth ?? ''}>
                <option value="">{c.notDecided}</option>
                {months.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            )}
            <label className="lead-check">
              <input type="checkbox" checked={exact} onChange={(e) => setExact(e.target.checked)} /> {c.exactDates}
            </label>
          </fieldset>

          <div className="lead-row">
            <div className="lead-field">
              <label htmlFor={id('days')}>{sq?.kind === 'days' ? sq.label : c.howManyDays}</label>
              <select id={id('days')} name="days" defaultValue={prefill?.days ?? dayBandFor(prefill?.durationDays)}>
                <option value="">{c.notSure}</option>
                {DAY_BANDS.map((b) => (
                  <option key={b} value={b}>
                    {c.dayBand[b]}
                  </option>
                ))}
              </select>
            </div>
            <div className="lead-field">
              <label htmlFor={id('budget')}>{c.budget}</label>
              <select id={id('budget')} name="budget" defaultValue="">
                <option value="">{c.budgetNone}</option>
                {BUDGET_BANDS.map((b) => (
                  <option key={b} value={b}>
                    {c.budgetBand[b]}
                  </option>
                ))}
              </select>
              <span className="lead-hint">{c.budgetHint}</span>
            </div>
          </div>

          <div className="lead-row">
            <div className="lead-field">
              <label htmlFor={id('adults')}>{c.adults}</label>
              <select id={id('adults')} name="adults" defaultValue="2">
                {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>
            <div className="lead-field">
              <label htmlFor={id('children')}>{c.children}</label>
              <select
                id={id('children')}
                name="children"
                value={children}
                onChange={(e) => setChildren(Number(e.target.value))}
              >
                {Array.from({ length: 7 }, (_, i) => i).map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>
            {children > 0 && (
              <div className="lead-field">
                <label htmlFor={id('childAges')}>{sq?.kind === 'childAges' ? sq.label : c.childAges}</label>
                <input
                  id={id('childAges')}
                  name="childAges"
                  type="text"
                  placeholder={c.childAgesPlaceholder}
                  maxLength={80}
                  required={sq?.kind === 'childAges'}
                />
              </div>
            )}
          </div>

          {sq && (sq.kind === 'multi' || sq.kind === 'radio') && (
            <fieldset className="lead-field lead-style">
              <legend>
                {sq.label}
                {L === 'ja' ? '' : ' '}
                <span className="lead-optional">{c.optional}</span>
              </legend>
              <div className="lead-choices">
                {sq.options.map((o) => (
                  <label key={o.value} className="lead-check">
                    <input type={sq.kind === 'multi' ? 'checkbox' : 'radio'} name="styleAnswer" value={o.value} /> {o.label}
                  </label>
                ))}
              </div>
            </fieldset>
          )}
          {sq?.kind === 'text' && (
            <div className="lead-field">
              <label htmlFor={id('styleAnswer')}>
                {sq.label}
                {L === 'ja' ? '' : ' '}
                <span className="lead-optional">{c.optional}</span>
              </label>
              <input id={id('styleAnswer')} name="styleAnswer" type="text" maxLength={300} />
            </div>
          )}
        </>
      )}

      {isDay && estimatedTotal !== null && (
        <p className="lead-estimate" aria-live="polite">
          <EstimateLine text={c.estimate('\u0000', adults)} total={estimateLabel} />
          {children > 0 && ` ${c.childrenNote}`}
        </p>
      )}

      <div className="lead-row">
        <div className="lead-field">
          <label htmlFor={id('email')}>{c.email}</label>
          <input
            id={id('email')}
            name="email"
            type="email"
            required
            autoComplete="email"
            aria-invalid={invalid('email')}
          />
        </div>
        <div className="lead-field">
          <label htmlFor={id('whatsapp')}>
            {c.whatsapp}
            {L === 'ja' ? '' : ' '}
            <span className="lead-optional">{c.optional}</span>
          </label>
          <input
            id={id('whatsapp')}
            name="whatsapp"
            type="tel"
            autoComplete="tel"
            inputMode="tel"
            placeholder={c.whatsappPlaceholder}
            aria-invalid={invalid('whatsapp')}
          />
        </div>
      </div>

      <div className="lead-field">
        <label htmlFor={id('notes')}>
          {c.notes}
          {L === 'ja' ? '' : ' '}
          <span className="lead-optional">{c.optional}</span>
        </label>
        <textarea
          id={id('notes')}
          name="notes"
          rows={3}
          maxLength={2000}
          defaultValue={prefill?.notes}
          placeholder={isDay ? c.notesPlaceholderDay : c.notesPlaceholderTrip}
        />
      </div>

      {/* Honeypot — hidden from people and screen readers. */}
      <div
        aria-hidden="true"
        className="lead-hp"
        style={{ position: 'absolute', left: '-10000px', top: 'auto', width: 1, height: 1, overflow: 'hidden' }}
      >
        <input name="company" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      {state.phase === 'error' && (
        <p className="lead-error" role="alert">
          {state.message}{' '}
          <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer">
            WhatsApp +20 155 177 2258
          </a>
        </p>
      )}

      <button type="submit" className="lead-submit" disabled={state.phase === 'sending'}>
        {state.phase === 'sending' ? c.sending : isDay ? c.submitDay : c.submitTrip}
      </button>
      <p className="lead-fine">{c.fine(full)}</p>
    </form>
  );
}

/** "Estimated: <strong>$240</strong> for 2 adults." — the total is bolded wherever the language puts it. */
function EstimateLine({ text, total }: { text: string; total: string }) {
  const [before, after = ''] = text.split('\u0000');
  return (
    <>
      {before}
      <strong>{total}</strong>
      {after}
    </>
  );
}
