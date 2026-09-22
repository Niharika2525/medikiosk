import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { CheckCircle2, ClipboardCheck, Cloud, FileText, Link2, Send, Siren, Stethoscope, Users } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AIDisclaimer, DemoBadge } from "@/components/kiosk/KioskShell";
import { StaffShell } from "@/components/kiosk/StaffShell";
import { DEMO_QUEUE, DEMO_VITALS } from "@/lib/demo-data";
import { useSession } from "@/lib/session-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/physician")({
  head: () => ({
    meta: [
      { title: "Physician review – MediKiosk" },
      { name: "description", content: "Review, edit and sign off the AI-drafted clinical summary; push to HIS and ABHA (mock)." },
      { property: "og:title", content: "Physician review – MediKiosk" },
      { property: "og:description", content: "Physician dashboard with editable summary and HIS/ABHA mock integration." },
    ],
  }),
  component: PhysicianPage,
});

function PhysicianPage() {
  const { state, redFlags, updateSummarySection, setSummaryStatus, set, generateSummary } = useSession();
  const [note, setNote] = useState(state.summary?.physicianNote ?? "");
  const [pushing, setPushing] = useState(false);
  const [log, setLog] = useState<string[]>([]);
  const s = state.summary;

  const push = async () => {
    if (!s) return;
    setPushing(true);
    const lines = [
      "POST https://his.mock.local/api/v1/encounters … 201 Created",
      `HIS encounter id: ENC-${Date.now().toString().slice(-6)}`,
      "POST https://abha.mock.gov.in/v0.5/health-information/transfer … 202 Accepted",
      `ABHA care-context linked: ${state.patient?.abha ?? "n/a"}`,
      "FHIR Bundle (Composition + Condition + MedicationStatement + Observation) validated ✓",
    ];
    for (const l of lines) {
      await new Promise((r) => setTimeout(r, 500));
      setLog((x) => [...x, l]);
    }
    set("integration", { his: `ENC-${Date.now().toString().slice(-6)}`, abha: "linked" });
    setSummaryStatus("pushed", note);
    setPushing(false);
    toast.success("Record pushed to HIS & ABHA (mock).");
  };

  return (
    <StaffShell role="physician">
      <div className="grid gap-6 xl:grid-cols-[280px_1fr_300px]">
        {/* Queue */}
        <aside className="space-y-3">
          <h2 className="flex items-center gap-2 font-bold"><Users className="size-4 text-primary" /> Today's queue</h2>
          {state.patient && (
            <div className="rounded-2xl border-2 border-primary bg-accent/50 p-4">
              <div className="flex items-center justify-between"><span className="font-bold">{state.patient.name}</span>{redFlags.length > 0 && <Siren className="size-4 text-danger" />}</div>
              <div className="text-xs text-muted-foreground">{state.patient.age}{state.patient.sex} · {state.patient.uhid}</div>
              <div className="mt-1 text-xs font-semibold text-primary">Kiosk intake · {s ? s.status : "in progress"}</div>
            </div>
          )}
          {DEMO_QUEUE.map((q) => (
            <div key={q.patient.id} className="rounded-2xl border bg-card p-4 opacity-80">
              <div className="flex items-center justify-between"><span className="font-bold">{q.patient.name}</span><span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold uppercase", q.priority === "urgent" ? "bg-warning/30 text-warning-foreground" : "bg-muted text-muted-foreground")}>{q.priority}</span></div>
              <div className="text-xs text-muted-foreground">{q.arrivedAt} · {q.chiefComplaint}</div>
            </div>
          ))}
          <DemoBadge />
        </aside>

        {/* Summary editor */}
        <section className="space-y-4">
          <AIDisclaimer />
          {!s ? (
            <div className="rounded-3xl border bg-card p-10 text-center shadow-card">
              <Stethoscope className="mx-auto mb-3 size-10 text-primary/50" />
              <p className="font-semibold">No kiosk summary in this session.</p>
              <p className="mb-4 text-sm text-muted-foreground">Complete a patient intake, or generate from current answers.</p>
              <div className="flex justify-center gap-2">
                <Button variant="hero" asChild><Link to="/">Start kiosk flow</Link></Button>
                {state.patient && <Button variant="soft" onClick={() => generateSummary()}>Generate from session</Button>}
              </div>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-3xl border bg-card p-4 shadow-card">
                <div>
                  <div className="text-xs font-bold uppercase tracking-widest text-primary">Patient</div>
                  <div className="text-xl font-bold">{state.patient?.name} <span className="text-sm font-normal text-muted-foreground">{state.patient?.age}{state.patient?.sex} · ABHA {state.patient?.abha}</span></div>
                </div>
                <div className="flex gap-3 text-center text-xs">
                  {Object.entries(DEMO_VITALS).map(([k, v]) => (
                    <div key={k} className="rounded-xl bg-muted px-3 py-1.5"><div className="font-display text-base font-bold">{v}</div><div className="uppercase text-muted-foreground">{k}</div></div>
                  ))}
                </div>
              </div>
              {s.sections.map((sec) => (
                <div key={sec.id} className={cn("rounded-3xl border bg-card p-4 shadow-card", sec.id === "red-flags" && "border-danger/50")}>
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                    <label htmlFor={`sec-${sec.id}`} className="font-bold">{sec.title}</label>
                    <div className="flex flex-wrap gap-1">
                      {sec.sources.slice(0, 5).map((src, j) => (
                        <span key={j} className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-[10px] font-bold text-secondary-foreground">
                          {src.kind === "document" ? <FileText className="size-3" /> : <Link2 className="size-3" />}
                          {src.kind === "document" ? (state.docs.find((d) => d.id === src.ref)?.title.split(" – ")[0] ?? "Doc") : src.ref}
                        </span>
                      ))}
                    </div>
                  </div>
                  <Textarea id={`sec-${sec.id}`} value={sec.text} onChange={(e) => updateSummarySection(sec.id, e.target.value.slice(0, 4000))} rows={Math.min(8, Math.max(2, sec.text.split("\n").length + 1))} className="rounded-2xl font-sans text-sm" disabled={s.status === "pushed"} />
                </div>
              ))}
              <div className="rounded-3xl border bg-card p-4 shadow-card">
                <label htmlFor="phy-note" className="font-bold">Physician assessment & plan</label>
                <Textarea id="phy-note" value={note} onChange={(e) => setNote(e.target.value.slice(0, 4000))} rows={4} placeholder="Your clinical assessment, plan, and orders. (Not AI-generated.)" className="mt-2 rounded-2xl" disabled={s.status === "pushed"} />
              </div>
            </>
          )}
        </section>

        {/* Actions */}
        <aside className="space-y-3">
          <div className="rounded-3xl border bg-card p-5 shadow-card">
            <h3 className="mb-3 font-bold">Sign-off</h3>
            <ol className="space-y-2 text-sm">
              {[
                { label: "AI draft generated", done: !!s },
                { label: "Physician reviewed", done: s?.status === "reviewed" || s?.status === "pushed" },
                { label: "Pushed to HIS / ABHA", done: s?.status === "pushed" },
              ].map((st) => (
                <li key={st.label} className="flex items-center gap-2">
                  <CheckCircle2 className={cn("size-4", st.done ? "text-success" : "text-border")} />
                  <span className={st.done ? "font-semibold" : "text-muted-foreground"}>{st.label}</span>
                </li>
              ))}
            </ol>
            <Button variant="hero" size="xl" className="mt-4 w-full" disabled={!s || s.status !== "draft"} onClick={() => { setSummaryStatus("reviewed", note); toast.success("Summary marked as physician-verified."); }}>
              <ClipboardCheck /> Mark verified
            </Button>
            <Button variant="kioskActive" size="xl" className="mt-2 w-full" disabled={!s || s.status !== "reviewed" || pushing} onClick={push}>
              <Send /> {pushing ? "Pushing…" : "Push to HIS + ABHA"}
            </Button>
          </div>
          <div className="rounded-3xl border bg-card p-5 shadow-card">
            <h3 className="mb-2 flex items-center gap-2 font-bold"><Cloud className="size-4 text-primary" /> Integration log (mock)</h3>
            {log.length === 0 ? (
              <p className="text-xs text-muted-foreground">No transactions yet.</p>
            ) : (
              <ul className="space-y-1 font-mono text-[11px] text-foreground">
                {log.map((l, i) => <li key={i} className="animate-fade-up break-all rounded bg-muted px-2 py-1">{l}</li>)}
              </ul>
            )}
          </div>
        </aside>
      </div>
    </StaffShell>
  );
}
