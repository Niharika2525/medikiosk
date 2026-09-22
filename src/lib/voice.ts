import { useCallback, useEffect, useRef, useState } from "react";

export function speak(text: string, locale: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  try {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = locale;
    u.rate = 0.92;
    const v = window.speechSynthesis.getVoices().find((x) => x.lang.replace("_", "-") === locale);
    if (v) u.voice = v;
    window.speechSynthesis.speak(u);
  } catch {
    /* ignore */
  }
}

export function stopSpeaking() {
  if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
}

type RecognitionLike = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  start: () => void;
  stop: () => void;
};

/** Browser speech recognition with a simulated fallback so the demo always works. */
export function useSpeechInput(locale: string, demoFallback: string) {
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(true);
  const [transcript, setTranscript] = useState("");
  const recRef = useRef<RecognitionLike | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const w = window as unknown as { SpeechRecognition?: new () => RecognitionLike; webkitSpeechRecognition?: new () => RecognitionLike };
    setSupported(Boolean(w.SpeechRecognition || w.webkitSpeechRecognition));
  }, []);

  const stop = useCallback(() => {
    recRef.current?.stop();
    if (timerRef.current) clearTimeout(timerRef.current);
    setListening(false);
  }, []);

  const start = useCallback(() => {
    stopSpeaking();
    setTranscript("");
    setListening(true);
    const w = window as unknown as { SpeechRecognition?: new () => RecognitionLike; webkitSpeechRecognition?: new () => RecognitionLike };
    const Ctor = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (Ctor) {
      const rec = new Ctor();
      rec.lang = locale;
      rec.interimResults = true;
      rec.continuous = false;
      rec.onresult = (e) => {
        let s = "";
        for (let i = 0; i < e.results.length; i++) s += e.results[i]?.[0]?.transcript ?? "";
        setTranscript(s);
      };
      rec.onend = () => setListening(false);
      rec.onerror = () => {
        // fall back to demo transcript
        simulate();
      };
      recRef.current = rec;
      try {
        rec.start();
        return;
      } catch {
        /* fallthrough */
      }
    }
    simulate();

    function simulate() {
      const words = demoFallback.split(" ");
      let i = 0;
      const tick = () => {
        i++;
        setTranscript(words.slice(0, i).join(" "));
        if (i < words.length) timerRef.current = setTimeout(tick, 160);
        else timerRef.current = setTimeout(() => setListening(false), 500);
      };
      timerRef.current = setTimeout(tick, 400);
    }
  }, [locale, demoFallback]);

  useEffect(() => () => stop(), [stop]);

  return { listening, supported, transcript, start, stop, setTranscript };
}
