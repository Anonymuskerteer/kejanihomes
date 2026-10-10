import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/activate")({
  head: () => ({
    meta: [
      { title: "Activating your account — Kejani Homes" },
      { name: "description", content: "Activating your Kejani Homes account." },
      { property: "og:title", content: "Activate your Kejani Homes account" },
      { property: "og:description", content: "Confirm your email to start using Kejani Homes." },
    ],
  }),
  component: Activate,
});

// Landing page for the activation link: session arrives in the URL, then route by role.
function Activate() {
  const navigate = useNavigate();
  useEffect(() => {
    const t = setTimeout(async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) return navigate({ to: "/auth", replace: true });
      const { data: r } = await supabase.from("user_roles").select("role").eq("user_id", data.user.id).maybeSingle();
      navigate({ to: r?.role === "tenant" ? "/browse" : "/dashboard", replace: true });
    }, 800);
    return () => clearTimeout(t);
  }, [navigate]);
  return (
    <div className="grid min-h-screen place-items-center bg-background text-sm text-muted-foreground">
      Activating your account…
    </div>
  );
}
