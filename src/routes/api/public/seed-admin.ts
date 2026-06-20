import { createFileRoute } from "@tanstack/react-router";

// One-off seed of the platform admin account. Idempotent.
export const Route = createFileRoute("/api/public/seed-admin")({
  server: {
    handlers: {
      POST: async () => {
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const email = "admin@kejanihomes.com";
        const password = "Password";

        const { data: list, error: listErr } =
          await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 });
        if (listErr) {
          return Response.json({ ok: false, error: listErr.message }, { status: 500 });
        }
        const existing = list.users.find((u) => u.email === email);
        if (existing) {
          return Response.json({ ok: true, alreadyExists: true, userId: existing.id });
        }
        const { data, error } = await supabaseAdmin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: { full_name: "Kejani Admin", role: "admin" },
        });
        if (error) {
          return Response.json({ ok: false, error: error.message }, { status: 500 });
        }
        return Response.json({ ok: true, alreadyExists: false, userId: data.user?.id });
      },
    },
  },
});
