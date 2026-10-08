import type {
  ComparisonPairAnalysis as PairAnalysis,
  ComparisonPositionAnalysis as Analysis,
} from "@/lib/propagation";
import { padNumber } from "@/lib/propagation";
import type { ReactNode } from "react";

interface ComparisonPositionAnalysisProps {
  analysis: Analysis;
  pairAnalysis: PairAnalysis;
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-6 rounded-lg border border-border bg-card p-5">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-foreground">{title}</h3>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function EmptyState({ children }: { children: ReactNode }) {
  return <p className="text-sm text-muted-foreground">{children}</p>;
}

export function ComparisonPositionAnalysis({ analysis, pairAnalysis }: ComparisonPositionAnalysisProps) {
  const formatColumns = (columns: number[]) => columns.map((column) => `Column ${column}`).join(", ");

  return (
    <section className="mt-6 border-t border-border pt-6">
      <h2 className="text-lg font-bold text-foreground">Column Frequency Analysis</h2>
      <p className="mt-2 max-w-4xl text-sm text-muted-foreground">
        Column position is based on the number's position within each comparison result, exactly as
        the numbers would occupy spreadsheet columns when comma-separated values are pasted into a
        spreadsheet.
      </p>

      <Section title="Column Frequency Analysis">
        {analysis.columnFrequencies.length === 0 ? (
          <EmptyState>No comparison results contain numbers.</EmptyState>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[28rem] text-left text-sm">
              <thead className="bg-muted text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 font-medium">Column</th>
                  <th className="px-3 py-2 font-medium">Repeated numbers</th>
                  <th className="px-3 py-2 text-right font-medium">Count</th>
                </tr>
              </thead>
              <tbody>
                {analysis.columnFrequencies.flatMap(({ column, repeatedNumbers }) =>
                  repeatedNumbers.length === 0 ? (
                    [
                      <tr key={column}>
                        <td className="border-t border-border px-3 py-2">Column {column}</td>
                        <td colSpan={2} className="border-t border-border px-3 py-2 text-muted-foreground">
                          No repeated numbers
                        </td>
                      </tr>,
                    ]
                  ) : (
                    repeatedNumbers.map(({ value, count }) => (
                      <tr key={`${column}-${value}`}>
                        <td className="border-t border-border px-3 py-2">Column {column}</td>
                        <td className="border-t border-border px-3 py-2 font-mono">{padNumber(value)}</td>
                        <td className="border-t border-border px-3 py-2 text-right font-mono tabular-nums">
                          {count}
                        </td>
                      </tr>
                    ))
                  ),
                )}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      <Section title="Global Number Frequency">
        {analysis.globalFrequencies.length === 0 ? (
          <EmptyState>No numbers to count.</EmptyState>
        ) : (
          <div className="max-h-80 overflow-auto">
            <table className="w-full min-w-[20rem] text-left text-sm">
              <thead className="sticky top-0 bg-muted text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 font-medium">Number</th>
                  <th className="px-3 py-2 text-right font-medium">Total appearances</th>
                </tr>
              </thead>
              <tbody>
                {analysis.globalFrequencies.map(({ value, count }) => (
                  <tr key={value}>
                    <td className="border-t border-border px-3 py-2 font-mono">{padNumber(value)}</td>
                    <td className="border-t border-border px-3 py-2 text-right font-mono tabular-nums">
                      {count}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      {([
        { title: "Numbers Appearing Exactly 3 Times", numbers: analysis.exactlyThree },
        { title: "Numbers Appearing Exactly 6 Times", numbers: analysis.exactlySix },
      ] as const).map(({ title, numbers }) => (
        <Section key={title} title={title}>
          {numbers.length === 0 ? (
            <EmptyState>None.</EmptyState>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[42rem] text-left text-sm">
                <thead className="bg-muted text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2 font-medium">Number</th>
                    <th className="px-3 py-2 text-right font-medium">Total</th>
                    <th className="px-3 py-2 font-medium">Columns</th>
                    <th className="px-3 py-2 font-medium">Same-column repetition</th>
                  </tr>
                </thead>
                <tbody>
                  {numbers.map((number) => (
                    <tr key={number.value}>
                      <td className="border-t border-border px-3 py-2 font-mono">{padNumber(number.value)}</td>
                      <td className="border-t border-border px-3 py-2 text-right font-mono tabular-nums">
                        {number.total}
                      </td>
                      <td className="border-t border-border px-3 py-2 font-mono">
                        {number.columns.map((column) => `C${column}`).join(", ")}
                      </td>
                      <td className="border-t border-border px-3 py-2">
                        {number.mainColumns.some((column) =>
                          number.columnCounts.some((entry) => entry.column === column && entry.count > 1),
                        )
                          ? `Yes — ${formatColumns(number.mainColumns)}`
                          : "No"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Section>
      ))}

      <Section title="Frequency vs Column Position">
        {analysis.repeatedGlobally.length === 0 ? (
          <EmptyState>No numbers appear more than once globally.</EmptyState>
        ) : (
          <div className="max-h-96 overflow-auto">
            <table className="w-full min-w-[38rem] text-left text-sm">
              <thead className="sticky top-0 bg-muted text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 font-medium">Number</th>
                  <th className="px-3 py-2 text-right font-medium">Total</th>
                  <th className="px-3 py-2 font-medium">Column distribution</th>
                  <th className="px-3 py-2 font-medium">Main column</th>
                </tr>
              </thead>
              <tbody>
                {analysis.repeatedGlobally.map((number) => (
                  <tr key={number.value}>
                    <td className="border-t border-border px-3 py-2 font-mono">{padNumber(number.value)}</td>
                    <td className="border-t border-border px-3 py-2 text-right font-mono tabular-nums">
                      {number.total}
                    </td>
                    <td className="border-t border-border px-3 py-2 font-mono">
                      {number.columnCounts.map(({ column, count }) => `C${column}×${count}`).join(", ")}
                    </td>
                    <td className="border-t border-border px-3 py-2">
                      {number.mainColumns.map((column) => `C${column}`).join(", ")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      <Section title="3-Time vs 6-Time Numbers">
        <div className="grid gap-5 md:grid-cols-2">
          {([
            { title: "Exactly 3 times", numbers: analysis.exactlyThree },
            { title: "Exactly 6 times", numbers: analysis.exactlySix },
          ] as const).map(({ title, numbers }) => (
            <div key={title}>
              <h4 className="text-xs font-semibold uppercase text-muted-foreground">{title}</h4>
              <p className="mt-2 font-mono text-sm text-foreground">
                {numbers.length > 0
                  ? numbers.map((number) => padNumber(number.value)).join(" · ")
                  : "None"}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {numbers.length} numbers · {numbers.reduce((sum, number) => sum + number.total, 0)} total appearances
              </p>
            </div>
          ))}
        </div>
        <h4 className="mt-5 text-xs font-semibold uppercase text-muted-foreground">Strong positional patterns</h4>
        {analysis.strongPatterns.length === 0 ? (
          <EmptyState>No strong positional patterns in this analysis.</EmptyState>
        ) : (
          <ul className="mt-2 space-y-2 text-sm text-foreground">
            {analysis.strongPatterns.map((number) => (
              <li key={number.value}>
                <span className="font-mono font-semibold">{padNumber(number.value)}</span>
                {" — "}
                {number.strongPatterns.join("; ")} ({
                  number.columnCounts.map(({ column, count }) => `C${column}×${count}`).join(", ")
                })
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="Column Repetition Matrix">
        {analysis.repeatedGlobally.length === 0 ? (
          <EmptyState>No repeated numbers to display.</EmptyState>
        ) : (
          <div className="max-h-96 overflow-auto">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 bg-muted text-muted-foreground">
                <tr>
                  <th className="sticky left-0 bg-muted px-3 py-2 font-medium">Number</th>
                  {Array.from({ length: analysis.maxColumns }, (_, index) => (
                    <th key={index} className="min-w-16 px-3 py-2 text-right font-medium">
                      C{index + 1}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {analysis.repeatedGlobally.map((number) => (
                  <tr key={number.value}>
                    <th className="sticky left-0 border-t border-border bg-card px-3 py-2 text-left font-mono font-medium">
                      {padNumber(number.value)}
                    </th>
                    {Array.from({ length: analysis.maxColumns }, (_, index) => (
                      <td key={index} className="border-t border-border px-3 py-2 text-right font-mono tabular-nums">
                        {number.columnCounts.find((entry) => entry.column === index + 1)?.count ?? 0}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      <Section title="Pair Frequency Analysis">
        <p className="mb-4 text-xs text-muted-foreground">
          Unordered pairs of numbers that occur together in the same comparison line, counted at
          most once per line. Only pairs occurring exactly 3 or exactly 6 times across the 54 lines
          are shown.
        </p>
        <div className="mb-4 flex flex-wrap gap-2 text-xs">
          {([
            { title: "Exactly 3 Times", pairs: pairAnalysis.exactlyThree, label: "pairs occur 3 times" },
            { title: "Exactly 6 Times", pairs: pairAnalysis.exactlySix, label: "pairs occur 6 times" },
          ] as const).map(({ title, pairs, label }) => (
            <span key={title} className="rounded-md border border-border bg-muted px-3 py-1">
              <span className="font-mono font-semibold tabular-nums text-foreground">{pairs.length}</span>{" "}
              <span className="text-muted-foreground">{label}</span>
            </span>
          ))}
          <span className="rounded-md border border-border bg-muted px-3 py-1">
            <span className="font-mono font-semibold tabular-nums text-foreground">
              {pairAnalysis.exactlyThree.length + pairAnalysis.exactlySix.length}
            </span>{" "}
            <span className="text-muted-foreground">qualifying pairs in total</span>
          </span>
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          {([
            { title: "Exactly 3 Times", pairs: pairAnalysis.exactlyThree },
            { title: "Exactly 6 Times", pairs: pairAnalysis.exactlySix },
          ] as const).map(({ title, pairs }) => (
            <div key={title}>
              <h4 className="text-xs font-semibold uppercase text-muted-foreground">
                {title} — {pairs.length} {pairs.length === 1 ? "pair" : "pairs"}
              </h4>
              {pairs.length === 0 ? (
                <EmptyState>None.</EmptyState>
              ) : (
                <div className="mt-2 max-h-96 overflow-auto">
                  <table className="w-full min-w-[24rem] text-left text-sm">
                    <thead className="sticky top-0 bg-muted text-muted-foreground">
                      <tr>
                        <th className="px-3 py-2 font-medium">Pair</th>
                        <th className="px-3 py-2 text-right font-medium">Occurrences</th>
                        <th className="px-3 py-2 font-medium">Lines</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pairs.map((pair) => (
                        <tr key={`${pair.high}-${pair.low}`}>
                          <td className="border-t border-border px-3 py-2 font-mono">
                            {padNumber(pair.high)} – {padNumber(pair.low)}
                          </td>
                          <td className="border-t border-border px-3 py-2 text-right font-mono tabular-nums">
                            {pair.occurrences}
                          </td>
                          <td className="border-t border-border px-3 py-2 font-mono text-xs">
                            {pair.lines
                              .map((line) => `#${line.index} ${line.combination}`)
                              .join(", ")}
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
      </Section>
    </section>
  );
}