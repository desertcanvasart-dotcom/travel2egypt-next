import { NextResponse, type NextRequest } from 'next/server';

import { computeDigest } from '@/lib/admin/digest';
import { sendDigestEmail } from '@/lib/email/resend';

/**
 * GET /api/admin/digest — Railway cron target (Session 10).
 *
 * Protected by `Authorization: Bearer ${CRON_SECRET}` — NOT the
 * Supabase Auth admin gate (the cron is a machine, not a reviewer). Constant-
 * time comparison avoids leaking secret length via timing differences.
 *
 * Run from Railway cron at 08:00 Africa/Cairo (cron uses UTC, so configure
 * "0 6 * * *" — yields 08:00 Cairo standard / 09:00 Cairo during DST; the
 * 1h DST drift is accepted, intent is "morning summary"). Body summarises
 * the previous Cairo calendar day.
 *
 * Returns the digest payload on success so the cron logs preserve a useful
 * audit trail (no PII in the response — just counts + opaque ids).
 */
export const runtime = 'nodejs';

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    console.error('[admin] /api/admin/digest invoked but CRON_SECRET unset');
    return NextResponse.json({ error: 'cron_secret_unset' }, { status: 500 });
  }

  const auth = req.headers.get('authorization') ?? '';
  const expected = `Bearer ${secret}`;
  if (!timingSafeEqual(auth, expected)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  try {
    const stats = await computeDigest();
    await sendDigestEmail(stats);
    return NextResponse.json({
      ok: true,
      window: { start: stats.windowStart, end: stats.windowEnd },
      totals: stats.totals,
      briefsCompletedCount: stats.briefsCompleted.length,
      flaggedReasons: Object.fromEntries(
        Object.entries(stats.flaggedByReason).map(([k, v]) => [k, v.length]),
      ),
      topResponseTimesCount: stats.topResponseTimes.length,
      tokens: stats.tokenSummary,
    });
  } catch (err) {
    console.error('[admin] digest failed:', err);
    return NextResponse.json({ error: 'digest_failed' }, { status: 500 });
  }
}
