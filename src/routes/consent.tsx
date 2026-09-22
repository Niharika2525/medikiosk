import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, Check, Leaf, Lock, ShieldCheck, Volume2, Stethoscope } from "lucide-react";
import { Button } from "@/components/ui/button";
import { KioskShell, StepHeader } from "@/components/kiosk/KioskShell";
import { speechLocale, t } from "@/lib/i18n";
import { useSession } from "@/lib/session-store";
import { speak } from "@/lib/voice";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/consent")({
  head: () => ({
    meta: [
      { title: "Consent & privacy – MediKiosk" },
      { name: "description", content: "Review and give consent for AI-assisted clinical intake, document scanning and record sharing." },
      { property: "og:title", content: "Consent & privacy – MediKiosk" },
      { property: "og:description", content: "Consent-first, privacy-preserving patient intake." },
    ],
  }),
  component: ConsentPage,
});

const SCOPES = [
  { id: "interview", title: "Voice & touch interview", desc: "Your answers are recorded to prepare a history draft for your doctor." },
  { id: "documents", title: "Scan my documents", desc: "Prescriptions and reports are read by OCR to extract medicines and results." },
  { id: "share", title: "Share with my care team", desc: "Physician and triage staff at this facility can view the summary." },
  { id: "abha", title: "Link to ABHA (mock)", desc: "Push the visit record to your health locker after physician sign-off." },
];

function ConsentPage() {
  const { state, set } = useSession();
  const navigate = useNavigate();
  const lang = state.language;
  const [scopes, setScopes] = useState<string[]>(["interview", "documents", "share"]);
  const required = scopes.includes("interview");

  const toggle = (id: string) => setScopes((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const consentText = "We will ask you questions about your health and read your documents. Your data is private, used only for this visit, and erased from this kiosk when you finish.";

  return (
    <KioskShell>
      <StepHeader eyebrow="Step 3 of 7" title={t(lang, "consentTitle")} subtitle={consentText} />

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-3">
          {SCOPES.map((s, i) => {
            const on = scopes.includes(s.id);
            return (
              <button
                key={s.id}
                onClick={() => toggle(s.id)}
                aria-pressed={on}
                className={cn("flex w-full animate-fade-up items-center gap-4 rounded-3xl border-2 bg-card p-5 text-left shadow-card transition-all hover:border-primary/60", on ? "border-primary" : "border-border")}
                style={{ animationDelay: `${i * 0.06}s` }}
              >
                <span className={cn("grid size-12 shrink-0 place-items-center rounded-2xl border-2 transition-all", on ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background")}>
                  {on && <Check className="size-6" />}
                </span>
                <div>
                  <div className="text-lg font-bold">{s.title}</div>
                  <div className="text-sm text-muted-foreground">{s.desc}</div>
                </div>
              </button>
            );
          })}

          <div className="rounded-3xl border bg-card p-5 shadow-card">
            <div className="mb-3 text-sm font-bold uppercase tracking-wider text-primary">Consultation mode</div>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => set("ayush", false)} className={cn("flex min-h-20 items-center gap-3 rounded-2xl border-2 px-4 text-left transition-all", !state.ayush ? "border-primary bg-accent" : "border-border")}>
                <Stethoscope className="size-7 text-primary" />
                <div><div className="font-bold">Modern medicine</div><div className="text-xs text-muted-foreground">Standard history</div></div>
              </button>
              <button onClick={() => set("ayush", true)} className={cn("flex min-h-20 items-center gap-3 rounded-2xl border-2 px-4 text-left transition-all", state.ayush ? "border-primary bg-accent" : "border-border")}>
                <Leaf className="size-7 text-success" />
                <div><div className="font-bold">AYUSH mode</div><div className="text-xs text-muted-foreground">+ Dashavidha Pariksha</div></div>
              </button>
            </div>
          </div>
        </div>

        <aside className="space-y-4">
          <div className="rounded-3xl bg-gradient-deep p-5 text-primary-foreground shadow-glow">
            <Lock className="mb-3 size-8" />
            <h3 className="text-lg font-bold">Privacy by design</h3>
            <ul className="mt-2 space-y-1.5 text-sm opacity-90">
              <li>• Role-based access: patient, triage, physician</li>
              <li>• Session auto-resets after 2 min idle</li>
              <li>• AI never diagnoses or prescribes</li>
              <li>• Every summary line is traceable to its source</li>
            </ul>
          </div>
          <Button variant="soft" size="xl" className="w-full" onClick={() => speak(consentText, speechLocale(lang))}>
            <Volume2 /> Read aloud
          </Button>
          <Button
            variant="hero"
            size="touch"
            className="w-full"
            disabled={!required}
            onClick={() => {
              set("consent", { given: true, at: new Date().toISOString(), scopes });
              navigate({ to: "/interview" });
            }}
          >
            <ShieldCheck /> {t(lang, "iAgree")} <ArrowRight />
          </Button>
          {!required && <p className="text-center text-xs text-danger">Interview consent is required to continue.</p>}
        </aside>
      </div>
    </KioskShell>
  );
}
