/**
 * Shared skeleton for route-level loading.tsx files. Lightweight, no
 * spinner — a soft pulsing block sized to the typical hero + content
 * region, so the first paint isn't a layout jump.
 */
export function PageLoading() {
  return (
    <div role="status" aria-live="polite" aria-label="Loading">
      <div className="h-[60vh] min-h-[400px] w-full animate-pulse bg-limestone-deep" />
      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid grid-cols-1 gap-16 lg:grid-cols-[1fr_340px]">
          <div className="space-y-6">
            <div className="h-6 w-3/4 animate-pulse bg-limestone-deep" />
            <div className="h-4 w-full animate-pulse bg-limestone-deep" />
            <div className="h-4 w-5/6 animate-pulse bg-limestone-deep" />
            <div className="h-4 w-4/6 animate-pulse bg-limestone-deep" />
          </div>
          <div className="space-y-3">
            <div className="h-40 w-full animate-pulse bg-limestone-deep" />
            <div className="h-12 w-full animate-pulse bg-limestone-deep" />
            <div className="h-12 w-full animate-pulse bg-limestone-deep" />
          </div>
        </div>
      </div>
    </div>
  );
}
