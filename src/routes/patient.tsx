import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarClock, FileCheck2, Pill, ShieldCheck, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StaffShell } from "@/components/kiosk/StaffShell";
import { AIDisclaimer, DemoBadge } from "@/components/kiosk/KioskShell";
import { useSession } from "@/lib/session-store";
import { LANGUAGES } from "@/lib/i18n";

export const Route = createFileRoute("/patient")({
  head: () => ({
    meta: [
      { title: "My health dashboard – MediKiosk" },
      { name: "description", content: "Patient view of consent, scanned records, current medicines and visit status." },
      { property: "og:title", content: "My health dashboard – MediKiosk" },
      { property: "og:description", content: "Your consent, records and visit summary in one place." },
    ],
  }),
  component: PatientPage,
});

function PatientPage() {
  const { state, timeline } = useSession();
  const p = state.patient;
  const meds = state.docs.filter((d) => d.status === "done").flatMap((d) => d.extracted?.medicines ?? []);
  const lang = LANGUAGES.find((l) => l.code === state.language);

  if (!p) {
    return (
      <StaffShell role="patient">
        <div className="rounded-3xl border bg-card p-10 text-center shadow-card">
          <p className="font-semibold">No patient signed in.</p>
          <Button className="mt-4" variant="hero" asChild><Link to="/">Go to kiosk login</Link></Button>
        </div>
      </StaffShell>
    );
  }

  return (
    <StaffShell role="patient">
      <div className="mb-6 rounded-3xl bg-gradient-deep p-6 text-primary-foreground shadow-glow">
        <div className="text-xs font-bold uppercase tracking-widest opacity-80">Namaste</div>
        <h1 className="text-3xl font-bold">{p.name}</h1>
        <p className="text-sm opacity-90">{p.age}{p.sex} · UHID {p.uhid} · ABHA {p.abha} · Language: {lang?.native}</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card icon={ShieldCheck} title="Consent">
          {state.consent.given ? (
            <ul className="text-sm">{state.consent.scopes.map((s) => <li key={s}>✓ {s}</li>)}<li className="mt-1 text-xs text-muted-foreground">{new Date(state.consent.at!).toLocaleString()}</li></ul>
          ) : <p className="text-sm text-muted-foreground">Not given yet</p>}
        </Card>
        <Card icon={FileCheck2} title="Visit status">
          <p className="text-sm">Interview: <b>{state.interviewDone ? "complete" : "in progress"}</b></p>
          <p className="text-sm">Summary: <b>{state.summary?.status ?? "not generated"}</b></p>
          <p className="text-sm">Red flags: <b>{state.summary?.sections.some((s) => s.id === "red-flags") ? "yes — staff notified" : "none"}</b></p>
        </Card>
        <Card icon={Pill} title="Medicines found in records">
          {meds.length ? <ul className="text-sm">{meds.map((m, i) => <li key={i}>{m.name} {m.dose} — {m.frequency}</li>)}</ul> : <p className="text-sm text-muted-foreground">Scan a prescription to see medicines</p>}
        </Card>
        <Card icon={Link2} title="Health locker (ABHA mock)">
          {state.integration.abha ? <p className="text-sm">✓ Visit record linked · HIS {state.integration.his}</p> : <p className="text-sm text-muted-foreground">Will link after physician sign-off</p>}
        </Card>
      </div>
      <div className="mt-6 rounded-3xl border bg-card p-5 shadow-card">
        <div className="mb-3 flex items-center justify-between"><h2 className="flex items-center gap-2 font-bold"><CalendarClock className="size-4 text-primary" /> My timeline</h2><DemoBadge /></div>
        {timeline.length === 0 ? <p className="text-sm text-muted-foreground">No events yet.</p> : (
          <ul className="space-y-2">{timeline.map((e, i) => <li key={i} className="flex gap-3 text-sm"><span className="w-24 shrink-0 font-semibold text-primary">{e.date}</span><span><b>{e.title}</b> — {e.detail}</span></li>)}</ul>
        )}
      </div>
      <AIDisclaimer className="mt-4" />
    </StaffShell>
  );
}

function Card({ icon: Icon, title, children }: { icon: typeof Pill; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-3xl border bg-card p-5 shadow-card">
      <div className="mb-2 flex items-center gap-2 font-bold"><Icon className="size-4 text-primary" /> {title}</div>
      {children}
    </div>
  );
}
