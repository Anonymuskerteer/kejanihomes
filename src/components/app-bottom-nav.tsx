import { Link, useRouterState } from "@tanstack/react-router";
import {
  BarChart3,
  Heart,
  LayoutDashboard,
  ListPlus,
  MessagesSquare,
  Search,
  ShieldCheck,
  UserRound,
  Users,
} from "lucide-react";
import { useAuth } from "@/lib/use-auth";

export function AppBottomNav() {
  const { user, role } = useAuth();
  const path = useRouterState({ select: (state) => state.location.pathname });

  if (!user) return null;

  const items =
    role === null
      ? [
          { to: "/browse" as const, label: "Browse", icon: Search },
          { to: "/chat" as const, label: "Messages", icon: MessagesSquare },
          { to: "/profile" as const, label: "Profile", icon: UserRound },
        ]
      : role === "admin"
      ? [
          { to: "/dashboard" as const, label: "Listings", icon: ShieldCheck },
          { to: "/admin/users" as const, label: "Users", icon: Users },
          { to: "/admin/analytics" as const, label: "Analytics", icon: BarChart3 },
          { to: "/admin/logs" as const, label: "Logs", icon: LayoutDashboard },
          { to: "/chat" as const, label: "Messages", icon: MessagesSquare },
          { to: "/profile" as const, label: "Profile", icon: UserRound },
        ]
      : role === "landlord"
        ? [
            { to: "/dashboard" as const, label: "Dashboard", icon: LayoutDashboard },
            { to: "/list-property" as const, label: "List home", icon: ListPlus },
            { to: "/browse" as const, label: "Browse", icon: Search },
            { to: "/chat" as const, label: "Messages", icon: MessagesSquare },
            { to: "/profile" as const, label: "Profile", icon: UserRound },
          ]
        : [
            { to: "/browse" as const, label: "Browse", icon: Search },
            { to: "/chat" as const, label: "Messages", icon: MessagesSquare },
            { to: "/wishlist" as const, label: "Saved", icon: Heart },
            { to: "/profile" as const, label: "Profile", icon: UserRound },
          ];
  const gridColumns =
    items.length === 3
      ? "grid-cols-3"
      : items.length === 4
        ? "grid-cols-4"
        : items.length === 5
          ? "grid-cols-5"
          : "grid-cols-6";

  return (
    <nav
      aria-label="Main navigation"
      className="app-bottom-navigation fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background/95 shadow-elevated backdrop-blur"
    >
      <div className={`mx-auto grid h-16 w-full max-w-4xl ${gridColumns} px-1 sm:px-4`}>
        {items.map((item) => {
          const active =
            path === item.to ||
            (item.to === "/browse" && path.startsWith("/browse")) ||
            (item.to === "/dashboard" && path === "/dashboard");

          return (
            <Link
              key={item.to}
              to={item.to}
              aria-current={active ? "page" : undefined}
              className={`flex min-w-0 flex-col items-center justify-center gap-0.5 rounded-lg text-[10px] font-medium transition sm:text-xs ${
                active ? "text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <span
                className={`grid h-8 w-9 place-items-center rounded-full sm:w-12 ${
                  active ? "bg-primary-soft" : ""
                }`}
              >
                <item.icon className="h-5 w-5" />
              </span>
              <span className="max-w-full truncate">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
