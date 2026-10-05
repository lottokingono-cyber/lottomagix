# Add positional frequency analysis

## What will change
- Keep the existing 54 comparison calculations and display intact; use their `commonNumbers` arrays as the sole source for a new analysis directly below them.
- Add a derived analysis for positional column counts, global totals, exactly-3/exactly-6 summaries, frequency-by-column distribution, positional pattern highlights, and a column repetition matrix.
- Preserve each result row's current number order for column assignment, ignore empty results, count each number once per row, and format numbers with two digits.
- Verify all calculations against the live 54-row output and confirm the existing comparison rows remain unchanged.

## Technical approach
- Add a pure helper in the existing propagation analysis library that accepts the 54 comparison results and returns typed summary data; do not modify grid or comparison-generation logic.
- Render the requested tables in the existing result page using the returned data, with horizontal scrolling for wide tables and a note explaining positional columns.
- Validate the helper against invariants (54 rows, row order, no mutation), then inspect the rendered page and latest app diagnostics.
