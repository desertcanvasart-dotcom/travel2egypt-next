import { notFound } from 'next/navigation';

/**
 * Locale-scoped catchall — fires notFound() for any path under [locale]/
 * that doesn't match a defined route template. Restores branded 404
 * coverage that was lost when src/app/not-found.tsx was deleted to
 * unblock Next 15.5's stricter root-layout validation.
 *
 * Has the lowest routing priority within the segment, so it does not
 * shadow concrete routes like /[locale]/guide/* or /[locale]/wiki/*.
 */
export default function CatchAll(): never {
  notFound();
}
