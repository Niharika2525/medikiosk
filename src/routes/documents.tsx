import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, Camera, CheckCircle2, FileText, FlaskConical, Hospital, Pill, ScanLine, Upload, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { KioskShell, StepHeader, DemoBadge, AIDisclaimer } from "@/components/kiosk/KioskShell";
import { type MedicalDoc } from "@/lib/demo-data";
import { isAbnormal, refRange, useSession } from "@/lib/session-store";
import { extractDocument } from "@/lib/ocr-ai.functions";
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

async function fileToPayload(f: File | Blob, name: string) {
  const type = f.type;
  if (type === "application/pdf") {
    const buf = new Uint8Array(await f.arrayBuffer());
    let s = "";
    for (let i = 0; i < buf.length; i += 0x8000) s += String.fromCharCode(...buf.subarray(i, i + 0x8000));
    return { fileName: name, mimeType: "application/pdf" as const, base64: btoa(s) };
  }
  // Downscale images to keep upload small while staying legible.
  const bmp = await createImageBitmap(f);
  const scale = Math.min(1, 2000 / Math.max(bmp.width, bmp.height));
  const c = document.createElement("canvas");
  c.width = Math.round(bmp.width * scale);
  c.height = Math.round(bmp.height * scale);
  c.getContext("2d")!.drawImage(bmp, 0, 0, c.width, c.height);
  const url = c.toDataURL("image/jpeg", 0.88);
  return { fileName: name, mimeType: "image/jpeg" as const, base64: url.split(",")[1] };
}

function DocumentsPage() {
  const { state, updateDoc, addDoc } = useSession();
  const navigate = useNavigate();
  const lang = state.language;
  const fileRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [camOn, setCamOn] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const extract = useServerFn(extractDocument);

  useEffect(() => () => streamRef.current?.getTracks().forEach((t) => t.stop()), []);

  const loadSample = (d: MedicalDoc) => {
    updateDoc(d.id, { status: "done", confidence: 1 });
    setOpenId(d.id);
    toast.info(`Sample record loaded (demo): ${d.title}`);
  };

  const runOcr = async (blob: Blob, name: string): Promise<void> => {
    if (blob.size > 10 * 1024 * 1024) { toast.error("File too large (max 10 MB)."); return; }
    if (!["image/jpeg", "image/png", "image/webp", "application/pdf"].includes(blob.type)) { toast.error("Please use a JPG, PNG, WEBP photo or a PDF."); return; }
    const id = `u-${Date.now()}`;
    addDoc({ id, title: name.slice(0, 60), kind: "other", date: new Date().toISOString().slice(0, 10), status: "scanning", demo: false });
    try {
      const r = await extract({ data: await fileToPayload(blob, name) });
      if (!r.ok) throw new Error(r.error);
      const x = r.result;
      if (!x.isMedicalDocument) {
        updateDoc(id, { status: "done", title: `${name.slice(0, 40)} (not a medical document)`, confidence: x.confidence, extracted: {} });
        toast.warning("That doesn't look like a medical document.");
        return;
      }
      const dates = [...new Set([x.documentDate, x.periodFrom, x.periodTo, ...x.labs.map((l) => l.date)].filter((v): v is string => !!v))].sort();
      updateDoc(id, {
        status: "done",
        title: x.title || name,
        kind: x.kind,
        date: x.documentDate ?? x.periodFrom ?? new Date().toISOString().slice(0, 10),
        confidence: Math.max(0, Math.min(1, x.confidence)),
        extracted: {
          ...(x.facility ? { facility: x.facility } : {}),
          ...(x.doctor ? { doctor: x.doctor } : {}),
          ...(x.diagnoses.length ? { diagnoses: x.diagnoses } : {}),
          ...(x.investigations.length ? { investigations: x.investigations } : {}),
          ...(x.medicines.length ? { medicines: x.medicines } : {}),
          ...(x.labs.length ? { labs: x.labs } : {}),
          ...(dates.length ? { dates } : {}),
          ...(x.periodFrom || x.periodTo ? { period: { from: x.periodFrom, to: x.periodTo } } : {}),
        },
      });
      setOpenId(id);
      toast.success(`Read: ${x.title}`);
    } catch (e) {
      updateDoc(id, { status: "failed", title: `${name.slice(0, 40)} — couldn't read` });
      toast.error(e instanceof Error ? e.message : "Couldn't read that document.");
    }
  };

  const startCam = async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment", width: { ideal: 1920 } } });
      streamRef.current = s;
      setCamOn(true);
      requestAnimationFrame(() => { if (videoRef.current) { videoRef.current.srcObject = s; void videoRef.current.play(); } });
    } catch {
      toast.error("Camera not available. Use Upload file instead.");
    }
  };
  const stopCam = () => { streamRef.current?.getTracks().forEach((t) => t.stop()); streamRef.current = null; setCamOn(false); };
  const capture = () => {
    const v = videoRef.current;
    if (!v || !v.videoWidth) return;
    const c = document.createElement("canvas");
    c.width = v.videoWidth; c.height = v.videoHeight;
    c.getContext("2d")!.drawImage(v, 0, 0);
    c.toBlob((b) => { if (b) void runOcr(b, `Camera scan ${new Date().toLocaleTimeString()}`); }, "image/jpeg", 0.9);
    stopCam();
  };

  const onFile = (files: FileList | null) => {
    const f = files?.[0];
    if (fileRef.current) fileRef.current.value = "";
    if (f) void runOcr(f, f.name);
  };

  const doneCount = state.docs.filter((d) => d.status === "done").length;

  return (
    <KioskShell wide>
      <StepHeader eyebrow="Step 5 of 7" title={t(lang, "reviewDocs")} subtitle="Hold a prescription, lab report or discharge summary up to the camera, or upload a photo/PDF. The AI reads it and pulls out medicines, diagnoses, test values, units and dates." />

      <div className="grid gap-6 lg:grid-cols-[1fr_1.3fr]">
        <div className="space-y-4">
          <div className="relative overflow-hidden rounded-3xl border-2 border-dashed border-primary/50 bg-card p-6 text-center shadow-card">
            {camOn ? (
              <video ref={videoRef} playsInline muted className="mx-auto aspect-[4/3] w-full rounded-2xl bg-muted object-cover" />
            ) : (
              <>
                <div className="pointer-events-none absolute inset-x-6 h-0.5 bg-gradient-primary opacity-70 animate-scan" />
                <Camera className="mx-auto size-12 text-primary" />
                <h3 className="mt-3 text-xl font-bold">Document scanner</h3>
                <p className="text-sm text-muted-foreground">Real AI reading · photos (JPG/PNG) or PDF up to 10 MB</p>
              </>
            )}
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {camOn ? (
                <>
                  <Button variant="hero" size="xl" onClick={capture}><ScanLine /> Capture & read</Button>
                  <Button variant="kiosk" size="xl" onClick={stopCam}>Cancel</Button>
                </>
              ) : (
                <>
                  <Button variant="hero" size="xl" onClick={startCam}><Camera /> Use camera</Button>
                  <Button variant="kiosk" size="xl" onClick={() => fileRef.current?.click()}><Upload /> Upload file</Button>
                </>
              )}
              <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,application/pdf" className="hidden" onChange={(e) => onFile(e.target.files)} />
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
                      onClick={() => (d.status === "done" ? setOpenId(d.id) : d.status === "pending" ? loadSample(d) : undefined)}
                      className={cn("flex w-full items-center gap-3 rounded-2xl border-2 p-3 text-left transition-all hover:border-primary", openId === d.id ? "border-primary bg-accent/50" : "border-border")}
                    >
                      <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-secondary text-secondary-foreground"><Icon className="size-5" /></span>
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-semibold">{d.title}</div>
                        <div className="text-xs text-muted-foreground">{d.date} · {d.kind}{d.demo ? " · sample" : " · AI-read"}</div>
                      </div>
                      {d.status === "pending" && <span className="text-xs font-bold text-primary">Load sample</span>}
                      {d.status === "scanning" && <span className="flex items-center gap-2 text-xs font-bold text-primary">Reading… <span className="h-2 w-12 rounded-full skeleton-shimmer" /></span>}
                      {d.status === "failed" && <AlertCircle className="size-5 text-danger" />}
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
          <div className="text-xs font-bold uppercase tracking-widest text-primary">AI document reading</div>
          <h3 className="text-xl font-bold">{doc.title}</h3>
          <p className="text-sm text-muted-foreground">{x.facility}{x.doctor ? ` · ${x.doctor}` : ""}</p>
        </div>
        <span className="rounded-full bg-success/15 px-3 py-1 text-xs font-bold text-success">{doc.demo ? "Sample · " : ""}Confidence {(100 * (doc.confidence ?? 0.9)).toFixed(0)}%</span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {x.diagnoses && (
          <Field label="Diagnoses">
            {x.diagnoses.map((d) => <Chip key={d}>{d}</Chip>)}
          </Field>
        )}
        {x.dates && (
          <Field label={x.period ? `Dates · covers ${x.period.from ?? "?"} → ${x.period.to ?? "?"}` : "Dates"}>
            {x.dates.map((d) => <Chip key={d}>{d}</Chip>)}
          </Field>
        )}
        {x.medicines && (
          <Field label="Medicines" full>
            <table className="w-full text-sm">
              <tbody>
                {x.medicines.map((m, i) => (
                  <tr key={`${m.name}-${i}`} className="border-b last:border-0">
                    <td className="py-1.5 font-semibold">{m.name}</td>
                    <td className="py-1.5 text-muted-foreground">{m.dose}</td>
                    <td className="py-1.5 text-muted-foreground">{m.frequency}</td>
                    <td className="py-1.5 text-right text-muted-foreground">
                      {m.duration ?? ""}
                      {(m.startDate || m.endDate) && <div className="text-xs">{m.startDate ?? "?"} → {m.endDate ?? "?"}</div>}
                    </td>
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
              {x.labs.map((l, i) => {
                const abn = isAbnormal(l);
                const hasRange = l.low != null && l.high != null;
                const pct = hasRange ? Math.min(100, Math.max(0, ((l.value - l.low!) / (l.high! - l.low! || 1)) * 100)) : 50;
                const high = l.high != null && l.value > l.high;
                return (
                  <div key={`${l.test}-${i}`} className={cn("grid grid-cols-[1fr_auto] items-center gap-3 rounded-xl px-3 py-2", abn ? "bg-danger/10" : "bg-muted/60")}>
                    <div>
                      <div className="flex flex-wrap items-center gap-2 text-sm font-semibold">
                        {abn && <AlertCircle className="size-4 text-danger" />} {l.test}
                        <span className="text-xs font-normal text-muted-foreground">ref {refRange(l)}{l.date ? ` · ${l.date}` : ""}</span>
                      </div>
                      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-border">
                        <div className={cn("h-full rounded-full", abn ? "bg-danger" : hasRange ? "bg-success" : "bg-muted-foreground/40")} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                    <div className={cn("text-right font-display text-lg font-bold tabular-nums", abn ? "text-danger" : "text-foreground")}>
                      {l.value} <span className="text-xs font-normal">{l.unit}</span>
                      {abn && <span className="ml-1 text-xs">{high ? "↑" : "↓"}</span>}
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
