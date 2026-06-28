import { NextResponse, type NextRequest } from 'next/server';

import { requireAdminSession } from '@/lib/admin/guard';
import { isRoutedBrand } from '@/lib/concierge/brands';
import { conciergeDb } from '@/lib/supabase/server';
import type { ConciergeDatabase } from '@/types/concierge-db';

type ConversationUpdate = ConciergeDatabase['concierge']['Tables']['conversations']['Update'];

/**
 * POST /api/admin/conversations/[id]/routing — set the conversation's room
 * (Session 13). The portfolio handoff is REVERSIBLE: an admin can move a lead
 * back to the anchor or re-route it. This changes HANDLING only — the house
 * keeps oversight of every routed conversation, and an already-sent brief is
 * not re-delivered (a re-route takes effect on the next brief, whose
 * delivered_brand snapshots the new target).
 *
 * Accepts form-urlencoded (the detail page posts this way) or JSON.
 * Gated by `requireAdminSession` (Supabase Auth session AND ADMIN_EMAILS).
 */
export const runtime = 'nodejs';

interface RoutingInput {
  routedBrand: string | null;
  routingReason: string | null;
}

async function readInput(req: NextRequest): Promise<RoutingInput> {
  const ct = req.headers.get('content-type') ?? '';
  if (ct.includes('application/json')) {
    try {
      const body = (await req.json()) as { routedBrand?: unknown; routingReason?: unknown };
      return {
        routedBrand: typeof body.routedBrand === 'string' ? body.routedBrand : null,
        routingReason: typeof body.routingReason === 'string' ? body.routingReason : null,
      };
    } catch {
      return { routedBrand: null, routingReason: null };
    }
  }
  const form = await req.formData();
  const brand = form.get('routedBrand');
  const reason = form.get('routingReason');
  return {
    routedBrand: typeof brand === 'string' ? brand : null,
    routingReason: typeof reason === 'string' ? reason : null,
  };
}

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const gate = await requireAdminSession();
  if (gate instanceof NextResponse) return gate;

  const { id } = await context.params;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    return NextResponse.json({ error: 'invalid_id' }, { status: 400 });
  }

  const input = await readInput(req);

  // routed_brand must be one of the controlled vocab; reject anything else
  // rather than writing a value the delivery routing can't resolve.
  if (!isRoutedBrand(input.routedBrand)) {
    return NextResponse.json({ error: 'invalid_brand' }, { status: 400 });
  }

  const update: ConversationUpdate = { routed_brand: input.routedBrand };
  // Trim + empty→null so clearing the field clears the reason.
  const reason = input.routingReason?.trim();
  update.routing_reason = reason ? reason : null;

  try {
    const { error } = await conciergeDb().from('conversations').update(update).eq('id', id);
    if (error) {
      console.error('[admin] routing save failed:', error);
      return NextResponse.json({ error: 'routing_save_failed' }, { status: 500 });
    }
  } catch (err) {
    console.error('[admin] routing route failed:', err);
    return NextResponse.json({ error: 'routing_save_failed' }, { status: 500 });
  }

  const accept = req.headers.get('accept') ?? '';
  if (accept.includes('application/json')) {
    return NextResponse.json({ ok: true });
  }
  return NextResponse.redirect(new URL(`/admin/conversations/${id}`, req.url), { status: 303 });
}
