import { Link } from "@tanstack/react-router";
import { Bath, BedDouble, Heart, MapPin, Star, BadgeCheck } from "lucide-react";
import type { Property } from "@/lib/properties";
import { formatKES } from "@/lib/properties";

export function PropertyCard({ property }: { property: Property }) {
  return (
    <Link
      to="/property/$id"
      params={{ id: property.id }}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-card transition hover:-translate-y-0.5 hover:shadow-elevated"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        <img
          src={property.cover}
          alt={property.title}
          loading="lazy"
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />
        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          <span className="rounded-full bg-background/90 px-2.5 py-1 text-xs font-semibold text-foreground backdrop-blur">
            {property.type}
          </span>
          {property.verified && (
            <span className="inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-xs font-semibold text-primary-foreground">
              <BadgeCheck className="h-3 w-3" /> Verified
            </span>
          )}
        </div>
        <button
          type="button"
          aria-label="Save"
          onClick={(e) => { e.preventDefault(); }}
          className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-background/90 text-foreground/80 backdrop-blur transition hover:bg-background hover:text-destructive"
        >
          <Heart className="h-4 w-4" />
        </button>
        <div className="absolute bottom-3 left-3 rounded-full bg-accent px-3 py-1 text-sm font-bold text-accent-foreground shadow-soft">
          {formatKES(property.rent)}<span className="text-[10px] font-medium opacity-80">/mo</span>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="line-clamp-1 font-display text-base font-semibold leading-tight">
            {property.title}
          </h3>
          <span className="inline-flex shrink-0 items-center gap-1 rounded-md bg-accent-soft px-1.5 py-0.5 text-xs font-semibold text-foreground">
            <Star className="h-3 w-3 fill-accent text-accent" /> {property.rating.toFixed(1)}
          </span>
        </div>
        <p className="flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="h-3.5 w-3.5" /> {property.estate}, {property.town}
        </p>
        <div className="mt-2 flex items-center gap-4 border-t border-border pt-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1"><BedDouble className="h-4 w-4" /> {property.bedrooms || "—"} bed</span>
          <span className="inline-flex items-center gap-1"><Bath className="h-4 w-4" /> {property.bathrooms} bath</span>
          <span className="ml-auto text-[11px]">{property.views.toLocaleString()} views</span>
        </div>
      </div>
    </Link>
  );
}
