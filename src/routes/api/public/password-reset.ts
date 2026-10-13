import { createFileRoute } from "@tanstack/react-router";

// POST /api/public/password-reset  { email }
// Emails a one-time recovery link that opens /reset-password.
// Unknown emails receive the same success response to avoid account enumeration.
export const Route = createFileRoute("/api/public/password-reset")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const fail = (error: string, status: number) => Response.json({ ok: false, error }, { status });
        try {
          const body = (await request.json().catch(() => ({}))) as {
            email?: string;
            redirectTo?: string;
          };
          const email = (body.email ?? "").trim().toLowerCase();
          if (!email || !/^[^\s@,()]+@[^\s@,()]+\.[^\s@,()]+$/.test(email)) {
            return fail("Enter a valid email address.", 400);
          }

          const missingConfig = [
            ...(!process.env.SUPABASE_URL ? ["SUPABASE_URL"] : []),
            ...(!process.env.SUPABASE_SERVICE_ROLE_KEY && !process.env.SUPABASE_SECRET_KEY
              ? ["SUPABASE_SERVICE_ROLE_KEY"]
              : []),
            ...(!process.env.SMTP_HOST?.trim() ? ["SMTP_HOST"] : []),
            ...(!process.env.SMTP_USER?.trim() ? ["SMTP_USER"] : []),
            ...(!process.env.SMTP_PASS?.trim() ? ["SMTP_PASS"] : []),
            ...(!process.env.SMTP_FROM?.trim() ? ["SMTP_FROM"] : []),
          ];
          if (missingConfig.length > 0) {
            console.error(`[password-reset] missing server configuration: ${missingConfig.join(", ")}`);
            return fail("Password reset email is temporarily unavailable. Please contact support.", 503);
          }

          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

          // Only send to existing accounts (silently ignore others)
          const { data: prof, error: profileError } = await supabaseAdmin
            .from("profiles")
            .select("id")
            .ilike("email", email)
            .maybeSingle();
          if (profileError) {
            console.error("[password-reset] account lookup failed:", profileError);
            return fail("Password reset email is temporarily unavailable. Please try again later.", 503);
          }
          if (!prof) return Response.json({ ok: true });

          const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
            type: "recovery",
            email,
          });
          const tokenHash = linkData?.properties?.hashed_token;
          if (linkError || !tokenHash) {
            console.error("[password-reset] could not create reset link:", linkError);
            return fail("Password reset email is temporarily unavailable. Please try again later.", 503);
          }

          try {
            const nodemailer = (await import("nodemailer")).default;
            const smtpPort = Number(process.env.SMTP_PORT ?? 587);
            const transporter = nodemailer.createTransport({
              host: process.env.SMTP_HOST!,
              port: smtpPort,
              secure: smtpPort === 465,
              auth: {
                user: process.env.SMTP_USER!,
                pass: process.env.SMTP_PASS!,
              },
            });

            const resetLink = `${new URL(request.url).origin}/reset-password?token_hash=${encodeURIComponent(tokenHash)}`;
            const html = `
              <div style="font-family:Arial,sans-serif;background:#fff;padding:32px;max-width:560px;margin:0 auto">
                <h1 style="color:#317E3D;font-size:22px;margin:0 0 12px">Reset your password</h1>
                <p style="color:#333;font-size:15px;line-height:1.5">Click the button below to choose a new Kejani Homes password. The link expires in 1 hour.</p>
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
              subject: "Reset your Kejani Homes password",
              html,
              text: `Reset your Kejani Homes password here (expires in 1 hour): ${resetLink}`,
            });
          } catch (err) {
            console.error("[password-reset] email delivery failed:", err);
            return fail("We could not send the reset email. Please try again later.", 502);
          }

          return Response.json({ ok: true });
        } catch (err) {
          console.error("[password-reset] failed:", err);
          return fail("Password reset email is temporarily unavailable. Please try again later.", 503);
        }
      },
    },
  },
});
