# Review at the read: one plan for the whole household, the lead test (PRESCRIPTIVE-PLAN.md step 4, D118; EXPLORATORY, seed 7002)

Subject: the read committed at 57717e96, and its line in STATE.md (bba15289). It covers:
- `results-household.txt`, the reducer's output whole (A LEAD, WITH A UNIT TO PLACE; THE SEARCH GOES);
- its write-up, `reports/2026-11-17-household-read.md`;
- the fault check written after the read: `household-beside.mjs`, `household-ceil-check.mjs` and `household-tax-why.mjs`,
  with their results files;
- STATE.md section 6 action 3's account of the read.

Read (blobs at 8e064579, the branch's head when this was written):
- the rule: `HOUSEHOLD.md` 2f563e49aba4, section 5 and its step 4 amendment (ba40be02); `PRESCRIPTIVE-PLAN.md` step 4,
  `ANSWERS.md` and `results-pilot.txt` on review/external-2026-10-21 at f1f44727; D115 to D124 in STATE.md;
- its files: `audit-household.mjs` f40361acbe6c, `reduce-household.mjs` 2a762db28f98, `batch-household.sh` a6580cc8d1f0,
  `household.mjs` d8be81173511, `stats.mjs` 7cf309da0151; `results-household-planted.txt` 2fad2c914ac3,
  `results-household-test.txt` 0bd5eff1883c;
- the read: `results-household.txt` be4058929002, `reports/2026-11-17-household-read.md` 45776d476017;
- the fault check: `household-beside.mjs` 0f42f6c18c94 with `results-household-beside.txt` 5ec990cbaca8,
  `household-ceil-check.mjs` ebc9c73ceb8f with `results-household-ceil.txt` b694e1425caa, `household-tax-why.mjs`
  6efe58b02905 with `results-household-tax-why.txt` efca817dcbfa; committed while this review ran, `axis-tax.mjs` and
  `results-axis.txt` (8e064579);
- the code the figures rest on: `research/engine.mjs` `stepYear` (each person's draw, its tax-free part and `cumPcls`, the
  row's tax fields), `audit-phase4.mjs` `runPath`;
- the 28 units in `results/household-7002/` (each `<id>.json.gz` and `caseN.txt`), `results/household-launch-1.log`,
  `runs.log`, the launch's snapshot `/tmp/solver-snap-c9mKLK`; the 28 units of `results/joint-wide-7002/`, their K2
  arrays. Not opened: `results/joint-wide-7002-stopped/`. Every path read here is seed 7002's; no held-out seed was read,
  printed or estimated.

Ran:
- `node research/solver/reduce-household.mjs`: `results-household.txt` byte for byte, the gate fair. `--planted`: all 12
  pass.
- `node research/solver/household-beside.mjs`: its results file byte for byte.
- `node research/solver/household-ceil-check.mjs S191-90`: its section of `results-household-ceil.txt` byte for byte, but
  for the time line (321 s here).
- `node research/solver/household-tax-why.mjs S335F`: its section of `results-household-tax-why.txt` byte for byte.
- My own recomputation from the units' arrays, written apart from the reducer (`stats.mjs` `survivalChange` for the
  intervals only).
- My own split of `household-tax-why.mjs`'s decomposition, on its setup (the household table solved again and held to the
  run's digest; each person's income tax held to the engine's row in every plan year, none off by more than £1). It
  reproduces that script's figures to the pound and adds: the split by phase of the plan; the household plan's own
  tax-free cash on the same draws; CEIL's tax on the same paths; and the same figures on the first 400 paths both arms
  keep. On S191-90, S333F and S335F.
- Short scripts of my own over the unit files: the failure kinds and the figures below the cap without S191-90, the groups
  without their largest unit, the lost paths' shortfall by kind, and `biasesNil` on every unit.
- These scripts are in this session's scratchpad, not committed. Their figures are in findings 1, 2, 4, 5 and 7.
- A check of the household plan's income tax: on all 28 units, the household plan's tax on £30,000, £60,000, £90,000,
  £150,000 and £260,000 of income against twice a person's on half of it.

Verdict: FAIL

The read stands. Its gate, its identity, every figure in the results file and its outcome (A LEAD, WITH A UNIT TO PLACE;
THE SEARCH GOES) are right by the rule as committed, so step 5 takes HS1. The FAIL is the write-up's:
- the cause it gives for the three units to place is not shown, and the decomposition's own figures, split further, go
  against part of it (finding 1);
- three pooled figures are given without their largest unit; without it, two read the other way and the third shrinks to
  a sixth (finding 2).
STATE.md's line carries finding 1's comparison, and "none found". Each fix is a change of words, with any new figure
printed by a script beside the rule. The reducer is stamped and stays as it is.

## What holds

1. **The rule's files and the run's account.**
   - Last changes: `HOUSEHOLD.md` at ba40be02 (17 Nov 11:41 UTC). `audit-household.mjs`, `reduce-household.mjs` and
     `batch-household.sh` at 95ecaeb0 (12:21). `household.mjs` at 8001a14f (11:24). `stats.mjs` on 18 Oct.
   - No later commit, up to 8e064579, touches any of them.
   - The launch's snapshot of 95ecaeb0 holds each of them, and `research/engine.mjs`, byte for byte as the tree has them.
   - The amendment (11:41 UTC) came before the launch (12:57 UK; UK time is UTC in November), the only run of the units.
   - All 28 logs carry `code 603eeb595679 audit 930d7e4ac75a`, and `stampFilesHash()` gives `930d7e4ac75a` now.
   - One launch and no resume. The launch log has one window: 28 to run, done 16:47 UK. `runs.log` has one line for it.
     All 112 arms ran in one process each, no log has a resumed part, and `parts/` is empty.
2. **The gate is fair as recorded.** Each unit's household settings line differs from the first person's in `minPot` alone.
   D124 leaves that out, and the audit holds it to the household's own (S191-90: 112,900, where the first person's table
   has 101,610).
3. **The identity.** All seven arrays of K2 on all 28 units equal JOINT-WIDE's byte for byte: 196 of 196, in my own
   comparison.
4. **Every figure in the results file reproduces from the arrays**, in my own code:
   - part 1: 1,489 saved and 1,163 lost of 112,000 paths, `+0.291` (`+0.200` to `+0.381`);
   - part 2: the three units and every unit's interval;
   - part 3 (`+0.7838%`), and spending over every path (`+0.8422%`);
   - part 4: `-2.410%`, `-£60,880` a path; spending `+£22,523` a path;
   - part 5: `£28,165,385,060` against `£33,762,063,216`, `-16.577%`;
   - part 6: S191-90 alone, `+21.76`;
   - the split's search: `+0.001` (`-0.018` to `+0.020`), no unit below, `-0.0022%`, `+0.224%`;
   - HOUSE less K2, and every by-unit line.
   Every figure the write-up quotes from the results file and the beside file matches them.
5. **The outcome follows from the rule.** Parts 1, 3 and 5 hold. Part 2 fails on S333F, S335F and S191-90, and none of the
   three has nil biases. So the outcome is A LEAD, WITH A UNIT TO PLACE. All four of the search's parts hold, so THE SEARCH
   GOES, and step 5's HS is HS1 (`SHAPES.md`).
6. **The fault check, where it checks, holds.**
   - `household-tax-why.mjs` holds each person's income tax to the engine's row as it says. It checks both people, in every
     plan year of every lost path, to £1, and stops otherwise.
   - CEIL on S191-90 reproduces: `98.60%` against the table's forecast `98.66%`; it keeps 821 of the 829 paths HS5 loses.
   - The household plan's income tax equals twice a person's on half the income, to the pound, at all five incomes on all
     28 units, Scottish units included. So the doubled bands are built right.
7. **Against the pilot.**
   - On the pilot's twelve units the read gives `+1.635`, and HOUSE `+1.640`, where the pilot gave `+1.72`.
   - On 8 of those 12 the capped pot is lower by 1.5% or more: the pilot's two in three.
   - The times sit inside the pilot's ranges.
   - So the distance is survival, on units the pilot did not run, as the write-up says.

## Findings

1. **BLOCKING. The cause the write-up gives for the three units to place is not shown, and the decomposition's own
   figures, split further, go against part of it.**
   - The claims:
     - "The decomposition puts the units' loss in income tax the household table cannot see: ... when one person draws
       most of the pension, the couple pays that person's higher rates; the table plans the household's spending against
       the lower bill, and the couple ends below its minimum pot" (report, lines 177 to 180);
     - "On S191-90 that hidden tax is about four times the shortfall" (lines 36 to 39);
     - "S333F and S335F show the same mechanism on a smaller scale" (line 40, and again at lines 183 and 184).
     STATE.md's line (bba15289) carries the comparison as what the fault check found.
   - What `household-tax-why.mjs` measures is a size. On the paths HS5 loses and K2 keeps, it is the couple's income tax
     less the same taxable incomes taxed on the household plan's bands.
     - No run takes that tax away, or gives the table single bands, so nothing splits the loss.
     - Two sizes set side by side ("about four times") do not decompose it.
   - I split it further on the script's own setup, and its figures reproduce to the pound (`£952,704`, `£186,717`,
     `£72,638`, `£78,036`). Split, the figures do not single that tax out:
     - **(a) It is of the same size where HS5 keeps the paths.** On the first 400 paths both arms keep, the same "left out" is:
       - S191-90: `£138,323` a path (`£186,717` on the lost paths);
       - S333F: `£93,006` (`£72,638` on the lost paths);
       - S335F: `£85,512` (`£78,036` on the lost paths).
       So its size beside the shortfall cannot say why these paths are lost and those kept.
     - **(b) It leaves out the household plan's own tax-free cash, which on S191-90 is of the same order.**
       - `pclsMaxCap` is in `DOUBLED`. `mergedState` hands the table the two people's tax-free cash taken as one figure,
         against a doubled cap of `£536,550`.
       - The first person reaches their own cap of `£268,275` on every one of S191-90's 829 lost paths (the median plan
         year 29). On S333F they reach it on 50 of 51 lost paths, and on S335F on 67 of 70; on the first 400 paths both
         keep, on 63 and 41.
       - On S191-90's lost paths the couple takes `£358,865` a path tax-free, and CEIL takes `£536,361`.
       - I gave the household plan its tax-free quarter on the couple's own gross draws, and counted the cash taken in two
         ways. Where the household keeps its own count of cash taken, so stops at its doubled cap, its tax falls by a
         further `£80,861` a path. Where the cash taken is read as the table reads it each year, against the two people's
         cash so far, it falls by `£194,297`. Read the second way, the figure is `£30,255` on S333F and `£29,663` on
         S335F.
       - Of the couple's `£518,026` a path more tax than CEIL on S191-90's lost paths (`£954,710` against `£436,684`,
         `results-household-ceil.txt`), the bands' part is `£186,717`, 36%. The tax-free cash is a further `£80,861` to
         `£194,297`. The remaining `£137,012` to `£250,448` is neither.
     - **(c) On S333F and S335F about half of it falls before anyone retires, with no pension drawn.**
       - Of S333F's `£72,638`, `£35,309` falls in plan years 0 to 14, while both work. Of S335F's `£78,036`, `£36,578`
         does.
       - That is tax on the savings income while both are paid, not uneven draws.
       - The agent's own `axis-tax.mjs` prints the same figures (`results-axis.txt`, 8e064579).
       - The taxable pension drawn in a spending year there is about 64 to 36 (`£26,024` and `£14,301`; `£23,911` and
         `£13,193`), near the 60 to 40 the pensions are held in.
       - So "the same mechanism on a smaller scale" is not shown.
   - What the write-up should say instead:
     - the sizes, and where they fall: on S191-90 after plan year 16, while the first person draws `£88,659` of taxable
       pension a year (`results-axis.txt`); on S333F and S335F, half before anyone retires;
     - (a) and (b) beside them;
     - and no cause.
   - A decomposition that would show a cause: HS5 on S191-90 with the household table solved once with the income bands
     single, and once with the tax-free cash cap single, each against HS5 and K2 on the same paths. That is the form
     `ANSWERS.md` used on the plan's fidelity gaps on S061-dbpart and S227-90 ("Leaving the income bands single turns the
     gap...").
   - AXIS.md carries these units' cause (D121), so it must take the corrected words, and STATE.md's line should follow the
     report.

2. **BLOCKING. Three pooled figures are given without their largest unit. Without it, two read the other way and the
   third shrinks to a sixth.**
   - The amended rule asks for "every pooled figure with and without its largest unit" (HOUSEHOLD.md section 5;
     PRESCRIPTIVE-PLAN.md step 4).
   - The figures below are from my own script over the unit files, with the failure kinds as `household-beside.mjs`
     defines them.
   - **The trade of failures (report, lines 155 to 157).** The report says: "Over the 28 units, the household plan trades
     one kind of failure for the other. HS5 loses 1,628 paths at the minimum pot, against K2's 989."
     - All of the extra failures at the minimum pot are S191-90's: 672 under HS5, 18 under K2.
     - Without S191-90, HS5 loses 956 paths at the minimum pot against K2's 971, and 2,724 paths short against K2's
       3,864.
     - So without that one unit the household plan fails less often both ways, and there is no trade.
   - **The groups (line 25, in "What it found").** The report says: "the younger units `-0.069`, and the 90/10 units
     `-1.550`".
     - Without S191-90, the other seven 90/10 units gain `+1.189` (`+1.073` to `+1.290`; 398 saved, 65 lost).
     - Without S335F, the younger units read `+0.136` (`+0.008` to `+0.261`).
     - Without S147-db, the feature units read `+1.311` (`+1.217` to `+1.387`). Without S205, the library reads `+0.483`
       (`+0.333` to `+0.602`).
   - **Tax and the pot below the cap (lines 46 and 47; the table at lines 192 to 195).** Below the cap HS5 pays
     `£135,202` a path, against K2's `£115,547`.
     - 83.1% of that pooled difference is S191-90's.
     - Without S191-90, HS5 pays `£106,433` against `£103,007`, and leaves a pot of `£1,380,971` against `£1,460,580`.
   - The fix: each figure given beside its figure without the largest unit, and the trade sentence dropped or put as
     S191-90's alone.

3. **MINOR. "No fault in the build" says more than the check covers.** The phrase is at report line 174. The commit
   message says "No fault found", and STATE.md says "none found".
   - What the check covers:
     - the household table solved again equals the run's by its digest;
     - HS5 run again equals the unit file on 200 paths;
     - the table on its own plan (CEIL) survives within half a point of its forecast.
     That shows the table's solve, its forecast and the arm's run are as built. I reproduce it on S191-90.
   - What it does not cover: whether `householdPlanFor` builds these three couples as they are.
     - The plan's fidelity and twin checks (`household.test.mjs` checks 3 and 8) ran on S205, S061-dbpart, S327F,
       S227-90, S149 and S023-db, none of the three.
     - My check of the doubled income tax schedule (What holds, item 6) covers one part of it.
   - Say "no fault found in the table's solve, its forecast or the arm's run".
   - The same goes for "The table is not the cause" (line 30). The table's solve is right on its own plan. The loss lies
     between that plan and the couple, and that plan is design A's model of the couple.

4. **MINOR. The household side of `household-tax-why.mjs` is not quite "how the household table's model prices the
   year".** That is the report's phrase (lines 163 and 164). The script's header says "as the household table's model
   taxes one person holding both". It departs from that in two ways:
   - **(a) The tax-free cash.** It takes each draw's taxable part as the couple's, so the household plan's own tax-free
     cash (finding 1 (b)) is not in it.
   - **(b) The years when one person still works.** These are the plan years when the later retiree still works after
     the first person retires.
     - There the script stacks the draws over that person's pay on the household's bands.
     - `householdPlanFor` carries that pay as tax-free take-home, so the household plan has no pay in those years.
     - On S191-90 those years (plan years 5 to 7) print a "left out" of `-£21,900` a path. The household plan's model has
       no such negative. `results-axis.txt` prints `-£21,351` for plan years 5 to 15.
   - The fix: call the figure "the bands' part, on the couple's taxable incomes", and say what it leaves out.

5. **MINOR. The "short of the minimum pot" figures count the paths that ran short as well.** These are `£47,513`,
   `£34,778` and `£41,620` (report lines 38 and 39, and the table at lines 166 to 170).
   - The script counts every lost path, including those that ran a year short. Each of those counts as the whole minimum
     pot (its end pot is nought), and its unmet spending is not counted.
   - On S191-90 the 160 such paths make up 45.9% of the `£47,513`. On S333F the 9 such paths make up 68.7% of the
     `£34,778`, and on S335F the 14 make up 68.0% of the `£41,620`.
   - The figure sits next to "Most of them meet every year's spending and end the plan below the household's minimum
     pot", so a reader takes it as those paths' shortfall.
   - The fix: say what it counts, or give the two kinds apart.

6. **MINOR. "HS5 pays less, which is the tie-break above the cap's work" (report lines 197 and 198) names a cause without
   the decomposition that shows it.**
   - HOUSE carries a tie rule above the household's cap too (`tieJoint`).
   - HOUSE also differs from HS5 in more than that: it picks among three moves at five splits, by a one-year step of the
     exact model.
   - HS5 against HS5 with the table's `tieAboveCap` at 0 (`household.mjs`'s own `'notiebreak'` form), on the same paths,
     would show it. Without that run, drop "which is the tie-break above the cap's work".

7. **MINOR. The reader is not told that part 2 could read NO LEAD on one unit only.**
   - Of the 28 units only S109-sppart has nil biases (`biasesNil` over the unit files).
   - The other 27 each carry at least one of these:
     - a locked year;
     - 90% of the pensions with one person;
     - a one-off deposit owned by one person;
     - guaranteed income tax left out of £100 a year or more.
   - So a loss beyond the bar on any unit but S109-sppart, however large, reads as "a unit to place". S191-90's
     `-20.725` is read that way.
   - "So by the rule they are units to place, not a failure" (line 28) should say this.
