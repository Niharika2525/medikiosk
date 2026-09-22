import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Activity, ArrowLeft, Stethoscope, User, UserCog } from "lucide-react";
import { cn } from "@/lib/utils";
import { DemoBadge } from "./KioskShell";

const ROLES = [
  { id: "physician", label: "Physician", to: "/physician", icon: Stethoscope },
  { id: "triage", label: "Triage staff", to: "/triage", icon: Activity },
  { id: "patient", label: "Patient", to: "/patient", icon: User },
] as const;

export function StaffShell({ role, children }: { role: (typeof ROLES)[number]["id"]; children: ReactNode }) {
  const current = ROLES.find((r) => r.id === role)!;
  return (
    <div className="min-h-screen bg-background bg-mesh">
      <header className="glass sticky top-0 z-10">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <Link to="/" className="grid size-10 shrink-0 place-items-center rounded-2xl bg-gradient-primary text-primary-foreground shadow-soft" aria-label="Back to kiosk">
              <ArrowLeft className="size-5" />
            </Link>
            <div className="min-w-0">
              <div className="truncate font-display text-lg font-bold">MediKiosk · {current.label} dashboard</div>
              <div className="flex items-center gap-1 text-[11px] text-muted-foreground"><UserCog className="size-3" /> Role-based access · signed in as demo {role}</div>
            </div>
          </div>
          <nav className="flex items-center gap-1 rounded-full border bg-card p-1" aria-label="Switch role">
            {ROLES.map((r) => (
              <Link key={r.id} to={r.to} className={cn("flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition-colors", r.id === role ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}>
                <r.icon className="size-3.5" /> <span className="hidden sm:inline">{r.label}</span>
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">{children}</main>
      <footer className="mx-auto flex max-w-7xl items-center gap-2 px-4 py-4 text-xs text-muted-foreground sm:px-6">
        <DemoBadge /> Mock HIS / ABHA integrations. AI-generated content requires physician verification.
      </footer>
    </div>
  );
}
