# Prediction: diag-7ah

- **Run:** `research/solver/batch-7ah.sh` - results/diag7ah/case0-23.txt and every unit's trace (audit-s126.mjs diag7ah), read beside 7af's (results/diag7af) and 7ag's (results/diag7ag) records; reduced by `reduce-7ah.mjs` in the real tree into results-7ah.txt
- **Kind:** test
- **Written:** 29 Sept, before the run (its time is its registering commit's, git log); after O36's cause was located (results-o36-order.txt), bounded by the plan-auditor to bridges of three years or more (O36 "where it can move a choice", grade B, confirmed in the solver by research/tests/reader-order-solve.test.mjs: 6 passed), and the fix built behind an option (07eb52e; research/tests/reader-order.test.mjs, 12 passed)
- **Seeds:** 7002 tuning (every unit's 8,000 paths, the first 8,000 of 7ag's 16,000 and all of 7af's 8,000; the solves' opening path). The product's 'auto' risk-above rule reads its own seed 7101 inside solvePlan. No held-out seed is touched. **Disclosed (RULES.md Known limits item 18):** one build check ran this test's mode under "none" before this prediction was final: runs.log 29 Sep, "7ah build check" (the first unit, ORDER bridge 4 at W0.02, at 4 wealth points and 20 paths; its lines read only to see they print and parse); 4 wealth points are not a registered grid, and no figure of it is read. A second build check (runs.log 21:42, the matched runs on the same unit) and two preflights (runs.log 20:37, and the second with the matched runs) ran the same way, at 4 wealth points and 20 paths; no figure of them is read.
- **Unmasking:** the order reference removes a known error, the reader's proportional draw (O36: it pays the bridge from the accessible pots in proportion, where the solver draws in an order its menu chooses; on share 0.95 18.1% of bridges unpaid by the reference against 4.6% ISA-first and 6.5% in the engine's own run, results-o36-order.txt). What the error drives in the baseline: on bridges of three years or more year 1's reference holds two or more bills, so the chooser reads a table built on a too-pessimistic reference; S360's year-0 table reads 32.67 against 45.94 simulated (results-7af.txt), the only one of the six more than 5 points off. What removing it may unmask: an optimistic table where the reference was pessimistic but something else was optimistic - S370's table already reads 4.80 above its simulation (results-7ag.txt), and a more generous reference may push it further (reported); and choices that move many paths both ways on S360 and S370, where the reader alone moved hundreds (the pre-mortem). What tells a harm from an unmasking: item 6, the separating arm the deep review of 29 Sep 21:08 asked for (RULES.md section 9 rule 2(c)). Three of the six open on year-0 gaps within twice the switch margin (bridge 4 1.4138e-3, bridge 6 1.5919e-3, S366 1.8458e-3; results-7af.txt, results-7ag.txt), so a changed reference may flip an opening - family 1's knife edge, not the draw order. Each ORDER unit is run again with its opening forced to the pair it did not take; where READER and ORDER open apart, ORDER with READER's opening against READER splits a harm at items 1 to 4 between the opening flip and the reference's effect on later choices. Item 5 reads the table, not choices (the chooser never reads year 0's table).
- **Plan section:** PLAN.md "7ah"

## Question

On the six panel households whose bridge is three years or more, does drawing the reader's reference pot by pot in the menu's better order (O36's fix) do no material harm - by survival and by the whole score, at the default estate weight 0.02 and at 0.01 (the whole-score rule) - and does it cure the table's pessimism where O36 showed it, on S360?

## Derivation

- **O36's cause** (results-o36-order.txt, grade C, share 0.95 at the plan's tiers): the reference's closed form matches its own model (18.11% and 18.12% unpaid), but its premise - a proportional draw - does not match the solver's draws (cash first 25.68%, ISA first 4.62%, the engine 6.46%).
- **Where it can move a choice** (PLAN.md O36; solve.js scoreMoves reads year t+1, chanceOf's bills t..access, reader.js's one-bill step; confirmed in the solver on S126 and S360 by research/tests/reader-order-solve.test.mjs): only where year 1's reference holds two bills or more - bridges of three years or more. The six such households on the panel: bridge 4 (4 years), bridge 6 (6), S360 (8) from 7af; S366 (8), S370 (8), bridge 4+cost (4) from 7ag.
- **The tables against their simulations** (results-7af.txt, results-7ag.txt, READER/TS+J/W0.02): bridge 4 +0.04, bridge 6 -0.08, S360 -13.27, S366 -0.32, S370 +4.80, bridge 4+cost -1.23 points. O36's pessimism shows on S360 alone.
- **The order reference** (reader.js orderChance): one bill - referenceChance's step exactly; more - seeded simulation, pot by pot, the better of the menu's two orders, tabulated over 160 levels of accessible money and interpolated (a step smeared across one cell, under 2% of the later bills; research/tests/reader-order.test.mjs).
- **Prior tests of the same mechanism** (RULES.md section 9 rule 7): none - no run holds a reference drawn in order; 7x's readerRef 'held' (the held tier, not the order) is the nearest, and it overshot (O36).
- **Claude's choices, before any run:** the six households (every panel household with a bridge of three years or more, by the rule above - chosen from the bridge length alone, never from a result); 8,000 paths (7af's count; prefix-consistent with 7ag's 16,000); the regimen's margins (0.25 where READER survives 95% or more, 0.5 below: S360 45.94, S370 74.69), for survival and the whole score alike (the adopted rule reads the whole score at the regimen's margin); item 5's thresholds (half; 0.9).

## Prediction

The fix is safe on all six and cures S360's pessimism: survival no material harm at 0.02 and 0.01 (items 1 and 3 HELD); the whole score no material harm at both (items 2 and 4 HELD); S360's table error at most half of READER's 13.27 points (item 5 HELD). The bundle with the fix stays safe against the shipping default at 0.02, by survival and the whole score (items 7 and 8 HELD). Item 6 is reported: where an opening flips, the split says whose any harm is.

## Falsified if

Item 1 or 3: harm on any household (the exact rule with Holm across six at its margin). Item 2 or 4: any household's whole-score upper end below minus its margin (0.25; S360 and S370 0.5). Item 5: ORDER's S360 table error 0.9 of READER's or more. Item 7 or 8: ORDER against SHIP harm on any household, by survival or the whole score, at its margin.

## Fair-test table

Arm A is READER/TS+J (the bundle: the reader, the joint tier state, the product's settings); arm B is ORDER/TS+J, the same solve with readerRef 'order'; both at each of the estate weights 0.02 and 0.01, on the same 8,000 paths.

| # | Variable | Arm A | Arm B | Status (SAME / TESTED / ONE ARM ONLY / N/A) and why |
|---|---|---|---|---|
| 6 | The search paths (landings, and the rival arms' choice of order), and that nothing chosen on them is reported from them | none | none | N/A - no landing and no rival: lambda is held and the solver runs against itself |
| 12 | The estate preference | 0.02 and 0.01 | 0.02 and 0.01 | SAME - both settings run on both arms (the whole-score rule's two settings); each item reads one setting |
| 24 | The read and edge handling: final year exact, dead corners, the bridge read (F1), block trim | the reader, its reference proportional | the reader, its reference drawn pot by pot in the menu's better order | TESTED |
| 26 | Which rivals, and each one's rule and parameters (the guardrails' thresholds, Vanguard's bands, ARVA's rate) | none | none | N/A - the solver against itself |
| 27 | How a fixed arm's withdrawal order is picked (the app's picker on the search paths) | none | none | N/A - no fixed arm |
| 28 | Every file of a comparison made by the same code, or the change between them is the thing tested | this code | this code | SAME - both arms on this code; READER/TS+J/W0.02 is also held to 7af's and 7ag's CAND (ran line, table, and survival, tiers and spend levels path by path on the first 8,000 paths), read for identity only |
| 29 | The statistic and its definition (survival is the floor rate or fully funded; years below target; total cut; failure includes falling below the minimum pot; the table's reading or the simulated outcome) | items 1 and 3 survival; 2 and 4 the whole score (reduce-7aa.mjs wholeLeg); 5 the table's year-0 read against the simulated survival | the same | SAME - declared because the test reads several statistics |
| 31 | Paired or not, and the standard error used | paired on the same paths; survival exact McNemar with Holm across six and the guarded unconditional interval; the whole score's interval wholeLeg's at 0.05 | the same | SAME - declared |
| 33 | For timings: what else the machine was running | the solve seconds are printed, not read | the same | N/A - no timing is read |
| 24 (items 7 and 8) | The read and the tables | SHIP: no bridge read, the product's per-world tables (OFF/PRODUCT/W0.02) | ORDER/TS+J/W0.02 | TESTED - the whole bundle with the fix against the product as it ships |
| 28 (items 7 and 8) | The same code | SHIP from 7af's and 7ag's code (stamp code 4d91a3e1d649) | this code | ACCEPTED - the two commits touching src/solver since (3c2c84c P's switchCharge, 07eb52e readerRef 'order') add options used only when set, and SHIP sets neither (grade B, the diff; NOT CHECKED by a re-run); SHIP's ran line is held to ORDER's but for the arm's own fields, and its trace to its log by stamp, count and survival |
| 6 (item 6) | The opening | ORDER's own year-0 move | READER's opening tiers forced, the best move holding them, ORDER's chooser after | TESTED - the matched run changes the opening and nothing else |
- **All other rows: SAME**

## Decision rule (registered before launch)

- **Single look, every item; intervals at 95%.**
- **Item 1:** at 0.02, ORDER against READER on each of the six: the exact rule with Holm across six (stats.mjs outcome) at the household's margin (bridge 4, bridge 6, S366, bridge 4+cost 0.25; S360, S370 0.5), passing when it reads no material harm AND the guarded unconditional interval's lower end is above minus the margin. HELD if all six pass; FALSIFIED if any reads harm; else INCONCLUSIVE.
- **Item 2:** at 0.02, the whole score (wholeLeg at 0.05) on each, at the household's margin (item 1's: 0.25; S360 and S370 0.5): HELD if every lower end is above minus the margin; FALSIFIED if any upper end is below it; else INCONCLUSIVE.
- **Items 3 and 4:** items 1 and 2 at 0.01.
- **Item 5:** at 0.02 on S360, the ratio of ORDER's |table - simulated| to READER's: HELD at 0.5 or less; FALSIFIED at 0.9 or more; else INCONCLUSIVE.
- **Item 6 (reported, its attribution registered):** at each weight, on every household where READER's and ORDER's year-0 tier codes differ, ORDER with READER's opening (the matched run) against READER, by survival (the exact rule, Holm across the split legs of the weight, and the guarded interval) and the whole score, at the household's margin. A harm at items 1 to 4 on that household is the opening's (family 1) where the matched run reads no material harm on both; the reference's later choices' where it reads harm on either; else unsplit. With no flip, it is the later choices'. READER opening at a pair other than 0/0 or 2/2: unsplit.
- **Items 7 and 8:** at 0.02, ORDER against SHIP (7af's or 7ag's own unit and trace, cut to the first 8,000 paths): survival as item 1 and the whole score as item 2, at the same margins (SHIP's recorded survival puts every household on the same side of 95% as READER's). HELD, FALSIFIED and INCONCLUSIVE as there.
- **Reported, not items:** every unit's table, simulation, table error, year-0 gap and opening; S370's table error under both arms.
- **NOT SETTLED:** any gate fails (the stamps; a unit missing, twice or unregistered; ORDER not READER's solve with readerRef order; a 0.01 solve not its 0.02 solve with the weight changed; READER/W0.02 not 7af's or 7ag's CAND by ran line, table and trace; a matched run missing, twice, on READER, at another pair, not opening at its pair on every path, or not the pair ORDER did not take; SHIP not once and done in its record, its ran line not ORDER's but for the arm, or its trace not its log's).
- **Declared choices, not derived:** the margins (the regimen's, for survival and the whole score alike - corrected before registration from a flat 0.25 on the whole score, the plan-auditor's BLOCKING 1 of 29 Sep); item 5's half and 0.9.

## Decision fed

- **Items 1 to 4 HELD, item 5 HELD, items 7 and 8 HELD:** the order reference is safe on the six longer bridges, against the bundle and against the product as it ships, and cures O36's pessimism where it showed (grade B, one seed, six households); it becomes a candidate to join the bundle, by the maintainer's decision, before 7u; no default changes here.
- **A harm in 1 to 4, item 6 charging it to the opening:** the fix unmasks family 1's knife edge on that household; the fix is not carried forward on its own - P's reading of the opening (family 1) decides, and the fix is re-read once the opening is settled.
- **A harm in 1 to 4, item 6 charging it to the later choices:** the reference drawn in order harms by itself; back to O36's design (the reference leans optimistic where the proportional one leaned pessimistic).
- **A harm in 1 to 4, unsplit:** not carried forward until a decomposition splits it (RULES.md section 9).
- **Items 7 or 8 FALSIFIED:** the bundle with the fix is not safe against the shipping default; the fix stays out whatever items 1 to 4 read.
- **Item 5 FALSIFIED:** the proportional draw is not what makes S360's table pessimistic - O36's cause is wrong there (it was located on share 0.95's two-year bridge); back to diagnosis.
- **Items 1 to 4 INCONCLUSIVE:** a sized follow-up (the pre-mortem's churn case) before any decision.
- **In every branch:** no default change; no 7u; no seed 7013; Q by O55 and the maintainer.

## Provenance

- The design: O36 (PLAN.md register; its cause 29 Sep, results-o36-order.txt; "where it can move a choice", the plan-auditor's FAIL and PASS of 29 Sep); the maintainer's question "can it be built and tested whilst P is running?" (29 Sep).
- The build: reader.js orderChance and solve.js readerRef 'order' (07eb52e); research/tests/reader-order.test.mjs and reader-order-solve.test.mjs; audit-s126.mjs diag7ah (0cc87ca and after); reduce-7ah.mjs; derive-7ah.mjs; batch-7ah.sh.
- The records: results-7af.txt, results-7ag.txt, results-o36-order.txt; 7af's and 7ag's runs (read only through their gates).

## Derivation script

- `derive: research/solver/derive-7ah.mjs > research/solver/results-derive-7ah.txt sha256 e8ec7f42591886bb`
  (7af's and 7ag's records read by pattern; the power of item 1 - item 3 alike - under three stories, read by reduce-7ah.mjs's own items(); item 7's power from the bundle's recorded counts against SHIP, read by its own splitItems()).

## Point and interval

80% intervals, the author's:
- Items 1 and 3: on bridge 4, bridge 6, S366 and bridge 4+cost, fewer than 10 paths changed each way; on S360 and S370 up to a few hundred, the net within the margin.
- Items 2 and 4: every household's whole score within its margin of READER's (0.25; S360 and S370 0.5); S360 above it (a gain) if its choices move.
- Item 5: S360's table error from 13.27 to 3 (0 to 8).
- Item 6: no flip on four households; a flip on at most one of bridge 4, bridge 6 and S366 (their gaps within twice the margin).
- Items 7 and 8: ORDER against SHIP as the bundle against SHIP - gains on S360, S370 and bridge 4+cost (hundreds of paths), fewer than 10 paths each way on the rest.

## Credence

The author's probability that each item reads as predicted: 1 (HELD), 0.60; 2 (HELD), 0.60; 3 (HELD), 0.55; 4 (HELD), 0.55; 5 (HELD), 0.50; 7 (HELD), 0.75; 8 (HELD), 0.70. Items 1 to 4: on four of the six the table already matches its simulation within about a point, so the fix should move few paths (the SMALL story: HELD 1.000); S360 and S370 may churn, which reads INCONCLUSIVE, not HELD (the CHURN story: HELD 0.026). Item 5: O36's cause was located on a two-year bridge; on S360's eight-year bridge the pessimism may carry other causes (the reader's reference at the plan's tiers where the table holds other tiers; the grid on thin accessible money), so the fix may cure only part of it.

## Power

- **Items 1 and 3** (results-derive-7ah.txt): SMALL (the tier state's discordance on each household) HELD 1.000; CHURN (S360 and S370 moving as many paths both ways as the reader alone did) HELD 0.026, INCONCLUSIVE 0.956; HARM (S360 losing 40 paths net, its margin) HELD 0.064, INCONCLUSIVE 0.536, FALSIFIED 0.400 - an effect exactly at the margin is caught four times in ten. Each household's paths failing in both arms are READER's recorded failures (S360 4,325, S370 2,025; the rest 33 to 66), which the unconditional interval reads (corrected before registration from a flat 100, the plan-auditor's MINOR 4).
- **Items 2 and 4:** no record of this contrast; 7af's and 7ag's whole-score interval half-widths on these households, for arms far more different (CAND against SHIP), at 8,000 paths (results-derive-7ah.txt section 3; 7ag's 16,000 scaled by 1.41): bridge 4 and bridge 6 0.12, S366 0.10, bridge 4+cost 0.55, S360 0.93, S370 0.81. Against the margins, a small change should read HELD on bridge 4, bridge 6 and S366; bridge 4+cost (0.55 against 0.25), S360 (0.93 against 0.5) and S370 (0.81 against 0.5) may read INCONCLUSIVE even with no change, if this contrast's interval is as wide as that one's - its arms are far closer, so it should be narrower, by how much NOT CHECKED.
- **Item 7** (results-derive-7ah.txt section 4): drawn about the bundle's recorded counts against SHIP (bridge 4 6.0/2.0, bridge 6 8.0/0.0, S360 931.0/0.0, S366 5.0/0.5, S370 556.5/188.5, bridge 4+cost 322.5/1.0 per 8,000), HELD 1.000 - if the fix changes little, item 7 reads HELD. **Item 8:** not simulated; 7af and 7ag read the bundle's whole score against SHIP as no material harm on all six.
- **Item 6** is an attribution, not a test with power: its legs are as wide as items 1 and 2's.
- **Item 5** reads one number against another (the table and the simulation on 8,000 paths, its se about 0.56 points on S360): a halving from 13.27 is well outside the noise.
- **Time:** 24 units at 30 points and 8,000 paths; a TS+J solve 723 to 1,019 s on these six households (7af's and 7ag's CAND) and a run of 8,000 paths in this mode 311 to 694 s (results/diag7af, most 530 to 600); the matched runs add one or two runs of 8,000 paths on each of the 12 ORDER units (about 1.5 to 2.5 core-hours); the order reference adds little (the build check's ORDER bridge 4, 103 s at 4 points, against READER's 96 s in 7af's preflight): about 1,400 s a unit, about 34,000 core-seconds, 9 to 10 core-hours (corrected before registration, the plan-auditor's MINOR 3), and with the matched runs 11 to 12.5 core-hours, about 3 hours on four cores. The longest unit, an ORDER unit with two matched runs, about 2,800 s. Each process is stopped at 5 hours.

## Budget line

O36's fix, asked for by the maintainer ("can it be built and tested whilst P is running?", 29 Sep): it decides whether the reference drawn in order is safe on the longer bridges and cures the table where O36 showed, before the bundle goes to 7u; 11 to 12.5 core-hours, about 3 hours on four cores, after P.

## Pre-mortem

- **Most likely:** items 1 to 4 HELD on four households and INCONCLUSIVE on S360 or S370, where a more faithful reference moves many paths both ways (the CHURN story) - items 1 to 4 INCONCLUSIVE, a sized follow-up on the two.
- **Second:** item 5 INCONCLUSIVE - the fix cures part of S360's pessimism; the rest has another cause on an eight-year bridge.
- **Third:** S370's already optimistic table rises further and S370 loses paths - an unmasking read beside its table error.
- **Fourth:** READER/W0.02 is not 7af's or 7ag's CAND to the bit (a code change since touched the bundle): NOT SETTLED, found before anything is read.
- **The smoke run:** smoke.sh (locked) does not run diag7ah; the build check through the launcher (one unit at 4 points) and the preflight (every unit at 4 points and 20 paths, parsed and gated by reduce-7ah.mjs's own functions) cover it.

## Changes after seeing results

None.
