# Review at the read, second round: one plan for the whole household, the lead test (PRESCRIPTIVE-PLAN.md step 4, D118; EXPLORATORY, seed 7002)

Subject: the fix at d7f9a19f. It answers the first round's FAIL (`reviews/2026-11-17-read-household.md`, two BLOCKING and
five MINOR). It changes:
- the write-up, `reports/2026-11-17-household-read.md`;
- STATE.md's line on the read (section 6 action 3);
- three scripts beside the rule, with their results files: `household-tax-why.mjs`, `household-beside.mjs` and
  `axis-tax.mjs`.
The read itself (`results-household.txt`), the reducer, the audit and `household.mjs` are unchanged. The first round found
them right.

Read (blobs at d7f9a19f):
- the write-up 17813d5fb538 (the line numbers below are this blob's); `STATE.md` 99eae4193549; `DECISIONS-PENDING.md` as bba15289 left it (the fix does not touch
  it);
- `household-tax-why.mjs` d7d2d23b9cf7 with `results-household-tax-why.txt` 21bed5f44c9d; `household-beside.mjs`
  9b231f7cdb53 with `results-household-beside.txt` da8af831d084; `axis-tax.mjs` f02c715869b1 with `results-axis.txt`
  9728b3e798c5;
- unchanged, read again where the write-up quotes them: `results-household.txt` be4058929002,
  `results-household-ceil.txt` b694e1425caa;
- the first round's review as committed, 93689380431e: the same, byte for byte, as I wrote it;
- the 28 unit files in `results/household-7002/`. Not opened: `results/joint-wide-7002-stopped/`. Every path read is seed
  7002's; no held-out seed was read, printed or estimated.

Ran:
- `node research/solver/reduce-household.mjs`: `results-household.txt` byte for byte. `--planted`: all 12 pass.
- `node research/solver/household-beside.mjs`: `results-household-beside.txt` byte for byte.
- `node research/solver/household-tax-why.mjs` on S191-90, S333F and S335F, at most two at a time as tracked tasks:
  each unit's section of `results-household-tax-why.txt` byte for byte.
- `node research/solver/axis-tax.mjs S333F`: its section of `results-axis.txt` byte for byte. Its other two units are checked
  by sum against my first round's split (What holds, item 6).
- `node research/solver/check-state.mjs`: passes.
- My own checks from the arrays, with no solve: the lost paths by kind, and section G's figures above the cap.

Verdict: FAIL

The fix answers each of the first round's findings in the report, STATE.md and the scripts, and every figure they now quote
is as the results files print it. One place still carries the cause the fix withdraws: the read's entry in
`DECISIONS-PENDING.md`, the maintainer's list (finding 1). My first round named the report and STATE.md, not that file, but
the claim is the same one, and the maintainer reads it there. It is one paragraph to correct. Two MINORs are left in the
report's words.

As this was finished, the working tree held uncommitted edits to the report, STATE.md and `DECISIONS-PENDING.md`, made
from a draft of this file (the same findings). They are not the fix reviewed here. At a glance they take the words
findings 1 to 3 give; I have not reviewed them.

## What holds

1. **Nothing the read rests on moved.** The fix touches no stamped file and nothing in `src/` or `research/engine.mjs`.
   `reduce-household.mjs` still prints `results-household.txt` byte for byte. My first round is committed as I wrote it.
2. **BLOCKING 1 is answered in the report and STATE.md.**
   - The cause is withdrawn, in "In plain words" (lines 43 to 62), in "What the check finds" (lines 216 to 225) and in
     STATE.md's line. None of the three says why the units lose.
   - The figures are given as sizes:
     - the bands' part, on the lost paths and on the first 1,000 paths both keep;
     - the tax-free cash the couple and CEIL take;
     - the paths on which the first person ends at their own cap.
   - The decomposition that would show a cause is offered, not claimed.
   - AXIS.md is to take the same words (line 261).
3. **BLOCKING 2 is answered.**
   - The report's table gives each pooled figure with and without its largest unit, and so do sections C, D and G of
     `results-household-beside.txt`: the groups, the failure kinds, and tax and the pot above and below the cap.
   - The trade sentence now reads "All of the household plan's extra failures at the minimum pot are S191-90's", with both
     counts without it.
4. **The MINORs are answered.**
   - 3: "No fault was found in the table's solve, its forecast or the arm's run", and what was not checked is said.
   - 4: the bands' part is named, and its two departures from the household table's pricing are said, in the report and in
     both scripts' headers.
   - 5: the lost paths are given by kind, with the paths a year short apart.
   - 6: the tie-break's cause is dropped.
   - 7: S109-sppart is named as the one unit with nil biases.
5. **Every figure the corrected report and STATE.md's line quote is as the results files print it.** I read each one
   against them, and recomputed the new ones that need no solve from the arrays:
   - the lost paths by kind, and how far below the minimum pot: `£31,875`, `£13,238` and `£16,650`, with 160, 9 and 14
     paths a year short;
   - above the cap without S341F: `£487,428` against `£571,680`, the pot `£16,412,014` against `£14,461,854`, S341F
     holding `21.9%` of the difference in tax;
   - below the cap without S191-90, and the groups without their largest unit: as in my first round.
6. **The rewritten scripts compute what their headers say.**
   - `household-tax-why.mjs` still holds each person's tax to the engine's row in every plan year of both sets of paths, and
     stops otherwise (74,989, 64,111 and 65,270 rows). The kept set is the first 1,000 paths in path order that both arms
     keep. The cap count is taken at the plan's end.
   - The bands' part on the lost paths, and the tax-free cash the couple and CEIL take on them, are as my first round's
     split found them.
   - `axis-tax.mjs`'s four parts agree with my first round's split, which ran on separate code. Its first two parts equal
     my first two phases. Its last two add up, to the pound, to my third. The four parts are: S191-90 `£184`, `-£21,900`,
     `£549` and `£207,883`; S333F `£35,309`, `£2,109`, `£367` and `£34,852`; S335F `£36,578`, `£1,609`, `£2,606` and
     `£37,243`.

## Findings

1. **BLOCKING. The maintainer's list still carries the cause the fix withdraws.**
   - `DECISIONS-PENDING.md`'s entry "READ (17 Nov, evening)" (lines 60 to 65, as bba15289 wrote it; d7f9a19f leaves it) says
     the three units were placed "each losing where the couple pays income tax the household plan's doubled bands do not
     see". It also says "Checked for a fault first (far from the pilot on survival): none found" and "The reviewer at the read
     under way".
   - That is the first round's finding 1: a cause no run shows. On S333F and S335F the figures go against it: their bands'
     part is no larger on the lost paths than on the kept ones (`£72,638` against `£83,898`; `£78,036` against `£82,164`),
     and half of it falls before anyone retires.
   - STATE.md sends the maintainer to that file for what remains, so the claim reaches them there.
   - The fix: the entry takes the report's corrected words. That means sizes and no cause; no fault found in the table's
     solve, its forecast or the arm's run; and the reviewer's two rounds.
2. **MINOR. "Both are taken on the couple's own path under HS5, so the comparison is not across paths that have parted"
   (report, lines 194 to 196) does not hold for the table's CEIL column.**
   - The tax-free cash "the couple, CEIL" sets the couple's path under HS5 beside CEIL's own path.
   - CEIL makes its own decisions, and the two part in plan year 0 on every path `results-household-ceil.txt` traces.
   - So that comparison is across paths that have parted. Say it of the bands' part and the cap counts only.
3. **MINOR. "It is about the same size on paths both arms keep as on paths HS5 loses" (line 51).**
   - On S191-90 the lost paths' bands' part is a third larger: `£186,717` against `£138,926`.
   - "Of the same order", as line 220 and STATE.md put it, is what the table shows.
