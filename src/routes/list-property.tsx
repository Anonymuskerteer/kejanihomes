import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export const Route = createFileRoute("/list-property")({
  head: () => ({ meta: [{ title: "List your property — Kejani Homes" }] }),
  component: ListPropertyPage,
});

function ListPropertyPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="container-page flex-1 py-16">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-primary text-primary-foreground"><Plus className="h-7 w-7" /></div>
          <h1 className="mt-5 font-display text-3xl font-bold tracking-tight md:text-4xl">List your property in minutes</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Create a free landlord account to publish your first listing. Add photos, set the rent and start receiving qualified tenants right away.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg"><Link to="/auth">Create landlord account</Link></Button>
            <Button asChild size="lg" variant="outline"><Link to="/how-it-works">How it works</Link></Button>
          </div>
        </div>

        <div className="mt-16 grid gap-5 md:grid-cols-3">
          {[
            ["Reach tenants faster", "Thousands of Kenyans search Kejani Homes every day."],
            ["Free to list", "Pay nothing to publish — only upgrade for premium visibility."],
            ["Full control", "Edit, pause or mark as rented at any time from your dashboard."],
          ].map(([t, b]) => (
            <div key={t} className="rounded-2xl border border-border bg-card p-6 shadow-card">
              <div className="font-display text-lg font-semibold">{t}</div>
              <p className="mt-1 text-sm text-muted-foreground">{b}</p>
            </div>
          ))}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
