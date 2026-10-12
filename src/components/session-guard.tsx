import { useEffect, useRef } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, type AppRole } from "@/lib/use-auth";

const COOKIE = "kh_session";
const IDLE_MS = 15 * 60 * 1000; // sign out after 15 min of inactivity
const WARN_MS = 60 * 1000; // warn 1 min before

// Which roles may open each protected page. Anything not listed is public.
const ACCESS: { prefix: string; roles: AppRole[] }[] = [
  { prefix: "/admin", roles: ["admin"] },
  { prefix: "/list-property", roles: ["landlord", "admin"] },
  { prefix: "/dashboard", roles: ["landlord", "admin", "tenant"] },
  { prefix: "/wishlist", roles: ["tenant", "landlord", "admin"] },
  { prefix: "/saved", roles: ["tenant", "landlord", "admin"] },
  { prefix: "/profile", roles: ["tenant", "landlord", "admin"] },
];

function readCookie() {
  return document.cookie.split("; ").find((c) => c.startsWith(`${COOKIE}=`))?.split("=")[1] ?? null;
}
function writeCookie(value: string) {
  const secure = location.protocol === "https:" ? "; Secure" : "";
  // No max-age → browser-session cookie, cleared when the browser closes.
  document.cookie = `${COOKIE}=${encodeURIComponent(value)}; path=/; SameSite=Strict${secure}`;
}
function clearCookie() {
  document.cookie = `${COOKIE}=; path=/; max-age=0; SameSite=Strict`;
}

/**
 * Ties a browser-session cookie to the signed-in account, enforces role-based page
 * access, and signs the user out after a period of inactivity.
 */
export function SessionGuard() {
  const { user, role, loading } = useAuth();
  const navigate = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const lastActive = useRef(Date.now());
  const warned = useRef(false);

  const expire = async (reason: string) => {
    clearCookie();
    if (user) await supabase.from("activity_logs").insert({ actor_id: user.id, category: "system", action: "session_expired", details: { email: user.email ?? null } });
    await supabase.auth.signOut();
    toast.error(reason);
    navigate({ to: "/auth", replace: true });
  };

  // Bind / validate the session cookie against the account.
  useEffect(() => {
    if (loading) return;
    if (!user) {
      clearCookie();
      return;
    }
    const raw = readCookie();
    if (!raw) {
      // Fresh sign-in in this tab sets the cookie; a stale persisted session (browser was closed) is rejected.
      const signedInAt = new Date(user.last_sign_in_at ?? 0).getTime();
      if (Date.now() - signedInAt < 60_000) {
        writeCookie(`${user.id}.${Date.now()}`);
        supabase.from("activity_logs").insert({ actor_id: user.id, category: "system", action: "sign_in", details: { email: user.email ?? null } }).then(() => {});
      } else {
        expire("Your session has ended. Please sign in again.");
      }
      return;
    }
    const [uid, ts] = decodeURIComponent(raw).split(".");
    if (uid !== user.id) {
      expire("Session mismatch. Please sign in again.");
    } else if (Date.now() - Number(ts) > IDLE_MS) {
      expire("You were signed out after being inactive. Please sign in again.");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, loading]);

  // Role-based page access.
  useEffect(() => {
    if (loading) return;
    const rule = ACCESS.find((r) => path.startsWith(r.prefix));
    if (!rule) return;
    if (!user) {
      navigate({ to: "/auth", replace: true });
      return;
    }
    if (role && !rule.roles.includes(role)) {
      toast.error("You don't have permission to open that page.");
      navigate({ to: role === "tenant" ? "/browse" : "/dashboard", replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, user?.id, role, loading]);

  // Forced password reset (by admin) and mandatory landlord profile photo.
  useEffect(() => {
    if (loading || !user) return;
    let cancelled = false;
    supabase
      .from("profiles")
      .select("must_reset_password, avatar_url")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled || !data) return;
        if (data.must_reset_password) {
          if (path !== "/reset-password") {
            toast.info("Your administrator requires you to set a new password.");
            navigate({ to: "/reset-password", replace: true });
          }
          return;
        }
        if (role === "landlord" && !data.avatar_url && path !== "/profile" && path !== "/auth") {
          toast.info("Please add your profile photo before continuing.");
          navigate({ to: "/profile", replace: true });
        }
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, user?.id, role, loading]);

  // Inactivity timer.
  useEffect(() => {
    if (!user) return;
    lastActive.current = Date.now();
    warned.current = false;
    const bump = () => {
      lastActive.current = Date.now();
      warned.current = false;
      if (readCookie()) writeCookie(`${user.id}.${Date.now()}`);
    };
    const events = ["mousemove", "keydown", "click", "scroll", "touchstart"];
    let throttle = 0;
    const onAct = () => {
      const now = Date.now();
      if (now - throttle > 5000) {
        throttle = now;
        bump();
      }
    };
    events.forEach((e) => window.addEventListener(e, onAct, { passive: true }));
    const iv = window.setInterval(() => {
      const idle = Date.now() - lastActive.current;
      if (idle > IDLE_MS) {
        window.clearInterval(iv);
        expire("You were signed out after being inactive. Please sign in again.");
      } else if (idle > IDLE_MS - WARN_MS && !warned.current) {
        warned.current = true;
        toast.warning("You'll be signed out in 1 minute due to inactivity.");
      }
    }, 10_000);
    return () => {
      events.forEach((e) => window.removeEventListener(e, onAct));
      window.clearInterval(iv);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  return null;
}
