# Number Propagator

Build: Number Propagation & Duplicate Detector

Build a clean, responsive web app that replaces a spreadsheet workflow I currently use.

1. Core purpose

The user enters 10 initial numbers.

These numbers form the first row of a grid with 10 columns.

The application then automatically generates 8 rows total, using the following rule:

Row 1 = the 10 numbers entered by the user.

Row 2 = each Row 1 number minus 11.

Row 3 = each Row 2 number minus 11.

Continue subtracting 11 from the immediately preceding row.

Continue until there are 8 rows total.

Therefore, for each column:

Row 1 = Initial Number

Row 2 = Initial Number - 11

Row 3 = Initial Number - 22

Row 4 = Initial Number - 33

...

Row 8 = Initial Number - 77

2. Important matching rule

For the purposes of detecting duplicate numbers, the minus sign must be ignored.

For example:

25 and -25 are considered the SAME number.

8 and -8 are considered the SAME number.

0 remains 0.

Internally, normalize every generated number using its absolute value:

normalizedValue = Math.abs(value)

Duplicate detection must use this normalized value.

3. User interface

Create a simple, professional interface.

Initial Numbers section

At the top, display:

Enter 10 Initial Numbers

Show 10 clearly labeled inputs:

Number 1 | Number 2 | Number 3 | ... | Number 10

Allow positive, negative, and zero values.

Provide a prominent:

GENERATE GRID

button.

Also provide:

CLEAR

to reset everything.

The grid should update immediately after generation.

4. Propagation Grid

Display an 8 × 10 grid.

8 rows

10 columns

Row 1 represents the original numbers.

Rows 2–8 represent the propagated values.

Label the rows:

Initial

-11

-22

-33

-44

-55

-66

-77

The column headers should be:

1 2 3 4 5 6 7 8 9 10

Display the actual calculated values, including the minus sign where applicable.

Example:

If the initial number is 50, its column should display:

50
39
28
17
6
-5
-16
-27

5. Duplicate detection

Analyze ALL 80 cells in the 8 × 10 grid.

Normalize every value using its absolute value before comparing.

Create a frequency count for every normalized number.

For example, if the grid contains:

25, -25, 14, 25, -14

the system should calculate:

25 → appears 3 times

14 → appears 2 times

6. Duplicate highlighting

Any normalized number that appears more than once anywhere in the 80-cell grid must be highlighted green.

This applies to every occurrence.

For example, if 25 appears 4 times as:

25, -25, 25, -25

all four cells should be highlighted green.

The green highlighting should be visually obvious but still maintain good readability.

Numbers appearing only once should remain neutral.

7. Initial-number reappearance detection

There is a second, separate rule.

Compare the 10 original numbers in the Initial row against the rest of the generated grid.

If an initial number appears again anywhere else in the grid, highlight the original Initial-row cell RED.

Again, ignore the minus sign when comparing.

Example:

Initial numbers:

50 | 72 | 34 | 90 ...

If -50 appears anywhere in Rows 2–8, the original 50 cell in Row 1 should turn RED.

The generated occurrence of -50 should still follow the normal duplicate-highlighting rule.

Important distinction

GREEN = this normalized number occurs more than once anywhere in the entire grid.

RED = this particular initial number has reappeared somewhere later in the generated grid.

If an initial cell qualifies for both conditions, RED should take priority for the initial cell so the user can immediately see that an original number has reappeared.

8. Frequency / Results panel

Below the grid, create a results section titled:

NUMBER FREQUENCY

Display every normalized number found in the grid and how many times it appears.

Organize the results into categories:

Appears Once

List all numbers whose frequency is 1.

Appears Twice

List all numbers whose frequency is 2.

Appears 3 Times

List all numbers whose frequency is 3.

Continue dynamically for whatever maximum frequency exists.

For example:

Appears Once (12)
3 · 7 · 14 · 19 ...

Appears Twice (5)
22 · 31 · 48 ...

Appears 3 Times (2)
11 · 25

The number shown in the frequency panel should be the absolute/normalized value, without a minus sign.

9. Reappeared Initial Numbers

Create another results panel:

INITIAL NUMBERS THAT REAPPEARED

List every initial number that occurs again somewhere in Rows 2–8.

Example:

25 · 44 · 67

If none reappeared, display:

No initial numbers reappeared.

10. Summary statistics

Display a small summary at the top of the results area:

Total cells: 80

Unique numbers

Numbers appearing once

Numbers appearing more than once

Total duplicate cells

Initial numbers reappearing

These statistics should update automatically whenever the grid is regenerated.

11. Interaction

The app should recalculate whenever the user presses GENERATE GRID.

Do not require manual spreadsheet formulas.

All calculations must happen automatically in the browser.

Changing an initial number and generating again should completely recalculate:

the 8 × 10 grid

duplicate detection

green highlighting

red initial-number highlighting

frequency groups

summary statistics

12. Visual design

Make the application feel like a compact analytical tool rather than a generic form.

Use:

clean modern typography

strong visual hierarchy

compact grid cells

rounded corners

subtle borders

clear green duplicate highlighting

clear red reappearance highlighting

responsive design for desktop and mobile

The grid should remain easy to read on a phone. On narrow screens, allow the grid itself to scroll horizontally rather than breaking the entire page layout.

Include a small legend:

🟩 Appears more than once

🟥 Initial number reappeared

13. Validation

Require all 10 initial numbers before generating.

Only allow valid numeric input.

Handle:

positive numbers

negative numbers

zero

decimal numbers if entered

Do not produce NaN, undefined, or blank calculation results.

14. Example test case

Use this as an internal test case to verify the implementation:

Initial numbers:

50, 61, 72, 83, 94, 105, 116, 127, 138, 149

For the first column the generated values must be:

50
39
28
17
6
-5
-16
-27

Verify that duplicate detection treats 27 and -27 as identical.

Also verify that the system correctly identifies any initial number that reappears later in the grid.

15. Technical requirements

Build this as a lightweight client-side application.

Preferred stack:

React

TypeScript

Tailwind CSS

Keep the calculation logic clean and modular.

Create reusable functions for:

Generating the propagation grid.

Normalizing values with Math.abs().

Calculating frequency counts.

Detecting duplicates.

Detecting initial-number reappearances.

Generating the frequency groups.

Calculating summary statistics.

Do not hard-code the results.

The application must calculate everything dynamically from the user's 10 inputs.

16. Final acceptance criteria

The app is complete when:

I can enter exactly 10 numbers.

The app generates 8 rows × 10 columns = 80 cells.

Every row subtracts 11 from the previous row.

Negative signs are displayed but ignored for matching.

Every number appearing more than once is highlighted green.

Every original number that appears again later is highlighted red in the Initial row.

Frequency counts correctly show numbers appearing once, twice, three times, etc.

Results use absolute values.

Statistics update automatically.

The entire calculation works without a spreadsheet.

The interface works well on both desktop and mobile.

Include the supplied test case and verify the calculations before considering the implementation complete.

Build the complete working application, not just a visual mockup.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://lottomagix.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/9baa9bbc-9743-4989-a848-77d3ef9e6c56).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
