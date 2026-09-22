import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { KioskShell, StepHeader } from "@/components/kiosk/KioskShell";
import { LANGUAGES, speechLocale, t } from "@/lib/i18n";
import { useSession } from "@/lib/session-store";
import { speak } from "@/lib/voice";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/language")({
  head: () => ({
    meta: [
      { title: "Choose language – MediKiosk" },
      { name: "description", content: "Select your preferred Indian language for voice and touch interaction." },
      { property: "og:title", content: "Choose language – MediKiosk" },
      { property: "og:description", content: "Multilingual patient intake in 7 Indian languages." },
    ],
  }),
  component: LanguagePage,
});

function LanguagePage() {
  const { state, set } = useSession();
  const navigate = useNavigate();
  const lang = state.language;

  return (
    <KioskShell>
      <StepHeader eyebrow="Step 2 of 7" title={t(lang, "chooseLanguage")} subtitle="अपनी भाषा चुनें · మీ భాషను ఎంచుకోండి · உங்கள் மொழியைத் தேர்வுசெய்க" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {LANGUAGES.map((l, i) => (
          <button
            key={l.code}
            onClick={() => {
              set("language", l.code);
              speak(t(l.code, "welcome"), l.speech);
            }}
            className={cn(
              "group flex min-h-24 animate-fade-up items-center justify-between rounded-3xl border-2 bg-card px-6 py-5 text-left shadow-card transition-all hover:border-primary hover:shadow-glow active:scale-[0.98]",
              lang === l.code ? "border-primary bg-accent" : "border-border",
            )}
            style={{ animationDelay: `${i * 0.05}s` }}
            aria-pressed={lang === l.code}
          >
            <div>
              <div className="font-display text-2xl font-bold">{l.native}</div>
              <div className="text-sm text-muted-foreground">{l.name}</div>
            </div>
            <span
              className={cn("grid size-11 place-items-center rounded-full border transition-colors", lang === l.code ? "bg-primary text-primary-foreground" : "bg-background text-primary group-hover:bg-secondary")}
              aria-hidden
            >
              <Volume2 className="size-5" />
            </span>
          </button>
        ))}
      </div>
      <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
        <Button variant="soft" size="xl" onClick={() => speak(t(lang, "chooseLanguage"), speechLocale(lang))}>
          <Volume2 /> {t(lang, "speak").split(" ")[0]} / Listen
        </Button>
        <Button variant="hero" size="xl" onClick={() => navigate({ to: "/consent" })}>
          {t(lang, "continue")} <ArrowRight />
        </Button>
      </div>
    </KioskShell>
  );
}
