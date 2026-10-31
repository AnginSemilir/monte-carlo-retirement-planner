# Prediction: diag-7s

- **Run:** `research/solver/batch-7s.sh` - results/diag7s/part0.txt (S126) and part1.txt (bridge 4), audit-s126.mjs's bridge7e mode; reduced by `reduce-7s.mjs` into results-7s.txt
- **Kind:** test
- **Written:** 26 Sept, 14:46 UK, before the run (the maintainer, 26 Sep 14:38 UK: "go ahead with 7s, include a 15 return point arm"); revised 14:57 UK, before the run (the seventy-third review's MINORs 1-3: the scorecard's item lines and credence, harm needs the point loss at the margin, the time)
- **Seeds:** 7002 tuning (3,000 paths, 7r's paths, the same paths for all four arms of both cases)
- **Plan section:** PLAN.md "7s"

## Question

7r found the tier the solver holds when it reads the bridge accurately carries the reader's harm on S126 and bridge 4
(results-7r.txt), and by the solver's own whole objective, realised over those paths, that tier scores below off
(-0.347 +/- 0.134 and -0.380 +/- 0.119 points, results-7r-failures.txt, grade C): since off's moves were open to it,
its tables most likely overrate the tier. The explanation put to the maintainer (26 Sep, grade D): the tables sample
each year's return at 5 points, which under-counts the bad run of returns late in the plan that sinks the riskier tier.
Does sampling at 15 points stop the reader choosing the riskier tier, and so stop its harm?

## Derivation

What the code and the records say before any run:
- **Where the tables and the simulation differ.** Both use the same return map (solve.js realAt). The tables sample
  each year's return at the quadrature points (5 by default; `quadNodes` 15 uses gaussHermite(15), solve.js l.325),
  hold each path's persistent shift at three worlds (solveMixture, MIX3: -sqrt 3, 0, +sqrt 3, weights 1/6, 2/3, 1/6),
  and interpolate wealth on a 16-point grid; the simulated paths (E.pathsForSeed) draw both continuously. So a table's
  misjudgement of the tier can come from the 5 return points (tested here), the three worlds or the grid (not tested).
- **What 7r's logs already show** (results/diag7r part0 and part1): the reader's table reads its own survival nearly
  right (S126 table 99.6, simulated 99.3; bridge 4 99.1 and 99.0), while off's table misreads the bridge badly (55.8
  against 99.8; 7.8 against 99.4) and so holds the pension below its tier 40.0 and 41.9 years of 40 and 42, where the
  reader holds it 8.7 and 14.9. Off's safer tier is a side effect of its misread. The question is whether the reader's
  tables, at 15 points, value the lower tier as off's misread does by accident.
- **Two records count against the explanation.** 7e ran the reader at 5 and 15 points on S360 (results/bridge7e,
  the S360 line: READER table 33.0, sim 47.0, tier-below 19.8; READER@15 table 33.0, sim 47.3, tier-below 20.0; 4 saved,
  1 lost of 1,000): 15 points barely moved the reader there. 7i ran off at 5 and 15 (results-bridgequad.txt): S126 0 of
  1,000 paths discordant, bridge 4 1 saved, 0 lost. Both are other settings or another household (checklist 3: leads
  for the credence, not evidence here): S360 has an 8-year bridge and survives 47%; 7i averaged the final year.
- **What reproduces.** The 5-point arms are 7r's arms on 7r's paths through the same measureV2 (finalIntegral and
  riskAbove set explicitly in both modes; the trace 7r kept does not touch the result), so they must reproduce 7r's
  tables, simulated survival and the reader's 15 and 12 lost paths exactly. If they do not, something other than the
  return points moved and nothing is settled.
- **Why seed 7002.** A diagnosis on tuning paths, as 7r was; the reproduction check needs 7r's paths. The held-out seed
  is reserved to 7e's tests and the replication seed is kept for a replication.

## Prediction

Each case solved four ways - off and the reader at 5 points, off and the reader at 15 - and run forward on the same
3,000 paths of seed 7002, every arm paired with every other:
1. **7r reproduces:** the 5-point arms give 7r's tables and simulated survival to 0.1 and the reader's 15 (S126) and 12
   (bridge 4) lost paths, none saved, against off.
2. **The outcome (the primary, by the decision rule below):** FALSIFIED - 15 points does not cure the reader's harm on
   either case.
3. **Off barely moves:** off at 15 against off at 5 shows no material change on either case (the exact 95% interval
   inside +/-0.25 points).
4. **The reader's tier barely moves:** the reader at 15 holds the pension below its tier no more than 3 years more than
   at 5, on both cases.
5. **The reader's table stays accurate:** at 15 points its table reads within 1 point of its simulation, on both.

Reported, not items: every arm's table, simulation, gap, tier-below and below-target years and solve seconds; the
reader against off at 5 and at 15; every pair's exact interval.

## Falsified if

15 points cures the harm on both cases: the reader at 15 saves paths against the reader at 5 (a gain, Holm over the two)
and shows no material harm against off at 15. That is the rule's HELD: the 5-point sampling is then the cause of the
tables overrating the tier, and item 2 as written (FALSIFIED) misses.

## Fair-test table

Arm A and arm B as the batch script sets them. SAME, TESTED (the one thing that differs), ONE ARM ONLY (a setting
only one arm has - say why that is fair), N/A (does not apply here - say why) or ACCEPTED (differs, and why that
does not bias the comparison).

| # | Variable | Arm A | Arm B | Status (SAME / TESTED / ONE ARM ONLY / N/A) and why |
|---|---|---|---|---|
| 1 | The households, and how they were chosen (by a rule that never looks at the solver; tuning set, never the held-out panel) | S126 and bridge 4 (audit-s126.mjs variant(), as 7c, 7e and 7r built them): chosen on purpose, the two cases where the reader's harm showed in 7e and 7r. A diagnosis of those cases: nothing here generalises beyond them | the same cases | SAME |
| 2 | Changes the test makes to a household's inputs | 7c's variants of S126 (bridge length 2 and 4; pension share 0.85) | the same | SAME |
| 3 | The target spend and the spending floor, and whether each arm honours the floor | the plan target; floor 0.8; guardrails off | the same | SAME |
| 4 | The survival asked for, when a run lands | no ask: lambda held at S126's landed 0.0223606797749979 | the same | SAME |
| 5 | The held-out paths: seed and count, and the SAME paths for every arm (paired) | 3,000 paths of seed 7002 (7r's; the gate checks the seed and the count in every ran line) | the same paths, paired | SAME |
| 6 | The search paths (landings, and the rival arms' choice of order), and that nothing chosen on them is reported from them | none | none | N/A - no landing and no rival: lambda is held and the solver runs against itself |
| 7 | The market world: single-table fold (`MIX=0`), three-world mixture (`MIX=3`), five-world (`MIX=5`) - for the table AND for how every arm is simulated | the three-world mixture (solvePlan), each path's own draws in the forward run | the same | SAME |
| 8 | How each year's return is averaged (quadrature points) | 5 (off, reader) | 15 (off@15, reader@15) | TESTED - the return points, 5 against 15, with the bridge read held (g: the reader at 15 against the reader at 5; item 3: off at 15 against off at 5) |
| 9 | The engine's return, volatility and charge assumptions, and the engine build | one process per case, one engine build | the same process | SAME |
| 10 | The minimum pot | one year of target (solvePlan's default) | the same | SAME |
| 11 | The raise cap | 1.1 | 1.1 | SAME |
| 12 | The estate preference | today's estate term (no weight set) | the same | SAME |
| 13 | The risk tier chosen, consent to change it, risk above | joint tier steps, consent given; one tier above allowed, set explicitly (riskAbove true) in every arm | the same | SAME |
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
| 24 | The read and edge handling: final year exact, dead corners, the bridge read (F1), block trim | bridgeRead off (off, off@15); the final year exact (finalIntegral true, set explicitly); no block trim | bridgeRead 'reader' (reader, reader@15); the rest the same | TESTED - the bridge read, off against the reader, with the return points held (h: the reader at 15 against off at 15; item 1: the reader against off at 5, 7r's) |
| 25 | How it lands: bisection steps, level search | no landing; the full level scan | the same | SAME |
| 26 | Which rivals, and each one's rule and parameters (the guardrails' thresholds, Vanguard's bands, ARVA's rate) | none | none | N/A - the solver against itself, no rival arm |
| 27 | How a fixed arm's withdrawal order is picked (the app's picker on the search paths) | none | none | N/A - no fixed arm in this run |
| 28 | Every file of a comparison made by the same code, or the change between them is the thing tested | one process per case writes all four arms and every pair | the same process | SAME |
| 29 | The statistic and its definition (survival is the floor rate or fully funded; years below target; total cut; failure includes falling below the minimum pot; the table's reading or the simulated outcome) | survival: the floor paid every year and the minimum pot at the end, simulated; tier-below: runPolicy's tierPenYears a path | the same | SAME |
| 30 | The reducer and its version | reduce-7s.mjs: requireFairLogs over the logs' stamps, then its own gate on every ran line (each case's arms the same but the bridge read and the return points, at the registered settings, each arm's own bridge read and points) and every pair; INCOMPLETE unless both cases' logs are there; the reproduction check; 22 planted checks, 21 planted faults each caught (mutate-reduce-7s.py, results-reduce-7s-mutations.txt) | the same | SAME |
| 31 | Paired or not, and the standard error used | paired on the same paths; exact one-sided McNemar with Holm over the two cases (g for a gain, h for harm), the exact 95% interval against the 0.25 margin (no material gain, no material harm, item 3); no standard error is read | the same | SAME |
| 32 | The table's number is never the result: survival is simulated | survival is simulated; the table's read is printed and read only by item 5 | the same | SAME |
| 33 | For timings: what else the machine was running | the solve seconds are printed, not read | the same | N/A - no timing is read: two processes share four cores |

## Decision rule (registered before launch)

- **Primary** (reduce-7s.mjs decide()), per case, paired on the same 3,000 paths:
  - **g**, the reader at 15 against the reader at 5: it **gains** when it saves more than it loses and the exact
    one-sided p for a gain, Holm over the two cases, is below 0.05; **no material gain** when the exact 95% interval
    for its survival change has its upper end below +0.25 points.
  - **h**, the reader at 15 against off at 15: it **harms** when it loses more than it saves, the exact one-sided p
    for harm, Holm over the two cases, is below 0.05 and the point loss is at least the margin (the regimen's harm);
    **no material harm** when the interval's lower end is above -0.25.
  - A case **cures** when g gains and h shows no material harm; **does not cure** when g does not gain, shows no
    material gain, and h harms; otherwise it is **partial** (a significant gain below the margin with the harm still
    there is partial).
  - **HELD:** both cases cure. **FALSIFIED:** both cases do not cure. **INCONCLUSIVE:** otherwise.
  - **NOT SETTLED:** item 1 fails (the 5-point arms do not reproduce 7r): something besides the return points differs.
- **Items:** reduce-7s.mjs prints them under "THE PREDICTION'S ITEMS:", each -> held or -> MISSED (scorecard.mjs reads
  that block): item 1 the reproduction check, item 2 held when the outcome is FALSIFIED, items 3-5 by items().
- **Declared choices, not derived:** the margin 0.25 (the regimen's, where off survives 95% or more: both do); Holm over
  the two cases; 3 years of tier-below and 1 point of gap for items 4 and 5 (judgement, no record fixes them).

## Decision fed

- **Held:** the 5-point sampling makes the tables overrate the riskier tier on these cases. What goes to the
  maintainer: 15 points (or a cheaper fix aimed at the late tail) as a candidate default, which needs its own test on a
  broad panel before it could be one (a 15-point solve takes about 2.5 times as long, results-bridgequad.txt); the bridge
  reader re-tested at 15 points before F2 or 7q; 7r's question (whether survival alone judges) set aside, since the
  harm has a cause the solver can fix.
- **Falsified:** the 5-point sampling is not the cause. The candidates left are the three worlds for each path's
  persistent shift and the 16-point wealth grid (the Derivation); the next diagnosis tests them (a five-world arm, a
  30-point arm) before F2, 7q or Phase 4, and 7r's question stays with the maintainer.
- **Inconclusive:** a partial or one-sided effect. The per-case counts and intervals go to the maintainer, with the
  options then open (more paths on the same seed, the replication seed, or the next candidates as in falsified).

## Provenance

- The cases, variant() and the bridge7e mode: audit-s126.mjs; the arms' @15 syntax (7e's S360 arm).
- 7r's figures (item 1): results/diag7r/part0.txt and part1.txt, the case lines; results-7r.txt.
- The whole-score deficit: results-7r-failures.txt (read-7r-failures.mjs), grade C.
- 7e's S360 at 5 and 15: results/bridge7e (the S360 READER and READER@15 line). 7i: results-bridgequad.txt.
- The quadrature: solve.js l.322-325 (gaussHermite), solveMixture MIX3.
- lambda 0.0223606797749979: S126's landed lambda, 7e's and 7r's; the gate checks it.
- The margin 0.25: stats.mjs MARGINS, the regimen's (the maintainer, 25 Sep 20:47 UK).

## Derivation script

- `derive: research/solver/derive-7s.mjs > research/solver/results-derive-7s.txt sha256 5dabcf56b1bbb74d`
  (7r's harm at 5 points held fixed, g and h drawn as Poisson counts under each true story, read by reduce-7s.mjs's own
  decide()).

## Point and interval

80% intervals, the author's:
- g, the reader at 15 against the reader at 5: S126 +0.05 points (-0.1 to +0.4); bridge 4 +0.05 (-0.1 to +0.35).
- h, the reader at 15 against off at 15: S126 -0.4 (-0.6 to -0.05); bridge 4 -0.35 (-0.55 to 0.0).
- Off at 15 against off at 5: 0.0 (-0.05 to +0.05) on each.
- The reader's tier-below at 15 minus at 5: S126 +0.5 years (-1 to +5); bridge 4 +0.5 (-1 to +5).

## Credence

The author's probability that each item holds: 1, 0.95; 2, 0.45 (the outcome FALSIFIED); 3, 0.85; 4, 0.60; 5, 0.80. The outcome:
HELD 0.25, FALSIFIED 0.45, INCONCLUSIVE 0.30. Lowered from the explanation put to the maintainer: S360's reader barely
moved at 15 points (the Derivation). The scorecard stands at 0.228 over 16 items, above the 0.20 target (O25), mostly
from confident misses; these are kept below 0.9 except item 1, which is arithmetic. Scored by scorecard.mjs.

## Power

From results-derive-7s.txt (7r's harm at 5 points fixed; 20,000 draws a story):
- **15 points cures it all:** HELD 0.959 (INCONCLUSIVE 0.041). **Changes nothing:** FALSIFIED 0.852 (INCONCLUSIVE 0.148:
  the remaining harm must reach the margin, 8 paths of 3,000, to read as harm).
- **Cures half:** INCONCLUSIVE 0.860 (HELD 0.128, FALSIFIED 0.012). **Three quarters:** HELD 0.746. **A quarter:**
  INCONCLUSIVE 0.598, FALSIFIED 0.401.
- **What it cannot see:** a gain or a remaining harm of up to 7 paths of 3,000 with none the other way reads as not
  material (the exact interval against 0.25 points); a gain needs 6 saved with none lost on both cases (5 on one, the
  other far stronger); a harm needs 8 lost with none saved (the point loss at the margin).
- **Time:** per case, two 5-point arms (7r: 556 to 622 s at 3,000 paths) and two 15-point arms (7i: 755 to 799 s
  solves at 1,000 paths; the forward runs cost more at 15 points too, since each move is scored over the return points,
  solve.js scoreMoves): about 52 to 68 minutes, both cases side by side
  on two of four cores, plus the smoke run if the code moved.

## Budget line

The bridge class's decision error: the reader, reading the bridge accurately, cost S126 0.47 and bridge 4 0.31 points
of survival in 7e, 0.50 and 0.40 in 7r. 7s removes no error itself; it says whether the 5-point sampling carries it.

## Pre-mortem

- **Most likely:** 15 points changes little (as on S360) and the outcome is FALSIFIED; the next candidates are named.
- **Second:** a partial effect - the reader at 15 de-risks on some paths - which reads INCONCLUSIVE at 3,000 paths.
- **Third:** 15 points also changes off (its misread narrowed from -43.2 to -31.3 on S126 in 7i), so h compares two
  moved arms; item 3 and the per-arm tier-below show it.
- **Least likely:** item 1 fails - the same code, mode and paths as 7r - which would mean something outside the tested
  settings moved; the run is then NOT SETTLED.

## Changes after seeing results

None.
