import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Sparkles, Siren, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { clarifySymptom, type SymptomClarification } from "@/lib/symptom-ai.functions";

type Props = {
  language: string;
  onAnswers: (description: string, qa: { question: string; answer: string }[]) => void;
};

export function NewSymptomPanel({ language, onAnswers }: Props) {
  const run = useServerFn(clarifySymptom);
  const [open, setOpen] = useState(false);
  const [desc, setDesc] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [res, setRes] = useState<SymptomClarification | null>(null);
  const [ans, setAns] = useState<string[]>([]);

  const ask = async () => {
    setLoading(true);
    setError(null);
    setRes(null);
    try {
      const r = await run({ data: { description: desc, language } });
      if (r.ok) {
        setRes(r.result);
        setAns(r.result.questions.map(() => ""));
      } else setError(r.error);
    } catch {
      setError("Couldn't reach the AI assistant. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const save = () => {
    if (!res) return;
    onAnswers(desc.trim(), res.questions.map((q, i) => ({ question: q.question, answer: ans[i]?.trim() ?? "" })));
    setOpen(false);
    setDesc("");
    setRes(null);
  };

  if (!open)
    return (
      <Button variant="soft" size="lg" className="rounded-full" onClick={() => setOpen(true)}>
        <Sparkles /> Describe a new symptom
      </Button>
    );

  return (
    <div className="animate-fade-up space-y-4 rounded-3xl border bg-card p-5 shadow-card">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-primary">
          <Sparkles className="size-4" /> Tell us in your own words
        </div>
        <button onClick={() => setOpen(false)} aria-label="Close" className="rounded-full p-1 hover:bg-accent"><X className="size-4" /></button>
      </div>
      <Textarea value={desc} onChange={(e) => setDesc(e.target.value)} maxLength={800} rows={3} placeholder="e.g. My left knee has been swelling since Sunday and hurts on stairs" className="rounded-2xl text-lg" />
      <Button variant="hero" size="lg" onClick={ask} disabled={loading || desc.trim().length < 3}>
        {loading ? <><Loader2 className="animate-spin" /> Thinking…</> : "Get follow-up questions"}
      </Button>
      {error && <p className="rounded-xl border border-danger/40 bg-danger/10 p-3 text-sm text-danger">{error}</p>}
      {res && (
        <div className="space-y-3">
          {res.urgent && (
            <div className="flex items-center gap-2 rounded-xl border border-danger/40 bg-danger/10 p-3 text-sm font-semibold text-danger">
              <Siren className="size-4" /> This may need urgent attention — please tell the front desk now.
            </div>
          )}
          <p className="text-sm text-muted-foreground">You said: <span className="font-semibold text-foreground">{res.restatement}</span></p>
          {res.questions.map((q, i) => (
            <div key={i} className="space-y-1">
              <label className="font-semibold">{q.question}</label>
              <Textarea rows={1} maxLength={300} value={ans[i] ?? ""} onChange={(e) => setAns((a) => a.map((x, j) => (j === i ? e.target.value : x)))} className="rounded-xl" />
            </div>
          ))}
          <Button variant="hero" size="lg" onClick={save}>Add to my history</Button>
          <p className="text-xs text-muted-foreground">AI-generated draft — physician verification required.</p>
        </div>
      )}
    </div>
  );
}
