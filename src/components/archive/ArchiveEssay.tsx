import { Body } from '@/components/Body';
import type { Locale } from '@/i18n/routing';

/**
 * Two-column editorial essay: a short sticky heading on the left, the
 * PortableText body on the right. The body is CMS-authored and may contain a
 * definition list (the grades) and concierge notes — both handled by the
 * shared <Body> serializer. Hidden entirely if there's no body.
 */
export function ArchiveEssay({
  heading,
  body,
  locale,
}: {
  heading?: string;
  body: unknown;
  locale: Locale;
}) {
  if (!body || (Array.isArray(body) && body.length === 0)) return null;
  return (
    <section className="border-b border-rule">
      <div className="grid grid-cols-1 gap-12 py-16 md:py-20 lg:grid-cols-[280px_minmax(0,1fr)] lg:gap-20">
        {heading && (
          <aside className="lg:sticky lg:top-28 lg:self-start">
            <h2 className="font-serif text-3xl font-normal leading-[1.05] text-faience">
              {heading}
            </h2>
          </aside>
        )}
        <div className="prose-editorial max-w-[680px]">
          <Body value={body} locale={locale} />
        </div>
      </div>
    </section>
  );
}
