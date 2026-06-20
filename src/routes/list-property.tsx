import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Camera, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/use-auth";
import { uploadFiles } from "@/lib/upload";
import {
  COUNTIES,
  PROPERTY_TYPES,
  COMMON_AMENITIES,
} from "@/lib/properties";

export const Route = createFileRoute("/list-property")({
  head: () => ({ meta: [{ title: "List your property — Kejani Homes" }] }),
  component: ListPropertyPage,
});

function ListPropertyPage() {
  const { user, role, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth", search: { mode: "signup", role: "landlord" } });
  }, [loading, user, navigate]);

  if (loading || !user) {
    return (
      <Shell>
        <main className="container-page flex-1 py-20 text-center text-sm text-muted-foreground">
          Loading…
        </main>
        <SiteFooter />
      </Shell>
    );
  }

  if (role && role === "tenant") {
    return (
      <Shell>
        <main className="container-page flex-1 py-16 text-center">
          <h1 className="font-display text-2xl font-bold">You're signed in as a tenant</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Only landlords and agents can list properties. Create a landlord account to continue.
          </p>
          <Button asChild className="mt-6"><Link to="/auth" search={{ mode: "signup", role: "landlord" }}>Create landlord account</Link></Button>
        </main>
        <SiteFooter />
      </Shell>
    );
  }

  return (
    <Shell>
      <main className="container-page flex-1 py-10">
        <ListingForm userId={user.id} />
      </main>
      <SiteFooter />
    </Shell>
  );
}

function ListingForm({ userId }: { userId: string }) {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [amenities, setAmenities] = useState<string[]>([]);

  const [form, setForm] = useState({
    title: "",
    description: "",
    property_type: "Bedsitter",
    listing_type: "rent",
    price_kes: 0,
    bedrooms: 0,
    bathrooms: 1,
    area_sqm: "" as string | number,
    county: "Kirinyaga",
    town: "Mwea",
    address: "",
    latitude: "" as string | number,
    longitude: "" as string | number,
    contact_phone: "",
    contact_email: "",
  });

  const onChange = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((s) => ({ ...s, [k]: v }));

  const onFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = Array.from(e.target.files ?? []);
    setFiles((p) => [...p, ...list].slice(0, 10));
    e.target.value = "";
  };

  const toggleAmenity = (a: string) =>
    setAmenities((p) => (p.includes(a) ? p.filter((x) => x !== a) : [...p, a]));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.price_kes || !form.county || !form.town) {
      return toast.error("Please fill all required fields");
    }
    if (files.length < 1) {
      return toast.error("Add at least one photo");
    }
    setBusy(true);
    try {
      const images = await uploadFiles("property-images", userId, files);
      const { data, error } = await supabase
        .from("properties")
        .insert({
          owner_id: userId,
          title: form.title,
          description: form.description,
          property_type: form.property_type,
          listing_type: form.listing_type,
          price_kes: Number(form.price_kes),
          bedrooms: Number(form.bedrooms),
          bathrooms: Number(form.bathrooms),
          area_sqm: form.area_sqm ? Number(form.area_sqm) : null,
          county: form.county,
          town: form.town,
          address: form.address || null,
          latitude: form.latitude ? Number(form.latitude) : null,
          longitude: form.longitude ? Number(form.longitude) : null,
          amenities,
          images,
          contact_phone: form.contact_phone || null,
          contact_email: form.contact_email || null,
          status: "pending",
        })
        .select("id")
        .maybeSingle();
      if (error) throw error;
      toast.success("Listing submitted — pending admin approval");
      navigate({ to: "/dashboard" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not publish listing");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="mx-auto max-w-3xl space-y-6">
      <header>
        <h1 className="font-display text-3xl font-bold tracking-tight">List your property</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Listings are reviewed by an admin before appearing publicly. Usually under 24 hours.
        </p>
      </header>

      <Card title="Basics">
        <Field label="Title">
          <Input required value={form.title} onChange={(e) => onChange("title", e.target.value)} placeholder="Spacious 2BR near Mwea town" />
        </Field>
        <Field label="Description">
          <Textarea required rows={4} value={form.description} onChange={(e) => onChange("description", e.target.value)} placeholder="Tell tenants what makes this home special…" />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Property type">
            <Select value={form.property_type} onValueChange={(v) => onChange("property_type", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{PROPERTY_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Listing type">
            <Select value={form.listing_type} onValueChange={(v) => onChange("listing_type", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="rent">For rent</SelectItem>
                <SelectItem value="sale">For sale</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-4">
          <Field label="Price (KES/mo)">
            <Input required type="number" min={0} value={form.price_kes} onChange={(e) => onChange("price_kes", Number(e.target.value))} />
          </Field>
          <Field label="Bedrooms">
            <Input type="number" min={0} value={form.bedrooms} onChange={(e) => onChange("bedrooms", Number(e.target.value))} />
          </Field>
          <Field label="Bathrooms">
            <Input type="number" min={0} value={form.bathrooms} onChange={(e) => onChange("bathrooms", Number(e.target.value))} />
          </Field>
          <Field label="Area (m²)">
            <Input type="number" min={0} value={form.area_sqm} onChange={(e) => onChange("area_sqm", e.target.value)} />
          </Field>
        </div>
      </Card>

      <Card title="Location">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="County">
            <Select value={form.county} onValueChange={(v) => onChange("county", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{COUNTIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Town / area">
            <Input required value={form.town} onChange={(e) => onChange("town", e.target.value)} placeholder="Mwea" />
          </Field>
        </div>
        <Field label="Address (optional)">
          <Input value={form.address} onChange={(e) => onChange("address", e.target.value)} placeholder="Off Embu road, near…" />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Latitude (optional)">
            <Input type="number" step="any" value={form.latitude} onChange={(e) => onChange("latitude", e.target.value)} placeholder="-0.6906" />
          </Field>
          <Field label="Longitude (optional)">
            <Input type="number" step="any" value={form.longitude} onChange={(e) => onChange("longitude", e.target.value)} placeholder="37.3573" />
          </Field>
        </div>
        <p className="text-xs text-muted-foreground">
          Tip: right-click on Google Maps to copy coordinates. Without them we still show your town on the map.
        </p>
      </Card>

      <Card title="Amenities">
        <div className="flex flex-wrap gap-2">
          {COMMON_AMENITIES.map((a) => (
            <button type="button" key={a} onClick={() => toggleAmenity(a)} className={`rounded-full border px-3 py-1.5 text-xs font-medium ${amenities.includes(a) ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-primary"}`}>
              {a}
            </button>
          ))}
        </div>
      </Card>

      <Card title="Photos">
        <div className="flex flex-wrap gap-2">
          {files.map((f, i) => (
            <div key={i} className="relative h-24 w-24 overflow-hidden rounded-lg border border-border">
              <img src={URL.createObjectURL(f)} alt="" className="h-full w-full object-cover" />
              <button type="button" onClick={() => setFiles((p) => p.filter((_, j) => j !== i))} className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-foreground/80 text-background">
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
          {files.length < 10 && (
            <label className="flex h-24 w-24 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-border text-xs text-muted-foreground hover:border-primary hover:text-primary">
              <Camera className="h-5 w-5" /> Add
              <input type="file" accept="image/*" multiple onChange={onFiles} className="hidden" />
            </label>
          )}
        </div>
      </Card>

      <Card title="Contact">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Phone">
            <Input value={form.contact_phone} onChange={(e) => onChange("contact_phone", e.target.value)} placeholder="+2547…" />
          </Field>
          <Field label="Email">
            <Input type="email" value={form.contact_email} onChange={(e) => onChange("contact_email", e.target.value)} />
          </Field>
        </div>
      </Card>

      <div className="flex flex-wrap gap-2">
        <Button type="submit" size="lg" disabled={busy}>
          {busy ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Publishing…</> : "Submit for approval"}
        </Button>
        <Button asChild variant="outline" size="lg"><Link to="/dashboard">Cancel</Link></Button>
      </div>
    </form>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4 rounded-2xl border border-border bg-card p-6">
      <h2 className="font-display text-lg font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
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
