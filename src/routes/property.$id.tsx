import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import {
  Bath, BedDouble, BadgeCheck, Calendar, Eye, Heart, MapPin, Share2, Star,
  Lock, Phone, MessageCircle, Mail, Flag, CheckCircle2,
} from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PropertyCard } from "@/components/property-card";
import { formatKES, getProperty, PROPERTIES, type Property } from "@/lib/properties";

export const Route = createFileRoute("/property/$id")({
  loader: ({ params }): { property: Property } => {
    const p = getProperty(params.id);
    if (!p) throw notFound();
    return { property: p };
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.property.title} — Kejani Homes` },
          { name: "description", content: loaderData.property.description.slice(0, 160) },
          { property: "og:title", content: loaderData.property.title },
          { property: "og:description", content: loaderData.property.description.slice(0, 160) },
          { property: "og:image", content: loaderData.property.cover },
        ]
      : [],
  }),
  notFoundComponent: () => (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="container-page flex-1 py-24 text-center">
        <h1 className="font-display text-3xl font-bold">Property not found</h1>
        <p className="mt-2 text-muted-foreground">This listing may have been removed.</p>
        <Button asChild className="mt-6"><Link to="/browse">Browse other homes</Link></Button>
      </main>
      <SiteFooter />
    </div>
  ),
  errorComponent: () => (
    <div className="container-page py-24 text-center">Something went wrong.</div>
  ),
  component: PropertyPage,
});

function PropertyPage() {
  const { property } = Route.useLoaderData();
  const [active, setActive] = useState(0);
  const [contactRevealed, setContactRevealed] = useState(false);
  const similar = PROPERTIES.filter((p) => p.id !== property.id && p.type === property.type).slice(0, 3);

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <div className="container-page mt-6">
          <nav className="text-xs text-muted-foreground">
            <Link to="/" className="hover:text-foreground">Home</Link> ·{" "}
            <Link to="/browse" className="hover:text-foreground">Browse</Link> ·{" "}
            <span className="text-foreground">{property.estate}</span>
          </nav>

          <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary">{property.type}</Badge>
                {property.verified && (
                  <Badge className="bg-primary text-primary-foreground hover:bg-primary"><BadgeCheck className="mr-1 h-3 w-3" /> Verified</Badge>
                )}
                {property.available ? (
                  <Badge variant="outline" className="border-success text-success"><CheckCircle2 className="mr-1 h-3 w-3" /> Available</Badge>
                ) : (
                  <Badge variant="outline">Rented</Badge>
                )}
              </div>
              <h1 className="mt-2 font-display text-2xl font-bold tracking-tight md:text-4xl">{property.title}</h1>
              <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 text-primary" /> {property.estate}, {property.town}, {property.county}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm"><Heart className="mr-1.5 h-4 w-4" /> Save</Button>
              <Button variant="outline" size="sm"><Share2 className="mr-1.5 h-4 w-4" /> Share</Button>
            </div>
          </div>
        </div>

        <section className="container-page mt-6 grid gap-3 md:grid-cols-[2fr_1fr]">
          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-muted md:aspect-[16/10]">
            <img src={property.gallery[active]} alt={property.title} className="h-full w-full object-cover" />
            <div className="absolute bottom-3 left-3 rounded-full bg-accent px-4 py-1.5 text-base font-bold text-accent-foreground shadow-soft">
              {formatKES(property.rent)}<span className="text-xs font-medium opacity-80">/month</span>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 md:grid-cols-2">
            {property.gallery.map((g, i) => (
              <button
                key={i}
                onClick={() => setActive(i)}
                className={`relative aspect-square overflow-hidden rounded-xl ring-2 transition ${i === active ? "ring-primary" : "ring-transparent hover:ring-border"}`}
              >
                <img src={g} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        </section>

        <section className="container-page mt-10 grid gap-10 lg:grid-cols-[1fr_360px]">
          <div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Stat icon={BedDouble} label="Bedrooms" value={property.bedrooms || "Studio"} />
              <Stat icon={Bath} label="Bathrooms" value={property.bathrooms} />
              <Stat icon={Eye} label="Views" value={property.views.toLocaleString()} />
              <Stat icon={Calendar} label="Posted" value={new Date(property.postedAt).toLocaleDateString("en-KE", { month: "short", day: "numeric" })} />
            </div>

            <Block title="About this home">
              <p className="text-sm leading-7 text-foreground/85">{property.description}</p>
            </Block>

            <Block title="Amenities">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {property.amenities.map((a) => (
                  <div key={a} className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-primary" /> {a}
                  </div>
                ))}
              </div>
            </Block>

            <Block title="Location">
              <div className="relative h-64 overflow-hidden rounded-2xl border border-border bg-secondary">
                <div className="absolute inset-0 grid place-items-center text-center">
                  <div>
                    <MapPin className="mx-auto h-8 w-8 text-primary" />
                    <p className="mt-2 text-sm font-medium">{property.estate}, {property.town}</p>
                    <p className="text-xs text-muted-foreground">Map preview · sign in to open directions</p>
                  </div>
                </div>
              </div>
            </Block>

            <Block title="Ratings & reviews">
              <div className="rounded-2xl border border-border bg-card p-6">
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <div className="font-display text-4xl font-bold">{property.rating.toFixed(1)}</div>
                    <div className="mt-1 flex justify-center text-accent">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`h-4 w-4 ${i < Math.round(property.rating) ? "fill-current" : "opacity-30"}`} />
                      ))}
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">{property.reviewsCount} reviews</div>
                  </div>
                  <div className="grid flex-1 gap-1.5 text-xs">
                    {[
                      ["Security", 4.6], ["Water", 4.4], ["Cleanliness", 4.7],
                      ["Noise", 4.2], ["Internet", 4.3], ["Landlord", 4.8],
                    ].map(([k, v]) => (
                      <div key={k as string} className="flex items-center gap-2">
                        <span className="w-24 text-muted-foreground">{k}</span>
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-secondary">
                          <div className="h-full rounded-full bg-primary" style={{ width: `${((v as number) / 5) * 100}%` }} />
                        </div>
                        <span className="w-8 text-right font-semibold">{(v as number).toFixed(1)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Block>

            <button className="mt-8 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-destructive">
              <Flag className="h-4 w-4" /> Report this listing
            </button>
          </div>

          <aside>
            <div className="sticky top-20 space-y-4">
              <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
                <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Listed by</div>
                <div className="mt-2 flex items-center gap-3">
                  <div className="grid h-11 w-11 place-items-center rounded-full bg-primary-soft font-display text-base font-bold text-primary">
                    {property.landlord.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-semibold">{property.landlord.name}</div>
                    {property.verified && <div className="flex items-center gap-1 text-xs text-primary"><BadgeCheck className="h-3.5 w-3.5" /> Verified landlord</div>}
                  </div>
                </div>

                {contactRevealed ? (
                  <div className="mt-5 space-y-2">
                    <a href={`tel:${property.landlord.phone}`} className="flex items-center gap-3 rounded-xl bg-secondary px-4 py-3 text-sm font-medium hover:bg-secondary/70">
                      <Phone className="h-4 w-4 text-primary" /> {property.landlord.phone}
                    </a>
                    <a href={`https://wa.me/${property.landlord.whatsapp.replace(/[^0-9]/g, "")}`} target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-xl bg-secondary px-4 py-3 text-sm font-medium hover:bg-secondary/70">
                      <MessageCircle className="h-4 w-4 text-primary" /> WhatsApp
                    </a>
                    <a href={`mailto:${property.landlord.email}`} className="flex items-center gap-3 rounded-xl bg-secondary px-4 py-3 text-sm font-medium hover:bg-secondary/70">
                      <Mail className="h-4 w-4 text-primary" /> {property.landlord.email}
                    </a>
                  </div>
                ) : (
                  <div className="mt-5 rounded-xl border border-dashed border-border bg-secondary/40 p-4 text-center">
                    <Lock className="mx-auto h-5 w-5 text-primary" />
                    <p className="mt-2 text-sm font-medium">Sign in to view contacts</p>
                    <p className="text-xs text-muted-foreground">Phone, WhatsApp and email of the landlord.</p>
                    <div className="mt-3 flex flex-col gap-2">
                      <Button asChild className="w-full"><Link to="/auth">Sign in to reveal</Link></Button>
                      <Button variant="ghost" size="sm" onClick={() => setContactRevealed(true)}>Preview (demo)</Button>
                    </div>
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-border bg-primary-soft p-5 text-sm">
                <div className="flex items-center gap-2 font-semibold text-primary"><BadgeCheck className="h-4 w-4" /> Safety tip</div>
                <p className="mt-1 text-foreground/80">Never pay before viewing. Kejani Homes does not facilitate payments — always meet the landlord at the property.</p>
              </div>
            </div>
          </aside>
        </section>

        {similar.length > 0 && (
          <section className="container-page mt-20">
            <h2 className="font-display text-2xl font-bold tracking-tight">Similar homes</h2>
            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {similar.map((p) => <PropertyCard key={p.id} property={p} />)}
            </div>
          </section>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}

function Stat({ icon: Icon, label, value }: { icon: typeof BedDouble; label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <Icon className="h-5 w-5 text-primary" />
      <div className="mt-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="font-display text-lg font-semibold">{value}</div>
    </div>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="font-display text-xl font-bold tracking-tight">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}
