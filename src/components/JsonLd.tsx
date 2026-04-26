/**
 * Renders one or more Schema.org JSON-LD blocks. Inputs are plain
 * objects from the structured-data lib — never raw user input — so
 * the dangerouslySetInnerHTML usage here is safe.
 *
 * We strip out `<` characters as belt-and-braces against any malformed
 * value sneaking in (e.g. an editor-set string containing a tag-like
 * character). JSON.stringify already escapes most things; this guards
 * the script-tag boundary specifically.
 */

interface Props {
  data: Record<string, unknown> | Array<Record<string, unknown>>;
}

export function JsonLd({ data }: Props) {
  const json = JSON.stringify(data).replace(/</g, '\\u003c');
  return (
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: json }}
    />
  );
}
