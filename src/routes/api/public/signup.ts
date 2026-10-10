import { createFileRoute } from "@tanstack/react-router";

// POST /api/public/signup { email, password, full_name, phone, role, origin }
// Creates an unconfirmed account and emails a 6-digit activation code + activation link via Gmail SMTP.
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
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fail("Enter a valid email.");
          if (password.length < 6 || password.length > 72) return fail("Password must be 6–72 characters.");
          if (!full_name) return fail("Full name is required.");
          if (!/^(\+?254|0)[17]\d{8}$/.test(phone)) return fail("A valid phone number is required.");

          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          const { data, error } = await supabaseAdmin.auth.admin.generateLink({
            type: "signup",
            email,
            password,
            options: { data: { full_name, phone, role }, redirectTo: `${origin}/activate` },
          });
          if (error) return fail(error.message);
          const link = data.properties?.action_link;
          const code = data.properties?.email_otp;
          if (!link || !code) return fail("Could not create activation code.", 500);

          const nodemailer = (await import("nodemailer")).default;
          const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST!,
            port: Number(process.env.SMTP_PORT ?? 587),
            secure: false,
            auth: { user: process.env.SMTP_USER!, pass: process.env.SMTP_PASS! },
          });
          const html = `
            <div style="font-family:Arial,sans-serif;background:#fff;padding:32px;max-width:560px;margin:0 auto">
              <h1 style="color:#317E3D;font-size:22px;margin:0 0 12px">Welcome to Kejani Homes, ${full_name.replace(/[<>&"]/g, "")}!</h1>
              <p style="color:#333;font-size:15px;line-height:1.5">Activate your account with this code:</p>
              <p style="text-align:center;margin:24px 0;font-size:34px;letter-spacing:10px;font-weight:700;color:#317E3D">${code}</p>
              <p style="color:#333;font-size:15px;line-height:1.5">Or open the website directly with one tap:</p>
              <p style="text-align:center;margin:24px 0">
                <a href="${link}" style="background:#317E3D;color:#fff;text-decoration:none;padding:12px 24px;border-radius:10px;font-weight:600;display:inline-block">Activate &amp; open Kejani Homes</a>
              </p>
              <p style="color:#999;font-size:12px;margin-top:32px">If you didn't create this account, ignore this email.<br>— Kejani Homes</p>
            </div>`;
          await transporter.sendMail({
            from: process.env.SMTP_FROM!,
            to: email,
            subject: `${code} is your Kejani Homes activation code`,
            html,
            text: `Your Kejani Homes activation code is ${code}. Or activate here: ${link}`,
          });
          return Response.json({ ok: true });
        } catch (err) {
          console.error("[signup] failed:", err);
          return fail("Could not create account. Try again.", 500);
        }
      },
    },
  },
});
