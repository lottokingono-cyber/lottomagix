import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  ROW_LABELS,
  COL_COUNT,
  duplicateSet,
  formatNumber,
  frequencyGroups,
  frequencyMap,
  generateGrid,
  normalize,
  reappearedInitials,
  summaryStats,
} from "@/lib/propagation";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Number Propagation & Duplicate Detector" },
      {
        name: "description",
        content:
          "Enter 10 numbers, propagate them across an 8×10 grid by subtracting 11, and instantly detect duplicate and reappearing numbers.",
      },
      { property: "og:title", content: "Number Propagation & Duplicate Detector" },
      {
        property: "og:description",
        content:
          "Propagate 10 numbers across an 8×10 grid and detect duplicates and reappearing initial numbers automatically.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Index,
});

type CellState = "neutral" | "duplicate" | "reappeared";

function cellState(
  rowIndex: number,
  value: number,
  duplicates: Set<number>,
  reappeared: Set<number>,
): CellState {
  const key = normalize(value);
  if (rowIndex === 0 && reappeared.has(key)) return "reappeared";
  if (duplicates.has(key)) return "duplicate";
  return "neutral";
}

const CELL_STYLES: Record<CellState, string> = {
  neutral: "bg-card text-foreground border-border",
  duplicate: "bg-duplicate text-duplicate-foreground border-duplicate-border font-semibold",
  reappeared: "bg-reappeared text-reappeared-foreground border-reappeared-border font-semibold",
};

function Index() {
  const [inputs, setInputs] = useState<string[]>(Array(COL_COUNT).fill(""));
  const [error, setError] = useState<string | null>(null);
  const [initials, setInitials] = useState<number[] | null>(null);

  const result = useMemo(() => {
    if (!initials) return null;
    const grid = generateGrid(initials);
    const freq = frequencyMap(grid);
    return {
      grid,
      freq,
      duplicates: duplicateSet(freq),
      reappeared: reappearedInitials(grid),
      groups: frequencyGroups(freq),
      stats: summaryStats(freq, reappearedInitials(grid)),
    };
  }, [initials]);

  const handleChange = (index: number, raw: string) => {
    if (raw !== "" && raw !== "-" && !/^-?\d*\.?\d*$/.test(raw)) return;
    setInputs((prev) => prev.map((v, i) => (i === index ? raw : v)));
  };

  const handleGenerate = () => {
    const parsed = inputs.map((v) => (v.trim() === "" || v.trim() === "-" ? NaN : Number(v)));
    if (parsed.some((n) => Number.isNaN(n) || !Number.isFinite(n))) {
      setError("Please enter all 10 valid numbers before generating.");
      return;
    }
    setError(null);
    setInitials(parsed);
  };

  const handleClear = () => {
    setInputs(Array(COL_COUNT).fill(""));
    setInitials(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <header className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            Analytical Tool
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Number Propagation &amp; Duplicate Detector
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Enter 10 initial numbers. Each row below subtracts 11 from the row above. Matching
            ignores the minus sign.
          </p>
        </header>

        {/* Input section */}
        <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground">
            Enter 10 Initial Numbers
          </h2>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
            {inputs.map((value, i) => (
              <label key={i} className="block">
                <span className="mb-1 block text-xs font-medium text-muted-foreground">
                  Number {i + 1}
                </span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={value}
                  onChange={(e) => handleChange(i, e.target.value)}
                  placeholder="0"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-sm text-foreground outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/30"
                />
              </label>
            ))}
          </div>
          {error && <p className="mt-3 text-sm font-medium text-destructive">{error}</p>}
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              onClick={handleGenerate}
              className="rounded-md bg-primary px-6 py-2.5 text-sm font-bold tracking-wide text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
            >
              GENERATE GRID
            </button>
            <button
              onClick={handleClear}
              className="rounded-md border border-border bg-secondary px-6 py-2.5 text-sm font-semibold tracking-wide text-secondary-foreground transition-colors hover:bg-secondary/70"
            >
              CLEAR
            </button>
          </div>
        </section>

        {result && (
          <>
            {/* Legend */}
            <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-3 w-3 rounded-sm border border-duplicate-border bg-duplicate" />
                Appears more than once
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-3 w-3 rounded-sm border border-reappeared-border bg-reappeared" />
                Initial number reappeared
              </span>
            </div>

            {/* Grid */}
            <section className="mt-3 overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
              <table className="w-full min-w-[640px] border-collapse">
                <thead>
                  <tr>
                    <th className="border-b border-border bg-muted/60 px-3 py-2 text-left text-xs font-semibold text-muted-foreground">
                      Row
                    </th>
                    {Array.from({ length: COL_COUNT }, (_, c) => (
                      <th
                        key={c}
                        className="border-b border-border bg-muted/60 px-2 py-2 text-center font-mono text-xs font-semibold text-muted-foreground"
                      >
                        {c + 1}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {result.grid.map((row, r) => (
                    <tr key={r}>
                      <td className="whitespace-nowrap border-b border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground">
                        {ROW_LABELS[r]}
                      </td>
                      {row.map((value, c) => {
                        const state = cellState(r, value, result.duplicates, result.reappeared);
                        return (
                          <td
                            key={c}
                            className={`border-b border-l px-2 py-1.5 text-center font-mono text-sm tabular-nums ${CELL_STYLES[state]}`}
                          >
                            {formatNumber(value)}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>

            {/* Summary stats */}
            <section className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {[
                ["Total cells", result.stats.totalCells],
                ["Unique numbers", result.stats.uniqueNumbers],
                ["Appearing once", result.stats.appearingOnce],
                ["Appearing more than once", result.stats.appearingMoreThanOnce],
                ["Total duplicate cells", result.stats.duplicateCells],
                ["Initial numbers reappearing", result.stats.initialReappearing],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="rounded-lg border border-border bg-card p-3 shadow-sm"
                >
                  <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    {label}
                  </p>
                  <p className="mt-1 font-mono text-xl font-bold tabular-nums text-foreground">
                    {value}
                  </p>
                </div>
              ))}
            </section>

            {/* Frequency panel */}
            <section className="mt-6 rounded-xl border border-border bg-card p-5 shadow-sm">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground">
                Number Frequency
              </h2>
              <div className="mt-4 space-y-4">
                {result.groups.map((group) => (
                  <div key={group.count}>
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {group.count === 1
                        ? "Appears Once"
                        : group.count === 2
                          ? "Appears Twice"
                          : `Appears ${group.count} Times`}{" "}
                      ({group.values.length})
                    </h3>
                    <p className="mt-1 font-mono text-sm leading-relaxed text-foreground">
                      {group.values.map(formatNumber).join(" · ")}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            {/* Reappeared initials */}
            <section className="mt-6 rounded-xl border border-border bg-card p-5 shadow-sm">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground">
                Initial Numbers That Reappeared
              </h2>
              {result.reappeared.size > 0 ? (
                <p className="mt-3 font-mono text-sm font-semibold text-reappeared-foreground">
                  {[...result.reappeared]
                    .sort((a, b) => a - b)
                    .map(formatNumber)
                    .join(" · ")}
                </p>
              ) : (
                <p className="mt-3 text-sm text-muted-foreground">
                  No initial numbers reappeared.
                </p>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}
