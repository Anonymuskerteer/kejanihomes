import { createFileRoute, Link } from "@tanstack/react-router";
import { Search, MapPin, ShieldCheck, BadgeCheck, Sparkles, ArrowRight, Star, Home, KeyRound, MessagesSquare } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { PropertyCard } from "@/components/property-card";
import { PROPERTIES, POPULAR_LOCATIONS } from "@/lib/properties";
import heroImg from "@/assets/hero-home.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Kejani Homes — Find your next home in Kenya" },
      { name: "description", content: "Browse thousands of verified rentals in Kenya. Bedsitters, apartments, maisonettes and houses, with direct contact to landlords." },
      { property: "og:title", content: "Kejani Homes — Find your next home in Kenya" },
      { property: "og:description", content: "Verified rentals across Kenya. Real photos. Real landlords." },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const featured = PROPERTIES.slice(0, 6);
  const recent = [...PROPERTIES].sort((a, b) => b.postedAt.localeCompare(a.postedAt)).slice(0, 4);

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <Hero />

        <section className="container-page mt-16 md:mt-24">
          <SectionHeader
            eyebrow="Featured this week"
            title="Handpicked homes you'll love"
            href="/browse"
          />
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((p) => <PropertyCard key={p.id} property={p} />)}
          </div>
        </section>

        <section className="container-page mt-20">
          <SectionHeader
            eyebrow="Explore"
            title="Popular locations"
            subtitle="Where Kenyans are searching right now"
          />
          <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
            {POPULAR_LOCATIONS.map((loc) => (
              <Link
                key={loc.name}
                to="/browse"
                className="group relative aspect-[4/5] overflow-hidden rounded-2xl"
              >
                <img src={loc.img} alt={loc.name} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-110" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-3 text-white">
                  <div className="text-sm font-semibold">{loc.name}</div>
                  <div className="text-[11px] opacity-90">{loc.count} listings</div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="container-page mt-20">
          <SectionHeader eyebrow="Just added" title="Recently posted" href="/browse" />
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {recent.map((p) => <PropertyCard key={p.id} property={p} />)}
          </div>
        </section>

        <HowItWorks />
        <Testimonials />
        <FinalCTA />
      </main>
      <SiteFooter />
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
            <Sparkles className="h-3.5 w-3.5 text-accent" /> Trusted by 12,000+ Kenyans
          </span>
          <h1 className="mt-5 font-display text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl md:text-6xl">
            Find a place that feels like <span className="text-accent">kejani</span>.
          </h1>
          <p className="mt-5 max-w-xl text-base text-white/90 md:text-lg">
            Bedsitters to maisonettes, in Kilimani, Syokimau, Nyali and beyond. Verified listings with real photos and direct landlord contact.
          </p>
        </div>

        <div className="mt-8 rounded-2xl bg-background/95 p-3 shadow-elevated backdrop-blur md:p-4">
          <div className="flex flex-col gap-2 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search by estate, town or property name…"
                className="h-12 border-0 bg-secondary/60 pl-10 text-base focus-visible:ring-2 focus-visible:ring-primary"
              />
            </div>
            <div className="hidden h-8 w-px bg-border md:block" />
            <div className="flex items-center gap-2 px-2 text-sm text-muted-foreground md:px-0">
              <MapPin className="h-4 w-4 text-primary" /> Anywhere in Kenya
            </div>
            <Button asChild size="lg" className="h-12 px-6 text-base shadow-soft">
              <Link to="/browse">
                Search homes <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
          <div className="mt-3 flex flex-wrap gap-2 px-2 pb-1">
            {["Bedsitter", "One Bedroom", "Two Bedroom", "Furnished", "Karen", "Kilimani"].map((t) => (
              <Link key={t} to="/browse" className="rounded-full border border-border bg-secondary/50 px-3 py-1 text-xs font-medium text-foreground/80 hover:border-primary hover:text-primary">
                {t}
              </Link>
            ))}
          </div>
        </div>

        <div className="mt-10 grid max-w-2xl grid-cols-3 gap-6 text-primary-foreground">
          <Stat n="12k+" label="Verified listings" />
          <Stat n="47" label="Counties covered" />
          <Stat n="4.8★" label="Average rating" />
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
    { icon: Search, title: "Search & filter", body: "Browse thousands of homes. Filter by county, estate, price, type and amenities." },
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
          <span className="inline-flex items-center gap-2 rounded-full bg-background px-3 py-1.5 font-medium"><BadgeCheck className="h-4 w-4 text-primary" /> Verified agents</span>
          <span className="inline-flex items-center gap-2 rounded-full bg-background px-3 py-1.5 font-medium"><MessagesSquare className="h-4 w-4 text-primary" /> Direct chat</span>
        </div>
      </div>
    </section>
  );
}

function Testimonials() {
  const items = [
    { name: "Achieng O.", role: "Tenant, Kisumu", quote: "Found my 1BR in Milimani in under a week. The map view made it so easy.", rating: 5 },
    { name: "Brian K.", role: "Landlord, Nairobi", quote: "Listed three units. All filled within 10 days. The dashboard is brilliant.", rating: 5 },
    { name: "Faith W.", role: "Tenant, Mombasa", quote: "Loved that I could read honest reviews before viewing. No surprises.", rating: 4 },
  ];
  return (
    <section className="container-page mt-24">
      <SectionHeader eyebrow="Loved by Kenyans" title="Real stories, real homes" />
      <div className="mt-8 grid gap-5 md:grid-cols-3">
        {items.map((t) => (
          <figure key={t.name} className="rounded-2xl border border-border bg-card p-6 shadow-card">
            <div className="flex gap-0.5 text-accent">
              {Array.from({ length: t.rating }).map((_, i) => <Star key={i} className="h-4 w-4 fill-current" />)}
            </div>
            <blockquote className="mt-3 text-sm text-foreground/90">"{t.quote}"</blockquote>
            <figcaption className="mt-4 text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">{t.name}</span> · {t.role}
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}

function FinalCTA() {
  return (
    <section className="container-page mt-24">
      <div className="relative overflow-hidden rounded-3xl bg-foreground p-10 text-background md:p-14">
        <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-primary/40 blur-3xl" />
        <div className="absolute -bottom-24 -left-10 h-64 w-64 rounded-full bg-accent/30 blur-3xl" />
        <div className="relative grid items-center gap-6 md:grid-cols-2">
          <div>
            <h2 className="font-display text-3xl font-bold md:text-4xl">Are you a landlord or agent?</h2>
            <p className="mt-3 max-w-md text-sm text-background/80">
              Reach thousands of qualified tenants every month. List your first property free in under 5 minutes.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 md:justify-end">
            <Button asChild size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90">
              <Link to="/list-property">List your property</Link>
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
