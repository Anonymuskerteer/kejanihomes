import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Search, MoreHorizontal, CheckCircle2, PauseCircle, Ban, Trash2, MailCheck, Undo2, KeyRound } from "lucide-react";
import { AdminShell, timeAgo } from "@/components/admin-shell";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { listAdminUsers, adminUserAction, adminUnban, type AdminUser } from "@/lib/admin.functions";
import { useAuth } from "@/lib/use-auth";

export const Route = createFileRoute("/admin/users")({
  head: () => ({
    meta: [
      { title: "Users — Kejani Homes Admin" },
      { name: "description", content: "Manage Kejani Homes user accounts." },
      { property: "og:title", content: "Users — Kejani Homes Admin" },
      { property: "og:description", content: "Manage Kejani Homes user accounts." },
    ],
  }),
  component: UsersPage,
});

type Action = "activate" | "deactivate" | "delete" | "ban" | "confirm" | "force_reset";

function UsersPage() {
  const { user, role: myRole, loading: authLoading } = useAuth();
  const qc = useQueryClient();
  const fetchUsers = useServerFn(listAdminUsers);
  const act = useServerFn(adminUserAction);
  const unban = useServerFn(adminUnban);
  const [q, setQ] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sort, setSort] = useState("newest");

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["admin-users"],
    queryFn: () => fetchUsers(),
    enabled: !!user && myRole === "admin",
  });

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase().replace(/\s/g, "");
    let list = (data?.users ?? []).filter((u) => {
      if (roleFilter !== "all" && u.role !== roleFilter) return false;
      if (statusFilter === "unverified" ? u.email_confirmed !== false : statusFilter !== "all" && statusOf(u) !== statusFilter) return false;
      if (!term) return true;
      return [u.full_name, u.email, u.phone].some((v) => (v ?? "").toLowerCase().replace(/\s/g, "").includes(term));
    });
    list = [...list].sort((a, b) =>
      sort === "name"
        ? (a.full_name ?? "").localeCompare(b.full_name ?? "")
        : sort === "role"
          ? (a.role ?? "").localeCompare(b.role ?? "")
          : sort === "oldest"
            ? a.created_at.localeCompare(b.created_at)
            : b.created_at.localeCompare(a.created_at),
    );
    return list;
  }, [data, q, roleFilter, statusFilter, sort]);

  const run = async (u: AdminUser, action: Action) => {
    let reason: string | undefined;
    if (action === "delete" && !confirm(`Permanently delete ${u.email}? This cannot be undone.`)) return;
    if (action === "ban") {
      const r = prompt(`Ban ${u.email} and ${u.phone || "their phone"} from registering. Reason (optional):`);
      if (r === null) return;
      reason = r || undefined;
    }
    if (action === "force_reset" && !confirm(`Require ${u.email} to set a new password the next time they sign in?`)) return;
    if (action === "deactivate" && !confirm(`Deactivate ${u.email}? They won't be able to sign in.`)) return;
    try {
      await act({ data: { userId: u.id, action, reason } });
      toast.success("Done");
      qc.invalidateQueries({ queryKey: ["admin-users"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Action failed");
    }
  };

  const counts = {
    all: data?.users.length,
    tenant: data?.users.filter((u) => u.role === "tenant").length,
    landlord: data?.users.filter((u) => u.role === "landlord").length,
    admin: data?.users.filter((u) => u.role === "admin").length,
  };

  return (
    <AdminShell title="Users" subtitle="Review, activate, deactivate, ban or delete accounts.">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {(["all", "tenant", "landlord", "admin"] as const).map((r) => (
          <button
            key={r}
            onClick={() => setRoleFilter(r)}
            className={`rounded-2xl border p-4 text-left transition ${roleFilter === r ? "border-primary bg-primary-soft" : "border-border bg-card hover:border-primary/50"}`}
          >
            <div className="text-xs capitalize text-muted-foreground">{r === "all" ? "All users" : r === "landlord" ? "Landlords / Agents" : `${r}s`}</div>
            <div className="mt-1 font-display text-2xl font-bold">{counts[r] ?? "—"}</div>
          </button>
        ))}
      </div>

      {isError && (
        <div role="alert" className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm">
          <span>Could not load users: {error instanceof Error ? error.message : "An unexpected error occurred."}</span>
          <Button size="sm" variant="outline" onClick={() => void refetch()}>Try again</Button>
        </div>
      )}

      {data && !data.elevatedAccessAvailable && (
        <div className="mt-4 rounded-xl border border-accent/40 bg-accent/10 p-4 text-sm">
          Users are shown in read-only mode. Configure the server-only <code>SUPABASE_SERVICE_ROLE_KEY</code> or <code>SUPABASE_SECRET_KEY</code> to enable account actions and ban management.
        </div>
      )}

      <div className="mt-6 flex flex-col gap-3 md:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, email or phone number" className="pl-10" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="md:w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="unverified">Not activated</SelectItem>
            <SelectItem value="deactivated">Deactivated</SelectItem>
            <SelectItem value="banned">Banned</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sort} onValueChange={setSort}>
          <SelectTrigger className="md:w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest first</SelectItem>
            <SelectItem value="oldest">Oldest first</SelectItem>
            <SelectItem value="name">Name A–Z</SelectItem>
            <SelectItem value="role">By role</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="mt-4 overflow-x-auto rounded-2xl border border-border bg-card">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="bg-secondary/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3">Phone</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Joined</th>
              <th className="px-4 py-3">Last sign-in</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">Loading users…</td></tr>
            )}
            {!isLoading && !isError && authLoading && (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">Checking your account…</td></tr>
            )}
            {!isLoading && !isError && !authLoading && !user && (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">Sign in with an admin account to view users.</td></tr>
            )}
            {!isLoading && !isError && !authLoading && user && !myRole && (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">No account role was found. Refresh the page or contact an administrator.</td></tr>
            )}
            {!isLoading && !isError && !authLoading && user && myRole && myRole !== "admin" && (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">Admin access is required to view users.</td></tr>
            )}
            {!isLoading && !isError && !authLoading && myRole === "admin" && rows.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">No users match.</td></tr>
            )}
            {rows.map((u) => (
              <tr key={u.id} className="border-t border-border">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-full bg-primary-soft text-xs font-bold text-primary">
                      {u.avatar_url ? <img src={u.avatar_url} alt="" className="h-full w-full object-cover" /> : (u.full_name || u.email || "?").slice(0, 1).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="truncate font-medium">{u.full_name || "—"}</div>
                      <div className="truncate text-xs text-muted-foreground">{u.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{u.phone || "—"}</td>
                <td className="px-4 py-3 capitalize">{u.role === "landlord" ? "Landlord/Agent" : u.role ?? "—"}</td>
                <td className="px-4 py-3"><StatusBadge u={u} /></td>
                <td className="px-4 py-3 text-muted-foreground">{timeAgo(u.created_at)}</td>
                <td className="px-4 py-3 text-muted-foreground">{timeAgo(u.last_sign_in_at)}</td>
                <td className="px-4 py-3 text-right">
                  {data?.elevatedAccessAvailable && u.id !== user?.id && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="icon" variant="ghost" aria-label="Actions"><MoreHorizontal className="h-4 w-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        {u.email_confirmed === false && (
                          <DropdownMenuItem onClick={() => run(u, "confirm")}><MailCheck className="mr-2 h-4 w-4" />Approve sign-up</DropdownMenuItem>
                        )}
                        {statusOf(u) !== "active" ? (
                          <DropdownMenuItem onClick={() => run(u, "activate")}><CheckCircle2 className="mr-2 h-4 w-4" />Activate</DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem onClick={() => run(u, "deactivate")}><PauseCircle className="mr-2 h-4 w-4" />Deactivate</DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => run(u, "force_reset")}><KeyRound className="mr-2 h-4 w-4" />Reset password</DropdownMenuItem>
                        {statusOf(u) !== "banned" && (
                          <DropdownMenuItem onClick={() => run(u, "ban")} className="text-destructive"><Ban className="mr-2 h-4 w-4" />Ban email & phone</DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => run(u, "delete")} className="text-destructive"><Trash2 className="mr-2 h-4 w-4" />Delete account</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {data?.elevatedAccessAvailable && <section className="mt-10">
        <h2 className="font-display text-xl font-bold">Banned emails & numbers</h2>
        <p className="text-sm text-muted-foreground">These can't register again until you lift the ban.</p>
        <div className="mt-3 divide-y divide-border rounded-2xl border border-border bg-card">
          {(data?.bans ?? []).length === 0 && <p className="p-6 text-center text-sm text-muted-foreground">No active bans.</p>}
          {(data?.bans ?? []).map((b) => (
            <div key={b.id} className="flex flex-wrap items-center justify-between gap-3 p-4 text-sm">
              <div>
                <div className="font-medium">{b.email || "—"} · {b.phone || "no phone"}</div>
                <div className="text-xs text-muted-foreground">{b.reason || "No reason given"} · {timeAgo(b.created_at)}</div>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={async () => {
                  await unban({ data: { banId: b.id } });
                  toast.success("Ban lifted");
                  qc.invalidateQueries({ queryKey: ["admin-users"] });
                }}
              >
                <Undo2 className="mr-1.5 h-4 w-4" />Unban
              </Button>
            </div>
          ))}
        </div>
      </section>}
    </AdminShell>
  );
}

function statusOf(u: AdminUser) {
  if (u.account_status === "banned") return "banned";
  if (u.account_status === "deactivated" || u.banned) return "deactivated";
  return "active";
}

function StatusBadge({ u }: { u: AdminUser }) {
  const s = statusOf(u);
  if (s === "active" && u.email_confirmed === false)
    return <span className="rounded-full bg-accent/25 px-2.5 py-1 text-xs font-semibold">Not activated</span>;
  const cls = s === "active" ? "bg-success/15 text-success" : s === "banned" ? "bg-destructive/15 text-destructive" : "bg-muted text-muted-foreground";
  return <span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${cls}`}>{u.email_confirmed === null ? `${s} · email status unavailable` : s}</span>;
}
