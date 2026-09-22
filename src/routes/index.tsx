import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Fingerprint, Phone, QrCode, ScanFace, Sparkles, Users, ArrowRight, Mic, FileScan, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { KioskShell, DemoBadge } from "@/components/kiosk/KioskShell";
import { VoiceWaveform } from "@/components/kiosk/VoiceWaveform";
import { DEMO_PATIENTS, type Patient } from "@/lib/demo-data";
import { useSession } from "@/lib/session-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MediKiosk – AI-Powered Clinical History & Patient Intake" },
      { name: "description", content: "Multilingual voice and touch patient intake kiosk with AI adaptive questioning, document OCR, medical timeline and physician-ready clinical summaries." },
      { property: "og:title", content: "MediKiosk – AI-Powered Clinical History & Patient Intake" },
      { property: "og:description", content: "Voice-first, multilingual clinical intake with red-flag detection, OCR and physician review." },
    ],
  }),
  component: LoginPage,
});

type Method = "abha" | "phone" | "walkin";

function LoginPage() {
  const { set, reset } = useSession();
  const navigate = useNavigate();
  const [method, setMethod] = useState<Method>("abha");
  const [value, setValue] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");

  const login = (p: Patient) => {
    reset();
    set("patient", p);
    navigate({ to: "/language" });
  };

  const submit = () => {
    if (method === "walkin") {
      login({ id: "walkin", name: "Guest Patient", age: 40, sex: "O", abha: "—", phone: value || "—", uhid: `UH-TEMP-${Math.floor(Math.random() * 9000 + 1000)}` });
      return;
    }
    if (!otpSent) {
      setOtpSent(true);
      return;
    }
    login(DEMO_PATIENTS[0]!);
  };

  return (
    <KioskShell step={0} wide>
      <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_1fr]">
        <section className="animate-fade-up">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-card px-3 py-1 text-xs font-bold text-primary shadow-soft">
            <Sparkles className="size-3.5" /> AI intake assistant · 7 Indian languages
          </div>
          <h1 className="text-4xl font-bold leading-[1.05] sm:text-6xl">
            Your health story, <span className="text-gradient">heard clearly.</span>
          </h1>
          <p className="mt-4 max-w-xl text-lg text-muted-foreground">
            Speak or tap to share your symptoms. Scan your old prescriptions and reports. MediKiosk prepares a clear, traceable summary for your doctor before you even sit down.
          </p>
          <div className="mt-6 grid max-w-xl grid-cols-3 gap-3">
            {[
              { icon: Mic, label: "Voice + touch" },
              { icon: FileScan, label: "Scan reports" },
              { icon: ShieldCheck, label: "Consent-first" },
            ].map((f) => (
              <div key={f.label} className="flex items-center gap-2 rounded-2xl border bg-card/80 px-3 py-3 text-sm font-semibold shadow-card">
                <f.icon className="size-5 text-primary" /> {f.label}
              </div>
            ))}
          </div>
          <div className="mt-8 rounded-3xl bg-gradient-deep p-5 text-primary-foreground shadow-glow">
            <div className="mb-2 flex items-center justify-between text-xs font-semibold uppercase tracking-widest opacity-80">
              <span>AI assistant standing by</span>
              <span className="flex items-center gap-1"><span className="size-2 animate-pulse rounded-full bg-mint" /> Live</span>
            </div>
            <VoiceWaveform active bars={32} className="h-16" />
            <p className="mt-2 text-center text-sm opacity-90">"Namaste! I'll guide you step by step. Take your time."</p>
          </div>
        </section>

        <section className="animate-fade-up rounded-3xl border bg-card p-6 shadow-card sm:p-8" style={{ animationDelay: "0.1s" }}>
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-2xl font-bold">Patient login</h2>
            <DemoBadge />
          </div>
          <div className="mb-5 grid grid-cols-3 gap-2" role="tablist">
            {(
              [
                { id: "abha", icon: Fingerprint, label: "ABHA ID" },
                { id: "phone", icon: Phone, label: "Mobile OTP" },
                { id: "walkin", icon: Users, label: "Walk-in" },
              ] as const
            ).map((m) => (
              <button
                key={m.id}
                role="tab"
                aria-selected={method === m.id}
                onClick={() => {
                  setMethod(m.id);
                  setOtpSent(false);
                }}
                className={cn(
                  "flex min-h-20 flex-col items-center justify-center gap-1.5 rounded-2xl border-2 text-sm font-semibold transition-all",
                  method === m.id ? "border-primary bg-accent text-accent-foreground shadow-soft" : "border-border bg-card hover:border-primary/50",
                )}
              >
                <m.icon className="size-6 text-primary" /> {m.label}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            <label className="text-sm font-semibold" htmlFor="login-id">
              {method === "abha" ? "14-digit ABHA number" : method === "phone" ? "Mobile number" : "Name or mobile (optional)"}
            </label>
            <Input
              id="login-id"
              inputMode={method === "walkin" ? "text" : "numeric"}
              maxLength={40}
              placeholder={method === "abha" ? "91-2345-6789-0123" : method === "phone" ? "98765 43210" : "Guest"}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="h-14 rounded-2xl text-lg"
            />
            {otpSent && method !== "walkin" && (
              <div className="animate-fade-up space-y-2">
                <label className="text-sm font-semibold" htmlFor="otp">Enter OTP (demo: any 4 digits)</label>
                <Input id="otp" inputMode="numeric" maxLength={6} value={otp} onChange={(e) => setOtp(e.target.value)} className="h-14 rounded-2xl text-center text-2xl tracking-[0.5em]" placeholder="••••" />
              </div>
            )}
            <Button variant="hero" size="xl" className="w-full" onClick={submit}>
              {method === "walkin" ? "Start as walk-in" : otpSent ? "Verify & continue" : "Send OTP"} <ArrowRight />
            </Button>
          </div>

          <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
            <div className="h-px flex-1 bg-border" /> or quick demo login <div className="h-px flex-1 bg-border" />
          </div>
          <div className="grid gap-2">
            {DEMO_PATIENTS.map((p) => (
              <button key={p.id} onClick={() => login(p)} className="flex items-center justify-between rounded-2xl border bg-background px-4 py-3 text-left transition-all hover:border-primary hover:shadow-soft">
                <div className="flex items-center gap-3">
                  <div className="grid size-10 place-items-center rounded-full bg-secondary font-bold text-secondary-foreground">{p.name[0]}</div>
                  <div>
                    <div className="font-semibold">{p.name}</div>
                    <div className="text-xs text-muted-foreground">{p.age}{p.sex} · ABHA {p.abha}</div>
                  </div>
                </div>
                <ArrowRight className="size-4 text-primary" />
              </button>
            ))}
          </div>
          <div className="mt-5 flex items-center justify-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><QrCode className="size-3.5" /> QR scan</span>
            <span className="flex items-center gap-1"><ScanFace className="size-3.5" /> Face ID</span>
            <span>— coming soon (mock)</span>
          </div>
        </section>
      </div>
    </KioskShell>
  );
}
