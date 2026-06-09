import { NextResponse } from 'next/server';

/**
 * POST /api/escape-hatch — Session 2 skeleton.
 *
 * Session 5 implements the real route: the three-option human-handoff
 * panel's backend (WhatsApp ref derivation, forward-to-team email via
 * Resend, escape-hatch logging columns from migration 0002, flagging).
 */
export const runtime = 'nodejs';

export async function POST() {
  return NextResponse.json(
    { error: 'not_implemented', detail: 'Escape hatch ships in Session 5.' },
    { status: 501 },
  );
}
