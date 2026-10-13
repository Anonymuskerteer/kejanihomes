import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Search, ShieldCheck, Activity } from "lucide-react";
import { AdminShell, timeAgo } from "@/components/admin-shell";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/use-auth";

export const Route = createFileRoute("/admin/logs")({
  head: () => ({
    meta: [
      { title: "Logs — Kejani Homes Admin" },
      { name: "description", content: "System access and site activity logs for Kejani Homes." },
      { property: "og:title", content: "Logs — Kejani Homes Admin" },
      { property: "og:description", content: "System access and site activity logs for Kejani Homes." },
    ],
  }),
  component: LogsPage,
});

const LABELS: Record<string, string> = {
  sign_in: "Signed in",
  sign_out: "Signed out",
  session_expired: "Session expired (inactive)",
  password_reset: "Reset password",
  password_changed: "Changed password",
  password_reset_forced: "Admin required password reset",
  listing_taken: "Listing marked as taken",
  message_sent: "Chat message sent",
  account_created: "Account created",
  account_activated: "Account activated",
  account_confirmed: "Sign-up approved",
  account_deactivated: "Account deactivated",
  account_banned: "Account banned",
  account_unbanned: "Ban lifted",
  account_deleted: "Account deleted",
  listing_created: "New listing posted",
  listing_approved: "Listing approved",
  listing_rejected: "Listing rejected",
  listing_pending: "Listing sent for review",
  review_posted: "Rating & review posted",
  property_saved: "Property saved to wishlist",
};

function LogsPage() {
  const { user, role } = useAuth();
  const [tab, setTab] = useState<"system" | "activity">("system");
  const [q, setQ] = useState("");

  const { data } = useQuery({
    queryKey: ["admin-logs", tab],
    enabled: !!user && role === "admin",
    refetchInterval: 60_000,
    queryFn: async () => {
      const { data: logs, error: logsError } = await supabase
        .from("activity_logs")
        .select("*")
        .eq("category", tab)
        .order("created_at", { ascending: false })
        .limit(5);
      if (logsError) throw logsError;

      const actorIds = [...new Set((logs ?? []).flatMap((log) => (log.actor_id ? [log.actor_id] : [])))];
      const { data: profiles, error: profilesError } = actorIds.length
        ? await supabase.from("profiles").select("id, full_name, email").in("id", actorIds)
        : { data: [], error: null };
      if (profilesError) throw profilesError;

      return { logs: logs ?? [], people: new Map((profiles ?? []).map((p) => [p.id, p])) };
    },
  });

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    return (data?.logs ?? []).filter((l) => {
      if (!term) return true;
      const who = l.actor_id ? data?.people.get(l.actor_id) : undefined;
      return [LABELS[l.action] ?? l.action, who?.full_name, who?.email, JSON.stringify(l.details)]
        .some((v) => (v ?? "").toLowerCase().includes(term));
    });
  }, [data, q]);

  return (
    <AdminShell title="Logs" subtitle="Who did what, and when.">
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <div className="inline-flex rounded-xl bg-secondary p-1 text-sm font-medium">
          <button onClick={() => setTab("system")} className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-1.5 ${tab === "system" ? "bg-background shadow" : "text-muted-foreground"}`}>
            <ShieldCheck className="h-4 w-4" />System logs
          </button>
          <button onClick={() => setTab("activity")} className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-1.5 ${tab === "activity" ? "bg-background shadow" : "text-muted-foreground"}`}>
            <Activity className="h-4 w-4" />Activity logs
          </button>
        </div>
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by person, email or event" className="pl-10" />
        </div>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        {tab === "system"
          ? "Sign-ins, sign-outs, expired sessions, password resets and account changes."
          : "New listings, ratings, saves and other activity on the website."}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">Showing the latest 5 entries.</p>

      <div className="mt-4 divide-y divide-border rounded-2xl border border-border bg-card">
        {rows.length === 0 && <p className="p-8 text-center text-sm text-muted-foreground">No log entries yet.</p>}
        {rows.map((l) => {
          const who = l.actor_id ? data?.people.get(l.actor_id) : undefined;
          const d = (l.details ?? {}) as Record<string, unknown>;
          const extra = [d.title, d.email && l.actor_id !== l.target_id ? d.email : null, d.rating ? `${d.rating}★` : null, d.reason]
            .filter(Boolean)
            .join(" · ");
          return (
            <div key={l.id} className="flex flex-wrap items-center gap-3 p-4 text-sm">
              <span className={`h-2 w-2 shrink-0 rounded-full ${/banned|deleted|deactivated|rejected|expired/.test(l.action) ? "bg-destructive" : "bg-primary"}`} />
              <div className="min-w-0 flex-1">
                <div className="font-medium">{LABELS[l.action] ?? l.action}</div>
                <div className="truncate text-xs text-muted-foreground">
                  {who ? `${who.full_name || who.email}` : "System"}
                  {extra ? ` — ${extra}` : ""}
                </div>
              </div>
              <span className="text-xs text-muted-foreground" title={new Date(l.created_at).toLocaleString("en-KE")}>
                {timeAgo(l.created_at)}
              </span>
            </div>
          );
        })}
      </div>
    </AdminShell>
  );
}
