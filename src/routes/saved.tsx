import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/saved")({
  head: () => ({ meta: [{ title: "Saved homes — Kejani Homes" }] }),
  component: SavedPage,
});

function SavedPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="container-page flex-1 py-16">
        <h1 className="font-display text-3xl font-bold tracking-tight">Saved homes</h1>
        <p className="mt-1 text-sm text-muted-foreground">Your wishlist will appear here once you sign in.</p>

        <div className="mt-10 rounded-3xl border border-dashed border-border bg-card p-12 text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-primary-soft text-primary"><Heart className="h-7 w-7" /></div>
          <h2 className="mt-4 font-display text-xl font-semibold">No saved homes yet</h2>
          <p className="mt-1 text-sm text-muted-foreground">Tap the heart on any listing to save it for later.</p>
          <div className="mt-6 flex justify-center gap-2">
            <Button asChild><Link to="/browse">Browse homes</Link></Button>
            <Button asChild variant="outline"><Link to="/auth">Sign in</Link></Button>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
