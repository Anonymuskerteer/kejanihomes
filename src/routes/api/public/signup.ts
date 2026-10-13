import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

// POST /api/public/signup { email, password, full_name, phone, role, origin }
// Creates an account through public Supabase Auth; the database trigger creates its profile and role.
export const Route = createFileRoute("/api/public/signup")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const fail = (error: string, status = 400) => Response.json({ ok: false, error }, { status });
        try {
          const b = (await request.json().catch(() => ({}))) as Record<string, string | undefined>;
          const email = (b.email ?? "").trim().toLowerCase();
          const password = b.password ?? "";
          const full_name = (b.full_name ?? "").trim().slice(0, 100);
          const phone = (b.phone ?? "").replace(/\s/g, "");
          const role = b.role === "landlord" ? "landlord" : "tenant";
          const origin = new URL(request.url).origin;
          if (!/^[a-z0-9._%+-]+@(gmail\.com|googlemail\.com|yahoo\.com|yahoo\.co\.[a-z]{2}|ymail\.com)$/.test(email))
            return fail("Please use a valid Gmail or Yahoo email address.");
          if (password.length < 6 || password.length > 72) return fail("Password must be 6–72 characters.");
          if (!full_name) return fail("Full name is required.");
          if (!/^(\+?254|0)[17]\d{8}$/.test(phone)) return fail("A valid phone number is required.");

          const supabaseUrl = process.env.SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL;
          const publishableKey =
            process.env.SUPABASE_PUBLISHABLE_KEY ||
            process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
            import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
          const missingConfig = [
            ...(!supabaseUrl ? ["SUPABASE_URL"] : []),
            ...(!publishableKey ? ["SUPABASE_PUBLISHABLE_KEY"] : []),
          ];
          if (missingConfig.length > 0) {
            console.error(`[signup] missing server configuration: ${missingConfig.join(", ")}`);
            return Response.json(
              {
                ok: false,
                code: "SIGNUP_NOT_CONFIGURED",
                error: "Sign-up is temporarily unavailable because server configuration is incomplete. Please contact support.",
              },
              { status: 503 },
            );
          }

          if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
            const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
            const normPhone = phone.replace(/^(\+?254|0)/, "");
            const { data: bans, error: bansError } = await supabaseAdmin
              .from("user_bans")
              .select("email, phone")
              .or(`email.eq.${email},phone.ilike.%${normPhone}`);
            if (bansError) {
              console.error("[signup] registration eligibility check failed:", bansError);
              return fail("Unable to validate registration right now. Please try again.", 503);
            }
            if (bans && bans.length) return fail("This email or phone number is not allowed to register. Contact support.", 403);
            const { data: phoneOwners, error: phoneError } = await supabaseAdmin
              .from("profiles")
              .select("id, phone")
              .ilike("phone", `%${normPhone}`);
            if (phoneError) {
              console.error("[signup] phone uniqueness check failed:", phoneError);
              return fail("Unable to validate registration right now. Please try again.", 503);
            }
            const taken = (phoneOwners ?? []).some(
              (p) => (p.phone ?? "").replace(/\s/g, "").replace(/^(\+?254|0)/, "") === normPhone,
            );
            if (taken) return fail("This phone number is already registered to another account.", 409);
          }

          const supabasePublic = createClient<Database>(supabaseUrl!, publishableKey!, {
            auth: { persistSession: false, autoRefreshToken: false },
          });
          const { data: signup, error } = await supabasePublic.auth.signUp({
            email,
            password,
            options: {
              data: { full_name, phone, role },
              emailRedirectTo: `${origin}/activate`,
            },
          });
          if (error) {
            if (
              error.code === "email_exists" ||
              error.code === "user_already_exists" ||
              /already registered|already exists/i.test(error.message)
            ) {
              return Response.json(
                {
                  ok: false,
                  code: "EMAIL_ALREADY_REGISTERED",
                  error: "This email is already registered. Sign in or reset your password.",
                },
                { status: 409 },
              );
            }
            console.error("[signup] Supabase Auth rejected registration:", error);
            return fail(error.message);
          }
          if (signup.user?.identities?.length === 0) {
            return Response.json(
              {
                ok: false,
                code: "EMAIL_ALREADY_REGISTERED",
                error: "This email is already registered. Sign in or reset your password.",
              },
              { status: 409 },
            );
          }
          if (!signup.user) return fail("Could not create account. Please try again.", 502);

          const safeName = full_name.replace(/[<>&"]/g, "");
          const html = `
            <div style="font-family:Arial,sans-serif;background:#fff;padding:32px;max-width:560px;margin:0 auto">
              <h1 style="color:#317E3D;font-size:24px;margin:0 0 12px">Karibu Kejani Homes, ${safeName}!</h1>
              <p style="color:#333;font-size:15px;line-height:1.6">Your ${role === "landlord" ? "landlord / agent" : "tenant"} account is ready.</p>
              <p style="color:#333;font-size:15px;line-height:1.6">${
                role === "landlord"
                  ? "Add your profile photo, then list your first property so tenants across Mwea and Kenya can find it."
                  : "Browse verified homes, save your favourites and chat directly with landlords."
              }</p>
              <p style="text-align:center;margin:28px 0">
                <a href="${origin}/auth" style="background:#317E3D;color:#fff;text-decoration:none;padding:12px 24px;border-radius:10px;font-weight:600;display:inline-block">Open Kejani Homes</a>
              </p>
              <p style="color:#999;font-size:12px;margin-top:32px">— The Kejani Homes team</p>
            </div>`;
          let welcomeEmailSent = false;
          const smtpConfigured = ["SMTP_HOST", "SMTP_USER", "SMTP_PASS", "SMTP_FROM"].every(
            (name) => !!process.env[name]?.trim(),
          );
          if (smtpConfigured) {
            try {
              const nodemailer = (await import("nodemailer")).default;
              const smtpPort = Number(process.env.SMTP_PORT ?? 587);
              const transporter = nodemailer.createTransport({
                host: process.env.SMTP_HOST!,
                port: smtpPort,
                secure: smtpPort === 465,
                auth: { user: process.env.SMTP_USER!, pass: process.env.SMTP_PASS! },
              });
              await transporter.sendMail({
                from: process.env.SMTP_FROM!,
                to: email,
                subject: "Welcome to Kejani Homes 🏡",
                html,
                text: `Karibu Kejani Homes, ${safeName}! Your account is ready: ${origin}/auth`,
              });
              welcomeEmailSent = true;
            } catch (e) {
              console.error("[signup] welcome email failed:", e);
            }
          }
          return Response.json({
            ok: true,
            welcomeEmailSent,
            confirmationRequired: !signup.session,
          });
        } catch (err) {
          console.error("[signup] failed:", err);
          return fail("Could not create account. Try again.", 500);
        }
      },
    },
  },
});
