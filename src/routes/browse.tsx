import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Filter, MapPin, Search, X } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { PropertyCard } from "@/components/property-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { COUNTIES, PROPERTIES, PROPERTY_TYPES, type PropertyType } from "@/lib/properties";

export const Route = createFileRoute("/browse")({
  head: () => ({
    meta: [
      { title: "Browse properties — Kejani Homes" },
      { name: "description", content: "Search and filter verified rental properties across Kenya by county, estate, price and amenities." },
    ],
  }),
  component: BrowsePage,
});

function BrowsePage() {
  const [q, setQ] = useState("");
  const [county, setCounty] = useState<string>("all");
  const [type, setType] = useState<string>("all");
  const [beds, setBeds] = useState<string>("any");
  const [price, setPrice] = useState<[number, number]>([0, 250000]);
  const [furnishedOnly, setFurnishedOnly] = useState(false);
  const [sort, setSort] = useState("recent");
  const [showFilters, setShowFilters] = useState(false);

  const filtered = useMemo(() => {
    let list = PROPERTIES.filter((p) => {
      if (q && !`${p.title} ${p.estate} ${p.town}`.toLowerCase().includes(q.toLowerCase())) return false;
      if (county !== "all" && p.county !== county) return false;
      if (type !== "all" && p.type !== type) return false;
      if (beds !== "any") {
        const n = Number(beds);
        if (n === 4 ? p.bedrooms < 4 : p.bedrooms !== n) return false;
      }
      if (p.rent < price[0] || p.rent > price[1]) return false;
      if (furnishedOnly && !p.furnished) return false;
      return true;
    });
    if (sort === "low") list = [...list].sort((a, b) => a.rent - b.rent);
    else if (sort === "high") list = [...list].sort((a, b) => b.rent - a.rent);
    else if (sort === "rating") list = [...list].sort((a, b) => b.rating - a.rating);
    else list = [...list].sort((a, b) => b.postedAt.localeCompare(a.postedAt));
    return list;
  }, [q, county, type, beds, price, furnishedOnly, sort]);

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <section className="border-b border-border bg-secondary/40">
          <div className="container-page py-6">
            <h1 className="font-display text-2xl font-bold tracking-tight md:text-3xl">Browse properties</h1>
            <p className="mt-1 text-sm text-muted-foreground">{filtered.length} homes available across Kenya</p>

            <div className="mt-5 flex flex-col gap-2 md:flex-row md:items-center">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name, estate or town…" className="h-11 bg-background pl-10" />
              </div>
              <Select value={county} onValueChange={setCounty}>
                <SelectTrigger className="h-11 w-full bg-background md:w-44"><MapPin className="mr-1.5 h-4 w-4 text-primary" /><SelectValue placeholder="County" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All counties</SelectItem>
                  {COUNTIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={sort} onValueChange={setSort}>
                <SelectTrigger className="h-11 w-full bg-background md:w-44"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="recent">Most recent</SelectItem>
                  <SelectItem value="low">Price: Low to high</SelectItem>
                  <SelectItem value="high">Price: High to low</SelectItem>
                  <SelectItem value="rating">Top rated</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" className="h-11 md:hidden" onClick={() => setShowFilters((v) => !v)}>
                <Filter className="mr-1.5 h-4 w-4" /> Filters
              </Button>
            </div>
          </div>
        </section>

        <section className="container-page mt-8 grid gap-8 lg:grid-cols-[280px_1fr]">
          <aside className={`${showFilters ? "block" : "hidden"} lg:block`}>
            <div className="sticky top-20 rounded-2xl border border-border bg-card p-5 shadow-card">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-base font-semibold">Filters</h3>
                <button onClick={() => { setType("all"); setBeds("any"); setPrice([0, 250000]); setFurnishedOnly(false); }} className="text-xs text-primary hover:underline">Reset</button>
              </div>

              <FilterGroup label="Property type">
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger className="h-10"><SelectValue placeholder="Any type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Any type</SelectItem>
                    {PROPERTY_TYPES.map((t) => <SelectItem key={t} value={t as PropertyType}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </FilterGroup>

              <FilterGroup label="Bedrooms">
                <div className="flex flex-wrap gap-2">
                  {[["any", "Any"], ["0", "Studio"], ["1", "1"], ["2", "2"], ["3", "3"], ["4", "4+"]].map(([v, l]) => (
                    <button
                      key={v}
                      onClick={() => setBeds(v)}
                      className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${beds === v ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-primary"}`}
                    >{l}</button>
                  ))}
                </div>
              </FilterGroup>

              <FilterGroup label={`Price range (KES ${price[0].toLocaleString()} – ${price[1].toLocaleString()})`}>
                <Slider min={0} max={250000} step={2500} value={price} onValueChange={(v) => setPrice([v[0], v[1]] as [number, number])} />
              </FilterGroup>

              <FilterGroup label="Other">
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox checked={furnishedOnly} onCheckedChange={(v) => setFurnishedOnly(Boolean(v))} />
                  Furnished only
                </label>
              </FilterGroup>

              <Button className="mt-2 w-full lg:hidden" onClick={() => setShowFilters(false)}>
                <X className="mr-1 h-4 w-4" /> Close filters
              </Button>
            </div>
          </aside>

          <div>
            {filtered.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border p-12 text-center">
                <p className="font-display text-lg font-semibold">No homes match your filters</p>
                <p className="mt-1 text-sm text-muted-foreground">Try widening your price range or removing filters.</p>
                <Button asChild variant="outline" className="mt-4"><Link to="/browse">Reset</Link></Button>
              </div>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {filtered.map((p) => <PropertyCard key={p.id} property={p} />)}
              </div>
            )}
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mt-5">
      <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</label>
      {children}
    </div>
  );
}
