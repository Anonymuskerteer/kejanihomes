import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { z } from "zod";
import { useState } from "react";
import { toast } from "sonner";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/password-input";
import { supabase } from "@/integrations/supabase/client";

const searchSchema = z.object({
  mode: z.enum(["signin", "signup"]).optional(),
  role: z.enum(["tenant", "landlord"]).optional(),
});

export const Route = createFileRoute("/auth")({
  validateSearch: searchSchema,
  head: () => ({ meta: [{ title: "Sign in — Kejani Homes" }] }),
  component: AuthPage,
});

function AuthPage() {
  const search = useSearch({ from: "/auth" });
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">(search.mode ?? "signin");
  const [role, setRole] = useState<"tenant" | "landlord">(search.role ?? "tenant");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [awaitingCode, setAwaitingCode] = useState(false);
  const [code, setCode] = useState("");

  const resend = async () => {
    await fetch("/api/public/resend-activation", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: email.trim().toLowerCase() }),
    });
    toast.success("A new activation code has been sent to your email.");
  };

  const verifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const { error } = await supabase.auth.verifyOtp({ email: email.trim().toLowerCase(), token: code, type: "email" });
      if (error) throw error;
      toast.success("Account activated — welcome!");
      navigate({ to: role === "landlord" ? "/dashboard" : "/browse" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Invalid or expired code");
    } finally {
      setBusy(false);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error && /not confirmed/i.test(error.message)) {
          await resend();
          setAwaitingCode(true);
          return;
        }
        if (error && /banned/i.test(error.message)) throw new Error("This account has been deactivated. Contact support.");
        if (error) throw error;
        toast.success("Welcome back!");
        navigate({ to: "/dashboard" });
      } else {
        if (!/^(\+?254|0)[17]\d{8}$/.test(phone.replace(/\s/g, ""))) throw new Error("A valid phone number is required");
        const res = await fetch("/api/public/signup", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ email, password, full_name: fullName, phone, role }),
        });
        const out = (await res.json()) as { ok: boolean; error?: string };
        if (!out.ok) throw new Error(out.error ?? "Could not create account");
        toast.success("Check your email for your activation code.");
        setAwaitingCode(true);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="container-page flex flex-1 items-center justify-center py-16">
        <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl border border-border bg-card shadow-card md:grid-cols-2">
          <div className="hidden bg-primary p-10 text-primary-foreground md:flex md:flex-col md:justify-between">
            <div>
              <Link to="/" className="font-display text-xl font-bold">
                Kejani<span className="text-accent">Homes</span>
              </Link>
              <h2 className="mt-10 font-display text-3xl font-bold leading-tight">
                {role === "landlord"
                  ? "Reach thousands of tenants across Kenya."
                  : "Find a home that feels like kejani."}
              </h2>
              <p className="mt-3 text-sm text-primary-foreground/80">
                {role === "landlord"
                  ? "List your units, manage enquiries and grow your rental business from one dashboard."
                  : "Save your favourite homes, contact landlords directly and read honest reviews from real tenants."}
              </p>
            </div>
            <p className="text-xs text-primary-foreground/70">
              Built for Mwea and serving all 47 counties.
            </p>
          </div>

          <div className="p-8 md:p-10">
            <div className="inline-flex rounded-xl bg-secondary p-1 text-sm font-medium">
              <button
                onClick={() => setMode("signin")}
                className={`rounded-lg px-4 py-1.5 ${mode === "signin" ? "bg-background shadow" : "text-muted-foreground"}`}
              >
                Sign in
              </button>
              <button
                onClick={() => setMode("signup")}
                className={`rounded-lg px-4 py-1.5 ${mode === "signup" ? "bg-background shadow" : "text-muted-foreground"}`}
              >
                Create account
              </button>
            </div>
            <h1 className="mt-6 font-display text-2xl font-bold">
              {mode === "signin" ? "Welcome back" : "Create your account"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {mode === "signin"
                ? "Sign in to view contacts and save homes."
                : "Join Kejani Homes in under a minute."}
            </p>

            {awaitingCode ? (
              <form className="mt-6 space-y-4" onSubmit={verifyCode}>
                <p className="text-sm text-muted-foreground">
                  We emailed an activation code to <strong>{email}</strong>. Enter it below, or tap the link in the email.
                </p>
                <Input
                  required
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="••••••"
                  className="h-14 text-center text-2xl font-bold tracking-[0.5em]"
                />
                <Button className="w-full" size="lg" type="submit" disabled={busy || code.length < 6}>
                  {busy ? "Verifying…" : "Activate account"}
                </Button>
                <div className="flex justify-between text-xs">
                  <button type="button" className="text-muted-foreground hover:text-foreground" onClick={() => setAwaitingCode(false)}>
                    Back
                  </button>
                  <button type="button" className="text-primary hover:underline" disabled={busy} onClick={resend}>
                    Resend code
                  </button>
                </div>
              </form>
            ) : (
            <form className="mt-6 space-y-4" onSubmit={submit}>
              {mode === "signup" && (
                <>
                  <div className="space-y-1.5">
                    <Label>Full name</Label>
                    <Input
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Achieng Otieno"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Phone number</Label>
                    <Input
                      required
                      type="tel"
                      pattern="^(\+?254|0)[17]\d{8}$"
                      title="Enter a valid Kenyan number, e.g. 0712345678 or +254712345678"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+2547…"
                    />
                  </div>
                </>
              )}
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Password</Label>
                <PasswordInput
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>

              {mode === "signup" && (
                <div className="space-y-1.5">
                  <Label>I am a</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {(["tenant", "landlord"] as const).map((r) => (
                      <button
                        type="button"
                        key={r}
                        onClick={() => setRole(r)}
                        className={`rounded-xl border px-4 py-3 text-left text-sm transition ${role === r ? "border-primary bg-primary-soft" : "border-border hover:border-primary"}`}
                      >
                        <div className="font-semibold capitalize">
                          {r === "landlord" ? "Landlord / Agent" : "Tenant"}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {r === "landlord"
                            ? "List and manage properties"
                            : "Search and save homes"}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <Button className="w-full" size="lg" type="submit" disabled={busy}>
                {busy
                  ? "Please wait…"
                  : mode === "signin"
                    ? "Sign in"
                    : "Create account"}
              </Button>
              {mode === "signin" && (
                <div className="flex items-center justify-between text-xs">
                  <Link to="/forgot-password" className="text-primary hover:underline">
                    Forgot password?
                  </Link>
                  <button
                    type="button"
                    onClick={() => setMode("signup")}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    Need an account?
                  </button>
                </div>
              )}
            </form>
            )}
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
