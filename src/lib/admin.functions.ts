import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type Ctx = { supabase: { rpc: (fn: "has_role", args: { _user_id: string; _role: "admin" }) => PromiseLike<{ data: boolean | null; error: { message: string } | null }> }; userId: string };

async function assertAdmin(context: Ctx) {
  const { data, error } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
  if (error) throw new Error(`Unable to verify admin access: ${error.message}`);
  if (!data) throw new Error("Forbidden");
}

export interface AdminUser {
  id: string;
  email: string | null;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  role: string | null;
  account_status: string;
  email_confirmed: boolean | null;
  banned: boolean;
  last_sign_in_at: string | null;
  created_at: string;
}

export const listAdminUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context as unknown as Ctx);
    const hasAdminKey = !!(process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY);
    if (!hasAdminKey) {
      const [profilesRes, rolesRes] = await Promise.all([
        context.supabase.from("profiles").select("*"),
        context.supabase.from("user_roles").select("user_id, role"),
      ]);
      if (profilesRes.error) throw new Error(`Unable to load user profiles: ${profilesRes.error.message}`);
      if (rolesRes.error) throw new Error(`Unable to load user roles: ${rolesRes.error.message}`);

      const roleMap = new Map(rolesRes.data.map((r) => [r.user_id, r.role]));
      return {
        users: profilesRes.data.map((p) => ({
          id: p.id,
          email: p.email,
          full_name: p.full_name,
          phone: p.phone,
          avatar_url: p.avatar_url,
          role: roleMap.get(p.id) ?? null,
          account_status: p.account_status,
          email_confirmed: null,
          banned: false,
          last_sign_in_at: null,
          created_at: p.created_at,
        })),
        bans: [],
        elevatedAccessAvailable: false,
      };
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [profilesRes, rolesRes, authRes, bansRes] = await Promise.all([
      supabaseAdmin.from("profiles").select("*"),
      supabaseAdmin.from("user_roles").select("user_id, role"),
      supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
      supabaseAdmin.from("user_bans").select("*").order("created_at", { ascending: false }),
    ]);
    if (profilesRes.error) throw new Error(`Unable to load user profiles: ${profilesRes.error.message}`);
    if (rolesRes.error) throw new Error(`Unable to load user roles: ${rolesRes.error.message}`);
    if (authRes.error) throw new Error(`Unable to load authentication users: ${authRes.error.message}`);
    if (bansRes.error) throw new Error(`Unable to load user bans: ${bansRes.error.message}`);

    const authMap = new Map(authRes.data.users.map((u) => [u.id, u]));
    const roleMap = new Map(rolesRes.data.map((r) => [r.user_id, r.role]));
    const users: AdminUser[] = profilesRes.data.map((p) => {
      const a = authMap.get(p.id);
      const bannedUntil = (a as { banned_until?: string } | undefined)?.banned_until;
      return {
        id: p.id,
        email: p.email,
        full_name: p.full_name,
        phone: p.phone,
        avatar_url: p.avatar_url,
        role: roleMap.get(p.id) ?? null,
        account_status: p.account_status,
        email_confirmed: !!a?.email_confirmed_at,
        banned: !!bannedUntil && new Date(bannedUntil).getTime() > Date.now(),
        last_sign_in_at: a?.last_sign_in_at ?? null,
        created_at: p.created_at,
      };
    });
    return { users, bans: bansRes.data, elevatedAccessAvailable: true };
  });

const actionSchema = z.object({
  userId: z.string().uuid(),
  action: z.enum(["activate", "deactivate", "delete", "ban", "confirm", "force_reset"]),
  reason: z.string().max(300).optional(),
});

export const adminUserAction = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => actionSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context as unknown as Ctx);
    if (data.userId === context.userId) throw new Error("You can't change your own account here.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: prof } = await supabaseAdmin.from("profiles").select("email, phone, full_name").eq("id", data.userId).maybeSingle();
    const auth = supabaseAdmin.auth.admin;
    const FOREVER = "876000h";

    if (data.action === "activate") {
      await auth.updateUserById(data.userId, { ban_duration: "none", email_confirm: true });
      await supabaseAdmin.from("profiles").update({ account_status: "active" }).eq("id", data.userId);
    } else if (data.action === "confirm") {
      await auth.updateUserById(data.userId, { email_confirm: true });
    } else if (data.action === "deactivate") {
      await auth.updateUserById(data.userId, { ban_duration: FOREVER });
      await supabaseAdmin.from("profiles").update({ account_status: "deactivated" }).eq("id", data.userId);
    } else if (data.action === "ban") {
      await auth.updateUserById(data.userId, { ban_duration: FOREVER });
      await supabaseAdmin.from("profiles").update({ account_status: "banned" }).eq("id", data.userId);
      await supabaseAdmin.from("user_bans").insert({
        email: prof?.email?.toLowerCase() ?? null,
        phone: prof?.phone || null,
        reason: data.reason ?? null,
        banned_by: context.userId,
      });
    } else if (data.action === "force_reset") {
      if (!prof) throw new Error("User profile could not be found.");
      const { error } = await supabaseAdmin
        .from("profiles")
        .update({ must_reset_password: true })
        .eq("id", data.userId);
      if (error) throw new Error(`Could not require a password reset: ${error.message}`);
    } else if (data.action === "delete") {
      const { error } = await auth.deleteUser(data.userId);
      if (error) throw new Error(error.message);
    }

    const { error: logError } = await supabaseAdmin.from("activity_logs").insert({
      actor_id: context.userId,
      category: "system",
      action:
        data.action === "force_reset"
          ? "password_reset_forced"
          : `account_${data.action === "confirm" ? "confirmed" : data.action + (data.action.endsWith("e") ? "d" : "ned")}`,
      target_type: "user",
      target_id: data.userId,
      details: { email: prof?.email ?? null, name: prof?.full_name ?? null, reason: data.reason ?? null },
    });
    if (logError) throw new Error(`Action completed, but the activity log could not be saved: ${logError.message}`);
    return { ok: true };
  });

export const adminUnban = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ banId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context as unknown as Ctx);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: ban } = await supabaseAdmin.from("user_bans").select("*").eq("id", data.banId).maybeSingle();
    if (!ban) return { ok: true };
    await supabaseAdmin.from("user_bans").delete().eq("id", data.banId);
    if (ban.email) {
      const { data: prof } = await supabaseAdmin.from("profiles").select("id").ilike("email", ban.email).maybeSingle();
      if (prof) {
        await supabaseAdmin.auth.admin.updateUserById(prof.id, { ban_duration: "none" });
        await supabaseAdmin.from("profiles").update({ account_status: "active" }).eq("id", prof.id);
      }
    }
    await supabaseAdmin.from("activity_logs").insert({
      actor_id: context.userId,
      category: "system",
      action: "account_unbanned",
      target_type: "ban",
      target_id: data.banId,
      details: { email: ban.email, phone: ban.phone },
    });
    return { ok: true };
  });
