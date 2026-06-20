import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { Heart } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { PropertyCard } from "@/components/property-card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/use-auth";
import type { PropertyRow } from "@/lib/properties";

export const Route = createFileRoute("/saved")({
  head: () => ({ meta: [{ title: "Saved homes — Kejani Homes" }] }),
  component: SavedPage,
});

function SavedPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  const { data: saved = [], isLoading } = useQuery({
    queryKey: ["saved", user?.id],
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

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="container-page flex-1 py-10">
        <div className="flex items-center gap-3">
          <Heart className="h-6 w-6 text-primary" />
          <h1 className="font-display text-3xl font-bold tracking-tight">Saved homes</h1>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">Your shortlist for future viewings.</p>

        {!user || isLoading ? (
          <p className="mt-10 text-center text-sm text-muted-foreground">Loading…</p>
        ) : saved.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-dashed border-border bg-card p-10 text-center">
            <p className="text-sm text-muted-foreground">You haven't saved any homes yet.</p>
            <Link to="/browse" className="mt-3 inline-block text-sm font-semibold text-primary underline">Browse homes →</Link>
          </div>
        ) : (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {saved.map((p) => <PropertyCard key={p.id} property={p} />)}
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
