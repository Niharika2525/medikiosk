import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Activity, FlaskConical, Hospital, Pill, Stethoscope, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { KioskShell, StepHeader, DemoBadge } from "@/components/kiosk/KioskShell";
import { useSession, type TimelineEvent } from "@/lib/session-store";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/timeline")({
  head: () => ({
    meta: [
      { title: "Medical timeline – MediKiosk" },
      { name: "description", content: "Chronological medical timeline built from scanned records and the intake interview." },
      { property: "og:title", content: "Medical timeline – MediKiosk" },
      { property: "og:description", content: "Records organised chronologically with abnormal results highlighted." },
    ],
  }),
  component: TimelinePage,
});

const ICON: Record<TimelineEvent["kind"], typeof Activity> = { visit: Stethoscope, lab: FlaskConical, admission: Hospital, symptom: Activity, medicine: Pill };

function TimelinePage() {
  const { state, timeline, generateSummary } = useSession();
  const navigate = useNavigate();
  const lang = state.language;

  return (
    <KioskShell>
      <StepHeader eyebrow="Step 6 of 7" title="Your medical timeline" subtitle="Everything we found, arranged in order. Abnormal results are highlighted for your doctor." />
      <div className="mb-4 flex items-center justify-between">
        <DemoBadge />
        <span className="text-sm text-muted-foreground">{timeline.length} events</span>
      </div>

      {timeline.length === 0 ? (
        <div className="rounded-3xl border bg-card p-10 text-center shadow-card">
          <p className="font-semibold">No records yet.</p>
          <p className="text-sm text-muted-foreground">Scan documents to build a timeline.</p>
          <Button className="mt-4" variant="soft" size="xl" onClick={() => navigate({ to: "/documents" })}>Go to documents</Button>
        </div>
      ) : (
        <ol className="relative ml-4 space-y-4 border-l-2 border-primary/30 pl-8">
          {timeline.map((e, i) => {
            const Icon = ICON[e.kind];
            return (
              <li key={i} className="relative animate-fade-up" style={{ animationDelay: `${i * 0.07}s` }}>
                <span className={cn("absolute -left-[3.05rem] grid size-10 place-items-center rounded-full border-4 border-background shadow-soft", e.abnormal ? "bg-danger text-danger-foreground" : e.kind === "symptom" ? "bg-warning text-warning-foreground" : "bg-primary text-primary-foreground")}>
                  <Icon className="size-4" />
                </span>
                <div className={cn("rounded-3xl border bg-card p-5 shadow-card", e.abnormal && "border-danger/40")}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="font-display text-sm font-bold text-primary">{new Date(e.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</div>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">Source: {e.source}</span>
                  </div>
                  <h3 className="mt-1 text-lg font-bold">{e.title}</h3>
                  <p className={cn("text-sm", e.abnormal ? "font-semibold text-danger" : "text-muted-foreground")}>{e.detail}</p>
                </div>
              </li>
            );
          })}
        </ol>
      )}

      <div className="mt-8 flex justify-end">
        <Button
          variant="hero"
          size="touch"
          onClick={() => {
            generateSummary();
            navigate({ to: "/summary" });
          }}
        >
          <Sparkles /> Generate AI summary <ArrowRight />
        </Button>
      </div>
      <p className="mt-2 text-right text-xs text-muted-foreground">{t(lang, "next")}: AI clinical summary</p>
    </KioskShell>
  );
}
