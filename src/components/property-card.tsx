import { Link } from "@tanstack/react-router";
import { BedDouble, Bath, MapPin, Star, BadgeCheck } from "lucide-react";
import { formatKES, type PropertyRow } from "@/lib/properties";

interface Props {
  property: PropertyRow;
  averageRating?: number;
  reviewsCount?: number;
}

export function PropertyCard({ property, averageRating, reviewsCount }: Props) {
  const cover = property.images[0] || "/placeholder.svg";
  return (
    <Link
      to="/property/$id"
      params={{ id: property.id }}
      className="group block overflow-hidden rounded-2xl border border-border bg-card shadow-card transition hover:-translate-y-0.5 hover:shadow-elevated"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        <img
          src={cover}
          alt={property.title}
          loading="lazy"
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />
        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          <span className="rounded-full bg-background/95 px-2.5 py-1 text-[11px] font-semibold text-foreground shadow-soft">
            {property.property_type}
          </span>
          <span className="rounded-full bg-success px-2.5 py-1 text-[11px] font-semibold text-success-foreground shadow-soft">
            Available
          </span>
          {property.is_featured && (
            <span className="inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-[11px] font-semibold text-primary-foreground shadow-soft">
              <BadgeCheck className="h-3 w-3" /> Featured
            </span>
          )}
        </div>
        <div className="absolute bottom-3 left-3 rounded-xl bg-foreground/85 px-3 py-1.5 text-sm font-bold text-background backdrop-blur">
          {formatKES(property.price_kes)}
          <span className="ml-1 text-[10px] font-medium text-background/70">/mo</span>
        </div>
      </div>
      <div className="p-4">
        <h3 className="line-clamp-1 font-display text-base font-semibold">
          {property.title}
        </h3>
        <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="h-3.5 w-3.5" />
          {property.town}, {property.county}
        </div>
        <div className="mt-3 flex items-center justify-between border-t border-border pt-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1">
              <BedDouble className="h-3.5 w-3.5" />
              {property.bedrooms || "Studio"}
            </span>
            <span className="inline-flex items-center gap-1">
              <Bath className="h-3.5 w-3.5" />
              {property.bathrooms}
            </span>
          </div>
          {typeof averageRating === "number" && reviewsCount ? (
            <span className="inline-flex items-center gap-1 font-semibold text-foreground">
              <Star className="h-3.5 w-3.5 fill-accent text-accent" />
              {averageRating.toFixed(1)}
              <span className="text-muted-foreground">({reviewsCount})</span>
            </span>
          ) : (
            <span className="text-muted-foreground/70">No reviews yet</span>
          )}
        </div>
      </div>
    </Link>
  );
}
