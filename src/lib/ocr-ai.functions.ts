import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const Input = z.object({
  fileName: z.string().max(200),
  mimeType: z.enum(["image/jpeg", "image/png", "image/webp", "application/pdf"]),
  base64: z.string().min(100).max(14_000_000),
});

const Out = z.object({
  isMedicalDocument: z.boolean(),
  kind: z.enum(["prescription", "lab", "discharge", "other"]),
  title: z.string(),
  facility: z.string().nullable(),
  doctor: z.string().nullable(),
  documentDate: z.string().nullable(),
  periodFrom: z.string().nullable(),
  periodTo: z.string().nullable(),
  diagnoses: z.array(z.string()),
  investigations: z.array(z.string()),
  medicines: z.array(
    z.object({
      name: z.string(),
      dose: z.string(),
      frequency: z.string(),
      duration: z.string().nullable(),
      startDate: z.string().nullable(),
      endDate: z.string().nullable(),
    }),
  ),
  labs: z.array(
    z.object({
      test: z.string(),
      value: z.number(),
      unit: z.string(),
      low: z.number().nullable(),
      high: z.number().nullable(),
      date: z.string().nullable(),
    }),
  ),
  confidence: z.number(),
});

export type DocExtraction = z.infer<typeof Out>;

const SYSTEM =
  "You are an OCR and data-extraction engine for a hospital intake kiosk. Read the attached medical document (printed or handwritten, any Indian language or English) and extract ONLY what is actually written. Never invent, guess, diagnose or add advice. " +
  "Dates: ISO YYYY-MM-DD; if only month/year, use the 1st. documentDate = report/visit date. periodFrom/periodTo = the date range the document covers (admission→discharge, sample collection→report, prescription date→end of course); null if unknown. " +
  "Medicines: brand/generic name as written, dose WITH unit (e.g. '500 mg', '10 ml'), frequency expanded plainly (e.g. '1-0-1 → twice daily'), duration as written, startDate/endDate computed from document date + duration when possible. " +
  "Labs: numeric value, exact unit as printed (mg/dL, g/dL, mmol/L, %, cells/µL…), low/high from the printed reference range (null if absent; for '<200' use low null high 200). Skip non-numeric results but list them in investigations. " +
  "Diagnoses exactly as written by the clinician. title: short human title like 'Lab report – Apex Diagnostics'. confidence 0–1 reflecting legibility. If the image is not a medical document set isMedicalDocument=false and leave arrays empty.";

export const extractDocument = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => Input.parse(i))
  .handler(async ({ data }): Promise<{ ok: true; result: DocExtraction } | { ok: false; error: string }> => {
    const key = process.env["LOVABLE_API_KEY"];
    if (!key) return { ok: false, error: "AI is not configured." };
    const { streamText, Output } = await import("ai");
    const { createOpenAI } = await import("@ai-sdk/openai");
    const lovable = createOpenAI({
      baseURL: "https://ai.gateway.lovable.dev/v1",
      apiKey: key,
      headers: { "Lovable-API-Key": key, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
    });
    const part =
      data.mimeType === "application/pdf"
        ? ({ type: "file", filename: data.fileName || "document.pdf", data: data.base64, mediaType: "application/pdf" } as const)
        : ({ type: "image", image: new URL(`data:${data.mimeType};base64,${data.base64}`) } as const);
    try {
      const result = streamText({
        model: lovable.responses("openai/gpt-6-astra"),
        output: Output.object({ schema: Out }),
        system: SYSTEM,
        messages: [{ role: "user", content: [{ type: "text", text: "Extract this medical document." }, part] }],
        maxRetries: 0,
        providerOptions: {
          openai: { forceReasoning: true, reasoningEffort: "low", reasoningSummary: "auto", store: false, include: ["reasoning.encrypted_content"] },
        },
      });
      const out = await result.output;
      return { ok: true, result: out };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error("extractDocument", msg);
      if (msg.includes("429")) return { ok: false, error: "Too many requests — please wait a moment and try again." };
      if (msg.includes("402")) return { ok: false, error: "AI credits exhausted. Please add credits to continue." };
      return { ok: false, error: "Couldn't read that document. Try a clearer, well-lit photo or a PDF." };
    }
  });
