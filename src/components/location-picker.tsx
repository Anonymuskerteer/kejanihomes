import { lazy, Suspense, useEffect, useState, type ComponentProps } from "react";
import type { LocationPicker as Impl } from "./location-picker-impl";
import { MapLoadBoundary } from "./map-load-boundary";

// Leaflet touches `window` on import, so load it only in the browser.
const LazyPicker = lazy(() => import("./location-picker-impl").then((m) => ({ default: m.LocationPicker })));

export function LocationPicker(props: ComponentProps<typeof Impl>) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const fallback = (
    <div className="grid place-items-center rounded-2xl bg-muted text-sm text-muted-foreground" style={{ height: props.height ?? 320 }}>
      Loading map…
    </div>
  );
  if (!mounted) return fallback;
  return (
    <MapLoadBoundary height={props.height ?? 320}>
      <Suspense fallback={fallback}>
        <LazyPicker {...props} />
      </Suspense>
    </MapLoadBoundary>
  );
}
