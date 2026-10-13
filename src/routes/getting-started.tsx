import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { useAuth } from "@/lib/use-auth";
import { Button } from "@/components/ui/button";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import {
  Building2,
  Camera,
  CheckCircle2,
  MessageCircle,
  Search,
  SlidersHorizontal,
} from "lucide-react";

export const Route = createFileRoute("/getting-started")({
  validateSearch: z.object({ role: z.enum(["tenant", "landlord"]).optional() }),
  head: () => ({ meta: [{ title: "Getting started — Kejani Homes" }] }),
  component: GettingStartedPage,
});

const guides = {
  tenant: {
    title: "Find a home that feels like kejani.",
    intro: "Search, compare and reach landlords directly. Here's how to get started.",
    steps: [
      {
        icon: Search,
        title: "Search available homes",
        description:
          "Browse by town, estate or property name. Open filters to narrow by rent, bedrooms and property type.",
      },
      {
        icon: SlidersHorizontal,
        title: "Compare and save",
        description:
          "Check photos, amenities and location details, then save promising homes to your favourites.",
      },
      {
        icon: MessageCircle,
        title: "Ask the landlord",
        description:
          "Open a listing and start a direct conversation to ask questions or arrange a viewing.",
      },
    ],
    action: "Browse homes",
    to: "/browse" as const,
  },
  landlord: {
    title: "Get your rental in front of tenants.",
    intro: "Create a clear listing and keep interested tenants in one place.",
    steps: [
      {
        icon: Building2,
        title: "Complete your profile and listing details",
        description:
          "Add a profile photo, then enter the rent, location, rooms, amenities and a clear description of your property.",
      },
      {
        icon: Camera,
        title: "Add photos and pin the location",
        description:
          "Upload clear photos, then place the map pin accurately. Review the listing before submitting.",
      },
      {
        icon: CheckCircle2,
        title: "Submit and answer enquiries",
        description:
          "Your listing goes through review before publication. Use Messages to reply to interested tenants.",
      },
    ],
    action: "List a property",
    to: "/list-property" as const,
  },
} as const;

function GettingStartedPage() {
  const { role: accountRole } = useAuth();
  const search = Route.useSearch();
  const navigate = useNavigate();
  const role = search.role ?? (accountRole === "landlord" ? "landlord" : "tenant");
  const guide = guides[role];

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="container-page flex-1 py-12 md:py-16">
        <section className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold text-primary">Your Kejani Homes guide</p>
          <h1 className="mt-3 font-display text-3xl font-bold tracking-tight md:text-4xl">
            A simple start, step by step.
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            Choose the guide that fits what you're here to do.
          </p>
          <div className="mx-auto mt-6 inline-flex rounded-xl bg-secondary p-1">
            {(["tenant", "landlord"] as const).map((option) => (
              <button
                key={option}
                type="button"
                aria-pressed={role === option}
                onClick={() => navigate({ to: "/getting-started", search: { role: option } })}
                className={`rounded-lg px-4 py-2 text-sm font-medium capitalize transition ${
                  role === option ? "bg-background text-foreground shadow" : "text-muted-foreground"
                }`}
              >
                {option === "landlord" ? "Landlord / Agent" : "Tenant"}
              </button>
            ))}
          </div>
        </section>

        <section className="mx-auto mt-10 max-w-4xl">
          <div className="rounded-3xl border border-border bg-card p-6 shadow-card md:p-8">
            <h2 className="font-display text-2xl font-bold">{guide.title}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{guide.intro}</p>
            <ol className="mt-8 grid gap-4 md:grid-cols-3">
              {guide.steps.map((step, index) => (
                <li key={step.title} className="rounded-2xl border border-border bg-background p-5">
                  <div className="flex items-center gap-3">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary">
                      <step.icon className="h-5 w-5" />
                    </span>
                    <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Step {index + 1}
                    </span>
                  </div>
                  <h3 className="mt-4 font-display text-base font-semibold">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {step.description}
                  </p>
                </li>
              ))}
            </ol>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Button asChild size="lg">
                <Link to={guide.to}>{guide.action}</Link>
              </Button>
              {role === "landlord" && (
                <Button asChild variant="outline" size="lg">
                  <Link to="/profile">Complete your profile</Link>
                </Button>
              )}
              <Button asChild variant="outline" size="lg">
                <Link to="/chat">Open Messages</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
