import { NextResponse, type NextRequest } from 'next/server';

import { requireAdminSession } from '@/lib/admin/guard';
import { assertSameOrigin } from '@/lib/http/sameOrigin';
import { conciergeDb } from '@/lib/supabase/server';

/**
 * POST /api/admin/site-changes — add or remove a change-date marker shown on
 * /admin/report. Form-encoded (plain HTML forms). Admin-gated + same-origin.
 *   action=add    day=YYYY-MM-DD  description=…
 *   action=delete id=<id>
 */
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const crossOrigin = assertSameOrigin(req);
  if (crossOrigin) return crossOrigin;
  const gate = await requireAdminSession();
  if (gate instanceof NextResponse) return gate;

  const form = await req.formData();
  const action = form.get('action');
  const db = conciergeDb();
  if (action === 'add') {
    const day = String(form.get('day') ?? '');
    const description = String(form.get('description') ?? '').trim().slice(0, 300);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || !description) return NextResponse.json({ error: 'invalid' }, { status: 422 });
    const { error } = await db.from('site_changes').insert({ day, description });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  } else if (action === 'delete') {
    const id = Number(form.get('id'));
    if (!Number.isInteger(id)) return NextResponse.json({ error: 'invalid' }, { status: 422 });
    const { error } = await db.from('site_changes').delete().eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  } else {
    return NextResponse.json({ error: 'invalid' }, { status: 422 });
  }
  return NextResponse.redirect(new URL('/admin/report', req.url), 303);
}
