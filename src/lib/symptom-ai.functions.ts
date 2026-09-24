import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const Input = z.object({
  description: z.string().trim().min(3).max(800),
  language: z.string().max(10),
});

const Out = z.object({
  restatement: z.string(),
  questions: z.array(z.object({ question: z.string(), why: z.string() })),
  urgent: z.boolean(),
});

export type SymptomClarification = z.infer<typeof Out>;

export const clarifySymptom = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => Input.parse(i))
  .handler(async ({ data }): Promise<{ ok: true; result: SymptomClarification } | { ok: false; error: string }> => {
    const key = process.env["LOVABLE_API_KEY"];
    if (!key) return { ok: false, error: "AI is not configured." };
    const { streamText, Output } = await import("ai");
    const { createOpenAI } = await import("@ai-sdk/openai");
    const lovable = createOpenAI({
      baseURL: "https://ai.gateway.lovable.dev/v1",
      apiKey: key,
      headers: { "Lovable-API-Key": key, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
    });
    try {
      const result = streamText({
        model: lovable.responses("openai/gpt-6-astra"),
        output: Output.object({ schema: Out }),
        system:
          "You help a hospital intake kiosk. A patient describes a symptom in their own words. " +
          "Never diagnose, name diseases, or suggest treatment. Produce: a one-sentence plain restatement; " +
          "3 to 5 short, simple clarification questions (onset, location, character, triggers, associated symptoms) a patient can easily answer, each under 20 words, with a short 'why' for the doctor; " +
          "urgent=true only if the description suggests an emergency (chest pain, breathing difficulty, stroke signs, heavy bleeding, fainting, suicidal thoughts). " +
          `Write restatement and questions in the language with code "${data.language}" (use simple everyday words); write 'why' in English.`,
        prompt: data.description,
        maxRetries: 0,
        providerOptions: {
          openai: { forceReasoning: true, reasoningEffort: "low", reasoningSummary: "auto", store: false, include: ["reasoning.encrypted_content"] },
        },
      });
      const out = await result.output;
      return { ok: true, result: { ...out, questions: out.questions.slice(0, 5) } };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.includes("429")) return { ok: false, error: "Too many requests — please wait a moment and try again." };
      if (msg.includes("402")) return { ok: false, error: "AI credits exhausted. Please add credits to continue." };
      console.error("clarifySymptom", msg);
      return { ok: false, error: "The AI assistant couldn't process that. Please try again." };
    }
  });
