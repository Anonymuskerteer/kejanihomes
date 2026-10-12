import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import {
  BedDouble,
  Bath,
  Maximize,
  MapPin,
  Star,
  ShieldCheck,
  Heart,
  MessageCircle,
  CircleCheck,
  Phone,
  Mail,
  CalendarDays,
  ExternalLink,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { PropertyMap } from "@/components/property-map";
import { ReviewForm } from "@/components/review-form";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/use-auth";
import {
  formatKES,
  DEFAULT_MAP_CENTER,
  type PropertyRow,
  type ReviewRow,
} from "@/lib/properties";

export const Route = createFileRoute("/property/$id")({
  head: () => ({ meta: [{ title: "Property — Kejani Homes" }] }),
  component: PropertyDetail,
});

function PropertyDetail() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const { user } = useAuth();

  const { data: property, isLoading } = useQuery({
    queryKey: ["property", id],
    queryFn: async (): Promise<PropertyRow | null> => {
      const { data, error } = await supabase
        .from("properties")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return (data as PropertyRow | null) ?? null;
    },
  });

  const { data: reviews = [] } = useQuery({
    queryKey: ["reviews", id],
    queryFn: async (): Promise<ReviewRow[]> => {
      const { data, error } = await supabase
        .from("reviews")
        .select("*")
        .eq("property_id", id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data as ReviewRow[]) ?? [];
    },
  });

  const { data: saved } = useQuery({
    queryKey: ["saved", id, user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("saved_properties")
        .select("property_id")
        .eq("user_id", user!.id)
        .eq("property_id", id)
        .maybeSingle();
      return !!data;
    },
  });

  const [cover, setCover] = useState(0);

  if (isLoading) {
    return (
      <Shell>
        <div className="container-page py-20 text-center text-sm text-muted-foreground">Loading…</div>
      </Shell>
    );
  }

  if (!property) throw notFound();

  const rating =
    reviews.length > 0
      ? reviews.reduce((a, r) => a + r.rating, 0) / reviews.length
      : 0;

  const toggleSave = async () => {
    if (!user) {
      toast.info("Sign in to save homes");
      return;
    }
    if (saved) {
      await supabase
        .from("saved_properties")
        .delete()
        .eq("user_id", user.id)
        .eq("property_id", id);
    } else {
      await supabase
        .from("saved_properties")
        .insert({ user_id: user.id, property_id: id });
    }
    qc.invalidateQueries({ queryKey: ["saved", id, user.id] });
    qc.invalidateQueries({ queryKey: ["saved", user.id] });
  };

  const images = property.images.length ? property.images : ["/placeholder.svg"];
  const center: [number, number] =
    property.latitude != null && property.longitude != null
      ? [property.latitude, property.longitude]
      : DEFAULT_MAP_CENTER;

  return (
    <Shell>
      <main className="container-page py-8">
        <Link to="/browse" className="text-xs text-muted-foreground hover:underline">← Back to results</Link>
        <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight md:text-3xl">{property.title}</h1>
            <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              {user && property.address ? `${property.address}, ` : ""}{property.town}, {property.county}
            </div>
          </div>
          <div className="text-right">
            <div className="font-display text-3xl font-bold text-primary">{formatKES(property.price_kes)}<span className="text-sm font-medium text-muted-foreground">/mo</span></div>
            <div className="mt-1 inline-flex items-center gap-1 text-sm">
              <Star className="h-4 w-4 fill-accent text-accent" />
              {rating > 0 ? rating.toFixed(1) : "—"}
              <span className="text-muted-foreground">({reviews.length} review{reviews.length === 1 ? "" : "s"})</span>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-2 md:grid-cols-[2fr_1fr]">
          <div className="aspect-[4/3] overflow-hidden rounded-2xl bg-muted">
            <img src={images[cover]} alt={property.title} className="h-full w-full object-cover" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            {images.slice(0, 4).map((src, i) => (
              <button key={i} onClick={() => setCover(i)} className={`aspect-square overflow-hidden rounded-xl border-2 ${cover === i ? "border-primary" : "border-transparent"}`}>
                <img src={src} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
          <section className="space-y-8">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Spec icon={BedDouble} label="Bedrooms" value={property.bedrooms || "Studio"} />
              <Spec icon={Bath} label="Bathrooms" value={property.bathrooms} />
              <Spec icon={Maximize} label="Area" value={property.area_sqm ? `${property.area_sqm} m²` : "—"} />
              <Spec icon={CalendarDays} label="Listed" value={new Date(property.created_at).toLocaleDateString()} />
            </div>

            <div>
              <h2 className="font-display text-xl font-bold">About this home</h2>
              <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-foreground/90">{property.description}</p>
            </div>

            {property.amenities.length > 0 && (
              <div>
                <h2 className="font-display text-xl font-bold">Amenities</h2>
                <div className="mt-3 flex flex-wrap gap-2">
                  {property.amenities.map((a) => (
                    <span key={a} className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-xs font-medium">
                      <ShieldCheck className="h-3.5 w-3.5 text-primary" /> {a}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div>
              <h2 className="font-display text-xl font-bold">Location</h2>
              {!user ? (
                <div className="mt-3 grid place-items-center gap-3 rounded-2xl border border-dashed border-border bg-muted/50 px-6 py-12 text-center">
                  <MapPin className="h-8 w-8 text-primary" />
                  <p className="text-sm text-muted-foreground">
                    Sign in to see the exact location, map and directions for this home.
                  </p>
                  <Button asChild size="sm">
                    <Link to="/auth">Sign in to view location</Link>
                  </Button>
                </div>
              ) : (
                <>
              <p className="mt-1 text-sm text-muted-foreground">{property.address || `${property.town}, ${property.county}`}</p>
              <div className="mt-3">
                <PropertyMap
                  center={center}
                  zoom={property.latitude ? 14 : 11}
                  markers={
                    property.latitude && property.longitude
                      ? [{ id: property.id, lat: property.latitude, lng: property.longitude, title: property.title }]
                      : []
                  }
                />
              </div>
              <Button asChild variant="outline" className="mt-3 w-full sm:w-auto">
                <a
                  href={
                    property.latitude && property.longitude
                      ? `https://www.google.com/maps/search/?api=1&query=${property.latitude},${property.longitude}`
                      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                          `${property.address ?? ""} ${property.town} ${property.county} Kenya`,
                        )}`
                  }
                  target="_blank"
                  rel="noreferrer"
                >
                  <ExternalLink className="mr-1.5 h-4 w-4" /> Open in Google Maps
                </a>
              </Button>
                </>
              )}
            </div>


            <div>
              <h2 className="font-display text-xl font-bold">Reviews</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Every review needs a rating and at least one photo — and is checked by our team before going public.
              </p>

              {user ? (
                <div className="mt-4">
                  <ReviewForm
                    propertyId={property.id}
                    userId={user.id}
                    onSubmitted={() => qc.invalidateQueries({ queryKey: ["reviews", id] })}
                  />
                </div>
              ) : (
                <div className="mt-4 rounded-2xl border border-border bg-primary-soft p-5 text-sm">
                  <Link to="/auth" className="font-semibold text-primary underline">Sign in</Link> to leave a review.
                </div>
              )}

              <div className="mt-6 space-y-4">
                {reviews.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                    No reviews yet — be the first to share your experience.
                  </div>
                ) : (
                  reviews.map((r) => (
                    <article key={r.id} className="rounded-2xl border border-border bg-card p-5">
                      <header className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1 text-accent">
                            {[1, 2, 3, 4, 5].map((n) => (
                              <Star key={n} className={`h-4 w-4 ${n <= r.rating ? "fill-current" : "text-muted-foreground"}`} />
                            ))}
                          </div>
                          {!r.is_approved && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-accent/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-accent-foreground">
                              <Clock className="h-3 w-3" /> Pending review
                            </span>
                          )}
                        </div>
                        <time className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</time>
                      </header>
                      <p className="mt-2 text-sm">{r.comment}</p>
                      {r.photos.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {r.photos.map((src, i) => (
                            <a key={i} href={src} target="_blank" rel="noreferrer">
                              <img src={src} alt="" className="h-20 w-20 rounded-lg border border-border object-cover" />
                            </a>
                          ))}
                        </div>
                      )}
                    </article>
                  ))
                )}
              </div>
            </div>
          </section>

          <aside className="space-y-4">
            <div className="sticky top-20 space-y-3 rounded-2xl border border-border bg-card p-5 shadow-card">
              <div className="text-sm font-semibold">Contact landlord</div>
              {user ? (
                <div className="space-y-2 text-sm">
                  {property.contact_phone && (
                    <a href={`tel:${property.contact_phone}`} className="flex items-center gap-2 rounded-lg bg-primary px-3 py-2.5 text-primary-foreground hover:bg-primary/90">
                      <Phone className="h-4 w-4" /> {property.contact_phone}
                    </a>
                  )}
                  {property.contact_email && (
                    <a href={`mailto:${property.contact_email}`} className="flex items-center gap-2 rounded-lg border border-border px-3 py-2.5 hover:bg-secondary">
                      <Mail className="h-4 w-4" /> {property.contact_email}
                    </a>
                  )}
                  {!property.contact_phone && !property.contact_email && (
                    <p className="text-xs text-muted-foreground">No contact details provided.</p>
                  )}
                </div>
              ) : (
                <Button asChild className="w-full"><Link to="/auth">Sign in to view contact</Link></Button>
              )}
              <Button onClick={toggleSave} variant={saved ? "default" : "outline"} className="w-full">
                <Heart className={`mr-1.5 h-4 w-4 ${saved ? "fill-current" : ""}`} /> {saved ? "Saved" : "Save home"}
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                {property.saves_count ?? 0} {property.saves_count === 1 ? "person has" : "people have"} saved this home
              </p>
              {user?.id !== property.owner_id && (
                <Button asChild variant="outline" className="w-full">
                  <Link to="/chat" search={{ property: property.id }}>
                    <MessageCircle className="mr-1.5 h-4 w-4" /> Chat with landlord
                  </Link>
                </Button>
              )}
              {user?.id === property.owner_id && property.status !== "taken" && (
                <Button
                  variant="secondary"
                  className="w-full"
                  onClick={async () => {
                    if (!confirm("Mark this home as taken? It will be removed from public listings.")) return;
                    const { error } = await supabase.from("properties").update({ status: "taken" }).eq("id", property.id);
                    if (error) return toast.error(error.message);
                    toast.success("Marked as taken");
                    qc.invalidateQueries();
                  }}
                >
                  <CircleCheck className="mr-1.5 h-4 w-4" /> Mark as taken
                </Button>
              )}
            </div>
          </aside>
        </div>
      </main>
      <SiteFooter />
    </Shell>
  );
}

function Spec({ icon: Icon, label, value }: { icon: typeof BedDouble; label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <Icon className="h-5 w-5 text-primary" />
      <div className="mt-2 text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="font-display text-lg font-bold">{value}</div>
    </div>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      {children}
    </div>
  );
}
