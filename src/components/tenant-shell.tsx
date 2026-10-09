import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Home, Search, Menu, User, Heart, LogOut, LayoutGrid } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/lib/use-auth";
import { NavIcons } from "@/components/nav-icons";

export interface TenantSearchConfig {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  onSubmit?: () => void;
}

export function TenantShell({
  children,
  search,
}: {
  children: React.ReactNode;
  search?: TenantSearchConfig;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-background pb-24">
      <TenantTopBar search={search} />
      <main className="flex-1">{children}</main>
      <TenantBottomNav />
    </div>
  );
}

function TenantTopBar({ search }: { search?: TenantSearchConfig }) {
  const navigate = useNavigate();
  const { role, signOut } = useAuth();
  const [local, setLocal] = useState("");
  const value = search?.value ?? local;
  const onChange = search?.onChange ?? setLocal;
  const submit = () => {
    if (search?.onSubmit) return search.onSubmit();
    navigate({ to: "/browse", search: value ? { q: value } : {} });
  };

  const doSignOut = async () => {
    await signOut();
    navigate({ to: "/" });
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/95 backdrop-blur">
      <div className="container-page flex h-16 items-center gap-3">
        <Link to="/browse" className="flex shrink-0 items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground shadow-soft">
            <Home className="h-5 w-5" />
          </span>
          <span className="hidden font-display text-lg font-bold tracking-tight sm:inline">
            Kejani<span className="text-primary">Homes</span>
          </span>
        </Link>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
          className="relative min-w-0 flex-1"
        >
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={search?.placeholder ?? "Search listings"}
            className="h-11 rounded-full border-border bg-secondary/60 pl-10 focus-visible:ring-2 focus-visible:ring-primary"
          />
        </form>

        <NavIcons role={role} onSignOut={signOut} className="hidden md:flex" />
      </div>
    </header>
  );
}

function TenantBottomNav() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const items = [
    { to: "/browse" as const, label: "Browse", icon: LayoutGrid },
    { to: "/wishlist" as const, label: "Saved", icon: Heart },
    { to: "/profile" as const, label: "Profile", icon: User },
  ];
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 shadow-elevated backdrop-blur">
      <div className="container-page grid h-16 max-w-md grid-cols-3">
        {items.map((it) => {
          const active =
            path === it.to || (it.to === "/browse" && path.startsWith("/browse"));
          return (
            <Link
              key={it.to}
              to={it.to}
              className={`flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition ${
                active ? "text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <span
                className={`grid h-9 w-9 place-items-center rounded-full transition ${
                  active ? "bg-primary-soft" : ""
                }`}
              >
                <it.icon className="h-5 w-5" />
              </span>
              {it.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
