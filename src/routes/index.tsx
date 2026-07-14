import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Search, MapPin, ShieldCheck, BadgeCheck, Sparkles, ArrowRight, Star, Home, KeyRound, MessagesSquare } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { PropertyCard } from "@/components/property-card";
import { supabase } from "@/integrations/supabase/client";
import type { PropertyRow } from "@/lib/properties";
import heroImg from "@/assets/hero-home.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Kejani Homes — Find your next home in Mwea & beyond" },
      { name: "description", content: "Kenya's friendliest property platform. Verified rentals in Mwea, Kirinyaga and all 47 counties — bedsitters, apartments, maisonettes and houses. Direct landlord contact." },
      { property: "og:title", content: "Kejani Homes — Mwea & nationwide rentals" },
      { property: "og:description", content: "Verified rentals across Kenya. Real photos. Real landlords. Honest reviews." },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const { data: featured = [] } = useQuery({
    queryKey: ["properties", "featured"],
    queryFn: async (): Promise<PropertyRow[]> => {
      const { data, error } = await supabase
        .from("properties")
        .select("*")
        .eq("status", "approved")
        .order("is_featured", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(6);
      if (error) throw error;
      return data ?? [];
    },
  });




  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <Hero />

        <section className="container-page mt-16 md:mt-24">
          <SectionHeader eyebrow="Featured this week" title="Handpicked homes you'll love" href="/browse" />
          {featured.length === 0 ? (
            <EmptyState text="No listings yet. Be the first landlord to publish on Kejani Homes." />
          ) : (
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {featured.map((p) => <PropertyCard key={p.id} property={p} />)}
            </div>
          )}
        </section>




        <HowItWorks />
        <FinalCTA />
      </main>
      <SiteFooter />
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="mt-8 rounded-2xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">
      {text}
    </div>
  );
}

function Hero() {
  const [q, setQ] = useState("");
  return (
    <section className="relative isolate overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <img src={heroImg} alt="" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/85 via-primary/70 to-foreground/60" />
      </div>
      <div className="container-page py-20 md:py-28 lg:py-36">
        <div className="max-w-2xl text-primary-foreground">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur">
            <Sparkles className="h-3.5 w-3.5 text-accent" /> Built in Mwea · serving all of Kenya
          </span>
          <h1 className="mt-5 font-display text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl md:text-6xl">
            Find a place that feels like <span className="text-accent">kejani</span>.
          </h1>
          <p className="mt-5 max-w-xl text-base text-white/90 md:text-lg">
            Bedsitters to maisonettes — verified listings with real photos, honest reviews and direct landlord contact.
          </p>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            const params = new URLSearchParams();
            if (q) params.set("q", q);
            window.location.href = `/browse?${params.toString()}`;
          }}
          className="mt-8 rounded-2xl bg-background/95 p-3 shadow-elevated backdrop-blur md:p-4"
        >
          <div className="flex flex-col gap-2 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search by town, estate or property name…"
                className="h-12 border-0 bg-secondary/60 pl-10 text-base focus-visible:ring-2 focus-visible:ring-primary"
              />
            </div>
            <div className="hidden h-8 w-px bg-border md:block" />
            <div className="flex items-center gap-2 px-2 text-sm text-muted-foreground md:px-0">
              <MapPin className="h-4 w-4 text-primary" /> Mwea & nationwide
            </div>
            <Button size="lg" type="submit" className="h-12 px-6 text-base shadow-soft">
              Search homes <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
          <div className="mt-3 flex flex-wrap gap-2 px-2 pb-1">
            {["Mwea", "Wanguru", "Bedsitter", "One Bedroom", "Two Bedroom", "Nairobi"].map((t) => (
              <Link key={t} to="/browse" search={{ q: t }} className="rounded-full border border-border bg-secondary/50 px-3 py-1 text-xs font-medium text-foreground/80 hover:border-primary hover:text-primary">
                {t}
              </Link>
            ))}
          </div>
        </form>

        <div className="mt-10 grid max-w-2xl grid-cols-3 gap-6 text-primary-foreground">
          <Stat n="47" label="Counties covered" />
          <Stat n="100%" label="Verified landlords" />
          <Stat n="0 KES" label="To list your home" />
        </div>
      </div>
    </section>
  );
}

function Stat({ n, label }: { n: string; label: string }) {
  return (
    <div>
      <div className="font-display text-2xl font-bold md:text-3xl">{n}</div>
      <div className="text-xs uppercase tracking-wider text-white/80">{label}</div>
    </div>
  );
}

function SectionHeader({ eyebrow, title, subtitle, href }: { eyebrow?: string; title: string; subtitle?: string; href?: string }) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div>
        {eyebrow && <div className="text-xs font-semibold uppercase tracking-wider text-primary">{eyebrow}</div>}
        <h2 className="mt-1 font-display text-2xl font-bold tracking-tight md:text-3xl">{title}</h2>
        {subtitle && <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {href && (
        <Link to={href} className="hidden items-center gap-1 text-sm font-semibold text-primary hover:underline sm:inline-flex">
          See all <ArrowRight className="h-4 w-4" />
        </Link>
      )}
    </div>
  );
}

function HowItWorks() {
  const steps = [
    { icon: Search, title: "Search & filter", body: "Browse verified homes. Filter by county, town, price, type and amenities." },
    { icon: Home, title: "Visit & decide", body: "Save favourites, view on the map and visit the ones you love." },
    { icon: KeyRound, title: "Contact & move in", body: "Sign in to reveal landlord contacts. Negotiate directly — no middlemen." },
  ];
  return (
    <section className="container-page mt-24">
      <div className="rounded-3xl bg-primary-soft p-8 md:p-12">
        <div className="max-w-2xl">
          <div className="text-xs font-semibold uppercase tracking-wider text-primary">How it works</div>
          <h2 className="mt-1 font-display text-2xl font-bold tracking-tight md:text-3xl">Your next home in three simple steps</h2>
        </div>
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {steps.map((s, i) => (
            <div key={s.title} className="rounded-2xl bg-background p-6 shadow-card">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary text-primary-foreground"><s.icon className="h-5 w-5" /></span>
                <span className="text-xs font-semibold text-muted-foreground">Step {i + 1}</span>
              </div>
              <h3 className="mt-4 font-display text-lg font-semibold">{s.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{s.body}</p>
            </div>
          ))}
        </div>
        <div className="mt-8 flex flex-wrap items-center gap-4 text-sm">
          <span className="inline-flex items-center gap-2 rounded-full bg-background px-3 py-1.5 font-medium"><ShieldCheck className="h-4 w-4 text-primary" /> Listing approval</span>
          <span className="inline-flex items-center gap-2 rounded-full bg-background px-3 py-1.5 font-medium"><BadgeCheck className="h-4 w-4 text-primary" /> Verified landlords</span>
          <span className="inline-flex items-center gap-2 rounded-full bg-background px-3 py-1.5 font-medium"><MessagesSquare className="h-4 w-4 text-primary" /> Direct chat</span>
        </div>
      </div>
    </section>
  );
}

function FinalCTA() {
  return (
    <section className="container-page mt-24 mb-16">
      <div className="relative overflow-hidden rounded-3xl bg-foreground p-10 text-background md:p-14">
        <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-primary/40 blur-3xl" />
        <div className="absolute -bottom-24 -left-10 h-64 w-64 rounded-full bg-accent/30 blur-3xl" />
        <div className="relative grid items-center gap-6 md:grid-cols-2">
          <div>
            <h2 className="font-display text-3xl font-bold md:text-4xl">Are you a landlord or agent?</h2>
            <p className="mt-3 max-w-md text-sm text-background/80">
              Reach thousands of tenants every month. List your first property free in under 5 minutes.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 md:justify-end">
            <Button asChild size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90">
              <Link to="/auth" search={{ mode: "signup", role: "landlord" }}>List your property</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-background/30 bg-transparent text-background hover:bg-background/10 hover:text-background">
              <Link to="/how-it-works">Learn more</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
