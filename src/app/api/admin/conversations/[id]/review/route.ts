import { NextResponse, type NextRequest } from 'next/server';

import { requireAdminSession } from '@/lib/admin/guard';
import {
  REVIEW_NOTE_CATEGORIES,
  type ReviewNoteCategory,
  isValidRating,
  serializeReviewerNotes,
} from '@/lib/admin/review';
import { conciergeDb } from '@/lib/supabase/server';
import type { ConciergeDatabase } from '@/types/concierge-db';

type ConversationUpdate = ConciergeDatabase['concierge']['Tables']['conversations']['Update'];

/**
 * POST /api/admin/conversations/[id]/review — save reviewer rating, notes,
 * mark-reviewed (Session 10).
 *
 * Accepts form-urlencoded (the detail page form posts this way) or JSON.
 * All three fields are independently optional — reviewers can update one at
 * a time without clearing the others.
 *
 * Gated by `requireAdminSession` (Supabase Auth session AND ADMIN_EMAILS).
 */
export const runtime = 'nodejs';

const CATEGORY_SET = new Set<ReviewNoteCategory>(REVIEW_NOTE_CATEGORIES);

function coerceCategories(raw: unknown): ReviewNoteCategory[] | null {
  if (raw === undefined || raw === null) return null;
  const list = Array.isArray(raw) ? raw : [raw];
  const out: ReviewNoteCategory[] = [];
  for (const item of list) {
    if (typeof item !== 'string') continue;
    if (CATEGORY_SET.has(item as ReviewNoteCategory)) {
      out.push(item as ReviewNoteCategory);
    }
  }
  return out;
}

interface ReviewInput {
  rating: number | null;
  noteCategories: ReviewNoteCategory[] | null;
  markReviewed: boolean | null;
}

async function readInput(req: NextRequest): Promise<ReviewInput> {
  const ct = req.headers.get('content-type') ?? '';
  if (ct.includes('application/json')) {
    try {
      const body = (await req.json()) as {
        rating?: unknown;
        noteCategories?: unknown;
        markReviewed?: unknown;
      };
      return {
        rating:
          typeof body.rating === 'number' && isValidRating(body.rating) ? body.rating : null,
        noteCategories: coerceCategories(body.noteCategories),
        markReviewed: typeof body.markReviewed === 'boolean' ? body.markReviewed : null,
      };
    } catch {
      return { rating: null, noteCategories: null, markReviewed: null };
    }
  }
  const form = await req.formData();
  const ratingRaw = form.get('rating');
  const ratingNum = typeof ratingRaw === 'string' ? Number(ratingRaw) : NaN;
  return {
    rating: isValidRating(ratingNum) ? ratingNum : null,
    noteCategories: coerceCategories(form.getAll('noteCategories')),
    markReviewed: form.get('markReviewed') === 'true',
  };
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const gate = await requireAdminSession();
  if (gate instanceof NextResponse) return gate;

  const { id } = await context.params;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    return NextResponse.json({ error: 'invalid_id' }, { status: 400 });
  }

  const input = await readInput(req);

  const update: ConversationUpdate = {};
  if (input.rating !== null) update.reviewer_rating = input.rating;
  if (input.noteCategories !== null) {
    update.reviewer_notes = serializeReviewerNotes(input.noteCategories);
  }
  if (input.markReviewed !== null) update.reviewed = input.markReviewed;

  if (Object.keys(update).length === 0) {
    // Form submitted with no changes — accept and redirect back, idempotent.
    return NextResponse.redirect(new URL(`/admin/conversations/${id}`, req.url), {
      status: 303,
    });
  }

  try {
    const { error } = await conciergeDb().from('conversations').update(update).eq('id', id);
    if (error) {
      console.error('[admin] review save failed:', error);
      return NextResponse.json({ error: 'review_save_failed' }, { status: 500 });
    }
  } catch (err) {
    console.error('[admin] review route failed:', err);
    return NextResponse.json({ error: 'review_save_failed' }, { status: 500 });
  }

  const accept = req.headers.get('accept') ?? '';
  if (accept.includes('application/json')) {
    return NextResponse.json({ ok: true });
  }
  return NextResponse.redirect(new URL(`/admin/conversations/${id}`, req.url), {
    status: 303,
  });
}
