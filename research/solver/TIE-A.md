# The tie-break above the estate cap, and item 7's second read: stage A (EXPLORATORY)

The review of 11 Nov, item 13 (`research/reviews/2026-11-11/ANSWERS.md` sections 2 and 3 on review/external-2026-10-21
at b0d01444; D76), with the maintainer's addendum of 11 Nov (D81). EXPLORATORY, seed 7002. Both rules below are
committed before launch, with the audit, the batch and the reducer that read them. By D81 a pass of the rule as written
here is the maintainer's ruling naming this run; a failure is reported and nothing is changed or run again to pass it.

## The question

Item 13: above the estate cap the tables put no value on a pound, so the whole menu breaks near-ties arbitrarily and pays
tax that buys nothing the objective values (`ITEM7-POT.md`). Does a tie-break in the forward chooser, only where wealth
is already above the cap and only among the moves at the best move's spending level and tier pair (the least tax this
year), leave more pot and no more tax, with survival, spending and the capped pot unchanged?

Item 7, read again: with that tie-break on both, does the chooser on a shortlist (`structure` or `order`, with the
slice) lose survival, spending or the pot against the whole menu?

## The design

- **Code:** the working branch after D73's port is committed (the candidate af001697ce1b: its tables come from the solve
  on anchors, the sweep's cash ISA money to the ISA, the thinner bridge reference), with the review's three prototypes
  applied on a scratch tree, not committed to the branch: `2026-11-09/prototype/shortlist.diff` (`SHORT`),
  `2026-11-11/prototype/chooser-tie.diff` (`tieMargin` with `tieSame` and `tieAbove`) and
  `2026-11-11/prototype/shortlist-slice.diff` (`SHORT.slice`). `solve()` stays under V8's limit with them
  (`solve-size.test.mjs` on the scratch tree). Launched through `run-from-snapshot.sh` with `PREDICTION="none:..."`.
- **First, the review's check reproduced:** `scripts/chooser-tie.mjs S328F 45 3000` on a copy at 6331361 with the three
  patches prints the review's two lines (`results/out-chooser-tie-45-S328F-slice.txt`): `whole+tieC@1e-4` mean pot
  23.19%, lifetime tax -48.38%, 0 saved, 0 lost; `structure+slice+tieC@1e-4` mean pot 23.54%, 0 saved, 1 lost
  (`results-tie-precheck.txt`).
- **Households:** SPEED-A's twelve, as it took them (`audit-speed.mjs` `HOUSEHOLDS`, `planOf`): the review's eight as
  Phase 4 landed them; S224, S362, S366 and S370 as the library enters them.
- **One solve a household:** the app's solve, `solveForApp` at 45 points, the candidate as ported. No arm changes a
  table: each unit records its tables' digest before the first arm and after the last, and the reducer refuses a unit
  whose two differ.
- **Arms, each scored by the engine on the same 16,000 paths of seed 7002 (paired), on those tables:**
  1. the whole menu;
  2. the whole menu with the tie-break above the cap, within 0.001 points (`whole+tieC@1e-5`);
  3. the same within 0.01 points (`whole+tieC@1e-4`);
  4. `structure` with arm 3's tie-break and the slice (`structure+slice+tieC@1e-4`);
  5. `order` with the same (`order+slice+tieC@1e-4`);
  6. `structure` with arm 3's tie-break and no slice (`structure+tieC@1e-4`), to show the slice's part;
  7. and 8. `structure` and `order` with the slice and arm 2's tie-break (`...+tieC@1e-5`). Not in the review's list:
     D81 reads item 7 "against the arm B takes", so if the rule below takes arm 2 the shortlists are read at its margin.
     Read only then.

  `cells` is not run (D76).
- **Stored for each path:** survival, spending delivered and target, the pot left, and lifetime tax.
- **The replay** (the first 100 paths). At each decision of arm 1's own path, arm 3's choice and arm 2's: the decisions
  that differ, and of those the ones at another level, at another tier pair, or with wealth at or below the cap (and,
  beside the rule, those paying more tax that year). Then at each decision of arm 3's own path the choices of arms 4, 5
  and 6, and at each of arm 2's own path those of arms 7 and 8: the decisions at another tier pair.
- **Units:** one a household, twelve. **Size:** about 20 core-hours with arms 7 and 8 (the review's 14 for its six).
- The estate shape is not changed (D77). The cap is four times the household's opening wealth, and each unit records
  beside it the cap as the solve's own estate term has it.

## The read

For an arm X against its base, on the twelve: d, each household's survival under X less under the base, in points,
paired on its 16,000 paths.

- **Pooled survival:** the mean of the households' d, its 95% interval from their paired variances (as SPEED-A.md).
- **A household's interval:** `stats.mjs` `survivalChangeU`.
- **Spending delivered:** each household's lifetime spending delivered as a share of its lifetime target, in points, X
  less base, averaged over the households.
- **The pot left:** a household's mean pot left over its paths; pooled, the households' means averaged, X over base, in
  percent. **The capped pot** (as the solver scores it): the same on each path's pot held to the household's cap.
- **Lifetime tax:** a household's mean lifetime tax over its paths; pooled, the households' means averaged.

## Item 13's rule

The tie-break passes if all seven hold, arm 3 against arm 1:

1. pooled survival's 95% interval has its lower end above -0.1 points;
2. no household's interval lies wholly below -0.3;
3. pooled spending delivered is within 0.05 points of target, either way;
4. the capped pot is not lower by more than 0.1% pooled, nor by more than 0.5% on any household;
5. no household's mean pot left is lower by more than 0.1%;
6. pooled lifetime tax is not higher;
7. in the replay, no differing decision is at another level, at another tier pair, or at or below the cap. One is a bug
   in the prototype or the audit: STOP.

Arm 2 is read the same way. If both pass, arm 3 is taken (the larger pot), unless the two pooled mean pots are within
0.5% of each other: then arm 2, the smaller margin. If one passes, that one.

**Outcomes.**
- **Passes:** by D81 that is the ruling naming the run. Stage B is built at the margin the rule takes, as an option, off
  in code and not in the candidate, with its test (`ANSWERS.md` item 13, stage B). Switching it on is the maintainer's.
- **Fails 1 to 3, 6 or 7:** STOP and report.
- **An arm fails part 4 or 5 and no other:** that household's paths that were above the cap and ended below it are
  reported, and the remedy `ANSWERS.md` names is run once: the tie-break only where wealth is above 1.25 times the cap,
  at that arm's margin, on the same paths and tables (`audit-tie.mjs ... remedy`: the whole menu and the two shortlists
  with the slice), read by this same rule against arm 1. If it passes, that is what stage B builds; if not, STOP and
  report. (If both margins fail only 4 or 5, the remedy is run at arm 3's.)

## Item 7's rule, read again

A width passes, against the whole-menu arm item 13's rule takes (arms 4 and 5 against arm 3; arms 7 and 8 against arm
2; after a remedy, the remedy's shortlists against the remedy's whole menu), if:

1. pooled survival's 95% interval has its lower end above -0.1 points;
2. no household's interval lies wholly below -0.3;
3. pooled spending delivered is within 0.05 points of target, either way;
4. the pooled mean pot left is not lower by more than 0.5%, and the capped pot not lower by more than 0.1%;
5. in the replay its tier pair differs from the whole menu's at under 1% of decisions.

More pot than its base passes.

**Outcomes (D81).**
- **`structure` with the slice passes:** that is the ruling naming the run: item 7's stage B is built with the slice, off
  in code.
- **It fails and `order` with the slice passes:** `order` is built.
- **Neither passes:** item 7 is closed and the whole menu stays.
- **Item 13's rule takes no arm:** the widths are read against arm 3 and reported; nothing is built.

Arm 6 is reported beside arm 4, to show what the slice adds. No registered couples' arm takes any of this (D80).
