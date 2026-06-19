import { Link } from "@tanstack/react-router";
import { Home } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-border/60 bg-secondary/40">
      <div className="container-page grid gap-10 py-12 md:grid-cols-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground"><Home className="h-5 w-5" /></span>
            <span className="font-display text-lg font-bold">Kejani<span className="text-primary">Homes</span></span>
          </div>
          <p className="mt-3 max-w-xs text-sm text-muted-foreground">
            Find your next home in Kenya. Verified listings, real photos and direct contact with landlords.
          </p>
        </div>
        <FooterCol title="Discover" links={[["Browse properties", "/browse"], ["Popular locations", "/browse"], ["Saved homes", "/saved"]]} />
        <FooterCol title="For landlords" links={[["List a property", "/list-property"], ["Landlord dashboard", "/dashboard"], ["How it works", "/how-it-works"]]} />
        <FooterCol title="Company" links={[["About", "/how-it-works"], ["Contact", "/how-it-works"], ["Trust & safety", "/how-it-works"]]} />
      </div>
      <div className="border-t border-border/60">
        <div className="container-page flex flex-col items-center justify-between gap-2 py-5 text-xs text-muted-foreground md:flex-row">
          <span>© {new Date().getFullYear()} Kejani Homes. Made in Kenya.</span>
          <span>All prices in KES. Verified listings only.</span>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div>
      <h4 className="text-sm font-semibold">{title}</h4>
      <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
        {links.map(([label, href]) => (
          <li key={label}><Link to={href} className="hover:text-foreground">{label}</Link></li>
        ))}
      </ul>
    </div>
  );
}
