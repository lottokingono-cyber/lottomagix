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
  normalize3B,
  padNumber,
  reappearedInitials,
  summaryStats,
  generateDifferenceGrid,
  getFrequencyMap,
  getCrossGridMatches,
  OFFSETS,
  INCREMENTS,
  generateSubtractGrid,
  generateAddGrid,
  getGridSummary,
  initialsAppearedInGrid,
  buildPairTable,
  findDuplicatePairs,
  searchPairs,
} from "@/lib/propagation";
import { DrawPanel } from "@/components/DrawPanel";
import { ForecastPanel } from "@/components/ForecastPanel";
import { PairSearchPanel } from "@/components/PairSearchPanel";
import type { DrawRow } from "@/lib/draws";
import type { PairSearchRow } from "@/lib/pairSearches";

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

type CellState = "neutral" | "duplicate" | "reappeared" | "cross" | "initial";

function cellState(
  value: number,
  duplicates: Set<number>,
  reappeared: Set<number>,
  cross: Set<number>,
  initials?: Set<number>,
  normalizeFn: (v: number) => number = normalize,
): CellState {
  const key = normalizeFn(value);
  if (reappeared.has(key)) return "reappeared";
  if (cross.has(key)) return "cross";
  if (initials?.has(key)) return "initial";
  if (duplicates.has(key)) return "duplicate";
  return "neutral";
}

const CELL_STYLES: Record<CellState, string> = {
  neutral: "bg-card text-foreground border-border",
  duplicate: "bg-duplicate text-duplicate-foreground border-duplicate-border font-semibold",
  cross: "bg-crossmatch text-crossmatch-foreground border-crossmatch-border font-semibold",
  reappeared: "bg-reappeared text-reappeared-foreground border-reappeared-border font-semibold",
  initial: "bg-initial text-initial-foreground border-initial-border font-semibold",
};

function Index() {
  const [inputs, setInputs] = useState<string[]>(Array(COL_COUNT).fill(""));
  const [error, setError] = useState<string | null>(null);
  const [initials, setInitials] = useState<number[] | null>(null);
  const [pairInputs, setPairInputs] = useState<string[]>(Array(5).fill(""));
  const [pairError, setPairError] = useState<string | null>(null);
  const [pairSearch, setPairSearch] = useState<number[] | null>(null);
  const [meta, setMeta] = useState({ gameName: "", provider: "", drawDate: "" });
  const [history, setHistory] = useState<DrawRow[]>([]);
  const [savedPairSearches, setSavedPairSearches] = useState<PairSearchRow[]>([]);

  const result = useMemo(() => {
    if (!initials) return null;
    const grid = generateGrid(initials);
    const freq = frequencyMap(grid);
    const diffGrid = generateDifferenceGrid(initials);
    const diffValues = diffGrid.flat();
    const diffFreq = getFrequencyMap(diffValues);
    const matches = getCrossGridMatches(freq, diffFreq);

    const grid3A = generateSubtractGrid(initials, OFFSETS);
    const grid3AValues = grid3A.flat();
    const grid3AFreq = getFrequencyMap(grid3AValues);
    const grid3B = generateAddGrid(initials, OFFSETS);
    const grid3BValues = grid3B.flat();
    // Grid 3B frequency uses values normalized to their last two digits (178 -> 78).
    const grid3BNormValues = grid3BValues.map(normalize3B);
    const grid3BFreq = getFrequencyMap(grid3BNormValues);

    // Grid 4A: initials + 1..20. Grid 4B: initials - 1..20.
    const grid4A = generateAddGrid(initials, INCREMENTS);
    const grid4AValues = grid4A.flat();
    const grid4AFreq = getFrequencyMap(grid4AValues);
    const grid4B = generateSubtractGrid(initials, INCREMENTS);
    const grid4BValues = grid4B.flat();
    const grid4BFreq = getFrequencyMap(grid4BValues);

    const combinedFreq = new Map<number, number>();
    for (const [value, count] of freq) combinedFreq.set(value, (combinedFreq.get(value) ?? 0) + count);
    for (const [value, count] of diffFreq) combinedFreq.set(value, (combinedFreq.get(value) ?? 0) + count);

    const allFreq = new Map<number, number>(combinedFreq);
    for (const [value, count] of grid3AFreq) allFreq.set(value, (allFreq.get(value) ?? 0) + count);
    for (const [value, count] of grid3BFreq) allFreq.set(value, (allFreq.get(value) ?? 0) + count);
    for (const [value, count] of grid4AFreq) allFreq.set(value, (allFreq.get(value) ?? 0) + count);
    for (const [value, count] of grid4BFreq) allFreq.set(value, (allFreq.get(value) ?? 0) + count);

    const pairTables = [
      buildPairTable("Grid 1", frequencyGroups(freq)),
      buildPairTable("Grid 2", frequencyGroups(diffFreq)),
      buildPairTable("Grid 3A", frequencyGroups(grid3AFreq)),
      buildPairTable("Grid 3B", frequencyGroups(grid3BFreq)),
      buildPairTable("Grid 4A", frequencyGroups(grid4AFreq)),
      buildPairTable("Grid 4B", frequencyGroups(grid4BFreq)),
      buildPairTable("Combined — Grids 1 & 2", frequencyGroups(combinedFreq)),
      buildPairTable("Combined — All Six Grids", frequencyGroups(allFreq)),
    ];

    const gridFreqs: { name: string; freq: Map<number, number> }[] = [
      { name: "Grid 1", freq },
      { name: "Grid 2", freq: diffFreq },
      { name: "Grid 3A", freq: grid3AFreq },
      { name: "Grid 3B", freq: grid3BFreq },
      { name: "Grid 4A", freq: grid4AFreq },
      { name: "Grid 4B", freq: grid4BFreq },
    ];
    const gridPairComparisons: {
      label: string;
      a: string;
      b: string;
      matches: ReturnType<typeof getCrossGridMatches>;
    }[] = [];
    for (let i = 0; i < gridFreqs.length; i++) {
      for (let j = i + 1; j < gridFreqs.length; j++) {
        const a = gridFreqs[i]!;
        const b = gridFreqs[j]!;
        gridPairComparisons.push({
          label: `${a.name} × ${b.name}`,
          a: a.name,
          b: b.name,
          matches: getCrossGridMatches(a.freq, b.freq),
        });
      }
    }

    return {
      gridPairComparisons,
      pairTables,
      duplicatePairs: findDuplicatePairs(pairTables),
      grid,
      freq,
      duplicates: duplicateSet(freq),
      reappeared: reappearedInitials(grid),
      groups: frequencyGroups(freq),
      stats: summaryStats(freq, reappearedInitials(grid)),
      initials,
      diffGrid,
      diffCount: diffValues.length,
      diffFreq,
      diffDuplicates: duplicateSet(diffFreq),
      diffGroups: frequencyGroups(diffFreq),
      combinedGroups: frequencyGroups(combinedFreq),
      allGroups: frequencyGroups(allFreq),
      hottest: [...allFreq.entries()]
        .sort((a, b) => b[1] - a[1] || a[0] - b[0])
        .slice(0, 20)
        .map(([value, count]) => ({ value, count })),
      allTotalCells:
        grid.flat().length +
        diffValues.length +
        grid3AValues.length +
        grid3BValues.length +
        grid4AValues.length +
        grid4BValues.length,
      matches,
      crossSet: new Set(matches.map((m) => m.value)),
      grid3A,
      grid3AFreq,
      grid3ADup: duplicateSet(grid3AFreq),
      grid3AGroups: frequencyGroups(grid3AFreq),
      grid3ASummary: getGridSummary(grid3AValues, grid3AFreq),
      grid3AInitials: initialsAppearedInGrid(grid3A, initials),
      grid3B,
      grid3BFreq,
      grid3BDup: duplicateSet(grid3BFreq),
      grid3BGroups: frequencyGroups(grid3BFreq),
      grid3BSummary: getGridSummary(grid3BValues, grid3BFreq),
      grid3BInitials: initialsAppearedInGrid(
        grid3B.map((row) => row.map(normalize3B)),
        initials,
      ),
      grid4A,
      grid4ADup: duplicateSet(grid4AFreq),
      grid4AGroups: frequencyGroups(grid4AFreq),
      grid4ASummary: getGridSummary(grid4AValues, grid4AFreq),
      grid4AInitials: initialsAppearedInGrid(grid4A, initials),
      grid4B,
      grid4BDup: duplicateSet(grid4BFreq),
      grid4BGroups: frequencyGroups(grid4BFreq),
      grid4BSummary: getGridSummary(grid4BValues, grid4BFreq),
      grid4BInitials: initialsAppearedInGrid(grid4B, initials),
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
    setPairInputs(Array(5).fill(""));
    setPairSearch(null);
    setPairError(null);
  };

  const handlePairChange = (index: number, raw: string) => {
    if (raw !== "" && raw !== "-" && !/^-?\d*\.?\d*$/.test(raw)) return;
    setPairInputs((prev) => prev.map((v, i) => (i === index ? raw : v)));
  };

  const handlePairSearch = () => {
    const parsed = pairInputs.map((v) => (v.trim() === "" || v.trim() === "-" ? NaN : Number(v)));
    if (parsed.some((n) => Number.isNaN(n) || !Number.isFinite(n))) {
      setPairError("Please enter all 5 valid numbers before searching.");
      return;
    }
    if (new Set(parsed.map(normalize)).size !== parsed.length) {
      setPairError("The 5 numbers must be different (ignoring the minus sign).");
      return;
    }
    setPairError(null);
    setPairSearch(parsed);
  };

  const pairHits =
    pairSearch && result ? searchPairs(pairSearch, result.pairTables) : null;

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

        <DrawPanel
          meta={meta}
          onMetaChange={setMeta}
          initials={initials}
          onLoad={(loaded) => {
            setInputs(loaded.map((n) => String(n)));
            setInitials(loaded);
            setError(null);
          }}
          onHistory={setHistory}
        />

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
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-3 w-3 rounded-sm border border-crossmatch-border bg-crossmatch" />
                Repeated in BOTH grids
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-3 w-3 rounded-sm border border-initial-border bg-initial" />
                Initial number appeared
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
                        const state = cellState(
                          value,
                          result.duplicates,
                          result.reappeared,
                          result.crossSet,
                        );
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

            {/* Grid 1 frequency */}
            <section className="mt-6 rounded-xl border border-border bg-card p-5 shadow-sm">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground">
                Number Frequency — Grid 1
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
                      {group.values.map(padNumber).join(" · ")}
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

            {/* Pairwise difference grid */}
            <section className="mt-6 rounded-xl border border-border bg-card shadow-sm">
              <h2 className="px-5 pt-5 text-sm font-semibold uppercase tracking-wide text-foreground">
                Pairwise Difference Grid
              </h2>
              <p className="px-5 pb-3 pt-1 text-xs text-muted-foreground">
                Absolute difference of each initial number against every number to its right —{" "}
                {result.diffCount} values.
              </p>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[680px] border-collapse">
                  <thead>
                    <tr>
                      <th className="border-b border-border bg-muted/60 px-3 py-2 text-left text-xs font-semibold text-muted-foreground">
                        vs
                      </th>
                      {result.initials.map((n, c) => (
                        <th
                          key={c}
                          className="border-b border-l border-border bg-muted/60 px-2 py-2 text-center font-mono text-xs font-semibold text-foreground"
                        >
                          {padNumber(normalize(n))}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {result.diffGrid.map((row, r) => (
                      <tr key={r}>
                        <td className="whitespace-nowrap border-b border-border bg-muted/40 px-3 py-1.5 text-center font-mono text-xs font-semibold text-foreground">
                          {padNumber(normalize(result.initials[r] ?? 0))}
                        </td>
                        {Array.from({ length: COL_COUNT }, (_, c) => {
                          if (c <= r) {
                            return (
                              <td
                                key={c}
                                className="border-b border-l border-border bg-muted/30 px-2 py-1.5"
                              />
                            );
                          }
                          const value = row[c - r - 1] ?? 0;
                          const state = cellState(
                            value,
                            result.diffDuplicates,
                            new Set<number>(),
                            result.crossSet,
                          );
                          return (
                            <td
                              key={c}
                              className={`border-b border-l px-2 py-1.5 text-center font-mono text-sm tabular-nums ${CELL_STYLES[state]}`}
                            >
                              {padNumber(value)}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Grid 2 frequency */}
            <section className="mt-6 rounded-xl border border-border bg-card p-5 shadow-sm">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground">
                Number Frequency — Grid 2
              </h2>
              <div className="mt-4 space-y-4">
                {result.diffGroups.map((group) => (
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
                      {group.values.map(padNumber).join(" · ")}
                    </p>
                  </div>
                ))}
              </div>
            </section>




            {/* Combined frequency */}
            <section className="mt-6 rounded-xl border border-crossmatch-border bg-card p-5 shadow-sm">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground">
                Combined Frequency — Both Grids
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Total occurrences of each number across Grid 1 and Grid 2 combined.
              </p>
              <div className="mt-4 space-y-4">
                {result.combinedGroups.map((group) => (
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
                      {group.values.map(padNumber).join(" · ")}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            {/* Cross-grid matches */}
            <section className="mt-6 rounded-xl border border-crossmatch-border bg-card p-5 shadow-sm">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground">
                Cross-Grid Matches
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Numbers repeated more than once in BOTH the propagation grid and the difference
                grid.
              </p>
              {result.matches.length > 0 ? (
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full min-w-[420px] border-collapse text-sm">
                    <thead>
                      <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                        <th className="border-b border-border py-2 pr-4">Number</th>
                        <th className="border-b border-border py-2 pr-4">Grid 1</th>
                        <th className="border-b border-border py-2 pr-4">Grid 2</th>
                        <th className="border-b border-border py-2">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.matches.map((m) => (
                        <tr key={m.value}>
                          <td className="border-b border-border py-2 pr-4">
                            <span className="rounded-md border border-crossmatch-border bg-crossmatch px-2 py-0.5 font-mono font-bold text-crossmatch-foreground">
                              {padNumber(m.value)}
                            </span>
                          </td>
                          <td className="border-b border-border py-2 pr-4 font-mono tabular-nums text-foreground">
                            appears {m.grid1} times
                          </td>
                          <td className="border-b border-border py-2 pr-4 font-mono tabular-nums text-foreground">
                            appears {m.grid2} times
                          </td>
                          <td className="border-b border-border py-2 font-mono font-bold tabular-nums text-foreground">
                            {m.total}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="mt-3 text-sm text-muted-foreground">
                  No numbers repeat in both grids.
                </p>
              )}
            </section>

            {/* Cross-grid summary */}
            <section className="mt-6 rounded-xl border border-border bg-card p-5 shadow-sm">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground">
                Cross-Grid Summary
              </h2>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {[
                  ["Grid 1 cells", result.stats.totalCells],
                  ["Grid 2 differences", result.diffCount],
                  ["Unique numbers in Grid 1", result.freq.size],
                  ["Unique differences in Grid 2", result.diffFreq.size],
                  ["Repeated numbers in Grid 1", result.duplicates.size],
                  ["Repeated differences in Grid 2", result.diffDuplicates.size],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-lg border border-border bg-background p-3">
                    <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                      {label}
                    </p>
                    <p className="mt-1 font-mono text-xl font-bold tabular-nums text-foreground">
                      {value}
                    </p>
                  </div>
                ))}
              </div>
              <div className="mt-4 rounded-lg border-2 border-crossmatch-border bg-crossmatch p-4 text-center">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-crossmatch-foreground">
                  Repeated in both grids
                </p>
                <p className="mt-1 font-mono text-3xl font-extrabold tabular-nums text-crossmatch-foreground">
                  {result.matches.length}
                </p>
              </div>
            </section>

            {/* Prime offset analysis */}
            <section className="mt-10">
              <h2 className="text-lg font-bold uppercase tracking-wide text-foreground">
                Prime Offset Analysis
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Each initial number combined with the 24 prime offsets — 240 values per grid.
              </p>
            </section>

            {[
              {
                key: "3A",
                title: "Grid 3A — Initial Number Minus Prime Offsets",
                sign: "−",
                grid: result.grid3A,
                dup: result.grid3ADup,
                initials: result.grid3AInitials,
                groups: result.grid3AGroups,
                summary: result.grid3ASummary,
                norm: undefined as ((v: number) => number) | undefined,
              },
              {
                key: "3B",
                title: "Grid 3B — Initial Number Plus Prime Offsets",
                sign: "+",
                grid: result.grid3B,
                dup: result.grid3BDup,
                initials: result.grid3BInitials,
                groups: result.grid3BGroups,
                summary: result.grid3BSummary,
                norm: normalize3B as ((v: number) => number) | undefined,
              },
            ].map((g) => (
              <div key={g.key}>
                <section className="mt-6 rounded-xl border border-border bg-card shadow-sm">
                  <h3 className="px-5 pt-5 text-sm font-semibold uppercase tracking-wide text-foreground">
                    {g.title}
                  </h3>
                  {g.key === "3B" && (
                    <p className="px-5 pt-1 text-xs text-muted-foreground">
                      Frequency and highlighting reduce values to their last two digits (e.g. 178
                      → 78). Displayed cells keep the full calculated value.
                    </p>
                  )}
                  <div className="mt-3 overflow-x-auto">
                    <table className="w-full min-w-[680px] border-collapse">
                      <thead>
                        <tr>
                          <th className="sticky left-0 z-10 border-b border-border bg-muted px-3 py-2 text-left text-xs font-semibold text-muted-foreground">
                            Offset
                          </th>
                          {result.initials.map((n, c) => (
                            <th
                              key={c}
                              className="border-b border-l border-border bg-muted/60 px-2 py-2 text-center font-mono text-xs font-semibold text-foreground"
                            >
                              {formatNumber(n)}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {g.grid.map((row, r) => (
                          <tr key={r}>
                            <td className="sticky left-0 z-10 whitespace-nowrap border-b border-border bg-muted/40 px-3 py-1.5 text-center font-mono text-xs font-semibold text-foreground">
                              {g.sign}
                              {OFFSETS[r]}
                            </td>
                            {row.map((value, c) => {
                              const state = cellState(
                                value,
                                g.dup,
                                new Set<number>(),
                                new Set<number>(),
                                g.initials,
                                g.norm,
                              );
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
                  </div>
                </section>

                <section className="mt-6 rounded-xl border border-border bg-card p-5 shadow-sm">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-foreground">
                    Grid {g.key} Frequency
                  </h3>
                  <div className="mt-4 space-y-4">
                    {g.groups.map((group) => (
                      <div key={group.count}>
                        <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          {group.count === 1
                            ? "Appears Once"
                            : group.count === 2
                              ? "Appears Twice"
                              : `Appears ${group.count} Times`}{" "}
                          ({group.values.length})
                        </h4>
                        <p className="mt-1 font-mono text-sm leading-relaxed text-foreground">
                          {group.values.map(padNumber).join(" · ")}
                        </p>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="mt-6 rounded-xl border border-border bg-card p-5 shadow-sm">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-foreground">
                    Grid {g.key} Summary
                  </h3>
                  <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {[
                      ["Total cells", g.summary.totalCells],
                      ["Unique numbers", g.summary.uniqueNumbers],
                      ["Appearing once", g.summary.appearingOnce],
                      ["Appearing more than once", g.summary.appearingMoreThanOnce],
                      ["Total duplicate cells", g.summary.duplicateCells],
                      ["Highest frequency", g.summary.highestFrequency],
                    ].map(([label, value]) => (
                      <div key={label} className="rounded-lg border border-border bg-background p-3">
                        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                          {label}
                        </p>
                        <p className="mt-1 font-mono text-xl font-bold tabular-nums text-foreground">
                          {value}
                        </p>
                      </div>
                    ))}
                  </div>
                  <p className="mt-4 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Number(s) with highest frequency
                  </p>
                  <p className="mt-1 font-mono text-sm font-semibold text-foreground">
                    {g.summary.highestValues.map(padNumber).join(" · ")}
                  </p>
                </section>
              </div>
            ))}

            {/* Prime offset comparison */}
            <section className="mt-6 overflow-x-auto rounded-xl border border-border bg-card p-5 shadow-sm">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground">
                Prime Offset Analysis Summary
              </h2>
              <table className="mt-4 w-full min-w-[380px] border-collapse text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="border-b border-border py-2 pr-4">Metric</th>
                    <th className="border-b border-border py-2 pr-4">Grid 3A</th>
                    <th className="border-b border-border py-2">Grid 3B</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["Total cells", result.grid3ASummary.totalCells, result.grid3BSummary.totalCells],
                    [
                      "Unique numbers",
                      result.grid3ASummary.uniqueNumbers,
                      result.grid3BSummary.uniqueNumbers,
                    ],
                    [
                      "Appears once",
                      result.grid3ASummary.appearingOnce,
                      result.grid3BSummary.appearingOnce,
                    ],
                    [
                      "Repeated numbers",
                      result.grid3ASummary.appearingMoreThanOnce,
                      result.grid3BSummary.appearingMoreThanOnce,
                    ],
                    [
                      "Highest frequency",
                      result.grid3ASummary.highestFrequency,
                      result.grid3BSummary.highestFrequency,
                    ],
                  ].map(([label, a, b]) => (
                    <tr key={label}>
                      <td className="border-b border-border py-2 pr-4 text-foreground">{label}</td>
                      <td className="border-b border-border py-2 pr-4 font-mono font-semibold tabular-nums text-foreground">
                        {a}
                      </td>
                      <td className="border-b border-border py-2 font-mono font-semibold tabular-nums text-foreground">
                        {b}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>

            {/* Sequential step analysis */}
            <section className="mt-10">
              <h2 className="text-lg font-bold uppercase tracking-wide text-foreground">
                Sequential Step Analysis
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Each initial number stepped by 1 through 20 — 200 values per grid.
              </p>
            </section>

            {[
              {
                key: "4A",
                title: "Grid 4A — Initial Number Plus 1 to 20",
                sign: "+",
                grid: result.grid4A,
                dup: result.grid4ADup,
                initials: result.grid4AInitials,
                groups: result.grid4AGroups,
                summary: result.grid4ASummary,
              },
              {
                key: "4B",
                title: "Grid 4B — Initial Number Minus 1 to 20",
                sign: "−",
                grid: result.grid4B,
                dup: result.grid4BDup,
                initials: result.grid4BInitials,
                groups: result.grid4BGroups,
                summary: result.grid4BSummary,
              },
            ].map((g) => (
              <div key={g.key}>
                <section className="mt-6 rounded-xl border border-border bg-card shadow-sm">
                  <h3 className="px-5 pt-5 text-sm font-semibold uppercase tracking-wide text-foreground">
                    {g.title}
                  </h3>
                  <div className="mt-3 overflow-x-auto">
                    <table className="w-full min-w-[680px] border-collapse">
                      <thead>
                        <tr>
                          <th className="sticky left-0 z-10 border-b border-border bg-muted px-3 py-2 text-left text-xs font-semibold text-muted-foreground">
                            Step
                          </th>
                          {result.initials.map((n, c) => (
                            <th
                              key={c}
                              className="border-b border-l border-border bg-muted/60 px-2 py-2 text-center font-mono text-xs font-semibold text-foreground"
                            >
                              {formatNumber(n)}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {g.grid.map((row, r) => (
                          <tr key={r}>
                            <td className="sticky left-0 z-10 whitespace-nowrap border-b border-border bg-muted/40 px-3 py-1.5 text-center font-mono text-xs font-semibold text-foreground">
                              {g.sign}
                              {INCREMENTS[r]}
                            </td>
                            {row.map((value, c) => {
                              const state = cellState(
                                value,
                                g.dup,
                                new Set<number>(),
                                new Set<number>(),
                                g.initials,
                              );
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
                  </div>
                </section>

                <section className="mt-6 rounded-xl border border-border bg-card p-5 shadow-sm">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-foreground">
                    Grid {g.key} Frequency
                  </h3>
                  <div className="mt-4 space-y-4">
                    {g.groups.map((group) => (
                      <div key={group.count}>
                        <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          {group.count === 1
                            ? "Appears Once"
                            : group.count === 2
                              ? "Appears Twice"
                              : `Appears ${group.count} Times`}{" "}
                          ({group.values.length})
                        </h4>
                        <p className="mt-1 font-mono text-sm leading-relaxed text-foreground">
                          {group.values.map(padNumber).join(" · ")}
                        </p>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="mt-6 rounded-xl border border-border bg-card p-5 shadow-sm">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-foreground">
                    Grid {g.key} Summary
                  </h3>
                  <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {[
                      ["Total cells", g.summary.totalCells],
                      ["Unique numbers", g.summary.uniqueNumbers],
                      ["Appearing once", g.summary.appearingOnce],
                      ["Appearing more than once", g.summary.appearingMoreThanOnce],
                      ["Total duplicate cells", g.summary.duplicateCells],
                      ["Highest frequency", g.summary.highestFrequency],
                    ].map(([label, value]) => (
                      <div key={label} className="rounded-lg border border-border bg-background p-3">
                        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                          {label}
                        </p>
                        <p className="mt-1 font-mono text-xl font-bold tabular-nums text-foreground">
                          {value}
                        </p>
                      </div>
                    ))}
                  </div>
                  <p className="mt-4 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Number(s) with highest frequency
                  </p>
                  <p className="mt-1 font-mono text-sm font-semibold text-foreground">
                    {g.summary.highestValues.map(padNumber).join(" · ")}
                  </p>
                </section>
              </div>
            ))}

            {/* Combined frequency across all six grids */}
            <section className="mt-6 rounded-xl border border-crossmatch-border bg-card p-5 shadow-sm">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground">
                Combined Frequency — All Six Grids
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Total occurrences of each number across Grid 1, Grid 2, Grid 3A, Grid 3B, Grid 4A
                and Grid 4B ({result.allTotalCells} cells).
              </p>
              <div className="mt-4 space-y-4">
                {result.allGroups.map((group) => (
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
                      {group.values.map(padNumber).join(" · ")}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            {/* Pair permutations */}
            <section className="mt-6 rounded-xl border border-border bg-card p-5 shadow-sm">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground">
                Pair Permutations
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Every unique two-number pair within each frequency line, larger number first. Pairs
                are never repeated (34 56 and 56 34 count as one pair).
              </p>
              <div className="mt-4 space-y-6">
                {result.pairTables.map((t) => (
                  <div key={t.table}>
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-foreground">
                      {t.table}
                    </h3>
                    <div className="mt-2 space-y-3">
                      {t.lines.map((line) => (
                        <div key={line.count}>
                          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            {line.label} ({line.pairs.length} pairs)
                          </p>
                          <div className="mt-1 max-h-48 overflow-y-auto rounded-md border border-border bg-muted/30 p-2">
                            <p className="font-mono text-xs leading-relaxed text-foreground">
                              {line.pairs
                                .map((p) => `${padNumber(p.high)}-${padNumber(p.low)}`)
                                .join(" · ")}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Duplicate pairs across frequency lines */}
            <section className="mt-6 rounded-xl border border-crossmatch-border bg-card p-5 shadow-sm">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground">
                Duplicate Pairs
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Pairs that occur in two or more frequency lines across the six tables, with the
                exact table and line where each occurs ({result.duplicatePairs.length} pairs).
              </p>
              <div className="mt-4 max-h-[32rem] overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="text-muted-foreground">
                      <th className="border-b border-border py-2 pr-4 font-medium">Pair</th>
                      <th className="border-b border-border py-2 pr-4 font-medium">Occurrences</th>
                      <th className="border-b border-border py-2 font-medium">Where it occurs</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.duplicatePairs.map((p) => (
                      <tr key={p.key}>
                        <td className="border-b border-border py-2 pr-4 font-mono font-semibold tabular-nums text-foreground">
                          {padNumber(p.high)}-{padNumber(p.low)}
                        </td>
                        <td className="border-b border-border py-2 pr-4 font-mono tabular-nums text-foreground">
                          {p.sources.length}
                        </td>
                        <td className="border-b border-border py-2 text-foreground">
                          {p.sources.join("; ")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {result.duplicatePairs.length === 0 && (
                  <p className="py-3 text-xs text-muted-foreground">
                    No pair occurs in more than one frequency line.
                  </p>
                )}
              </div>
            </section>

            {/* Grid-wise pairs comparison between the 4 grids */}
            <section className="mt-6 rounded-xl border border-border bg-card p-5 shadow-sm">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground">
                Grid-Wise Pairs Comparison — The Four Grids
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Numbers that repeat (appear more than once) in both grids of each grid pairing,
                with their counts in each grid.
              </p>
              <div className="mt-4 space-y-6">
                {result.gridPairComparisons.map((cmp) => (
                  <div key={cmp.label}>
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-foreground">
                      {cmp.label}{" "}
                      <span className="text-muted-foreground">
                        ({cmp.matches.length} shared repeated{" "}
                        {cmp.matches.length === 1 ? "number" : "numbers"})
                      </span>
                    </h3>
                    {cmp.matches.length === 0 ? (
                      <p className="mt-1 text-xs text-muted-foreground">
                        No number repeats in both grids.
                      </p>
                    ) : (
                      <div className="mt-2 overflow-x-auto rounded-md border border-border">
                        <table className="w-full text-left text-xs">
                          <thead>
                            <tr className="bg-muted/50 text-muted-foreground">
                              <th className="px-3 py-2 font-medium">Number</th>
                              <th className="px-3 py-2 font-medium">{cmp.a}</th>
                              <th className="px-3 py-2 font-medium">{cmp.b}</th>
                              <th className="px-3 py-2 font-medium">Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {cmp.matches.map((m) => (
                              <tr key={m.value}>
                                <td className="border-t border-border px-3 py-1.5 font-mono font-semibold tabular-nums text-foreground">
                                  {padNumber(m.value)}
                                </td>
                                <td className="border-t border-border px-3 py-1.5 font-mono tabular-nums text-foreground">
                                  {m.grid1}
                                </td>
                                <td className="border-t border-border px-3 py-1.5 font-mono tabular-nums text-foreground">
                                  {m.grid2}
                                </td>
                                <td className="border-t border-border px-3 py-1.5 font-mono font-semibold tabular-nums text-foreground">
                                  {m.total}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>

            {/* Pair search */}
            <section className="mt-6 rounded-xl border border-border bg-card p-5 shadow-sm">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground">
                Pair Search
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Enter 5 numbers to form their 10 unique pairs and see exactly where each pair
                occurs across all six pair tables. Matching ignores the minus sign.
              </p>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
                {pairInputs.map((value, i) => (
                  <label key={i} className="block">
                    <span className="mb-1 block text-xs font-medium text-muted-foreground">
                      Search {i + 1}
                    </span>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={value}
                      onChange={(e) => handlePairChange(i, e.target.value)}
                      placeholder="0"
                      className="w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-sm text-foreground outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/30"
                    />
                  </label>
                ))}
              </div>
              {pairError && (
                <p className="mt-3 text-sm font-medium text-destructive">{pairError}</p>
              )}
              <div className="mt-4">
                <button
                  onClick={handlePairSearch}
                  className="rounded-md bg-primary px-6 py-2.5 text-sm font-bold tracking-wide text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
                >
                  SEARCH PAIRS
                </button>
              </div>
              {pairHits && (
                <div className="mt-4 space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {pairHits.length} pairs from{" "}
                    {pairSearch?.map((n) => padNumber(normalize(n))).join(" · ")}
                  </p>
                  <div className="overflow-x-auto rounded-md border border-border">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="bg-muted/50 text-muted-foreground">
                          <th className="px-3 py-2 font-medium">Pair</th>
                          <th className="px-3 py-2 font-medium">Occurrences</th>
                          <th className="px-3 py-2 font-medium">Where it occurs</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pairHits.map((hit) => (
                          <tr key={hit.pair.key}>
                            <td className="border-t border-border px-3 py-1.5 font-mono font-semibold tabular-nums text-foreground">
                              {padNumber(hit.pair.high)}-{padNumber(hit.pair.low)}
                            </td>
                            <td className="border-t border-border px-3 py-1.5 font-mono tabular-nums text-foreground">
                              {hit.sources.length}
                            </td>
                            <td className="border-t border-border px-3 py-1.5 text-foreground">
                              {hit.sources.length === 0 ? (
                                <span className="text-muted-foreground">
                                  Does not occur in any table.
                                </span>
                              ) : (
                                hit.sources.join("; ")
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              <PairSearchPanel
                gameName={meta.gameName}
                provider={meta.provider}
                drawDate={meta.drawDate}
                searchNumbers={pairSearch}
                hits={pairHits}
                onHistory={setSavedPairSearches}
              />
            </section>
            <ForecastPanel
              gameName={meta.gameName}
              provider={meta.provider}
              drawDate={meta.drawDate}
              initials={result.initials}
              hottest={result.hottest}
              reappeared={[...result.reappeared]}
              crossGrid={result.matches.map((m) => ({ value: m.value, count: m.total }))}
              duplicatePairs={result.duplicatePairs.map((p) => p.key)}
              savedPairSearches={savedPairSearches.map((s) => ({
                label: [s.game_name, s.draw_date].filter(Boolean).join(" ") || "saved search",
                numbers: s.search_numbers,
                pairs: s.results
                  .filter((r) => r.occurrences > 0)
                  .map((r) => ({ pair: r.pair, occurrences: r.occurrences, where: r.where })),
              }))}
              history={history.map((h) => ({
                drawDate: h.draw_date,
                initials: h.initial_numbers,
                winning: h.winning_numbers ?? [],
              }))}
            />

          </>

        )}
      </main>
    </div>
  );
}
