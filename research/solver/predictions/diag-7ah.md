# Prediction: diag-7ah

- **Run:** `research/solver/batch-7ah.sh` - results/diag7ah/case0-23.txt and every unit's trace (audit-s126.mjs diag7ah), read beside 7af's (results/diag7af) and 7ag's (results/diag7ag) records; reduced by `reduce-7ah.mjs` in the real tree into results-7ah.txt
- **Kind:** test
- **Written:** 29 Sept, before the run (its time is its registering commit's, git log); after O36's cause was located (results-o36-order.txt), bounded by the plan-auditor to bridges of three years or more (O36 "where it can move a choice", grade B, confirmed in the solver by research/tests/reader-order-solve.test.mjs: 6 passed), and the fix built behind an option (07eb52e; research/tests/reader-order.test.mjs, 12 passed)
- **Seeds:** 7002 tuning (every unit's 8,000 paths, the first 8,000 of 7ag's 16,000 and all of 7af's 8,000; the solves' opening path). The product's 'auto' risk-above rule reads its own seed 7101 inside solvePlan. No held-out seed is touched. **Disclosed (RULES.md Known limits item 18):** one build check ran this test's mode under "none" before this prediction was final: runs.log 29 Sep, "7ah build check" (the first unit, ORDER bridge 4 at W0.02, at 4 wealth points and 20 paths; its lines read only to see they print and parse); 4 wealth points are not a registered grid, and no figure of it is read.
- **Unmasking:** the order reference removes a known error, the reader's proportional draw (O36: it pays the bridge from the accessible pots in proportion, where the solver draws in an order its menu chooses; on share 0.95 18.1% of bridges unpaid by the reference against 4.6% ISA-first and 6.5% in the engine's own run, results-o36-order.txt). What the error drives in the baseline: on bridges of three years or more year 1's reference holds two or more bills, so the chooser reads a table built on a too-pessimistic reference; S360's year-0 table reads 32.67 against 45.94 simulated (results-7af.txt), the only one of the six more than 5 points off. What removing it may unmask: an optimistic table where the reference was pessimistic but something else was optimistic - S370's table already reads 4.80 above its simulation (results-7ag.txt), and a more generous reference may push it further (reported); and choices that move many paths both ways on S360 and S370, where the reader alone moved hundreds (the pre-mortem). What tells a harm from an unmasking: item 5 reads the table error the fix targets; a harm in items 1 to 4 with item 5 HELD is read beside S370's reported table error and each household's opening before it is charged to the fix (RULES.md section 9 rules 1 and 2).
- **Plan section:** PLAN.md "7ah"

## Question

On the six panel households whose bridge is three years or more, does drawing the reader's reference pot by pot in the menu's better order (O36's fix) do no material harm - by survival and by the whole score, at the default estate weight 0.02 and at 0.01 (the whole-score rule) - and does it cure the table's pessimism where O36 showed it, on S360?

## Derivation

- **O36's cause** (results-o36-order.txt, grade C, share 0.95 at the plan's tiers): the reference's closed form matches its own model (18.11% and 18.12% unpaid), but its premise - a proportional draw - does not match the solver's draws (cash first 25.68%, ISA first 4.62%, the engine 6.46%).
- **Where it can move a choice** (PLAN.md O36; solve.js scoreMoves reads year t+1, chanceOf's bills t..access, reader.js's one-bill step; confirmed in the solver on S126 and S360 by research/tests/reader-order-solve.test.mjs): only where year 1's reference holds two bills or more - bridges of three years or more. The six such households on the panel: bridge 4 (4 years), bridge 6 (6), S360 (8) from 7af; S366 (8), S370 (8), bridge 4+cost (4) from 7ag.
- **The tables against their simulations** (results-7af.txt, results-7ag.txt, READER/TS+J/W0.02): bridge 4 +0.04, bridge 6 -0.08, S360 -13.27, S366 -0.32, S370 +4.80, bridge 4+cost -1.23 points. O36's pessimism shows on S360 alone.
- **The order reference** (reader.js orderChance): one bill - referenceChance's step exactly; more - seeded simulation, pot by pot, the better of the menu's two orders, tabulated over 160 levels of accessible money and interpolated (a step smeared across one cell, under 2% of the later bills; research/tests/reader-order.test.mjs).
- **Prior tests of the same mechanism** (RULES.md section 9 rule 7): none - no run holds a reference drawn in order; 7x's readerRef 'held' (the held tier, not the order) is the nearest, and it overshot (O36).
- **Claude's choices, before any run:** the six households (every panel household with a bridge of three years or more, by the rule above - chosen from the bridge length alone, never from a result); 8,000 paths (7af's count; prefix-consistent with 7ag's 16,000); the regimen's margins (0.25 where READER survives 95% or more, 0.5 below: S360 45.94, S370 74.69); item 5's thresholds (half; 0.9).

## Prediction

The fix is safe on all six and cures S360's pessimism: survival no material harm at 0.02 and 0.01 (items 1 and 3 HELD); the whole score no material harm at both (items 2 and 4 HELD); S360's table error at most half of READER's 13.27 points (item 5 HELD).

## Falsified if

Item 1 or 3: harm on any household (the exact rule with Holm across six at its margin). Item 2 or 4: any household's whole-score upper end below -0.25. Item 5: ORDER's S360 table error 0.9 of READER's or more.

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
- **All other rows: SAME**

## Decision rule (registered before launch)

- **Single look, every item; intervals at 95%.**
- **Item 1:** at 0.02, ORDER against READER on each of the six: the exact rule with Holm across six (stats.mjs outcome) at the household's margin (bridge 4, bridge 6, S366, bridge 4+cost 0.25; S360, S370 0.5), passing when it reads no material harm AND the guarded unconditional interval's lower end is above minus the margin. HELD if all six pass; FALSIFIED if any reads harm; else INCONCLUSIVE.
- **Item 2:** at 0.02, the whole score (wholeLeg at 0.05) on each: HELD if every lower end is above -0.25; FALSIFIED if any upper end is below -0.25; else INCONCLUSIVE.
- **Items 3 and 4:** items 1 and 2 at 0.01.
- **Item 5:** at 0.02 on S360, the ratio of ORDER's |table - simulated| to READER's: HELD at 0.5 or less; FALSIFIED at 0.9 or more; else INCONCLUSIVE.
- **Reported, not items:** every unit's table, simulation, table error, year-0 gap and opening; S370's table error under both arms.
- **NOT SETTLED:** any gate fails (the stamps; a unit missing, twice or unregistered; ORDER not READER's solve with readerRef order; a 0.01 solve not its 0.02 solve with the weight changed; READER/W0.02 not 7af's or 7ag's CAND by ran line, table and trace).
- **Declared choices, not derived:** the margins (the regimen's); the whole-score margin 0.25 (the regimen's); item 5's half and 0.9.

## Decision fed

- **Items 1 to 4 HELD, item 5 HELD:** the order reference is safe on the six longer bridges and cures O36's pessimism where it showed (grade B, one seed, six households); it becomes a candidate to join the bundle, by the maintainer's decision, before 7u; no default changes here.
- **Item 5 HELD, a harm in 1 to 4:** the fix cures the table and harms a household - read beside that household's table error and opening (an unmasking, RULES.md section 9) before it is charged to the fix; not carried forward until a decomposition splits it.
- **Item 5 FALSIFIED:** the proportional draw is not what makes S360's table pessimistic - O36's cause is wrong there (it was located on share 0.95's two-year bridge); back to diagnosis.
- **Items 1 to 4 INCONCLUSIVE:** a sized follow-up (the pre-mortem's churn case) before any decision.
- **In every branch:** no default change; no 7u; no seed 7013; Q by O55 and the maintainer.

## Provenance

- The design: O36 (PLAN.md register; its cause 29 Sep, results-o36-order.txt; "where it can move a choice", the plan-auditor's FAIL and PASS of 29 Sep); the maintainer's question "can it be built and tested whilst P is running?" (29 Sep).
- The build: reader.js orderChance and solve.js readerRef 'order' (07eb52e); research/tests/reader-order.test.mjs and reader-order-solve.test.mjs; audit-s126.mjs diag7ah (0cc87ca and after); reduce-7ah.mjs; derive-7ah.mjs; batch-7ah.sh.
- The records: results-7af.txt, results-7ag.txt, results-o36-order.txt; 7af's and 7ag's runs (read only through their gates).

## Derivation script

- `derive: research/solver/derive-7ah.mjs > research/solver/results-derive-7ah.txt sha256 825b99ac4ed6f503`
  (7af's and 7ag's records read by pattern; the power of item 1 - item 3 alike - under three stories, read by reduce-7ah.mjs's own items()).

## Point and interval

80% intervals, the author's:
- Items 1 and 3: on bridge 4, bridge 6, S366 and bridge 4+cost, fewer than 10 paths changed each way; on S360 and S370 up to a few hundred, the net within the margin.
- Items 2 and 4: every household's whole score within 0.25 of READER's; S360 above it (a gain) if its choices move.
- Item 5: S360's table error from 13.27 to 3 (0 to 8).

## Credence

The author's probability that each item reads as predicted: 1 (HELD), 0.60; 2 (HELD), 0.60; 3 (HELD), 0.55; 4 (HELD), 0.55; 5 (HELD), 0.50. Items 1 to 4: on four of the six the table already matches its simulation within about a point, so the fix should move few paths (the SMALL story: HELD 1.000); S360 and S370 may churn, which reads INCONCLUSIVE, not HELD (the CHURN story: HELD 0.026). Item 5: O36's cause was located on a two-year bridge; on S360's eight-year bridge the pessimism may carry other causes (the reader's reference at the plan's tiers where the table holds other tiers; the grid on thin accessible money), so the fix may cure only part of it.

## Power

- **Items 1 and 3** (results-derive-7ah.txt): SMALL (the tier state's discordance on each household) HELD 1.000; CHURN (S360 and S370 moving as many paths both ways as the reader alone did) HELD 0.026, INCONCLUSIVE 0.956; HARM (S360 losing 40 paths net, its margin) FALSIFIED 0.400, INCONCLUSIVE 0.555 - an effect exactly at the margin is caught four times in ten.
- **Items 2 and 4:** no record of this contrast; 7af's and 7ag's whole-score intervals on these households for arms far more different were about ±0.12 (bridge 4, bridge 6), ±0.07 (S366), ±0.4 (bridge 4+cost, S370) and ±0.93 (S360); a small change should read HELD on the four, S360 and S370 wider.
- **Item 5** reads one number against another (the table and the simulation on 8,000 paths, its se about 0.56 points on S360): a halving from 13.27 is well outside the noise.
- **Time:** 24 units at 30 points and 8,000 paths; a TS+J solve about 850 to 930 s under four-way load (P's measured solves) and a run of 8,000 paths about 300 s: about 1,200 s a unit, about 29,000 core-seconds, 8 core-hours, about 2 hours on four cores. Each process is stopped at 5 hours.

## Budget line

O36's fix, asked for by the maintainer ("can it be built and tested whilst P is running?", 29 Sep): it decides whether the reference drawn in order is safe on the longer bridges and cures the table where O36 showed, before the bundle goes to 7u; about 8 core-hours, about 2 hours on four cores, after P.

## Pre-mortem

- **Most likely:** items 1 to 4 HELD on four households and INCONCLUSIVE on S360 or S370, where a more faithful reference moves many paths both ways (the CHURN story) - items 1 to 4 INCONCLUSIVE, a sized follow-up on the two.
- **Second:** item 5 INCONCLUSIVE - the fix cures part of S360's pessimism; the rest has another cause on an eight-year bridge.
- **Third:** S370's already optimistic table rises further and S370 loses paths - an unmasking read beside its table error.
- **Fourth:** READER/W0.02 is not 7af's or 7ag's CAND to the bit (a code change since touched the bundle): NOT SETTLED, found before anything is read.
- **The smoke run:** smoke.sh (locked) does not run diag7ah; the build check through the launcher (one unit at 4 points) and the preflight (every unit at 4 points and 20 paths, parsed and gated by reduce-7ah.mjs's own functions) cover it.

## Changes after seeing results

None.
