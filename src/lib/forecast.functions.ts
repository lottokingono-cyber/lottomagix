import { createServerFn } from "@tanstack/react-start";
import { streamText } from "ai";
import { z } from "zod";

const NumberStat = z.object({ value: z.number(), count: z.number() });

const ForecastInput = z.object({
  gameName: z.string().default(""),
  provider: z.string().default(""),
  drawDate: z.string().default(""),
  initials: z.array(z.number()).min(1),
  hottest: z.array(NumberStat).default([]),
  reappeared: z.array(z.number()).default([]),
  crossGrid: z.array(NumberStat).default([]),
  duplicatePairs: z.array(z.string()).default([]),
  history: z
    .array(
      z.object({
        drawDate: z.string(),
        initials: z.array(z.number()),
        winning: z.array(z.number()).default([]),
      }),
    )
    .default([]),
});

export type ForecastResult = {
  numbers: number[];
  alternates: number[];
  rationale: string;
  confidence: string;
  error?: string;
};

function parseForecast(text: string): ForecastResult | null {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    const raw = JSON.parse(match[0]) as Record<string, unknown>;
    const nums = Array.isArray(raw["numbers"]) ? (raw["numbers"] as unknown[]) : [];
    const alts = Array.isArray(raw["alternates"]) ? (raw["alternates"] as unknown[]) : [];
    return {
      numbers: nums.map(Number).filter((n) => Number.isFinite(n)).slice(0, 5),
      alternates: alts.map(Number).filter((n) => Number.isFinite(n)).slice(0, 5),
      rationale: String(raw["rationale"] ?? ""),
      confidence: String(raw["confidence"] ?? "unknown"),
    };
  } catch {
    return null;
  }
}

export const forecastNumbers = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => ForecastInput.parse(input))
  .handler(async ({ data }): Promise<ForecastResult> => {
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) {
      return {
        numbers: [],
        alternates: [],
        rationale: "",
        confidence: "unavailable",
        error: "The forecasting service is not configured yet.",
      };
    }

    const { createLovableResponsesProvider } = await import("./ai-gateway.server");
    const { provider } = createLovableResponsesProvider(apiKey);

    const prompt = [
      `Game: ${data.gameName || "unnamed"} | Provider: ${data.provider || "unknown"} | Draw date: ${data.drawDate || "unspecified"}`,
      `Initial numbers (5 winning + 5 machine from the previous draw): ${data.initials.join(", ")}`,
      `Most frequent normalised numbers across all grids: ${data.hottest.map((h) => `${h.value}×${h.count}`).join(", ") || "none"}`,
      `Initial numbers that reappeared in the propagation grid: ${data.reappeared.join(", ") || "none"}`,
      `Numbers repeated in BOTH the propagation and difference grids: ${data.crossGrid.map((h) => `${h.value}×${h.count}`).join(", ") || "none"}`,
      `Pairs occurring in two or more frequency lines: ${data.duplicatePairs.slice(0, 40).join(", ") || "none"}`,
      data.history.length
        ? `Recent saved draws: ${data.history
            .map(
              (h) =>
                `${h.drawDate}: initials [${h.initials.join(" ")}]${h.winning.length ? ` winning [${h.winning.join(" ")}]` : ""}`,
            )
            .join(" | ")}`
        : "No saved draw history yet.",
    ].join("\n");

    const result = streamText({
      model: provider.responses("openai/gpt-6-astra"),
      system:
        "You analyse lottery number-propagation grids. Weigh the supplied frequency, cross-grid and pair statistics, plus any historical draws, and suggest five candidate numbers between 1 and 90. Be explicit that lottery draws are random and no forecast can be guaranteed. Reply with ONLY a JSON object: {\"numbers\":[5 integers],\"alternates\":[up to 5 integers],\"rationale\":\"2-4 sentences\",\"confidence\":\"low|medium|high\"}.",
      prompt,
      providerOptions: {
        openai: {
          store: false,
          forceReasoning: true,
          reasoningEffort: "low",
          reasoningSummary: "auto",
          include: ["reasoning.encrypted_content"],
        },
      },
    });

    try {
      const text = await result.text;
      const parsed = parseForecast(text);
      if (!parsed || parsed.numbers.length === 0) {
        return {
          numbers: [],
          alternates: [],
          rationale: text.slice(0, 600),
          confidence: "unknown",
          error: "The model did not return a usable set of numbers. Try again.",
        };
      }
      return parsed;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      return {
        numbers: [],
        alternates: [],
        rationale: "",
        confidence: "unavailable",
        error: `Forecast failed: ${message}`,
      };
    }
  });
