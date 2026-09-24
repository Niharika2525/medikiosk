import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, ArrowLeft, ArrowRight, Bot, Check, Mic, MicOff, Siren, Volume2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { KioskShell, AIDisclaimer } from "@/components/kiosk/KioskShell";
import { VoiceWaveform } from "@/components/kiosk/VoiceWaveform";
import { NewSymptomPanel } from "@/components/kiosk/NewSymptomPanel";
import { speechLocale, t } from "@/lib/i18n";
import { visibleQuestions, type Question } from "@/lib/interview-engine";
import { useSession } from "@/lib/session-store";
import { speak, stopSpeaking, useSpeechInput } from "@/lib/voice";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/interview")({
  head: () => ({
    meta: [
      { title: "AI interview – MediKiosk" },
      { name: "description", content: "Adaptive voice and touch clinical history interview with red-flag detection." },
      { property: "og:title", content: "AI interview – MediKiosk" },
      { property: "og:description", content: "Adaptive AI questioning across chief complaint, HPI, history, medicines, allergies and ROS." },
    ],
  }),
  component: InterviewPage,
});

const DEMO_SPEECH: Record<string, string> = {
  cc_other: "I have been feeling dizzy when I stand up for the last two days",
  meds_list: "Metformin five hundred in the morning and night, and one small white tablet for BP",
  ay_vaya: "I sleep late and wake up tired, motion is regular",
};

function InterviewPage() {
  const { state, answer, set, redFlags } = useSession();
  const navigate = useNavigate();
  const lang = state.language;
  const [idx, setIdx] = useState(0);
  const [text, setText] = useState("");
  const [multi, setMulti] = useState<string[]>([]);
  const [thinking, setThinking] = useState(false);
  const [flagShown, setFlagShown] = useState<string[]>([]);

  const qs = useMemo(() => visibleQuestions(state.answers, state.ayush), [state.answers, state.ayush]);
  const q: Question | undefined = qs[idx];
  const progress = Math.round((idx / qs.length) * 100);
  const locale = speechLocale(lang);
  const qText = q ? (q.text[lang] ?? q.text.en) : "";

  const voice = useSpeechInput(locale, (q && DEMO_SPEECH[q.id]) ?? "Yes, since yesterday evening");

  useEffect(() => {
    if (!q) return;
    setText(typeof state.answers[q.id] === "string" && q.type === "text" ? String(state.answers[q.id]) : "");
    setMulti(Array.isArray(state.answers[q.id]) ? (state.answers[q.id] as string[]) : []);
    voice.setTranscript("");
    const id = setTimeout(() => speak(qText, locale), 350);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q?.id]);

  useEffect(() => {
    if (voice.transcript) setText(voice.transcript);
  }, [voice.transcript]);

  useEffect(() => {
    const fresh = redFlags.filter((f) => !flagShown.includes(f.id));
    if (fresh.length) {
      setFlagShown((s) => [...s, ...fresh.map((f) => f.id)]);
      fresh.forEach((f) =>
        toast.error(`Red flag: ${f.title}`, { description: "Triage staff have been alerted (demo). Please stay seated.", duration: 8000 }),
      );
    }
  }, [redFlags, flagShown]);

  const advance = (next = idx + 1) => {
    stopSpeaking();
    voice.stop();
    setThinking(true);
    setTimeout(() => {
      setThinking(false);
      if (next >= qs.length) {
        set("interviewDone", true);
        navigate({ to: "/documents" });
      } else setIdx(next);
    }, 550);
  };

  const choose = (v: string) => {
    if (!q) return;
    answer(q.id, v);
    advance();
  };

  const submitCurrent = () => {
    if (!q) return;
    if (q.type === "multi") answer(q.id, multi);
    else if (q.type === "text") answer(q.id, text.trim().slice(0, 500));
    advance();
  };

  if (!q) return null;

  const sectionIdx = [...new Set(qs.map((x) => x.section))];

  return (
    <KioskShell wide>
      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        {/* Section rail */}
        <aside className="hidden lg:block">
          <div className="sticky top-24 space-y-1 rounded-3xl border bg-card p-4 shadow-card">
            <div className="mb-3 text-xs font-bold uppercase tracking-widest text-primary">History sections</div>
            {sectionIdx.map((s) => {
              const first = qs.findIndex((x) => x.section === s);
              const last = qs.map((x) => x.section).lastIndexOf(s);
              const done = idx > last;
              const active = idx >= first && idx <= last;
              return (
                <div key={s} className={cn("flex items-center gap-2 rounded-xl px-3 py-2 text-sm", active && "bg-accent font-bold text-accent-foreground", done && "text-primary")}>
                  <span className={cn("grid size-5 place-items-center rounded-full border text-[10px]", done ? "border-primary bg-primary text-primary-foreground" : active ? "border-primary" : "border-border")}>{done ? <Check className="size-3" /> : ""}</span>
                  <span className="leading-tight">{s}</span>
                </div>
              );
            })}
            {redFlags.length > 0 && (
              <div className="mt-3 rounded-xl border border-danger/40 bg-danger/10 p-3 text-xs font-semibold text-danger">
                <Siren className="mb-1 size-4" /> {redFlags.length} red flag{redFlags.length > 1 ? "s" : ""} sent to triage
              </div>
            )}
          </div>
        </aside>

        <section className="space-y-4">
          {/* Progress */}
          <div className="flex items-center gap-3">
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-gradient-primary transition-all duration-500" style={{ width: `${progress}%` }} />
            </div>
            <span className="text-xs font-bold text-muted-foreground">{idx + 1} / {qs.length}</span>
          </div>

          {/* AI assistant bubble */}
          <div key={q.id} className="animate-fade-up rounded-3xl border bg-card p-5 shadow-card sm:p-7">
            <div className="flex items-start gap-4">
              <div className="relative shrink-0">
                <span className="absolute inset-0 rounded-2xl bg-primary/40 animate-pulse-ring" />
                <div className="relative grid size-14 place-items-center rounded-2xl bg-gradient-primary text-primary-foreground shadow-soft">
                  <Bot className="size-7" />
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary">
                  {t(lang, "aiAssistant")} · {q.section}
                  <button onClick={() => speak(qText, locale)} className="rounded-full p-1 hover:bg-accent" aria-label="Repeat question"><Volume2 className="size-4" /></button>
                </div>
                <h2 className="text-2xl font-bold leading-snug sm:text-3xl">{qText}</h2>
                {lang !== "en" && q.text[lang] && <p className="mt-1 text-sm text-muted-foreground">{q.text.en}</p>}
              </div>
            </div>

            <div className="mt-6">
              {q.type === "choice" && (
                <div className="grid gap-3 sm:grid-cols-2">
                  {q.options?.map((o) => (
                    <Button key={o.value} variant={state.answers[q.id] === o.value ? "kioskActive" : "kiosk"} size="touch" className="justify-start whitespace-normal text-left" onClick={() => choose(o.value)}>
                      <span className="text-2xl" aria-hidden>{o.icon}</span> {o.label[lang] ?? o.label.en}
                    </Button>
                  ))}
                </div>
              )}

              {q.type === "multi" && (
                <div className="grid gap-3 sm:grid-cols-2">
                  {q.options?.map((o) => {
                    const on = multi.includes(o.value);
                    return (
                      <Button
                        key={o.value}
                        variant={on ? "kioskActive" : "kiosk"}
                        size="touch"
                        className="justify-start whitespace-normal text-left"
                        aria-pressed={on}
                        onClick={() =>
                          setMulti((m) => (o.value === "none" ? ["none"] : on ? m.filter((x) => x !== o.value) : [...m.filter((x) => x !== "none"), o.value]))
                        }
                      >
                        <span className="text-2xl" aria-hidden>{o.icon}</span> {o.label[lang] ?? o.label.en}
                        {on && <Check className="ml-auto" />}
                      </Button>
                    );
                  })}
                </div>
              )}

              {q.type === "scale" && (
                <div className="grid grid-cols-5 gap-2 sm:grid-cols-10">
                  {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                    <button
                      key={n}
                      onClick={() => choose(String(n))}
                      className={cn(
                        "grid aspect-square place-items-center rounded-2xl border-2 text-xl font-bold shadow-card transition-all hover:scale-105",
                        n <= 3 ? "border-success/40 bg-success/10 text-success" : n <= 6 ? "border-warning/60 bg-warning/20 text-warning-foreground" : "border-danger/50 bg-danger/10 text-danger",
                      )}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              )}

              {q.type === "text" && (
                <div className="space-y-3">
                  <div className={cn("rounded-3xl border-2 p-4 transition-colors", voice.listening ? "border-primary bg-accent/40" : "border-border bg-background")}>
                    <VoiceWaveform active={voice.listening} />
                    <p className="text-center text-sm font-semibold text-muted-foreground">
                      {voice.listening ? t(lang, "listening") : voice.supported ? t(lang, "speak") : "Voice input simulated on this browser"}
                    </p>
                  </div>
                  <Textarea value={text} onChange={(e) => setText(e.target.value)} maxLength={500} rows={3} placeholder={t(lang, "typeAnswer")} className="rounded-2xl text-lg" />
                </div>
              )}
            </div>
          </div>

          {/* Voice + nav controls */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex gap-2">
              <Button variant="outline" size="xl" onClick={() => idx > 0 && setIdx(idx - 1)} disabled={idx === 0}>
                <ArrowLeft /> {t(lang, "back")}
              </Button>
              {q.type === "text" && (
                <Button variant={voice.listening ? "danger" : "soft"} size="xl" onClick={() => (voice.listening ? voice.stop() : voice.start())}>
                  {voice.listening ? <MicOff /> : <Mic />} {voice.listening ? "Stop" : t(lang, "speak")}
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="xl" onClick={() => advance()}>{t(lang, "skip")}</Button>
              {(q.type === "multi" || q.type === "text") && (
                <Button variant="hero" size="xl" onClick={submitCurrent} disabled={thinking || (q.type === "multi" && multi.length === 0)}>
                  {thinking ? "Thinking…" : t(lang, "next")} <ArrowRight />
                </Button>
              )}
            </div>
          </div>

          <NewSymptomPanel
            language={lang}
            onAnswers={(d, qa) => {
              const prev = String(state.answers["ai_symptom"] ?? "");
              const block = `New symptom: ${d}\n${qa.filter((x) => x.answer).map((x) => `- ${x.question} → ${x.answer}`).join("\n")}`;
              answer("ai_symptom", prev ? `${prev}\n\n${block}` : block);
              toast.success("Added to your history for the doctor.");
            }}
          />

          <div className="flex flex-wrap items-center gap-3">
            <Button variant="danger" size="lg" className="rounded-full" onClick={() => { answer("severity", "10"); toast.error("Emergency alert sent to triage desk (demo)."); }}>
              <AlertTriangle /> {t(lang, "emergency")}
            </Button>
            <AIDisclaimer className="flex-1" />
          </div>
        </section>
      </div>
    </KioskShell>
  );
}
