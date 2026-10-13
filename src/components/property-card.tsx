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
        <div className="pointer-events-none absolute left-3 top-3 flex flex-wrap gap-1.5">
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
        <button
          type="button"
          aria-label="Chat with landlord about this home"
          title="Chat with landlord"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            navigate({ to: "/chat", search: { property: property.id } });
          }}
          className="absolute bottom-3 left-3 z-10 grid h-9 w-9 place-items-center rounded-full bg-primary text-primary-foreground shadow-soft transition hover:scale-105"
        >
          <MessageCircle className="h-4 w-4" />
        </button>
        <Button
          type="button"
          size="icon"
          variant="secondary"
          aria-label={isSaved ? "Remove from saved homes" : "Save home"}
          title={isSaved ? "Remove from saved homes" : "Save home"}
          onClick={toggleSave}
          className="absolute bottom-3 right-3 z-10 h-9 w-9 rounded-full bg-background text-foreground shadow-soft hover:bg-background/90"
        >
          <Heart className={`h-4 w-4 ${isSaved ? "fill-destructive text-destructive" : ""}`} />
        </Button>
      </div>
      <div className="flex flex-1 flex-col p-3 sm:p-4">
        <Link to="/property/$id" params={{ id: property.id }} className="block min-w-0">
          <h3 className="line-clamp-1 font-display text-sm font-semibold sm:text-base">
            {property.title}
          </h3>
          <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{property.town}, {property.county}</span>
          </div>
        </Link>
        <div className="mt-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span className="font-display text-sm font-bold text-primary sm:text-base">
            {formatKES(property.price_kes)}<span className="ml-1 text-[10px] font-medium text-muted-foreground">/mo</span>
          </span>
          {property.deposit_kes != null && (
            <span className="text-xs font-medium text-muted-foreground">
              Deposit {formatKES(property.deposit_kes)}
            </span>
          )}
        </div>
        <div className="mt-auto flex items-center justify-between border-t border-border pt-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <BedDouble className="h-3.5 w-3.5" />
            {property.bedrooms || "Studio"}
          </span>
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
    </article>
  );
}
