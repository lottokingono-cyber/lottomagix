import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { forecastNumbers, type ForecastResult } from "@/lib/forecast.functions";
import { padNumber } from "@/lib/propagation";

type Stat = { value: number; count: number };

type Props = {
  gameName: string;
  provider: string;
  drawDate: string;
  initials: number[];
  hottest: Stat[];
  reappeared: number[];
  crossGrid: Stat[];
  duplicatePairs: string[];
  savedPairSearches: {
    label: string;
    numbers: number[];
    pairs: { pair: string; occurrences: number; where: string[] }[];
  }[];
  history: { drawDate: string; initials: number[]; winning: number[] }[];
};

export function ForecastPanel(props: Props) {
  const run = useServerFn(forecastNumbers);
  const [result, setResult] = useState<ForecastResult | null>(null);
  const [busy, setBusy] = useState(false);

  const handleForecast = async () => {
    setBusy(true);
    setResult(null);
    try {
      const data = await run({ data: props });
      setResult(data);
    } catch (e) {
      setResult({
        numbers: [],
        alternates: [],
        rationale: "",
        confidence: "unavailable",
        error: e instanceof Error ? e.message : "The forecast could not be produced.",
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="mt-10 rounded-xl border border-border bg-card p-5 shadow-sm">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground">
        AI Forecast — Next 5 Numbers
      </h2>
      <p className="mt-1 text-xs text-muted-foreground">
        Uses every grid statistic on this page plus your saved draw history. Lottery draws are
        random — treat this as analysis, never as a guarantee.
      </p>
      <button
        onClick={() => void handleForecast()}
        disabled={busy}
        className="mt-4 rounded-md bg-primary px-6 py-2.5 text-sm font-bold tracking-wide text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 disabled:opacity-60"
      >
        {busy ? "FORECASTING…" : "FORECAST NUMBERS"}
      </button>

      {result && (
        <div className="mt-5">
          {result.error && <p className="text-sm font-medium text-destructive">{result.error}</p>}
          {result.numbers.length > 0 && (
            <>
              <div className="flex flex-wrap gap-2">
                {result.numbers.map((n) => (
                  <span
                    key={n}
                    className="rounded-lg border border-crossmatch-border bg-crossmatch px-4 py-2 font-mono text-lg font-bold tabular-nums text-crossmatch-foreground"
                  >
                    {padNumber(n)}
                  </span>
                ))}
              </div>
              {result.alternates.length > 0 && (
                <p className="mt-3 font-mono text-sm text-muted-foreground">
                  Alternates: {result.alternates.map((n) => padNumber(n)).join(" · ")}
                </p>
              )}
              <p className="mt-3 text-xs uppercase tracking-wide text-muted-foreground">
                Confidence: {result.confidence}
              </p>
            </>
          )}
          {result.rationale && (
            <p className="mt-3 max-w-3xl text-sm text-foreground">{result.rationale}</p>
          )}
        </div>
      )}
    </section>
  );
}
