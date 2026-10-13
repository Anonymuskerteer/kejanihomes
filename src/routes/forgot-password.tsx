import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/password-input";
<<<<<<< Updated upstream
=======
import { supabase } from "@/integrations/supabase/client";
import { getBrowserAppOrigin } from "@/lib/app-url";
>>>>>>> Stashed changes

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [
      { title: "Reset password — Kejani Homes" },
<<<<<<< Updated upstream
      { name: "description", content: "Reset your Kejani Homes password with a 4-digit code sent to your email." },
      { property: "og:title", content: "Reset password — Kejani Homes" },
      { property: "og:description", content: "Reset your Kejani Homes password with a 4-digit code." },
=======
      { name: "description", content: "Reset your Kejani Homes password using a secure email link." },
      { property: "og:title", content: "Reset password — Kejani Homes" },
      { property: "og:description", content: "Reset your Kejani Homes password using a secure email link." },
>>>>>>> Stashed changes
    ],
  }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [step, setStep] = useState<"email" | "sent" | "code">("email");
  const [code, setCode] = useState("");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [busy, setBusy] = useState(false);

<<<<<<< Updated upstream
  // Direct link from the email: prefill email + code and jump to the new-password step.
  useEffect(() => {
    if (search.email && search.code && /^\d{4}$/.test(search.code)) {
      setEmail(search.email);
      setCode(search.code);
      setStep("code");
    }
  }, [search.email, search.code]);

  const requestCode = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setBusy(true);
    try {
      const res = await fetch("/api/public/password-reset", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      if (!res.ok) throw new Error("Could not send code");
      setStep("code");
      toast.success("If that email has an account, a 4-digit code is on its way.");
=======
  const requestResetLink = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setBusy(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
        redirectTo: `${getBrowserAppOrigin()}/reset-password`,
      });
      if (error) throw error;
      setCode("");
      setStep("sent");
      toast.success("If that email has an account, a password reset email is on its way.");
>>>>>>> Stashed changes
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
      const res = await fetch("/api/public/password-reset-verify", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), code, password: pw }),
      });
      const data = (await res.json()) as { ok: boolean; error?: string };
      if (!data.ok) throw new Error(data.error ?? "Could not reset password");
      toast.success("Password updated. Please sign in.");
      navigate({ to: "/auth" });
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
                Enter your account email and we’ll send you a secure link to choose a new password.
              </p>
              <form onSubmit={requestResetLink} className="mt-6 space-y-4">
                <div className="space-y-1.5">
                  <Label>Email</Label>
                  <Input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
                </div>
                <Button type="submit" size="lg" className="w-full" disabled={busy}>
                  {busy ? "Sending…" : "Email reset link"}
                </Button>
              </form>
            </>
          ) : step === "sent" ? (
            <div className="mt-4 space-y-4">
              <p className="text-sm text-muted-foreground">
                If <strong>{email}</strong> has a Kejani Homes account, we’ve sent a password reset email. Open the link in that email to choose a new password. Check your spam folder if it doesn’t arrive.
              </p>
              <Button type="button" size="lg" className="w-full" disabled={busy} onClick={() => void requestResetLink()}>
                {busy ? "Sending…" : "Resend reset email"}
              </Button>
              <div className="flex justify-between text-xs">
                <button type="button" className="text-muted-foreground hover:text-foreground" onClick={() => setStep("email")}>
                  Change email
                </button>
                <button type="button" className="text-primary hover:underline" onClick={() => setStep("code")}>
                  Enter email code instead
                </button>
              </div>
            </div>
          ) : (
            <>
              <p className="mt-2 text-sm text-muted-foreground">
<<<<<<< Updated upstream
                Enter the code sent to <strong>{email}</strong> (valid for 10 minutes) and choose a new password.
=======
                If the reset link does not work, enter the 6-digit code from the same email and choose a new password.
>>>>>>> Stashed changes
              </p>
              <form onSubmit={verify} className="mt-6 space-y-4">
                <div className="space-y-1.5">
                  <Label>4-digit code</Label>
                  <Input
                    required
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={4}
                    pattern="\d{4}"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 4))}
                    placeholder="••••"
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
                <Button type="submit" size="lg" className="w-full" disabled={busy || code.length !== 4}>
                  {busy ? "Updating…" : "Reset password"}
                </Button>
                <div className="flex justify-between text-xs">
                  <button type="button" className="text-muted-foreground hover:text-foreground" onClick={() => setStep("email")}>
                    Back
                  </button>
                  <button type="button" className="text-primary hover:underline" disabled={busy} onClick={() => void requestResetLink()}>
                    Resend email
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
