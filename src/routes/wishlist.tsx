import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Heart, Trash2, MapPin, BedDouble, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TenantShell } from "@/components/tenant-shell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/use-auth";
import { formatKES, type PropertyRow } from "@/lib/properties";

export const Route = createFileRoute("/wishlist")({
  head: () => ({ meta: [{ title: "Saved homes — Kejani Homes" }] }),
  component: WishlistPage,
});

function WishlistPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [q, setQ] = useState("");

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

  const propIds = saved.map((p) => p.id);
  const { data: ratingMap = {} } = useQuery({
    queryKey: ["wishlist-ratings", propIds.join(",")],
    enabled: propIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reviews")
        .select("property_id, rating")
        .in("property_id", propIds);
      if (error) throw error;
      const acc: Record<string, { total: number; count: number }> = {};
      for (const r of data ?? []) {
        const k = (r as { property_id: string }).property_id;
        const rating = (r as { rating: number }).rating;
        acc[k] ??= { total: 0, count: 0 };
        acc[k].total += rating;
        acc[k].count += 1;
      }
      const out: Record<string, { avg: number; count: number }> = {};
      for (const k in acc) out[k] = { avg: acc[k].total / acc[k].count, count: acc[k].count };
      return out;
    },
  });

  const filtered = useMemo(() => {
    const ql = q.toLowerCase().trim();
    if (!ql) return saved;
    return saved.filter((p) =>
      `${p.title} ${p.town} ${p.county} ${p.address ?? ""}`.toLowerCase().includes(ql),
    );
  }, [saved, q]);

  const remove = async (id: string) => {
    if (!user) return;
    const { error } = await supabase
      .from("saved_properties")
      .delete()
      .eq("user_id", user.id)
      .eq("property_id", id);
    if (error) return toast.error(error.message);
    toast.success("Removed from saved");
    qc.invalidateQueries({ queryKey: ["wishlist", user.id] });
    qc.invalidateQueries({ queryKey: ["saved", user.id] });
  };

  return (
    <TenantShell
      search={{
        value: q,
        onChange: setQ,
        placeholder: "Search saved properties",
      }}
    >
      <div className="container-page py-6">
        <header className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary-soft text-primary">
            <Heart className="h-5 w-5" />
          </span>
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight md:text-3xl">Saved homes</h1>
            <p className="text-sm text-muted-foreground">
              {isLoading
                ? "Loading…"
                : `${filtered.length} of ${saved.length} home${saved.length === 1 ? "" : "s"} saved`}
            </p>
          </div>
        </header>

        {!user || isLoading ? (
          <p className="mt-16 text-center text-sm text-muted-foreground">Loading…</p>
        ) : saved.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-dashed border-border bg-card p-12 text-center">
            <Heart className="mx-auto h-10 w-10 text-muted-foreground/60" />
            <h3 className="mt-3 font-display text-lg font-semibold">Nothing saved yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Tap the heart on any home to save it for later.
            </p>
            <Button asChild className="mt-5">
              <Link to="/browse">Browse available homes</Link>
            </Button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">
            No saved homes match "{q}".
          </div>
        ) : (
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((p) => {
              const r = ratingMap[p.id];
              return (
                <article key={p.id} className="overflow-hidden rounded-2xl border border-border bg-card shadow-card transition hover:-translate-y-0.5 hover:shadow-elevated">
                  <Link to="/property/$id" params={{ id: p.id }} className="block">
                    <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                      <img src={p.images[0] ?? "/placeholder.svg"} alt={p.title} loading="lazy" className="h-full w-full object-cover transition duration-500 hover:scale-105" />
                      <span className="absolute left-3 top-3 rounded-full bg-success px-2.5 py-1 text-[11px] font-semibold text-success-foreground shadow-soft">
                        Available
                      </span>
                      {r?.count ? (
                        <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-accent px-2.5 py-1 text-[11px] font-bold text-accent-foreground shadow-soft">
                          <Star className="h-3 w-3 fill-current" /> {r.avg.toFixed(1)} ({r.count})
                        </span>
                      ) : null}
                      <div className="absolute bottom-3 left-3 flex max-w-[calc(100%-3.5rem)] flex-wrap items-center gap-1.5">
                        <span className="rounded-xl bg-foreground/85 px-3 py-1.5 text-sm font-bold text-background backdrop-blur">
                          {formatKES(p.price_kes)}<span className="ml-1 text-[10px] font-medium text-background/70">/mo</span>
                        </span>
                        {p.deposit_kes != null && (
                          <span className="rounded-xl bg-background/90 px-2.5 py-1.5 text-[10px] font-semibold text-foreground backdrop-blur">
                            Deposit {formatKES(p.deposit_kes)}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="line-clamp-1 font-display font-semibold">{p.title}</h3>
                      <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5" />
                        {p.town}, {p.county}
                      </div>
                      <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                        <div className="flex items-center gap-3">
                          <span className="inline-flex items-center gap-1"><BedDouble className="h-3.5 w-3.5" />{p.bedrooms || "Studio"}</span>
                        </div>
                        {!r?.count && <span className="text-muted-foreground/70">No reviews yet</span>}
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
              );
            })}
          </div>
        )}
      </div>
    </TenantShell>
  );
}
