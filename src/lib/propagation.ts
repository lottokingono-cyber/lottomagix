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

/** Display a normalized value zero-padded to two digits (e.g. 1 -> "01"). */
export function padNumber(value: number): string {
  return formatNumber(value).padStart(2, "0");
}

/** Row-wise pairwise absolute differences: row i compares initials[i] with all to its right. */
export function generateDifferenceGrid(initials: number[]): number[][] {
  const rows: number[][] = [];
  for (let i = 0; i < initials.length - 1; i++) {
    const row: number[] = [];
    for (let j = i + 1; j < initials.length; j++) {
      row.push(Math.abs((initials[i] ?? 0) - (initials[j] ?? 0)));
    }
    rows.push(row);
  }
  return rows;
}

/** Generic frequency map over any list of values, normalized with Math.abs(). */
export function getFrequencyMap(values: number[]): Map<number, number> {
  const freq = new Map<number, number>();
  for (const v of values) {
    const key = normalize(v);
    freq.set(key, (freq.get(key) ?? 0) + 1);
  }
  return freq;
}

export function flatten(grid: number[][]): number[] {
  return grid.flat();
}

/** The 24 prime offsets used by Grid 3A / Grid 3B. */
export const OFFSETS = [
  2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89,
];

/** Rows = offsets, columns = initial numbers. Cell = initial - offset. */
export function generateSubtractGrid(initialNumbers: number[], offsets: number[]): number[][] {
  return offsets.map((o) => initialNumbers.map((n) => n - o));
}

/** The 20 sequential steps used by Grid 4A / Grid 4B. */
export const INCREMENTS = Array.from({ length: 20 }, (_, i) => i + 1);

/** Rows = offsets, columns = initial numbers. Cell = initial + offset. */
export function generateAddGrid(initialNumbers: number[], offsets: number[]): number[][] {
  return offsets.map((o) => initialNumbers.map((n) => n + o));
}

/** Grid 3B normalization: absolute value reduced to its last two digits (178 -> 78). */
export function normalize3B(value: number): number {
  return Math.abs(value) % 100;
}

/** Alias kept for readability alongside getFrequencyMap. */
export const getFrequencyGroups = frequencyGroups;

export interface GridSummary {
  totalCells: number;
  uniqueNumbers: number;
  appearingOnce: number;
  appearingMoreThanOnce: number;
  duplicateCells: number;
  highestFrequency: number;
  highestValues: number[];
}

export function getGridSummary(values: number[], freq: Map<number, number>): GridSummary {
  let appearingOnce = 0;
  let appearingMoreThanOnce = 0;
  let duplicateCells = 0;
  let highestFrequency = 0;
  for (const count of freq.values()) {
    if (count === 1) appearingOnce++;
    else {
      appearingMoreThanOnce++;
      duplicateCells += count;
    }
    if (count > highestFrequency) highestFrequency = count;
  }
  const highestValues = [...freq.entries()]
    .filter(([, c]) => c === highestFrequency)
    .map(([v]) => v)
    .sort((a, b) => a - b);
  return {
    totalCells: values.length,
    uniqueNumbers: freq.size,
    appearingOnce,
    appearingMoreThanOnce,
    duplicateCells,
    highestFrequency,
    highestValues,
  };
}

export interface CrossGridMatch {
  value: number;
  grid1: number;
  grid2: number;
  total: number;
}

/** Numbers repeated (>1) in BOTH grids. */
export function getCrossGridMatches(
  grid1Frequency: Map<number, number>,
  grid2Frequency: Map<number, number>,
): CrossGridMatch[] {
  const matches: CrossGridMatch[] = [];
  for (const [value, c1] of grid1Frequency) {
    const c2 = grid2Frequency.get(value) ?? 0;
    if (c1 > 1 && c2 > 1) matches.push({ value, grid1: c1, grid2: c2, total: c1 + c2 });
  }
  return matches.sort((a, b) => b.total - a.total || a.value - b.value);
}

/** Normalized initial numbers that appear anywhere in the given grid. */
export function initialsAppearedInGrid(grid: number[][], initials: number[]): Set<number> {
  const gridValues = new Set<number>();
  for (const row of grid) {
    for (const value of row) {
      gridValues.add(normalize(value));
    }
  }
  const appeared = new Set<number>();
  for (const value of initials) {
    const key = normalize(value);
    if (gridValues.has(key)) appeared.add(key);
  }
  return appeared;
}

/** A unique unordered pair of numbers, always stored larger-first. */
export interface NumberPair {
  high: number;
  low: number;
  key: string;
}

/** All unique pairs (no repetition, order-insensitive) from a list of values. */
export function generatePairs(values: number[]): NumberPair[] {
  const unique = [...new Set(values.map(normalize))];
  const pairs: NumberPair[] = [];
  for (let i = 0; i < unique.length; i++) {
    for (let j = i + 1; j < unique.length; j++) {
      const a = unique[i] ?? 0;
      const b = unique[j] ?? 0;
      const high = Math.max(a, b);
      const low = Math.min(a, b);
      pairs.push({ high, low, key: `${high}-${low}` });
    }
  }
  return pairs.sort((x, y) => y.high - x.high || y.low - x.low);
}

export interface PairLine {
  label: string;
  count: number;
  pairs: NumberPair[];
}

export interface PairTable {
  table: string;
  lines: PairLine[];
}

export interface DuplicatePair {
  key: string;
  high: number;
  low: number;
  sources: string[];
}

/** Human label for a frequency group. */
export function frequencyLabel(count: number): string {
  if (count === 1) return "Appears Once";
  if (count === 2) return "Appears Twice";
  return `Appears ${count} Times`;
}

/** Build the per-line pair lists for one frequency table. */
export function buildPairTable(table: string, groups: FrequencyGroup[]): PairTable {
  return {
    table,
    lines: groups
      .map((g) => ({
        label: frequencyLabel(g.count),
        count: g.count,
        pairs: generatePairs(g.values),
      }))
      .filter((line) => line.pairs.length > 0),
  };
}

export interface PairSearchHit {
  pair: NumberPair;
  sources: string[];
}

/**
 * Search where each unique pair formed from the given numbers occurs
 * across the pair tables. 5 numbers produce 10 pairs (no repetition).
 */
export function searchPairs(numbers: number[], tables: PairTable[]): PairSearchHit[] {
  const pairs = generatePairs(numbers);
  const index = new Map<string, string[]>();
  for (const t of tables) {
    for (const line of t.lines) {
      for (const p of line.pairs) {
        const list = index.get(p.key) ?? [];
        list.push(`${t.table} — ${line.label}`);
        index.set(p.key, list);
      }
    }
  }
  return pairs.map((pair) => ({ pair, sources: index.get(pair.key) ?? [] }));
}

/** Pairs occurring in two or more frequency lines across all tables. */
export function findDuplicatePairs(tables: PairTable[]): DuplicatePair[] {
  const map = new Map<string, DuplicatePair>();
  for (const t of tables) {
    for (const line of t.lines) {
      for (const p of line.pairs) {
        const entry = map.get(p.key) ?? { key: p.key, high: p.high, low: p.low, sources: [] };
        entry.sources.push(`${t.table} — ${line.label}`);
        map.set(p.key, entry);
      }
    }
  }
  return [...map.values()]
    .filter((e) => e.sources.length > 1)
    .sort((a, b) => b.sources.length - a.sources.length || b.high - a.high || b.low - a.low);
}
