import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { BedDouble, MapPin, Star, BadgeCheck, Heart, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { formatKES, type PropertyRow } from "@/lib/properties";

interface Props {
  property: PropertyRow;
  averageRating?: number;
  reviewsCount?: number;
  userId?: string;
}

export function PropertyCard({ property, averageRating, reviewsCount, userId }: Props) {
  const cover = property.images[0] || "/placeholder.svg";
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: isSaved = false } = useQuery({
    queryKey: ["saved", property.id, userId],
    enabled: !!userId,
    queryFn: async () => {
      if (!userId) throw new Error("A user ID is required to check saved homes.");
      const { data, error } = await supabase
        .from("saved_properties")
        .select("property_id")
        .eq("user_id", userId)
        .eq("property_id", property.id)
        .maybeSingle();
      if (error) throw error;
      return !!data;
    },
  });

  const toggleSave = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (!userId) {
      toast.info("Sign in to save homes");
      return;
    }

    const { error } = isSaved
      ? await supabase
          .from("saved_properties")
          .delete()
          .eq("user_id", userId)
          .eq("property_id", property.id)
      : await supabase
          .from("saved_properties")
          .insert({ user_id: userId, property_id: property.id });
    if (error) {
      toast.error(error.message);
      return;
    }

    queryClient.setQueryData(["saved", property.id, userId], !isSaved);
    queryClient.invalidateQueries({ queryKey: ["saved", userId] });
    toast.success(isSaved ? "Removed from saved homes" : "Home saved");
  };

  return (
    <article className="group flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-card transition hover:-translate-y-0.5 hover:shadow-elevated">
      <div className="relative aspect-[4/3] shrink-0 overflow-hidden bg-muted">
        <Link
          to="/property/$id"
          params={{ id: property.id }}
          aria-label={`View ${property.title}`}
          className="absolute inset-0 z-0 block"
        >
          <img
            src={cover}
            alt={property.title}
            loading="lazy"
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        </Link>
        <div className="pointer-events-none absolute inset-x-2 top-2 flex flex-wrap gap-1 sm:left-3 sm:right-3 sm:top-3 sm:gap-1.5">
          <span className="max-w-full truncate rounded-full bg-background/95 px-1.5 py-1 text-[clamp(0.55rem,2.2vw,0.6875rem)] font-semibold text-foreground shadow-soft sm:px-2.5">
            {property.property_type}
          </span>
          <span className="max-w-full truncate rounded-full bg-success px-1.5 py-1 text-[clamp(0.55rem,2.2vw,0.6875rem)] font-semibold text-success-foreground shadow-soft sm:px-2.5">
            Available
          </span>
          {property.is_featured && (
            <span className="inline-flex max-w-full items-center gap-1 truncate rounded-full bg-primary px-1.5 py-1 text-[clamp(0.55rem,2.2vw,0.6875rem)] font-semibold text-primary-foreground shadow-soft sm:px-2.5">
              <BadgeCheck className="h-3 w-3 shrink-0" /> <span className="truncate">Featured</span>
            </span>
          )}
        </div>
        <button
          type="button"
          aria-label="Chat with landlord about this home"
          title="Chat with landlord"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            navigate({ to: "/chat", search: { property: property.id } });
          }}
          className="absolute bottom-2 left-2 z-10 grid h-8 w-8 place-items-center rounded-full bg-primary text-primary-foreground shadow-soft transition hover:scale-105 sm:bottom-3 sm:left-3 sm:h-9 sm:w-9"
        >
          <MessageCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        </button>
        <Button
          type="button"
          size="icon"
          variant="secondary"
          aria-label={isSaved ? "Remove from saved homes" : "Save home"}
          title={isSaved ? "Remove from saved homes" : "Save home"}
          onClick={toggleSave}
          className="absolute bottom-2 right-2 z-10 h-8 w-8 rounded-full bg-background text-foreground shadow-soft hover:bg-background/90 sm:bottom-3 sm:right-3 sm:h-9 sm:w-9"
        >
          <Heart className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${isSaved ? "fill-destructive text-destructive" : ""}`} />
        </Button>
      </div>
      <div className="flex flex-1 flex-col p-2.5 sm:p-4">
        <Link to="/property/$id" params={{ id: property.id }} className="block min-w-0">
          <h3 className="line-clamp-1 font-display text-[clamp(0.75rem,3vw,1rem)] font-semibold">
            {property.title}
          </h3>
          <div className="mt-1 flex min-w-0 items-center gap-1 text-[clamp(0.625rem,2.5vw,0.75rem)] text-muted-foreground">
            <MapPin className="h-3 w-3 shrink-0 sm:h-3.5 sm:w-3.5" />
            <span className="truncate">{property.town}, {property.county}</span>
          </div>
        </Link>
        <div className="mt-2 flex flex-wrap items-baseline gap-x-2 gap-y-0.5 sm:mt-3 sm:gap-x-3 sm:gap-y-1">
          <span className="font-display text-[clamp(0.7rem,3vw,1rem)] font-bold text-primary">
            {formatKES(property.price_kes)}<span className="ml-0.5 text-[clamp(0.55rem,2vw,0.625rem)] font-medium text-muted-foreground">/mo</span>
          </span>
          {property.deposit_kes != null && (
            <span className="text-[clamp(0.6rem,2.3vw,0.75rem)] font-medium text-muted-foreground">
              Deposit {formatKES(property.deposit_kes)}
            </span>
          )}
        </div>
        <div className="mt-auto flex min-w-0 items-center justify-between gap-1 border-t border-border pt-2 text-[clamp(0.6rem,2.3vw,0.75rem)] text-muted-foreground sm:pt-3">
          <span className="inline-flex min-w-0 items-center gap-1">
            <BedDouble className="h-3 w-3 shrink-0 sm:h-3.5 sm:w-3.5" />
            {property.bedrooms || "Studio"}
          </span>
          {typeof averageRating === "number" && reviewsCount ? (
            <span className="inline-flex min-w-0 items-center gap-1 font-semibold text-foreground">
              <Star className="h-3 w-3 shrink-0 fill-accent text-accent sm:h-3.5 sm:w-3.5" />
              {averageRating.toFixed(1)}
              <span className="text-muted-foreground">({reviewsCount})</span>
            </span>
          ) : (
            <span className="truncate text-right text-muted-foreground/70">No reviews yet</span>
          )}
        </div>
      </div>
    </article>
  );
}
