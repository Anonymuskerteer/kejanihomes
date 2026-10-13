import { lazy, Suspense, useEffect, useState, type ComponentProps } from "react";
import type { PropertyMap as Impl } from "./property-map-impl";
import { MapLoadBoundary } from "./map-load-boundary";
export type { MarkerPoint } from "./property-map-impl";

// Leaflet touches `window` on import, so load it only in the browser.
const LazyMap = lazy(() => import("./property-map-impl").then((m) => ({ default: m.PropertyMap })));

export function PropertyMap(props: ComponentProps<typeof Impl>) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const fallback = (
    <div className="grid place-items-center rounded-2xl bg-muted text-sm text-muted-foreground" style={{ height: props.height ?? 360 }}>
      Loading map…
    </div>
  );
  if (!mounted) return fallback;
  return (
    <MapLoadBoundary height={props.height ?? 360}>
      <Suspense fallback={fallback}>
        <LazyMap {...props} />
      </Suspense>
    </MapLoadBoundary>
  );
}
