import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/password-input";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [
      { title: "Reset password — Kejani Homes" },
      { name: "description", content: "Reset your Kejani Homes password with a 6-digit code sent to your email." },
      { property: "og:title", content: "Reset password — Kejani Homes" },
      { property: "og:description", content: "Reset your Kejani Homes password with a 6-digit code." },
    ],
  }),
  validateSearch: z.object({ email: z.string().optional(), code: z.string().optional() }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [step, setStep] = useState<"email" | "code">("email");
  const [code, setCode] = useState("");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [busy, setBusy] = useState(false);
  const search = Route.useSearch();

  // Direct link from the email: prefill email + code and jump to the new-password step.
  useEffect(() => {
    if (search.email && search.code && /^\d{6}$/.test(search.code)) {
      setEmail(search.email);
      setCode(search.code);
      setStep("code");
    }
  }, [search.email, search.code]);

  const requestCode = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setBusy(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
        redirectTo: `${window.location.origin}/forgot-password`,
      });
      if (error) throw error;
      setCode("");
      setStep("code");
      toast.success("If that email has an account, a 6-digit code is on its way.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not send code");
    } finally {
      setBusy(false);
    }
  };

  const verify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pw !== pw2) return toast.error("Passwords don't match");
    setBusy(true);
    try {
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email: email.trim().toLowerCase(),
        token: code,
        type: "recovery",
      });
      if (verifyError) throw verifyError;
      const { error: updateError } = await supabase.auth.updateUser({ password: pw });
      if (updateError) throw updateError;
      toast.success("Password updated.");
      navigate({ to: "/dashboard" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not reset password");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="container-page flex flex-1 items-center justify-center py-20">
        <div className="w-full max-w-md rounded-3xl border border-border bg-card p-8 shadow-card">
          <h1 className="font-display text-2xl font-bold">Forgot your password?</h1>
          {step === "email" ? (
            <>
              <p className="mt-2 text-sm text-muted-foreground">
                Enter the email you signed up with and we'll send you a 4-digit code.
              </p>
              <form onSubmit={requestCode} className="mt-6 space-y-4">
                <div className="space-y-1.5">
                  <Label>Email</Label>
                  <Input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
                </div>
                <Button type="submit" size="lg" className="w-full" disabled={busy}>
                  {busy ? "Sending…" : "Send code"}
                </Button>
              </form>
            </>
          ) : (
            <>
              <p className="mt-2 text-sm text-muted-foreground">
                Enter the 6-digit code sent to <strong>{email}</strong> and choose a new password.
              </p>
              <form onSubmit={verify} className="mt-6 space-y-4">
                <div className="space-y-1.5">
                  <Label>6-digit code</Label>
                  <Input
                    required
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    pattern="\d{6}"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="••••••"
                    className="h-14 text-center text-2xl font-bold tracking-[0.6em]"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>New password</Label>
                  <PasswordInput required minLength={6} value={pw} onChange={(e) => setPw(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Confirm new password</Label>
                  <PasswordInput required minLength={6} value={pw2} onChange={(e) => setPw2(e.target.value)} />
                </div>
                <Button type="submit" size="lg" className="w-full" disabled={busy || code.length !== 6}>
                  {busy ? "Updating…" : "Reset password"}
                </Button>
                <div className="flex justify-between text-xs">
                  <button type="button" className="text-muted-foreground hover:text-foreground" onClick={() => setStep("email")}>
                    Change email
                  </button>
                  <button type="button" className="text-primary hover:underline" disabled={busy} onClick={() => requestCode()}>
                    Resend code
                  </button>
                </div>
              </form>
            </>
          )}
          <p className="mt-6 text-center text-xs text-muted-foreground">
            Remembered it? <Link to="/auth" className="text-primary hover:underline">Back to sign in</Link>
          </p>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
