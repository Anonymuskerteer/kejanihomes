import { createFileRoute } from "@tanstack/react-router";

// POST /api/public/password-reset  { email }
// Generates a 4-digit OTP, stores its hash, and emails it via Gmail SMTP.
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
                    if (!email) {
            return Response.json({ ok: true });
          }

          const { supabaseAdmin } = await import(
            "@/integrations/supabase/client.server"
          );

          // Only send to existing accounts (silently ignore others)
          const { data: prof } = await supabaseAdmin
            .from("profiles")
            .select("id")
            .ilike("email", email)
            .maybeSingle();
          if (!prof) return Response.json({ ok: true });

          const code = String(crypto.getRandomValues(new Uint32Array(1))[0] % 10000).padStart(4, "0");
          const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`${email}:${code}`));
          const code_hash = Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
          await supabaseAdmin.from("password_reset_codes").update({ used: true }).eq("email", email).eq("used", false);
          await supabaseAdmin.from("password_reset_codes").insert({
            email,
            code_hash,
            expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
          });

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

          const resetLink = `${new URL(request.url).origin}/forgot-password?email=${encodeURIComponent(email)}&code=${code}`;
          const html = `
            <div style="font-family:Arial,sans-serif;background:#fff;padding:32px;max-width:560px;margin:0 auto">
              <h1 style="color:#317E3D;font-size:22px;margin:0 0 12px">Your password reset code</h1>
              <p style="color:#333;font-size:15px;line-height:1.5">Use this code to reset your Kejani Homes password. It expires in 10 minutes.</p>
              <p style="text-align:center;margin:28px 0;font-size:36px;letter-spacing:12px;font-weight:700;color:#317E3D">${code}</p>
              <p style="text-align:center;margin:24px 0">
                <a href="${resetLink}" style="background:#317E3D;color:#fff;text-decoration:none;padding:12px 24px;border-radius:10px;font-weight:600;display:inline-block">Change my password</a>
              </p>
              <p style="color:#666;font-size:12px;line-height:1.5">Or copy this link: <a href="${resetLink}" style="color:#317E3D;word-break:break-all">${resetLink}</a></p>
              <p style="color:#999;font-size:12px;margin-top:32px">If you didn't request this, you can safely ignore this email.<br>— Kejani Homes</p>
            </div>
          `;

          await transporter.sendMail({
            from: process.env.SMTP_FROM!,
            // The admin login inbox is not a real mailbox; deliver its codes to the team Gmail.
            to: email === "admin@kejanihomes.ke" ? "kejanihomeskenya@gmail.com" : email,
            subject: `${code} is your Kejani Homes reset code`,
            html,
            text: `Your Kejani Homes password reset code is ${code}. It expires in 10 minutes. Change your password here: ${resetLink}`,
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
