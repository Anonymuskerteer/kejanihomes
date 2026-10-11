import { createFileRoute } from "@tanstack/react-router";

// POST /api/public/password-reset-verify  { email, code, password }
// Verifies the 4-digit OTP (max 5 attempts, 10 min expiry) and sets the new password.
export const Route = createFileRoute("/api/public/password-reset-verify")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const fail = (msg: string, status = 400) => Response.json({ ok: false, error: msg }, { status });
        try {
          const body = (await request.json().catch(() => ({}))) as {
            email?: string;
            code?: string;
            password?: string;
          };
          const email = (body.email ?? "").trim().toLowerCase();
          const code = (body.code ?? "").trim();
          const password = body.password ?? "";
          if (!email || !/^\d{4}$/.test(code)) return fail("Enter the 4-digit code from your email.");
          if (password.length < 6 || password.length > 72) return fail("Password must be 6–72 characters.");

          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          const { data: row } = await supabaseAdmin
            .from("password_reset_codes")
            .select("*")
            .eq("email", email)
            .eq("used", false)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();
          if (!row || new Date(row.expires_at).getTime() < Date.now())
            return fail("Code expired or invalid. Request a new one.");
          if (row.attempts >= 5) return fail("Too many attempts. Request a new code.");

          const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`${email}:${code}`));
          const hash = Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
          if (hash !== row.code_hash) {
            await supabaseAdmin.from("password_reset_codes").update({ attempts: row.attempts + 1 }).eq("id", row.id);
            return fail(`Incorrect code. ${4 - row.attempts} attempt(s) left.`);
          }

          const { data: prof } = await supabaseAdmin.from("profiles").select("id").ilike("email", email).maybeSingle();
          if (!prof) return fail("Account not found.");
          const { error } = await supabaseAdmin.auth.admin.updateUserById(prof.id, { password });
          if (error) return fail(error.message);
          await supabaseAdmin.from("password_reset_codes").update({ used: true }).eq("id", row.id);
          await supabaseAdmin.from("activity_logs").insert({
            actor_id: prof.id,
            category: "system",
            action: "password_reset",
            target_type: "user",
            target_id: prof.id,
            details: { email },
          });
          return Response.json({ ok: true });
        } catch (err) {
          console.error("[password-reset-verify] failed:", err);
          return fail("Something went wrong. Try again.", 500);
        }
      },
    },
  },
});
