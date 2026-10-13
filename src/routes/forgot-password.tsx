import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [
      { title: "Reset password — Kejani Homes" },
      { name: "description", content: "Reset your Kejani Homes password using a secure link sent to your email." },
      { property: "og:title", content: "Reset password — Kejani Homes" },
      { property: "og:description", content: "Reset your Kejani Homes password using a secure email link." },
    ],
  }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  const requestLink = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setBusy(true);
    try {
      const res = await fetch("/api/public/password-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      const json = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!res.ok || !json.ok) throw new Error(json.error ?? "Could not send reset link");
      setSent(true);
      toast.success("If that email has an account, a reset link is on its way.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not send reset link");
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
          {sent ? (
            <div className="mt-4 space-y-4 text-sm text-muted-foreground">
              <p>
                We sent a password reset link to <strong>{email}</strong>. Open it to choose a new password. The link
                expires in 1 hour.
              </p>
              <Button variant="outline" className="w-full" disabled={busy} onClick={() => requestLink()}>
                {busy ? "Sending…" : "Resend link"}
              </Button>
            </div>
          ) : (
            <>
              <p className="mt-2 text-sm text-muted-foreground">
                Enter the email you signed up with and we'll send you a link to reset your password.
              </p>
              <form onSubmit={requestLink} className="mt-6 space-y-4">
                <div className="space-y-1.5">
                  <Label>Email</Label>
                  <Input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
                </div>
                <Button type="submit" size="lg" className="w-full" disabled={busy}>
                  {busy ? "Sending…" : "Send reset link"}
                </Button>
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
