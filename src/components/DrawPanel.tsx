import { useCallback, useEffect, useState } from "react";
import { deleteDraw, listDraws, saveDraw, type DrawRow } from "@/lib/draws";

type Meta = { gameName: string; provider: string; drawDate: string };

type Props = {
  meta: Meta;
  onMetaChange: (meta: Meta) => void;
  initials: number[] | null;
  onLoad: (initials: number[]) => void;
  onHistory: (rows: DrawRow[]) => void;
};

function parseList(raw: string): number[] {
  return raw
    .split(/[\s,]+/)
    .map((v) => v.trim())
    .filter((v) => v !== "")
    .map(Number)
    .filter((n) => Number.isFinite(n));
}

const inputClass =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/30";

export function DrawPanel({ meta, onMetaChange, initials, onLoad, onHistory }: Props) {
  const [winning, setWinning] = useState("");
  const [machine, setMachine] = useState("");
  const [rows, setRows] = useState<DrawRow[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const data = await listDraws();
      setRows(data);
      onHistory(data);
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "Could not load saved draws.");
    }
  }, [onHistory]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const handleSave = async () => {
    if (!initials) {
      setStatus("Generate the grids first, then save this draw.");
      return;
    }
    if (!meta.gameName.trim() || !meta.provider.trim() || !meta.drawDate) {
      setStatus("Game name, provider and draw date are required to save.");
      return;
    }
    setBusy(true);
    setStatus(null);
    try {
      await saveDraw({
        gameName: meta.gameName.trim(),
        provider: meta.provider.trim(),
        drawDate: meta.drawDate,
        initialNumbers: initials,
        winningNumbers: parseList(winning).length ? parseList(winning) : null,
        machineNumbers: parseList(machine).length ? parseList(machine) : null,
      });
      setStatus("Draw saved.");
      await refresh();
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "Could not save this draw.");
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (id: string) => {
    setBusy(true);
    try {
      await deleteDraw(id);
      await refresh();
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "Could not delete this draw.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="mt-4 rounded-xl border border-border bg-card p-5 shadow-sm">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground">
        Draw Reference
      </h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-muted-foreground">Game name</span>
          <input
            type="text"
            value={meta.gameName}
            onChange={(e) => onMetaChange({ ...meta, gameName: e.target.value })}
            placeholder="e.g. Lucky Tuesday"
            className={inputClass}
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-muted-foreground">Provider</span>
          <input
            type="text"
            value={meta.provider}
            onChange={(e) => onMetaChange({ ...meta, provider: e.target.value })}
            placeholder="e.g. Baba Ijebu"
            className={inputClass}
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-muted-foreground">Draw date</span>
          <input
            type="date"
            value={meta.drawDate}
            onChange={(e) => onMetaChange({ ...meta, drawDate: e.target.value })}
            className={inputClass}
          />
        </label>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-muted-foreground">
            Actual winning numbers (optional)
          </span>
          <input
            type="text"
            value={winning}
            onChange={(e) => setWinning(e.target.value)}
            placeholder="e.g. 12 45 03 77 21"
            className={`${inputClass} font-mono`}
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-muted-foreground">
            Actual machine numbers (optional)
          </span>
          <input
            type="text"
            value={machine}
            onChange={(e) => setMachine(e.target.value)}
            placeholder="e.g. 08 33 51 62 19"
            className={`${inputClass} font-mono`}
          />
        </label>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          onClick={() => void handleSave()}
          disabled={busy}
          className="rounded-md bg-primary px-6 py-2.5 text-sm font-bold tracking-wide text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 disabled:opacity-60"
        >
          SAVE DRAW
        </button>
        {status && <span className="text-sm text-muted-foreground">{status}</span>}
      </div>

      {rows.length > 0 && (
        <div className="mt-5">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Saved draws
          </h3>
          <div className="mt-2 max-h-72 overflow-auto rounded-lg border border-border">
            <table className="w-full min-w-[640px] text-left text-xs">
              <thead>
                <tr className="bg-muted/50 text-muted-foreground">
                  <th className="px-3 py-2 font-medium">Date</th>
                  <th className="px-3 py-2 font-medium">Game</th>
                  <th className="px-3 py-2 font-medium">Provider</th>
                  <th className="px-3 py-2 font-medium">Initial numbers</th>
                  <th className="px-3 py-2 font-medium">Winning</th>
                  <th className="px-3 py-2 font-medium" />
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td className="border-t border-border px-3 py-1.5 tabular-nums">
                      {row.draw_date}
                    </td>
                    <td className="border-t border-border px-3 py-1.5">{row.game_name}</td>
                    <td className="border-t border-border px-3 py-1.5">{row.provider}</td>
                    <td className="border-t border-border px-3 py-1.5 font-mono tabular-nums">
                      {row.initial_numbers.join(" ")}
                    </td>
                    <td className="border-t border-border px-3 py-1.5 font-mono tabular-nums">
                      {row.winning_numbers?.join(" ") ?? "—"}
                    </td>
                    <td className="border-t border-border px-3 py-1.5">
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            onMetaChange({
                              gameName: row.game_name,
                              provider: row.provider,
                              drawDate: row.draw_date,
                            });
                            onLoad(row.initial_numbers);
                          }}
                          className="rounded border border-border px-2 py-1 font-semibold text-foreground hover:bg-secondary"
                        >
                          LOAD
                        </button>
                        <button
                          onClick={() => void handleDelete(row.id)}
                          className="rounded border border-border px-2 py-1 font-semibold text-muted-foreground hover:bg-secondary"
                        >
                          DELETE
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}
