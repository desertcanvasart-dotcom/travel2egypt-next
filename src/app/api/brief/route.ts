import { NextResponse } from 'next/server';

/**
 * POST /api/brief — Session 2 skeleton.
 *
 * Session 4 implements the real route: two-gate completion detection, the
 * Sonnet extraction call (lib/briefExtraction.ts), persistence to
 * concierge.briefs, and the completion panel contract. Session 9 attaches
 * Autoura delivery. Until then the route exists so the API surface (and
 * robots /api disallow) is final from the start.
 */
export const runtime = 'nodejs';

export async function POST() {
  return NextResponse.json(
    { error: 'not_implemented', detail: 'Brief extraction ships in Session 4.' },
    { status: 501 },
  );
}
