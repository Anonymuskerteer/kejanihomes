import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Sign in — Kejani Homes" }] }),
  component: AuthPage,
});

function AuthPage() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [role, setRole] = useState<"tenant" | "landlord">("tenant");
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="container-page flex flex-1 items-center justify-center py-16">
        <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl border border-border bg-card shadow-card md:grid-cols-2">
          <div className="hidden bg-primary p-10 text-primary-foreground md:flex md:flex-col md:justify-between">
            <div>
              <Link to="/" className="font-display text-xl font-bold">Kejani<span className="text-accent">Homes</span></Link>
              <h2 className="mt-10 font-display text-3xl font-bold leading-tight">Welcome to Kenya's friendliest housing platform.</h2>
              <p className="mt-3 text-sm text-primary-foreground/80">Save your favourite homes, contact landlords directly, and get notified when new homes match your taste.</p>
            </div>
            <p className="text-xs text-primary-foreground/60">Demo only — connect Lovable Cloud to enable real authentication.</p>
          </div>

          <div className="p-8 md:p-10">
            <div className="inline-flex rounded-xl bg-secondary p-1 text-sm font-medium">
              <button onClick={() => setMode("signin")} className={`rounded-lg px-4 py-1.5 ${mode === "signin" ? "bg-background shadow" : "text-muted-foreground"}`}>Sign in</button>
              <button onClick={() => setMode("signup")} className={`rounded-lg px-4 py-1.5 ${mode === "signup" ? "bg-background shadow" : "text-muted-foreground"}`}>Create account</button>
            </div>
            <h1 className="mt-6 font-display text-2xl font-bold">{mode === "signin" ? "Welcome back" : "Create your account"}</h1>
            <p className="text-sm text-muted-foreground">{mode === "signin" ? "Sign in to view contacts and save homes." : "Join Kejani Homes in under a minute."}</p>

            <form className="mt-6 space-y-4" onSubmit={(e) => e.preventDefault()}>
              {mode === "signup" && (
                <div className="space-y-1.5"><Label>Full name</Label><Input placeholder="Achieng Otieno" /></div>
              )}
              <div className="space-y-1.5"><Label>Email</Label><Input type="email" placeholder="you@example.com" /></div>
              <div className="space-y-1.5"><Label>Password</Label><Input type="password" placeholder="••••••••" /></div>

              {mode === "signup" && (
                <div className="space-y-1.5">
                  <Label>I am a</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {(["tenant", "landlord"] as const).map((r) => (
                      <button type="button" key={r} onClick={() => setRole(r)}
                        className={`rounded-xl border px-4 py-3 text-left text-sm transition ${role === r ? "border-primary bg-primary-soft" : "border-border hover:border-primary"}`}>
                        <div className="font-semibold capitalize">{r === "landlord" ? "Landlord / Agent" : "Tenant"}</div>
                        <div className="text-xs text-muted-foreground">{r === "landlord" ? "List and manage properties" : "Search and save homes"}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <Button className="w-full" size="lg" type="submit">
                {mode === "signin" ? "Sign in" : "Create account"}
              </Button>
              {mode === "signin" && (
                <button type="button" className="text-xs text-primary hover:underline">Forgot password?</button>
              )}
            </form>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
