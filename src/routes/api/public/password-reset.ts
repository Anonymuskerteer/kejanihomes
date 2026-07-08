import { createFileRoute } from "@tanstack/react-router";

// POST /api/public/password-reset  { email, redirectTo }
// Uses admin generateLink to mint a recovery token, then emails it via Gmail SMTP.
// Always returns 200 so we don't leak account existence.
export const Route = createFileRoute("/api/public/password-reset")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = (await request.json().catch(() => ({}))) as {
            email?: string;
            redirectTo?: string;
          };
          const email = (body.email ?? "").trim().toLowerCase();
          const redirectTo = body.redirectTo ?? "";
          if (!email || !redirectTo) {
            return Response.json({ ok: true });
          }

          const { supabaseAdmin } = await import(
            "@/integrations/supabase/client.server"
          );

          const { data, error } = await supabaseAdmin.auth.admin.generateLink({
            type: "recovery",
            email,
            options: { redirectTo },
          });
          if (error) {
            console.error("[password-reset] generateLink error:", error.message);
            return Response.json({ ok: true });
          }
          const link = data?.properties?.action_link;
          if (!link) return Response.json({ ok: true });

          // Send via Gmail SMTP
          const nodemailer = (await import("nodemailer")).default;
          const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST!,
            port: Number(process.env.SMTP_PORT ?? 587),
            secure: false,
            auth: {
              user: process.env.SMTP_USER!,
              pass: process.env.SMTP_PASS!,
            },
          });

          const html = `
            <div style="font-family:Arial,sans-serif;background:#fff;padding:32px;max-width:560px;margin:0 auto">
              <h1 style="color:#317E3D;font-size:22px;margin:0 0 12px">Reset your password</h1>
              <p style="color:#333;font-size:15px;line-height:1.5">Hi there,</p>
              <p style="color:#333;font-size:15px;line-height:1.5">
                We received a request to reset the password for your Kejani Homes account.
                Click the button below to choose a new password. This link expires in 1 hour.
              </p>
              <p style="text-align:center;margin:28px 0">
                <a href="${link}" style="background:#317E3D;color:#fff;text-decoration:none;padding:12px 24px;border-radius:10px;font-weight:600;display:inline-block">Reset password</a>
              </p>
              <p style="color:#666;font-size:13px;line-height:1.5">
                If the button doesn't work, copy and paste this URL:<br>
                <a href="${link}" style="color:#317E3D;word-break:break-all">${link}</a>
              </p>
              <p style="color:#999;font-size:12px;margin-top:32px">
                If you didn't request this, you can safely ignore this email.<br>
                — Kejani Homes
              </p>
            </div>
          `;

          await transporter.sendMail({
            from: process.env.SMTP_FROM!,
            to: email,
            subject: "Reset your Kejani Homes password",
            html,
            text: `Reset your Kejani Homes password: ${link}`,
          });

          return Response.json({ ok: true });
        } catch (err) {
          console.error("[password-reset] failed:", err);
          // Still return ok to avoid account enumeration
          return Response.json({ ok: true });
        }
      },
    },
  },
});
