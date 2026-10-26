# The GIA's own tier ladder (M15 v3, EXPLORATORY), 26 Oct

The maintainer, 26 Oct: "run the test here", then "you may need to update the plan based on the latest candidate". This is
M15 v2 (archived PLAN.md, 24 Sep, designed and never built) brought up to the latest candidate (the agent's 5b7684a:
`candidate.json` with HR, the third joint step and the table without the dealing cost). Written, committed and pushed
before any run.

## What has been tested, and why this is still open

- **M15 v1 (Sep):** the GIA took the joint step with the pension and ISA. S330 lost 3.2 points, but the archived diagnosis
  shows the loss was the solver losing its best move (the pension and ISA down, the GIA held), so it says nothing about
  the value of a GIA tier.
- **A GIA held at one tier for the whole plan** (25 Oct, MISSING-MOVES.md section 4; S330 only): Medium/Low -0.13 (se
  0.20), Low -2.17 (se 0.29). One-sided: a fixed tier does not pay; a GIA that moves stays untested.
- **Today the GIA never changes tier.** The candidate's tier state carries the pension and ISA's joint step only, and
  `solvePlan` refuses `giaTiers` with the tier state on.

## The design, on the latest candidate

1. **A nested ladder.** Rungs 0 to 3 are the candidate's joint steps (the pension and ISA together; 2 where a household
   cannot take the third). The GIA adds two rungs after the bottom one: the GIA one step, then two steps, below its own
   tier, the pension and ISA held at their bottom. The menu is a strict superset of today's. On the panel's tiers
   (pension High, ISA Medium/High, GIA Medium), the bottom joint rung holds the pension at Medium/Low and the ISA at
   Low, so the GIA at Medium is the riskiest sleeve left. The GIA never goes above its tier or into Cash Equivalents.
2. **Only where it can matter:** the rungs are added only when the GIA holds at least 10% of the opening pots
   (pension, ISA, GIA and cash). Elsewhere the menu is today's, bit for bit.
3. **The tier state carries the rung.** Its layers become the six rungs (four today); the switch charge (0.001) scores a
   rung change as it scores a joint step today.
4. **Capital gains tax at decision time.** The table solves a GIA switch untaxed (as it solves the dealing cost). The
   chooser and the forward run charge it: the dealing cost and the tax on the slice sold, against what is left of the
   year's exemption and band (fast.js `chargeSwitch`, v1's arithmetic); the slice bought starts with no gain.
5. **No hold check** (v1's `giaHoldCheck`): the ladder is explicit.
6. **Scored by the solver's forward run** (`runPolicy`), as N4 and the third step's factorial were. The engine does not
   follow a GIA tier; a build that passes needs that, and a confirmatory read on the engine.

## Its tests (before the probe)

1. **Off:** every table the same bit for bit as the latest code (S330 and S224, 6 points).
2. **The gate:** on a household under 10% (S248, 2%), the option on gives today's tables bit for bit.
3. **The superset:** with the ladder on (S330, 6 points), every cell's value at every year, at each of today's four
   layers (the mixture score of the move chosen), is at or above today's. A failure is a bug and stops the probe.
4. **Plants:** the GIA's rungs grown at the plan's own rates (the rung's rates must differ); the decision-time tax dropped
   (a switch with a gain must pay it).
5. **Cost:** the solve at 45 points on a qualifying household at most 1.7 times today's (the archived bar).

## The probe

- **Arms:** CAND (the latest candidate) and CAND with the ladder, each at 45 wealth points, estate weight 0.02, the same
  8,000 paths of the tuning seed 7002, paired.
- **Households:** S330, S206 and S390 (the GIA 45% of the opening pots, at Medium), S224 (10%, at the gate), and S330
  again with a 40% unrealised gain on its GIA.
- **Read:** survival to the plan's end and the whole score, paired; the solve's time; how often a GIA rung is held in
  spending years; the GIA switches and the tax they pay.

## Prediction

- **Off and under the gate:** bit for bit. **The superset:** holds at every cell.
- **S330:** a small gain, +0.0 to +1.0 points of survival (point guess +0.3). It holds the bottom joint rung in about 71%
  of spending years (MISSING-MOVES.md section 2), so it wants more calm, and a GIA that steps down only when it is
  behind avoids the fixed tier's return cost. A GIA rung in 10% to 40% of spending years.
- **S330 at a 40% gain:** less use of the rungs and a smaller gain, never a loss beyond noise.
- **S206, S390, S224:** within noise.
- **Cost:** 1.3 to 1.6 times today's solve.

## The decision rule

The ladder **passes** if, on at least one household, its paired gain is beyond noise (the 95% interval above 0) and at
least 0.5 points in survival or the whole score, no household loses more than 0.5 beyond noise, and the solve is within
1.7 times today's. A pass sends it to a proper build: the engine following the GIA's tier and taxing its switches, the
full panel, and gate 5. Otherwise M15 closes: the GIA keeps the plan's tier, and the result is recorded.

**Not run:** the estate weight 0.01. The maintainer's own plan is not a fixture (CLAUDE.md); its GIA also starts empty,
under the gate.

## Amendment: after the tests, before any probe result

The probe was started alongside the last superset check, before it had passed, and stopped when it failed (test 3: "A
failure is a bug and stops the probe"); no arm had finished. The test's premise was wrong, not the code. Outputs:
`gia/` beside this file.

**The superset failed.** On S330 at 6 points, 49,068 of 474,336 values at today's four layers fell below today's (the
largest 1.64e-2, layer 3, year 43), none in the final year (`gia-test-all2.txt`). With survival read linearly, 877 fell
(the largest 2.27e-5, year 44), and the same 877 with the raise credit's survival weight off as well
(`superset-linear-S330.txt`, `superset-linear-noraise-S330.txt`).

**Why the premise was wrong.** "A larger menu can only raise every value" holds when each world's table takes its own
best move. The candidate takes one move for all three worlds by their weighted score and stores each world's own value of
it (`jointWorlds`). The year before reads each world's values where that world's returns land, so a new move that wins on
the weighted score while lowering one world's value can lower the weighted score a year earlier. The log-odds read of
survival adds departures of its own. The evidence, all with a linear read and the raise weight off: with each world
choosing its own move (and the plan's own reference for the bridge reader, since the adaptive one needs joint worlds), none
of the 474,336 values falls (`superset-linear-nojw-S330.txt`); with the joint choice kept and the plan's reference, the
same 877 fall as with the adaptive one (`superset-linear-planref-S330.txt`). So the joint choice is the cause. Year by
year, in the same linear read (`diagnose-linear-S330.txt`, S330's years 0 to 60), the order is the one this predicts: one
world's own value first falls at year 58 (70 cells, the weighted value higher at every one), and the weighted values first
fall a year earlier, at 57. Over all years, a world's own value falls at 83,567 cells, 82,690 of them with the weighted
value not below. So on the candidate a larger menu can lower the table's own values. The probe's forward run measures what that
does to the household, and that is what the rule reads.

**Its replacement: an exact test, with a planted fault.** With the rungs made inert ('samerate': each rung move a copy of
the bottom joint step's, entered at the same switch charge), today's four layers come out bit for bit in all three worlds:
1,423,008 (layer, year, cell) entries, every value and every stored move (`inert-S330.txt`). The planted wrong-layer read
('readlayer0': a rung move's backward read takes next year's layer 0) parts them: 3,279,141 values and 9,534 stored moves
(`inert-plant-S330.txt`).

**Same pattern searched** (`superset`, `larger menu`, `can only raise`, `never lower` in the tests and the solver
research): two tests rest on the same premise, "more moves never lower the opening value" (`solver-tiers.test.mjs` C1)
and "more money never lowers the score" (`solver.test.mjs` B). Both run the single-world solve, where it holds; neither
runs on the candidate.

**The gate.** The maintainer asked: "what if one of deposit comes in later to add more to that pot?" The gate reads the
opening pots only, so it misses a GIA filled later: a dated deposit, a staged transfer, or a tax-free lump sum parked there.
The probe is unchanged, since its households hold their GIA from the start. A build gates on the largest share the GIA
reaches in the plan's own projection, or not at all.

**The code the probe runs:** the prototype with the plant hooks (`gia/gia-ladder.patch`), every plant empty in every arm.
Each arm records its code's hash, and the read's fair test compares them. On it, before the probe started: the off tables
are the latest candidate's bit for bit on S330 and S224 at 6 points (`hash-off-final.txt`, the same hashes as
`hash-off.txt`), and every test passes (`gia-test-all3.txt`, the superset printed as a measurement). The probe's arms are
split by arm across the two cores (CAND on one, LADDER on the other), so each pair's solve times are taken under the same
load.

## The result

Five pairs, read by the rule above (`gia/results-gia-ladder.txt`, printed by `gia-read.mjs` over `gia/probe/`; the
differences recomputed independently from the per-path results, the same to the last digit). Every arm ran on one code
(e10ec78fa581), 45 points, estate weight 0.02, the same 8,000 paths of seed 7002. Differences are LADDER less CAND, in
points, with their 95% intervals.

| Household | Survival, CAND to LADDER | Survival | Whole score | A GIA rung held | GIA switches a path | Switch costs a path (CAND) | Solve |
|---|---|---|---|---|---|---|---|
| S330 | 90.225% to 90.750% | **+0.525** (+0.303 to +0.747) | +0.356 (+0.132 to +0.579) | 74.7% of spending years | 1.63 | £18,995 (£3,044) | x1.53 |
| S330, 40% gain | 90.237% to 90.275% | +0.037 (-0.211 to +0.286) | **-0.371** (-0.623 to -0.120) | 71.1% | 3.76 | £42,756 (£3,101) | x1.67 |
| S206 | 99.787% to 99.775% | -0.013 (-0.067 to +0.042) | -0.013 (-0.069 to +0.042) | 1.6% | 0.06 | £309 (£297) | x1.45 |
| S390 | 99.750% to 99.750% | +0.000 (-0.049 to +0.049) | -0.002 (-0.052 to +0.048) | 1.8% | 0.09 | £1,701 (£1,348) | x1.44 |
| S224 (GIA 10%) | 70.362% to 70.313% | -0.050 (-0.175 to +0.075) | -0.060 (-0.186 to +0.067) | 20.7% | 0.83 | £2,917 (£2,753) | x1.68 |

**Verdict, by the rule: PASSES.** S330 gains +0.525 points of survival, beyond noise and over 0.5. No household loses more
than 0.5 beyond noise: S330 at a 40% gain loses 0.371 of the whole score beyond noise, under the 0.5 bar. Every solve is
within 1.7 times today's. The rule sends the ladder to a proper build: the engine following the GIA's tier and taxing
its switches, the full panel, and gate 5.

**The pass is narrow.** It rests on one household with no gain in its GIA. Its estimate only just clears the bar (+0.525
against 0.5), on the tuning seed. The same household with a 40% gain gets no survival from the ladder and loses
whole score.

**Against the prediction:**

| Predicted | Result |
|---|---|
| Off and under the gate: bit for bit | Held |
| The superset holds | Failed; the premise was wrong (the amendment) |
| S330: +0.0 to +1.0 points (point guess +0.3) | +0.525, inside |
| S330: a GIA rung in 10% to 40% of spending years | 74.7%: missed |
| S330 at a 40% gain: less use, a smaller gain, never a loss beyond noise | Use 71.1% (a little less) and gain +0.04 (smaller) held; the whole score lost 0.371 beyond noise, so "never a loss" **failed** |
| S206, S390, S224: within noise | Held |
| Cost: 1.3 to 1.6 times | 1.44 to 1.53 on three households; 1.67 and 1.68 on two, outside |

**Odd results, each with an owner and a gate:**

1. **At a 40% gain, the ladder switches more and pays for it.** It makes 3.76 GIA switches a path against 1.63 with no
   gain, at £42,756 a path against £18,995, and the whole score falls. The leading hypothesis is design point 4: the table
   solves a GIA switch untaxed, so its values assume every later switch is free of tax, and the chooser pays a tax the
   table never priced. *Owner:* the build. *Gate:* before the panel, the table prices the switch's tax (or a test shows
   the hypothesis wrong), and S330 is rerun at 0% and 40%. Most real GIAs carry gains, so this comes first.
2. **Lifetime tax falls in both S330 LADDER arms**, by £160,935 and £252,332 a path (19% and 29%; `taxPerPath` in the
   arms' files). Not explained here. It fits less wealth held at safer tiers, but that is not checked. *Owner:* the build.
   *Gate:* the engine's confirmatory read splits the tax.
3. **S330 holds a rung in 75% of its spending years**, far above the prediction. It sits on the bottom joint step most of
   the time (MISSING-MOVES.md section 2) and takes the GIA down with it. Noted; not a defect.
4. **Two solves took 1.67 and 1.68 times today's,** each a single run under two-core load, against the 1.7 bar. Gate 5 is
   timed on the build itself.
