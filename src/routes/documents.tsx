import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { ArrowRight, Camera, CheckCircle2, FileText, FlaskConical, Hospital, Pill, ScanLine, Upload, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { KioskShell, StepHeader, DemoBadge, AIDisclaimer } from "@/components/kiosk/KioskShell";
import { type MedicalDoc } from "@/lib/demo-data";
import { isAbnormal, useSession } from "@/lib/session-store";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/documents")({
  head: () => ({
    meta: [
      { title: "Scan documents & OCR – MediKiosk" },
      { name: "description", content: "Upload prescriptions, lab reports and discharge summaries; OCR extracts medicines, diagnoses and abnormal values." },
      { property: "og:title", content: "Scan documents & OCR – MediKiosk" },
      { property: "og:description", content: "OCR-based extraction of medicines, diagnoses, investigations and dates." },
    ],
  }),
  component: DocumentsPage,
});

const KIND_ICON = { prescription: Pill, lab: FlaskConical, discharge: Hospital, other: FileText } as const;

function DocumentsPage() {
  const { state, updateDoc, addDoc } = useSession();
  const navigate = useNavigate();
  const lang = state.language;
  const fileRef = useRef<HTMLInputElement>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  const scan = (d: MedicalDoc) => {
    updateDoc(d.id, { status: "scanning" });
    setTimeout(() => {
      updateDoc(d.id, { status: "done", confidence: 0.86 + Math.random() * 0.12 });
      setOpenId(d.id);
      toast.success(`OCR complete: ${d.title}`);
    }, 1800);
  };

  const onFile = (files: FileList | null) => {
    const f = files?.[0];
    if (!f) return;
    if (f.size > 20 * 1024 * 1024) return toast.error("File too large (max 20 MB).");
    const d: MedicalDoc = {
      id: `u-${Date.now()}`,
      title: f.name.slice(0, 60),
      kind: "other",
      date: new Date().toISOString().slice(0, 10),
      status: "pending",
      demo: true,
      extracted: {
        facility: "Unknown facility (mock OCR)",
        dates: [new Date().toISOString().slice(0, 10)],
        medicines: [{ name: "Paracetamol", dose: "650 mg", frequency: "SOS" }],
        investigations: ["Text detected — mock extraction for uploaded file"],
      },
    };
    addDoc(d);
    scan(d);
  };

  const doneCount = state.docs.filter((d) => d.status === "done").length;

  return (
    <KioskShell wide>
      <StepHeader eyebrow="Step 5 of 7" title={t(lang, "reviewDocs")} subtitle="Place a prescription, lab report or discharge summary under the camera, or upload a file. The AI reads it and pulls out medicines, diagnoses, test values and dates." />

      <div className="grid gap-6 lg:grid-cols-[1fr_1.3fr]">
        <div className="space-y-4">
          <div className="relative overflow-hidden rounded-3xl border-2 border-dashed border-primary/50 bg-card p-6 text-center shadow-card">
            <div className="pointer-events-none absolute inset-x-6 h-0.5 bg-gradient-primary opacity-70 animate-scan" />
            <Camera className="mx-auto size-12 text-primary" />
            <h3 className="mt-3 text-xl font-bold">Camera scanner</h3>
            <p className="text-sm text-muted-foreground">Kiosk document camera (simulated)</p>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <Button variant="hero" size="xl" onClick={() => { const p = state.docs.find((d) => d.status === "pending"); p ? scan(p) : toast.info("All demo documents scanned."); }}>
                <ScanLine /> Scan next document
              </Button>
              <Button variant="kiosk" size="xl" onClick={() => fileRef.current?.click()}>
                <Upload /> Upload file
              </Button>
              <input ref={fileRef} type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => onFile(e.target.files)} />
            </div>
          </div>
          <div className="rounded-3xl border bg-card p-5 shadow-card">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-bold">Documents in this session</h3>
              <DemoBadge />
            </div>
            <ul className="space-y-2">
              {state.docs.map((d) => {
                const Icon = KIND_ICON[d.kind];
                return (
                  <li key={d.id}>
                    <button
                      onClick={() => (d.status === "done" ? setOpenId(d.id) : scan(d))}
                      className={cn("flex w-full items-center gap-3 rounded-2xl border-2 p-3 text-left transition-all hover:border-primary", openId === d.id ? "border-primary bg-accent/50" : "border-border")}
                    >
                      <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-secondary text-secondary-foreground"><Icon className="size-5" /></span>
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-semibold">{d.title}</div>
                        <div className="text-xs text-muted-foreground">{d.date} · {d.kind}</div>
                      </div>
                      {d.status === "pending" && <span className="text-xs font-bold text-primary">Tap to scan</span>}
                      {d.status === "scanning" && <span className="h-2 w-16 rounded-full skeleton-shimmer" />}
                      {d.status === "done" && <CheckCircle2 className="size-5 text-success" />}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        <div className="space-y-4">
          <ExtractionPanel doc={state.docs.find((d) => d.id === openId) ?? null} />
          <AIDisclaimer />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="xl" onClick={() => navigate({ to: "/timeline" })}>{t(lang, "skip")}</Button>
            <Button variant="hero" size="xl" onClick={() => navigate({ to: "/timeline" })}>
              {t(lang, "continue")} ({doneCount} scanned) <ArrowRight />
            </Button>
          </div>
        </div>
      </div>
    </KioskShell>
  );
}

function ExtractionPanel({ doc }: { doc: MedicalDoc | null }) {
  if (!doc || doc.status !== "done" || !doc.extracted) {
    return (
      <div className="flex min-h-72 flex-col items-center justify-center rounded-3xl border bg-card p-8 text-center text-muted-foreground shadow-card">
        <FileText className="mb-3 size-10 text-primary/50" />
        <p className="font-semibold">Scan a document to see extracted data</p>
        <p className="text-sm">Medicines · Diagnoses · Investigations · Values · Dates</p>
      </div>
    );
  }
  const x = doc.extracted;
  return (
    <div className="animate-fade-up rounded-3xl border bg-card p-5 shadow-card sm:p-6">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
        <div>
          <div className="text-xs font-bold uppercase tracking-widest text-primary">OCR extraction</div>
          <h3 className="text-xl font-bold">{doc.title}</h3>
          <p className="text-sm text-muted-foreground">{x.facility}{x.doctor ? ` · ${x.doctor}` : ""}</p>
        </div>
        <span className="rounded-full bg-success/15 px-3 py-1 text-xs font-bold text-success">Confidence {(100 * (doc.confidence ?? 0.9)).toFixed(0)}%</span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {x.diagnoses && (
          <Field label="Diagnoses">
            {x.diagnoses.map((d) => <Chip key={d}>{d}</Chip>)}
          </Field>
        )}
        {x.dates && (
          <Field label="Dates">
            {x.dates.map((d) => <Chip key={d}>{d}</Chip>)}
          </Field>
        )}
        {x.medicines && (
          <Field label="Medicines" full>
            <table className="w-full text-sm">
              <tbody>
                {x.medicines.map((m) => (
                  <tr key={m.name} className="border-b last:border-0">
                    <td className="py-1.5 font-semibold">{m.name}</td>
                    <td className="py-1.5 text-muted-foreground">{m.dose}</td>
                    <td className="py-1.5 text-muted-foreground">{m.frequency}</td>
                    <td className="py-1.5 text-right text-muted-foreground">{m.duration ?? ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Field>
        )}
        {x.investigations && (
          <Field label="Investigations" full>
            {x.investigations.map((d) => <Chip key={d}>{d}</Chip>)}
          </Field>
        )}
        {x.labs && (
          <Field label="Lab values" full>
            <div className="space-y-1.5">
              {x.labs.map((l) => {
                const abn = isAbnormal(l);
                const pct = Math.min(100, Math.max(0, ((l.value - l.low) / (l.high - l.low || 1)) * 100));
                return (
                  <div key={l.test} className={cn("grid grid-cols-[1fr_auto] items-center gap-3 rounded-xl px-3 py-2", abn ? "bg-danger/10" : "bg-muted/60")}>
                    <div>
                      <div className="flex items-center gap-2 text-sm font-semibold">
                        {abn && <AlertCircle className="size-4 text-danger" />} {l.test}
                        <span className="text-xs font-normal text-muted-foreground">ref {l.low}–{l.high} {l.unit}</span>
                      </div>
                      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-border">
                        <div className={cn("h-full rounded-full", abn ? "bg-danger" : "bg-success")} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                    <div className={cn("text-right font-display text-lg font-bold tabular-nums", abn ? "text-danger" : "text-foreground")}>
                      {l.value} <span className="text-xs font-normal">{l.unit}</span>
                      {abn && <span className="ml-1 text-xs">{l.value > l.high ? "↑" : "↓"}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </Field>
        )}
      </div>
    </div>
  );
}

function Field({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <div className={cn(full && "sm:col-span-2")}>
      <div className="mb-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}
function Chip({ children }: { children: React.ReactNode }) {
  return <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-semibold text-secondary-foreground">{children}</span>;
}
