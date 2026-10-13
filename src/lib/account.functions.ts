import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// Completes an admin-forced password reset for the signed-in user.
export const completeForcedReset = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ password: z.string().min(6).max(72) }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.updateUserById(context.userId, { password: data.password });
    if (error) throw new Error(error.message);
    await supabaseAdmin.from("profiles").update({ must_reset_password: false }).eq("id", context.userId);
    await supabaseAdmin.from("activity_logs").insert({
      actor_id: context.userId,
      category: "system",
      action: "password_changed",
      target_type: "user",
      target_id: context.userId,
      details: { forced: true },
    });
    return { ok: true };
  });

// Opens (or reuses) a direct conversation between the signed-in user and the support admin.
export const openSupportChat = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: admin } = await supabaseAdmin
      .from("user_roles").select("user_id").eq("role", "admin").order("created_at").limit(1).maybeSingle();
    if (!admin) throw new Error("Support is unavailable right now.");
    if (admin.user_id === context.userId) throw new Error("You are the admin.");
    const { data: existing } = await supabaseAdmin
      .from("conversations").select("id")
      .eq("tenant_id", context.userId).eq("landlord_id", admin.user_id).is("property_id", null)
      .limit(1).maybeSingle();
    if (existing) return { id: existing.id };
    const { data: created, error } = await supabaseAdmin
      .from("conversations").insert({ tenant_id: context.userId, landlord_id: admin.user_id, property_id: null })
      .select("id").single();
    if (error) throw new Error(error.message);
    return { id: created.id };
  });
