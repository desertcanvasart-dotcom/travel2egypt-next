import Link from 'next/link';
import { redirect } from 'next/navigation';

import { getAdminSession } from '@/lib/admin/auth';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Sign in · Concierge Admin',
  robots: { index: false, follow: false },
};

/**
 * Two-stage sign-in for the S10 admin reviewer panel.
 *
 * Stage 1 (`/admin/login`) — email-only form. POST to /api/admin/auth/login
 * either skips the Supabase call (non-whitelisted email) or fires
 * signInWithOtp. Returns ?sent=1&email=… either way (no enumeration leak).
 *
 * Stage 2 (`/admin/login?sent=1&email=…`) — 6-digit code form. POST to
 * /api/admin/auth/verify calls verifyOtp; on success redirects to /admin.
 *
 * No client JS. No PKCE verifier cookie. The user can read the code in any
 * device or browser and type it into this form on any other.
 */
export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string; email?: string; error?: string }>;
}) {
  const session = await getAdminSession();
  if (session) redirect('/admin');

  const sp = await searchParams;
  const sent = sp.sent === '1';
  const email = typeof sp.email === 'string' ? sp.email : '';
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
        Reviewer sign-in. One-time code by email, separate from Sanity Studio.
      </p>

      {sent ? (
        <CodeForm email={email} errorCode={errorCode} />
      ) : (
        <EmailForm errorCode={errorCode} />
      )}
    </main>
  );
}

const inputStyle: React.CSSProperties = {
  padding: '0.65rem 0.85rem',
  border: '1px solid #ccc',
  borderRadius: '4px',
  fontSize: '1rem',
};
const buttonStyle: React.CSSProperties = {
  padding: '0.7rem 1rem',
  background: '#1a1a1a',
  color: '#fff',
  border: '0',
  borderRadius: '4px',
  fontSize: '1rem',
  cursor: 'pointer',
};
const errorStyle: React.CSSProperties = { color: '#a02020', marginTop: '0.5rem' };

function EmailForm({ errorCode }: { errorCode: string | undefined }) {
  return (
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
        style={inputStyle}
      />
      <button type="submit" style={buttonStyle}>
        Send sign-in code
      </button>
      {errorCode === 'use_otp' ? (
        <p role="alert" style={errorStyle}>
          Magic links are no longer used. Enter your email to receive a 6-digit code.
        </p>
      ) : errorCode ? (
        <p role="alert" style={errorStyle}>
          Something went wrong. Try again.
        </p>
      ) : null}
    </form>
  );
}

function CodeForm({ email, errorCode }: { email: string; errorCode: string | undefined }) {
  return (
    <>
      <div
        role="status"
        style={{
          padding: '0.75rem 1rem',
          border: '1px solid #cce0cc',
          background: '#f4faf4',
          borderRadius: '6px',
          color: '#235023',
          marginBottom: '1.5rem',
          fontSize: '0.95rem',
        }}
      >
        If your email is a reviewer, a one-time code is on the way to{' '}
        <strong>{email || 'your inbox'}</strong>. Enter it below.
      </div>
      <form
        method="post"
        action="/api/admin/auth/verify"
        style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}
      >
        <input type="hidden" name="email" value={email} />
        <label htmlFor="code" style={{ fontSize: '0.9rem', color: '#444' }}>
          Sign-in code
        </label>
        <input
          id="code"
          name="code"
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9]{4,10}"
          maxLength={10}
          required
          style={{ ...inputStyle, fontSize: '1.25rem', letterSpacing: '0.4em', textAlign: 'center' }}
        />
        <button type="submit" style={buttonStyle}>
          Verify
        </button>
        {errorCode === 'invalid_code' ? (
          <p role="alert" style={errorStyle}>
            Code invalid or expired. Try again, or request a new code.
          </p>
        ) : errorCode === 'unauthorized' ? (
          <p role="alert" style={errorStyle}>
            This account is not authorised for the admin panel.
          </p>
        ) : null}
      </form>
      <p style={{ marginTop: '1.25rem', fontSize: '0.9rem' }}>
        <Link href="/admin/login" style={{ color: '#555', textDecoration: 'underline' }}>
          Use a different email
        </Link>
      </p>
    </>
  );
}
