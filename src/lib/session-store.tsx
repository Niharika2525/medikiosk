import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import type { LangCode } from "./i18n";
import { DEMO_DOCS, type MedicalDoc, type Patient, type LabValue } from "./demo-data";
import { detectRedFlags, visibleQuestions, answerToText, type Answers, type RedFlag } from "./interview-engine";

export type SummarySource = { kind: "interview" | "document"; ref: string };
export type SummarySection = { id: string; title: string; text: string; sources: SummarySource[] };
export type ClinicalSummary = {
  generatedAt: string;
  sections: SummarySection[];
  status: "draft" | "reviewed" | "pushed";
  physicianNote?: string;
};

export type TimelineEvent = {
  date: string;
  title: string;
  detail: string;
  kind: "visit" | "lab" | "admission" | "symptom" | "medicine";
  source: string;
  abnormal?: boolean;
};

type SessionState = {
  patient: Patient | null;
  language: LangCode;
  consent: { given: boolean; at?: string; scopes: string[] };
  ayush: boolean;
  answers: Answers;
  interviewDone: boolean;
  docs: MedicalDoc[];
  summary: ClinicalSummary | null;
  redFlagAck: boolean;
  integration: { his?: string; abha?: string };
};

const initial: SessionState = {
  patient: null,
  language: "en",
  consent: { given: false, scopes: [] },
  ayush: false,
  answers: {},
  interviewDone: false,
  docs: DEMO_DOCS.map((d) => ({ ...d })),
  summary: null,
  redFlagAck: false,
  integration: {},
};

type Ctx = {
  state: SessionState;
  redFlags: RedFlag[];
  set: <K extends keyof SessionState>(k: K, v: SessionState[K]) => void;
  answer: (id: string, v: string | string[]) => void;
  reset: () => void;
  updateDoc: (id: string, patch: Partial<MedicalDoc>) => void;
  addDoc: (d: MedicalDoc) => void;
  generateSummary: () => ClinicalSummary;
  updateSummarySection: (id: string, text: string) => void;
  setSummaryStatus: (s: ClinicalSummary["status"], note?: string) => void;
  timeline: TimelineEvent[];
};

const SessionCtx = createContext<Ctx | null>(null);

export function isAbnormal(l: LabValue) {
  return (l.low != null && l.value < l.low) || (l.high != null && l.value > l.high);
}

export function refRange(l: LabValue) {
  if (l.low != null && l.high != null) return `${l.low}–${l.high} ${l.unit}`;
  if (l.high != null) return `< ${l.high} ${l.unit}`;
  if (l.low != null) return `> ${l.low} ${l.unit}`;
  return "no range printed";
}

function periodText(p?: { from: string | null; to: string | null }) {
  if (!p || (!p.from && !p.to)) return "";
  return ` (${p.from ?? "?"} → ${p.to ?? "?"})`;
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SessionState>(initial);

  const set = useCallback(<K extends keyof SessionState>(k: K, v: SessionState[K]) => {
    setState((s) => ({ ...s, [k]: v }));
  }, []);

  const answer = useCallback((id: string, v: string | string[]) => {
    setState((s) => ({ ...s, answers: { ...s.answers, [id]: v } }));
  }, []);

  const reset = useCallback(() => {
    setState({ ...initial, docs: DEMO_DOCS.map((d) => ({ ...d })) });
  }, []);

  const updateDoc = useCallback((id: string, patch: Partial<MedicalDoc>) => {
    setState((s) => ({ ...s, docs: s.docs.map((d) => (d.id === id ? { ...d, ...patch } : d)) }));
  }, []);

  const addDoc = useCallback((d: MedicalDoc) => {
    setState((s) => ({ ...s, docs: [d, ...s.docs] }));
  }, []);

  const redFlags = useMemo(() => detectRedFlags(state.answers), [state.answers]);

  const timeline = useMemo<TimelineEvent[]>(() => {
    const ev: TimelineEvent[] = [];
    for (const d of state.docs) {
      if (d.status !== "done" || !d.extracted) continue;
      const x = d.extracted;
      const pt = periodText(x.period);
      if (d.kind === "discharge") {
        ev.push({ date: x.period?.from ?? x.dates?.[0] ?? d.date, title: `Hospital admission${pt}`, detail: x.diagnoses?.join("; ") ?? "", kind: "admission", source: d.title });
      } else if (d.kind === "lab") {
        const abn = x.labs?.filter(isAbnormal) ?? [];
        ev.push({
          date: d.date,
          title: `Lab report (${x.labs?.length ?? 0} tests)${pt}`,
          detail: abn.length ? `${abn.length} abnormal: ${abn.map((l) => `${l.test} ${l.value} ${l.unit}`).join(", ")}` : "All values within range",
          kind: "lab",
          source: d.title,
          abnormal: abn.length > 0,
        });
      } else {
        ev.push({
          date: d.date,
          title: `${d.kind === "prescription" ? "OPD visit & prescription" : "Medical document"}${pt}`,
          detail: [
            (x.medicines ?? []).map((m) => `${m.name} ${m.dose}${m.startDate || m.endDate ? ` [${m.startDate ?? "?"} → ${m.endDate ?? "?"}]` : ""}`).join(", "),
            x.diagnoses?.length ? `Dx: ${x.diagnoses.join("; ")}` : "",
          ].filter(Boolean).join(" · "),
          kind: "visit",
          source: d.title,
        });
      }
    }
    if (state.answers["cc"]) {
      const dur = String(state.answers["duration"] ?? "");
      const today = new Date();
      const days = dur === "weeks" ? 21 : dur === "days" ? 3 : 0;
      const onset = new Date(today.getTime() - days * 86400000).toISOString().slice(0, 10);
      ev.push({ date: onset, title: "Current complaint onset", detail: `Reported at kiosk: ${String(state.answers["cc"]).replace("_", " ")}`, kind: "symptom", source: "Kiosk interview" });
    }
    return ev.sort((a, b) => a.date.localeCompare(b.date));
  }, [state.docs, state.answers]);

  const generateSummary = useCallback((): ClinicalSummary => {
    const qs = visibleQuestions(state.answers, state.ayush);
    const bySection = new Map<string, { lines: string[]; sources: SummarySource[] }>();
    for (const q of qs) {
      const v = state.answers[q.id];
      if (v === undefined || v === "" || (Array.isArray(v) && v.length === 0)) continue;
      const entry = bySection.get(q.section) ?? { lines: [], sources: [] };
      entry.lines.push(`${q.text.en.replace(/\?$/, "")}: ${answerToText(q, state.answers)}`);
      entry.sources.push({ kind: "interview", ref: `Q:${q.id}` });
      bySection.set(q.section, entry);
    }
    const sections: SummarySection[] = [...bySection.entries()].map(([title, e]) => ({
      id: title.toLowerCase().replace(/[^a-z]+/g, "-"),
      title,
      text: e.lines.join("\n"),
      sources: e.sources,
    }));
    if (state.answers["ai_symptom"]) {
      sections.push({ id: "ai-new-symptom", title: "Patient-described New Symptom (AI-clarified)", text: String(state.answers["ai_symptom"]), sources: [{ kind: "interview", ref: "Q:ai_symptom" }] });
    }

    const doneDocs = state.docs.filter((d) => d.status === "done" && d.extracted);
    if (doneDocs.length) {
      const meds = doneDocs.flatMap((d) => (d.extracted?.medicines ?? []).map((m) => ({ m, d })));
      if (meds.length) {
        sections.push({
          id: "documented-medicines",
          title: "Documented Medicines (from records)",
          text: meds.map(({ m }) => `${m.name} ${m.dose} — ${m.frequency}`).join("\n"),
          sources: [...new Set(meds.map(({ d }) => d.id))].map((id) => ({ kind: "document", ref: id })),
        });
      }
      const dx = doneDocs.flatMap((d) => (d.extracted?.diagnoses ?? []).map((x) => ({ x, d })));
      if (dx.length) {
        sections.push({
          id: "documented-diagnoses",
          title: "Documented Diagnoses (from records)",
          text: [...new Set(dx.map(({ x }) => x))].join("\n"),
          sources: [...new Set(dx.map(({ d }) => d.id))].map((id) => ({ kind: "document", ref: id })),
        });
      }
      const labs = doneDocs.flatMap((d) => (d.extracted?.labs ?? []).filter(isAbnormal).map((l) => ({ l, d })));
      if (labs.length) {
        sections.push({
          id: "abnormal-labs",
          title: "Abnormal Investigations",
          text: labs.map(({ l }) => `${l.test}: ${l.value} ${l.unit} (ref ${refRange(l)}) ${l.high != null && l.value > l.high ? "↑ HIGH" : "↓ LOW"}${l.date ? ` · ${l.date}` : ""}`).join("\n"),
          sources: [...new Set(labs.map(({ d }) => d.id))].map((id) => ({ kind: "document", ref: id })),
        });
      }
    }
    const flags = detectRedFlags(state.answers);
    if (flags.length) {
      sections.unshift({
        id: "red-flags",
        title: "Red Flags Detected",
        text: flags.map((f) => `${f.severity.toUpperCase()}: ${f.title} — ${f.detail}`).join("\n"),
        sources: flags.flatMap((f) => f.triggeredBy.map((q) => ({ kind: "interview" as const, ref: `Q:${q}` }))),
      });
    }
    sections.push({
      id: "impression",
      title: "AI Draft Impression (NOT a diagnosis)",
      text: "Structured intake complete. Correlate the reported complaint with documented history and abnormal values above. Physician to confirm assessment and plan.",
      sources: [{ kind: "interview", ref: "all" }],
    });
    const summary: ClinicalSummary = { generatedAt: new Date().toISOString(), sections, status: "draft" };
    setState((s) => ({ ...s, summary }));
    return summary;
  }, [state.answers, state.ayush, state.docs]);

  const updateSummarySection = useCallback((id: string, text: string) => {
    setState((s) =>
      s.summary
        ? { ...s, summary: { ...s.summary, sections: s.summary.sections.map((x) => (x.id === id ? { ...x, text } : x)) } }
        : s,
    );
  }, []);

  const setSummaryStatus = useCallback((status: ClinicalSummary["status"], note?: string) => {
    setState((s) => {
      if (!s.summary) return s;
      const summary: ClinicalSummary = { ...s.summary, status };
      const n = note ?? s.summary.physicianNote;
      if (n !== undefined) summary.physicianNote = n;
      return { ...s, summary };
    });
  }, []);

  const value = useMemo<Ctx>(
    () => ({ state, redFlags, set, answer, reset, updateDoc, addDoc, generateSummary, updateSummarySection, setSummaryStatus, timeline }),
    [state, redFlags, set, answer, reset, updateDoc, addDoc, generateSummary, updateSummarySection, setSummaryStatus, timeline],
  );

  return <SessionCtx.Provider value={value}>{children}</SessionCtx.Provider>;
}

export function useSession() {
  const c = useContext(SessionCtx);
  if (!c) throw new Error("useSession outside provider");
  return c;
}
