import { createFileRoute } from "@tanstack/react-router";
import { BellRing, CheckCircle2, HeartPulse, Siren, Thermometer, Wind, Droplets, Activity } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { StaffShell } from "@/components/kiosk/StaffShell";
import { DemoBadge } from "@/components/kiosk/KioskShell";
import { DEMO_QUEUE, DEMO_VITALS } from "@/lib/demo-data";
import { QUESTIONS, answerToText } from "@/lib/interview-engine";
import { useSession } from "@/lib/session-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/triage")({
  head: () => ({
    meta: [
      { title: "Triage alerts – MediKiosk" },
      { name: "description", content: "Real-time red-flag and emergency symptom alerts from kiosk intakes for triage staff." },
      { property: "og:title", content: "Triage alerts – MediKiosk" },
      { property: "og:description", content: "Red-flag detection dashboard for triage staff." },
    ],
  }),
  component: TriagePage,
});

function TriagePage() {
  const { state, redFlags, set } = useSession();
  const answered = QUESTIONS.filter((q) => state.answers[q.id] !== undefined);

  return (
    <StaffShell role="triage">
      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-xl font-bold"><BellRing className="size-5 text-danger" /> Live red-flag alerts</h2>
            <DemoBadge />
          </div>
          {redFlags.length === 0 ? (
            <div className="rounded-3xl border bg-card p-8 text-center shadow-card">
              <CheckCircle2 className="mx-auto mb-2 size-10 text-success" />
              <p className="font-semibold">No active red flags</p>
              <p className="text-sm text-muted-foreground">Alerts appear here instantly when a kiosk interview detects emergency symptoms.</p>
            </div>
          ) : (
            redFlags.map((f) => (
              <div key={f.id} className={cn("animate-fade-up rounded-3xl border-2 bg-card p-5 shadow-card", f.severity === "critical" ? "border-danger" : "border-warning", state.redFlagAck && "opacity-70")}>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <span className={cn("grid size-12 place-items-center rounded-2xl", f.severity === "critical" ? "bg-danger text-danger-foreground animate-pulse" : "bg-warning text-warning-foreground")}><Siren className="size-6" /></span>
                    <div>
                      <div className="text-xs font-bold uppercase tracking-widest text-danger">{f.severity} · {state.patient?.name ?? "Kiosk patient"}</div>
                      <h3 className="text-lg font-bold">{f.title}</h3>
                    </div>
                  </div>
                  {state.redFlagAck ? (
                    <span className="rounded-full bg-success/15 px-3 py-1 text-xs font-bold text-success">Acknowledged</span>
                  ) : (
                    <Button variant="danger" onClick={() => { set("redFlagAck", true); toast.success("Alert acknowledged — patient escorted to triage bay (demo)."); }}>Acknowledge</Button>
                  )}
                </div>
                <p className="mt-3 text-sm">{f.detail}</p>
                <p className="mt-1 text-xs text-muted-foreground">Triggered by answers: {f.triggeredBy.join(", ")}</p>
              </div>
            ))
          )}

          <h3 className="pt-2 font-bold">Waiting room</h3>
          <div className="grid gap-2 sm:grid-cols-2">
            {state.patient && (
              <div className="rounded-2xl border-2 border-primary bg-accent/40 p-4">
                <div className="font-bold">{state.patient.name}</div>
                <div className="text-xs text-muted-foreground">{state.interviewDone ? "Intake complete" : "At kiosk · interview in progress"}</div>
              </div>
            )}
            {DEMO_QUEUE.map((q) => (
              <div key={q.patient.id} className="rounded-2xl border bg-card p-4">
                <div className="font-bold">{q.patient.name}</div>
                <div className="text-xs text-muted-foreground">{q.arrivedAt} · {q.chiefComplaint} · {q.priority}</div>
              </div>
            ))}
          </div>
        </section>

        <aside className="space-y-4">
          <div className="rounded-3xl border bg-card p-5 shadow-card">
            <h3 className="mb-3 font-bold">Vitals at kiosk (demo device)</h3>
            <div className="grid grid-cols-2 gap-2">
              {[
                { icon: HeartPulse, label: "BP", value: DEMO_VITALS.bp, warn: true },
                { icon: Activity, label: "Pulse", value: `${DEMO_VITALS.hr} bpm` },
                { icon: Droplets, label: "SpO₂", value: `${DEMO_VITALS.spo2}%` },
                { icon: Thermometer, label: "Temp", value: `${DEMO_VITALS.temp} °F` },
                { icon: Wind, label: "RR", value: `${DEMO_VITALS.rr}/min` },
              ].map((v) => (
                <div key={v.label} className={cn("rounded-2xl p-3", v.warn ? "bg-warning/20" : "bg-muted")}>
                  <v.icon className={cn("size-4", v.warn ? "text-warning-foreground" : "text-primary")} />
                  <div className="font-display text-xl font-bold">{v.value}</div>
                  <div className="text-xs text-muted-foreground">{v.label}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-3xl border bg-card p-5 shadow-card">
            <h3 className="mb-3 font-bold">Interview so far</h3>
            {answered.length === 0 ? (
              <p className="text-sm text-muted-foreground">No answers yet.</p>
            ) : (
              <ul className="max-h-80 space-y-2 overflow-auto text-sm">
                {answered.map((q) => (
                  <li key={q.id} className="rounded-xl bg-muted px-3 py-2">
                    <div className="text-[11px] font-bold uppercase text-muted-foreground">{q.section}</div>
                    <div className="font-semibold">{answerToText(q, state.answers)}</div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>
      </div>
    </StaffShell>
  );
}
