import { revalidatePath } from 'next/cache';
import { NextResponse, type NextRequest } from 'next/server';

import { requireAdminSession } from '@/lib/admin/guard';
import { assertSameOrigin } from '@/lib/http/sameOrigin';
import { adminSanity, canWrite, DEPARTURE_STATUSES, type DepartureStatus } from '@/lib/admin/departures';

/**
 * POST /api/admin/departures — edit a group tour's scheduled departures from
 * /admin/departures (owner, 2026-11-11). Form-encoded. Admin-gated +
 * same-origin, like /api/admin/site-changes.
 *
 *   action=update tour=<id> key=<_key> status=<''|guaranteed|few|available|soldout|onrequest> placesLeft=<n|''>
 *   action=add    tour=<id> date=YYYY-MM-DD peak=on?
 *   action=remove tour=<id> key=<_key>
 *
 * After a save, the small-group hub and that tour's page are revalidated in
 * every language, so the change shows on the next visit.
 */
export const runtime = 'nodejs';

const LOCALES = ['en', 'es', 'ja'] as const;
const DATE_RE = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

function back(req: NextRequest, msg: string) {
  return NextResponse.redirect(new URL(`/admin/departures?msg=${encodeURIComponent(msg)}`, req.url), 303);
}

export async function POST(req: NextRequest) {
  const crossOrigin = assertSameOrigin(req);
  if (crossOrigin) return crossOrigin;
  const gate = await requireAdminSession();
  if (gate instanceof NextResponse) return gate;
  if (!canWrite()) return back(req, 'Read-only: no Sanity write token on the server.');

  const form = await req.formData();
  const action = String(form.get('action') ?? '');
  const tourId = String(form.get('tour') ?? '');
  const key = String(form.get('key') ?? '');
  const sanity = adminSanity();

  const tour = await sanity.fetch<{ _id: string; slugs: Record<string, string | null> } | null>(
    `*[_id == $id && _type == "tour" && tourMode == "group" && !(_id in path("drafts.**"))][0]{
      _id, "slugs": { "en": slug[_key=="en"][0].value.current, "es": slug[_key=="es"][0].value.current, "ja": slug[_key=="ja"][0].value.current }
    }`,
    { id: tourId },
  );
  if (!tour) return back(req, 'Unknown tour.');

  try {
    if (action === 'update') {
      if (!/^[A-Za-z0-9_-]{1,64}$/.test(key)) return back(req, 'Bad departure key.');
      const status = String(form.get('status') ?? '') as DepartureStatus;
      if (!(DEPARTURE_STATUSES as readonly string[]).includes(status)) return back(req, 'Bad status.');
      const placesRaw = String(form.get('placesLeft') ?? '').trim();
      const places = placesRaw === '' ? null : Number.parseInt(placesRaw, 10);
      if (places !== null && (!Number.isFinite(places) || places < 0 || places > 99)) return back(req, 'Places left must be 0–99 or empty.');
      const path = `departures[_key=="${key}"]`;
      let patch = sanity.patch(tour._id);
      patch = status ? patch.set({ [`${path}.status`]: status }) : patch.unset([`${path}.status`]);
      patch = places !== null ? patch.set({ [`${path}.placesLeft`]: places }) : patch.unset([`${path}.placesLeft`]);
      await patch.commit({ autoGenerateArrayKeys: false });
    } else if (action === 'add') {
      const date = String(form.get('date') ?? '');
      if (!DATE_RE.test(date)) return back(req, 'Pick a valid date.');
      const peak = form.get('peak') === 'on';
      await sanity
        .patch(tour._id)
        .setIfMissing({ departures: [] })
        .append('departures', [{ _type: 'departure', _key: `dep${Date.now().toString(36)}`, startDate: date, isPeak: peak }])
        .commit({ autoGenerateArrayKeys: false });
    } else if (action === 'remove') {
      if (!/^[A-Za-z0-9_-]{1,64}$/.test(key)) return back(req, 'Bad departure key.');
      await sanity.patch(tour._id).unset([`departures[_key=="${key}"]`]).commit();
    } else {
      return back(req, 'Unknown action.');
    }
  } catch (err) {
    console.error('[admin/departures] save failed:', err);
    return back(req, 'Save failed — nothing changed. Try again or use Sanity Studio.');
  }

  for (const l of LOCALES) {
    revalidatePath(`/${l}/small-group-travel-packages`);
    const s = tour.slugs[l] ?? tour.slugs.en;
    if (s) revalidatePath(`/${l}/${s}`);
  }
  return back(req, 'Saved. The site updates on the next page load.');
}
