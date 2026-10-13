import { useEffect, useState } from "react";
import { MapContainer, TileLayer, LayersControl, Marker, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Crosshair, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DEFAULT_MAP_CENTER } from "@/lib/properties";

const DefaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

interface Props {
  value: { lat: number | null; lng: number | null };
  onChange: (v: { lat: number; lng: number }) => void;
  height?: number;
}

function Recenter({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, Math.max(map.getZoom(), 15));
  }, [center[0], center[1]]);
  return null;
}

function ClickToPlace({ onChange }: { onChange: Props["onChange"] }) {
  useMapEvents({
    click(e) {
      onChange({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

export function LocationPicker({ value, onChange, height = 320 }: Props) {
  const [mounted, setMounted] = useState(false);
  const [locating, setLocating] = useState(false);
  const [tileError, setTileError] = useState(false);
  const [tileAttempt, setTileAttempt] = useState(0);
  const hasValue = value.lat != null && value.lng != null;
  const center: [number, number] = hasValue
    ? [value.lat as number, value.lng as number]
    : DEFAULT_MAP_CENTER;

  useEffect(() => setMounted(true), []);

  // On first mount, if no value yet, try to use device location.
  useEffect(() => {
    if (!mounted || hasValue) return;
    if (!("geolocation" in navigator)) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onChange({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 8000 },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted]);

  const locate = () => {
    if (!("geolocation" in navigator)) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onChange({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 8000 },
    );
  };

  if (!mounted) {
    return (
      <div className="grid place-items-center rounded-2xl bg-muted text-sm text-muted-foreground" style={{ height }}>
        Loading map…
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">
          Drag the pin, or click the map to move it. Tap “Use my location” to snap to your device position.
        </p>
        <Button type="button" size="sm" variant="outline" onClick={locate} disabled={locating}>
          {locating ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Crosshair className="mr-1.5 h-3.5 w-3.5" />}
          Use my location
        </Button>
      </div>
      <div className="relative overflow-hidden rounded-2xl border border-border" style={{ height }}>
        <MapContainer key={tileAttempt} center={center} zoom={hasValue ? 15 : 12} style={{ height: "100%", width: "100%" }}>
          <LayersControl position="topright">
            <LayersControl.BaseLayer checked name="Map">
              <TileLayer
                eventHandlers={{ tileerror: () => setTileError(true) }}
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
            </LayersControl.BaseLayer>
            <LayersControl.BaseLayer name="Satellite">
              <TileLayer
                eventHandlers={{ tileerror: () => setTileError(true) }}
                attribution="Tiles &copy; Esri"
                maxZoom={19}
                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              />
            </LayersControl.BaseLayer>
          </LayersControl>
          <ClickToPlace onChange={onChange} />
          {hasValue && (
            <>
              <Recenter center={center} />
              <Marker
                position={center}
                draggable
                eventHandlers={{
                  dragend: (e) => {
                    const { lat, lng } = (e.target as L.Marker).getLatLng();
                    onChange({ lat, lng });
                  },
                }}
              />
            </>
          )}
        </MapContainer>
        {tileError && (
          <div
            role="alert"
            className="absolute inset-x-3 bottom-3 z-[1000] flex flex-wrap items-center justify-between gap-2 rounded-xl bg-background/95 p-3 text-xs shadow-card"
          >
            <span>Map tiles couldn't load. Check your internet connection.</span>
            <button
              type="button"
              className="font-semibold text-primary underline"
              onClick={() => {
                setTileError(false);
                setTileAttempt((attempt) => attempt + 1);
              }}
            >
              Retry
            </button>
          </div>
        )}
      </div>
      {hasValue && (
        <p className="text-xs text-muted-foreground">
          Pin: <span className="font-mono">{(value.lat as number).toFixed(5)}, {(value.lng as number).toFixed(5)}</span>
        </p>
      )}
    </div>
  );
}
