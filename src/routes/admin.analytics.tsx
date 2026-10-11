import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { Users, Home, Star, Heart, Eye } from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { AdminShell } from "@/components/admin-shell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/use-auth";

export const Route = createFileRoute("/admin/analytics")({
  head: () => ({
    meta: [
      { title: "Analytics — Kejani Homes Admin" },
      { name: "description", content: "Platform metrics, ratings and growth for Kejani Homes." },
      { property: "og:title", content: "Analytics — Kejani Homes Admin" },
      { property: "og:description", content: "Platform metrics, ratings and growth for Kejani Homes." },
    ],
  }),
  component: AnalyticsPage,
});

const COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];

function AnalyticsPage() {
  const { user, role } = useAuth();
  const { data } = useQuery({
    queryKey: ["admin-analytics"],
    enabled: !!user && role === "admin",
    queryFn: async () => {
      const [p, r, pr, rv, s] = await Promise.all([
        supabase.from("profiles").select("id, created_at, account_status"),
        supabase.from("user_roles").select("user_id, role"),
        supabase.from("properties").select("id, title, status, town, county, views_count, created_at, property_type"),
        supabase.from("reviews").select("id, rating, is_approved, created_at, property_id"),
        supabase.from("saved_properties").select("property_id, created_at"),
      ]);
      return {
        profiles: p.data ?? [],
        roles: r.data ?? [],
        properties: pr.data ?? [],
        reviews: rv.data ?? [],
        saved: s.data ?? [],
      };
    },
  });

  const a = useMemo(() => {
    if (!data) return null;
    // last 30 days signups / listings
    const days = [...Array(30)].map((_, i) => {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - (29 - i));
      return d;
    });
    const key = (iso: string) => new Date(iso).toDateString();
    const growth = days.map((d) => ({
      day: d.toLocaleDateString("en-KE", { day: "numeric", month: "short" }),
      users: data.profiles.filter((x) => key(x.created_at) === d.toDateString()).length,
      listings: data.properties.filter((x) => key(x.created_at) === d.toDateString()).length,
    }));
    const roleSplit = ["tenant", "landlord", "admin"].map((r) => ({
      name: r === "landlord" ? "Landlords/Agents" : r[0].toUpperCase() + r.slice(1) + "s",
      value: data.roles.filter((x) => x.role === r).length,
    }));
    const statusSplit = ["approved", "pending", "rejected"].map((s) => ({
      name: s[0].toUpperCase() + s.slice(1),
      value: data.properties.filter((x) => x.status === s).length,
    }));
    const ratingDist = [1, 2, 3, 4, 5].map((n) => ({
      stars: `${n}★`,
      count: data.reviews.filter((x) => x.rating === n).length,
    }));
    const towns = new Map<string, number>();
    data.properties.forEach((x) => towns.set(x.town, (towns.get(x.town) ?? 0) + 1));
    const topTowns = [...towns.entries()].sort((x, y) => y[1] - x[1]).slice(0, 6).map(([town, count]) => ({ town, count }));
    const ratingsBy = new Map<string, number[]>();
    data.reviews.forEach((r) => ratingsBy.set(r.property_id, [...(ratingsBy.get(r.property_id) ?? []), r.rating]));
    const topRated = data.properties
      .map((p) => {
        const rs = ratingsBy.get(p.id) ?? [];
        return { ...p, avg: rs.length ? rs.reduce((s, n) => s + n, 0) / rs.length : 0, n: rs.length };
      })
      .filter((p) => p.n > 0)
      .sort((x, y) => y.avg - x.avg || y.n - x.n)
      .slice(0, 5);
    const mostViewed = [...data.properties].sort((x, y) => y.views_count - x.views_count).slice(0, 5);
    const avgRating = data.reviews.length ? data.reviews.reduce((s, r) => s + r.rating, 0) / data.reviews.length : 0;
    return {
      growth, roleSplit, statusSplit, ratingDist, topTowns, topRated, mostViewed, avgRating,
      totalViews: data.properties.reduce((s, p) => s + p.views_count, 0),
      pendingReviews: data.reviews.filter((r) => !r.is_approved).length,
    };
  }, [data]);

  return (
    <AdminShell title="Analytics" subtitle="Accounts, listings, ratings and engagement across Kejani Homes.">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <Kpi icon={Users} label="Accounts" value={data?.profiles.length ?? "—"} />
        <Kpi icon={Home} label="Listings" value={data?.properties.length ?? "—"} />
        <Kpi icon={Eye} label="Property views" value={a?.totalViews ?? "—"} />
        <Kpi icon={Heart} label="Wishlist saves" value={data?.saved.length ?? "—"} />
        <Kpi icon={Star} label="Avg rating" value={a ? `${a.avgRating.toFixed(1)} (${data?.reviews.length})` : "—"} />
      </div>

      {a && (
        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          <Card title="New accounts & listings — last 30 days" className="lg:col-span-2">
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={a.growth}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} interval={4} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} width={28} />
                <Tooltip />
                <Area type="monotone" dataKey="users" name="Accounts" stroke="var(--chart-1)" fill="var(--chart-1)" fillOpacity={0.25} />
                <Area type="monotone" dataKey="listings" name="Listings" stroke="var(--chart-2)" fill="var(--chart-2)" fillOpacity={0.25} />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
          <Card title="Accounts by role">
            <Donut data={a.roleSplit} />
          </Card>
          <Card title="Rating distribution">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={a.ratingDist}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="stars" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} width={28} />
                <Tooltip />
                <Bar dataKey="count" name="Reviews" fill="var(--chart-2)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            <p className="mt-2 text-xs text-muted-foreground">{a.pendingReviews} review(s) waiting for approval.</p>
          </Card>
          <Card title="Listings by status">
            <Donut data={a.statusSplit} />
          </Card>
          <Card title="Top towns by listings">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={a.topTowns} layout="vertical">
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="town" tick={{ fontSize: 11 }} width={80} />
                <Tooltip />
                <Bar dataKey="count" name="Listings" fill="var(--chart-1)" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
          <Card title="Top-rated properties">
            <RankList rows={a.topRated.map((p) => ({ id: p.id, title: p.title, sub: `${p.town}`, value: `★ ${p.avg.toFixed(1)} (${p.n})` }))} />
          </Card>
          <Card title="Most viewed properties">
            <RankList rows={a.mostViewed.map((p) => ({ id: p.id, title: p.title, sub: p.town, value: `${p.views_count} views` }))} />
          </Card>
        </div>
      )}
    </AdminShell>
  );
}

function Kpi({ icon: Icon, label, value }: { icon: typeof Users; label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-card">
      <Icon className="h-5 w-5 text-primary" />
      <div className="mt-2 font-display text-2xl font-bold">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

function Card({ title, children, className = "" }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-border bg-card p-5 shadow-card ${className}`}>
      <h3 className="mb-3 font-display text-sm font-semibold">{title}</h3>
      {children}
    </div>
  );
}

function Donut({ data }: { data: { name: string; value: number }[] }) {
  return (
    <>
      <ResponsiveContainer width="100%" height={180}>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={2}>
            {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
      <div className="mt-2 flex flex-wrap justify-center gap-3 text-xs">
        {data.map((d, i) => (
          <span key={d.name} className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
            {d.name} ({d.value})
          </span>
        ))}
      </div>
    </>
  );
}

function RankList({ rows }: { rows: { id: string; title: string; sub: string; value: string }[] }) {
  if (!rows.length) return <p className="py-6 text-center text-sm text-muted-foreground">No data yet.</p>;
  return (
    <ol className="space-y-2">
      {rows.map((r, i) => (
        <li key={r.id} className="flex items-center gap-3 text-sm">
          <span className="grid h-6 w-6 place-items-center rounded-full bg-primary-soft text-xs font-bold text-primary">{i + 1}</span>
          <div className="min-w-0 flex-1">
            <div className="truncate font-medium">{r.title}</div>
            <div className="text-xs text-muted-foreground">{r.sub}</div>
          </div>
          <span className="text-xs font-semibold">{r.value}</span>
        </li>
      ))}
    </ol>
  );
}
