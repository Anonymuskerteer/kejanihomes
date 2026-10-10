import { createFileRoute } from "@tanstack/react-router";

// Idempotent setup of the platform admin account. Migrates the old admin login if present.
export const Route = createFileRoute("/api/public/seed-admin")({
  server: {
    handlers: {
      POST: async () => {
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const email = "admin@kejanihomes.ke";
        const password = "Password123.";

        const { data: list, error: listErr } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 500 });
        if (listErr) return Response.json({ ok: false }, { status: 500 });

        const existing =
          list.users.find((u) => u.email === email) ??
          list.users.find((u) => u.email === "admin@kejanihomes.com");
        if (existing) {
          const { error } = await supabaseAdmin.auth.admin.updateUserById(existing.id, {
            email,
            password,
            email_confirm: true,
          });
          if (error) return Response.json({ ok: false, error: error.message }, { status: 500 });
          await supabaseAdmin.from("profiles").update({ email }).eq("id", existing.id);
          return Response.json({ ok: true, updated: true });
        }
        const { error } = await supabaseAdmin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: { full_name: "Kejani Admin", role: "admin" },
        });
        if (error) return Response.json({ ok: false, error: error.message }, { status: 500 });
        return Response.json({ ok: true, created: true });
      },
    },
  },
});
