import { useCallback, useEffect, useState } from "react";
import {
  deletePairSearch,
  listPairSearches,
  savePairSearch,
  type PairSearchRow,
  type SavedPairResult,
} from "@/lib/pairSearches";
import { padNumber, type PairSearchHit } from "@/lib/propagation";

type Props = {
  gameName: string;
  provider: string;
  drawDate: string;
  searchNumbers: number[] | null;
  hits: PairSearchHit[] | null;
  onHistory: (rows: PairSearchRow[]) => void;
};

export function PairSearchPanel({
  gameName,
  provider,
  drawDate,
  searchNumbers,
  hits,
  onHistory,
}: Props) {
  const [rows, setRows] = useState<PairSearchRow[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const data = await listPairSearches();
      setRows(data);
      onHistory(data);
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "Could not load saved pair searches.");
    }
  }, [onHistory]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const handleSave = async () => {
    if (!hits || !searchNumbers) {
      setStatus("Run a pair search first, then save it.");
      return;
    }
    setBusy(true);
    setStatus(null);
    try {
      const results: SavedPairResult[] = hits.map((h) => ({
        pair: `${padNumber(h.pair.high)}-${padNumber(h.pair.low)}`,
        occurrences: h.sources.length,
        where: h.sources,
      }));
      await savePairSearch({
        gameName: gameName.trim() || null,
        provider: provider.trim() || null,
        drawDate: drawDate || null,
        searchNumbers,
        results,
      });
      setStatus("Pair search saved — the forecaster will use it as reference.");
      await refresh();
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "Could not save this pair search.");
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (id: string) => {
    setBusy(true);
    try {
      await deletePairSearch(id);
      await refresh();
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "Could not delete this pair search.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-5 border-t border-border pt-4">
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={() => void handleSave()}
          disabled={busy || !hits}
          className="rounded-md bg-primary px-6 py-2.5 text-sm font-bold tracking-wide text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 disabled:opacity-60"
        >
          SAVE PAIR SEARCH
        </button>
        {status && <span className="text-sm text-muted-foreground">{status}</span>}
      </div>

      {rows.length > 0 && (
        <div className="mt-5">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Saved pair searches
          </h3>
          <div className="mt-2 max-h-80 overflow-auto rounded-lg border border-border">
            <table className="w-full min-w-[640px] text-left text-xs">
              <thead>
                <tr className="bg-muted/50 text-muted-foreground">
                  <th className="px-3 py-2 font-medium">Saved</th>
                  <th className="px-3 py-2 font-medium">Reference</th>
                  <th className="px-3 py-2 font-medium">Numbers</th>
                  <th className="px-3 py-2 font-medium">Pairs found</th>
                  <th className="px-3 py-2 font-medium" />
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="align-top">
                    <td className="border-t border-border px-3 py-1.5 tabular-nums">
                      {new Date(row.created_at).toLocaleDateString()}
                    </td>
                    <td className="border-t border-border px-3 py-1.5">
                      {[row.game_name, row.provider, row.draw_date].filter(Boolean).join(" · ") ||
                        "—"}
                    </td>
                    <td className="border-t border-border px-3 py-1.5 font-mono tabular-nums">
                      {row.search_numbers.map((n) => padNumber(Math.abs(n))).join(" ")}
                    </td>
                    <td className="border-t border-border px-3 py-1.5">
                      {row.results
                        .filter((r) => r.occurrences > 0)
                        .map((r) => `${r.pair} ×${r.occurrences}`)
                        .join(", ") || "No pair occurred"}
                    </td>
                    <td className="border-t border-border px-3 py-1.5">
                      <button
                        onClick={() => void handleDelete(row.id)}
                        className="rounded border border-border px-2 py-1 font-semibold text-muted-foreground hover:bg-secondary"
                      >
                        DELETE
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
