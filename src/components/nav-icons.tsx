import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Heart, LayoutDashboard, LogOut, Plus, Search, User, ShieldCheck } from "lucide-react";
import type { AppRole } from "@/lib/use-auth";

interface Item {
  to: "/dashboard" | "/browse" | "/wishlist" | "/profile" | "/list-property";
  label: string;
  icon: typeof Heart;
}

/** Facebook-style row of icon tabs shown at the top for signed-in users. */
export function NavIcons({
  role,
  onSignOut,
  className = "",
}: {
  role: AppRole | null;
  onSignOut: () => Promise<void>;
  className?: string;
}) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const items: Item[] =
    role === "admin"
      ? [
          { to: "/dashboard", label: "Admin", icon: ShieldCheck },
          { to: "/browse", label: "Browse", icon: Search },
          { to: "/list-property", label: "List property", icon: Plus },
          { to: "/profile", label: "Profile", icon: User },
        ]
      : role === "landlord"
        ? [
            { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
            { to: "/browse", label: "Browse", icon: Search },
            { to: "/list-property", label: "List property", icon: Plus },
            { to: "/profile", label: "Profile", icon: User },
          ]
        : [
            { to: "/browse", label: "Browse", icon: Search },
            { to: "/wishlist", label: "Saved", icon: Heart },
            { to: "/profile", label: "Profile", icon: User },
          ];

  return (
    <nav className={`flex items-center gap-1 ${className}`}>
      {items.map((it) => {
        const active = path.startsWith(it.to);
        return (
          <Link
            key={it.to}
            to={it.to}
            title={it.label}
            aria-label={it.label}
            className={`relative grid h-11 w-12 place-items-center rounded-xl transition sm:w-16 ${
              active ? "text-primary" : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            }`}
          >
            <it.icon className="h-5 w-5" />
            {active && <span className="absolute inset-x-2 -bottom-[10px] h-[3px] rounded-full bg-primary" />}
          </Link>
        );
      })}
      <button
        type="button"
        title="Sign out"
        aria-label="Sign out"
        onClick={async () => {
          await onSignOut();
          navigate({ to: "/", replace: true });
        }}
        className="grid h-11 w-12 place-items-center rounded-xl text-muted-foreground transition hover:bg-secondary hover:text-destructive sm:w-16"
      >
        <LogOut className="h-5 w-5" />
      </button>
    </nav>
  );
}
