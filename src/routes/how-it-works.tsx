import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Search, Home, KeyRound, ShieldCheck, BadgeCheck, Flag, Star } from "lucide-react";

export const Route = createFileRoute("/how-it-works")({
  head: () => ({ meta: [{ title: "How Kejani Homes works" }] }),
  component: HowPage,
});

function HowPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <section className="container-page py-16 text-center">
          <h1 className="mx-auto max-w-2xl font-display text-4xl font-bold tracking-tight md:text-5xl">
            Kejani Homes makes renting <span className="text-primary">honest and easy</span>.
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">Verified landlords, real reviews and direct contact — no agency fees, no middlemen.</p>
        </section>

        <section className="container-page grid gap-6 md:grid-cols-3">
          {[
            { icon: Search, title: "Discover homes", body: "Filter by county, estate, price, type and amenities. Save the ones you love." },
            { icon: Home, title: "Visit confidently", body: "See real photos, ratings on water, security, cleanliness and more." },
            { icon: KeyRound, title: "Move in", body: "Talk to landlords directly via call, WhatsApp or email." },
          ].map((s) => (
            <div key={s.title} className="rounded-3xl border border-border bg-card p-7 shadow-card">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary text-primary-foreground"><s.icon className="h-6 w-6" /></div>
              <h3 className="mt-5 font-display text-xl font-semibold">{s.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{s.body}</p>
            </div>
          ))}
        </section>

        <section className="container-page mt-20">
          <h2 className="font-display text-2xl font-bold">Trust & safety, baked in</h2>
          <div className="mt-6 grid gap-5 md:grid-cols-2">
            {[
              { icon: ShieldCheck, title: "Listing approval", body: "Every listing is reviewed before going live." },
              { icon: BadgeCheck, title: "Verified badges", body: "Landlords and agents we've verified carry a green badge." },
              { icon: Flag, title: "Report listings", body: "Spot something off? Report it in one tap, our team responds within 24h." },
              { icon: Star, title: "Honest reviews", body: "Tenants rate water, security, cleanliness, noise and more." },
            ].map((s) => (
              <div key={s.title} className="flex items-start gap-4 rounded-2xl border border-border bg-card p-6">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary"><s.icon className="h-5 w-5" /></div>
                <div>
                  <div className="font-display text-base font-semibold">{s.title}</div>
                  <p className="text-sm text-muted-foreground">{s.body}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
