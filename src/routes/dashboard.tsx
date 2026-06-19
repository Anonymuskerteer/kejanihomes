import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { Eye, Heart, Home, Star, Plus, Pencil, Trash2, BadgeCheck } from "lucide-react";
import { PROPERTIES, formatKES } from "@/lib/properties";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Landlord dashboard — Kejani Homes" }] }),
  component: DashboardPage,
});

function DashboardPage() {
  const mine = PROPERTIES.slice(0, 4);
  const totals = {
    listings: mine.length,
    active: mine.filter((p) => p.available).length,
    views: mine.reduce((a, p) => a + p.views, 0),
    saves: mine.reduce((a, p) => a + p.saves, 0),
    rating: (mine.reduce((a, p) => a + p.rating, 0) / mine.length).toFixed(1),
  };

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="container-page flex-1 py-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold tracking-tight">Landlord dashboard</h1>
            <p className="mt-1 text-sm text-muted-foreground">Manage your listings and track tenant interest.</p>
          </div>
          <Button asChild size="lg"><Link to="/list-property"><Plus className="mr-1.5 h-4 w-4" /> Add property</Link></Button>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-5">
          <Stat icon={Home} label="Total listings" value={totals.listings} />
          <Stat icon={BadgeCheck} label="Active" value={totals.active} />
          <Stat icon={Eye} label="Total views" value={totals.views.toLocaleString()} />
          <Stat icon={Heart} label="Saves" value={totals.saves} />
          <Stat icon={Star} label="Avg rating" value={totals.rating} />
        </div>

        <section className="mt-10">
          <h2 className="font-display text-xl font-bold">Your properties</h2>
          <div className="mt-4 overflow-hidden rounded-2xl border border-border bg-card">
            <table className="w-full text-sm">
              <thead className="bg-secondary/60 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 text-left">Property</th>
                  <th className="px-4 py-3 text-left">Rent</th>
                  <th className="hidden px-4 py-3 text-left md:table-cell">Views</th>
                  <th className="hidden px-4 py-3 text-left md:table-cell">Saves</th>
                  <th className="hidden px-4 py-3 text-left md:table-cell">Rating</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {mine.map((p) => (
                  <tr key={p.id} className="border-t border-border">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <img src={p.cover} alt="" className="h-12 w-16 rounded-lg object-cover" />
                        <div>
                          <Link to="/property/$id" params={{ id: p.id }} className="font-medium hover:underline">{p.title}</Link>
                          <div className="text-xs text-muted-foreground">{p.estate}, {p.town}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-semibold">{formatKES(p.rent)}</td>
                    <td className="hidden px-4 py-3 md:table-cell">{p.views.toLocaleString()}</td>
                    <td className="hidden px-4 py-3 md:table-cell">{p.saves}</td>
                    <td className="hidden px-4 py-3 md:table-cell">⭐ {p.rating.toFixed(1)}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${p.available ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"}`}>
                        {p.available ? "Available" : "Rented"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button className="grid h-8 w-8 place-items-center rounded-md hover:bg-secondary"><Pencil className="h-4 w-4" /></button>
                        <button className="grid h-8 w-8 place-items-center rounded-md text-destructive hover:bg-destructive/10"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
      <SiteFooter />
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
