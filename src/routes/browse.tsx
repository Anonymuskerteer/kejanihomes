import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { Search, MapPin, SlidersHorizontal, X } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { PropertyCard } from "@/components/property-card";
import { PropertyMap } from "@/components/property-map";
import { supabase } from "@/integrations/supabase/client";
import {
  COUNTIES,
  PROPERTY_TYPES,
  DEFAULT_MAP_CENTER,
  type PropertyRow,
} from "@/lib/properties";

const browseSearch = z.object({
  q: z.string().optional(),
  county: z.string().optional(),
  type: z.string().optional(),
  beds: z.coerce.number().optional(),
  min: z.coerce.number().optional(),
  max: z.coerce.number().optional(),
  view: z.enum(["grid", "map"]).optional(),
  sort: z.enum(["newest", "lowest", "highest", "rated"]).optional(),
});

export const Route = createFileRoute("/browse")({
  validateSearch: browseSearch,
  head: () => ({ meta: [{ title: "Browse rentals — Kejani Homes" }] }),
  component: BrowsePage,
});

function BrowsePage() {
  const params = useSearch({ from: "/browse" });
  const navigate = useNavigate({ from: "/browse" });

  // Default to Mwea / Kirinyaga focus
  const [q, setQ] = useState(params.q ?? "");
  const [county, setCounty] = useState<string>(params.county ?? "Kirinyaga");
  const [type, setType] = useState<string>(params.type ?? "all");
  const [beds, setBeds] = useState<number>(params.beds ?? 0);
  const [price, setPrice] = useState<[number, number]>([
    params.min ?? 0,
    params.max ?? 200000,
  ]);
  const [view, setView] = useState<"grid" | "map">(params.view ?? "grid");
  const [sort, setSort] = useState<"newest" | "lowest" | "highest" | "rated">(params.sort ?? "newest");

  const { data: properties = [], isLoading } = useQuery({
    queryKey: ["properties", "browse"],
    queryFn: async (): Promise<PropertyRow[]> => {
      const { data, error } = await supabase
        .from("properties")
        .select("*")
        .eq("status", "approved")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: ratingMap = {} } = useQuery({
    queryKey: ["ratings-map"],
    queryFn: async () => {
      const { data, error } = await supabase.from("reviews").select("property_id, rating");
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
    const arr = properties.filter((p) => {
      if (county !== "all" && p.county !== county) return false;
      if (type !== "all" && p.property_type !== type) return false;
      if (beds > 0 && p.bedrooms < beds) return false;
      if (p.price_kes < price[0] || p.price_kes > price[1]) return false;
      if (ql) {
        const hay = `${p.title} ${p.town} ${p.county} ${p.address ?? ""}`.toLowerCase();
        if (!hay.includes(ql)) return false;
      }
      return true;
    });
    const sorted = [...arr];
    if (sort === "lowest") sorted.sort((a, b) => a.price_kes - b.price_kes);
    else if (sort === "highest") sorted.sort((a, b) => b.price_kes - a.price_kes);
    else if (sort === "rated") sorted.sort((a, b) => (ratingMap[b.id]?.avg ?? 0) - (ratingMap[a.id]?.avg ?? 0));
    else sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return sorted;
  }, [properties, q, county, type, beds, price, sort, ratingMap]);

  const markers = filtered
    .filter((p) => p.latitude != null && p.longitude != null)
    .map((p) => ({
      id: p.id,
      lat: p.latitude as number,
      lng: p.longitude as number,
      title: p.title,
      href: `/property/${p.id}`,
    }));

  const reset = () => {
    setQ("");
    setCounty("Kirinyaga");
    setType("all");
    setBeds(0);
    setPrice([0, 200000]);
    navigate({ search: {} });
  };

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="container-page flex-1 py-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight md:text-3xl">Browse rentals</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {isLoading ? "Loading…" : `${filtered.length} home${filtered.length === 1 ? "" : "s"} matching your search`}
            </p>
          </div>
          <div className="inline-flex rounded-xl border border-border bg-card p-1 text-sm">
            <button onClick={() => setView("grid")} className={`rounded-lg px-3 py-1.5 ${view === "grid" ? "bg-primary text-primary-foreground" : ""}`}>Grid</button>
            <button onClick={() => setView("map")} className={`rounded-lg px-3 py-1.5 ${view === "map" ? "bg-primary text-primary-foreground" : ""}`}>Map</button>
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[280px_1fr]">
          <aside className="space-y-5 rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center justify-between">
              <div className="inline-flex items-center gap-2 text-sm font-semibold">
                <SlidersHorizontal className="h-4 w-4" /> Filters
              </div>
              <button onClick={reset} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                <X className="h-3 w-3" /> Reset
              </button>
            </div>
            <div className="space-y-1.5">
              <Label>Search</Label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Town, estate…" className="pl-9" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>County</Label>
              <Select value={county} onValueChange={setCounty}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All counties</SelectItem>
                  {COUNTIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Property type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any type</SelectItem>
                  {PROPERTY_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Minimum bedrooms</Label>
              <div className="flex gap-1">
                {[0, 1, 2, 3, 4].map((n) => (
                  <button key={n} onClick={() => setBeds(n)} className={`flex-1 rounded-lg border px-2 py-1.5 text-xs font-medium ${beds === n ? "border-primary bg-primary-soft text-primary" : "border-border"}`}>
                    {n === 0 ? "Any" : `${n}+`}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label className="flex items-center justify-between">
                Price (KES/mo)
                <span className="text-xs font-normal text-muted-foreground">
                  {price[0].toLocaleString()} – {price[1].toLocaleString()}
                </span>
              </Label>
              <Slider
                value={price}
                onValueChange={(v) => setPrice([v[0], v[1]] as [number, number])}
                min={0}
                max={300000}
                step={1000}
              />
            </div>
            <div className="rounded-xl bg-primary-soft p-3 text-xs">
              <MapPin className="mb-1 inline h-3.5 w-3.5 text-primary" /> Default focus: <strong>Mwea & Kirinyaga</strong>. Switch the county to broaden.
            </div>
          </aside>

          <section>
            {view === "map" ? (
              <PropertyMap
                center={
                  filtered[0]?.latitude && filtered[0]?.longitude
                    ? [filtered[0].latitude, filtered[0].longitude]
                    : DEFAULT_MAP_CENTER
                }
                zoom={markers.length ? 11 : 10}
                markers={markers}
                height={620}
              />
            ) : filtered.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center">
                <h3 className="font-display text-lg font-semibold">No homes match</h3>
                <p className="mt-1 text-sm text-muted-foreground">Try widening your filters or browsing all counties.</p>
                <Button onClick={reset} className="mt-4">Reset filters</Button>
              </div>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {filtered.map((p) => <PropertyCard key={p.id} property={p} />)}
              </div>
            )}
            {properties.length === 0 && !isLoading && (
              <div className="mt-6 rounded-2xl bg-primary-soft p-6 text-center text-sm">
                No properties have been published yet. <Link to="/auth" search={{ mode: "signup", role: "landlord" }} className="font-semibold text-primary underline">Be the first landlord →</Link>
              </div>
            )}
          </section>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
