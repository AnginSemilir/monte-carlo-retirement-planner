# Prediction: diag-7r

- **Run:** `research/solver/batch-7r.sh` - results/diag7r/part0-4.txt and the ten arms' traces; reduced by `reduce-7r.mjs` into results-7r.txt
- **Kind:** test
- **Written:** 26 Sept, 11:45 UK (begun 11:31 UK), before the run (revised 11:59 UK, before the run: the traces carry the log's stamp and the reducer checks it; smoke.sh gained diag7r's line under the maintainer's unlock)
- **Seeds:** 7002 tuning (3,000 paths, the same paths for both arms of every case); 7e's held-out seed is not used (it is reserved to 7e's tests)
- **Plan section:** PLAN.md "7r"

## Question

7e found the bridge reader harms S126 (14 lost, 0 saved of 3,000; -0.47 points) and bridge 4 (26 lost, 1 saved of
8,000; -0.31) on held-out seed 7011 (results-7e.txt). Before F2 is built (the maintainer, 26 Sep 11:16 UK: "diagnose
first"), where does that harm come from? The hypothesis (PLAN.md's 10:55 row, grade D, NOT CHECKED): an accurate read
lifts the household off the low pension tier the misread left it on, and the riskier tier it then holds after the bridge
costs survival. Its rival: the harm comes from what the reader itself decides in the bridge years, where alone it acts.
The answer sends 7r one of three ways, each to the maintainer: the reader's own method (F2 is built), the tier trade
buying estate (whether survival alone judges households at 99.5% and over), or the trade buying nothing (the solver's
risk weighing is examined first).

## Derivation

What the code and the records say before any run:
- **The reader acts only in the bridge.** solve.js l.501-505 marks reader years only where `t < B.accessAt` (retired
  years before private pension access), and l.781 reads the reader's tables only in those years. The tables from access
  on are solved the same way in both arms. So after the bridge the two arms can differ only through the state each carries
  out of it: the tiers held (a move changes them, and chooseAction takes the held tiers, so the switch cost and margin make
  a held tier sticky: solve.js runPolicy) and the money. A lost path that fails after the bridge while holding a riskier
  pension tier than off points at the tier carried out of the bridge. A lost path that fails in the bridge, or with no
  riskier tier, points at the reader's own bridge-year moves.
- **The bridge does not bind on S126.** Its variant (audit-s126.mjs variant(), from the library's S126) is 56 with access
  at 58, a 2-year bridge; its accessible money is 142,500 (ISA 76,000, taxable 19,000, cash 47,500), about 4.9 years of
  its 29,000 target. bridge 4 is the same household at 54: 4 years against the same 142,500. S366 is 50 (8 years).
- **What 7e's tier column counts.** reduce-7e.mjs's "tier-below" is runPolicy's tierPenYears, the years with the
  pension's tier index above 0. With the tier above allowed, index 3 is the tier above (fast.js tiersFor), so the column
  counts years off the plan's tier either way. Every panel case's own pension is at the top tier, High Risk (the library,
  M21), which has no tier above, so in 7e it is years below: 40.0 under off and 7.9 under the reader on S126, 42.0 and
  14.1 on bridge 4 (results-7e.txt). The trace codes seen in 7r's build check (S366, 40 paths) are 0, 5 and 10: pension
  and ISA held together at the plan's tier, one below or two below.
- **The contrasts.** S120 and wealth x2 were lifted as far (40.0 to 0.1 and 0.5 years) and lost nothing, but both arms
  survive 100.0% there, so they show a lift with nothing at risk, not a lift that was risky and survived. S366 under v1
  (O23) was lifted (45.8 to 24.2) while still misreading (gap -95.4) and lost 7, saving none, of 1,000 (p 0.0078
  unadjusted, one of 48 comparisons read-o17.mjs reports; a lead, not a result: the sixty-fifth review). F1's own test
  had v1 at +0.30 on S366, but under other settings (step 2's, the single-table fold, before the exact final year) on
  seed 7002, so the two do not compare (checklist 3).
- **Why seed 7002.** 7011 is 7e's held-out seed, reserved to its tests; 7r diagnoses, so it runs on tuning paths, and
  item 1 checks the harm is there on them to diagnose.

## Prediction

Each case solved off and with the second arm (the reader; v1 on S366), 7e's settings otherwise, run forward on the same
3,000 paths of seed 7002 with the per-year trace kept:
1. **The harm is there on these paths:** the reader loses more paths than it saves on S126 and on bridge 4, each with the
   exact one-sided p for harm below 0.05 after Holm over the two.
2. **The contrasts risk nothing:** on S120 and wealth x2 the reader loses and saves no path.
3. **O23 replicates:** on S366, v1 loses more paths than it saves, the exact one-sided p below 0.05. If it does not, O23
   is read as one of 48 unadjusted comparisons that did not replicate, closed as noise-sized, and dropped from the
   hypothesis's evidence; if it does, it replicates on a second seed at the same settings and counts for the lift, not
   the accuracy, carrying the harm.
4. **The tier lift carries the harm:** at least two-thirds of S126's and bridge 4's lost paths together (at least 6) are
   tier-lift paths: each fails at or after the bridge's end (S126 year 2, bridge 4 year 4) having held a riskier pension
   tier than off in at least half its years before failing.
5. **The lift buys estate:** on S126 and on bridge 4, over the paths both arms survive, the paired end-wealth difference
   (the reader's minus off's; the trace's last-year wealth, a stand-in for estate, which it does not carry) has its median
   at least 5% of off's median end wealth, with the exact 97.5% interval above 0.

Reported, not items: each arm's end wealth (median and unlucky tenth), years below target, the pension's and the ISA's
years below and above the plan's tier, lifetime tax, lifetime spending paired, how many paths both survive with the
pension lifted in at least half their years, and for the lost paths their failure years and the first year and kind
(tier or spending level) of the arms' first different move.

## Falsified if

Fewer than half of S126's and bridge 4's lost paths together (at least 6) are tier-lift paths: the harm lands in the
bridge, or with no riskier pension tier held, where only the reader's own moves differ. The tier-lift hypothesis is
then wrong for this harm, and it goes to the reader's method: F2 is built, after the early 8h read is put to the
maintainer (the 08:17 row's revisit trigger).

## Fair-test table

Arm A and arm B as the batch script sets them. SAME, TESTED (the one thing that differs), ONE ARM ONLY (a setting
only one arm has - say why that is fair), N/A (does not apply here - say why) or ACCEPTED (differs, and why that
does not bias the comparison).

| # | Variable | Arm A | Arm B | Status (SAME / TESTED / ONE ARM ONLY / N/A) and why |
|---|---|---|---|---|
| 1 | The households, and how they were chosen (by a rule that never looks at the solver; tuning set, never the held-out panel) | S126 and its bridge-4 and wealth-x2 variants (audit-s126.mjs variant(), as 7c and 7e built them), S120 and S366 from the library: chosen from 7e's result on purpose, the two cases the reader harmed, the two it lifted as far with nothing lost, and O23's case. A diagnosis of those cases: nothing here generalises beyond them. Tuning seed 7002, not 7e's held-out paths | the same cases | SAME |
| 2 | Changes the test makes to a household's inputs | 7c's variants of S126 (bridge length 2 and 4, wealth x2; pension share 0.85) | the same | SAME |
| 3 | The target spend and the spending floor, and whether each arm honours the floor | the plan target; floor 0.8; guardrails off | the same | SAME |
| 4 | The survival asked for, when a run lands | no ask: lambda held at S126's landed 0.0223606797749979 | the same | SAME |
| 5 | The held-out paths: seed and count, and the SAME paths for every arm (paired) | 3,000 paths of seed 7002 (tuning: 7r diagnoses, and 7011 is reserved to 7e's tests; the gate checks the seed and the count, 3000, in every ran line and every trace) | the same paths, paired | SAME |
| 6 | The search paths (landings, and the rival arms' choice of order), and that nothing chosen on them is reported from them | none | none | N/A - no landing and no rival: lambda is held and the solver runs against itself |
| 7 | The market world: single-table fold (`MIX=0`), three-world mixture (`MIX=3`), five-world (`MIX=5`) - for the table AND for how every arm is simulated | the three-world mixture (solvePlan), each path's own world in the forward run | the same | SAME |
| 8 | How each year's return is averaged (quadrature points) | 5 | 5 | SAME |
| 9 | The engine's return, volatility and charge assumptions, and the engine build | one process per case, one engine build | the same process | SAME |
| 10 | The minimum pot | one year of target (solvePlan's default), or the plan's own | the same | SAME |
| 11 | The raise cap | 1.1 | 1.1 | SAME |
| 12 | The estate preference | today's estate term (no weight set) | the same | SAME |
| 13 | The risk tier chosen, consent to change it, risk above | joint tier steps, consent given; one tier above allowed, set explicitly (riskAbove true), so tier eligibility is identical in both arms | the same | SAME |
| 14 | The one-off cost lookahead | lookaheadYears 0 | 0 | SAME |
| 15 | The tax-free lump sum rule | the full lump sum | the same | SAME |
| 16 | The taxable account's tier | off (the product refuses it) | off | SAME |
| 17 | The grid: points, shares, gain buckets | 16 points, the default shares and gain buckets | the same | SAME |
| 18 | The spending menu and the tier menu | the product menu for a 0.8 floor, capped at 1.1 | the same | SAME |
| 19 | The switch margin and switching cost | the defaults | the same | SAME |
| 20 | The dislike of cuts: lambda (held or landed) and the trim curve's exponent (together, c) | lambda held 0.0223606797749979; exponent 2 | the same | SAME |
| 21 | The raise credit, and whether it is weighted by survival | raise weight 0.003, weighted by survival | the same | SAME |
| 22 | The price of a year with no money | the floor's price (the M17 fix) | the same | SAME |
| 23 | Resilience and drift | resilience 0; no drift | the same | SAME |
| 24 | The read and edge handling: final year exact, dead corners, the bridge read (F1), block trim | bridgeRead off; the final year exact (finalIntegral true, set explicitly); no block trim | bridgeRead 'reader' (S126, bridge 4, S120, wealth x2) or F1 v1 (S366: bridgeRead true); the rest the same | TESTED - the bridge read, off against the reader (v1 on S366) |
| 25 | How it lands: bisection steps, level search | no landing; the full level scan | the same | SAME |
| 26 | Which rivals, and each one's rule and parameters (the guardrails' thresholds, Vanguard's bands, ARVA's rate) | none | none | N/A - the solver against itself, no rival arm |
| 27 | How a fixed arm's withdrawal order is picked (the app's picker on the search paths) | none | none | N/A - no fixed arm in this run |
| 28 | Every file of a comparison made by the same code, or the change between them is the thing tested | one process per case writes both arms' log lines and traces | the same process | SAME |
| 29 | The statistic and its definition (survival is the floor rate or fully funded; years below target; total cut; failure includes falling below the minimum pot; the table's reading or the simulated outcome) | survival: the floor paid every year and the minimum pot at the end, simulated; end wealth: the trace's last-year wealth, 0 on a failed path; the per-year trace (runPolicy's own, record.mjs makeTrace) | the same | SAME |
| 30 | The reducer and its version | reduce-7r.mjs: requireFairLogs over the logs' stamps, then its own gate on every ran line (each case's arms the same but the bridge read, at the registered settings) and every trace's count, seed and arm, and each trace's stamp against the logs' (audit-s126.mjs stamps each trace as it stamps its log); INCOMPLETE unless all ten traces are there; 29 planted checks, 16 planted faults each caught (mutate-reduce-7r.py, results-reduce-7r-mutations.txt) | the same | SAME |
| 31 | Paired or not, and the standard error used | paired on the same paths; exact one-sided McNemar with Holm (items 1, 3); the paired end-wealth median's exact order-statistic interval (item 5); no standard error is read | the same | SAME |
| 32 | The table's number is never the result: survival is simulated | survival and end wealth are simulated; the table's read is printed in the log only | the same | SAME |
| 33 | For timings: what else the machine was running | the solve seconds are printed, not read | the same | N/A - no timing is read: five processes share four cores, so the seconds are not comparable |

## Decision rule (registered before launch)

- **Primary:** the tier-lift share over S126's and bridge 4's lost paths together (the reader against off on the same
  3,000 paths of seed 7002), read by reduce-7r.mjs decide().
- **Survival per case:** exact one-sided McNemar for harm (stats.mjs), Holm over S126 and bridge 4 at 0.05 (item 1);
  S366's v1 at 0.05 alone (item 3); S120 and wealth x2 by their counts (item 2). No margin: 7r asks whether there is a
  harm to diagnose on these paths, not its size, which 7e read.
- **The outcome (three):**
  - HELD: at least 6 lost paths together, the harm read on at least one of the two, and two-thirds or more of them
    tier-lift paths.
  - FALSIFIED: at least 6 lost paths together, the harm read on at least one, and under half tier-lift paths.
  - INCONCLUSIVE: between half and two-thirds; or fewer than 6 lost paths; or the harm read on neither case.
- **The trade (item 5; it sets which question HELD takes to the maintainer):** per case, over the paths both arms
  survive, the paired end-wealth difference's median with its exact 97.5% order-statistic interval (Bonferroni over the
  two cases; stats.mjs binomUpperHalf). The margin: 5% of off's median end wealth. It buys estate when the interval lies
  above 0 and the median is at least the margin; it buys nothing when the interval's upper end is below the margin;
  otherwise it is inconclusive.
- **Declared choices, not derived:** two-thirds and half (a majority rule with a band between, so a near-even split is
  not read either way); 6 lost paths (below that one path moves the share by a sixth or more); a tier-lift path's "at
  least half its years" (the lift held for most of the path, not a passing year); the 5% margin (a twentieth of the
  estate, material to a household; no record fixes it); 97.5% (two cases).
- **Reported, not tested:** years below target, the tiers' years, lifetime tax, lifetime spending paired, the first
  different move's year and kind, the failure years.

## Decision fed

- **Held:** the harm is the tier the accurate read lets the solver hold after the bridge, not the reader's bridge-year
  method. F2 is not built as the cure for it (F2 also reads accurately, so it would likely lift the same way; grade C, an
  inference from this result). What goes to the maintainer depends on item 5: the lift buys estate on both cases -> whether
  survival alone judges households at 99.5% and over, or the trade the household's own weights chose is accepted; it buys
  nothing on either -> the solver's risk weighing (the switch margin, the tier menu's pricing) is examined before any
  bridge fix; inconclusive -> the intervals go to the maintainer as they are.
- **Falsified:** the harm comes from the reader's own moves in the bridge. F2 is built and tested as 7e was (the
  maintainer, 25 Sep 07:29 UK), after the 08:17 row's revisit trigger (the early 8h read) is put to the maintainer.
- **Inconclusive:** nothing is read about the mechanism. The counts go to the maintainer with the options then open (a
  second tuning seed, 7004 as replication, or F2 on the design's own merits).
- **Item 3, either way:** it resolves O23 as the Prediction says; it does not change the outcome.

## Provenance

- The panel, the bridge lengths and the balances: audit-s126.mjs (variant() and diag7r's PANEL) and the library
  (research/policy-study/scenarios.mjs), printed in the Derivation.
- The reader's scope: solve.js l.501-505 and l.781. The tier coding: solve.js runPolicy (tierPen x 4 + tierIsa) and fast.js
  tiersFor (index 3 the tier above). The trace: record.mjs makeTrace.
- 7e's figures: results-7e.txt. O23's: results-o17-7e.txt. F1's S366 figure: results-f1.txt l.26.
- lambda 0.0223606797749979: S126's landed lambda, 7e's; the gate checks it.
- The arm time: results-look2time.txt (S126 off at 3,000 paths, 458 s beside one other process) and 7e's look 2 (3,000-path
  arms 426 to 576 s, results/bridge7e/look2.txt, as the sixty-fifth review read it).
- The exact tail at 3,000 tosses: stats.mjs binomUpperHalf, fixed 26 Sep (it read 1 above about 1,075 tosses); checked in
  stats.test.mjs against Python's exact integers.

## Derivation script

- none: a diagnosis of 7e's settled result; its expected counts are 7e's rates scaled to 3,000 paths (arithmetic in Power),
  and the chances in Power are Poisson and binomial sums printed by a one-line Python check, not a registered derivation.

## Point and interval

80% intervals, the author's:
- S126, the reader against off on seed 7002: -0.45 points (-0.8 to -0.15). bridge 4: -0.3 (-0.6 to 0.0).
- S120 and wealth x2: 0 (0 to 0).
- S366, v1 against off: -0.1 (-0.5 to +0.3).
- The tier-lift share of the lost paths together: 0.8 (0.55 to 0.95).
- The paired end-wealth median over the paths both survive, as a share of off's median: S126 +15% (+3% to +40%), bridge 4
  +12% (0 to +35%).

## Credence

The author's probability that each item holds: 1, 0.60 (S126 0.80, bridge 4 0.75: 7e's harm was on other paths); 2,
0.90; 3, 0.30 (one of 48 unadjusted comparisons); 4, 0.60; 5, 0.65. The outcome: HELD 0.55, FALSIFIED 0.15,
INCONCLUSIVE 0.30. Scored by scorecard.mjs.

## Power

- **Item 1:** at 7e's rates, 3,000 paths expect about 14 lost and 0 saved on S126 and about 9.75 lost and 0.4 saved on
  bridge 4. Holm over the two needs 6 or more lost with none saved on a case. The chance of 6 or more lost is 0.994 on
  S126 and 0.923 on bridge 4 (Poisson), if 7e's rates hold on these paths.
- **Item 4:** with about 24 lost paths together and a true tier-lift share of 0.8, the chance of reading two-thirds or
  more is 0.964 (0.87 with S126's 14 alone). With a true share of 0.3 it reads FALSIFIED with chance 0.969 and HELD
  0.0002.
- **Item 3:** 7 lost of 1,000 on seed 7011 would be about 21 of 3,000 if real; 5 lost with none saved is the least that
  reads p below 0.05.
- **Item 5:** about 2,985 pairs; the 97.5% interval spans about 61 order statistics either side of the median (2.24
  standard deviations of the sign count). Its width in money is NOT KNOWN before the run: no record gives the spread of
  the paired differences. It reads inconclusive only if the median lands within that width of 0 or of the margin.
- **Time:** ten arms of 3,000 paths at 16 points, 426 to 576 s each measured (Provenance). Five processes on four cores,
  two arms each: about 18 to 24 minutes, plus the smoke run (about 3 minutes, the code changed). About 30 minutes in all.

## Budget line

The bridge class's decision error: 7e's reader, reading the bridge accurately, cost S126 0.47 and bridge 4 0.31 points
of survival. 7r removes no error itself. It says which line that cost belongs to: the bridge read's method (F2's line),
or the solver's decision error when it reads right (the risk weighing, or the objective, which the maintainer owns).

## Pre-mortem

- **Most likely:** bridge 4's harm does not show on these paths (item 1 misses on it), and the read rests mostly on
  S126's lost paths. It stays readable while there are 6 or more of them together.
- **Second:** the lost paths fail after the bridge, but the arms hold the same pension tier after it, so few are tier-lift
  paths, and the loss comes from money the reader spent or moved in the bridge. The falsifier then fires, correctly: that
  is the reader's method.
- **Third:** item 5 is inconclusive on one case, so HELD takes the intervals to the maintainer rather than one question.
- **Least likely:** the gate fails. The settings are 7e's, the build check ran the mode through the launcher, and the
  smoke run re-runs the other modes on this code.

## Changes after seeing results

None.
