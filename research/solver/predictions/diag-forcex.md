# Prediction: diag-forcex

- **Run:** `research/solver/batch-forcex.sh` - results/diagforcex/case0-5.txt and the per-arm files (audit-forcex.mjs, six parts, one solve each), read by `reduce-forcex.mjs` into results-forcex.txt
- **Kind:** test
- **Written:** 6 Oct, before the run (its time is its registering commit's, git log); the design: the deep review after PAUSE (deep-review-log.md 6 Oct 01:52 UK), FORCE-X, under the maintainer's standing go-ahead of 4 Oct ("I go ahead with your recommendations ... until I say stop"). The judged credences were committed first as drafts/diag-forcex.md (abf0365), the derivation's output after (3e501ac); moved here unchanged but for the derived lines, the sections below and three edits (the Judged line reworded to name each outcome once - its numbers and the scratch figures unchanged - and the Prediction and Mechanism lines; the plan-auditor's MINOR 4 of 6 Oct on 9386fc7), after PAUSE-S128 read HELD (the 04:02 row), whose Decision fed registers FORCE-X as proposed. Declared (RULES.md known limit 31): the move itself restarts git's first commit of this path.
- **Seeds:** 7005 selection: EDGE-SPLIT's and HYB's paths (6,000 a household), so every forced arm is paired path for path with its unforced partner and with PCLSI; no held-out seed is touched.
- **Unmasking:** FORCE-X removes no error from the product. It overrides the chooser in one place - a year where the arm would pause just below its own read's first price point - and lets the chooser run free after. If the pause is what costs the snapped arms survival (LOSS-PAUSE), forcing past the price point recovers the gap; if a tables channel costs it (LOSS-TABLES), the force recovers little; a force that raises survival and lowers the net (LOSS-OPT) says the pause was the score's own optimum. HYB+X is forced at both its read's edges (0.25 and 0.75: audit-forcex.mjs PRICE), so it is HYB with neither pause. S-INT+X is reported only: S-INT pauses mostly just past its kink, in [0.5, 0.525) (5992 of its 6952 S130 flat years in PAUSE's files, against 946 in [0.45, 0.5)), so its force cell [0.45, 0.5) acts on about a seventh of its pause years and its re-pause read shows mostly the unforced pause - it cannot separate HOLD-PRICE (the plan-auditor's MINOR 2 of 6 Oct on 9386fc7). PCLSI+X, which has no edge, is the control.
- **Mechanism:** src/solver/fast.js:533 "if (c.forceTF > 0) {" (step 7b' : the forced draw, tested by research/tests/solver-forcex.test.mjs, 12 of 12, and mutate-fast-forcex.py, 10 of 10); audit-forcex.mjs forcePoint (the force cell [p - 0.05, p) on a would-be pause, the move run on a copy first).
- **Plan section:** PLAN.md "FORCE-X", "PAUSE-S128", "O101", "O103", "O104", "O111", "O112"

## Question

On S130, does forcing the draw past each snapped arm's first price point recover its survival gap to PCLSI (LOSS-PAUSE), leave it (LOSS-TABLES), or trade survival for net (LOSS-OPT)?

## Derivation

- **The gaps and the power** (results-derive-forcex.txt sections 1 and 2; EDGE-SPLIT's and HYB's S130 files through their own gates): PCLSI's survival gap over SNAP 143 paths (it saves 168, loses 25), over P-LO 137 (148, 11), over HYB 192 (202, 10); with the same true rescue share r on all three (the share of the paths PCLSI saves that the force saves too) and a symmetric flip on 0.01 of the other paths (assumed, NOT CHECKED), the rule reads HELD at r 0.9 on every draw, FALSIFIED at r 0.3 or less on 0.95 or more, and INCONCLUSIVE at r 0.5 and 0.7. r is not the registered R: since about 83% of paths survive, the symmetric flip costs about 20 paths net an arm, so r 0.7 gives R about 0.61 to 0.68 and r 0.3 about 0.17 to 0.21 (the plan-auditor's MINOR 1 of 6 Oct on 9386fc7); at R exactly 0.3 or 0.7 the rule reads mostly INCONCLUSIVE.
- **The force acts where the arms pause:** PAUSE's re-read (results-derive-pause-review.txt; O111) puts SNAP's and P-LO's pauses in [0.70, 0.75) and HYB's in [0.20, 0.25) on S130; PAUSE-S128 tests that out of sample before this registers. The acting share is printed first and the run refused under a half on any deciding arm.
- **The checks, each failed on a planted fault first:** reduce-forcex.mjs's 24 planted checks (every outcome of item 1 reached; EDGES), mutate-reduce-forcex.py 24 of 24; the leak plant (FORCEX_PLANT=leak) the identity must refuse, in the preflight.

## Prediction

- **Item 1 HELD (LOSS-PAUSE):** on S130 SNAP+X, P-LO+X and HYB+X each recover 0.7 or more of their survival gap to PCLSI (the LO test shown after Holm).

## Falsified if

- **Item 1 FALSIFIED (LOSS-TABLES):** all three recover 0.3 or less. INCONCLUSIVE otherwise.

## Fair-test table

| # | Variable | Arm A | Arm B | Status (SAME / TESTED / ONE ARM ONLY / N/A) and why |
|---|---|---|---|---|
| 15 | The tax-free lump sum rule | the arm's chooser | the same chooser, with one draw forced past its read's first price point at a would-be pause (fast.js step 7b') | TESTED - the thing tested |
| 28 | Every file of a comparison made by the same code, or the change between them is the thing tested | audit-edge.mjs and audit-hyb.mjs (EDGE-SPLIT's and HYB's files) | audit-forcex.mjs with fast.js step 7b' | TESTED - the force is the change; otherwise held by the identity to each path's first force, and fast.js unchanged when the force is unset (the c.forceTF > 0 guard, and PAUSE-S128 ran on this code, aefe1e31fe04, with its identity against EDGE-SPLIT's S128 files passing: results-pause128.txt) |
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
| item 1 HELD | LOSS-PAUSE: the pause costs the snapped arms their survival; a product fix aims at the chooser's refusal to cross the price point (O104, O112), designed and tested next | 0.50 |
| item 1 INCONCLUSIVE | the pause explains part; the next deep review splits the remainder on the reported reads | 0.23 |
| item 1 FALSIFIED | LOSS-TABLES: the survival loss is the tables', not the pause's; O111's mechanism stays a description of where the arms pause, not why they lose | 0.27 |

## Decision fed

- **Item 1 HELD:** O112's survival-by-timing reading supported; O104's interaction read through the pause; a chooser-side fix designed next.
- **Item 1 INCONCLUSIVE:** no fix designed on FORCE-X alone; the next deep review decides on the reported reads.
- **Item 1 FALSIFIED:** the tables channel is tested next (O101, O103); no chooser-side fix.
- **In every branch:** no product change; the force stays a research flag.

## Provenance

- **The design:** the deep review after PAUSE (deep-review-log.md 6 Oct 01:52 UK), FORCE-X; PAUSE-S128 its out-of-sample step.
- **The build:** 640d690 (fast.js step 7b', audit-forcex.mjs, reduce-forcex.mjs, derive-forcex.mjs, the tests and mutations).
- **Seen before registration (declared):** PAUSE's results and its re-read; EDGE-SPLIT's and HYB's results (the gaps); no forced run has been made.

## Derivation script

- `derive: research/solver/derive-forcex.mjs > research/solver/results-derive-forcexb.txt sha256 809f1ae6411df1a5`
  (the gaps, the power, the credences; run after the judged credences were committed, abf0365 at drafts/diag-forcex.md, and first committed as results-derive-forcex.txt in 3e501ac; the move to this path restarts git's first commit of the judged lines, which check-prediction.mjs reads without --follow (O110, RULES.md known limit 31), so the same output is committed again as results-derive-forcexb.txt after this file, as XAS-R2 did - declared, the true order abf0365 before 3e501ac)

## Point and interval

- **Item 1:** the rescue share r about 0.59 on each deciding arm (0.1 to 1.0; the CREDENCE line's point, the stories' mean r); the registered recovery R it implies under the derivation's flip model is lower, about 0.49 to 0.55 (the plan-auditor's MINOR 1 of 6 Oct on 9386fc7).

## Credence

- **Base rate, item 1:** 0.10 (it leans on the deep review's ranked cause LOSS-PAUSE: results-scorecard.txt KIND BASE RATES, a rate frozen since 5 Oct, O115); the review's own credences already carry it ("Base rate (ranked 1 of 19) shades LOSS-PAUSE", deep-review-log.md 6 Oct 01:52 UK), so the derivation does not shade them again (the deep review after XAS-R2, FLAG 2)
- **Item 1:** HELD 0.50, INCONCLUSIVE 0.23, FALSIFIED 0.27 (derived, results-derive-forcex.txt section 3: the review's stories LOSS-PAUSE 0.50 at r 0.9, LOSS-TABLES 0.25 at r 0.1, LOSS-OPT 0.10 at r 0.5, LOSS-NOISE 0.02 at r 0, the unassigned 0.13 at r 0.5, each through section 2's power)
- **Judged, item 1:** HELD 0.35, INCONCLUSIVE 0.40, FALSIFIED 0.25 (the author's judgement, written before the derivation: the deep review puts LOSS-PAUSE at 0.50 and LOSS-TABLES at 0.25, but SNAP pauses mostly after year 12, when the State Pension fills the personal allowance, so forcing past 0.75 there moves money taxed at the basic rate and may not buy the survival PCLSI has; P-LO over HYB's +55 shows the early pause matters, which supports HYB+X recovering; all three must recover, so the middle outcome carries the most weight). Declared: before writing these the author saw a scratch run of derive-forcex.mjs (not committed): the S130 gaps (SNAP 143, P-LO 137, HYB 192 paths), the power by r (HELD near 1 at r 0.9, near 0 at r 0.7) and a credence line from a base-rate shading since withdrawn (0.30, 0.32 and 0.38 for the three outcomes in the order above); so these judged credences are not blind to the derivation.
- **Kinds:** 1 ATTRIB

## Power

From results-derive-forcexb.txt section 2, at an ASSUMED flip share (grade C), in the rescue share r, not R: the rule separates full recovery from none on every draw (HELD at r 0.9 and 1, FALSIFIED at r 0.1 and 0); r 0.7 (R about 0.61 to 0.68) reads HELD 0.03, and r 0.3 (R about 0.17 to 0.21, below the threshold) FALSIFIED 0.95; at R exactly 0.7 or 0.3 the rule reads mostly INCONCLUSIVE. A force that rescues some paths and loses others (a flip share well above 0.01) widens the INCONCLUSIVE band.

## Budget line

Six parts, four at once, each one solve and two or three forward runs of 6,000 paths with the move run twice a pause year: from EDGE-SPLIT's measured solve and forward-run times (results/diagedge/case*.txt) about 5.8 core-hours, about 2.3 hours in two waves at four at once (the plan-auditor's MINOR 5 of 6 Oct on 9386fc7; the deep review's 3.5 was low); each part stopped at 6 hours.

## Pre-mortem

- **First:** the force acts rarely on SNAP (its pauses mostly after year 12, when a forced draw is taxed at the basic rate and the chooser may draw it back the next year), so SNAP+X reads PARTIAL while P-LO+X and HYB+X recover: INCONCLUSIVE for a reason that is about timing, not the pause (O112).
- **Second:** the force rescues the paths PCLSI saves but loses others (the forced tax on paths that would have survived anyway), so D and P disagree path by path and R sits in the middle with a wide spread.
- **Third:** HYB+X is forced at both edges, so after 0.25 it is forced again just below 0.75: two forced draws a path cost more tax than PCLSI's interpolated draws, so HYB+X recovers less than its gap and reads PARTIAL for a reason about the forced draws' tax, not the pause.
- **Fourth:** the identity before the first force fails because the copy run of the move is not the move the run takes (a hidden state the flow touches, as O109's cache was): the gate refuses the run.

## Changes after seeing results

None: no result has been seen. Amended before launch on the plan-auditor's PASS of 6 Oct on 9386fc7, its MINORs 1-6: the power stated in the rescue share r with R's implied values, the point R about 0.5; S-INT+X's force cell declared to miss most of its pauses, so S-INT+X reported only; HYB+X declared forced at both edges (Unmasking, pre-mortem 3); the move's edits declared; the budget from EDGE-SPLIT's measured times; fair-test row 28's evidence. No threshold, rule, arm, price point or credence changed.
