import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Default Leaflet markers don't load via bundler paths — pin them to CDN URLs.
const DefaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

export interface MarkerPoint {
  id: string;
  lat: number;
  lng: number;
  title: string;
  href?: string;
}

interface Props {
  center: [number, number];
  zoom?: number;
  markers?: MarkerPoint[];
  height?: number | string;
}

export function PropertyMap({ center, zoom = 13, markers = [], height = 360 }: Props) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) {
    return (
      <div
        className="grid place-items-center rounded-2xl bg-muted text-sm text-muted-foreground"
        style={{ height }}
      >
        Loading map…
      </div>
    );
  }
  return (
    <div className="overflow-hidden rounded-2xl border border-border" style={{ height }}>
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom={false}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {markers.map((m) => (
          <Marker key={m.id} position={[m.lat, m.lng]}>
            <Popup>
              <div className="text-sm font-semibold">{m.title}</div>
              {m.href && (
                <a href={m.href} className="text-xs text-primary underline">
                  View details
                </a>
              )}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
