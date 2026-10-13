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
  const [changingActivationEmail, setChangingActivationEmail] = useState(false);

  const changeActivationEmail = () => {
    setAwaitingCode(false);
    setCode("");
    setMode("signup");
    setChangingActivationEmail(true);
  };

  const resend = async () => {
    const { error } = await supabase.auth.resend({
      type: "signup",
      email: email.trim().toLowerCase(),
      options: { emailRedirectTo: `${window.location.origin}/activate` },
    });
    if (error) {
      toast.error(error.message);
      return false;
    }
    toast.success("A new activation code has been sent to your email.");
    return true;
  };

  const verifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const { error } = await supabase.auth.verifyOtp({ email: email.trim().toLowerCase(), token: code, type: "signup" });
      if (error) throw error;
      toast.success("Account activated — welcome!");
      navigate({ to: "/getting-started", search: { role } });
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
          if (await resend()) setAwaitingCode(true);
          return;
        }
        if (error && /banned/i.test(error.message)) throw new Error("This account has been deactivated. Contact support.");
        if (error) throw error;
        toast.success("Welcome back!");
        navigate({ to: "/dashboard" });
      } else {
        if (!/^[a-z0-9._%+-]+@(gmail\.com|googlemail\.com|yahoo\.com|yahoo\.co\.[a-z]{2}|ymail\.com)$/i.test(email.trim()))
          throw new Error("Please use a valid Gmail or Yahoo email address.");
        if (!/^(\+?254|0)[17]\d{8}$/.test(phone.replace(/\s/g, ""))) throw new Error("A valid phone number is required");
        const normalizedEmail = email.trim().toLowerCase();
        const res = await fetch("/api/public/signup", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ email: normalizedEmail, password, full_name: fullName, phone, role }),
        });
        let out: {
          ok: boolean;
          code?: string;
          error?: string;
          welcomeEmailSent?: boolean;
          confirmationRequired?: boolean;
        };
        try {
          out = await res.json();
        } catch {
          throw new Error("The sign-up service returned an invalid response. Please try again later.");
        }
        if (!res.ok || !out.ok) {
          if (out.code === "EMAIL_ALREADY_REGISTERED") {
            throw new Error("This email is already registered. Sign in or reset your password.");
          }
          if (out.code !== "SIGNUP_NOT_CONFIGURED") {
            throw new Error(out.error ?? "Could not create account. Please try again.");
          }

          const { data, error } = await supabase.auth.signUp({
            email: normalizedEmail,
            password,
            options: {
              data: {
                full_name: fullName.trim(),
                phone: phone.replace(/\s/g, ""),
                role,
              },
              emailRedirectTo: `${window.location.origin}/activate`,
            },
          });
          if (error) {
            if (
              error.code === "user_already_exists" ||
              /already registered|already exists/i.test(error.message)
            ) {
              throw new Error("This email is already registered. Sign in or reset your password.");
            }
            throw error;
          }
          if (data.user?.identities?.length === 0) {
            throw new Error("This email is already registered. Sign in or reset your password.");
          }
          if (!data.user) throw new Error("Could not create account. Please try again.");
          if (!data.session) {
            setAwaitingCode(true);
            setChangingActivationEmail(false);
            toast.success("Check your email for a code to activate your account.");
            return;
          }

          toast.success("Your account is ready.");
          if (role === "landlord") toast.info("Please add your profile photo to complete your account.");
          navigate({ to: "/getting-started", search: { role } });
          return;
        }
        if (out.confirmationRequired) {
          setAwaitingCode(true);
          setChangingActivationEmail(false);
          toast.success("Check your email for a code to activate your account.");
          return;
        }
        const { error: signInErr } = await supabase.auth.signInWithPassword({ email: normalizedEmail, password });
        if (signInErr) throw signInErr;
        if (out.welcomeEmailSent) {
          toast.success("Welcome to Kejani Homes! We've sent a welcome email.");
        } else {
          toast.info("Your account is ready, but we couldn't send the welcome email. You can continue using Kejani Homes.");
        }
        if (role === "landlord") {
          toast.info("Please add your profile photo to complete your account.");
        }
        navigate({ to: "/getting-started", search: { role } });
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
                  Enter the activation code sent to <strong>{email}</strong>, or use the link in the email. If it does not arrive, check your spam folder or resend it.
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
                  <button type="button" className="text-muted-foreground hover:text-foreground" onClick={changeActivationEmail}>
                    Change email
                  </button>
                  <button type="button" className="text-primary hover:underline" disabled={busy} onClick={resend}>
                    Resend code
                  </button>
                </div>
              </form>
            ) : (
            <form className="mt-6 space-y-4" onSubmit={submit}>
              {changingActivationEmail && (
                <p className="rounded-xl border border-border bg-secondary/50 p-3 text-sm text-muted-foreground">
                  Correct the email below and create a new activation request. The earlier unverified request will remain inactive.
                </p>
              )}
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
              <div className="flex items-center justify-between text-xs">
                <Link to="/forgot-password" className="text-primary hover:underline">
                  Forgot password?
                </Link>
                {mode === "signin" && (
                  <button
                    type="button"
                    onClick={() => setMode("signup")}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    Need an account?
                  </button>
                )}
              </div>
            </form>
            )}
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
