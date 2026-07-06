import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { toast } from "sonner";
import { Heart, Trash2, MapPin, BedDouble, Bath, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/use-auth";
import { formatKES, type PropertyRow } from "@/lib/properties";

export const Route = createFileRoute("/wishlist")({
  head: () => ({ meta: [{ title: "Wishlist — Kejani Homes" }] }),
  component: WishlistPage,
});

function WishlistPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  const { data: saved = [], isLoading } = useQuery({
    queryKey: ["wishlist", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<PropertyRow[]> => {
      const { data, error } = await supabase
        .from("saved_properties")
        .select("properties(*)")
        .eq("user_id", user!.id);
      if (error) throw error;
      return (data ?? [])
        .map((r) => (r as { properties: PropertyRow | null }).properties)
        .filter((p): p is PropertyRow => !!p);
    },
  });

  const remove = async (id: string) => {
    if (!user) return;
    const { error } = await supabase
      .from("saved_properties")
      .delete()
      .eq("user_id", user.id)
      .eq("property_id", id);
    if (error) return toast.error(error.message);
    toast.success("Removed from wishlist");
    qc.invalidateQueries({ queryKey: ["wishlist", user.id] });
    qc.invalidateQueries({ queryKey: ["saved", user.id] });
  };

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="container-page flex-1 py-10">
        <div className="flex items-center gap-3">
          <Heart className="h-6 w-6 text-primary" />
          <h1 className="font-display text-3xl font-bold tracking-tight">Your wishlist</h1>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">Homes you've saved for later.</p>

        {!user || isLoading ? (
          <p className="mt-16 text-center text-sm text-muted-foreground">Loading…</p>
        ) : saved.length === 0 ? (
          <div className="mt-12 rounded-2xl border border-dashed border-border bg-card p-12 text-center">
            <Heart className="mx-auto h-10 w-10 text-muted-foreground/60" />
            <h3 className="mt-3 font-display text-lg font-semibold">Nothing saved yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Tap the heart on any home to save it here for easy comparison later.
            </p>
            <Button asChild className="mt-5">
              <Link to="/browse">Browse available homes</Link>
            </Button>
          </div>
        ) : (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {saved.map((p) => (
              <article key={p.id} className="overflow-hidden rounded-2xl border border-border bg-card shadow-card transition hover:-translate-y-0.5 hover:shadow-elevated">
                <Link to="/property/$id" params={{ id: p.id }} className="block">
                  <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                    <img src={p.images[0] ?? "/placeholder.svg"} alt={p.title} loading="lazy" className="h-full w-full object-cover transition duration-500 hover:scale-105" />
                    <span className="absolute left-3 top-3 rounded-full bg-success px-2.5 py-1 text-[11px] font-semibold text-success-foreground shadow-soft">
                      <Star className="mr-1 inline h-3 w-3 fill-current" /> Available
                    </span>
                    <div className="absolute bottom-3 left-3 rounded-xl bg-foreground/85 px-3 py-1.5 text-sm font-bold text-background backdrop-blur">
                      {formatKES(p.price_kes)}<span className="ml-1 text-[10px] font-medium text-background/70">/mo</span>
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="line-clamp-1 font-display font-semibold">{p.title}</h3>
                    <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5" />
                      {p.town}, {p.county}
                    </div>
                    <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1"><BedDouble className="h-3.5 w-3.5" />{p.bedrooms || "Studio"}</span>
                      <span className="inline-flex items-center gap-1"><Bath className="h-3.5 w-3.5" />{p.bathrooms}</span>
                    </div>
                  </div>
                </Link>
                <div className="flex gap-2 border-t border-border p-3">
                  <Button asChild variant="outline" size="sm" className="flex-1">
                    <Link to="/property/$id" params={{ id: p.id }}>View details</Link>
                  </Button>
                  <Button onClick={() => remove(p.id)} variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                    <Trash2 className="mr-1.5 h-4 w-4" /> Remove
                  </Button>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
