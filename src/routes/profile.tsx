import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { User, Heart, Star, CalendarDays, KeyRound, LogOut, Loader2, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { TenantShell } from "@/components/tenant-shell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/use-auth";
import { uploadFiles } from "@/lib/upload";

export const Route = createFileRoute("/profile")({
  head: () => ({ meta: [{ title: "Your profile — Kejani Homes" }] }),
  component: ProfilePage,
});

function ProfilePage() {
  const { user, role, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const isTenant = !!user && role !== "landlord" && role !== "admin";

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: savedCount = 0 } = useQuery({
    queryKey: ["saved-count", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { count } = await supabase
        .from("saved_properties")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user!.id);
      return count ?? 0;
    },
  });

  const { data: reviewCount = 0 } = useQuery({
    queryKey: ["review-count", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { count } = await supabase
        .from("reviews")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user!.id);
      return count ?? 0;
    },
  });

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name ?? "");
      setPhone(profile.phone ?? "");
      setEmail(profile.email ?? user?.email ?? "");
    } else if (user) {
      setEmail(user.email ?? "");
    }
  }, [profile, user]);

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .upsert({ id: user.id, full_name: fullName, phone, email });
      if (error) throw error;
      if (email !== user.email) {
        const { error: eErr } = await supabase.auth.updateUser({ email });
        if (eErr) throw eErr;
        toast.success("Profile saved — check your inbox to confirm the new email.");
      } else {
        toast.success("Profile saved");
      }
      qc.invalidateQueries({ queryKey: ["profile", user.id] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save profile");
    } finally {
      setSaving(false);
    }
  };

  const onAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f || !user) return;
    setUploading(true);
    try {
      const [url] = await uploadFiles("review-photos", user.id, [f]);
      const { error } = await supabase.from("profiles").upsert({ id: user.id, avatar_url: url });
      if (error) throw error;
      toast.success("Photo updated");
      qc.invalidateQueries({ queryKey: ["profile", user.id] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const changePassword = async () => {
    const pw = prompt("Enter a new password (min 6 characters)");
    if (!pw) return;
    if (pw.length < 6) return toast.error("Password too short");
    const { error } = await supabase.auth.updateUser({ password: pw });
    if (error) return toast.error(error.message);
    toast.success("Password updated");
  };

  const doSignOut = async () => {
    await signOut();
    navigate({ to: "/" });
  };

  const joined = profile?.created_at
    ? new Date(profile.created_at)
    : user?.created_at
      ? new Date(user.created_at)
      : new Date();

  const inner = !user || loading ? (
    <div className="container-page py-20 text-center text-sm text-muted-foreground">Loading…</div>
  ) : (
    <div className="container-page py-8">
      <header className="flex items-center gap-3">
        <User className="h-6 w-6 text-primary" />
        <h1 className="font-display text-2xl font-bold tracking-tight md:text-3xl">Your profile</h1>
      </header>

      <div className="mt-6 grid gap-4 md:grid-cols-6">
        {/* Identity card — spans full width */}
        <section className="md:col-span-6 rounded-2xl border border-border bg-card p-6 shadow-card transition hover:shadow-elevated">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative">
              <div className="grid h-20 w-20 place-items-center overflow-hidden rounded-full bg-primary-soft text-primary">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <User className="h-8 w-8" />
                )}
              </div>
              <label className="absolute -bottom-1 -right-1 grid h-8 w-8 cursor-pointer place-items-center rounded-full bg-primary text-primary-foreground shadow-soft hover:bg-primary/90">
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                <input type="file" accept="image/*" className="hidden" onChange={onAvatar} disabled={uploading} />
              </label>
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-display text-xl font-bold">{fullName || "Add your name"}</div>
              <div className="mt-0.5 text-xs uppercase tracking-wider text-muted-foreground">
                {role} · joined {joined.toLocaleDateString(undefined, { month: "short", year: "numeric" })}
              </div>
            </div>
          </div>
        </section>

        {/* Personal info */}
        <section className="md:col-span-4 rounded-2xl border border-border bg-card p-6 shadow-card transition hover:shadow-elevated">
          <h2 className="font-display text-base font-semibold">Personal information</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">Update how landlords can reach you.</p>
          <form onSubmit={saveProfile} className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label="Full name">
              <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </Field>
            <Field label="Phone">
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+2547…" />
            </Field>
            <Field label="Email">
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </Field>
            <div className="flex items-end">
              <Button type="submit" disabled={saving} className="w-full">
                {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving…</> : "Save changes"}
              </Button>
            </div>
          </form>
        </section>

        {/* Account actions */}
        <section className="md:col-span-2 rounded-2xl border border-border bg-card p-6 shadow-card transition hover:shadow-elevated">
          <h2 className="font-display text-base font-semibold">Account</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">Security & session.</p>
          <div className="mt-4 flex flex-col gap-2">
            <Button variant="outline" onClick={changePassword} className="justify-start">
              <KeyRound className="mr-2 h-4 w-4" /> Change password
            </Button>
            <Button variant="outline" onClick={doSignOut} className="justify-start">
              <LogOut className="mr-2 h-4 w-4" /> Sign out
            </Button>
          </div>
        </section>

        {/* Stats grid */}
        <Stat icon={Heart} label="Saved homes" value={savedCount} className="md:col-span-2" />
        <Stat icon={Star} label="Reviews posted" value={reviewCount} className="md:col-span-2" />
        <Stat
          icon={CalendarDays}
          label="Member since"
          value={joined.toLocaleDateString(undefined, { month: "short", year: "numeric" })}
          className="md:col-span-2"
        />
      </div>

      <div className="mt-8 text-center text-xs text-muted-foreground">
        Looking for saved homes? <Link to="/wishlist" className="text-primary underline">Go to saved</Link>
      </div>
    </div>
  );

  if (isTenant) {
    return <TenantShell>{inner}</TenantShell>;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">{inner}</main>
      <SiteFooter />
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  className,
}: {
  icon: typeof User;
  label: string;
  value: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-2xl border border-border bg-card p-5 shadow-card transition hover:shadow-elevated ${className ?? ""}`}>
      <Icon className="h-5 w-5 text-primary" />
      <div className="mt-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="font-display text-2xl font-bold">{value}</div>
    </div>
  );
}
