# Prediction: diag-forcex

- **Run:** `research/solver/batch-forcex.sh` - results/diagforcex/case0-5.txt and the per-arm files (audit-forcex.mjs, six parts, one solve each), read by `reduce-forcex.mjs` into results-forcex.txt
- **Kind:** test
- **Written:** 6 Oct, before the run (its time is its registering commit's, git log); the design: the deep review after PAUSE (deep-review-log.md 6 Oct 01:52 UK), FORCE-X, under the maintainer's standing go-ahead of 4 Oct ("I go ahead with your recommendations ... until I say stop"). DRAFT: the judged credences below are committed before the derivation's output exists (the judged-order rule); the file moves to predictions/ with the derived lines once PAUSE-S128 has read, its Decision fed applied first.
- **Seeds:** 7005 selection: EDGE-SPLIT's and HYB's paths (6,000 a household), so every forced arm is paired path for path with its unforced partner and with PCLSI; no held-out seed is touched.
- **Unmasking:** FORCE-X removes no error from the product. It overrides the chooser in one place - a year where the arm would pause just below its own read's first price point - and lets the chooser run free after. If the pause is what costs the snapped arms survival (LOSS-PAUSE), forcing past the price point recovers the gap; if a tables channel costs it (LOSS-TABLES), the force recovers little; a force that raises survival and lowers the net (LOSS-OPT) says the pause was the score's own optimum. A forced draw can also unmask: past the price point the arm faces its read's next edge (HYB's 0.75), so S-INT+X is read for HOLD-PRICE's own prediction (it re-pauses past the kink while the edge arms draw on), and PCLSI+X, which has no edge, is the control.
- **Mechanism:** fast.js step 7b' "if (c.forceTF > 0) {" (the forced draw, tested: research/tests/solver-forcex.test.mjs, 12 of 12; mutate-fast-forcex.py 10 of 10); audit-forcex.mjs forcePoint (the force cell [p - 0.05, p) on a would-be pause, the move run on a copy first).
- **Plan section:** PLAN.md "FORCE-X", "PAUSE-S128", "O101", "O103", "O104", "O111", "O112"

## Question

On S130, does forcing the draw past each snapped arm's first price point recover its survival gap to PCLSI (LOSS-PAUSE), leave it (LOSS-TABLES), or trade survival for net (LOSS-OPT)?

## Derivation

- **The gaps and the power** (results-derive-forcex.txt sections 1 and 2; EDGE-SPLIT's and HYB's S130 files through their own gates): to be filled from the derivation, run after this draft's commit.
- **The force acts where the arms pause:** PAUSE's re-read (results-derive-pause-review.txt; O111) puts SNAP's and P-LO's pauses in [0.70, 0.75) and HYB's in [0.20, 0.25) on S130; PAUSE-S128 tests that out of sample before this registers. The acting share is printed first and the run refused under a half on any deciding arm.
- **The checks, each failed on a planted fault first:** reduce-forcex.mjs's 24 planted checks (every outcome of item 1 reached; EDGES), mutate-reduce-forcex.py 24 of 24; the leak plant (FORCEX_PLANT=leak) the identity must refuse, in the preflight.

## Prediction

- **Item 1 HELD (LOSS-PAUSE):** on S130 SNAP+X, P-LO+X and HYB+X each recover 0.7 or more of their survival gap to PCLSI.

## Falsified if

- **Item 1 FALSIFIED (LOSS-TABLES):** all three recover 0.3 or less. INCONCLUSIVE otherwise.

## Fair-test table

| # | Variable | Arm A | Arm B | Status (SAME / TESTED / ONE ARM ONLY / N/A) and why |
|---|---|---|---|---|
| 6 | The search paths (landings, and the rival arms' choice of order), and that nothing chosen on them is reported from them | none | none | N/A - lambda held, no landing |
| 12 | The paths | EDGE-SPLIT's 6,000 a household (seed 7005) | the same | SAME - held path for path to EDGE-SPLIT's and HYB's files up to each path's first force by the identity |
| 26 | Which rivals, and each one's rule and parameters (the guardrails' thresholds, Vanguard's bands, ARVA's rate) | none | none | N/A - no rival |
| 27 | How a fixed arm's withdrawal order is picked (the app's picker on the search paths) | none | none | N/A - no fixed arm |
| 31 | Paired or not, and the standard error used | paired by path | the same | SAME - sign-flip tests on per-path differences |

- **All other rows: SAME**

## Decision rule (registered before launch)

- **Item 1 (primary; single look):** per deciding arm a (SNAP, P-LO, HYB) on S130, per path D = (a+X) - a and P = PCLSI - a in survival; R = sum D / sum P. LO: mean(D - 0.3 P) above 0; HI: mean(0.7 P - D) above 0; sign-flip tests (B 20,000, fixed seeds), Holm over the six. An arm RECOVERS when LO shows and R >= 0.7, KEEPS when HI shows and R <= 0.3, else PARTIAL; NO GAP when sum P <= 0. HELD when all three RECOVER; FALSIFIED when all three KEEP; else INCONCLUSIVE.
- **Reported, not items:** S128 and S370 the same at raw p; each forced arm against its partner in survival, tax and net (OPT: survival up and net down on every forced arm but the control); the re-pause share past each price point (S-INT+X against the edge arms); PCLSI+X's acting share.
- **NOT SETTLED**, if any gate fails: the stamps; a plant line; a unit missing, repeated or not done; a ran line off EDGE-SPLIT's unit or the arm's price points; the arms of a household on different paths; a force that did not carry u to its price point; the acting share under a half on a deciding arm on S130; the identity before each path's first force against EDGE-SPLIT's or HYB's files.
- **Declared choices, not derived:** the thresholds 0.7 and 0.3 (the deep review's, deep-review-log.md 6 Oct 01:52 UK); the force cell 0.05 and the carry 0.01 past the price point (the same).

## Decision table

| outcomes | action | credence |
|---|---|---|
| item 1 HELD | LOSS-PAUSE: the pause costs the snapped arms their survival; a product fix aims at the chooser's refusal to cross the price point (O104, O112), designed and tested next | judged 0.35 |
| item 1 INCONCLUSIVE | the pause explains part; the next deep review splits the remainder on the reported reads | judged 0.40 |
| item 1 FALSIFIED | LOSS-TABLES: the survival loss is the tables', not the pause's; O111's mechanism stays a description of where the arms pause, not why they lose | judged 0.25 |

## Decision fed

- **Item 1 HELD:** O112's survival-by-timing reading supported; O104's interaction read through the pause; a chooser-side fix designed next.
- **Item 1 INCONCLUSIVE:** no fix designed on FORCE-X alone; the next deep review decides on the reported reads.
- **Item 1 FALSIFIED:** the tables channel is tested next (O101, O103); no chooser-side fix.
- **In every branch:** no product change; the force stays a research flag.

## Provenance

- **The design:** the deep review after PAUSE (deep-review-log.md 6 Oct 01:52 UK), FORCE-X; PAUSE-S128 its out-of-sample step.
- **The build:** 640d690 (fast.js step 7b', audit-forcex.mjs, reduce-forcex.mjs, derive-forcex.mjs, the tests and mutations).
- **Seen before registration (declared):** PAUSE's results and its re-read; EDGE-SPLIT's and HYB's results (the gaps); no forced run has been made.

## Credence

- **Judged, item 1:** HELD 0.35, INCONCLUSIVE 0.40, FALSIFIED 0.25 (the author's judgement, written before the derivation: the deep review puts LOSS-PAUSE at 0.50 and LOSS-TABLES at 0.25, but SNAP pauses mostly after year 12, when the State Pension fills the personal allowance, so forcing past 0.75 there moves money taxed at the basic rate and may not buy the survival PCLSI has; P-LO over HYB's +55 shows the early pause matters, which supports HYB+X recovering; all three must recover for HELD, so INCONCLUSIVE carries the most weight). Declared: before writing these the author saw a scratch run of derive-forcex.mjs (not committed): the S130 gaps (SNAP 143, P-LO 137, HYB 192 paths), the power by r (HELD near 1 at r 0.9, near 0 at r 0.7) and a credence line from a base-rate shading since withdrawn (HELD 0.30, INCONCLUSIVE 0.32, FALSIFIED 0.38); so these judged credences are not blind to the derivation.
- **Kinds:** 1 ATTRIB

## Changes after seeing results

None: no result has been seen.
