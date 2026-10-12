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
