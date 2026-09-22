import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight, Bot, CheckCircle2, FileText, Link2, Sparkles, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { KioskShell, StepHeader, AIDisclaimer, DemoBadge } from "@/components/kiosk/KioskShell";
import { useSession } from "@/lib/session-store";
import { QUESTIONS } from "@/lib/interview-engine";

export const Route = createFileRoute("/summary")({
  head: () => ({
    meta: [
      { title: "AI clinical summary – MediKiosk" },
      { name: "description", content: "AI-generated, physician-ready clinical summary draft with source traceability." },
      { property: "og:title", content: "AI clinical summary – MediKiosk" },
      { property: "og:description", content: "Editable clinical summary with per-line source traceability." },
    ],
  }),
  component: SummaryPage,
});

function SummaryPage() {
  const { state, generateSummary } = useSession();
  const navigate = useNavigate();
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    if (!state.summary) generateSummary();
    const steps = [400, 900, 1400, 1900];
    const ids = steps.map((ms, i) => setTimeout(() => setPhase(i + 1), ms));
    return () => ids.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const s = state.summary;
  const stages = ["Reading interview answers", "Merging OCR extractions", "Cross-checking red flags", "Drafting summary"];

  return (
    <KioskShell wide>
      <StepHeader eyebrow="Step 7 of 7" title="AI clinical summary" subtitle="A structured draft your doctor will review. Every line shows where it came from." />
      <AIDisclaimer className="mb-4" />

      {phase < 4 ? (
        <div className="rounded-3xl border bg-card p-8 shadow-card">
          <div className="flex items-center gap-4">
            <div className="relative">
              <span className="absolute inset-0 rounded-2xl bg-primary/40 animate-pulse-ring" />
              <div className="relative grid size-14 place-items-center rounded-2xl bg-gradient-primary text-primary-foreground"><Bot className="size-7" /></div>
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-widest text-primary">Mock AI · working</div>
              <h3 className="text-xl font-bold">Composing your summary…</h3>
            </div>
          </div>
          <ul className="mt-6 space-y-3">
            {stages.map((st, i) => (
              <li key={st} className="flex items-center gap-3 text-sm font-semibold">
                {phase > i ? <CheckCircle2 className="size-5 text-success" /> : <span className={i === phase ? "size-5 rounded-full border-2 border-primary border-t-transparent animate-spin" : "size-5 rounded-full border-2 border-border"} />}
                <span className={phase > i ? "" : "text-muted-foreground"}>{st}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
          <div className="space-y-4">
            {s?.sections.map((sec, i) => (
              <section key={sec.id} className="animate-fade-up rounded-3xl border bg-card p-5 shadow-card" style={{ animationDelay: `${i * 0.05}s` }}>
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-lg font-bold">{sec.title}</h3>
                  <div className="flex flex-wrap gap-1">
                    {sec.sources.slice(0, 4).map((src, j) => {
                      const q = QUESTIONS.find((x) => `Q:${x.id}` === src.ref);
                      const d = state.docs.find((x) => x.id === src.ref);
                      return (
                        <span key={j} title={q?.text.en ?? d?.title ?? src.ref} className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-[10px] font-bold text-secondary-foreground">
                          {src.kind === "document" ? <FileText className="size-3" /> : <Link2 className="size-3" />}
                          {src.kind === "document" ? (d?.title.split(" – ")[0] ?? "Doc") : src.ref}
                        </span>
                      );
                    })}
                  </div>
                </div>
                <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-foreground">{sec.text}</pre>
              </section>
            ))}
          </div>
          <aside className="space-y-3">
            <div className="rounded-3xl bg-gradient-deep p-5 text-primary-foreground shadow-glow">
              <Sparkles className="mb-2 size-7" />
              <h3 className="text-lg font-bold">Ready for physician review</h3>
              <p className="mt-1 text-sm opacity-90">Generated {s && new Date(s.generatedAt).toLocaleTimeString()} · Status: <b>{s?.status}</b></p>
              <DemoBadge className="mt-3 border-primary-foreground/40 bg-primary-foreground/10 text-primary-foreground" />
            </div>
            <Button variant="hero" size="touch" className="w-full" onClick={() => navigate({ to: "/physician" })}>
              <UserCheck /> Send to physician <ArrowRight />
            </Button>
            <Button variant="kiosk" size="xl" className="w-full" asChild>
              <Link to="/patient">View my dashboard</Link>
            </Button>
            <Button variant="ghost" size="lg" className="w-full" onClick={() => { generateSummary(); setPhase(0); setTimeout(() => setPhase(4), 1200); }}>Regenerate draft</Button>
          </aside>
        </div>
      )}
    </KioskShell>
  );
}
