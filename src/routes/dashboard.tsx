import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { toast } from "sonner";
import {
  Eye,
  Home,
  Plus,
  Pencil,
  Trash2,
  BadgeCheck,
  Users,
  CircleCheck,
  CircleX,
  Clock,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/site-header";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/use-auth";
import { formatKES, type PropertyRow } from "@/lib/properties";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Kejani Homes" }] }),
  component: DashboardPage,
});

function DashboardPage() {
  const { user, role, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  if (loading || !user) {
    return (
      <Shell>
        <main className="container-page flex-1 py-20 text-center text-sm text-muted-foreground">
          Loading your dashboard…
        </main>
      </Shell>
    );
  }

  return (
    <Shell>
      <main className="container-page flex-1 py-10">
        {role === "admin" ? (
          <AdminDashboard />
        ) : role === "landlord" ? (
          <LandlordDashboard userId={user.id} />
        ) : (
          <TenantDashboard userId={user.id} />
        )}
      </main>
    </Shell>
  );
}

/* ────────── TENANT ────────── */
function TenantDashboard({ userId }: { userId: string }) {
  const { data: saved = [] } = useQuery({
    queryKey: ["saved", userId],
    queryFn: async (): Promise<PropertyRow[]> => {
      const { data, error } = await supabase
        .from("saved_properties")
        .select("property_id, properties(*)")
        .eq("user_id", userId);
      if (error) throw error;
      return (data ?? [])
        .map((r) => (r as { properties: PropertyRow | null }).properties)
        .filter((p): p is PropertyRow => !!p);
    },
  });

  const { data: reviews = [] } = useQuery({
    queryKey: ["my-reviews", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reviews")
        .select("id, rating, comment, created_at, property_id, properties(title)")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  return (
    <>
      <PageHeader
        title="Your home search"
        subtitle="Saved homes, recent reviews and quick links."
        cta={<Button asChild><Link to="/browse"><Home className="mr-1.5 h-4 w-4" /> Browse homes</Link></Button>}
      />

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <Stat icon={Home} label="Saved homes" value={saved.length} />
        <Stat icon={BadgeCheck} label="Reviews posted" value={reviews.length} />
        <Stat icon={Users} label="Account type" value="Tenant" />
      </div>

      <section className="mt-10">
        <h2 className="font-display text-xl font-bold">Saved homes</h2>
        {saved.length === 0 ? (
          <p className="mt-3 rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            Nothing saved yet. <Link to="/browse" className="font-semibold text-primary underline">Browse homes →</Link>
          </p>
        ) : (
          <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {saved.map((p) => (
              <Link key={p.id} to="/property/$id" params={{ id: p.id }} className="overflow-hidden rounded-2xl border border-border bg-card shadow-card hover:shadow-elevated">
                <img src={p.images[0] ?? "/placeholder.svg"} alt="" className="aspect-[4/3] w-full object-cover" />
                <div className="p-4">
                  <div className="font-display font-semibold">{p.title}</div>
                  <div className="text-xs text-muted-foreground">{p.town}, {p.county}</div>
                  <div className="mt-2 font-bold text-primary">{formatKES(p.price_kes)}</div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {reviews.length > 0 && (
        <section className="mt-10">
          <h2 className="font-display text-xl font-bold">Your reviews</h2>
          <ul className="mt-4 space-y-3">
            {reviews.map((r: any) => (
              <li key={r.id} className="rounded-2xl border border-border bg-card p-4 text-sm">
                <div className="flex justify-between">
                  <Link to="/property/$id" params={{ id: r.property_id }} className="font-semibold hover:underline">
                    {r.properties?.title ?? "Property"}
                  </Link>
                  <span>⭐ {r.rating}</span>
                </div>
                <p className="mt-1 text-muted-foreground">{r.comment}</p>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}

/* ────────── LANDLORD ────────── */
function LandlordDashboard({ userId }: { userId: string }) {
  const qc = useQueryClient();
  const { data: mine = [] } = useQuery({
    queryKey: ["my-properties", userId],
    queryFn: async (): Promise<PropertyRow[]> => {
      const { data, error } = await supabase
        .from("properties")
        .select("*")
        .eq("owner_id", userId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data as PropertyRow[]) ?? [];
    },
  });

  const totals = {
    listings: mine.length,
    active: mine.filter((p) => p.status === "approved").length,
    pending: mine.filter((p) => p.status === "pending").length,
    views: mine.reduce((a, p) => a + p.views_count, 0),
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this listing? This cannot be undone.")) return;
    const { error } = await supabase.from("properties").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Listing deleted");
    qc.invalidateQueries({ queryKey: ["my-properties", userId] });
  };

  return (
    <>
      <PageHeader
        title="Landlord dashboard"
        subtitle="Manage your listings and track tenant interest."
        cta={<Button asChild size="lg"><Link to="/list-property"><Plus className="mr-1.5 h-4 w-4" /> Add property</Link></Button>}
      />

      <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        <Stat icon={Home} label="Total listings" value={totals.listings} />
        <Stat icon={CircleCheck} label="Approved" value={totals.active} />
        <Stat icon={Clock} label="Pending review" value={totals.pending} />
        <Stat icon={Eye} label="Total views" value={totals.views.toLocaleString()} />
      </div>

      <section className="mt-10">
        <h2 className="font-display text-xl font-bold">Your properties</h2>
        <PropertyTable rows={mine} onDelete={remove} showOwner={false} />
      </section>
    </>
  );
}

/* ────────── ADMIN ────────── */
function AdminDashboard() {
  const qc = useQueryClient();
  const { data: all = [] } = useQuery({
    queryKey: ["all-properties"],
    queryFn: async (): Promise<PropertyRow[]> => {
      const { data, error } = await supabase
        .from("properties")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data as PropertyRow[]) ?? [];
    },
  });

  const totals = {
    total: all.length,
    pending: all.filter((p) => p.status === "pending").length,
    approved: all.filter((p) => p.status === "approved").length,
    rejected: all.filter((p) => p.status === "rejected").length,
  };

  const setStatus = async (id: string, status: "approved" | "rejected") => {
    const { error } = await supabase.from("properties").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(`Listing ${status}`);
    qc.invalidateQueries({ queryKey: ["all-properties"] });
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this listing?")) return;
    const { error } = await supabase.from("properties").delete().eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["all-properties"] });
  };

  const pending = all.filter((p) => p.status === "pending");

  return (
    <>
      <PageHeader title="Listings" subtitle="Review, approve and moderate every listing on the platform." />

      <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        <Stat icon={Home} label="Total listings" value={totals.total} />
        <Stat icon={Clock} label="Pending" value={totals.pending} />
        <Stat icon={CircleCheck} label="Approved" value={totals.approved} />
        <Stat icon={CircleX} label="Rejected" value={totals.rejected} />
      </div>

      <section className="mt-10">
        <h2 className="font-display text-xl font-bold">Pending approval</h2>
        {pending.length === 0 ? (
          <p className="mt-3 rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            No listings waiting for review. Nice!
          </p>
        ) : (
          <PropertyTable
            rows={pending}
            onDelete={remove}
            showOwner
            actions={(p) => (
              <>
                <button onClick={() => setStatus(p.id, "approved")} className="grid h-8 w-8 place-items-center rounded-md text-success hover:bg-success/10" title="Approve"><CircleCheck className="h-4 w-4" /></button>
                <button onClick={() => setStatus(p.id, "rejected")} className="grid h-8 w-8 place-items-center rounded-md text-destructive hover:bg-destructive/10" title="Reject"><CircleX className="h-4 w-4" /></button>
              </>
            )}
          />
        )}
      </section>

      <PendingReviewsSection />

      <section className="mt-10">
        <h2 className="font-display text-xl font-bold">All listings</h2>
        <PropertyTable rows={all} onDelete={remove} showOwner />
      </section>
    </>
  );
}

/* ────────── ADMIN — pending reviews ────────── */
function PendingReviewsSection() {
  const qc = useQueryClient();
  const { data: pendingReviews = [] } = useQuery({
    queryKey: ["pending-reviews"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reviews")
        .select("id, rating, comment, photos, created_at, property_id, user_id, properties(title)")
        .eq("is_approved", false)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const approve = async (id: string) => {
    const { error } = await supabase.from("reviews").update({ is_approved: true }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Review approved");
    qc.invalidateQueries({ queryKey: ["pending-reviews"] });
  };
  const reject = async (id: string) => {
    if (!confirm("Delete this review?")) return;
    const { error } = await supabase.from("reviews").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Review removed");
    qc.invalidateQueries({ queryKey: ["pending-reviews"] });
  };

  return (
    <section className="mt-10">
      <h2 className="font-display text-xl font-bold">Pending reviews</h2>
      {pendingReviews.length === 0 ? (
        <p className="mt-3 rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          No reviews waiting for approval.
        </p>
      ) : (
        <ul className="mt-4 space-y-3">
          {pendingReviews.map((r: any) => (
            <li key={r.id} className="rounded-2xl border border-border bg-card p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <Link to="/property/$id" params={{ id: r.property_id }} className="font-semibold hover:underline">
                    {r.properties?.title ?? "Property"}
                  </Link>
                  <div className="mt-0.5 text-xs text-muted-foreground">
                    by Tenant · {new Date(r.created_at).toLocaleDateString()}
                  </div>
                </div>
                <div className="flex items-center gap-1 text-accent">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Star key={n} className={`h-4 w-4 ${n <= r.rating ? "fill-current" : "text-muted-foreground"}`} />
                  ))}
                </div>
              </div>
              <p className="mt-2 text-sm">{r.comment}</p>
              {r.photos?.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {r.photos.map((src: string, i: number) => (
                    <a key={i} href={src} target="_blank" rel="noreferrer">
                      <img src={src} alt="" className="h-16 w-16 rounded-lg border border-border object-cover" />
                    </a>
                  ))}
                </div>
              )}
              <div className="mt-3 flex gap-2">
                <Button size="sm" onClick={() => approve(r.id)}>
                  <CircleCheck className="mr-1.5 h-4 w-4" /> Approve
                </Button>
                <Button size="sm" variant="outline" onClick={() => reject(r.id)}>
                  <CircleX className="mr-1.5 h-4 w-4" /> Delete
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/* ────────── shared ────────── */
function PageHeader({ title, subtitle, cta }: { title: string; subtitle: string; cta?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">{title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
      </div>
      {cta}
    </div>
  );
}

function Stat({ icon: Icon, label, value }: { icon: typeof Home; label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <Icon className="h-5 w-5 text-primary" />
      <div className="mt-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="font-display text-2xl font-bold">{value}</div>
    </div>
  );
}

function PropertyTable({
  rows,
  onDelete,
  showOwner,
  actions,
}: {
  rows: PropertyRow[];
  onDelete: (id: string) => void;
  showOwner: boolean;
  actions?: (p: PropertyRow) => React.ReactNode;
}) {
  if (rows.length === 0) {
    return (
      <div className="mt-4 rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
        No listings to show.
      </div>
    );
  }
  return (
    <div className="mt-4 overflow-hidden rounded-2xl border border-border bg-card">
      <table className="w-full text-sm">
        <thead className="bg-secondary/60 text-xs uppercase tracking-wider text-muted-foreground">
          <tr>
            <th className="px-4 py-3 text-left">Property</th>
            <th className="px-4 py-3 text-left">Rent</th>
            <th className="hidden px-4 py-3 text-left md:table-cell">Views</th>
            <th className="px-4 py-3 text-left">Status</th>
            <th className="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((p) => (
            <tr key={p.id} className="border-t border-border">
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <img src={p.images[0] ?? "/placeholder.svg"} alt="" className="h-12 w-16 rounded-lg object-cover" />
                  <div>
                    <Link to="/property/$id" params={{ id: p.id }} className="font-medium hover:underline">{p.title}</Link>
                    <div className="text-xs text-muted-foreground">{p.town}, {p.county}</div>
                  </div>
                </div>
              </td>
              <td className="px-4 py-3 font-semibold">{formatKES(p.price_kes)}</td>
              <td className="hidden px-4 py-3 md:table-cell">{p.views_count.toLocaleString()}</td>
              <td className="px-4 py-3">
                <StatusPill status={p.status} />
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center justify-end gap-1">
                  {actions?.(p)}
                  <Link to="/list-property" search={{ edit: p.id }} className="grid h-8 w-8 place-items-center rounded-md hover:bg-secondary" title="Edit">
                    <Pencil className="h-4 w-4" />
                  </Link>
                  <button onClick={() => onDelete(p.id)} className="grid h-8 w-8 place-items-center rounded-md text-destructive hover:bg-destructive/10" title="Delete">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    approved: "bg-success/15 text-success",
    pending: "bg-accent/20 text-accent-foreground",
    rejected: "bg-destructive/15 text-destructive",
  };
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${map[status] ?? "bg-muted"}`}>
      {status}
    </span>
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
