import { cn } from "@/lib/utils";

export function VoiceWaveform({ active, bars = 24, className }: { active: boolean; bars?: number; className?: string }) {
  return (
    <div className={cn("flex h-14 items-center justify-center gap-1", className)} aria-hidden>
      {Array.from({ length: bars }).map((_, i) => {
        const h = 30 + Math.abs(Math.sin(i * 0.9)) * 70;
        return (
          <span
            key={i}
            className={cn("w-1.5 rounded-full bg-gradient-primary origin-center", active ? "animate-wave" : "scale-y-[0.25] opacity-40")}
            style={{ height: `${h}%`, animationDelay: `${(i % 6) * 0.09}s`, animationDuration: `${0.8 + (i % 4) * 0.15}s` }}
          />
        );
      })}
    </div>
  );
}
