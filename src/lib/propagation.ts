// Core calculation logic for the Number Propagation & Duplicate Detector.

export const ROW_COUNT = 8;
export const COL_COUNT = 10;
export const STEP = 11;

export const ROW_LABELS = ["Initial", "-11", "-22", "-33", "-44", "-55", "-66", "-77"];

/** Normalize a value for duplicate matching: the minus sign is ignored. */
export function normalize(value: number): number {
  return Math.abs(value);
}

/** Generate the 8 x 10 propagation grid. Row r = initial - 11 * r. */
export function generateGrid(initials: number[]): number[][] {
  const rows: number[][] = [];
  for (let r = 0; r < ROW_COUNT; r++) {
    rows.push(initials.map((n) => n - STEP * r));
  }
  return rows;
}

/** Frequency count of every normalized value across the whole grid. */
export function frequencyMap(grid: number[][]): Map<number, number> {
  const freq = new Map<number, number>();
  for (const row of grid) {
    for (const value of row) {
      const key = normalize(value);
      freq.set(key, (freq.get(key) ?? 0) + 1);
    }
  }
  return freq;
}

/** Set of normalized values appearing more than once anywhere in the grid. */
export function duplicateSet(freq: Map<number, number>): Set<number> {
  const dups = new Set<number>();
  for (const [value, count] of freq) {
    if (count > 1) dups.add(value);
  }
  return dups;
}

/** Normalized initial numbers that reappear anywhere in rows 2..8. */
export function reappearedInitials(grid: number[][]): Set<number> {
  const later = new Set<number>();
  for (let r = 1; r < grid.length; r++) {
    for (const value of grid[r] ?? []) later.add(normalize(value));
  }
  const reappeared = new Set<number>();
  for (const value of grid[0] ?? []) {
    const key = normalize(value);
    if (later.has(key)) reappeared.add(key);
  }
  return reappeared;
}

export interface FrequencyGroup {
  count: number;
  values: number[];
}

/** Group normalized values by their frequency, sorted ascending. */
export function frequencyGroups(freq: Map<number, number>): FrequencyGroup[] {
  const byCount = new Map<number, number[]>();
  for (const [value, count] of freq) {
    const list = byCount.get(count) ?? [];
    list.push(value);
    byCount.set(count, list);
  }
  return [...byCount.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([count, values]) => ({ count, values: values.sort((a, b) => a - b) }));
}

export interface SummaryStats {
  totalCells: number;
  uniqueNumbers: number;
  appearingOnce: number;
  appearingMoreThanOnce: number;
  duplicateCells: number;
  initialReappearing: number;
}

export function summaryStats(
  freq: Map<number, number>,
  reappeared: Set<number>,
): SummaryStats {
  let appearingOnce = 0;
  let appearingMoreThanOnce = 0;
  let duplicateCells = 0;
  for (const count of freq.values()) {
    if (count === 1) appearingOnce++;
    else {
      appearingMoreThanOnce++;
      duplicateCells += count;
    }
  }
  const totalCells = [...freq.entries()].reduce((sum, [, c]) => sum + c, 0);
  return {
    totalCells,
    uniqueNumbers: freq.size,
    appearingOnce,
    appearingMoreThanOnce,
    duplicateCells,
    initialReappearing: reappeared.size,
  };
}

/** Display a number compactly: trim trailing zeros on decimals. */
export function formatNumber(value: number): string {
  return Number.isInteger(value) ? String(value) : String(Number(value.toFixed(6)));
}
