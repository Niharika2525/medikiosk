import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Activity, Globe, RotateCcw, ShieldCheck, Stethoscope, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSession } from "@/lib/session-store";
import { LANGUAGES, t } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { stopSpeaking } from "@/lib/voice";

export const STEPS = [
  { path: "/", label: "Login" },
  { path: "/language", label: "Language" },
  { path: "/consent", label: "Consent" },
  { path: "/interview", label: "Interview" },
  { path: "/documents", label: "Documents" },
  { path: "/timeline", label: "Timeline" },
  { path: "/summary", label: "Summary" },
] as const;

const IDLE_SECONDS = 120;
const WARN_AT = 20;

export function DemoBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-warning/60 bg-warning/20 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-warning-foreground",
        className,
      )}
    >
      Demo data
    </span>
  );
}

export function AIDisclaimer({ className }: { className?: string }) {
  return (
    <p className={cn("flex items-center gap-2 rounded-xl border border-primary/30 bg-secondary/60 px-3 py-2 text-xs font-medium text-secondary-foreground", className)}>
      <ShieldCheck className="size-4 shrink-0 text-primary" />
      AI-generated draft — physician verification required. This system never diagnoses or prescribes.
    </p>
  );
}

export function KioskShell({ children, step, wide }: { children: ReactNode; step?: number; wide?: boolean }) {
  const { state, reset } = useSession();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [secondsLeft, setSecondsLeft] = useState(IDLE_SECONDS);
  const lastActivity = useRef(Date.now());
  const lang = state.language;
  const isHome = pathname === "/";

  useEffect(() => {
    const bump = () => {
      lastActivity.current = Date.now();
    };
    const events = ["pointerdown", "keydown", "touchstart", "scroll"];
    events.forEach((e) => window.addEventListener(e, bump, { passive: true }));
    const id = setInterval(() => {
      const left = IDLE_SECONDS - Math.floor((Date.now() - lastActivity.current) / 1000);
      setSecondsLeft(left);
      if (left <= 0 && !isHome) {
        stopSpeaking();
        reset();
        navigate({ to: "/" });
        lastActivity.current = Date.now();
      }
    }, 1000);
    return () => {
      events.forEach((e) => window.removeEventListener(e, bump));
      clearInterval(id);
    };
  }, [isHome, reset, navigate]);

  const stepIndex = step ?? STEPS.findIndex((s) => s.path === pathname);
  const langMeta = LANGUAGES.find((l) => l.code === lang);

  return (
    <div className="relative flex min-h-screen flex-col bg-background bg-mesh">
      <div className="pointer-events-none absolute inset-0 grid-dots opacity-60" aria-hidden />
      <header className="relative z-10 glass sticky top-0">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link to="/" className="flex min-w-0 items-center gap-3">
            <div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-gradient-primary text-primary-foreground shadow-soft">
              <Stethoscope className="size-6" />
            </div>
            <div className="min-w-0 leading-tight">
              <div className="truncate font-display text-lg font-bold">MediKiosk</div>
              <div className="hidden truncate text-[11px] font-medium text-muted-foreground sm:block">AI-Powered Clinical History & Patient Intake</div>
            </div>
          </Link>

          <nav className="hidden items-center gap-1 md:flex" aria-label="Progress">
            {STEPS.map((s, i) => (
              <div key={s.path} className="flex items-center">
                <div
                  className={cn(
                    "flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold transition-colors",
                    i < stepIndex && "text-primary",
                    i === stepIndex && "bg-primary text-primary-foreground shadow-soft",
                    i > stepIndex && "text-muted-foreground",
                  )}
                >
                  <span className={cn("grid size-5 place-items-center rounded-full border text-[10px]", i === stepIndex ? "border-primary-foreground/50" : i < stepIndex ? "border-primary bg-primary text-primary-foreground" : "border-border")}>{i + 1}</span>
                  <span className="hidden lg:inline">{s.label}</span>
                </div>
                {i < STEPS.length - 1 && <div className={cn("mx-0.5 h-px w-3", i < stepIndex ? "bg-primary" : "bg-border")} />}
              </div>
            ))}
          </nav>

          <div className="flex shrink-0 items-center gap-2">
            {langMeta && !isHome && (
              <Link to="/language" className="hidden items-center gap-1.5 rounded-full border bg-card px-3 py-1.5 text-xs font-semibold text-foreground hover:border-primary sm:flex">
                <Globe className="size-3.5 text-primary" /> {langMeta.native}
              </Link>
            )}
            {!isHome && (
              <div className={cn("flex items-center gap-1.5 rounded-full border bg-card px-3 py-1.5 text-xs font-semibold tabular-nums", secondsLeft <= WARN_AT ? "border-danger text-danger" : "text-muted-foreground")} title="Kiosk session auto-resets when idle">
                <Timer className="size-3.5" /> {Math.max(0, secondsLeft)}s
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="rounded-full"
              onClick={() => {
                stopSpeaking();
                reset();
                navigate({ to: "/" });
              }}
              aria-label="Reset kiosk session"
            >
              <RotateCcw /> <span className="hidden sm:inline">Reset</span>
            </Button>
          </div>
        </div>
        {secondsLeft <= WARN_AT && !isHome && (
          <div className="border-t border-danger/30 bg-danger/10 px-4 py-2 text-center text-sm font-semibold text-danger animate-in fade-in">
            Are you still there? This session will reset in {Math.max(0, secondsLeft)}s to protect your privacy. Tap anywhere to continue.
          </div>
        )}
      </header>

      <main className={cn("relative z-10 mx-auto w-full flex-1 px-4 py-6 sm:px-6 sm:py-8", wide ? "max-w-7xl" : "max-w-5xl")}>{children}</main>

      <footer className="relative z-10 mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-2 px-4 py-4 text-xs text-muted-foreground sm:px-6">
        <div className="flex items-center gap-2">
          <DemoBadge />
          <span>Mock AI / HIS / ABHA integrations. No real patient data.</span>
        </div>
        <div className="flex items-center gap-3">
          {state.patient && <span>{t(lang, "welcome")}, {state.patient.name}</span>}
          <Link to="/triage" className="flex items-center gap-1 hover:text-foreground">
            <Activity className="size-3.5" /> Staff
          </Link>
          <Link to="/physician" className="hover:text-foreground">Physician</Link>
        </div>
      </footer>
    </div>
  );
}

export function StepHeader({ eyebrow, title, subtitle }: { eyebrow?: string; title: string; subtitle?: string }) {
  return (
    <div className="mb-6 animate-fade-up">
      {eyebrow && <div className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-primary">{eyebrow}</div>}
      <h1 className="text-3xl font-bold sm:text-4xl">{title}</h1>
      {subtitle && <p className="mt-2 max-w-2xl text-base text-muted-foreground sm:text-lg">{subtitle}</p>}
    </div>
  );
}
