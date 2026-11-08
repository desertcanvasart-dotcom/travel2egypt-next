'use client';

import { useId, useMemo, useState, type FormEvent } from 'react';

import { track } from '@/lib/analytics';
import { convertPrice } from '@/lib/currency';
import { WHATSAPP_LINK } from '@/lib/concierge/constants';
import { BUDGET_BANDS, BUDGET_LABELS, DAY_BANDS, dayBandFor, type LeadSource } from '@/lib/leads/schema';

import { readUtm } from './utm';

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
}


interface Props {
  source: LeadSource;
  prefill?: LeadPrefill;
  locale?: string;
  /** Dark band styling (inline footer form) vs light (dialog). */
  tone?: 'dark' | 'light';
  headingId?: string;
}

type State = { phase: 'idle' | 'sending' } | { phase: 'done'; reference: string } | { phase: 'error'; message: string };

function nextMonths(count: number): Array<{ value: string; label: string }> {
  const out: Array<{ value: string; label: string }> = [];
  const d = new Date();
  d.setDate(1);
  for (let i = 0; i < count; i++) {
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    out.push({ value, label: d.toLocaleString('en-GB', { month: 'long', year: 'numeric' }) });
    d.setMonth(d.getMonth() + 1);
  }
  return out;
}

function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function LeadForm({ source, prefill, locale = 'en', tone = 'light', headingId }: Props) {
  const kind = prefill?.kind ?? 'trip';
  const isDay = kind === 'day_tour';
  const uid = useId();
  const id = (n: string) => `${uid}-${n}`;
  const months = useMemo(() => nextMonths(18), []);

  const [exact, setExact] = useState(false);
  const [children, setChildren] = useState(0);
  const [adults, setAdults] = useState(2);
  // Day-tour estimate: the product's own "from" price, converted to USD the
  // same way the cards render it (convertPrice), times adults.
  const unitUsd =
    isDay && typeof prefill?.priceFromEur === 'number' && prefill.priceFromEur > 0
      ? convertPrice(prefill.priceFromEur, 'USD')
      : null;
  const estimatedTotal = unitUsd ? unitUsd * adults : null;
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
          estimatedCurrency: estimatedTotal ? 'USD' : undefined,
          budget: isDay ? undefined : get('budget'),
          notes: get('notes'),
          tourSlug: prefill?.tourSlug,
          tourTitle: prefill?.tourTitle,
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
              ? 'Please check your email address.'
              : data.field === 'whatsapp'
                ? 'Please check the WhatsApp number (digits, spaces and + only).'
                : data.field === 'startDate'
                  ? 'Please choose a date.'
                  : 'Please check the dates.',
        });
        return;
      }
      setState({
        phase: 'error',
        message:
          res.status === 429
            ? 'We have already received several requests from this connection. Please message us on WhatsApp instead.'
            : 'Something went wrong sending your request. Please message us on WhatsApp and we will reply the same day.',
      });
    } catch {
      setState({
        phase: 'error',
        message: 'We could not reach our server. Please message us on WhatsApp and we will reply the same day.',
      });
    }
  }

  if (state.phase === 'done') {
    return (
      <div className={`lead-done lead-${tone}`} role="status">
        <p className="lead-done-title">Thank you, we have your request.</p>
        <p>
          A member of our Cairo planning team will reply by email the same day
          {isDay ? ' to confirm the date.' : ' with a day-by-day plan and a firm price.'} Your reference is{' '}
          <strong>{state.reference}</strong>.
        </p>
        <p>
          Anything urgent?{' '}
          <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer">
            Message us on WhatsApp
          </a>{' '}
          and quote your reference.
        </p>
      </div>
    );
  }

  const invalid = (name: string) => (fieldError === name ? true : undefined);

  return (
    <form className={`lead-form lead-${tone}`} onSubmit={onSubmit} noValidate={false} aria-labelledby={headingId}>
      {prefill?.tourTitle && (
        <p className="lead-tour">
          {isDay ? 'Day tour' : 'Starting from'}: <strong>{prefill.tourTitle}</strong>
        </p>
      )}

      {isDay ? (
        <div className="lead-row">
          <div className="lead-field">
            <label htmlFor={id('startDate')}>Date</label>
            <input id={id('startDate')} name="startDate" type="date" required min={todayIso()} aria-invalid={invalid('startDate')} />
          </div>
          <div className="lead-field">
            <label htmlFor={id('adults')}>Adults</label>
            <select id={id('adults')} name="adults" value={adults} onChange={(e) => setAdults(Number(e.target.value))}>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
          <div className="lead-field">
            <label htmlFor={id('children')}>Children</label>
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
              <label htmlFor={id('childAges')}>Ages</label>
              <input id={id('childAges')} name="childAges" type="text" placeholder="e.g. 6, 11" maxLength={80} />
            </div>
          )}
        </div>
      ) : (
        <>
          <fieldset className="lead-field">
            <legend>When are you travelling?</legend>
            {exact ? (
              <div className="lead-row">
                <div className="lead-field">
                  <label htmlFor={id('startDate')}>Arrive</label>
                  <input id={id('startDate')} name="startDate" type="date" required min={todayIso()} />
                </div>
                <div className="lead-field">
                  <label htmlFor={id('endDate')}>Leave</label>
                  <input id={id('endDate')} name="endDate" type="date" min={todayIso()} aria-invalid={invalid('endDate')} />
                </div>
              </div>
            ) : (
              <select name="travelMonth" aria-label="Month" defaultValue={prefill?.travelMonth ?? ''}>
                <option value="">Not decided yet</option>
                {months.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            )}
            <label className="lead-check">
              <input type="checkbox" checked={exact} onChange={(e) => setExact(e.target.checked)} /> I have exact dates
            </label>
          </fieldset>

          <div className="lead-row">
            <div className="lead-field">
              <label htmlFor={id('days')}>How many days?</label>
              <select id={id('days')} name="days" defaultValue={prefill?.days ?? dayBandFor(prefill?.durationDays)}>
                <option value="">Not sure</option>
                {DAY_BANDS.map((b) => (
                  <option key={b} value={b}>
                    {b} days
                  </option>
                ))}
              </select>
            </div>
            <div className="lead-field">
              <label htmlFor={id('budget')}>Budget per person</label>
              <select id={id('budget')} name="budget" defaultValue="">
                <option value="">Prefer not to say</option>
                {BUDGET_BANDS.map((b) => (
                  <option key={b} value={b}>
                    {BUDGET_LABELS[b]}
                  </option>
                ))}
              </select>
              <span className="lead-hint">Excluding international flights</span>
            </div>
          </div>

          <div className="lead-row">
            <div className="lead-field">
              <label htmlFor={id('adults')}>Adults</label>
              <select id={id('adults')} name="adults" defaultValue="2">
                {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>
            <div className="lead-field">
              <label htmlFor={id('children')}>Children</label>
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
                <label htmlFor={id('childAges')}>Their ages</label>
                <input id={id('childAges')} name="childAges" type="text" placeholder="e.g. 6, 11" maxLength={80} />
              </div>
            )}
          </div>
        </>
      )}

      {isDay && estimatedTotal !== null && (
        <p className="lead-estimate" aria-live="polite">
          Estimated: <strong>{'$' + estimatedTotal.toLocaleString('en-US')}</strong> for {adults} adult{adults === 1 ? '' : 's'}.
          {children > 0 && " Children's prices are confirmed in our reply."}
        </p>
      )}

      <div className="lead-row">
        <div className="lead-field">
          <label htmlFor={id('email')}>Email</label>
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
            WhatsApp <span className="lead-optional">(optional)</span>
          </label>
          <input
            id={id('whatsapp')}
            name="whatsapp"
            type="tel"
            autoComplete="tel"
            inputMode="tel"
            placeholder="+44 7700 900123"
            aria-invalid={invalid('whatsapp')}
          />
        </div>
      </div>

      <div className="lead-field">
        <label htmlFor={id('notes')}>
          Anything we should know? <span className="lead-optional">(optional)</span>
        </label>
        <textarea
          id={id('notes')}
          name="notes"
          rows={3}
          maxLength={2000}
          placeholder={isDay ? 'Hotel, pickup time, anything else' : 'Interests, must-sees, mobility'}
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
        {state.phase === 'sending' ? 'Sending…' : isDay ? 'Check this date' : 'Send me my itinerary'}
      </button>
      <p className="lead-fine">
        Free, no obligation. We reply the same day, seven days a week. We use your details only to answer this
        request.
      </p>
    </form>
  );
}
