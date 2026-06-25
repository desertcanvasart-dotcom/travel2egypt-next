import { redirect } from 'next/navigation';

import { getAdminSession } from '@/lib/admin/auth';

export const dynamic = 'force-dynamic';

/**
 * Admin landing page (Session 10).
 *
 * Gated behind the two-factor admin check:
 *   - Valid Supabase Auth session, AND
 *   - Session email in `ADMIN_EMAILS` allowlist
 *
 * Either gate failing → redirect to `/admin/login`. The list view (T6)
 * replaces the placeholder body.
 */
export default async function AdminLanding() {
  const session = await getAdminSession();
  if (!session) redirect('/admin/login');

  return (
    <main style={{ padding: '2rem', fontFamily: 'system-ui, sans-serif' }}>
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          marginBottom: '1.5rem',
        }}
      >
        <h1>Concierge Admin</h1>
        <form method="post" action="/api/admin/auth/logout">
          <span style={{ color: '#666', marginRight: '0.75rem' }}>{session.email}</span>
          <button
            type="submit"
            style={{
              padding: '0.35rem 0.85rem',
              background: 'transparent',
              border: '1px solid #ccc',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Sign out
          </button>
        </form>
      </header>
      <p style={{ color: '#555' }}>
        List view in progress — filters, sort, pagination, quick stats land in the next step.
      </p>
    </main>
  );
}
