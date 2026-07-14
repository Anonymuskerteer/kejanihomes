import { Link, useNavigate } from "@tanstack/react-router";
import { Home, Menu, Plus, User, LayoutDashboard, LogOut, Search, Heart } from "lucide-react";
import { useState } from "react";
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

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const { user, role, signOut } = useAuth();
  const navigate = useNavigate();

  const doSignOut = async () => {
    await signOut();
    navigate({ to: "/" });
  };

  const isLandlord = role === "landlord" || role === "admin";

  // Logged-in users: header collapses to logo + hamburger only.
  if (user) {
    return (
      <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/85 backdrop-blur">
        <div className="container-page flex h-16 items-center justify-between gap-4">
          <Link to={isLandlord ? "/dashboard" : "/browse"} className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground shadow-soft">
              <Home className="h-5 w-5" />
            </span>
            <span className="font-display text-lg font-bold tracking-tight">
              Kejani<span className="text-primary">Homes</span>
            </span>
          </Link>

          <div className="flex items-center gap-2">
            {isLandlord && (
              <Button asChild size="sm" className="hidden shadow-soft sm:inline-flex">
                <Link to="/list-property"><Plus className="mr-1.5 h-4 w-4" />List property</Link>
              </Button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="h-11 w-11 rounded-full" aria-label="Menu">
                  <Menu className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuLabel className="text-xs capitalize text-muted-foreground">
                  {role ?? "Account"}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {isLandlord ? (
                  <>
                    <DropdownMenuItem asChild>
                      <Link to="/dashboard"><LayoutDashboard className="mr-2 h-4 w-4" />Dashboard</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/browse"><Search className="mr-2 h-4 w-4" />Browse</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/profile"><User className="mr-2 h-4 w-4" />Profile</Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild className="sm:hidden">
                      <Link to="/list-property"><Plus className="mr-2 h-4 w-4" />List property</Link>
                    </DropdownMenuItem>
                  </>
                ) : (
                  <>
                    <DropdownMenuItem asChild>
                      <Link to="/browse"><LayoutDashboard className="mr-2 h-4 w-4" />Dashboard</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/profile"><User className="mr-2 h-4 w-4" />Profile</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/wishlist"><Heart className="mr-2 h-4 w-4" />Saved</Link>
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={doSignOut}>
                  <LogOut className="mr-2 h-4 w-4" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>
    );
  }

  // Guest header
  const navLinkProps = {
    activeProps: { className: "text-primary" },
    inactiveProps: { className: "text-foreground/70 hover:text-foreground" },
    className: "text-sm font-medium transition-colors",
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground shadow-soft">
            <Home className="h-5 w-5" />
          </span>
          <span className="font-display text-lg font-bold tracking-tight">
            Kejani<span className="text-primary">Homes</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          <Link to="/" {...navLinkProps} activeOptions={{ exact: true }}>Home</Link>
          <Link to="/browse" {...navLinkProps}>Browse</Link>
          <Link to="/how-it-works" {...navLinkProps}>How it works</Link>
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <Button asChild variant="ghost" size="sm">
            <Link to="/auth"><User className="mr-1.5 h-4 w-4" />Sign in</Link>
          </Button>
          <Button asChild size="sm" className="shadow-soft">
            <Link to="/auth" search={{ mode: "signup", role: "landlord" }}><Plus className="mr-1.5 h-4 w-4" />List property</Link>
          </Button>
        </div>

        <button
          aria-label="Menu"
          className="grid h-10 w-10 place-items-center rounded-lg border border-border md:hidden"
          onClick={() => setOpen((v) => !v)}
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {open && (
        <div className="border-t border-border/60 md:hidden">
          <nav className="container-page flex flex-col gap-1 py-3">
            <Link to="/" onClick={() => setOpen(false)} className="rounded-md px-2 py-2 text-sm hover:bg-secondary">Home</Link>
            <Link to="/browse" onClick={() => setOpen(false)} className="rounded-md px-2 py-2 text-sm hover:bg-secondary">Browse</Link>
            <Link to="/how-it-works" onClick={() => setOpen(false)} className="rounded-md px-2 py-2 text-sm hover:bg-secondary">How it works</Link>
            <div className="mt-2 flex gap-2">
              <Button asChild variant="outline" size="sm" className="flex-1">
                <Link to="/auth" onClick={() => setOpen(false)}>Sign in</Link>
              </Button>
              <Button asChild size="sm" className="flex-1">
                <Link to="/auth" search={{ mode: "signup", role: "landlord" }} onClick={() => setOpen(false)}>List property</Link>
              </Button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
