import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "admin" | "landlord" | "tenant";

export interface AuthState {
  loading: boolean;
  session: Session | null;
  user: User | null;
  role: AppRole | null;
}

export function useAuth(): AuthState & {
  signOut: () => Promise<void>;
} {
  const [state, setState] = useState<AuthState>({
    loading: true,
    session: null,
    user: null,
    role: null,
  });

  useEffect(() => {
    let mounted = true;

    const loadRole = async (userId: string): Promise<AppRole | null> => {
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .order("role")
        .limit(1)
        .maybeSingle();
      return (data?.role as AppRole) ?? null;
    };

    const apply = async (session: Session | null) => {
      if (!mounted) return;
      if (!session?.user) {
        setState({ loading: false, session: null, user: null, role: null });
        return;
      }
      // Defer role load to avoid blocking the auth callback
      setState({ loading: false, session, user: session.user, role: null });
      setTimeout(async () => {
        const role = await loadRole(session.user.id);
        if (mounted) setState((s) => ({ ...s, role }));
      }, 0);
    };

    // Listener first, then fetch existing session
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      apply(session);
    });
    supabase.auth.getSession().then(({ data }) => apply(data.session));

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return { ...state, signOut };
}
