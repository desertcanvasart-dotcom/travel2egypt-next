/**
 * Route-change transition wrapper.
 *
 * Next.js remounts `template.tsx` on every navigation (unlike `layout.tsx`,
 * which persists), so the CSS entrance animation on `.route-transition`
 * replays each time the user moves between pages — softening the previously
 * abrupt hard cut into a brief fade-up. Pure CSS, no JS or dependencies;
 * fully disabled under `prefers-reduced-motion` (see globals.css).
 */
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="route-transition">{children}</div>;
}
