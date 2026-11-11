import { type NextRequest } from 'next/server';

import { redirectTo } from '@/lib/http/redirect';

import { adminAuthClient } from '@/lib/admin/auth';

/**
 * POST /api/admin/auth/logout — clear the admin auth session cookie.
 */
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const supabase = await adminAuthClient();
  await supabase.auth.signOut();
  return redirectTo('/admin/login', 303);
}
