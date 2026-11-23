# Review at the read, second look: the guard's own units, the registered test (`registrations/couples-open.md`, seed 7026)

**Subject:** the write-up `reports/2026-11-22-couples-open-read.md` after its one fix round (D81 (F)). The round answers the
first look's FAIL (`reviews/2026-11-22-read-couples-open.md`: one BLOCKING, three MINOR). The read itself was checked at
the first look and has not changed.

**What I read** (git blobs, first 12):
- the write-up as it now stands, 225754f90ed1 (written 00:04 UTC, 23 Nov);
- `results-couples-open.txt` be3ee4820ba9, the first look's blob, unchanged;
- `results-couples-open-rehearsal.txt` 09809867d079, `results-couples-open-addendum.txt` 0f8c68f51ab3 and
  `results-couples-open-registered-panel.txt` d2d3e7e33230;
- `research/engine.mjs` l.1789 to 1806, `incomeFloor` (built, not tracked);
- `src/couplesSwitch.js` b33f855de049, l.113 to 130;
- the G12R plans as `couples-open-panel.mjs` `readOpenPanel` builds them (REG=1), from the first look.

No new run: the read is unchanged, and the first look reproduced it byte for byte.

Verdict: PASS

## What holds

1. **BLOCKING 1 is answered.**
   - **The closing claim is gone.** The closing lines (141 to 142) no longer say S037 "trades spending for survival". They
     say only that on nine of S037's eleven units more paths kept and less spent on the paths both keep occur together,
     beside a larger pot. Whether they would on another couple like S037 is not shown. That is what the records show
     (`results-couples-open.txt` lines 8 to 68).
   - **The S037 summary has its scope.** Line 68 now opens "So on nine of S037's eleven units".
   - **The read's limit is stated.** Line 75 says the read cannot tell spending given up for survival from money left in the
     pot, and does not show why.
2. **MINOR 2 is answered.**
   - **Its sources.** Lines 77 to 80 cite `results-couples-open-rehearsal.txt` and `-addendum.txt`. They give the rehearsal
     as EXPLORATORY, seed 7002, 4,000 paths, which the files print.
   - **Less on the paths both keep on five of S025's ten household-route units,** from `-0.1195%` (E95) to `-1.3855%`
     (G8Y75): E95, E100, S75, G8 and G8Y75 (rehearsal lines 23, 24, 35, 43 and 45).
   - **More on the other five,** from `+0.0262%` (G12) to `+2.5398%` (G12P): Y75, Y90, Y100 and G12 (rehearsal lines 7 to 9
     and 44), and G12P (addendum line 8).
   - **No interval printed.** Neither file prints one for spending on the paths both keep.
3. **MINOR 3 is answered.**
   - **The rent (lines 19 to 23).** It now says the rent is entered from plan year 0, and the engine counts an income from
     its owner's retirement at the earliest (`incomeFloor`). The rent runs:
     - from now on S037 (68, retired at 66) and S119 (61, retired at 60);
     - from 60 on S199 (55 now) and S279 (45 now).
   - **The ages (lines 25 to 27).** They are now "as the library holds them". The S units set the partner to the first
     person's age (68/68, 61/61, 55/55, 45/45). The G units set the partner 8 or 12 years younger. Every Y and E unit is at
     its couple's three-year gap (the panel file).
4. **MINOR 4 is answered.**
   - **Three separate items.** The inference list (lines 124 to 135) now has income before 58, retiring before 58 and the
     younger cohort as separate items.
   - **Income before 58.** That item now says G12R's rent runs after 58 on every couple, and before the state pension age
     on S119, S199 and S279 alone; S037's runs from 68. That is right on the plans and `incomeFloor`.
   - **E at a wide gap.** Lines 137 to 139 add E at an age gap over three years without other income, for the change of
     default's D-line. That matches the guard (`src/couplesSwitch.js` l.119 to 129: with `ELDER_UP_TO` at all of it the
     holdings hold, and the gap counts only with other taxable income).
5. **The rest of the write-up** is as the first look checked it, every figure the read's own.

## Findings

1. **MINOR. Of the two examples at lines 71 to 74, only Y75 shows what line 71 says.** Line 71 says "The paths kept and the
   spending do not move together unit by unit." G12P shows the opposite, and my first look's wording led there.
   - **Y75 shows it.** It loses 0 paths and saves 3,695 (`results-couples-open.txt` line 8), while spending `+0.5293%` more on
     the paths both keep. Its 3,695 is more than five of the nine named units keep (Y90 3,356, Y100 3,392, E95 3,461, E100
     3,554, S75 3,597; the M1 line, line 68). The write-up's "more than two" is true but undercounts.
   - **G12P does not.** It loses 6 and saves 3,213 (line 50), so 3,207 net, the fewest of S037's eleven, while spending the
     most (`+2.3500%`). Fewer paths kept with more spent is the direction a trade would show, not two things out of step.
     My first look called G12P a unit keeping "as many more paths as the named units do". That was loose, and the write-up
     took it over.
   - **The conclusion is right but rests elsewhere.** Line 75's conclusion holds, but it rests on the read having no
     decomposition, not on these examples. Units with different plans cannot show a trade within one plan, either way.
   - **Fix:**
     - keep Y75 as the example;
     - drop G12P or say what it shows ("G12P keeps the fewest paths of the eleven and spends the most");
     - give line 75 its own ground: the read has no decomposition.
