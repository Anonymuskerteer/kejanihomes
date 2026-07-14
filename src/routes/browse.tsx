import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { MapPin, SlidersHorizontal, X, LayoutGrid, Map as MapIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from "@/components/ui/sheet";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { PropertyCard } from "@/components/property-card";
import { PropertyMap } from "@/components/property-map";
import { TenantShell } from "@/components/tenant-shell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/use-auth";
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
  const { user, role } = useAuth();
  const isTenant = !!user && role !== "landlord" && role !== "admin";

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
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    setQ(params.q ?? "");
  }, [params.q]);

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

  const activeFilters =
    (county !== "all" && county !== "Kirinyaga" ? 1 : 0) +
    (type !== "all" ? 1 : 0) +
    (beds > 0 ? 1 : 0) +
    (price[0] > 0 || price[1] < 200000 ? 1 : 0);

  const filterSheet = (
    <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="lg" className="relative h-11 gap-2 px-3 md:px-4">
          <SlidersHorizontal className="h-4 w-4" />
          <span className="hidden sm:inline">Filters</span>
          {activeFilters > 0 && (
            <span className="grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
              {activeFilters}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Filter homes</SheetTitle>
        </SheetHeader>
        <div className="mt-6 space-y-5">
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
                <button
                  key={n}
                  type="button"
                  onClick={() => setBeds(n)}
                  className={`flex-1 rounded-lg border px-2 py-2 text-xs font-medium transition ${
                    beds === n ? "border-primary bg-primary-soft text-primary" : "border-border hover:bg-secondary"
                  }`}
                >
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
          <div className="space-y-1.5">
            <Label>Sort by</Label>
            <Select value={sort} onValueChange={(v) => setSort(v as typeof sort)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest first</SelectItem>
                <SelectItem value="lowest">Lowest price</SelectItem>
                <SelectItem value="highest">Highest price</SelectItem>
                <SelectItem value="rated">Highest rated</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="rounded-xl bg-primary-soft p-3 text-xs">
            <MapPin className="mb-1 inline h-3.5 w-3.5 text-primary" /> Default focus: <strong>Mwea & Kirinyaga</strong>. Switch county to broaden.
          </div>
        </div>
        <SheetFooter className="mt-6 flex-row gap-2">
          <Button variant="outline" onClick={reset} className="flex-1">
            <X className="mr-1.5 h-4 w-4" /> Reset
          </Button>
          <Button onClick={() => setFiltersOpen(false)} className="flex-1">
            Show {filtered.length} home{filtered.length === 1 ? "" : "s"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );

  const heading = (
    <div className="flex flex-wrap items-baseline justify-between gap-4">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight md:text-3xl">
          {county === "all"
            ? "All rentals"
            : county === "Kirinyaga"
              ? "Rentals in Mwea & Kirinyaga"
              : `Rentals in ${county}`}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {isLoading ? "Loading…" : `${filtered.length} home${filtered.length === 1 ? "" : "s"} available`}
        </p>
      </div>
      <div className="flex items-center gap-2">
        {filterSheet}
        <div className="hidden rounded-xl border border-border bg-card p-1 md:inline-flex">
          <button
            onClick={() => setView("grid")}
            className={`grid h-9 w-9 place-items-center rounded-lg transition ${view === "grid" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
            aria-label="Grid view"
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button
            onClick={() => setView("map")}
            className={`grid h-9 w-9 place-items-center rounded-lg transition ${view === "map" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
            aria-label="Map view"
          >
            <MapIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );

  const results = view === "map" ? (
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
  ) : isTenant ? (
    <BentoGrid properties={filtered} ratingMap={ratingMap} />
  ) : (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {filtered.map((p) => (
        <PropertyCard
          key={p.id}
          property={p}
          averageRating={ratingMap[p.id]?.avg}
          reviewsCount={ratingMap[p.id]?.count}
        />
      ))}
    </div>
  );

  const body = (
    <div className="container-page py-6">
      {heading}
      <section className="mt-6">
        {results}
        {properties.length === 0 && !isLoading && (
          <div className="mt-6 rounded-2xl bg-primary-soft p-6 text-center text-sm">
            No properties have been published yet. <Link to="/auth" search={{ mode: "signup", role: "landlord" }} className="font-semibold text-primary underline">Be the first landlord →</Link>
          </div>
        )}
      </section>
    </div>
  );

  if (isTenant) {
    return (
      <TenantShell
        search={{
          value: q,
          onChange: setQ,
          placeholder: "Search listings",
          onSubmit: () => navigate({ search: (s: z.infer<typeof browseSearch>) => ({ ...s, q: q || undefined }) }),
        }}
      >
        {body}
      </TenantShell>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">{body}</main>
      <SiteFooter />
    </div>
  );
}

function BentoGrid({
  properties,
  ratingMap,
}: {
  properties: PropertyRow[];
  ratingMap: Record<string, { avg: number; count: number }>;
}) {
  return (
    <div className="grid auto-rows-[220px] grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
      {properties.map((p, i) => {
        // Bento pattern: every 7th tile is a large hero (2x2 on desktop)
        const large = i % 7 === 0;
        const wide = i % 5 === 3;
        const cls = large
          ? "col-span-2 row-span-2"
          : wide
            ? "col-span-2 row-span-1"
            : "col-span-1 row-span-1";
        return (
          <div key={p.id} className={cls}>
            <BentoTile
              property={p}
              rating={ratingMap[p.id]}
              variant={large ? "large" : wide ? "wide" : "small"}
            />
          </div>
        );
      })}
    </div>
  );
}

function BentoTile({
  property: p,
  rating,
  variant,
}: {
  property: PropertyRow;
  rating?: { avg: number; count: number };
  variant: "large" | "wide" | "small";
}) {
  const cover = p.images[0] || "/placeholder.svg";
  return (
    <Link
      to="/property/$id"
      params={{ id: p.id }}
      className="group relative block h-full w-full overflow-hidden rounded-2xl border border-border bg-card shadow-card transition hover:-translate-y-0.5 hover:shadow-elevated"
    >
      <img
        src={cover}
        alt={p.title}
        loading="lazy"
        className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-foreground/85 via-foreground/20 to-transparent" />
      <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
        <span className="rounded-full bg-background/95 px-2 py-0.5 text-[10px] font-semibold text-foreground shadow-soft">
          {p.property_type}
        </span>
        {rating?.count ? (
          <span className="rounded-full bg-accent/95 px-2 py-0.5 text-[10px] font-bold text-accent-foreground shadow-soft">
            ★ {rating.avg.toFixed(1)}
          </span>
        ) : null}
      </div>
      <div className="absolute inset-x-3 bottom-3 text-background">
        <h3 className={`line-clamp-2 font-display font-bold ${variant === "large" ? "text-lg md:text-xl" : "text-sm"}`}>
          {p.title}
        </h3>
        <div className={`mt-1 flex items-center justify-between gap-2 ${variant === "small" ? "text-[11px]" : "text-xs"}`}>
          <span className="line-clamp-1 opacity-90">{p.town}, {p.county}</span>
          <span className="rounded-md bg-primary px-2 py-0.5 font-bold text-primary-foreground">
            KES {p.price_kes.toLocaleString()}
          </span>
        </div>
      </div>
    </Link>
  );
}
