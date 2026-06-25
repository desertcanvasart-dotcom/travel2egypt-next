/**
 * ADMIN_EMAILS allowlist for the S10 admin reviewer panel.
 *
 * A valid Supabase Auth session alone grants NOTHING — anyone can create an
 * account by sending themselves a magic link. Access is the AND of (session
 * valid) AND (session email in this list). Both checks live server-side; the
 * second is the security boundary, the first is just identity.
 *
 * `ADMIN_EMAILS` is a comma-separated env var (e.g.
 * "alice@team.org,bob@team.org"). Whitespace around addresses is trimmed.
 * Matches are case-insensitive (Supabase normalises email at signup, but we
 * fold here too for defence-in-depth).
 *
 * Revoke = remove the email from `ADMIN_EMAILS` + redeploy. v2 may move this
 * to a DB table (per brief, "Decisions to flag"); for v1 the env-var
 * tradeoff is correct — admins are few, churn is rare, redeploy is fast.
 */

function parseAdminEmails(raw: string | undefined): Set<string> {
  if (!raw) return new Set();
  return new Set(
    raw
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean),
  );
}

let cached: { source: string | undefined; emails: Set<string> } | null = null;

export function getAdminEmails(): Set<string> {
  const source = process.env.ADMIN_EMAILS;
  if (cached && cached.source === source) return cached.emails;
  cached = { source, emails: parseAdminEmails(source) };
  return cached.emails;
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return getAdminEmails().has(email.trim().toLowerCase());
}
