import '@/styles/resources.css';

/**
 * Route-segment layout for /resources/**. Imports the scoped field-guide
 * CSS once, here, so every guide and the index get it without any per-page
 * boilerplate. Renders children unwrapped — each page composes its own
 * <FieldGuideShell> (the `.fg-doc` scope lives in there, not here, so the
 * surrounding site nav/footer keep their global chrome).
 */
export default function ResourcesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
