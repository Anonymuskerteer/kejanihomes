import { createFileRoute } from "@tanstack/react-router";
import { getServerAppOrigin } from "@/lib/app-url";

// POST /api/public/resend-activation { email }
// Re-sends a 6-digit activation code to an account that hasn't been activated yet. Always returns ok.
export const Route = createFileRoute("/api/public/resend-activation")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const b = (await request.json().catch(() => ({}))) as { email?: string };
          const email = (b.email ?? "").trim().toLowerCase();
          if (!/^[^\s@,()]+@[^\s@,()]+\.[^\s@,()]+$/.test(email)) return Response.json({ ok: true });
          const origin = getServerAppOrigin(request.url);

          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          const { data: prof } = await supabaseAdmin.from("profiles").select("id, full_name").ilike("email", email).maybeSingle();
          if (!prof) return Response.json({ ok: true });
          const { data: u } = await supabaseAdmin.auth.admin.getUserById(prof.id);
          if (!u.user || u.user.email_confirmed_at) return Response.json({ ok: true });

          const { data, error } = await supabaseAdmin.auth.admin.generateLink({
            type: "magiclink",
            email,
            options: { redirectTo: `${origin}/activate` },
          });
          if (error) return Response.json({ ok: true });
          const link = data.properties?.action_link;
          const code = data.properties?.email_otp;
          if (!link || !code) return Response.json({ ok: true });

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
            subject: `${code} is your Kejani Homes activation code`,
            html: `
              <div style="font-family:Arial,sans-serif;background:#fff;padding:32px;max-width:560px;margin:0 auto">
                <h1 style="color:#317E3D;font-size:22px;margin:0 0 12px">Activate your Kejani Homes account</h1>
                <p style="text-align:center;margin:24px 0;font-size:34px;letter-spacing:10px;font-weight:700;color:#317E3D">${code}</p>
                <p style="text-align:center;margin:24px 0">
                  <a href="${link}" style="background:#317E3D;color:#fff;text-decoration:none;padding:12px 24px;border-radius:10px;font-weight:600;display:inline-block">Activate &amp; open Kejani Homes</a>
                </p>
                <p style="color:#999;font-size:12px">— Kejani Homes</p>
              </div>`,
            text: `Your Kejani Homes activation code is ${code}. Or activate here: ${link}`,
          });
          return Response.json({ ok: true });
        } catch (err) {
          console.error("[resend-activation] failed:", err);
          return Response.json({ ok: true });
        }
      },
    },
  },
});
