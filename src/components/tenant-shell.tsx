import { Link, useNavigate } from "@tanstack/react-router";
import { Home, Search } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";

export interface TenantSearchConfig {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  onSubmit?: () => void;
}

export function TenantShell({
  children,
  search,
  hideTopBar = false,
}: {
  children: React.ReactNode;
  search?: TenantSearchConfig;
  hideTopBar?: boolean;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {!hideTopBar && <TenantTopBar search={search} />}
      <main className="flex-1">{children}</main>
    </div>
  );
}

function TenantTopBar({ search }: { search?: TenantSearchConfig }) {
  const navigate = useNavigate();
  const [local, setLocal] = useState("");
  const value = search?.value ?? local;
  const onChange = search?.onChange ?? setLocal;
  const submit = () => {
    if (search?.onSubmit) return search.onSubmit();
    navigate({ to: "/browse", search: value ? { q: value } : {} });
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

      </div>
    </header>
  );
}
