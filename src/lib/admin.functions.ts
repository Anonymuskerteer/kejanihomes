import { createServerFn } from "@tanstack/react-start";

// Creates the platform admin user if not already present.
// Safe to call multiple times — no-op when admin already exists.
export const seedAdmin = createServerFn({ method: "POST" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const email = "admin@kejanihomes.com";
  const password = "Password";

  const { data: list, error: listErr } =
    await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 });
  if (listErr) throw listErr;

  const existing = list.users.find((u) => u.email === email);
  if (existing) {
    return { ok: true, alreadyExists: true, userId: existing.id };
  }

  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: "Kejani Admin", role: "admin" },
  });
  if (error) throw error;

  return { ok: true, alreadyExists: false, userId: data.user?.id };
});
