import { redirect } from 'next/navigation';

import { getAdminSession } from '@/lib/admin/auth';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Sign in · Concierge Admin',
  robots: { index: false, follow: false },
};

/**
 * Magic-link sign-in form for the S10 admin reviewer panel.
 *
 * Server Component — no client JS. The form POSTs as multipart/form-data to
 * `/api/admin/auth/login`, which:
 *   (a) checks the email against ADMIN_EMAILS BEFORE calling Supabase Auth
 *       (to skip email-quota spend for non-admins), and
 *   (b) returns the SAME "if you are a reviewer, a link is on the way"
 *       message regardless, so the form never leaks who is in the allowlist.
 *
 * The link from Supabase Auth's email redirects to
 * `/api/admin/auth/callback?code=…`, which exchanges the code for a session
 * cookie and redirects to `/admin`.
 */
export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string; error?: string }>;
}) {
  // If already signed in as an admin, skip the form.
  const session = await getAdminSession();
  if (session) redirect('/admin');

  const sp = await searchParams;
  const sent = sp.sent === '1';
  const errorCode = sp.error;

  return (
    <main
      style={{
        maxWidth: '28rem',
        margin: '4rem auto',
        padding: '0 1.5rem',
        fontFamily: 'system-ui, sans-serif',
        color: '#222',
      }}
    >
      <h1 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Concierge Admin</h1>
      <p style={{ color: '#555', marginBottom: '2rem' }}>
        Reviewer sign-in. Magic link, separate from Sanity Studio.
      </p>

      {sent ? (
        <div
          role="status"
          style={{
            padding: '1rem 1.25rem',
            border: '1px solid #cce0cc',
            background: '#f4faf4',
            borderRadius: '6px',
            color: '#235023',
          }}
        >
          If your email is a reviewer, a sign-in link is on the way. Open it on this device
          to continue.
        </div>
      ) : (
        <form
          method="post"
          action="/api/admin/auth/login"
          style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}
        >
          <label htmlFor="email" style={{ fontSize: '0.9rem', color: '#444' }}>
            Email address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            style={{
              padding: '0.65rem 0.85rem',
              border: '1px solid #ccc',
              borderRadius: '4px',
              fontSize: '1rem',
            }}
          />
          <button
            type="submit"
            style={{
              padding: '0.7rem 1rem',
              background: '#1a1a1a',
              color: '#fff',
              border: '0',
              borderRadius: '4px',
              fontSize: '1rem',
              cursor: 'pointer',
            }}
          >
            Send sign-in link
          </button>
          {errorCode ? (
            <p role="alert" style={{ color: '#a02020', marginTop: '0.5rem' }}>
              {errorCode === 'unauthorized'
                ? 'This account is not authorised for the admin panel.'
                : 'Something went wrong. Try again.'}
            </p>
          ) : null}
        </form>
      )}
    </main>
  );
}
