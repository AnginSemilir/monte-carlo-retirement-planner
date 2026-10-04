# Prediction: diag-7au

- **Run:** `research/solver/batch-7au.sh` - results/diag7au/case0-3.txt and traces (audit-7au.mjs, one process a job: node:L on S194, all:L on bridge 4, S194 and S126), read by `reduce-7au.mjs` in the real tree beside P's records (results/diagP, through P's gate) into results-7au.txt
- **Kind:** test
- **Written:** 4 Oct, before the run (its time is its registering commit's, git log). The design is the deep review after 7as's (deep-review-log.md, 4 Oct 01:54 UK: the decisive test for family 2a). It has the maintainer's go-ahead of 4 Oct: recommendation 4, 7au before 7u ("Go ahead with your recommendations"; the ledger's 08:17 row), and "carry on, i'll take your recommendations".
- **Seeds:** 7002 tuning (P's paths: 16,000 at S194's node, 16,000 across all worlds, the first 2,000 of each for the identity runs; the same paths as P's traces). The product's 'auto' risk-above rule reads its own seed 7101 inside solvePlan. No held-out seed is touched.
- **Unmasking:** the learner removes a known error, the world-blind chooser's fixed weights (O50, family 2a; 7as item 3 HELD). The baseline behaviour that error drives is re-risking at the bad node (OPEN2 against WA). Item 2 (all worlds) tells a harmful change from one that unmasks another error: a loss across all worlds with the learner on is read with the oracle beside it (TS+J+O). If the oracle loses too, the tables' own world-0 optimism is exposed (O48, ranked 2 by the review), not the learner's harm, until decomposed. On bridge 4 and S126 (the reader's units) any harm is read as the combination's - the learner changes moves, so it can push the reader's bridge reads into or out of stencils that straddle the bill's edge (O76, the deep review after 7av, 4 Oct 11:37 UK; amended before launch).
- **Plan section:** PLAN.md "7au" (the schedule), "O50" and "O31" (the register)

## Question

At S194's bad node, P's de-risked opening (OPEN2) re-risks where the world-aware chooser (WA) does not. That slice is the world-blind chooser's (7as item 3 HELD).

1. Can a chooser a household could follow recover the slice in time? The candidate learns the world from its own returns: the posterior over the three worlds given one risky pot's yearly returns, learn.mjs.
2. Does that chooser do no material harm across all worlds?

All at P's settings: switchCharge 0.001, switchMargin 0, TS+J, 30x5.

## Derivation

All figures are from results-derive-7au.txt (derive-7au.mjs over P's records and 7as's seconds), except where another file is named.

- **The slice at P's charge** (P's traces, 16,000 node paths):
  - WA less OPEN2 is +1.781 whole-score points a path (sd 16.065, se 0.1270).
  - Survival: WA 93.80 against OPEN2 91.70 (372 saved, 36 lost).
  - 15,678 of 16,000 paths differ in their whole score.
- **The learner's pace at the node.** learn.mjs reads one risky pot a year, with S/V about 0.125 to 0.13 (its header). On a path in world 0 (z = -1.7321):
  - The expected log-odds gain of world 0 over world 1 is 0.0234 to 0.0254 a year.
  - Along the expected-evidence path, its weight on world 0 rises from the prior 1/6 to 0.219 to 0.224 by year 10 and 0.301 to 0.312 by year 25. WA's weight is 1 from year 0.
  - The deep review found OPEN2's excess re-risking in years 6 to 25 (deep-review-log.md, 4 Oct 01:54 UK). Over those years the learner still weighs world 0 at about a quarter, so it can recover only a small part of the slice.
- **Against that:**
  - 7t's learner took 0.37 of the oracle's all-world gain on S194 (+0.395 against +1.055; the deep review's ratio, results-7t-vs-product.txt, old settings, grade C).
  - A modest shift in weight can flip a near-tie move.
- **What would explain a large share:** the slice comes from a few decisions near indifference, so even a small weight shift recovers much of it.

## Prediction

- **Item 1 FALSIFIED:** the learner recovers under a third of the slice (share about 0.2), so the slice is not learnable in time with one pot's information.
- **Item 2 HELD:** across all worlds the learner does no material harm on any of the three units.

## Falsified if

- **Item 1 HELD:** the learner is shown to recover more than two thirds: the test of mean(dL - 2dW/3) above 0, under 0.05 after Holm.
- **Item 1 INCONCLUSIVE:** neither direction is shown.
- **Item 2 FALSIFIED:** any unit shows harm: survival by the exact rule with Holm, or the whole score wholly below -0.25.

## Fair-test table

Arm A is P's own runs at P's settings (OPEN2, WA and TS+J; P's traces). Arm B is this run's learner (OPEN2+L, TS+J+L), with the oracle reported.

| # | Variable | Arm A | Arm B | Status (SAME / TESTED / ONE ARM ONLY / N/A) and why |
|---|---|---|---|---|
| 6 | The search paths (landings, and the rival arms' choice of order), and that nothing chosen on them is reported from them | none | none | N/A - lambda held, no landing |
| 18 | The spending menu and the tier menu | the chooser's moves weighted by the fixed prior (OPEN2, TS+J) or by world 0 alone (WA) | the same moves weighted by the learner's posterior (or the oracle's weights, reported) | TESTED - the world weights the forward chooser uses are the one thing that differs; the tables, menu, charge and margin are P's |
| 26 | Which rivals, and each one's rule and parameters (the guardrails' thresholds, Vanguard's bands, ARVA's rate) | none | none | N/A - no rival |
| 27 | How a fixed arm's withdrawal order is picked (the app's picker on the search paths) | none | none | N/A - no fixed arm |
| 28 | Every file of a comparison made by the same code, or the change between them is the thing tested | P's traces (audit-s126.mjs diagP, P's code) | audit-7au.mjs (today's code, the same code id as 7as) | ACCEPTED - the reducer holds every job's solve lines to P's, and today's OPEN2, WA and TS+J on the first 2,000 paths to P's traces byte for byte (survival, level, tier); a difference refuses the run |
| 29 | The statistic and its definition (survival is the floor rate or fully funded; years below target; total cut; failure includes falling below the minimum pot; the table's reading or the simulated outcome) | the whole score (reduce-7aa.mjs wholePaths, P's configuration) and simulated survival | the same | SAME definitions; item 1 reads the whole score path by path, item 2 survival and the whole score |
| 31 | Paired or not, and the standard error used | paired by path | paired by path | SAME - Fisher's paired randomization test (item 1); the exact conditional McNemar with Holm, the guarded unconditional interval and wholeLeg (item 2) |
| 33 | For timings: what else the machine was running | n/a | n/a | N/A - no timing is read |

- **All other rows: SAME**

## Decision rule (registered before launch)

- **The data:**
  - **Node:** 16,000 paths, OPEN2+L against P's OPEN2 and WA, paired by path.
  - **All worlds:** 16,000 paths on each unit, TS+J+L against P's TS+J, paired by path.
- **Item 1 (primary; single look; the learner's share of the slice):** for each node path, dL is the whole score under OPEN2+L less under OPEN2, and dW is the whole score under WA less under OPEN2.
  - **Premise:** a slice, meaning Fisher's paired randomization test (reduce-7ar.mjs flipP, B 20,000) of mean(dW) above 0 gives p under 0.05. Without it the item is INCONCLUSIVE (NO SLICE).
  - **HELD (learnable in time):** the test of mean(dL - 2dW/3) above 0 is under 0.05 after Holm over the two directions.
  - **FALSIFIED (not learnable in time):** the test of mean(dW/3 - dL) above 0 is under 0.05 after Holm.
  - Otherwise INCONCLUSIVE.
- **Item 2 (single look):** three legs, one per unit.
  - **SAFE** needs all three:
    - survival reads no material harm by the exact conditional McNemar (one-sided, Holm over the three, at the unit's margin: marginFor P's survival, 0.25 at 95% or more);
    - the guarded unconditional interval's lower end is above minus the margin;
    - the whole score's lower end (wholeLeg at 0.05) is above -0.25.
  - **HARM:** survival reads harm, or the whole score's upper end is below -0.25.
  - Otherwise INCONCLUSIVE.
  - HELD when all three legs are SAFE; FALSIFIED when any is HARM; else INCONCLUSIVE.
- **Reported, not items:**
  - OPEN2+O (the oracle with OPEN2's opening) against OPEN2 and WA;
  - the shares by survival;
  - TS+J+O against TS+J on each unit;
  - every all-world arm by long-run-shift bin (under -0.866, between, above 0.866);
  - the end weights and updates.
- **NOT SETTLED**, if any gate fails:
  - the stamps of 7au, or P's gate;
  - a job missing, twice, not done or unregistered;
  - a solve line not P's;
  - a node, ident, all, ident-all, weights or log line missing or off its count;
  - a trace missing or off its log;
  - today's OPEN2, WA or TS+J not P's on the first 2,000 paths;
  - the learner's and oracle's shifts not the same paths.
- **Declared choices, not derived:**
  - the thirds (7as's and 7ar's);
  - MW 0.25 (P's);
  - 16,000 paths (P's);
  - 2,000 identity paths;
  - the learner's one-pot information (learn.mjs, the design premise: grade D for what a household can learn).

## Decision fed

- **Item 1 HELD:** the slice is learnable in time. The learner becomes the fix candidate for family 2a: its own test against the bundle, with the charge re-swept under it (the deep review: a learner removes the error the charge partly masks). It enters no candidate before that test (O31's gate).
- **Item 1 FALSIFIED:** the slice cannot be learned in time from one pot's returns. Friction becomes a legitimate robust choice for the maintainer, and the 'no larger charge' branch is revisited with the maintainer before 7u. O50's slice is recorded as the price of world-blindness, which no followable learner recovers at this information.
- **Item 1 INCONCLUSIVE:** the share lies between a third and two thirds, or is unresolved. It goes to the maintainer with the oracle's share beside it. No learner and no charge change before 7u.
- **Item 2 HELD:** the learner is safe across all worlds at P's settings (grade B: one seed, three units).
- **Item 2 FALSIFIED:** the harm is read with the oracle (unmasking above). No learner candidate until decomposed.
- **Item 2 INCONCLUSIVE:** safety is unshown; a learner candidate waits for a second look.
- **In every branch:** no product change, no 7u, no seed 7013.

## Provenance

- **The design:** the deep review after 7as (4 Oct 01:54 UK), its decisive test; O50, O31; 7as's read (results-7as.txt, item 3 HELD); P's records (results-P.txt); learn.mjs (7t's learner and oracle).
- **The build:**
  - audit-7au.mjs: 7as's core job copied, with the learner's and the oracle's weights in the forward chooser and the per-path shift saved in each trace;
  - reduce-7au.mjs: P's records through P's gate; the solve and run identities; 50 planted cases; OUTCOMES REACHED on both items; an EDGES line; 33 of 33 mutations caught (results-reduce-7au-mutations.txt);
  - derive-7au.mjs, preflight-7au.sh, preflight-parse-7au.mjs, batch-7au.sh.

## Derivation script

- `derive: research/solver/derive-7au.mjs > research/solver/results-derive-7au.txt sha256 b96a80b074bf08b4`
  (the slice; item 1's and item 2's power, the latter also from the nearest learner records, 7t's; the time; the learner's pace at the node)

## Point and interval

80% intervals, the author's:
- **Item 1:**
  - the learner's share of the slice: 0.2 (-0.05 to 0.45);
  - the oracle's share (OPEN2+O, reported): 0.9 (0.6 to 1.1).
- **Item 2:** the largest whole-score loss of the three legs: 0.05 (0 to 0.15).

## Credence

- **Item 1:** FALSIFIED 0.55, INCONCLUSIVE 0.35, HELD 0.10.
- **Item 2:** HELD 0.85, INCONCLUSIVE 0.12, FALSIFIED 0.03.

## Power

From results-derive-7au.txt sections 2 and 3:
- **Item 1** (400 bootstrap replicates; a learner modelled as taking WA's outcome on a random share s of paths; the normal approximation; declared):
  - the premise holds in every replicate;
  - FALSIFIED is read with probability 1.000 at s = 0 and 0.985 at s = 0.2;
  - HELD is read with probability 0.7775 at s = 0.75, 0.9975 at s = 0.8 and 1.000 at s = 1;
  - at exactly a third or two thirds, the wrong side is read 0.035 and 0.030 of the time.
- **Item 2:** two bases, both in results-derive-7au.txt.
  - **The nearest records of a learner** (section 3b, the basis RULES.md section 8 rule 6 asks for; the plan-auditor's MINOR 4 of 4 Oct 09:02 UK): 7t's learner arms on these units (bridge 4 READER+L 9 saved/6 lost, S194 OFF+L 38/2, S126 READER+L 0/10 of 8,000; results-7t-vs-product.txt, older settings), scaled to 16,000 paths at the same rates and split at the observed proportion. Each leg reads no material harm by the exact rule with probability 1.000. S126's 20 lost of 16,000 also keeps the guarded interval's lower end above -0.25 (reduce-7au.mjs's plant: 24 lost and none saved reads SAFE).
  - **A true change of 0** with the churn of P's TS+J at 0.001 against the margin (2/3, 6/8 and 0/0 discordant of 16,000; section 3): 1.000 on each leg.
  - The whole score's half-widths from that pair are 0.045, 0.070 and 0.031, against MW 0.25.

## Budget line

From results-derive-7au.txt section 4 (7as's seconds, the same code):
- a solve 1439 s;
- node:L 1.56 h;
- each all:L 1.67 h;
- 6.6 core-hours in all, the longest job 1.67 h on four cores.

The learner's overhead is NOT CHECKED. It runs after DPC (the cores).

## Pre-mortem

- **First:** today's runs are not P's on the identity paths. The code id is the same as 7as's, but P ran on older code, and 7as held only P's solve lines, not its forward runs. Then the gate refuses, and 7au re-runs OPEN2, WA and TS+J in full (about +2.5 core-hours).
- **Second:** the learner's posterior barely moves (derivation section 5). Item 1 then reads FALSIFIED by construction of the information set, not by the learnability of the world. Declared: the result is about one pot's information. A richer learner (several pots, or the real returns of a household's whole portfolio) is a different design, grade D until built.
- **Third:** the oracle with OPEN2's opening falls short of WA (reported). WA's advantage is then partly its own opening (year 0 under world 0's table), and the slice item 1 divides is larger than any OPEN2-opened chooser can recover. Item 1's share is then a lower bound on what learning gives.
- **Fourth:** the all-world legs use TS+J+L from year 0, and the node leg uses OPEN2+L. The opening differs between items, by design (the review's arms).

## Changes after seeing results

None.
