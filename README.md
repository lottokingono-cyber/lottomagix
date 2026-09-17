# Lotto Number Propagation & Occurrence Tracker

A bold attempt to track how lottery numbers recur.

You enter the **10 numbers from the immediately previous draw** — the 5 winning numbers and the
5 machine numbers. The app then propagates those 10 numbers through four different grids,
counts every value that appears, and shows you exactly where and how often each number recurs.
By later entering the numbers that actually came out in the next draw, you can see where those
numbers had already surfaced in the grids — and over many saved draws, that pattern is what the
tool is trying to expose.

Nothing here beats randomness. Lottery draws are random and no forecast can be guaranteed.
This is an analysis instrument, not a promise.

---

## 1. The input

- **10 initial numbers** — the previous draw's 5 winning + 5 machine numbers.
- **Game name**, **Provider**, **Draw date** — reference details for the saved history.
- **Actual winning numbers** and **actual machine numbers** (optional) — recorded after the
  draw so each entry becomes a complete before/after record.

Press **GENERATE GRID** and everything below recalculates. **CLEAR** resets the page.

## 2. The four grids

| Grid | Rule | Cells |
| --- | --- | --- |
| **Grid 1 — Propagation** | Row 1 = your 10 numbers; each row subtracts 11 from the row above, 8 rows total | 80 |
| **Grid 2 — Pairwise difference** | Absolute difference of every unique pair of the 10 numbers | 45 |
| **Grid 3A — Prime offset subtract** | Each initial number minus each of the 24 primes (2 … 89) | 240 |
| **Grid 3B — Prime offset add** | Each initial number plus each of the 24 primes | 240 |

**Matching ignores the minus sign.** Every value is normalised with `Math.abs()` before it is
counted, so `25` and `-25` are the same number.

**Grid 3B extra rule:** three-digit results are reduced to their last two digits before counting
(178 → 78). The cells still display the full calculated value.

## 3. Highlighting

| Colour | Meaning |
| --- | --- |
| 🟩 Green | This normalised number appears more than once in that grid |
| 🟥 Red | An initial number reappeared later in the propagation grid (takes priority) |
| 🟨 Yellow | An initial number appeared in Grid 3A / 3B |
| 🟧 Gold | The number repeats in **both** compared grids |

## 4. Analysis sections

- **Number frequency** for each grid separately, grouped as Appears Once / Twice / 3 Times …
  (dynamic up to whatever maximum exists). Values are shown two-digit: `1` displays as `01`.
- **Summary statistics** per grid: total cells, unique numbers, appearing once, appearing more
  than once, total repeated cells, highest frequency and which numbers hold it.
- **Combined frequency** for Grids 1 & 2, and for all four grids.
- **Cross-grid matches** and the **grid-wise pairs comparison** of all four grids.
- **Pair permutations** — for every frequency line of every table, all unique pairs
  (no repetition, larger number first; `56 34`, not `34 56`).
- **Duplicate pairs** — pairs that occur in two or more frequency lines, with exactly where.
- **Pair search** — enter any 5 numbers; the 10 pairs they form are looked up across all six
  frequency tables and the app reports where each one occurs.

## 5. History (Lovable Cloud)

Every draw you save is stored in the cloud with its game name, provider, date, the 10 initial
numbers and the actual winning/machine numbers. The saved list sits under the input area with
**LOAD** (refills the 10 inputs and regenerates every grid) and **DELETE**.

## 6. AI forecast

At the very bottom, **FORECAST NUMBERS** sends the current analysis — hottest normalised
numbers, reappeared initials, cross-grid repeats, duplicate pairs and your saved draw history —
to the AI and asks for five candidate numbers, up to five alternates, a short rationale and a
confidence level. Again: it is a reading of the statistics, not a prediction you should bet
the rent on.

## 7. Verification cases

- `50, 61, 72, 83, 94, 105, 116, 127, 138, 149` → Grid 1 column 1 = 50, 39, 28, 17, 6, −5, −16, −27.
- `54, 03, 75, 30, 45, 70, 13, 37, 79, 01` → Grid 2 first row = 51 21 24 09 16 41 17 25 53,
  final difference 78; Grid 3A column 1 begins 52, 51, 49, 47, 43, 41, 37 …

## 8. Tech

React 19 + TypeScript + Tailwind CSS on TanStack Start, with Lovable Cloud for the draw history
and the Lovable AI Gateway for the forecast. All grid logic lives in `src/lib/propagation.ts` as
small reusable functions; nothing is hard-coded — every figure is derived from your 10 inputs.

**Live app**: https://lottomagix.lovable.app

## Development

```sh
npm i
npm run dev
```
